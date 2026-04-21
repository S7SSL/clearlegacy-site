/**
 * HMAC-signed download tokens.
 *
 * Token format: base64url(payload).base64url(hmac)
 * Payload JSON: { ref, exp }   (exp is unix seconds)
 *
 * We sign with DOWNLOAD_TOKEN_SECRET (Worker secret).
 * Tokens expire after PDF_RETENTION_DAYS (default 90).
 */

function b64urlEncode(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): Uint8Array {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export interface TokenPayload {
  ref: string;
  exp: number; // unix seconds
}

export async function mintDownloadToken(
  secret: string,
  ref: string,
  ttlSeconds: number,
): Promise<string> {
  const payload: TokenPayload = {
    ref,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const payloadJson = JSON.stringify(payload);
  const payloadBytes = new TextEncoder().encode(payloadJson);
  const key = await hmacKey(secret);
  const sigBuf = await crypto.subtle.sign('HMAC', key, payloadBytes);
  const sig = new Uint8Array(sigBuf);
  return `${b64urlEncode(payloadBytes)}.${b64urlEncode(sig)}`;
}

export async function verifyDownloadToken(
  secret: string,
  token: string,
): Promise<TokenPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;

  let payloadBytes: Uint8Array;
  let sigBytes: Uint8Array;
  try {
    payloadBytes = b64urlDecode(payloadB64);
    sigBytes = b64urlDecode(sigB64);
  } catch {
    return null;
  }

  const key = await hmacKey(secret);
  const expectedBuf = await crypto.subtle.sign('HMAC', key, payloadBytes);
  const expected = new Uint8Array(expectedBuf);
  if (!constantTimeEqual(expected, sigBytes)) return null;

  let payload: TokenPayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(payloadBytes)) as TokenPayload;
  } catch {
    return null;
  }
  if (typeof payload.ref !== 'string' || typeof payload.exp !== 'number') return null;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}
