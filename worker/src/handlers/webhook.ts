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
import type { LeadRecord, Product } from '../types';
import { verifyStripeSignature } from '../stripe';
import { getLead, putLead, updateLead, markEventProcessed, appendActivity } from '../kv';
import { render } from '../template';
import { renderPdf } from '../pdf';
import { sendEmail, sendOnboardingEmail, sendCancellationRecoveryEmail, bytesToBase64 } from '../email';
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
 * Filter to identify Clear Legacy checkout sessions vs other businesses sharing
 * the same Stripe account (e.g., itsadecline.com). Each Payment Link has a
 * domain-specific success_url configured at Payment Link creation time; we
 * treat the session as Clear Legacy only if that URL lives on clearlegacy.co.uk.
 *
 * Without this filter, `checkout.session.completed` events from sibling
 * businesses on the same Stripe account would hit our bootstrap path and email
 * the wrong customer a Clear Legacy questionnaire link.
 */
function isClearLegacySession(session: any): boolean {
  const url = session?.success_url || '';
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.hostname === 'clearlegacy.co.uk' || u.hostname.endsWith('.clearlegacy.co.uk');
  } catch {
    return false;
  }
}

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

/**
 * Best-effort guess of which product was purchased, based on the Stripe
 * checkout session. We prefer the Payment Link URL comparison (STRIPE_URL_SINGLE
 * vs STRIPE_URL_MIRROR both set as env vars), falling back to amount heuristics.
 * This is only used to pick the right copy in the onboarding email and to
 * pre-select the product on the questionnaire form.
 */
function inferProductFromSession(session: any, env: Env): Product {
  // We compare amounts as a simple heuristic, since Payment Link id alone
  // doesn't tell us which product without a Stripe API call.
  // Pricing (April 2026): single = £69 (6900), mirror = £99 (9900).
  // A threshold of £80 (8000) cleanly separates the two and is robust to
  // small future price tweaks in either direction.
  // If product pricing changes materially, update this threshold (and the
  // questionnaire pre-select on the form).
  const amount = Number(session?.amount_total || 0);
  if (amount >= 8000) return 'mirror';
  return 'single';
}

/**
 * For a "mirror" order, derive the partner's questionnaire by swapping
 * testator <-> partner roles. Mirror convention: each spouse's will is
 * structurally identical, with the other spouse named wherever they
 * themselves appear. Names matching the original testator become the
 * partner's name and vice versa across executors, residuary, specific gifts
 * and guardians. Guardians are typically non-spouse so the swap is a no-op
 * for them; the helper still maps over them defensively.
 *
 * The questionnaire only collects the testator's email/phone, so the derived
 * testator (the partner) won't have those — that's fine; the will template
 * doesn't render contact details inside the document body.
 */
function swapForPartner(q: any): any {
  const t = q.testator || {};
  const p = q.partner || {};
  if (!p.fullName) return q; // nothing to swap — return original

  // Compare names case-insensitively and ignoring surrounding whitespace, so
  // capitalisation differences in customer-typed data (e.g. partner "lesley
  // houlton" vs executor "Lesley Houlton") don't break the swap. We return the
  // OTHER party's fullName verbatim — preserving its original capitalisation —
  // so the document reads naturally regardless of how the input was entered.
  const norm = (s: string | undefined): string => (s || '').trim().toLowerCase();
  const swapName = (name: string | undefined): string | undefined => {
    if (!name) return name;
    const n = norm(name);
    if (n && n === norm(t.fullName)) return p.fullName;
    if (n && n === norm(p.fullName)) return t.fullName;
    return name;
  };
  const swapPeople = (people: any[] | undefined) =>
    (people || []).map((person) => ({ ...person, name: swapName(person.name) }));

  return {
    ...q,
    testator: {
      fullName: p.fullName,
      address: p.address || t.address,
      dob: p.dob,
    },
    partner: { ...t },
    executors: (q.partnerExecutors && q.partnerExecutors.length > 0)
      ? q.partnerExecutors
      : swapPeople(q.executors),
    residuary: swapPeople(q.residuary),
    specificGifts: swapPeople(q.specificGifts),
    guardians: swapPeople(q.guardians),
    // Free-text fields the customer wrote about their own situation — these
    // reference the partner by name and (usually) by pronoun, so they must be
    // rewritten for the mirrored will or the second will reads as if the first
    // testator wrote it. See swapFreeText() for the swap rules and limits.
    funeralWishes: swapFreeText(q.funeralWishes, t, p),
    notes: swapFreeText(q.notes, t, p),
  };
}

