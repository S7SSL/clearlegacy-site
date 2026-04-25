/**
 * Magic-link authentication for the customer portal.
 *
 *   POST /api/auth/request     { email }            → 200 (always, even on bad email)
 *   GET  /api/auth/verify?token=...                 → 302 to /account/, sets HttpOnly cookie
 *   POST /api/auth/logout                            → 200, clears cookie + KV session
 *   GET  /api/auth/me                                → JSON { customer } | 401
 *
 * The cookie is `cl_session`, scoped to `.clearlegacy.co.uk`, HttpOnly + Secure
 * + SameSite=Lax. Lax means it's sent on top-level navigations and same-site
 * fetches — which covers www.clearlegacy.co.uk → api.clearlegacy.co.uk because
 * they share the same registrable domain.
 *
 * Why magic links and not passwords?
 *   - Will-writing is low-frequency. Forgotten-password support is a nightmare.
 *   - No password storage = no password breach risk on a sensitive dataset.
 *   - We already have Resend wired for transactional email.
 *
 * Rate limiting is per-email: at most one request per email per 60 seconds,
 * stored under `ratelim:auth:{email}` with a 60-second KV TTL.
 */

import type { Env } from '../index';
import type { CustomerRecord, MagicLinkRecord, SessionRecord } from '../types';
import {
  customerIdForEmail,
  deleteSession,
  getCustomer,
  getCustomerByEmail,
  getMagicLink,
  getSession,
  newToken,
  normaliseEmail,
  putCustomer,
  putMagicLink,
  putSession,
  consumeMagicLink,
  updateCustomer,
} from '../kv';
import { sendMagicLinkEmail } from '../email';

const SESSION_COOKIE = 'cl_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

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

function buildCookie(token: string, ttlSeconds: number): string {
  const maxAge = ttlSeconds;
  return [
    `${SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Domain=.clearlegacy.co.uk',
    `Max-Age=${maxAge}`,
  ].join('; ');
}

function buildClearCookie(): string {
  return [
    `${SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Domain=.clearlegacy.co.uk',
    'Max-Age=0',
  ].join('; ');
}

function extractCookie(request: Request, name: string): string | null {
  const header = request.headers.get('Cookie') || '';
  const parts = header.split(/;\s*/);
  for (const p of parts) {
    const idx = p.indexOf('=');
    if (idx < 0) continue;
    const k = p.slice(0, idx);
    if (k === name) return p.slice(idx + 1);
  }
  return null;
}

/**
 * Helper used by other handlers (account.ts) to require a logged-in customer.
 * Returns null if not authenticated.
 */
export async function requireSession(
  request: Request,
  env: Env,
): Promise<{ session: SessionRecord; customer: CustomerRecord } | null> {
  const token = extractCookie(request, SESSION_COOKIE);
  if (!token) return null;
  const session = await getSession(env, token);
  if (!session) return null;
  const customer = await getCustomer(env, session.customerId);
  if (!customer) return null;
  return { session, customer };
}

// ---------- Rate limiting ----------

async function isRateLimited(env: Env, email: string): Promise<boolean> {
  const key = `ratelim:auth:${normaliseEmail(email)}`;
  const existing = await env.CLEARLEGACY_KV.get(key);
  if (existing) return true;
  await env.CLEARLEGACY_KV.put(key, '1', { expirationTtl: 60 });
  return false;
}

// ---------- POST /api/auth/request ----------

async function handleRequestLink(request: Request, env: Env): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: 'bad_json' }, { status: 400 });
  }
  const rawEmail = (body?.email || '').toString().trim();
  // Always 200 even on bad input — don't leak whether an email is registered.
  if (!rawEmail || !EMAIL_RE.test(rawEmail)) {
    return jsonResponse({ ok: true });
  }
  const email = normaliseEmail(rawEmail);

  if (await isRateLimited(env, email)) {
    return jsonResponse({ ok: true, throttled: true });
  }

  const token = newToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);
  const record: MagicLinkRecord = {
    token,
    email,
    purpose: 'login',
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
  await putMagicLink(env, record);

  // Magic link goes to the API origin so the cookie sets reliably; the verify
  // handler then 302s to the static portal.
  const apiOrigin = (env.API_ORIGIN || '').replace(/\/$/, '');
  const link = `${apiOrigin}/api/auth/verify?token=${encodeURIComponent(token)}`;

  try {
    await sendMagicLinkEmail({
      apiKey: env.RESEND_API_KEY,
      from: env.EMAIL_FROM,
      to: email,
      link,
      expiresMinutes: 15,
    });
  } catch (err) {
    // Swallow — we already returned 200 to avoid email-enumeration. Log so the
    // admin can spot persistent send failures.
    console.error('magic-link email failed', email, err);
  }

  return jsonResponse({ ok: true });
}

