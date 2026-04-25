/**
 * KV access layer.
 *
 * Key prefix conventions:
 *   lead:{ref}            — LeadRecord (TTL: 1 year)
 *   event:{stripe_event}  — Stripe idempotency marker (TTL: 7 days)
 *   customer:{customerId} — CustomerRecord (TTL: 2 years; refreshed on login)
 *   email:{email}         — string customerId, for email→id lookup (TTL: 2 years)
 *   session:{token}       — SessionRecord (TTL: 90 days)
 *   magic:{token}         — MagicLinkRecord (TTL: 15 minutes)
 */

import type { Env } from './index';
import type {
  LeadRecord,
  CustomerRecord,
  SessionRecord,
  MagicLinkRecord,
  ActivityEvent,
  LeadNote,
} from './types';

const SECONDS_PER_DAY = 60 * 60 * 24;
const ONE_YEAR_SECONDS = SECONDS_PER_DAY * 365;
const TWO_YEARS_SECONDS = SECONDS_PER_DAY * 365 * 2;
const SESSION_TTL_SECONDS = SECONDS_PER_DAY * 90;
const MAGIC_TTL_SECONDS = 60 * 15;

// ---------- Lead ----------

export async function putLead(env: Env, ref: string, record: LeadRecord): Promise<void> {
  await env.CLEARLEGACY_KV.put(`lead:${ref}`, JSON.stringify(record), {
    expirationTtl: ONE_YEAR_SECONDS,
  });
}

export async function getLead(env: Env, ref: string): Promise<LeadRecord | null> {
  const raw = await env.CLEARLEGACY_KV.get(`lead:${ref}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LeadRecord;
  } catch {
    return null;
  }
}

export async function updateLead(
  env: Env,
  ref: string,
  patch: Partial<LeadRecord>,
): Promise<LeadRecord | null> {
  const current = await getLead(env, ref);
  if (!current) return null;
  const next: LeadRecord = { ...current, ...patch };
  await putLead(env, ref, next);
  return next;
}

/**
 * Append an event to the activity timeline. Safe even if the lead doesn't
 * have an `activity` array yet (older records may not).
 */
export async function appendActivity(
  env: Env,
  ref: string,
  event: ActivityEvent,
): Promise<void> {
  const current = await getLead(env, ref);
  if (!current) return;
  const activity = [...(current.activity || []), event];
  await putLead(env, ref, { ...current, activity });
}

/**
 * Append a private admin note.
 */
export async function appendNote(
  env: Env,
  ref: string,
  note: LeadNote,
): Promise<void> {
  const current = await getLead(env, ref);
  if (!current) return;
  const notes = [...(current.notes || []), note];
  await putLead(env, ref, { ...current, notes });
}

/**
 * Mark a Stripe event ID as processed. Returns true if this is the first time
 * we've seen this event, false if it's a duplicate (Stripe retry).
 *
 * NOTE: KV is eventually consistent — two webhook calls arriving within ~1s
 * could both see "first time". For our use-case that's acceptable because the
 * lead-record's `pdfStatus` also gates duplicate work (we skip if already
 * ready/generating). The belt-and-braces combination is safe.
 */
export async function markEventProcessed(env: Env, eventId: string): Promise<boolean> {
  const key = `event:${eventId}`;
  const existing = await env.CLEARLEGACY_KV.get(key);
  if (existing) return false;
  await env.CLEARLEGACY_KV.put(key, '1', { expirationTtl: 7 * SECONDS_PER_DAY });
  return true;
}

/**
 * List lead keys for the admin dashboard. Returns (up to) `limit` refs ordered
 * by KV's default order (creation time, roughly). Supports cursor pagination.
 */
export async function listLeadRefs(
  env: Env,
  limit = 50,
  cursor?: string,
): Promise<{ refs: string[]; cursor: string | null }> {
  const res = await env.CLEARLEGACY_KV.list({
    prefix: 'lead:',
    limit,
    cursor: cursor || undefined,
  });
  return {
    refs: res.keys.map((k) => k.name.substring('lead:'.length)),
    cursor: res.list_complete ? null : (res.cursor || null),
  };
}

/**
 * List ALL lead refs (no pagination). For admin search/CSV export only.
 * KV scan is bounded by 1000 keys per page; we follow cursors until exhausted.
 */
export async function listAllLeadRefs(env: Env): Promise<string[]> {
  const out: string[] = [];
  let cursor: string | undefined;
  // Hard cap at 5000 to bound cost; if you ever cross that, paginate properly.
  for (let i = 0; i < 5; i++) {
    const res = await env.CLEARLEGACY_KV.list({
      prefix: 'lead:',
      limit: 1000,
      cursor,
    });
    for (const k of res.keys) out.push(k.name.substring('lead:'.length));
    if (res.list_complete) break;
    cursor = res.cursor || undefined;
    if (!cursor) break;
  }
  return out;
}

// ---------- Customer ----------

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Stable opaque customer id derived from the (normalised) email.
 * 16 hex chars (64 bits) — collision-resistant for our scale.
 */
export async function customerIdForEmail(email: string): Promise<string> {
  const norm = normaliseEmail(email);
  const data = new TextEncoder().encode(norm);
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hashBuf);
  let hex = '';
  for (let i = 0; i < 8; i++) hex += bytes[i].toString(16).padStart(2, '0');
  return hex;
}

export async function getCustomer(env: Env, customerId: string): Promise<CustomerRecord | null> {
  const raw = await env.CLEARLEGACY_KV.get(`customer:${customerId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CustomerRecord;
  } catch {
    return null;
  }
}

export async function getCustomerByEmail(env: Env, email: string): Promise<CustomerRecord | null> {
  const norm = normaliseEmail(email);
  const id = await env.CLEARLEGACY_KV.get(`email:${norm}`);
  if (!id) return null;
  return getCustomer(env, id);
}

export async function putCustomer(env: Env, record: CustomerRecord): Promise<void> {
  await env.CLEARLEGACY_KV.put(`customer:${record.customerId}`, JSON.stringify(record), {
    expirationTtl: TWO_YEARS_SECONDS,
  });
  await env.CLEARLEGACY_KV.put(`email:${normaliseEmail(record.email)}`, record.customerId, {
    expirationTtl: TWO_YEARS_SECONDS,
  });
}

export async function updateCustomer(
  env: Env,
  customerId: string,
  patch: Partial<CustomerRecord>,
): Promise<CustomerRecord | null> {
  const current = await getCustomer(env, customerId);
  if (!current) return null;
  const next: CustomerRecord = { ...current, ...patch };
  await putCustomer(env, next);
  return next;
}

// ---------- Session ----------

/** Random 32-byte token, hex-encoded (64 chars). */
export function newToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
  return hex;
}