/**
 * Swap names and gendered pronouns in customer-written free text so the
 * partner's will reads naturally instead of being a verbatim copy of the
 * testator's wording.
 *
 * Name swap: full names AND first names are swapped both ways using sentinel
 * tokens so we don't cascade-replace (T→P then P→T would undo the first pass).
 * Matching is case-insensitive; the replacement uses the OTHER party's name
 * verbatim so capitalisation in the output matches what the customer typed.
 *
 * Pronoun swap: he↔she, his↔her, himself↔herself, and the common contractions.
 * We deliberately don't swap him/her — "her" is ambiguous between object pronoun
 * (saw her) and possessive (her estate), and in will free text the possessive
 * sense dominates ("her share", "her wishes"), which is already covered by the
 * his↔her swap. Swapping object "him→her" too would mean "her" maps to both
 * "him" and "his", which can't be reconciled without parsing. We accept that
 * object-pronoun "him"/"her" may read slightly off in the mirrored copy — the
 * names are right, which is what matters legally.
 *
 * Pronoun choice without a gender field on the form is necessarily heuristic.
 * For an opposite-sex couple — the overwhelming majority of mirror-will buyers
 * — a symmetric he↔she swap is correct: the testator referred to their partner
 * with the opposite-gender pronoun, and the mirrored testator does likewise.
 * For same-sex couples the pronouns in the original already match both spouses,
 * so the swap is a no-op for the only pronouns that appear (the testator's
 * self-references use "I/my" and are left alone). Either way the output is
 * never worse than the verbatim copy this function replaces.
 */
function swapFreeText(text: any, testator: any, partner: any): any {
  if (!text || typeof text !== 'string') return text;
  if (!testator?.fullName || !partner?.fullName) return text;

  const T_TOKEN = ' __SWAP_T__ ';
  const P_TOKEN = ' __SWAP_P__ ';

  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  let out: string = text;

  // 1) Swap full names (case-insensitive, whole-string match).
  const tFull = String(testator.fullName).trim();
  const pFull = String(partner.fullName).trim();
  if (tFull && pFull && tFull.toLowerCase() !== pFull.toLowerCase()) {
    const tFullRe = new RegExp(escapeRegex(tFull), 'gi');
    const pFullRe = new RegExp(escapeRegex(pFull), 'gi');
    out = out.replace(tFullRe, T_TOKEN).replace(pFullRe, P_TOKEN);
  }

  // 2) Swap first names on word boundaries. People often refer to their
  // partner by first name alone ("Pete and I have agreed...").
  const tFirst = tFull.split(/\s+/)[0] || '';
  const pFirst = pFull.split(/\s+/)[0] || '';
  if (tFirst && pFirst && tFirst.toLowerCase() !== pFirst.toLowerCase()) {
    const tFirstRe = new RegExp('\\b' + escapeRegex(tFirst) + '\\b', 'gi');
    const pFirstRe = new RegExp('\\b' + escapeRegex(pFirst) + '\\b', 'gi');
    out = out.replace(tFirstRe, T_TOKEN).replace(pFirstRe, P_TOKEN);
  }

  out = out.split(T_TOKEN).join(pFull).split(P_TOKEN).join(tFull);

  // 3) Swap gendered pronouns. Each pair gets its own sentinel pair so the two
  // halves of the swap don't interfere with each other.
  const pronounPairs: Array<[string, string]> = [
    ['he', 'she'],
    ['his', 'her'],
    ['himself', 'herself'],
    ["he's", "she's"],
    ["he'd", "she'd"],
    ["he'll", "she'll"],
  ];

  pronounPairs.forEach(([a, b], i) => {
    // Three case variants per pair — lowercase, Capitalised, UPPERCASE — so
    // sentence-initial and emphatic uses keep their original casing after swap.
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    const variants: Array<[string, string]> = [
      [a, b],
      [cap(a), cap(b)],
      [a.toUpperCase(), b.toUpperCase()],
    ];
    variants.forEach(([va, vb], j) => {
      const tokA = ` __PR_A_${i}_${j}__ `;
      const tokB = ` __PR_B_${i}_${j}__ `;
      const reA = new RegExp('\\b' + escapeRegex(va) + '\\b', 'g');
      const reB = new RegExp('\\b' + escapeRegex(vb) + '\\b', 'g');
      out = out.replace(reA, tokA).replace(reB, tokB);
      out = out.split(tokA).join(vb).split(tokB).join(va);
    });
  });

  return out;
}

