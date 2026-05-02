/**
 * Admin dashboard v2 — password-protected.
 *
 *   GET  /admin                        HTML dashboard (summary + filters + leads table)
 *   GET  /admin/lead?ref=UUID          JSON of a single lead record (raw, for inspection)
 *   GET  /admin/detail?ref=UUID        HTML detail view (full questionnaire, notes, timeline)
 *   POST /admin/note?ref=UUID          Add a private admin note to a lead (form post)
 *   GET  /admin/customer?id=...        HTML view of a registered customer
 *   GET  /admin/export.csv             CSV export of all leads (filtered by query string)
 *   POST /admin/regenerate?ref=UUID    Re-run PDF generation + email for a ref
 *   POST /admin/create-lead            Bootstrap a lead for a pre-paid customer
 *   POST /admin/resend-onboarding      Re-send the questionnaire email
 *   GET  /admin/pdf?ref=UUID           Stream the generated Will PDF from R2 (inline)
 *   POST /admin/delete?ref=UUID        Permanently delete a lead (and its R2 PDF)
 *
 * Auth: HTTP Basic. Set ADMIN_PASSWORD as a Wrangler secret. Username is ignored.
 */

import type { Env } from '../index';
import type { LeadRecord, Product, ActivityEvent, LeadNote } from '../types';
import {
  appendActivity,
  appendNote,
  customerIdForEmail,
  getCustomer,
  getLead,
  listAllLeadRefs,
  listLeadRefs,
  normaliseEmail,
  putLead,
  updateLead,
} from '../kv';
import { regenerateForRef } from './webhook';
import { sendOnboardingEmail } from '../email';

// ---------- Auth ----------

function unauthorized(): Response {
  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Clear Legacy Admin"',
      'Content-Type': 'text/plain',
    },
  });
}

function safeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function checkAuth(request: Request, env: Env): boolean {
  const expected = env.ADMIN_PASSWORD;
  if (!expected) return false;
  const header = request.headers.get('Authorization') || '';
  if (!header.startsWith('Basic ')) return false;
  let decoded: string;
  try { decoded = atob(header.slice('Basic '.length)); } catch { return false; }
  const idx = decoded.indexOf(':');
  if (idx < 0) return false;
  return safeEquals(decoded.slice(idx + 1), expected);
}

// ---------- Helpers ----------

function escapeHtml(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMoney(amountMinor?: number, currency?: string): string {
  if (!amountMinor) return '—';
  const major = (amountMinor / 100).toFixed(2);
  const cur = (currency || 'GBP').toUpperCase();
  const symbol = cur === 'GBP' ? '£' : cur === 'USD' ? '$' : cur === 'EUR' ? '€' : `${cur} `;
  return `${symbol}${major}`;
}

function fmtDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toISOString().replace('T', ' ').slice(0, 16);
}

function statusBadge(s: LeadRecord['pdfStatus']): string {
  const palette: Record<string, string> = {
    awaiting_questionnaire: '#3b82f6',
    pending: '#9ca3af',
    generating: '#f59e0b',
    ready: '#10b981',
    failed: '#ef4444',
  };
  const color = palette[s] || '#6b7280';
  const label = s === 'awaiting_questionnaire' ? 'awaiting q' : s;
  return `<span style="display:inline-block;padding:2px 8px;border-radius:999px;background:${color};color:#fff;font-size:12px;font-weight:600">${escapeHtml(label)}</span>`;
}

// ---- CRM tidy-up: tag/archive helpers --------------------------------------
//
// Additive metadata stored on LeadRecord JSON itself (no types.ts edit
// needed — deploy.command only stages admin.ts/webhook.ts/kv.ts so we keep
// the touched-file surface minimal). Access via these helpers so casts are
// localised. `tags` is a string[] of free-form labels; the conventional one
// for now is 'test' which hides the lead from the default leads view.
type LeadCrm = LeadRecord & {
  tags?: string[];
  archived?: boolean;
  archivedAt?: string;
  contactedAt?: string;
  completedAt?: string;
};
function getTags(lead: LeadRecord): string[] {
  const t = (lead as LeadCrm).tags;
  return Array.isArray(t) ? t : [];
}
function isLeadTest(lead: LeadRecord): boolean {
  return getTags(lead).includes('test');
}
function isLeadArchived(lead: LeadRecord): boolean {
  return !!(lead as LeadCrm).archived;
}