export async function putSession(env: Env, record: SessionRecord): Promise<void> {
  await env.CLEARLEGACY_KV.put(`session:${record.token}`, JSON.stringify(record), {
    expirationTtl: SESSION_TTL_SECONDS,
  });
}

export async function getSession(env: Env, token: string): Promise<SessionRecord | null> {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const raw = await env.CLEARLEGACY_KV.get(`session:${token}`);
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as SessionRecord;
    // Defensive: even if KV TTL slipped, treat expired sessions as gone.
    if (Date.parse(s.expiresAt) < Date.now()) return null;
    return s;
  } catch {
    return null;
  }
}

export async function deleteSession(env: Env, token: string): Promise<void> {
  if (!/^[a-f0-9]{64}$/.test(token)) return;
  await env.CLEARLEGACY_KV.delete(`session:${token}`);
}

// ---------- Magic link ----------

export async function putMagicLink(env: Env, record: MagicLinkRecord): Promise<void> {
  await env.CLEARLEGACY_KV.put(`magic:${record.token}`, JSON.stringify(record), {
    expirationTtl: MAGIC_TTL_SECONDS,
  });
}

export async function getMagicLink(env: Env, token: string): Promise<MagicLinkRecord | null> {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const raw = await env.CLEARLEGACY_KV.get(`magic:${token}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MagicLinkRecord;
  } catch {
    return null;
  }
}

export async function consumeMagicLink(env: Env, token: string): Promise<void> {
  if (!/^[a-f0-9]{64}$/.test(token)) return;
  // We delete rather than mark consumed=true, because (a) the TTL will mop up
  // any leak and (b) a deleted key cannot be replayed.
  await env.CLEARLEGACY_KV.delete(`magic:${token}`);
}

// Re-export for downstream files
export const _seconds = {
  ONE_YEAR_SECONDS,
  TWO_YEARS_SECONDS,
  SESSION_TTL_SECONDS,
  MAGIC_TTL_SECONDS,
};