/**
 * Build the URL the customer follows from the onboarding email to fill in
 * their questionnaire. The form must read ?ref= from the URL and pass it back
 * in its POST to /api/lead so we match this payment to their answers. We also
 * pass the product so the form pre-selects the right radio (single vs mirror).
 */
function questionnaireUrlFor(ref: string, product: Product, env: Env): string {
  const origin = (env.SITE_ORIGIN || '').replace(/\/$/, '');
  return `${origin}/forms/will.html?ref=${encodeURIComponent(ref)}&product=${encodeURIComponent(product)}`;
}

/**
 * Pay-first bootstrap: a Stripe payment arrived with NO client_reference_id
 * attached (i.e. customer paid via a bare Payment Link straight from the
 * website). We create a fresh lead keyed on a new UUID, stash the payment
 * details, and email the customer a link to the questionnaire.
 *
 * Returns the newly-minted ref so the caller can include it in the webhook
 * response payload (useful for debugging in the Stripe dashboard).
 */
async function bootstrapLeadFromSession(env: Env, session: any): Promise<string | null> {
  const customerEmail: string | undefined =
    session?.customer_details?.email || session?.customer_email || undefined;
  if (!customerEmail) {
    console.warn('Webhook bootstrap: session has no customer email — cannot send onboarding link');
    return null;
  }

  const ref = crypto.randomUUID();
  const product = inferProductFromSession(session, env);
  const customerName: string | undefined = session?.customer_details?.name || undefined;

  const record: LeadRecord = {
    pdfStatus: 'awaiting_questionnaire',
    paidAt: new Date().toISOString(),
    stripeSessionId: session.id,
    stripePaymentIntentId: session.payment_intent,
    stripeAmount: session.amount_total,
    stripeCurrency: session.currency,
    stripeCustomerEmail: customerEmail,
    product,
  };
  await putLead(env, ref, record);

  try {
    await sendOnboardingEmail({
      apiKey: env.RESEND_API_KEY,
      from: env.EMAIL_FROM,
      to: customerEmail,
      bcc: env.ADMIN_NOTIFICATION_EMAIL || undefined,
      customerName,
      questionnaireUrl: questionnaireUrlFor(ref, product, env),
      product,
      ref,
    });
    await updateLead(env, ref, { onboardingEmailSentAt: new Date().toISOString() });
  } catch (err: any) {
    console.error(`Webhook bootstrap: onboarding email failed for ref=${ref}:`, err);
    await updateLead(env, ref, { onboardingEmailError: err?.message || String(err) });
  }
  return ref;
}


