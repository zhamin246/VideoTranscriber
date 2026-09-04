/** Hosts we may proxy for <video>/<audio> playback (SSRF allowlist). */
const STREAM_HOST_SUFFIXES = [
  "cobalt.creatview.ai",
  "cdninstagram.com",
  "fbcdn.net",
  "instagram.com",
  "tiktokcdn.com",
  "tiktokcdn-us.com",
  "tiktokcdn-eu.com",
  "tiktok.com",
  "muscdn.com",
  "byteoversea.com",
  "ibyteimg.com",
  "twimg.com",
  "video.twimg.com",
  "cdn.ng-resource.com",
];

function hostOf(raw: string): string | null {
  try {
    return new URL(raw).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return null;
  }
}

export function isAllowedStreamUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    return STREAM_HOST_SUFFIXES.some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`),
    );
  } catch {
    return false;
  }
}

export function refererForStream(raw: string): string {
  const host = hostOf(raw) || "";
  if (host.includes("instagram") || host.includes("fbcdn") || host.includes("cdninstagram")) {
    return "https://www.instagram.com/";
  }
  if (
    host.includes("tiktok") ||
    host.includes("byteoversea") ||
    host.includes("muscdn") ||
    host.includes("ibyteimg")
  ) {
    return "https://www.tiktok.com/";
  }
  if (host.includes("twimg") || host.includes("twitter") || host === "x.com") {
    return "https://x.com/";
  }
  if (host.includes("cobalt")) {
    return "https://cobalt.tools/";
  }
  return "https://www.google.com/";
}

/** Same-origin stream URL so <video> can play Cobalt / CDN media without CORS. */
export function toProxiedPlaybackUrl(raw: string): string {
  if (!raw || !/^https:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/api/media/stream")) return raw;
  if (!isAllowedStreamUrl(raw)) return raw;
  return `/api/media/stream?url=${encodeURIComponent(raw)}`;
}
