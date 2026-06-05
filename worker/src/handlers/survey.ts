/**
 * POST /api/post-purchase-survey
 *
 * Captures the life event(s) that prompted the customer to buy a Will today.
 * Used to inform landing pages, nurture sequences, and ads.
 *
 * Body: {
 *   ref?: string,           // order reference (?ref=... from thank-you URL)
 *   triggers?: string[],    // selected enum values (vertical multi-select)
 *   other?: string,         // free text (when "Other" ticked), max 500 chars
 *   skipped?: boolean       // user hit "Skip for now" — still POSTed for analytics
 * }
 *
 * Storage:
 *   key   = survey:<ref>   (or survey:anon:<uuid> if no ref)
 *   value = JSON { ref, triggers, other, skipped, submitted_at, user_agent, ip_hash }
 *   ttl   = 365 days
 *
 * Response: { ok: true } | { ok: false, error: "..." }
 */

import type { Env } from '../index';

const ALLOWED_TRIGGERS: ReadonlyArray<string> = [
  'Had a child',
  'Bought a property',
  'Getting married',
  'Recently divorced',
  'Parent passed away',
  'Holiday or travel concerns',
  'Inheritance tax concerns',
  'General life admin',
  'Found you via Google search',
  'Personal recommendation',
  'Other',
];

const REF_PATTERN = /^[a-z0-9-]{8,64}$/;
const OTHER_MAX_LEN = 500;
const TTL_SECONDS = 365 * 86400; // 1 year

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  const bytes = new Uint8Array(buf);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
  return hex;
}

export async function handlePostPurchaseSurvey(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'method_not_allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'invalid_json' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // --- Validate ref (optional) ---
  let ref: string | undefined;
  if (body.ref != null) {
    if (typeof body.ref !== 'string' || !REF_PATTERN.test(body.ref)) {
      return new Response(JSON.stringify({ ok: false, error: 'invalid_ref' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    ref = body.ref;
  }

  // --- Validate skipped (optional) ---
  let skipped = false;
  if (body.skipped != null) {
    if (typeof body.skipped !== 'boolean') {
      return new Response(JSON.stringify({ ok: false, error: 'invalid_skipped' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    skipped = body.skipped;
  }

  // --- Validate triggers (must be array of allowed strings; empty array OK when skipped) ---
  let triggers: string[] = [];
  if (body.triggers != null) {
    if (!Array.isArray(body.triggers)) {
      return new Response(JSON.stringify({ ok: false, error: 'invalid_triggers' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    for (const t of body.triggers) {
      if (typeof t !== 'string' || !ALLOWED_TRIGGERS.includes(t)) {
        return new Response(JSON.stringify({ ok: false, error: 'invalid_trigger_value' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    triggers = body.triggers as string[];
  }

  // --- Validate other (optional, max 500 chars) ---
  let other: string | undefined;
  if (body.other != null) {
    if (typeof body.other !== 'string' || body.other.length > OTHER_MAX_LEN) {
      return new Response(JSON.stringify({ ok: false, error: 'invalid_other' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    other = body.other;
  }

  // --- IP hash (first 8 hex chars of sha256(cf-connecting-ip)) for coarse de-dupe / abuse spotting ---
  const ip = request.headers.get('cf-connecting-ip') || '';
  const ipHash = ip ? (await sha256Hex(ip)).slice(0, 8) : '';

  const record = {
    ref: ref ?? null,
    triggers,
    other: other ?? null,
    skipped,
    submitted_at: new Date().toISOString(),
    user_agent: request.headers.get('user-agent') || '',
    ip_hash: ipHash,
  };

  const key = ref ? `survey:${ref}` : `survey:anon:${crypto.randomUUID()}`;

  try {
    await env.CLEARLEGACY_KV.put(key, JSON.stringify(record), {
      expirationTtl: TTL_SECONDS,
    });
  } catch (err) {
    console.error('survey kv put failed:', err);
    return new Response(JSON.stringify({ ok: false, error: 'storage_failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
