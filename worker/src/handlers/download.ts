/**
 * GET /api/pdf/:token
 *
 * The thank-you page and customer email link here with an HMAC-signed token.
 * We verify the token, load the PDF from R2, stream it back as application/pdf.
 */

import type { Env } from '../index';
import { verifyDownloadToken } from '../tokens';
import { getLead } from '../kv';

export async function handlePdfDownload(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  // Path: /api/pdf/<token>
  const parts = url.pathname.split('/').filter(Boolean); // ['api', 'pdf', '<token>']
  const token = parts[2];
  if (!token) return textErr(400, 'missing_token');

  const payload = await verifyDownloadToken(env.DOWNLOAD_TOKEN_SECRET, token);
  if (!payload) return textErr(403, 'invalid_or_expired_token');

  const lead = await getLead(env, payload.ref);
  if (!lead) return textErr(404, 'not_found');
  if (lead.pdfStatus !== 'ready' || !lead.pdfKey) return textErr(409, 'pdf_not_ready');

  const obj = await env.CLEARLEGACY_PDFS.get(lead.pdfKey);
  if (!obj) return textErr(404, 'pdf_object_missing');

  const customerName = lead.questionnaire.testator.fullName || 'will';
  const filename = `${customerName.replace(/[^\w -]/g, '_')}-will.pdf`;

  const headers = new Headers();
  headers.set('Content-Type', 'application/pdf');
  headers.set('Content-Disposition', `attachment; filename="${filename}"`);
  headers.set('Cache-Control', 'private, no-store');
  if (obj.size) headers.set('Content-Length', String(obj.size));

  return new Response(obj.body, { status: 200, headers });
}

function textErr(status: number, msg: string): Response {
  return new Response(msg, { status, headers: { 'Content-Type': 'text/plain' } });
}
