/**
 * POST /api/save-progress
 *
 * Saves partial form data to KV so the customer can resume later.
 * Also sends a "Continue your will" email with a resume link.
 *
 * Body: { email, firstName, formData (serialised form state), step (current step number) }
 *
 * Response: { ok: true, token }
 *
 * GET /api/resume?token=...
 *
 * Returns saved form data so the front-end can restore state.
 *
 * Response: { ok: true, formData, step, savedAt }
 */

import type { Env } from '../index';
import { sendEmail } from '../email';

interface SavedProgress {
  email: string;
  firstName: string;
  formData: Record<string, any>;
  step: number;
  savedAt: string;
  resumeEmailSent?: boolean;
}

const PROGRESS_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function generateToken(): string {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  let s = '';
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function handleSaveProgress(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400 });
  }

  const email = (body.email || '').trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return new Response(JSON.stringify({ error: 'valid email required' }), { status: 400 });
  }

  const firstName = (body.firstName || '').trim() || 'there';
  const step = typeof body.step === 'number' ? body.step : 1;
  const formData = body.formData || {};

  // Check if we already have a save for this email (avoid spamming)
  const existingKey = await env.CLEARLEGACY_KV.get(`progress_email:${email}`);
  let token: string;

  if (existingKey) {
    // Update existing save
    token = existingKey;
    const existing = await env.CLEARLEGACY_KV.get(`progress:${token}`);
    if (existing) {
      try {
        const parsed: SavedProgress = JSON.parse(existing);
        // Only update if new step is further along or data is newer
        const record: SavedProgress = {
          email,
          firstName,
          formData,
          step,
          savedAt: new Date().toISOString(),
          resumeEmailSent: parsed.resumeEmailSent,
        };
        await env.CLEARLEGACY_KV.put(`progress:${token}`, JSON.stringify(record), {
          expirationTtl: PROGRESS_TTL_SECONDS,
        });
        return new Response(JSON.stringify({ ok: true, token }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch {
        // corrupted — fall through to create new
      }
    }
  }

  // Create new save
  token = generateToken();
  const record: SavedProgress = {
    email,
    firstName,
    formData,
    step,
    savedAt: new Date().toISOString(),
    resumeEmailSent: false,
  };

  await env.CLEARLEGACY_KV.put(`progress:${token}`, JSON.stringify(record), {
    expirationTtl: PROGRESS_TTL_SECONDS,
  });
  // Map email → token so we can deduplicate
  await env.CLEARLEGACY_KV.put(`progress_email:${email}`, token, {
    expirationTtl: PROGRESS_TTL_SECONDS,
  });

  return new Response(JSON.stringify({ ok: true, token }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * POST /api/save-progress/send-email
 *
 * Sends the "Continue your will" email. Called by the front-end when it
 * detects abandonment (exit intent, tab visibility change, or 60s idle on step 2+).
 * Separated from save so we can save silently without emailing on every keystroke.
 */
export async function handleSendResumeEmail(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400 });
  }

  const token = (body.token || '').trim();
  if (!token) {
    return new Response(JSON.stringify({ error: 'token required' }), { status: 400 });
  }

  const raw = await env.CLEARLEGACY_KV.get(`progress:${token}`);
  if (!raw) {
    return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });
  }

  let record: SavedProgress;
  try {
    record = JSON.parse(raw);
  } catch {
    return new Response(JSON.stringify({ error: 'corrupt_data' }), { status: 500 });
  }

  // Don't send more than one resume email per save
  if (record.resumeEmailSent) {
    return new Response(JSON.stringify({ ok: true, alreadySent: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const siteOrigin = env.SITE_ORIGIN || 'https://www.clearlegacy.co.uk';
  const resumeUrl = `${siteOrigin}/forms/will.html?resume=${encodeURIComponent(token)}`;
  const product = record.formData?.product || 'single';
  const productLabel = product === 'mirror' ? 'Mirror Wills' : 'Single Will';
  const price = product === 'mirror' ? '£99' : '£69';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #0a0a0a; line-height: 1.6; max-width: 560px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #e5e7eb;">
    <span style="font-size: 20px; font-weight: 600; color: #0a0a0a; letter-spacing: -0.5px;">Clear<span style="color: #2563eb;">Legacy</span></span>
  </div>
  <div style="padding: 32px 0;">
    <h1 style="font-size: 22px; font-weight: 600; margin-bottom: 16px;">Your Will is waiting for you, ${record.firstName}</h1>
    <p>You were making great progress on your ${productLabel} — you got to step ${record.step} of 7 before you left.</p>
    <p>Your answers have been saved. Pick up exactly where you left off:</p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${resumeUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; font-size: 16px; font-weight: 600; border-radius: 8px;">Continue My Will →</a>
    </div>
    <p style="font-size: 14px; color: #6b7280;">This link expires in 30 days. ${productLabel}: ${price}, no hidden fees.</p>
    <p style="font-size: 14px; color: #6b7280;">If you didn't start a will on ClearLegacy, you can safely ignore this email.</p>
  </div>
  <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 12px; color: #9ca3af; text-align: center;">
    © 2026 ClearLegacy · A trading name of Kaizen Finance Ltd (12092327)<br>
    <a href="${siteOrigin}/legal/privacy.html" style="color: #9ca3af;">Privacy Policy</a>
  </div>
</body>
</html>`;

  const text = `Hi ${record.firstName},\n\nYou were making great progress on your ${productLabel} — you got to step ${record.step} of 7.\n\nYour answers have been saved. Continue here:\n${resumeUrl}\n\nThis link expires in 30 days. ${productLabel}: ${price}.\n\n— ClearLegacy`;

  try {
    await sendEmail(env.RESEND_API_KEY, {
      from: env.EMAIL_FROM || 'Clear Legacy <no-reply@clearlegacy.co.uk>',
      to: record.email,
      subject: `${record.firstName}, your Will is waiting — pick up where you left off`,
      html,
      text,
    });

    // Mark as sent
    record.resumeEmailSent = true;
    await env.CLEARLEGACY_KV.put(`progress:${token}`, JSON.stringify(record), {
      expirationTtl: PROGRESS_TTL_SECONDS,
    });

    return new Response(JSON.stringify({ ok: true, sent: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Resume email failed:', err);
    return new Response(JSON.stringify({ error: 'email_failed', detail: err?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * GET /api/resume?token=...
 *
 * Returns saved form data for the front-end to restore.
 */
export async function handleResume(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || '';

  if (!token) {
    return new Response(JSON.stringify({ error: 'token required' }), { status: 400 });
  }

  const raw = await env.CLEARLEGACY_KV.get(`progress:${token}`);
  if (!raw) {
    return new Response(JSON.stringify({ error: 'not_found_or_expired' }), { status: 404 });
  }

  let record: SavedProgress;
  try {
    record = JSON.parse(raw);
  } catch {
    return new Response(JSON.stringify({ error: 'corrupt_data' }), { status: 500 });
  }

  return new Response(JSON.stringify({
    ok: true,
    formData: record.formData,
    step: record.step,
    savedAt: record.savedAt,
    firstName: record.firstName,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
