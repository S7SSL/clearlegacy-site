/**
 * POST /api/stripe-webhook
 *
 * Stripe posts events here. We verify the signature, then on checkout.session.completed
 * (or payment_intent.succeeded for Payment Links without a session) we:
 *   1. pull the LeadRecord by client_reference_id
 *   2. mark it paid
 *   3. kick PDF generation in ctx.waitUntil so we return 200 to Stripe quickly
 *   4. PDF generation renders, stores in R2, emails customer + admin
 *
 * We must respond 200 within Stripe's timeout (about 30s) or Stripe will retry.
 * ctx.waitUntil lets us return immediately and keep working in the background.
 */

import type { Env } from '../index';
import { verifyStripeSignature } from '../stripe';
import { getLead, updateLead, markEventProcessed } from '../kv';
import { render } from '../template';
import { renderPdf } from '../pdf';
import { sendEmail, bytesToBase64 } from '../email';
import { mintDownloadToken } from '../tokens';
// Template is bundled at build time via wrangler's text module support.
// @ts-ignore — wrangler rule handles .html as text
import willTemplate from '../../templates/will.html';

type StripeEvent = {
  id: string;
  type: string;
  data: { object: any };
};

/**
 * Pull the reference UUID from a Stripe event. For Payment Links we expect it on
 * checkout.session.completed.client_reference_id. Fall back to payment_intent metadata.
 */
function extractRef(event: StripeEvent): { ref?: string; session?: any; pi?: any } {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    return {
      ref: session.client_reference_id || session.metadata?.ref || session.metadata?.client_reference_id,
      session,
    };
  }
  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    return { ref: pi.metadata?.ref || pi.metadata?.client_reference_id, pi };
  }
  return {};
}

