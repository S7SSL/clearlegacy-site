/**
 * Customer-facing account API.
 *
 *   GET  /api/account                         → { customer, orders, claimable }
 *   POST /api/account/profile                 → update fullName / phone / marketingOptIn
 *   POST /api/account/claim                   → attach unclaimed leads matching email
 *   GET  /api/account/orders/:ref             → single-order detail (customer-safe)
 *   POST /api/account/orders/:ref/pdf         → returns a fresh signed PDF download URL
 *   POST /api/account/order                   → start a new will purchase (Stripe URL)
 *
 * All routes require an active session cookie (see auth.ts → requireSession).
 *
 * Privacy contract: a customer can only see leads where lead.customerId
 * equals their session's customerId, OR (for the "claimable" surface only)
 * leads where stripeCustomerEmail matches their verified email AND
 * lead.customerId is unset. The latter list is shown to them as "we found
 * these orders under your email — claim them?" and only becomes visible
 * to the dashboard once they explicitly POST /api/account/claim.
 */

import type { Env } from '../index';
import type { LeadRecord, Product, ActivityEvent } from '../types';
import {
  appendActivity,
  getLead,
  listAllLeadRefs,
  normaliseEmail,
  putLead,
  updateCustomer,
  updateLead,
} from '../kv';
import { requireSession } from './auth';
import { mintDownloadToken } from '../tokens';

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...(init.headers || {}),
    },
  });
}

/**
 * Customer-safe projection of a LeadRecord. We hide:
 *   - admin notes
 *   - stripeSessionId / stripePaymentIntentId (internal)
 *   - pdfKey (R2 key, internal)
 *   - emailError / pdfError (internal — show a friendly status instead)
 */
function projectOrder(ref: string, lead: LeadRecord) {
  const q = lead.questionnaire;
  return {
    ref,
    product: lead.product || q?.product || 'single',
    customerName: q?.testator?.fullName || null,
    customerEmail: lead.stripeCustomerEmail || q?.testator?.email || null,
    paidAt: lead.paidAt || null,
    paidAmountMinor: lead.stripeAmount ?? null,
    paidCurrency: lead.stripeCurrency || null,
    pdfStatus: lead.pdfStatus,
    pdfReady: lead.pdfStatus === 'ready',
    pdfGeneratedAt: lead.pdfGeneratedAt || null,
    questionnaireSubmittedAt: q?.createdAt || null,
    /** A small subset of the questionnaire — enough for the customer to
     * recognise the order, but we keep the full document behind the PDF. */
    summary: q
      ? {
          executors: (q.executors || []).slice(0, 3).map((e) => e.name),
          beneficiaries: (q.residuary || []).slice(0, 3).map((b) => b.name),
          hasPartner: Boolean(q.partner?.fullName),
        }
      : null,
    timeline: friendlyTimeline(lead),
  };
}

/**
 * Build a customer-friendly timeline from the lead's pipeline state and
 * activity log. We don't expose every internal event verbatim — we map them
 * to plain-English entries the customer can read.
 */
function friendlyTimeline(lead: LeadRecord): Array<{ at: string; label: string }> {
  const out: Array<{ at: string; label: string }> = [];
  if (lead.paidAt) out.push({ at: lead.paidAt, label: 'Payment received' });
  if (lead.questionnaire?.createdAt) {
    out.push({ at: lead.questionnaire.createdAt, label: 'Questionnaire submitted' });
  }
  if (lead.pdfGeneratedAt && lead.pdfStatus === 'ready') {
    out.push({ at: lead.pdfGeneratedAt, label: 'Will document ready' });
  }
  if (lead.emailedAt) {
    out.push({ at: lead.emailedAt, label: 'Will emailed to you' });
  }
  // Sort ascending by timestamp.
  out.sort((a, b) => a.at.localeCompare(b.at));
  return out;
}

// ---------- GET /api/account ----------

