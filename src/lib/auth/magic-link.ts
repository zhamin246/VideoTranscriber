import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

function secret(): string {
  const s = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not configured");
  return s;
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromB64url(input: string): Buffer {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64");
}

export function createMagicLinkToken(email: string): string {
  const normalized = email.trim().toLowerCase();
  const payload = b64url(
    JSON.stringify({
      e: normalized,
      exp: Date.now() + TOKEN_TTL_MS,
    })
  );
  const sig = createHmac("sha256", secret()).update(payload).digest();
  return `${payload}.${b64url(sig)}`;
}

export function verifyMagicLinkToken(
  token: string
): { email: string } | { error: string } {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return { error: "invalid_token" };

    const expected = createHmac("sha256", secret()).update(payload).digest();
    const got = fromB64url(sig);
    if (expected.length !== got.length || !timingSafeEqual(expected, got)) {
      return { error: "invalid_token" };
    }

    const data = JSON.parse(fromB64url(payload).toString("utf8")) as {
      e?: string;
      exp?: number;
    };
    if (!data.e || typeof data.exp !== "number") {
      return { error: "invalid_token" };
    }
    if (Date.now() > data.exp) {
      return { error: "expired" };
    }
    return { email: data.e };
  } catch {
    return { error: "invalid_token" };
  }
}

export function isMagicLinkAuthEnabled(): boolean {
  // Face Rating product default: email magic link is the primary login.
  if (process.env.NEXT_PUBLIC_AUTH_EMAIL_ENABLED === "false") return false;
  return true;
}