function csvEscape(v: unknown): string {
  const s = v == null ? '' : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

interface LoadedLead { ref: string; lead: LeadRecord; }

/** Load all leads in parallel-ish (sequential KV gets, bounded). */
async function loadAllLeads(env: Env): Promise<LoadedLead[]> {
  const refs = await listAllLeadRefs(env);
  const out: LoadedLead[] = [];
  for (const ref of refs) {
    const lead = await getLead(env, ref);
    if (lead) out.push({ ref, lead });
  }
  out.sort((a, b) => {
    const ta = a.lead.paidAt || a.lead.questionnaire?.createdAt || '';
    const tb = b.lead.paidAt || b.lead.questionnaire?.createdAt || '';
    return tb.localeCompare(ta);
  });
  return out;
}

function applyFilters(
  rows: LoadedLead[],
  q: string,
  status: string,
  opts?: { includeTest?: boolean; includeArchived?: boolean },
): LoadedLead[] {
  const qLower = q.trim().toLowerCase();
  const includeTest = !!opts?.includeTest;
  const includeArchived = !!opts?.includeArchived;
  return rows.filter(({ ref, lead }) => {
    // CRM hygiene filters: hide test/archived by default. The "Include test"
    // and "Include archived" filter chips set the corresponding flag.
    if (!includeTest && isLeadTest(lead)) return false;
    if (!includeArchived && isLeadArchived(lead)) return false;
    if (status && status !== 'all') {
      if (status === 'paid_only') {
        if (!lead.paidAt) return false;
      } else if (status === 'unpaid') {
        if (lead.paidAt) return false;
      } else if (lead.pdfStatus !== status) return false;
    }
    if (!qLower) return true;
    const name = lead.questionnaire?.testator?.fullName || '';
    const email = lead.stripeCustomerEmail || lead.questionnaire?.testator?.email || '';
    return (
      ref.toLowerCase().includes(qLower) ||
      name.toLowerCase().includes(qLower) ||
      email.toLowerCase().includes(qLower)
    );
  });
}

/** 7-day rolling summary. */
function summarise(rows: LoadedLead[]) {
  const sevenAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let leads7 = 0, paid7 = 0, revenue7 = 0, failed7 = 0;
  let totalLeads = 0, totalPaid = 0, totalRevenue = 0, awaitingQ = 0, ready = 0, failedTotal = 0;
  for (const { lead } of rows) {
    totalLeads++;
    if (lead.paidAt) {
      totalPaid++;
      totalRevenue += lead.stripeAmount || 0;
      if (Date.parse(lead.paidAt) >= sevenAgo) {
        paid7++;
        revenue7 += lead.stripeAmount || 0;
      }
    }
    if (lead.pdfStatus === 'awaiting_questionnaire') awaitingQ++;
    if (lead.pdfStatus === 'ready') ready++;
    if (lead.pdfStatus === 'failed') { failedTotal++; failed7++; }
    const created = lead.paidAt || lead.questionnaire?.createdAt;
    if (created && Date.parse(created) >= sevenAgo) leads7++;
  }
  return { leads7, paid7, revenue7, failed7, totalLeads, totalPaid, totalRevenue, awaitingQ, ready, failedTotal };
}

// ---------- Layout shell ----------

function shell(title: string, body: string): string {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><title>${escapeHtml(title)} — Clear Legacy</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='10' fill='%23111111'/%3E%3Ctext x='32' y='42' font-family='-apple-system,Helvetica,Arial,sans-serif' font-size='17' font-weight='700' fill='%23ffffff' text-anchor='middle'%3ECL-A%3C/text%3E%3C/svg%3E">
<style>
  *{box-sizing:border-box}
  body{font-family:-apple-system,system-ui,'Segoe UI',sans-serif;margin:0;padding:0;background:#f9fafb;color:#111827;font-size:14px}
  header{background:#111;color:#fff;padding:14px 24px;display:flex;align-items:center;justify-content:space-between}
  header h1{margin:0;font-size:16px;font-weight:600}
  header nav a{color:#fff;text-decoration:none;margin-left:18px;opacity:.85}
  header nav a:hover{opacity:1}
  main{padding:24px;max-width:1280px;margin:0 auto}
  h2{margin:0 0 12px;font-size:18px}
  h3{margin:18px 0 10px;font-size:14px;text-transform:uppercase;color:#6b7280;font-weight:600}
  .card{background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin-bottom:18px}
  .grid{display:grid;gap:14px}
  .grid-3{grid-template-columns:repeat(3,1fr)}
  .grid-4{grid-template-columns:repeat(4,1fr)}
  .grid-2{grid-template-columns:repeat(2,1fr)}
  .summary{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
  .stat{background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:14px}
  .stat .v{font-size:22px;font-weight:700}
  .stat .l{font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px}
  .stat .sub{font-size:11px;color:#9ca3af;margin-top:2px}
  table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden}
  th{text-align:left;padding:10px 12px;background:#f3f4f6;border-bottom:1px solid #e5e7eb;font-weight:600;font-size:11px;text-transform:uppercase;color:#374151}
  td{padding:10px 12px;border-bottom:1px solid #f3f4f6;vertical-align:top}
  tr:last-child td{border-bottom:none}
  tr:hover td{background:#fafbfc}
  code{font-family:ui-monospace,Menlo,monospace;font-size:12px}
  a{color:#1d4ed8;text-decoration:none}
  a:hover{text-decoration:underline}
  .filters{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:14px}
  .filters input[type=search]{padding:7px 10px;border:1px solid #d1d5db;border-radius:4px;min-width:220px;font-size:13px}
  .chip{padding:5px 11px;border:1px solid #d1d5db;border-radius:999px;background:#fff;color:#374151;font-size:12px;cursor:pointer;text-decoration:none}
  .chip.on{background:#111;color:#fff;border-color:#111}
  .btn{display:inline-block;padding:7px 14px;background:#111;color:#fff;border:0;border-radius:4px;cursor:pointer;font-size:13px;font-weight:600;text-decoration:none}
  .btn.secondary{background:#fff;color:#111;border:1px solid #d1d5db}
  .btn.danger{background:#dc2626}
  .btn.small{padding:4px 10px;font-size:12px}
  form.inline{margin:0;display:inline}
  textarea{width:100%;min-height:70px;padding:8px 10px;border:1px solid #d1d5db;border-radius:4px;font-family:inherit;font-size:13px}
  input[type=text],input[type=email],input[type=number],select{padding:7px 10px;border:1px solid #d1d5db;border-radius:4px;font-size:13px;width:100%}
  label{display:block;font-size:12px;color:#374151;font-weight:500;margin-bottom:4px}
  .timeline{list-style:none;padding:0;margin:0}
  .timeline li{padding:6px 0;border-bottom:1px dashed #e5e7eb;font-size:13px}
  .timeline li:last-child{border-bottom:none}
  .timeline .when{color:#6b7280;font-size:12px;margin-right:10px;font-family:ui-monospace,Menlo,monospace}
  .meta{color:#6b7280;font-size:12px}
  pre.json{background:#f3f4f6;border:1px solid #e5e7eb;border-radius:4px;padding:12px;overflow:auto;font-size:11px;line-height:1.5;max-height:400px}
  /* CRM tidy-up: per-row ⋯ menu (uses native <details>/<summary>) */
  details.row-menu{position:relative;display:inline-block}
  details.row-menu>summary{list-style:none;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border:1px solid #d1d5db;border-radius:999px;background:#fff;color:#374151;font-size:18px;font-weight:700;line-height:1;user-select:none}
  details.row-menu>summary::-webkit-details-marker{display:none}
  details.row-menu>summary:hover{background:#f3f4f6}
  details.row-menu[open]>summary{background:#111;color:#fff;border-color:#111}
  details.row-menu .menu{position:absolute;right:0;top:34px;z-index:10;background:#fff;border:1px solid #e5e7eb;border-radius:6px;min-width:180px;box-shadow:0 8px 24px rgba(0,0,0,.10);padding:4px;display:flex;flex-direction:column}
  details.row-menu .menu form{margin:0}
  details.row-menu .menu a,details.row-menu .menu button{display:block;width:100%;text-align:left;padding:8px 10px;border:0;background:transparent;color:#111827;font-size:13px;cursor:pointer;border-radius:4px;text-decoration:none;font-family:inherit}
  details.row-menu .menu a:hover,details.row-menu .menu button:hover{background:#f3f4f6}
  details.row-menu .menu .danger{color:#dc2626}
  details.row-menu .menu .sep{height:1px;background:#e5e7eb;margin:4px 0}
  /* CRM tidy-up: bulk-actions bar */
  .bulk-bar{display:flex;align-items:center;gap:8px;padding:10px 14px;background:#fef3c7;border:1px solid #f59e0b;border-radius:6px;margin-bottom:14px;font-size:13px}
  .bulk-bar.empty{background:#f3f4f6;border-color:#e5e7eb;color:#6b7280}
  .bulk-bar .bulk-count{font-weight:600;margin-right:6px}
  .bulk-bar button{padding:5px 11px;background:#fff;border:1px solid #d1d5db;border-radius:4px;font-size:12px;font-weight:600;cursor:pointer}
  .bulk-bar button:hover:not(:disabled){background:#f3f4f6}
  .bulk-bar button:disabled{opacity:.4;cursor:not-allowed}
  .bulk-bar button.danger{color:#dc2626;border-color:#fca5a5}
  /* Row checkbox */
  td.row-cb-cell,th.row-cb-cell{width:28px;padding-left:14px;padding-right:0}
  input.row-cb,input#cb-all{cursor:pointer;width:15px;height:15px;accent-color:#111}
  /* Test/archived row decoration */
  tr.is-archived td{opacity:.5}
  tr.is-archived td.row-cb-cell{opacity:1}
  .tag-badge{display:inline-block;padding:1px 6px;border-radius:3px;background:#fef3c7;color:#92400e;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;margin-left:6px;vertical-align:middle}
  .tag-badge.archived{background:#e5e7eb;color:#6b7280}
  /* Last contacted timestamp under name */
  .row-meta{display:block;font-size:11px;color:#9ca3af;margin-top:2px}
</style></head><body>
<header><h1>Clear Legacy — Admin</h1>
<nav>
  <a href="/admin">Leads</a>
  <a href="/admin/export.csv">Export CSV</a>
</nav></header>
<main>${body}</main>
</body></html>`;
}

// ---------- /admin (dashboard) ----------

async function handleList(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const q = url.searchParams.get('q') || '';
  const status = url.searchParams.get('status') || 'all';
  const includeTest = url.searchParams.get('test') === '1';
  const includeArchived = url.searchParams.get('archived') === '1';
  const all = await loadAllLeads(env);
  // Summary counts EXCLUDE test/archived so dashboard numbers reflect real
  // customer activity. (You don't want a "Last 7d leads" that double-counts
  // your own smoketests.)
  const realLeads = all.filter(({ lead }) => !isLeadTest(lead) && !isLeadArchived(lead));
  const summary = summarise(realLeads);
  const filtered = applyFilters(all, q, status, { includeTest, includeArchived });

  // Counts shown next to the Include test / Include archived chips.
  const hiddenTest = all.filter(({ lead }) => isLeadTest(lead)).length;
  const hiddenArchived = all.filter(({ lead }) => isLeadArchived(lead)).length;

  const summaryCards = `
<div class="summary">
  <div class="stat"><div class="l">Last 7d leads</div><div class="v">${summary.leads7}</div><div class="sub">${summary.totalLeads} total</div></div>
  <div class="stat"><div class="l">Last 7d paid</div><div class="v">${summary.paid7}</div><div class="sub">${summary.totalPaid} total</div></div>
  <div class="stat"><div class="l">Last 7d revenue</div><div class="v">${formatMoney(summary.revenue7,'GBP')}</div><div class="sub">${formatMoney(summary.totalRevenue,'GBP')} total</div></div>
  <div class="stat"><div class="l">Failed PDFs</div><div class="v" style="${summary.failedTotal>0?'color:#dc2626':''}">${summary.failedTotal}</div><div class="sub">${summary.awaitingQ} awaiting q · ${summary.ready} ready</div></div>
</div>`;

  // Helper: build a chip URL preserving the OTHER state
  const chipHref = (overrides: Record<string, string | null>) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status !== 'all') params.set('status', status);
    if (includeTest) params.set('test', '1');
    if (includeArchived) params.set('archived', '1');
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null) params.delete(k);
      else params.set(k, v);
    }
    const s = params.toString();
    return '/admin' + (s ? '?' + s : '');
  };
  const statusChip = (key: string, label: string) =>
    `<a class="chip${status === key ? ' on' : ''}" href="${chipHref({ status: key === 'all' ? null : key })}">${escapeHtml(label)}</a>`;
  const toggleChip = (param: 'test' | 'archived', label: string, on: boolean, count: number) =>
    `<a class="chip${on ? ' on' : ''}" href="${chipHref({ [param]: on ? null : '1' })}" title="${on ? 'Hide' : 'Show'} ${param} leads">${escapeHtml(label)}${count > 0 ? ` (${count})` : ''}</a>`;

  const filterBar = `
<form method="GET" action="/admin" class="filters">
  <input type="search" name="q" placeholder="Search name, email, or ref…" value="${escapeHtml(q)}" autofocus>
  <input type="hidden" name="status" value="${escapeHtml(status)}">
  ${includeTest ? '<input type="hidden" name="test" value="1">' : ''}
  ${includeArchived ? '<input type="hidden" name="archived" value="1">' : ''}
  <button class="btn small" type="submit">Search</button>
  ${q ? `<a class="chip" href="${chipHref({ q: null })}">Clear</a>` : ''}
  <span style="flex:1"></span>
  ${statusChip('all','All')}
  ${statusChip('paid_only','Paid')}
  ${statusChip('awaiting_questionnaire','Awaiting q')}
  ${statusChip('pending','Pending')}
  ${statusChip('generating','Generating')}
  ${statusChip('ready','Ready')}
  ${statusChip('failed','Failed')}
  <span style="width:1px;height:18px;background:#e5e7eb;margin:0 4px"></span>
  ${toggleChip('test','Show test', includeTest, hiddenTest)}
  ${toggleChip('archived','Show archived', includeArchived, hiddenArchived)}
</form>`;

  // The bulk-actions bar is itself a <form>. Row checkboxes use the
  // form="bulk-form" attribute to associate with it without nesting
  // (HTML5 lets a form control reference its form by id, so we keep the
  // table outside the form to avoid invalid nesting with per-row forms).
  const bulkBar = `
<form id="bulk-form" method="POST" action="/admin/bulk" onsubmit="return cl_confirmBulk(event)">
  <div class="bulk-bar empty" id="bulk-bar">
    <span class="bulk-count" id="bulk-count">0 selected</span>
    <button type="submit" name="action" value="mark_test" disabled>Mark as test</button>
    <button type="submit" name="action" value="unmark_test" disabled>Unmark test</button>
    <button type="submit" name="action" value="archive" disabled>Archive</button>
    <button type="submit" name="action" value="unarchive" disabled>Unarchive</button>
    <button type="submit" name="action" value="mark_contacted" disabled>Mark contacted</button>
    <span style="flex:1"></span>
    <span class="meta" style="font-size:11px">Tip: tick rows to enable bulk actions</span>
  </div>
</form>`;

  // Per-row ⋯ menu items. Each is its own tiny form so no JS or form-attribute
  // tricks are needed for the menu actions.
  const rowMenu = (ref: string, lead: LeadRecord) => {
    const isTest = isLeadTest(lead);
    const isArch = isLeadArchived(lead);
    const refEnc = encodeURIComponent(ref);
    const tinyForm = (action: string, label: string, danger = false) =>
      `<form method="POST" action="/admin/bulk"><input type="hidden" name="refs" value="${escapeHtml(ref)}"><button name="action" value="${action}"${danger ? ' class="danger"' : ''} type="submit">${escapeHtml(label)}</button></form>`;
    return `<details class="row-menu"><summary title="More actions">⋯</summary><div class="menu">
      <a href="/admin/detail?ref=${refEnc}">Open detail</a>
      <div class="sep"></div>
      ${tinyForm('mark_contacted', 'Mark contacted')}
      ${lead.pdfStatus === 'ready' ? tinyForm('mark_completed', 'Mark complete') : ''}
      <div class="sep"></div>
      ${isTest ? tinyForm('unmark_test', 'Unmark as test') : tinyForm('mark_test', 'Mark as test')}
      ${isArch ? tinyForm('unarchive', 'Unarchive') : tinyForm('archive', 'Archive', true)}
    </div></details>`;
  };

  const tbody = filtered.map(({ ref, lead }) => {
    const q2 = lead.questionnaire;
    const name = q2?.testator?.fullName || '—';
    const email = lead.stripeCustomerEmail || q2?.testator?.email || '—';
    const product = (lead.product || q2?.product) === 'mirror' ? 'Mirror' : 'Single';
    const amount = formatMoney(lead.stripeAmount, lead.stripeCurrency);
    // The claimed indicator moves into the NAME cell as a small leading dot
    // because the leftmost slot now belongs to the multi-select checkbox.
    const claimed = lead.customerId
      ? '<span title="Claimed by customer" style="color:#10b981;margin-right:5px">●</span>'
      : '<span title="Not claimed by customer" style="color:#d1d5db;margin-right:5px">○</span>';
    const noteCount = lead.notes?.length || 0;
    const test = isLeadTest(lead);
    const arch = isLeadArchived(lead);
    const badges = (test ? '<span class="tag-badge">test</span>' : '') + (arch ? '<span class="tag-badge archived">archived</span>' : '');
    const contactedAt = (lead as LeadCrm).contactedAt;
    const meta = noteCount || contactedAt
      ? `<span class="row-meta">${contactedAt ? `contacted ${escapeHtml(fmtDate(contactedAt))}` : ''}${contactedAt && noteCount ? ' · ' : ''}${noteCount ? `${noteCount} note${noteCount === 1 ? '' : 's'}` : ''}</span>`
      : '';
    return `<tr${arch ? ' class="is-archived"' : ''}>
  <td class="row-cb-cell"><input type="checkbox" form="bulk-form" name="refs" value="${escapeHtml(ref)}" class="row-cb"></td>
  <td><a href="/admin/detail?ref=${encodeURIComponent(ref)}"><code>${escapeHtml(ref.slice(0,8))}…</code></a></td>
  <td>${claimed}${escapeHtml(name)}${badges}${meta}</td>
  <td>${escapeHtml(email)}</td>
  <td>${escapeHtml(product)}</td>
  <td>${escapeHtml(amount)}</td>
  <td>${escapeHtml(fmtDate(lead.paidAt))}</td>
  <td>${statusBadge(lead.pdfStatus)}</td>
  <td style="text-align:right">${rowMenu(ref, lead)}</td>
</tr>`;
  }).join('') || `<tr><td colspan="9" style="color:#9ca3af;text-align:center;padding:20px">No matches.</td></tr>`;

  const bootstrap = `
<h3 style="margin-top:32px">Bootstrap a pre-paid lead</h3>
<div class="card" style="max-width:760px">
  <p class="meta">For customers who paid via a bare Payment Link. Creates a lead with status "awaiting_questionnaire" and emails them the questionnaire link.</p>
  <form method="POST" action="/admin/create-lead" class="grid grid-2" style="gap:10px">
    <div><label>Email</label><input name="email" type="email" required></div>
    <div><label>Name</label><input name="name" type="text"></div>
    <div><label>Product</label><select name="product"><option value="single">Single</option><option value="mirror">Mirror</option></select></div>
    <div><label>Amount (pence)</label><input name="amountMinor" type="number" min="0" placeholder="e.g. 9900"></div>
    <div><label>Stripe PI id (optional)</label><input name="stripePaymentIntentId" type="text" placeholder="pi_..."></div>
    <div><label>Paid at (optional, ISO)</label><input name="paidAt" type="text" placeholder="2026-04-20T14:00:00Z"></div>
    <div style="grid-column:span 2"><label><input name="skipEmail" type="checkbox" value="1"> Just create — don't email</label></div>
    <div style="grid-column:span 2"><button class="btn" type="submit">Create lead &amp; send questionnaire link</button></div>
  </form>
</div>`;

  // Tiny inline JS: keep the bulk-bar count in sync, enable/disable
  // bulk-action buttons based on selection, wire the header select-all
  // checkbox, and confirm before destructive bulk ops.
  const inlineJs = `
<script>
(function(){
  var bar = document.getElementById('bulk-bar');
  var count = document.getElementById('bulk-count');
  var btns = bar ? bar.querySelectorAll('button') : [];
  var rowCbs = document.querySelectorAll('input.row-cb');
  var allCb = document.getElementById('cb-all');
  function update(){
    var n = 0;
    rowCbs.forEach(function(c){ if(c.checked) n++; });
    if(count) count.textContent = n + ' selected';
    if(bar) bar.classList.toggle('empty', n === 0);
    btns.forEach(function(b){ b.disabled = n === 0; });
    if(allCb){
      allCb.checked = n > 0 && n === rowCbs.length;
      allCb.indeterminate = n > 0 && n < rowCbs.length;
    }
  }
  rowCbs.forEach(function(c){ c.addEventListener('change', update); });
  if(allCb){ allCb.addEventListener('change', function(){
    rowCbs.forEach(function(c){ c.checked = allCb.checked; });
    update();
  }); }
  update();
})();
window.cl_confirmBulk = function(ev){
  var btn = ev.submitter;
  if(!btn) return true;
  var act = btn.value;
  var refs = document.querySelectorAll('input.row-cb:checked');
  var n = refs.length;
  if(n === 0){ ev.preventDefault(); return false; }
  var label = btn.textContent || act;
  if(act === 'archive' || act === 'mark_test'){
    return confirm(label + ' ' + n + ' lead' + (n===1?'':'s') + '?');
  }
  return true;
};
</script>`;

  const body = `${summaryCards}${filterBar}${bulkBar}<table>
<thead><tr>
  <th class="row-cb-cell"><input type="checkbox" id="cb-all" form="bulk-form" title="Select all visible"></th>
  <th>Ref</th><th>Name</th><th>Email</th><th>Product</th><th>Paid</th><th>Paid at</th><th>Status</th><th></th>
</tr></thead>
<tbody>${tbody}</tbody></table>
<div class="meta" style="margin-top:8px">${filtered.length} of ${all.length} lead${all.length === 1 ? '' : 's'}${(!includeTest && hiddenTest > 0) || (!includeArchived && hiddenArchived > 0) ? ` (${(!includeTest ? hiddenTest : 0) + (!includeArchived ? hiddenArchived : 0)} hidden by filters)` : ''}</div>
${bootstrap}${inlineJs}`;

  return new Response(shell('Leads', body), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

// ---------- /admin/detail ----------

const REF_RE = /^[a-zA-Z0-9-]{8,64}$/;

async function handleDetailHtml(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const ref = url.searchParams.get('ref') || '';
  if (!REF_RE.test(ref)) return new Response('Bad ref', { status: 400 });
  const lead = await getLead(env, ref);
  if (!lead) return new Response('Not found', { status: 404 });

  const q = lead.questionnaire;
  const customer = lead.customerId ? await getCustomer(env, lead.customerId) : null;

  const renderActivity = (events: ActivityEvent[]): string => {
    if (!events.length) return '<p class="meta">No events yet.</p>';
    return `<ul class="timeline">${events
      .map((e) => `<li><span class="when">${escapeHtml(fmtDate(e.at))}</span><strong>${escapeHtml(e.type)}</strong>${e.detail ? ' — ' + escapeHtml(e.detail) : ''}</li>`)
      .join('')}</ul>`;
  };

  const renderNotes = (notes: LeadNote[]): string => {
    if (!notes.length) return '<p class="meta">No notes yet.</p>';
    return notes
      .map((n) => `<div style="border-left:3px solid #f59e0b;padding:6px 12px;margin-bottom:8px;background:#fffbeb"><div class="meta">${escapeHtml(fmtDate(n.createdAt))}</div><div>${escapeHtml(n.text).replace(/\n/g, '<br>')}</div></div>`)
      .join('');
  };

  // Source / attribution panel — built from the data forms/will.html captures
  // on landing (UTMs, click ids, referrer, landing URL). Older leads (created
  // before this capture rolled out) won't have it — we show a friendly note.
  const renderAttribution = (): string => {
    const a = lead.attribution;
    if (!a) {
      return '<p class="meta">No attribution captured for this lead. (Older lead, or customer arrived directly.)</p>';
    }
    // Derive a one-line summary at the top so the source is obvious at a glance
    let badge = 'Direct / unknown';
    let badgeColor = '#6b7280';
    if (a.gclid) { badge = 'Google Ads (gclid)'; badgeColor = '#1a73e8'; }
    else if (a.fbclid) { badge = 'Meta Ads (fbclid)'; badgeColor = '#1877f2'; }
    else if (a.ttclid) { badge = 'TikTok Ads (ttclid)'; badgeColor = '#000'; }
    else if (a.msclkid) { badge = 'Microsoft Ads (msclkid)'; badgeColor = '#00a4ef'; }
    else if (a.utmSource) { badge = `${a.utmSource}${a.utmMedium ? ' · ' + a.utmMedium : ''}`; badgeColor = '#7c3aed'; }
    else if (a.referrer) {
      try {
        const host = new URL(a.referrer).hostname;
        badge = `Referral: ${host}`;
        badgeColor = '#059669';
      } catch { /* invalid referrer URL — fall through */ }
    }
    const row = (label: string, value?: string): string =>
      value ? `<div><label>${escapeHtml(label)}</label>${escapeHtml(value)}</div>` : '';
    return `<div style="margin-bottom:12px">
        <span style="background:${badgeColor};color:#fff;padding:4px 10px;border-radius:4px;font-size:12px;font-weight:600">${escapeHtml(badge)}</span>
      </div>
      <div class="grid grid-2">
        ${row('utm_source', a.utmSource)}
        ${row('utm_medium', a.utmMedium)}
        ${row('utm_campaign', a.utmCampaign)}
        ${row('utm_content', a.utmContent)}
        ${row('utm_term', a.utmTerm)}
        ${row('gclid', a.gclid)}
        ${row('fbclid', a.fbclid)}
        ${row('ttclid', a.ttclid)}
        ${row('msclkid', a.msclkid)}
        ${a.referrer ? `<div><label>referrer</label><a href="${escapeHtml(a.referrer)}" target="_blank" rel="noopener noreferrer">${escapeHtml(a.referrer)}</a></div>` : ''}
        ${a.landingUrl ? `<div style="grid-column:1 / -1"><label>landing URL</label><code style="font-size:11px;word-break:break-all">${escapeHtml(a.landingUrl)}</code></div>` : ''}
        ${a.userAgent ? `<div style="grid-column:1 / -1"><label>user agent</label><span class="meta">${escapeHtml(a.userAgent)}</span></div>` : ''}
        ${a.capturedAt ? `<div><label>captured at</label><span class="meta">${escapeHtml(fmtDate(a.capturedAt))}</span></div>` : ''}
      </div>`;
  };

  const summaryFacts = `
<div class="card">
  <div class="grid grid-3">
    <div><label>Ref</label><code>${escapeHtml(ref)}</code></div>
    <div><label>Status</label>${statusBadge(lead.pdfStatus)}</div>
    <div><label>Product</label>${escapeHtml((lead.product || q?.product) === 'mirror' ? 'Mirror Wills' : 'Single Will')}</div>
    <div><label>Customer email</label>${escapeHtml(lead.stripeCustomerEmail || '—')}</div>
    <div><label>Paid at</label>${escapeHtml(fmtDate(lead.paidAt))}</div>
    <div><label>Paid amount</label>${escapeHtml(formatMoney(lead.stripeAmount, lead.stripeCurrency))}</div>
    <div><label>Stripe session</label><code>${escapeHtml(lead.stripeSessionId || '—')}</code></div>
    <div><label>PDF generated</label>${escapeHtml(fmtDate(lead.pdfGeneratedAt))}</div>
    <div><label>Emailed</label>${escapeHtml(fmtDate(lead.emailedAt))}</div>
    <div><label>Customer link</label>${customer ? `<a href="/admin/customer?id=${encodeURIComponent(customer.customerId)}">${escapeHtml(customer.email)}</a>` : '<span class="meta">not claimed</span>'}</div>
    <div><label>Onboarding email</label>${escapeHtml(fmtDate(lead.onboardingEmailSentAt))}</div>
    <div><label>PDF key</label><code style="font-size:10px">${escapeHtml(lead.pdfKey || '—')}</code></div>
  </div>
  ${lead.pdfError ? `<div class="meta" style="color:#dc2626;margin-top:10px">PDF error: ${escapeHtml(lead.pdfError)}</div>` : ''}
  ${lead.emailError ? `<div class="meta" style="color:#dc2626;margin-top:6px">Email error: ${escapeHtml(lead.emailError)}</div>` : ''}
</div>`;

  const renderQuestionnaire = (): string => {
    if (!q) return '<p class="meta">Customer has not yet submitted the questionnaire.</p>';
    const exec = (q.executors || []).map((e, i) => `<div>${i + 1}. <strong>${escapeHtml(e.name)}</strong>${e.relationship ? ' (' + escapeHtml(e.relationship) + ')' : ''}${e.address ? '<br><span class="meta">' + escapeHtml(e.address) + '</span>' : ''}</div>`).join('');
    const benes = (q.residuary || []).map((b) => `<div><strong>${escapeHtml(b.name)}</strong>${b.share ? ' — ' + escapeHtml(b.share) : ''}${b.relationship ? ' (' + escapeHtml(b.relationship) + ')' : ''}</div>`).join('');
    const gifts = (q.specificGifts || []).map((g) => `<div>${escapeHtml(g.gift || '')} → <strong>${escapeHtml(g.name)}</strong></div>`).join('') || '<span class="meta">none</span>';
    const guardians = (q.guardians || []).map((g) => `<div><strong>${escapeHtml(g.name)}</strong>${g.relationship ? ' (' + escapeHtml(g.relationship) + ')' : ''}</div>`).join('') || '<span class="meta">none</span>';
    return `<div class="grid grid-2">
  <div><label>Testator</label><strong>${escapeHtml(q.testator?.fullName)}</strong><br><span class="meta">${escapeHtml(q.testator?.address)}</span>${q.testator?.email ? '<br>' + escapeHtml(q.testator.email) : ''}${q.testator?.phone ? ' · ' + escapeHtml(q.testator.phone) : ''}${q.testator?.dob ? '<br>DOB: ' + escapeHtml(q.testator.dob) : ''}</div>
  ${q.partner ? `<div><label>Partner</label><strong>${escapeHtml(q.partner.fullName)}</strong><br><span class="meta">${escapeHtml(q.partner.address)}</span></div>` : '<div></div>'}
  <div><label>Executors</label>${exec}</div>
  <div><label>Guardians</label>${guardians}</div>
  <div><label>Residuary beneficiaries</label>${benes}</div>
  <div><label>Specific gifts</label>${gifts}</div>
  <div><label>Funeral wishes</label>${escapeHtml(q.funeralWishes || '—')}</div>
  <div><label>Notes from customer</label>${escapeHtml(q.notes || '—')}</div>
</div>`;
  };

  const actions = `
<div style="display:flex;gap:10px;flex-wrap:wrap">
  ${lead.pdfStatus === 'ready' && lead.pdfKey ? `<a class="btn" href="/admin/pdf?ref=${encodeURIComponent(ref)}" target="_blank">View PDF</a>` : ''}
  ${lead.pdfError ? `<div style="background:#fef2f2;border:1px solid #fca5a5;color:#7f1d1d;padding:12px 14px;margin:12px 0;border-radius:6px;font-family:system-ui;font-size:13px;line-height:1.5"><div style="font-weight:700;margin-bottom:6px">⚠ PDF generation error</div><code style="background:#fff;padding:6px 10px;border-radius:4px;display:block;font-family:ui-monospace,monospace;font-size:12px;color:#111;border:1px solid #fca5a5;white-space:pre-wrap;word-break:break-word">${escapeHtml(lead.pdfError)}</code></div>` : ''}
  ${(lead.pdfStatus === 'failed' || lead.pdfStatus === 'ready') ? `<form class="inline" method="POST" action="/admin/regenerate?ref=${encodeURIComponent(ref)}" onsubmit="return confirm('Regenerate PDF and re-send email?')"><button class="btn secondary" type="submit">Regenerate PDF</button></form>` : ''}
  ${lead.pdfStatus === 'awaiting_questionnaire' ? `<form class="inline" method="POST" action="/admin/resend-onboarding?ref=${encodeURIComponent(ref)}" onsubmit="return confirm('Re-send questionnaire email?')"><button class="btn secondary" type="submit">Resend questionnaire email</button></form>` : ''}
  <a class="btn secondary" href="/admin/lead?ref=${encodeURIComponent(ref)}" target="_blank">Raw JSON</a>
  <form class="inline" method="POST" action="/admin/delete?ref=${encodeURIComponent(ref)}" onsubmit="return confirm('PERMANENTLY DELETE this lead?\\n\\nThis removes:\\n  • the questionnaire and notes from KV\\n  • the generated PDF from R2 (if any)\\n\\nThis cannot be undone.')"><button class="btn danger" type="submit">Delete lead</button></form>
</div>`;

  const body = `
<a href="/admin" class="meta">← back to leads</a>
<h2 style="margin-top:8px">${escapeHtml(q?.testator?.fullName || lead.stripeCustomerEmail || ref)}</h2>
${summaryFacts}
<h3>Actions</h3>
<div class="card">${actions}</div>
<h3>Source / attribution</h3>
<div class="card">${renderAttribution()}</div>
<h3>Activity timeline</h3>
<div class="card">${renderActivity(lead.activity || [])}</div>
<h3>Private admin notes</h3>
<div class="card">
  ${renderNotes(lead.notes || [])}
  <form method="POST" action="/admin/note?ref=${encodeURIComponent(ref)}" style="margin-top:10px">
    <textarea name="text" placeholder="Add a note (visible only in admin — never to the customer)…" required></textarea>
    <div style="margin-top:8px"><button class="btn" type="submit">Add note</button></div>
  </form>
</div>
<h3>Questionnaire</h3>
<div class="card">${renderQuestionnaire()}</div>`;

  return new Response(shell('Lead detail', body), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

// ---------- /admin/lead (raw JSON) ----------

async function handleLeadDetailJson(request: Request, env: Env): Promise<Response> {
  const ref = new URL(request.url).searchParams.get('ref');
  if (!ref || !REF_RE.test(ref)) {
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

// ---------- /admin/note (POST add note) ----------

async function handleAddNote(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const ref = url.searchParams.get('ref') || '';
  if (!REF_RE.test(ref)) return new Response('Bad ref', { status: 400 });
  const form = await request.formData();
  const text = (form.get('text') || '').toString().trim();
  if (!text) return new Response('Empty note', { status: 400 });

  const note: LeadNote = { text: text.slice(0, 2000), createdAt: new Date().toISOString() };
  await appendNote(env, ref, note);
  await appendActivity(env, ref, {
    type: 'note_added',
    at: note.createdAt,
    detail: text.slice(0, 80),
  });
  return new Response(null, { status: 303, headers: { Location: `/admin/detail?ref=${encodeURIComponent(ref)}` } });
}

// ---------- /admin/customer ----------

async function handleCustomer(request: Request, env: Env): Promise<Response> {
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!/^[a-f0-9]{16}$/.test(id)) return new Response('Bad id', { status: 400 });
  const customer = await getCustomer(env, id);
  if (!customer) return new Response('Not found', { status: 404 });

  const all = await loadAllLeads(env);
  const linked = all.filter(({ lead }) => lead.customerId === id);

  const tbody = linked.map(({ ref, lead }) => `<tr>
    <td><a href="/admin/detail?ref=${encodeURIComponent(ref)}"><code>${escapeHtml(ref.slice(0,8))}…</code></a></td>
    <td>${escapeHtml((lead.product || lead.questionnaire?.product) === 'mirror' ? 'Mirror' : 'Single')}</td>
    <td>${statusBadge(lead.pdfStatus)}</td>
    <td>${escapeHtml(formatMoney(lead.stripeAmount, lead.stripeCurrency))}</td>
    <td>${escapeHtml(fmtDate(lead.paidAt))}</td>
  </tr>`).join('') || '<tr><td colspan="5" class="meta" style="text-align:center;padding:14px">No linked orders.</td></tr>';

  const body = `
<a href="/admin" class="meta">← back to leads</a>
<h2 style="margin-top:8px">${escapeHtml(customer.email)}</h2>
<div class="card">
  <div class="grid grid-3">
    <div><label>Customer ID</label><code>${escapeHtml(customer.customerId)}</code></div>
    <div><label>Name</label>${escapeHtml(customer.fullName || '—')}</div>
    <div><label>Phone</label>${escapeHtml(customer.phone || '—')}</div>
    <div><label>Email verified</label>${escapeHtml(fmtDate(customer.emailVerifiedAt))}</div>
    <div><label>Created</label>${escapeHtml(fmtDate(customer.createdAt))}</div>
    <div><label>Last login</label>${escapeHtml(fmtDate(customer.lastLoginAt))}</div>
    <div><label>Marketing opt-in</label>${customer.marketingOptIn ? 'Yes' : 'No'}</div>
  </div>
</div>
<h3>Orders</h3>
<table><thead><tr><th>Ref</th><th>Product</th><th>Status</th><th>Paid</th><th>Paid at</th></tr></thead>
<tbody>${tbody}</tbody></table>`;

  return new Response(shell('Customer', body), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

// ---------- /admin/export.csv ----------

async function handleExportCsv(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const q = url.searchParams.get('q') || '';
  const status = url.searchParams.get('status') || 'all';
  const all = await loadAllLeads(env);
  const filtered = applyFilters(all, q, status);

  const header = ['ref','customer_email','customer_name','product','pdf_status','paid_at','paid_amount_minor','paid_currency','stripe_session_id','pdf_generated_at','emailed_at','claimed_by_customer','notes_count','activity_count'];
  const lines = [header.join(',')];
  for (const { ref, lead } of filtered) {
    const q2 = lead.questionnaire;
    lines.push([
      csvEscape(ref),
      csvEscape(lead.stripeCustomerEmail || q2?.testator?.email || ''),
      csvEscape(q2?.testator?.fullName || ''),
      csvEscape(lead.product || q2?.product || ''),
      csvEscape(lead.pdfStatus),
      csvEscape(lead.paidAt || ''),
      csvEscape(lead.stripeAmount ?? ''),
      csvEscape(lead.stripeCurrency || ''),
      csvEscape(lead.stripeSessionId || ''),
      csvEscape(lead.pdfGeneratedAt || ''),
      csvEscape(lead.emailedAt || ''),
      csvEscape(lead.customerId || ''),
      csvEscape(lead.notes?.length ?? 0),
      csvEscape(lead.activity?.length ?? 0),
    ].join(','));
  }
  const csv = lines.join('\n') + '\n';
  const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="clearlegacy-leads-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}

// ---------- POST /admin/create-lead (existing — preserved) ----------

async function handleCreateLead(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
  let params: Record<string, string> = {};
  const contentType = request.headers.get('Content-Type') || '';
  try {
    if (contentType.includes('application/json')) {
      const body = await request.json() as Record<string, any>;
      for (const [k, v] of Object.entries(body)) if (v != null) params[k] = String(v);
    } else {
      const form = await request.formData();
      form.forEach((v, k) => { params[k] = String(v); });
    }
  } catch {
    return new Response('Could not parse body', { status: 400 });
  }
  const email = (params.email || '').trim();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return new Response('Valid email is required', { status: 400 });
  }
  const product: Product = params.product === 'mirror' ? 'mirror' : 'single';
  const name = (params.name || '').trim() || undefined;
  const amountMinor = parseInt(params.amountMinor || '', 10);
  const currency = (params.currency || 'gbp').toLowerCase();
  const paidAt = params.paidAt && !Number.isNaN(Date.parse(params.paidAt))
    ? new Date(params.paidAt).toISOString()
    : new Date().toISOString();
  const ref = crypto.randomUUID();
  const record: LeadRecord = {
    pdfStatus: 'awaiting_questionnaire',
    paidAt,
    stripeSessionId: params.stripeSessionId || undefined,
    stripePaymentIntentId: params.stripePaymentIntentId || undefined,
    stripeAmount: Number.isFinite(amountMinor) && amountMinor > 0 ? amountMinor : undefined,
    stripeCurrency: currency,
    stripeCustomerEmail: email,
    product,
    activity: [{ type: 'lead_created', at: new Date().toISOString(), detail: 'admin bootstrap' }],
  };
  await putLead(env, ref, record);

  const origin = (env.SITE_ORIGIN || '').replace(/\/$/, '');
  const questionnaireUrl = `${origin}/forms/will.html?ref=${encodeURIComponent(ref)}&product=${encodeURIComponent(product)}`;

  if (params.skipEmail !== '1') {
    try {
      await sendOnboardingEmail({
        apiKey: env.RESEND_API_KEY,
        from: env.EMAIL_FROM,
        to: email,
        bcc: env.ADMIN_NOTIFICATION_EMAIL || undefined,
        customerName: name,
        questionnaireUrl,
        product,
        ref,
      });
      await updateLead(env, ref, { onboardingEmailSentAt: new Date().toISOString() });
      await appendActivity(env, ref, { type: 'onboarding_email_sent', at: new Date().toISOString() });
    } catch (err: any) {
      await updateLead(env, ref, { onboardingEmailError: err?.message || String(err) });
      await appendActivity(env, ref, { type: 'onboarding_email_failed', at: new Date().toISOString(), detail: err?.message || String(err) });
      return new Response(JSON.stringify({ ref, created: true, emailSent: false, error: err?.message || String(err), questionnaireUrl }, null, 2), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  return new Response(JSON.stringify({ ref, created: true, emailSent: params.skipEmail !== '1', questionnaireUrl }, null, 2), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
}

// ---------- POST /admin/resend-onboarding ----------

async function handleResendOnboarding(request: Request, env: Env): Promise<Response> {
  const ref = new URL(request.url).searchParams.get('ref');
  if (!ref || !REF_RE.test(ref)) return new Response('Bad ref', { status: 400 });
  const lead = await getLead(env, ref);
  if (!lead) return new Response('Lead not found', { status: 404 });
  if (!lead.stripeCustomerEmail) return new Response('No customer email on record', { status: 400 });
  const product: Product = (lead.product || lead.questionnaire?.product || 'single') as Product;
  const origin = (env.SITE_ORIGIN || '').replace(/\/$/, '');
  const questionnaireUrl = `${origin}/forms/will.html?ref=${encodeURIComponent(ref)}&product=${encodeURIComponent(product)}`;
  try {
    await sendOnboardingEmail({
      apiKey: env.RESEND_API_KEY,
      from: env.EMAIL_FROM,
      to: lead.stripeCustomerEmail,
      bcc: env.ADMIN_NOTIFICATION_EMAIL || undefined,
      customerName: lead.questionnaire?.testator?.fullName,
      questionnaireUrl,
      product,
      ref,
    });
    await updateLead(env, ref, {
      onboardingEmailSentAt: new Date().toISOString(),
      onboardingEmailError: undefined,
    });
    await appendActivity(env, ref, { type: 'onboarding_email_sent', at: new Date().toISOString(), detail: 'admin resend' });
  } catch (err: any) {
    await updateLead(env, ref, { onboardingEmailError: err?.message || String(err) });
    await appendActivity(env, ref, { type: 'onboarding_email_failed', at: new Date().toISOString(), detail: err?.message || String(err) });
    return new Response(`Email failed: ${err?.message || err}`, { status: 500 });
  }
  return new Response(null, { status: 303, headers: { Location: `/admin/detail?ref=${encodeURIComponent(ref)}` } });
}

// ---------- POST /admin/regenerate ----------

async function handleRegenerate(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const ref = new URL(request.url).searchParams.get('ref');
  if (!ref || !REF_RE.test(ref)) return new Response('Bad ref', { status: 400 });
  const lead = await getLead(env, ref);
  if (!lead) return new Response('Lead not found', { status: 404 });
  await updateLead(env, ref, { pdfStatus: 'pending', pdfError: undefined });
  await appendActivity(env, ref, { type: 'regenerate_requested', at: new Date().toISOString() });
  ctx.waitUntil(regenerateForRef(env, ref));
  return new Response(null, { status: 303, headers: { Location: `/admin/detail?ref=${encodeURIComponent(ref)}` } });
}

// ---------- GET /admin/pdf (stream PDF from R2 for inline viewing) ----------

async function handleViewPdf(request: Request, env: Env): Promise<Response> {
  const ref = new URL(request.url).searchParams.get('ref');
  if (!ref || !REF_RE.test(ref)) return new Response('Bad ref', { status: 400 });
  const lead = await getLead(env, ref);
  if (!lead) return new Response('Lead not found', { status: 404 });
  if (!lead.pdfKey) return new Response('No PDF generated for this lead yet', { status: 404 });
  const obj = await env.CLEARLEGACY_PDFS.get(lead.pdfKey);
  if (!obj) return new Response('PDF object missing in R2 (key: ' + lead.pdfKey + ')', { status: 404 });
  const filename = `clearlegacy-will-${ref.slice(0, 8)}.pdf`;
  return new Response(obj.body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}

// ---------- POST /admin/delete (permanently remove lead + R2 PDF) ----------

async function handleDeleteLead(request: Request, env: Env): Promise<Response> {
  const ref = new URL(request.url).searchParams.get('ref');
  if (!ref || !REF_RE.test(ref)) return new Response('Bad ref', { status: 400 });
  const lead = await getLead(env, ref);
  if (!lead) return new Response('Lead not found', { status: 404 });
  // Best-effort R2 delete — don't block KV cleanup if R2 is flaky.
  if (lead.pdfKey) {
    try { await env.CLEARLEGACY_PDFS.delete(lead.pdfKey); } catch { /* swallow */ }
  }
  await env.CLEARLEGACY_KV.delete(`lead:${ref}`);
  return new Response(null, { status: 303, headers: { Location: '/admin' } });
}

// ---------- POST /admin/bulk (CRM tidy-up actions) ----------
//
// Accepts form-encoded POST with one or more `refs` and a single `action`.
// Used by both the bulk-actions bar (multi-row) AND the per-row ⋯ menu
// (single-row tiny form). All actions are local CRM metadata changes —
// they NEVER trigger emails, PDF regeneration, or any customer-facing
// side effects. They only mutate KV.
//
// Allowed actions:
//   mark_test       — adds 'test' to lead.tags (hidden from default list)
//   unmark_test     — removes 'test' from lead.tags
//   archive         — sets lead.archived=true (hidden from default list)
//   unarchive       — sets lead.archived=false
//   mark_contacted  — sets lead.contactedAt=now() and appends activity
//   mark_completed  — sets lead.completedAt=now() and appends activity
async function handleBulk(request: Request, env: Env): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return new Response('Could not parse body', { status: 400 });
  }
  const action = String(form.get('action') || '');
  const allowed = new Set(['mark_test', 'unmark_test', 'archive', 'unarchive', 'mark_contacted', 'mark_completed']);
  if (!allowed.has(action)) return new Response('Bad action', { status: 400 });
  // refs may be repeated form fields. getAll handles both single and multi.
  const refs = form.getAll('refs').map((v) => String(v)).filter((v) => REF_RE.test(v));
  if (refs.length === 0) return new Response('No valid refs', { status: 400 });
  const now = new Date().toISOString();

  let applied = 0;
  let skipped = 0;
  for (const ref of refs) {
    const lead = await getLead(env, ref);
    if (!lead) { skipped++; continue; }
    const crm = lead as LeadCrm;
    const tagsNow = Array.isArray(crm.tags) ? [...crm.tags] : [];
    const patch: Partial<LeadCrm> = {};
    let activityType: string | null = null;

    if (action === 'mark_test') {
      if (!tagsNow.includes('test')) { tagsNow.push('test'); patch.tags = tagsNow; activityType = 'tagged_test'; }
    } else if (action === 'unmark_test') {
      if (tagsNow.includes('test')) { patch.tags = tagsNow.filter((t) => t !== 'test'); activityType = 'untagged_test'; }
    } else if (action === 'archive') {
      if (!crm.archived) { patch.archived = true; patch.archivedAt = now; activityType = 'archived'; }
    } else if (action === 'unarchive') {
      if (crm.archived) { patch.archived = false; patch.archivedAt = undefined; activityType = 'unarchived'; }
    } else if (action === 'mark_contacted') {
      patch.contactedAt = now;
      activityType = 'contacted';
    } else if (action === 'mark_completed') {
      patch.completedAt = now;
      activityType = 'completed';
    }

    if (Object.keys(patch).length > 0) {
      await updateLead(env, ref, patch as Partial<LeadRecord>);
      applied++;
    } else {
      // No-op (e.g. mark_test on a lead that's already tagged) — still log
      // mark_contacted because each "contacted" event is meaningful even if
      // we only store the most recent timestamp.
      if (action === 'mark_contacted' || action === 'mark_completed') applied++;
    }
    if (activityType) {
      await appendActivity(env, ref, { type: activityType as any, at: now, detail: 'admin bulk' });
    }
  }

  // Redirect back to the leads list, preserving the user's filter state if
  // sent via the Referer header. (Keeps the user's "Show test" / "Show
  // archived" toggles intact after a bulk op.)
  const referer = request.headers.get('Referer') || '/admin';
  let location = '/admin';
  try {
    const url = new URL(referer);
    if (url.pathname === '/admin') location = url.pathname + url.search;
  } catch {}
  return new Response(null, { status: 303, headers: { Location: location, 'X-Bulk-Applied': String(applied), 'X-Bulk-Skipped': String(skipped) } });
}

// ---------- Router ----------

export async function handleAdmin(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (!checkAuth(request, env)) return unauthorized();
  const url = new URL(request.url);
  const path = url.pathname;
  if (path === '/admin' && request.method === 'GET') return handleList(request, env);
  if (path === '/admin/lead' && request.method === 'GET') return handleLeadDetailJson(request, env);
  if (path === '/admin/detail' && request.method === 'GET') return handleDetailHtml(request, env);
  if (path === '/admin/note' && request.method === 'POST') return handleAddNote(request, env);
  if (path === '/admin/customer' && request.method === 'GET') return handleCustomer(request, env);
  if (path === '/admin/export.csv' && request.method === 'GET') return handleExportCsv(request, env);
  if (path === '/admin/regenerate' && request.method === 'POST') return handleRegenerate(request, env, ctx);
  if (path === '/admin/create-lead' && request.method === 'POST') return handleCreateLead(request, env, ctx);
  if (path === '/admin/resend-onboarding' && request.method === 'POST') return handleResendOnboarding(request, env);
  if (path === '/admin/pdf' && request.method === 'GET') return handleViewPdf(request, env);
  if (path === '/admin/delete' && request.method === 'POST') return handleDeleteLead(request, env);
  if (path === '/admin/bulk' && request.method === 'POST') return handleBulk(request, env);
  return new Response('Not found', { status: 404 });
}
