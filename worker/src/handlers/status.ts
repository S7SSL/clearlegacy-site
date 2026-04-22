/**
 * GET /api/status?ref=UUID
 *
 * The thank-you page polls this every 2s after the customer lands from Stripe.
 * Response shape:
 *   { paid: boolean, pdfStatus: 'pending'|'generating'|'ready'|'failed', downloadUrl?: string }
 */

import type { Env } from '../index';
import { getLead } from '../kv';
import { mintDownloadToken } from '../tokens';

export async function handleStatus(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const ref = url.searchParams.get('ref');
  if (!ref) {
    return json(400, { error: 'missing_ref' });
  }
  if (!/^[a-zA-Z0-9-]{8,64}$/.test(ref)) {
    return json(400, { error: 'bad_ref' });
  }

  const lead = await getLead(env, ref);
  if (!lead) {
    return json(404, { error: 'not_found' });
  }

  const body: Record<string, unknown> = {
    paid: !!lead.paidAt,
    pdfStatus: lead.pdfStatus,
  };

  if (lead.pdfStatus === 'ready') {
    const ttlSeconds = parseInt(env.PDF_RETENTION_DAYS || '90', 10) * 24 * 60 * 60;
    const token = await mintDownloadToken(env.DOWNLOAD_TOKEN_SECRET, ref, ttlSeconds);
    const origin = (env.API_ORIGIN || env.SITE_ORIGIN).replace(/\/$/, '');
    body.downloadUrl = `${origin}/api/pdf/${token}`;
    body.emailedAt = lead.emailedAt;
  } else if (lead.pdfStatus === 'failed') {
    body.error = 'pdf_generation_failed';
    // Don't leak internal error messages
  }

  return json(200, body);
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
