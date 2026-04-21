/**
 * Clear Legacy — questionnaire intake, Stripe webhook handler, Will PDF generation.
 *
 * Endpoints:
 *   POST /api/lead            — receive questionnaire data; return Stripe redirect URL
 *   POST /api/stripe-webhook  — verify Stripe signature; generate PDF; email customer
 *   GET  /api/status?ref=...  — thank-you page polls this to know when PDF is ready
 *   GET  /api/pdf/:token      — signed download of generated PDF
 *   GET  /admin               — Basic-Auth dashboard listing leads + status
 *   GET  /admin/lead?ref=...  — JSON view of a single lead record
 *   POST /admin/regenerate    — re-run PDF generation for a ref (e.g. failed ones)
 */

import { handleLead } from './handlers/lead';
import { handleStripeWebhook } from './handlers/webhook';
import { handleStatus } from './handlers/status';
import { handlePdfDownload } from './handlers/download';
import { handleAdmin } from './handlers/admin';

export interface Env {
  // Storage
  CLEARLEGACY_KV: KVNamespace;
  CLEARLEGACY_PDFS: R2Bucket;
  BROWSER: Fetcher; // Browser Rendering API binding

  // Secrets
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  RESEND_API_KEY: string;
  DOWNLOAD_TOKEN_SECRET: string;
  ADMIN_NOTIFICATION_EMAIL: string;
  ADMIN_PASSWORD: string;

  // Public vars
  SITE_ORIGIN: string;
  API_ORIGIN: string;
  STRIPE_URL_SINGLE: string;
  STRIPE_URL_MIRROR: string;
  THANK_YOU_URL: string;
  PDF_RETENTION_DAYS: string;
  EMAIL_FROM: string;
}

/**
 * CORS — only the Clear Legacy site is allowed to POST to /api/lead.
 * Stripe webhook does not need CORS (server-to-server). PDF download is idempotent GET, allow wide.
 */
function corsHeaders(env: Env, origin: string | null): Record<string, string> {
  const allowed = env.SITE_ORIGIN;
  const isAllowed = origin === allowed;
  return {
    'Access-Control-Allow-Origin': isAllowed ? allowed : '',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(env, origin) });
    }

    const baseCors = corsHeaders(env, origin);

    try {
      let response: Response;
      if (url.pathname === '/api/lead' && request.method === 'POST') {
        response = await handleLead(request, env);
      } else if (url.pathname === '/api/stripe-webhook' && request.method === 'POST') {
        response = await handleStripeWebhook(request, env, ctx);
      } else if (url.pathname === '/api/status' && request.method === 'GET') {
        response = await handleStatus(request, env);
      } else if (url.pathname.startsWith('/api/pdf/') && request.method === 'GET') {
        response = await handlePdfDownload(request, env);
      } else if (url.pathname === '/api/healthz' && request.method === 'GET') {
        response = new Response('ok', { status: 200 });
      } else if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
        response = await handleAdmin(request, env, ctx);
      } else {
        response = new Response('Not found', { status: 404 });
      }

      // Attach CORS headers (webhook does not need them but it's harmless)
      const headers = new Headers(response.headers);
      for (const [k, v] of Object.entries(baseCors)) {
        if (v) headers.set(k, v);
      }
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (err) {
      console.error('Worker top-level error:', err);
      return new Response(JSON.stringify({ error: 'internal_error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...baseCors },
      });
    }
  },
};
