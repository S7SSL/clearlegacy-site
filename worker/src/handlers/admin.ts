/**
 * Admin dashboard — password-protected.
 *
 *   GET  /admin                     HTML dashboard listing recent leads + their pipeline status
 *   GET  /admin/lead?ref=UUID       JSON of a single lead record (for inspection)
 *   POST /admin/regenerate?ref=UUID re-run PDF generation + email for a ref (e.g. a failed one)
 *
 * Auth: HTTP Basic. Set `ADMIN_PASSWORD` as a Wrangler secret. Username is ignored;
 * we compare only the password so typing anything as user is fine.
 *
 * This is not meant to scale — it's for Sat to spot-check a few orders a day,
 * re-fire emails when something fails, and confirm the pipeline is healthy.
 */

import type { Env } from '../index';
import type { LeadRecord } from '../types';
import { getLead, listLeadRefs, updateLead } from '../kv';
import { regenerateForRef } from './webhook';

function unauthorized(): Response {
  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Clear Legacy Admin"',
      'Content-Type': 'text/plain',
    },
  });
}

/**
 * Constant-time string comparison. Not crypto-grade on very short inputs
 * (lengths can differ) but good enough for a Basic Auth password check —
 * timing side-channel on this endpoint is not a serious risk.
 */
function safeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function checkAuth(request: Request, env: Env): boolean {
  const expected = env.ADMIN_PASSWORD;
  if (!expected) {
    // If the secret isn't set, refuse all access rather than opening a hole.
    return false;
  }
  const header = request.headers.get('Authorization') || '';
  if (!header.startsWith('Basic ')) return false;
  let decoded: string;
  try {
    decoded = atob(header.slice('Basic '.length));
  } catch {
    return false;
  }
  const idx = decoded.indexOf(':');
  if (idx < 0) return false;
  const password = decoded.slice(idx + 1);
  return safeEquals(password, expected);
}