async function handleDashboard(request: Request, env: Env): Promise<Response> {
  const ctx = await requireSession(request, env);
  if (!ctx) return jsonResponse({ ok: false, error: 'not_authenticated' }, { status: 401 });
  const { customer } = ctx;

  // Scan all leads. For our scale (<<5000) this is fine. If we cross 5000,
  // add a customer-lead and email-lead index instead.
  const refs = await listAllLeadRefs(env);
  const owned: ReturnType<typeof projectOrder>[] = [];
  const claimable: ReturnType<typeof projectOrder>[] = [];
  const customerEmail = normaliseEmail(customer.email);

  for (const ref of refs) {
    const lead = await getLead(env, ref);
    if (!lead) continue;
    if (lead.customerId === customer.customerId) {
      owned.push(projectOrder(ref, lead));
      continue;
    }
    const leadEmail = lead.stripeCustomerEmail
      ? normaliseEmail(lead.stripeCustomerEmail)
      : null;
    if (!lead.customerId && leadEmail === customerEmail) {
      claimable.push(projectOrder(ref, lead));
    }
  }

  // Newest first by paidAt || questionnaire.createdAt
  const sortDesc = (a: any, b: any) => {
    const ta = a.paidAt || a.questionnaireSubmittedAt || '';
    const tb = b.paidAt || b.questionnaireSubmittedAt || '';
    return tb.localeCompare(ta);
  };
  owned.sort(sortDesc);
  claimable.sort(sortDesc);

  return jsonResponse({
    ok: true,
    customer: {
      email: customer.email,
      fullName: customer.fullName,
      phone: customer.phone,
      marketingOptIn: customer.marketingOptIn,
      createdAt: customer.createdAt,
    },
    orders: owned,
    claimable,
  });
}

// ---------- POST /api/account/profile ----------

async function handleUpdateProfile(request: Request, env: Env): Promise<Response> {
  const ctx = await requireSession(request, env);
  if (!ctx) return jsonResponse({ ok: false, error: 'not_authenticated' }, { status: 401 });
  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: 'bad_json' }, { status: 400 });
  }
  const patch: Partial<typeof ctx.customer> = {};
  if (typeof body.fullName === 'string') patch.fullName = body.fullName.trim().slice(0, 200);
  if (typeof body.phone === 'string') patch.phone = body.phone.trim().slice(0, 50);
  if (typeof body.marketingOptIn === 'boolean') patch.marketingOptIn = body.marketingOptIn;

  // Email changes go through a separate verification flow (not in v1).
  if ('email' in body) {
    return jsonResponse(
      { ok: false, error: 'email_change_unsupported', detail: 'Email changes are not yet supported. Contact support.' },
      { status: 400 },
    );
  }

  if (Object.keys(patch).length === 0) return jsonResponse({ ok: true, customer: ctx.customer });

  const updated = await updateCustomer(env, ctx.customer.customerId, patch);
  return jsonResponse({
    ok: true,
    customer: {
      email: updated?.email,
      fullName: updated?.fullName,
      phone: updated?.phone,
      marketingOptIn: updated?.marketingOptIn,
    },
  });
}

// ---------- POST /api/account/claim ----------

async function handleClaim(request: Request, env: Env): Promise<Response> {
  const ctx = await requireSession(request, env);
  if (!ctx) return jsonResponse({ ok: false, error: 'not_authenticated' }, { status: 401 });
  const { customer } = ctx;
  const customerEmail = normaliseEmail(customer.email);

  const refs = await listAllLeadRefs(env);
  const claimedRefs: string[] = [];
  const nowIso = new Date().toISOString();

  for (const ref of refs) {
    const lead = await getLead(env, ref);
    if (!lead) continue;
    if (lead.customerId) continue; // already claimed (by anyone)
    const leadEmail = lead.stripeCustomerEmail ? normaliseEmail(lead.stripeCustomerEmail) : null;
    if (leadEmail !== customerEmail) continue;
    const next: LeadRecord = {
      ...lead,
      customerId: customer.customerId,
      claimedAt: nowIso,
    };
    await putLead(env, ref, next);
    const event: ActivityEvent = {
      type: 'customer_claimed',
      at: nowIso,
      detail: `Claimed by customer ${customer.email}`,
    };
    await appendActivity(env, ref, event);
    claimedRefs.push(ref);
  }

  return jsonResponse({ ok: true, claimedCount: claimedRefs.length, refs: claimedRefs });
}

