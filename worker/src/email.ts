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