function escapeHtml(v: string): string {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function statusBadge(lead: LeadRecord): string {
  const s = lead.pdfStatus;
  const palette: Record<string, string> = {
    pending: '#9ca3af',
    generating: '#f59e0b',
    ready: '#10b981',
    failed: '#ef4444',
  };
  const color = palette[s] || '#6b7280';
  return `<span style="display:inline-block;padding:2px 8px;border-radius:999px;background:${color};color:#fff;font-size:12px;font-weight:600">${escapeHtml(s)}</span>`;
}

function formatMoney(amountMinor?: number, currency?: string): string {
  if (!amountMinor) return '—';
  const major = (amountMinor / 100).toFixed(2);
  const cur = (currency || 'GBP').toUpperCase();
  const symbol = cur === 'GBP' ? '£' : cur === 'USD' ? '$' : cur === 'EUR' ? '€' : `${cur} `;
  return `${symbol}${major}`;
}

function renderDashboard(rows: Array<{ ref: string; lead: LeadRecord | null }>, cursor: string | null): string {
  const tbody = rows
    .map(({ ref, lead }) => {
      if (!lead) {
        return `<tr><td colspan="7" style="color:#9ca3af">ref=${escapeHtml(ref)} — record missing</td></tr>`;
      }
      const q = lead.questionnaire;
      const name = q?.testator?.fullName || '—';
      const email = lead.stripeCustomerEmail || q?.testator?.email || '—';
      const product = q?.product === 'mirror' ? 'Mirror' : 'Single';
      const amount = formatMoney(lead.stripeAmount, lead.stripeCurrency);
      const paid = lead.paidAt ? new Date(lead.paidAt).toISOString().replace('T', ' ').slice(0, 16) : '—';
      const generated = lead.pdfGeneratedAt ? new Date(lead.pdfGeneratedAt).toISOString().replace('T', ' ').slice(0, 16) : '—';
      const canRegen = lead.pdfStatus === 'failed' || lead.pdfStatus === 'ready';
      const regenBtn = canRegen
        ? `<form method="POST" action="/admin/regenerate?ref=${encodeURIComponent(ref)}" style="margin:0" onsubmit="return confirm('Regenerate PDF and re-send email for ${escapeHtml(name)}?')"><button type="submit" style="padding:4px 10px;font-size:12px;border:1px solid #d1d5db;background:#fff;border-radius:4px;cursor:pointer">Regenerate</button></form>`
        : '';
      return `
        <tr>
          <td><code style="font-size:11px">${escapeHtml(ref.slice(0, 8))}…</code></td>
          <td>${escapeHtml(name)}</td>
          <td>${escapeHtml(email)}</td>
          <td>${escapeHtml(product)}</td>
          <td>${escapeHtml(amount)}</td>
          <td>${escapeHtml(paid)}</td>
          <td>${statusBadge(lead)}<br><small style="color:#6b7280">${escapeHtml(generated)}</small></td>
          <td style="display:flex;gap:6px;align-items:center">
            <a href="/admin/lead?ref=${encodeURIComponent(ref)}" style="font-size:12px">details</a>
            ${regenBtn}
          </td>
        </tr>
      `;
    })
    .join('');

  const nextLink = cursor ? `<a href="/admin?cursor=${encodeURIComponent(cursor)}">Next page →</a>` : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Clear Legacy — Admin</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { font-family: -apple-system, system-ui, sans-serif; margin: 0; padding: 24px; background: #f9fafb; color: #111827; }
  h1 { margin: 0 0 16px; font-size: 20px; }
  table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; font-size: 14px; }
  th { text-align: left; padding: 10px 12px; background: #f3f4f6; border-bottom: 1px solid #e5e7eb; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #374151; }
  td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
  tr:last-child td { border-bottom: none; }
  .meta { color: #6b7280; font-size: 12px; margin-bottom: 16px; }
  code { font-family: ui-monospace, Menlo, monospace; }
</style>
</head>
<body>
  <h1>Clear Legacy — Admin</h1>
  <div class="meta">${rows.length} lead${rows.length === 1 ? '' : 's'} on this page · sorted by KV creation order</div>
  <table>
    <thead>
      <tr>
        <th>Ref</th>
        <th>Name</th>
        <th>Email</th>
        <th>Product</th>
        <th>Paid</th>
        <th>Paid at</th>
        <th>PDF</th>
        <th></th>
      </tr>
    </thead>
    <tbody>${tbody || '<tr><td colspan="8" style="color:#9ca3af">No leads yet.</td></tr>'}</tbody>
  </table>
  <div style="margin-top:16px">${nextLink}</div>
</body>
</html>`;
}

async function handleList(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const cursor = url.searchParams.get('cursor') || undefined;
  const { refs, cursor: nextCursor } = await listLeadRefs(env, 50, cursor);
  // Hydrate each ref to a LeadRecord. 50 sequential KV reads is fine for admin.
  const rows: Array<{ ref: string; lead: LeadRecord | null }> = [];
  for (const ref of refs) {
    rows.push({ ref, lead: await getLead(env, ref) });
  }
  // Present newest first — KV list order is implementation-defined; sort by paidAt || createdAt descending.
  rows.sort((a, b) => {
    const ta = a.lead?.paidAt || a.lead?.questionnaire?.createdAt || '';
    const tb = b.lead?.paidAt || b.lead?.questionnaire?.createdAt || '';
    return tb.localeCompare(ta);
  });
  return new Response(renderDashboard(rows, nextCursor), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

async function handleLeadDetail(request: Request, env: Env): Promise<Response> {
  const ref = new URL(request.url).searchParams.get('ref');
  if (!ref || !/^[a-zA-Z0-9-]{8,64}$/.test(ref)) {
    return new Response(JSON.stringify({ error: 'bad_ref' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const lead = await getLead(env, ref);
  if (!lead) {
    return new Response(JSON.stringify({ error: 'not_found', ref }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify({ ref, lead }, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

async function handleRegenerate(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const ref = new URL(request.url).searchParams.get('ref');
  if (!ref || !/^[a-zA-Z0-9-]{8,64}$/.test(ref)) {
    return new Response('Bad ref', { status: 400 });
  }
  const lead = await getLead(env, ref);
  if (!lead) return new Response('Lead not found', { status: 404 });

  // Reset pdfStatus so the webhook-path generator will actually run.
  await updateLead(env, ref, { pdfStatus: 'pending', pdfError: undefined });

  ctx.waitUntil(regenerateForRef(env, ref));

  // Redirect back to the dashboard.
  return new Response(null, {
    status: 303,
    headers: { Location: '/admin' },
  });
}

export async function handleAdmin(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  if (!checkAuth(request, env)) return unauthorized();

  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/admin' && request.method === 'GET') {
    return handleList(request, env);
  }
  if (path === '/admin/lead' && request.method === 'GET') {
    return handleLeadDetail(request, env);
  }
  if (path === '/admin/regenerate' && request.method === 'POST') {
    return handleRegenerate(request, env, ctx);
  }
  return new Response('Not found', { status: 404 });
}
