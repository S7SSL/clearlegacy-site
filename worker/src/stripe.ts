/**
 * Stripe webhook signature verification.
 *
 * Stripe sends header `Stripe-Signature: t=TIMESTAMP,v1=HEX_SIGNATURE`.
 * We HMAC-SHA256("{t}.{raw_body}") with the webhook secret and compare to v1.
 *
 * Reference: https://stripe.com/docs/webhooks/signatures
 */

const TOLERANCE_SECONDS = 300; // 5-minute replay window (Stripe default)

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2) return new Uint8Array(0);
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return out;
}

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const bytes = new Uint8Array(sig);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
  return hex;
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/**
 * Verify a Stripe webhook. Throws Error on failure. Returns parsed event JSON.
 *
 * Must be called with the RAW body string (not the parsed JSON) — any re-stringifying
 * of the body will alter whitespace and break verification.
 */
export async function verifyStripeSignature(
  rawBody: string,
  header: string | null,
  secret: string,
): Promise<any> {
  if (!header) throw new Error('Missing Stripe-Signature header');
  if (!secret) throw new Error('Missing webhook secret');

  // Parse header: "t=1234,v1=abc,v1=def"
  let timestamp = '';
  const v1Sigs: string[] = [];
  for (const part of header.split(',')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k === 't') timestamp = v;
    else if (k === 'v1') v1Sigs.push(v);
  }
  if (!timestamp || v1Sigs.length === 0) {
    throw new Error('Malformed Stripe-Signature header');
  }

  const now = Math.floor(Date.now() / 1000);
  const ts = parseInt(timestamp, 10);
  if (!Number.isFinite(ts)) throw new Error('Invalid timestamp');
  if (Math.abs(now - ts) > TOLERANCE_SECONDS) {
    throw new Error('Stale Stripe webhook (replay protection)');
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const expectedHex = await hmacSha256Hex(secret, signedPayload);
  const expectedBytes = hexToBytes(expectedHex);

  const matched = v1Sigs.some((sig) => {
    const sigBytes = hexToBytes(sig);
    return constantTimeEqual(expectedBytes, sigBytes);
  });
  if (!matched) throw new Error('Stripe signature mismatch');

  return JSON.parse(rawBody);
}
