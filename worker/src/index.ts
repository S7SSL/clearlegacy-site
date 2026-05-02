/**
 * Clear Legacy — questionnaire intake, Stripe webhook, Will PDF generation,
 * customer portal (magic-link login), and admin dashboard.
 *
 * Endpoints:
 *   POST /api/lead                          questionnaire intake → Stripe URL
 *   POST /api/stripe-webhook                Stripe → kicks PDF pipeline
 *   GET  /api/status?ref=...                thank-you page polling
 *   GET  /api/pdf/:token                    signed PDF download
 *   GET  /api/healthz                       liveness
 *
 *   POST /api/auth/request                  send magic-link email
 *   GET  /api/auth/verify?token=...         set cookie + redirect
 *   POST /api/auth/logout                   clear cookie + KV session
 *   GET  /api/auth/me                       current customer
 *
 *   GET  /api/account                       dashboard payload (orders + claimable)
 *   POST /api/account/profile               update name / phone / marketing
 *   POST /api/account/claim                 attach unclaimed leads matching email
 *   GET  /api/account/orders/:ref           single order detail
 *   POST /api/account/orders/:ref/pdf       fresh signed PDF URL
 *   POST /api/account/order                 start a new will purchase (Stripe)
 *
 *   /admin and /admin/*                     Basic-Auth admin dashboard
 */

import { handleLead } from './handlers/lead';
import { handleStripeWebhook, watchdogStuckGenerating } from './handlers/webhook';
import { handleStatus } from './handlers/status';
import { handlePdfDownload } from './handlers/download';
import { handleAdmin } from './handlers/admin';
import { handleAuth } from './handlers/auth';
import { handleAccount } from './handlers/account';

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
  SITE_ORIGIN: string;       // https://www.clearlegacy.co.uk
  API_ORIGIN: string;        // https://api.clearlegacy.co.uk
  STRIPE_URL_SINGLE: string;
  STRIPE_URL_MIRROR: string;
  THANK_YOU_URL: string;
  PDF_RETENTION_DAYS: string;
  EMAIL_FROM: string;
}

/**
 * CORS — only the static site is allowed cross-origin.
 *
 * Credentialed endpoints (/api/auth/*, /api/account/*) must:
 *   - echo the origin precisely (cannot use '*' with credentials)
 *   - set Access-Control-Allow-Credentials: true
 * which is what we do here when origin === SITE_ORIGIN.
 *
 * Stripe webhook is server-to-server, no CORS needed.
 * /api/pdf/:token is an idempotent GET, allow wide.
 */
function corsHeaders(env: Env, origin: string | null): Record<string, string> {
  const allowed = env.SITE_ORIGIN;
  const isAllowed = origin === allowed;
  return {
    'Access-Control-Allow-Origin': isAllowed ? allowed : '',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': isAllowed ? 'true' : '',
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
        response = await handleLead(request, env, ctx);
      } else if (url.pathname === '/api/stripe-webhook' && request.method === 'POST') {
        response = await handleStripeWebhook(request, env, ctx);
      } else if (url.pathname === '/api/status' && request.method === 'GET') {
        response = await handleStatus(request, env);
      } else if (url.pathname.startsWith('/api/pdf/') && request.method === 'GET') {
        response = await handlePdfDownload(request, env);
      } else if (url.pathname === '/api/healthz' && request.method === 'GET') {
        response = new Response('ok', { status: 200 });
      } else if (url.pathname.startsWith('/api/auth/')) {
        response = await handleAuth(request, env, ctx);
      } else if (url.pathname === '/api/account' || url.pathname.startsWith('/api/account/')) {
        response = await handleAccount(request, env, ctx);
      } else if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
        response = await handleAdmin(request, env, ctx);
      } else {
        response = new Response('Not found', { status: 404 });
      }

      // Attach CORS headers (webhook and admin don't need them but it's harmless).
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
  /**
   * Cron — runs every 2 minutes (configured in wrangler.toml [triggers]).
   * Backstops the renderPdf timeout: if any lead has been stuck in
   * pdfStatus="generating" for >5 minutes, watchdog auto-fails it so the admin
   * Regenerate button reappears and the customer support flow can recover.
   */
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(watchdogStuckGenerating(env));
  },

};
