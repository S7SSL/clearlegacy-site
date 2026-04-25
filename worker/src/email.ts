/**
 * Transactional email via Resend.
 * Docs: https://resend.com/docs/api-reference/emails/send-email
 *
 * We send one email with the PDF attached, and (optionally) a BCC to the admin.
 */

export interface EmailAttachment {
  filename: string;
  content: string; // base64
  contentType?: string;
}

export interface SendEmailArgs {
  from: string;
  to: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}

export async function sendEmail(apiKey: string, args: SendEmailArgs): Promise<void> {
  const body: Record<string, unknown> = {
    from: args.from,
    to: Array.isArray(args.to) ? args.to : [args.to],
    subject: args.subject,
    html: args.html,
  };
  if (args.text) body.text = args.text;
  if (args.bcc) body.bcc = Array.isArray(args.bcc) ? args.bcc : [args.bcc];
  if (args.attachments && args.attachments.length > 0) {
    body.attachments = args.attachments.map((a) => ({
      filename: a.filename,
      content: a.content,
      content_type: a.contentType,
    }));
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend send failed: ${res.status} ${text}`);
  }
}

/**
 * "Thanks for paying — now complete your questionnaire" email, sent from the
 * Stripe webhook when a payment completes but no ref has been attached yet
 * (i.e. pay-first flow: customer paid via a bare Payment Link, and now we
 * need them to fill in the questionnaire so the PDF can be generated).
 */
export interface OnboardingEmailArgs {
  apiKey: string;
  from: string;
  to: string;
  bcc?: string;
  customerName?: string;
  questionnaireUrl: string; // e.g. https://www.clearlegacy.co.uk/forms/will.html?ref=UUID
  product?: 'single' | 'mirror' | string;
  ref: string;
}

function escapeHtmlForEmail(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendOnboardingEmail(args: OnboardingEmailArgs): Promise<void> {
  const greeting = args.customerName
    ? `Hello ${escapeHtmlForEmail(args.customerName)},`
    : 'Hello,';
  const productLabel = args.product === 'mirror' ? 'Mirror Wills' : 'Will';
  const subject = `Clear Legacy — next step: complete your ${productLabel.toLowerCase()} questionnaire`;
  const safeUrl = escapeHtmlForEmail(args.questionnaireUrl);
  const safeRef = escapeHtmlForEmail(args.ref);
  const html = `
<p>${greeting}</p>
<p>Thank you for your payment — your order is confirmed.</p>
<p>The next step is to complete a short questionnaire so we can prepare your ${escapeHtmlForEmail(productLabel)}. It takes about 10 minutes, and as soon as you submit it we will generate your document and email it to you as a signed-ready PDF.</p>
<p><a href="${safeUrl}" style="display:inline-block;padding:10px 18px;background:#111;color:#fff;text-decoration:none;border-radius:4px">Complete your questionnaire</a></p>
<p>Or paste this link into your browser:<br><a href="${safeUrl}">${safeUrl}</a></p>
<p>Your order reference: <code>${safeRef}</code></p>
<p>If you have any questions, just reply to this email.</p>
<p>— Clear Legacy</p>
`;
  const text = `${args.customerName ? 'Hello ' + args.customerName + ',' : 'Hello,'}

Thank you for your payment — your order is confirmed.

The next step is to complete a short questionnaire so we can prepare your ${productLabel}. It takes about 10 minutes, and as soon as you submit it we will generate your document and email it to you as a PDF.

Complete your questionnaire here: ${args.questionnaireUrl}

Your order reference: ${args.ref}

If you have any questions, just reply to this email.

— Clear Legacy`;
  await sendEmail(args.apiKey, {
    from: args.from,
    to: args.to,
    bcc: args.bcc,
    subject,
    html,
    text,
  });
}

/**
 * Magic-link login email for the customer portal.
 * Single-use link, 15-minute expiry. The link points at the Worker
 * (api.clearlegacy.co.uk) which sets the session cookie and 302s back to
 * the static portal at www.clearlegacy.co.uk/account/.
 */
export interface MagicLinkEmailArgs {
  apiKey: string;
  from: string;
  to: string;
  link: string;
  expiresMinutes: number;
}

export async function sendMagicLinkEmail(args: MagicLinkEmailArgs): Promise<void> {
  const safeLink = escapeHtmlForEmail(args.link);
  const subject = 'Clear Legacy — your sign-in link';
  const html = `
<p>Hello,</p>
<p>Click the button below to sign in to your Clear Legacy account. This link is valid for ${args.expiresMinutes} minutes and can only be used once.</p>
<p><a href="${safeLink}" style="display:inline-block;padding:10px 18px;background:#111;color:#fff;text-decoration:none;border-radius:4px">Sign in to my account</a></p>
<p>Or paste this link into your browser:<br><a href="${safeLink}">${safeLink}</a></p>
<p>If you didn't request this, you can ignore this email — no one can sign in without it.</p>
<p>— Clear Legacy</p>
`;
  const text = `Hello,

Click this link to sign in to your Clear Legacy account. It is valid for ${args.expiresMinutes} minutes and can only be used once.

${args.link}

If you didn't request this, you can ignore this email — no one can sign in without it.

— Clear Legacy`;
  await sendEmail(args.apiKey, {
    from: args.from,
    to: args.to,
    subject,
    html,
    text,
  });
}

/**
 * Encode a Uint8Array as base64 (for Resend attachments).
 */
export function bytesToBase64(bytes: Uint8Array): string {
  // Chunk to avoid "too many args" on String.fromCharCode.
  const CHUNK = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}
