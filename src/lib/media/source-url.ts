const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "metadata.google.internal",
]);

function isPrivateIpv4(host: string) {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

/** Public https URL only — Cobalt fetches it, we still reject obvious SSRF. */
export function parsePublicHttpsUrl(raw: string): URL {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 2048) {
    throw new Error("Paste a valid media link.");
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("Paste a full https URL.");
  }
  if (parsed.protocol !== "https:") {
    throw new Error("Only https links are supported.");
  }
  const host = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host) || isPrivateIpv4(host) || host.endsWith(".local")) {
    throw new Error("That link cannot be used.");
  }
  return parsed;
}