// ---------- GET /api/account/orders/:ref ----------

async function handleOrderDetail(request: Request, env: Env, ref: string): Promise<Response> {
  const ctx = await requireSession(request, env);
  if (!ctx) return jsonResponse({ ok: false, error: 'not_authenticated' }, { status: 401 });
  const lead = await getLead(env, ref);
  if (!lead || lead.customerId !== ctx.customer.customerId) {
    return jsonResponse({ ok: false, error: 'not_found' }, { status: 404 });
  }
  return jsonResponse({ ok: true, order: projectOrder(ref, lead) });
}

// ---------- POST /api/account/orders/:ref/pdf ----------

async function handlePdfReissue(request: Request, env: Env, ref: string): Promise<Response> {
  const ctx = await requireSession(request, env);
  if (!ctx) return jsonResponse({ ok: false, error: 'not_authenticated' }, { status: 401 });
  const lead = await getLead(env, ref);
  if (!lead || lead.customerId !== ctx.customer.customerId) {
    return jsonResponse({ ok: false, error: 'not_found' }, { status: 404 });
  }
  if (lead.pdfStatus !== 'ready' || !lead.pdfKey) {
    return jsonResponse({ ok: false, error: 'pdf_not_ready', status: lead.pdfStatus }, { status: 409 });
  }
  // 24-hour signed download token (matches existing /api/pdf/:token pattern).
  const ttlSeconds = 60 * 60 * 24;
  const token = await mintDownloadToken(env.DOWNLOAD_TOKEN_SECRET, ref, ttlSeconds);
  const apiOrigin = (env.API_ORIGIN || '').replace(/\/$/, '');
  return jsonResponse({
    ok: true,
    url: `${apiOrigin}/api/pdf/${token}`,
    expiresInSeconds: ttlSeconds,
  });
}

// ---------- POST /api/account/order ----------

async function handleNewOrder(request: Request, env: Env): Promise<Response> {
  const ctx = await requireSession(request, env);
  if (!ctx) return jsonResponse({ ok: false, error: 'not_authenticated' }, { status: 401 });
  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: 'bad_json' }, { status: 400 });
  }
  const product: Product = body?.product === 'mirror' ? 'mirror' : 'single';
  const baseUrl = product === 'mirror' ? env.STRIPE_URL_MIRROR : env.STRIPE_URL_SINGLE;
  if (!baseUrl) {
    return jsonResponse({ ok: false, error: 'stripe_url_unset' }, { status: 500 });
  }
  // Stripe Payment Links accept ?prefilled_email=
  // and ?client_reference_id= for our reconciliation.
  const url = new URL(baseUrl);
  url.searchParams.set('prefilled_email', ctx.customer.email);
  // No ref to set up-front — webhook creates a new lead at payment time.
  return jsonResponse({ ok: true, url: url.toString(), product });
}

// ---------- Router ----------

const REF_RE = /^[a-zA-Z0-9-]{8,64}$/;

export async function handleAccount(
  request: Request,
  env: Env,
  _ctx: ExecutionContext,
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/api/account' && request.method === 'GET') {
    return handleDashboard(request, env);
  }
  if (path === '/api/account/profile' && request.method === 'POST') {
    return handleUpdateProfile(request, env);
  }
  if (path === '/api/account/claim' && request.method === 'POST') {
    return handleClaim(request, env);
  }
  if (path === '/api/account/order' && request.method === 'POST') {
    return handleNewOrder(request, env);
  }

  // /api/account/orders/:ref and /api/account/orders/:ref/pdf
  const orderMatch = path.match(/^\/api\/account\/orders\/([^/]+)(?:\/(pdf))?$/);
  if (orderMatch) {
    const ref = decodeURIComponent(orderMatch[1]);
    if (!REF_RE.test(ref)) {
      return jsonResponse({ ok: false, error: 'bad_ref' }, { status: 400 });
    }
    if (orderMatch[2] === 'pdf' && request.method === 'POST') {
      return handlePdfReissue(request, env, ref);
    }
    if (!orderMatch[2] && request.method === 'GET') {
      return handleOrderDetail(request, env, ref);
    }
  }

  return new Response('Not found', { status: 404 });
}
