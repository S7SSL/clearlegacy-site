/**
 * POST /api/lead
 *
 * Called by forms/will.html when the client completes the questionnaire.
 * Body: JSON matching QuestionnaireData (minus `ref`/`createdAt` — we set those).
 *
 * Response: { ref, checkoutUrl }
 * The form then sets window.location.href = checkoutUrl. The checkoutUrl is the
 * existing Stripe Payment Link with `?client_reference_id={ref}` appended so that the
 * webhook can correlate the paid session back to this questionnaire.
 */

import type { Env } from '../index';
import type { LeadRecord, Product, QuestionnaireData } from '../types';
import { putLead } from '../kv';

const MAX_BODY_BYTES = 32 * 1024; // 32KB — questionnaires shouldn't be bigger

function isEmail(v: unknown): v is string {
  return typeof v === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function normaliseString(v: unknown, max = 500): string {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max);
}

function normalisePerson(v: any): { fullName: string; address: string; dob?: string; email?: string; phone?: string } {
  return {
    fullName: normaliseString(v?.fullName, 200),
    address: normaliseString(v?.address, 500),
    dob: v?.dob ? normaliseString(v.dob, 20) : undefined,
    email: v?.email ? normaliseString(v.email, 200) : undefined,
    phone: v?.phone ? normaliseString(v.phone, 60) : undefined,
  };
}

function normaliseArray<T>(v: unknown, mapper: (item: any) => T, max = 20): T[] {
  if (!Array.isArray(v)) return [];
  return v.slice(0, max).map(mapper);
}

function validate(body: any): { ok: true; data: Omit<QuestionnaireData, 'ref' | 'createdAt'> } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Body must be an object' };

  const product: Product = body.product === 'mirror' ? 'mirror' : 'single';

  const testator = normalisePerson(body.testator);
  if (!isNonEmptyString(testator.fullName)) return { ok: false, error: 'testator.fullName required' };
  if (!isNonEmptyString(testator.address)) return { ok: false, error: 'testator.address required' };
  if (!testator.email || !isEmail(testator.email)) return { ok: false, error: 'testator.email required and must be valid' };

  const partner = product === 'mirror' ? normalisePerson(body.partner) : undefined;
  if (product === 'mirror' && partner) {
    if (!isNonEmptyString(partner.fullName)) return { ok: false, error: 'partner.fullName required for mirror wills' };
    if (!isNonEmptyString(partner.address)) return { ok: false, error: 'partner.address required for mirror wills' };
  }

  const executors = normaliseArray(body.executors, (e) => ({
    name: normaliseString(e?.name, 200),
    relationship: normaliseString(e?.relationship, 100),
    address: normaliseString(e?.address, 500),
  }), 6).filter((e) => isNonEmptyString(e.name));
  if (executors.length === 0) return { ok: false, error: 'At least one executor required' };

  const guardians = normaliseArray(body.guardians, (g) => ({
    name: normaliseString(g?.name, 200),
    relationship: normaliseString(g?.relationship, 100),
    address: normaliseString(g?.address, 500),
  }), 4).filter((g) => isNonEmptyString(g.name));

  const specificGifts = normaliseArray(body.specificGifts, (g) => ({
    name: normaliseString(g?.name, 200),
    relationship: normaliseString(g?.relationship, 100),
    share: normaliseString(g?.share, 200),
    gift: normaliseString(g?.gift, 500),
  }), 20).filter((g) => isNonEmptyString(g.name) && (isNonEmptyString(g.gift) || isNonEmptyString(g.share)));

  const residuary = normaliseArray(body.residuary, (b) => ({
    name: normaliseString(b?.name, 200),
    relationship: normaliseString(b?.relationship, 100),
    share: normaliseString(b?.share, 200),
  }), 10).filter((b) => isNonEmptyString(b.name));
  if (residuary.length === 0) return { ok: false, error: 'At least one residuary beneficiary required' };

  const data: Omit<QuestionnaireData, 'ref' | 'createdAt'> = {
    product,
    testator,
    partner,
    executors,
    guardians: guardians.length > 0 ? guardians : undefined,
    specificGifts: specificGifts.length > 0 ? specificGifts : undefined,
    residuary,
    funeralWishes: isNonEmptyString(body.funeralWishes) ? normaliseString(body.funeralWishes, 2000) : undefined,
    notes: isNonEmptyString(body.notes) ? normaliseString(body.notes, 4000) : undefined,
    marketingOptIn: !!body.marketingOptIn,
  };
  return { ok: true, data };
}

/**
 * Append ?client_reference_id=REF to a Stripe Payment Link.
 * Preserves any existing query string.
 */
function appendClientRef(url: string, ref: string): string {
  const u = new URL(url);
  u.searchParams.set('client_reference_id', ref);
  // Also prefill email on the Payment Link if we have one — Stripe supports ?prefilled_email
  return u.toString();
}

export async function handleLead(request: Request, env: Env): Promise<Response> {
  // Length check first
  const contentLength = parseInt(request.headers.get('Content-Length') || '0', 10);
  if (contentLength > MAX_BODY_BYTES) {
    return jsonError(413, 'payload_too_large');
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'invalid_json');
  }

  const v = validate(body);
  if (!v.ok) return jsonError(400, 'validation_failed', v.error);

  // Generate reference (client_reference_id — Stripe allows up to 200 chars, alphanumeric + underscore + hyphen)
  const ref = crypto.randomUUID();

  const record: LeadRecord = {
    questionnaire: {
      ref,
      createdAt: new Date().toISOString(),
      ...v.data,
    },
    pdfStatus: 'pending',
  };
  await putLead(env, ref, record);

  const base = v.data.product === 'mirror' ? env.STRIPE_URL_MIRROR : env.STRIPE_URL_SINGLE;
  let checkoutUrl = appendClientRef(base, ref);
  // Prefill the Stripe email if we have one (Payment Links support this)
  if (v.data.testator.email) {
    const u = new URL(checkoutUrl);
    u.searchParams.set('prefilled_email', v.data.testator.email);
    checkoutUrl = u.toString();
  }

  return new Response(
    JSON.stringify({ ref, checkoutUrl, product: v.data.product }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

function jsonError(status: number, code: string, detail?: string): Response {
  return new Response(
    JSON.stringify({ error: code, detail }),
    { status, headers: { 'Content-Type': 'application/json' } },
  );
}