// ---------- GET /api/auth/verify?token=... ----------

async function handleVerify(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || '';
  const siteOrigin = (env.SITE_ORIGIN || '').replace(/\/$/, '');
  const failUrl = `${siteOrigin}/account/?error=invalid_link`;
  const okUrl = `${siteOrigin}/account/`;

  if (!token) return Response.redirect(failUrl, 302);

  const link = await getMagicLink(env, token);
  if (!link) return Response.redirect(failUrl, 302);
  if (Date.parse(link.expiresAt) < Date.now()) {
    await consumeMagicLink(env, token);
    return Response.redirect(failUrl, 302);
  }

  // Single-use
  await consumeMagicLink(env, token);

  // Look up or create the customer record.
  const customerId = await customerIdForEmail(link.email);
  let customer = await getCustomer(env, customerId);
  const nowIso = new Date().toISOString();
  if (!customer) {
    customer = {
      customerId,
      email: link.email,
      emailVerifiedAt: nowIso,
      createdAt: nowIso,
      lastLoginAt: nowIso,
    };
    await putCustomer(env, customer);
  } else {
    await updateCustomer(env, customerId, { lastLoginAt: nowIso });
  }

  // Issue session.
  const sessionToken = newToken();
  const session: SessionRecord = {
    token: sessionToken,
    customerId,
    email: link.email,
    createdAt: nowIso,
    expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString(),
    userAgent: request.headers.get('User-Agent') || undefined,
  };
  await putSession(env, session);

  return new Response(null, {
    status: 302,
    headers: {
      Location: okUrl,
      'Set-Cookie': buildCookie(sessionToken, SESSION_TTL_SECONDS),
      'Cache-Control': 'no-store',
    },
  });
}

// ---------- POST /api/auth/logout ----------

async function handleLogout(request: Request, env: Env): Promise<Response> {
  const token = extractCookie(request, SESSION_COOKIE);
  if (token) {
    await deleteSession(env, token);
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Set-Cookie': buildClearCookie(),
    },
  });
}

// ---------- GET /api/auth/me ----------

async function handleMe(request: Request, env: Env): Promise<Response> {
  const ctx = await requireSession(request, env);
  if (!ctx) return jsonResponse({ ok: false, error: 'not_authenticated' }, { status: 401 });
  const { customer } = ctx;
  return jsonResponse({
    ok: true,
    customer: {
      email: customer.email,
      fullName: customer.fullName,
      phone: customer.phone,
      marketingOptIn: customer.marketingOptIn,
      createdAt: customer.createdAt,
      lastLoginAt: customer.lastLoginAt,
    },
  });
}

// ---------- Router ----------

export async function handleAuth(
  request: Request,
  env: Env,
  _ctx: ExecutionContext,
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  if (path === '/api/auth/request' && request.method === 'POST') return handleRequestLink(request, env);
  if (path === '/api/auth/verify' && request.method === 'GET') return handleVerify(request, env);
  if (path === '/api/auth/logout' && request.method === 'POST') return handleLogout(request, env);
  if (path === '/api/auth/me' && request.method === 'GET') return handleMe(request, env);
  return new Response('Not found', { status: 404 });
}
