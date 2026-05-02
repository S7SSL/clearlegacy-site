/**
 * POST /api/lead
 *
 * Called by forms/will.html when the client completes the questionnaire.
 * Body: JSON matching QuestionnaireData (minus `ref`/`createdAt` — we set those).
 *       Optionally includes `ref` — if present AND already paid for, this is the
 *       pay-first path: we merge the questionnaire into the existing paid lead
 *       and trigger PDF generation directly (no Stripe redirect needed).
 *
 * Response (new lead, questionnaire-first):   { ref, checkoutUrl, product }
 * Response (pay-first, ref pre-existing):     { ref, status: 'generating', product }
 */

import type { Env } from '../index';
import type { Attribution, LeadRecord, Product, QuestionnaireData } from '../types';
import { getLead, putLead, updateLead } from '../kv';
import { regenerateForRef } from './webhook';

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

function isValidRef(v: unknown): v is string {
  return typeof v === 'string' && /^[a-zA-Z0-9-]{8,64}$/.test(v);
}

/**
 * Extract attribution data from POST body. The form sends it as `body.attribution`
 * after capturing UTMs / click ids / referrer / landing page from the URL on
 * first landing. We sanitise — trim, length-cap each field, drop empty strings —
 * and return undefined if nothing useful is present so we don't store empty
 * attribution objects in KV.
 */
function extractAttribution(body: any): Attribution | undefined {
  const a = body?.attribution;
  if (!a || typeof a !== 'object') return undefined;
  const clean = (v: unknown, max = 500): string | undefined => {
    if (typeof v !== 'string') return undefined;
    const trimmed = v.trim().slice(0, max);
    return trimmed ? trimmed : undefined;
  };
  const out: Attribution = {
    landingUrl: clean(a.landingUrl, 1000),
    referrer: clean(a.referrer, 500),
    utmSource: clean(a.utmSource, 100),
    utmMedium: clean(a.utmMedium, 100),
    utmCampaign: clean(a.utmCampaign, 200),
    utmContent: clean(a.utmContent, 200),
    utmTerm: clean(a.utmTerm, 200),
    gclid: clean(a.gclid, 200),
    fbclid: clean(a.fbclid, 200),
    ttclid: clean(a.ttclid, 200),
    msclkid: clean(a.msclkid, 200),
    userAgent: clean(a.userAgent, 200),
    capturedAt: clean(a.capturedAt, 40),
  };
  // Drop undefined keys for compactness in KV
  for (const k of Object.keys(out) as (keyof Attribution)[]) {
    if (out[k] === undefined) delete out[k];
  }
  // Return undefined if no customer-visible data remains (capturedAt + userAgent
  // alone are uninteresting metadata; only persist if we have a referrer, UTM,
  // click id, or landing URL).
  const meaningful = Object.keys(out).filter(
    (k) => k !== 'capturedAt' && k !== 'userAgent',
  );
  if (meaningful.length === 0) return undefined;
  return out;
}

export async function handleLead(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
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

  const attribution = extractAttribution(body);

  // Pay-first path: caller passed a ref that already exists as a paid lead.
  // In that case we merge the questionnaire into the existing record and kick
  // PDF generation, without issuing another Stripe Payment Link redirect.
  const providedRef = isValidRef(body?.ref) ? (body.ref as string) : undefined;
  if (providedRef) {
    const existing = await getLead(env, providedRef);
    if (!existing) {
      return jsonError(404, 'ref_not_found', 'The order reference was not recognised.');
    }
    if (!existing.paidAt) {
      // Should not happen in normal use — the onboarding email is only sent
      // after payment — but guard against customers sharing/reusing URLs.
      return jsonError(402, 'not_paid', 'No payment has been recorded for this order.');
    }
    if (existing.pdfStatus === 'generating' || existing.pdfStatus === 'ready') {
      // Idempotent: double-submitting the questionnaire shouldn't re-render.
      return new Response(
        JSON.stringify({ ref: providedRef, status: existing.pdfStatus, product: v.data.product }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const questionnaire: QuestionnaireData = {
      ref: providedRef,
      createdAt: new Date().toISOString(),
      ...v.data,
    };
    await updateLead(env, providedRef, {
      questionnaire,
      pdfStatus: 'pending',
      pdfError: undefined,
      // Only set attribution if we captured something AND the lead doesn't
      // already have it (preserve the original capture from the first lead
      // submission, which is the truer source of the click).
      ...(attribution && !existing.attribution ? { attribution } : {}),
    });

    // Kick PDF generation in the background and ack quickly.
    ctx.waitUntil(regenerateForRef(env, providedRef));

    return new Response(
      JSON.stringify({ ref: providedRef, status: 'generating', product: v.data.product }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Legacy / questionnaire-first path: mint a new ref and send the customer to Stripe.
  const ref = crypto.randomUUID();
  const record: LeadRecord = {
    questionnaire: {
      ref,
      createdAt: new Date().toISOString(),
      ...v.data,
    },
    pdfStatus: 'pending',
    product: v.data.product,
    ...(attribution ? { attribution } : {}),
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