function formatDate(d: Date): string {
  // e.g. "20 April 2026"
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Public entry point used by the admin "Regenerate" button. Thin wrapper so we
 * don't leak the private implementation name from this module.
 */
export async function regenerateForRef(env: Env, ref: string): Promise<void> {
  return generateAndDeliver(env, ref);
}

async function generateAndDeliver(env: Env, ref: string): Promise<void> {
  try {
    const lead = await getLead(env, ref);
    if (!lead) {
      console.error(`Webhook: no lead found for ref=${ref}`);
      return;
    }
    if (lead.pdfStatus === 'ready') {
      console.log(`Webhook: pdf already ready for ref=${ref}, skipping`);
      return;
    }
    await updateLead(env, ref, { pdfStatus: 'generating' });

    // Render HTML
    const html = render(willTemplate as string, {
      ...lead.questionnaire,
      ref,
      renderDate: formatDate(new Date()),
    });

    // PDF via Browser Rendering
    const pdfBytes = await renderPdf(env.BROWSER, html);
    const pdfKey = `wills/${ref}.pdf`;
    await env.CLEARLEGACY_PDFS.put(pdfKey, pdfBytes, {
      httpMetadata: { contentType: 'application/pdf' },
      customMetadata: { ref, generatedAt: new Date().toISOString() },
    });

    // Signed download token (valid for retention period)
    const ttlSeconds = parseInt(env.PDF_RETENTION_DAYS || '90', 10) * 24 * 60 * 60;
    const token = await mintDownloadToken(env.DOWNLOAD_TOKEN_SECRET, ref, ttlSeconds);
    const downloadUrl = `${(env.API_ORIGIN || env.SITE_ORIGIN).replace(/\/$/, '')}/api/pdf/${token}`;

    // Email customer + BCC admin
    const toEmail = lead.stripeCustomerEmail || lead.questionnaire.testator.email;
    if (toEmail) {
      const customerName = lead.questionnaire.testator.fullName;
      const product = lead.questionnaire.product === 'mirror' ? 'Mirror Wills' : 'Will';
      const subject = `Your ${product} from Clear Legacy — ready to sign`;

      const plainHtml = `
        <p>Hello ${escapeHtml(customerName)},</p>
        <p>Thank you for your order. Your ${escapeHtml(product)} is attached to this email as a PDF.</p>
        <p><strong>Next steps — please read carefully:</strong></p>
        <ol>
          <li>Print the document.</li>
          <li>Arrange for <strong>two witnesses</strong> to be with you at the same time. Witnesses must be aged 18 or over, of sound mind, and must <strong>not</strong> be named as a beneficiary in the Will (nor married to anyone who is).</li>
          <li>Sign and date the Will on the last page in their joint presence. Each witness must then sign their name and print their details in your presence and in the presence of each other.</li>
          <li>Store the signed original in a safe place and tell your executor(s) where it is.</li>
        </ol>
        <p>If you ever need to download the PDF again, you can do so here for the next ${env.PDF_RETENTION_DAYS || '90'} days:<br>
        <a href="${downloadUrl}">${downloadUrl}</a></p>
        <p>Questions? Reply to this email.</p>
        <p>— Clear Legacy<br>
        Reference: ${escapeHtml(ref)}</p>
      `;
      const plainText = `Hello ${customerName},

Thank you for your order. Your ${product} is attached as a PDF.

Please print it, arrange two witnesses to be with you together, and sign it in their joint presence. The witnesses must not be beneficiaries.

You can re-download the PDF for the next ${env.PDF_RETENTION_DAYS || '90'} days:
${downloadUrl}

Reference: ${ref}
— Clear Legacy`;

      await sendEmail(env.RESEND_API_KEY, {
        from: env.EMAIL_FROM,
        to: toEmail,
        bcc: env.ADMIN_NOTIFICATION_EMAIL || undefined,
        subject,
        html: plainHtml,
        text: plainText,
        attachments: [{
          filename: `${customerName.replace(/[^\w -]/g, '_')}-will.pdf`,
          content: bytesToBase64(pdfBytes),
          contentType: 'application/pdf',
        }],
      });
    } else {
      console.warn(`Webhook: no customer email for ref=${ref}; PDF stored but no email sent`);
    }

    await updateLead(env, ref, {
      pdfStatus: 'ready',
      pdfKey,
      pdfGeneratedAt: new Date().toISOString(),
      emailedAt: toEmail ? new Date().toISOString() : undefined,
    });
  } catch (err: any) {
    console.error(`Webhook generate failed for ref=${ref}:`, err);
    await updateLead(env, ref, {
      pdfStatus: 'failed',
      pdfError: err?.message || String(err),
    });
  }
}

function escapeHtml(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function handleStripeWebhook(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  // Raw body for signature verification
  const rawBody = await request.text();
  const sigHeader = request.headers.get('Stripe-Signature');

  let event: StripeEvent;
  try {
    event = (await verifyStripeSignature(rawBody, sigHeader, env.STRIPE_WEBHOOK_SECRET)) as StripeEvent;
  } catch (err: any) {
    console.error('Webhook verify failed:', err.message);
    return new Response(JSON.stringify({ error: 'invalid_signature' }), { status: 400 });
  }

  // Idempotency: skip if we've already processed this event ID.
  // Stripe retries events for up to ~3 days on non-2xx; this prevents
  // duplicate PDFs and duplicate emails if a retry lands.
  const isFirst = await markEventProcessed(env, event.id);
  if (!isFirst) {
    console.log(`Webhook: duplicate event ${event.id} ignored`);
    return new Response(JSON.stringify({ received: true, duplicate: true }), { status: 200 });
  }

  // Ack quickly to Stripe; do heavy lifting in the background.
  const { ref, session } = extractRef(event);

  if (!ref) {
    // Nothing for us to do (e.g. subscription events, refunds, etc.)
    return new Response(JSON.stringify({ received: true, ignored: event.type }), { status: 200 });
  }

  // Record payment info immediately so /api/status can reflect "paid" while PDF renders.
  if (event.type === 'checkout.session.completed' && session) {
    await updateLead(env, ref, {
      paidAt: new Date().toISOString(),
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent,
      stripeAmount: session.amount_total,
      stripeCurrency: session.currency,
      stripeCustomerEmail: session.customer_details?.email || session.customer_email,
    });
  }

  // Background generation
  ctx.waitUntil(generateAndDeliver(env, ref));

  return new Response(JSON.stringify({ received: true, ref }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
