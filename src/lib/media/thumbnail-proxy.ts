/** CDNs that often block hotlinking without a platform Referer. */
const PROXY_HOST_SUFFIXES = [
  "cdninstagram.com",
  "fbcdn.net",
  "instagram.com",
  "facebook.com",
  "tiktokcdn.com",
  "tiktokcdn-us.com",
  "tiktokcdn-eu.com",
  "muscdn.com",
  "byteoversea.com",
  "ibyteimg.com",
];

function hostOf(raw: string): string | null {
  try {
    return new URL(raw).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return null;
  }
}

export function needsThumbnailProxy(raw: string): boolean {
  const host = hostOf(raw);
  if (!host) return false;
  return PROXY_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`),
  );
}

/** Same-origin proxy URL so <img> can load Instagram/TikTok/Facebook covers. */
export function toProxiedThumbnailUrl(raw: string): string {
  if (!raw || !/^https:\/\//i.test(raw)) return raw;
  // Meta HTML often leaves &amp; in og:image query strings — decode before proxying.
  const cleaned = raw
    .replace(/&amp;/gi, "&")
    .replace(/&#38;/g, "&")
    .trim();
  if (!needsThumbnailProxy(cleaned)) return cleaned;
  return `/api/media/thumbnail?url=${encodeURIComponent(cleaned)}`;
}

export function refererForThumbnail(raw: string): string {
  const host = hostOf(raw) || "";
  if (host.includes("instagram") || host.includes("cdninstagram")) {
    return "https://www.instagram.com/";
  }
  if (host.includes("facebook") || host.includes("fbcdn")) {
    return "https://www.facebook.com/";
  }
  if (host.includes("tiktok") || host.includes("byteoversea") || host.includes("muscdn") || host.includes("ibyteimg")) {
    return "https://www.tiktok.com/";
  }
  return "https://www.google.com/";
}

export function isAllowedThumbnailUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return false;
    return needsThumbnailProxy(raw) || u.hostname.includes("ytimg.com");
  } catch {
    return false;
  }
}