/**
 * Race a promise against a timeout. If the promise doesn't resolve within
 * timeoutMs, throws an Error with the supplied label. Critical for protecting
 * generateAndDeliver against Cloudflare Browser Rendering hangs that would
 * otherwise let the worker run past its 30s background-task budget and die
 * silently before the catch block can write pdfError to KV.
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`TIMEOUT after ${timeoutMs}ms: ${label}`));
    }, timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
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
    if (!lead.questionnaire) {
      console.log(`Webhook: lead ${ref} has no questionnaire yet — skipping generation`);
      return;
    }
    console.log(`[generate ${ref}] START, product=${lead.product}, hasQuestionnaire=${!!lead.questionnaire}`);
    await updateLead(env, ref, { pdfStatus: 'generating', generatingStartedAt: new Date().toISOString() });

    // Render HTML — for mirror orders we render BOTH spouses' wills and
    // concatenate them inside one PDF. The first will is the primary testator's
    // (as captured in the questionnaire); the second is built by swapping
    // testator <-> partner roles via swapForPartner(). Mirror convention is
    // that the partner's will is structurally identical with names swapped, so
    // re-rendering the same template on a swapped questionnaire is correct.
    //
    // We extract the <body> of the partner-will HTML and inject it before
    // </body> of the primary-will HTML, separated by a CSS page break. This
    // keeps a single <html>/<head> wrapper (so styles, fonts, base tags etc.
    // apply uniformly) but produces two independent will documents in one PDF.
    const baseExtras = {
      ref,
      renderDate: formatDate(new Date()),
    };

    const productEffective = (lead.questionnaire.product || lead.product) as Product | undefined;
    const isMirror = productEffective === 'mirror' && !!lead.questionnaire.partner?.fullName;

    const willPrimary = render(willTemplate as string, {
      ...lead.questionnaire,
      ...baseExtras,
    });

    let html: string;
    if (isMirror) {
      const partnerQuestionnaire = swapForPartner(lead.questionnaire);
      const willPartner = render(willTemplate as string, {
        ...partnerQuestionnaire,
        ...baseExtras,
      });
      const bodyMatch = willPartner.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      const partnerBody = bodyMatch ? bodyMatch[1] : willPartner;
      const PAGE_BREAK = '<div style="page-break-before: always;"></div>';
      html = willPrimary.replace('</body>', `${PAGE_BREAK}${partnerBody}</body>`);
    } else {
      html = willPrimary;
    }

    // PDF via Browser Rendering — wrapped in 25s timeout because
    // Cloudflare's renderer occasionally hangs forever (especially when quota
    // exhausted), which would let the worker die past its 30s budget without
    // ever firing the catch block below.
    console.log(`[generate ${ref}] HTML built, length=${html.length}, isMirror=${isMirror}, calling renderPdf...`);
    const pdfBytes = await withTimeout(
      renderPdf(env.BROWSER, html),
      25000,
      'renderPdf (Cloudflare Browser Rendering)',
    );
    console.log(`[generate ${ref}] renderPdf returned, pdfBytes=${pdfBytes?.length || 0} bytes`);
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
      const product = (lead.questionnaire.product || lead.product) === 'mirror' ? 'Mirror Wills' : 'Will';
      const subject = `Your ${product} from Clear Legacy — ready to sign`;

      const plainHtml = `
        <p>Hello ${escapeHtml(customerName)},</p>
        <p>Thank you for your order. Please find your ${escapeHtml(product)} attached to this email as a PDF.</p>
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

Thank you for your order. Please find your ${product} attached as a PDF.

Please print it, arrange two witnesses to be with you together, and sign it in their joint presence. The witnesses must not be beneficiaries.

You can re-download the PDF for the next ${env.PDF_RETENTION_DAYS || '90'} days:
${downloadUrl}

Reference: ${ref}
— Clear Legacy`;

      console.log(`[generate ${ref}] sending email to ${toEmail}...`);
      await withTimeout(
        sendEmail(env.RESEND_API_KEY, {
          from: env.EMAIL_FROM,
          to: toEmail,
          bcc: env.ADMIN_NOTIFICATION_EMAIL || undefined,
          subject,
          html: plainHtml,
          text: plainText,
          attachments: [{
            filename: `${customerName.replace(/[^\w -]/g, '_')}-${productEffective === 'mirror' ? 'mirror-wills' : 'will'}.pdf`,
            content: bytesToBase64(pdfBytes),
            contentType: 'application/pdf',
          }],
        }),
        15000,
        'sendEmail (Resend)',
      );
      console.log(`[generate ${ref}] email sent OK`);
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

  // Cross-business filter: same Stripe account is used by sibling sites
  // (e.g., itsadecline.com). Only proceed for events whose checkout session
  // belongs to Clear Legacy, identified by the success_url domain. Without
  // this guard the bootstrap path below would email Clear Legacy questionnaire
  // links to customers of unrelated businesses.
  if (event.type === 'checkout.session.completed' && session && !isClearLegacySession(session)) {
    console.log(`Webhook: ignoring non-CL checkout session ${session.id} (success_url=${session.success_url || 'missing'})`);
    return new Response(
      JSON.stringify({ received: true, ignored: 'non_clearlegacy_business' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (!ref) {
    // No client_reference_id — this is the pay-first path: the customer paid
    // via a bare Payment Link (no questionnaire submitted yet). Bootstrap a
    // lead record keyed on a fresh UUID and email them the questionnaire link.
    if (event.type === 'checkout.session.completed' && session) {
      const newRef = await bootstrapLeadFromSession(env, session);
      if (newRef) {
        return new Response(
          JSON.stringify({ received: true, bootstrapped: true, ref: newRef }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      // No customer email — nothing we can do; ack so Stripe doesn't retry.
      return new Response(
        JSON.stringify({ received: true, ignored: 'no_customer_email' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }
    // Non-checkout events with no ref (subscription events, refunds, etc.)
    return new Response(JSON.stringify({ received: true, ignored: event.type }), { status: 200 });
  }


  // ----------------------------------------------------------------------
  // checkout.session.expired — customer reached Stripe but didn't complete
  // payment (clicked cancel, closed tab, or Stripe declared the session
  // expired after the 24h window). Send a one-time recovery email with a
  // retry link, idempotent via cancelledEmailSentAt.
  // ----------------------------------------------------------------------
  if (event.type === 'checkout.session.expired' && session) {
    if (!isClearLegacySession(session)) {
      return new Response(
        JSON.stringify({ received: true, ignored: 'non_clearlegacy_business' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }
    const expiredRef: string | undefined =
      session.client_reference_id || session.metadata?.ref || session.metadata?.client_reference_id;
    if (!expiredRef) {
      // Pay-first abandonment with no questionnaire — nothing to recover.
      return new Response(
        JSON.stringify({ received: true, ignored: 'no_ref_on_expired_session' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }
    const lead = await getLead(env, expiredRef);
    if (!lead) {
      return new Response(
        JSON.stringify({ received: true, ignored: 'no_lead_for_expired_session' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }
    // Skip if already paid/processed
    if (lead.paidAt || lead.pdfStatus === 'ready' || lead.pdfStatus === 'generating') {
      return new Response(
        JSON.stringify({ received: true, ignored: 'lead_already_paid_or_processing' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }
    // Skip if we've already sent the recovery email (idempotency)
    if (lead.cancelledEmailSentAt) {
      return new Response(
        JSON.stringify({ received: true, ignored: 'recovery_email_already_sent' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }
    // Pull the customer email from the lead's questionnaire (preferred) or session
    const customerEmail: string | undefined =
      lead.questionnaire?.testator?.email
      || lead.stripeCustomerEmail
      || session?.customer_details?.email
      || session?.customer_email
      || undefined;
    if (!customerEmail) {
      await updateLead(env, expiredRef, { cancelledAt: new Date().toISOString() });
      return new Response(
        JSON.stringify({ received: true, recorded: true, ignored: 'no_customer_email' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }
    // Reconstruct the retry checkout URL
    const product = (lead.product || lead.questionnaire?.product || 'single') as Product;
    const baseUrl = product === 'mirror' ? env.STRIPE_URL_MIRROR : env.STRIPE_URL_SINGLE;
    const retryUrl = new URL(baseUrl);
    retryUrl.searchParams.set('client_reference_id', expiredRef);
    if (customerEmail) retryUrl.searchParams.set('prefilled_email', customerEmail);
    const price = product === 'mirror' ? '\u00a399' : '\u00a369';
    const customerName: string | undefined =
      lead.questionnaire?.testator?.fullName || session?.customer_details?.name || undefined;
    // Send the recovery email (background — return 200 quickly to Stripe)
    ctx.waitUntil((async () => {
      try {
        await sendCancellationRecoveryEmail({
          apiKey: env.RESEND_API_KEY,
          from: env.EMAIL_FROM,
          to: customerEmail!,
          bcc: env.ADMIN_NOTIFICATION_EMAIL || undefined,
          customerName,
          retryUrl: retryUrl.toString(),
          product,
          price,
        });
        await updateLead(env, expiredRef, {
          cancelledAt: new Date().toISOString(),
          cancelledEmailSentAt: new Date().toISOString(),
        });
      } catch (err: any) {
        console.error(`Webhook cancellation recovery email failed for ref=${expiredRef}:`, err);
        await updateLead(env, expiredRef, {
          cancelledAt: new Date().toISOString(),
          cancelledEmailError: err?.message || String(err),
        });
      }
    })());
    return new Response(
      JSON.stringify({ received: true, cancellation_recovery_queued: true, ref: expiredRef }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Record payment info immediately so /api/status can reflect "paid" while PDF renders.
  if (event.type === 'checkout.session.completed' && session) {
    // Defensive lookup: if the lead doesn't exist (questionnaire POST never landed,
    // race condition, customer closed tab, etc.) the payment would otherwise be
    // silently lost — updateLead is a no-op when the key is missing. Recover by
    // bootstrapping a lead AT THE GIVEN REF, so traceability is preserved and the
    // customer can finish the questionnaire via the email we send them.
    const existing = await getLead(env, ref);
    if (!existing) {
      console.error(
        `Webhook recovery: client_reference_id ${ref} present but no KV lead — bootstrapping from session ${session.id}`
      );
      const customerEmail: string | undefined =
        session?.customer_details?.email || session?.customer_email || undefined;
      const product = inferProductFromSession(session, env);
      const customerName: string | undefined = session?.customer_details?.name || undefined;

      const record: LeadRecord = {
        pdfStatus: 'awaiting_questionnaire',
        paidAt: new Date().toISOString(),
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent,
        stripeAmount: session.amount_total,
        stripeCurrency: session.currency,
        stripeCustomerEmail: customerEmail,
        product,
      };
      await putLead(env, ref, record);

      if (customerEmail) {
        try {
          await sendOnboardingEmail({
            apiKey: env.RESEND_API_KEY,
            from: env.EMAIL_FROM,
            to: customerEmail,
            bcc: env.ADMIN_NOTIFICATION_EMAIL || undefined,
            customerName,
            questionnaireUrl: questionnaireUrlFor(ref, product, env),
            product,
            ref,
          });
          await updateLead(env, ref, { onboardingEmailSentAt: new Date().toISOString() });
        } catch (err: any) {
          console.error(`Webhook recovery: onboarding email failed for ref=${ref}:`, err);
          await updateLead(env, ref, { onboardingEmailError: err?.message || String(err) });
        }
      } else {
        console.warn(`Webhook recovery: no customer email on session ${session.id} — lead created but onboarding email not sent`);
      }

      return new Response(
        JSON.stringify({ received: true, recovered: true, ref }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

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


/**
 * Watchdog — scan KV for leads stuck in pdfStatus="generating" for > 5 minutes
 * and auto-flip them to "failed" with a clear error. This is a backstop for
 * when PDF generation hangs in a way that bypasses our timeout wrapper (e.g.,
 * if the worker dies before catch fires, or if Cloudflare kills the background
 * task mid-flight). Called from scheduled() in index.ts every 2 minutes.
 */
