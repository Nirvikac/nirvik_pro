export const GATE_COOKIE = "site_gate";

// How long a successful PIN entry stays valid (30 days).
export const GATE_TTL_MS = 1000 * 60 * 60 * 24 * 30;

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmac(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return toHex(sig);
}

// Constant-time string comparison to avoid leaking the PIN/length via timing.
export function safeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

// Token format: "<issuedAtMs>.<hmac>". Signed with a server-only secret so the
// browser cannot forge a valid access cookie.
export async function createGateToken(secret: string): Promise<string> {
  const issuedAt = Date.now().toString();
  const sig = await hmac(secret, issuedAt);
  return `${issuedAt}.${sig}`;
}

export async function verifyGateToken(
  token: string | undefined,
  secret: string,
  ttlMs: number = GATE_TTL_MS
): Promise<boolean> {
  if (!token || !secret) return false;
  const sep = token.indexOf(".");
  if (sep < 1) return false;

  const issuedAt = token.slice(0, sep);
  const sig = token.slice(sep + 1);
  const ts = Number(issuedAt);
  if (!Number.isFinite(ts)) return false;

  const age = Date.now() - ts;
  if (age < 0 || age > ttlMs) return false;

  const expected = await hmac(secret, issuedAt);
  return safeEqual(sig, expected);
}

// Best-effort in-memory rate limiting. Resets on deploy / cold start, which is
// fine for stopping casual brute-forcing of the PIN.
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  limit = 10,
  windowMs = 10 * 60 * 1000
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();

  if (buckets.size > 5000) {
    for (const [k, b] of buckets) {
      if (now > b.resetAt) buckets.delete(k);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count++;
  return { ok: true, retryAfterSec: 0 };
}

// Only allow same-site relative redirect targets (blocks open redirects).
export function safeNextPath(value: string | undefined | null): string {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.startsWith("/gate")) return "/";
  return value;
}
