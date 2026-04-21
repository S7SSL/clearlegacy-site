/**
 * KV access layer for the lead records.
 * Key prefix conventions:
 *   lead:{ref}              — LeadRecord (TTL: 1 year)
 *   event:{stripe_event_id} — idempotency marker (TTL: 7 days, Stripe retries span ~3 days)
 */

import type { Env } from './index';
import type { LeadRecord } from './types';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

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
  await env.CLEARLEGACY_KV.put(key, '1', { expirationTtl: 7 * 24 * 60 * 60 });
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