export async function watchdogStuckGenerating(env: Env): Promise<void> {
  const STUCK_AFTER_MS = 5 * 60 * 1000;
  let cursor: string | undefined = undefined;
  let stuckCount = 0;
  let scanned = 0;
  do {
    const list: any = await env.CLEARLEGACY_KV.list({ prefix: 'lead:', cursor, limit: 100 });
    for (const key of list.keys) {
      scanned++;
      const ref = key.name.replace(/^lead:/, '');
      const lead = await getLead(env, ref);
      if (!lead || lead.pdfStatus !== 'generating') continue;
      const startedAt = (lead as any).generatingStartedAt as string | undefined;
      let ageMs = STUCK_AFTER_MS + 1; // assume stuck if no timestamp
      let ageDescription = 'no generatingStartedAt timestamp (legacy)';
      if (startedAt) {
        ageMs = Date.now() - new Date(startedAt).getTime();
        ageDescription = `${Math.round(ageMs / 60000)} minutes`;
      }
      if (ageMs > STUCK_AFTER_MS) {
        const reason = `Watchdog auto-failed: stuck in 'generating' for ${ageDescription}. Underlying generation likely hung beyond the 25s renderPdf timeout. Click Regenerate PDF to retry.`;
        await updateLead(env, ref, { pdfStatus: 'failed', pdfError: reason });
        await appendActivity(env, ref, { type: 'pdf_failed', at: new Date().toISOString(), detail: `[watchdog] ${reason}` });
        console.log(`[watchdog] auto-failed ${ref}: ${ageDescription}`);
        stuckCount++;
      }
    }
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);
  if (stuckCount > 0 || scanned > 0) {
    console.log(`[watchdog] scan complete: ${scanned} leads scanned, ${stuckCount} auto-failed`);
  }
}
