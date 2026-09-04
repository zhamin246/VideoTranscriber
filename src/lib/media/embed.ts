import { extractYoutubeId } from "@/lib/media/youtube-id";

export type MediaEmbed =
  | { kind: "iframe"; src: string; title?: string }
  | { kind: "thumbnail"; href: string }
  | { kind: "none" };

function hostOf(url: URL) {
  return url.hostname.replace(/^www\./i, "").toLowerCase();
}

export function extractTikTokId(raw: string | URL): string | null {
  let url: URL;
  try {
    url = typeof raw === "string" ? new URL(raw) : raw;
  } catch {
    return null;
  }
  const host = hostOf(url);
  if (!host.includes("tiktok.com")) return null;
  const m = /\/video\/(\d+)/.exec(url.pathname);
  return m?.[1] || null;
}

export function extractBilibiliId(raw: string | URL): string | null {
  let url: URL;
  try {
    url = typeof raw === "string" ? new URL(raw) : raw;
  } catch {
    return null;
  }
  const host = hostOf(url);
  if (!host.includes("bilibili.com") && host !== "b23.tv") return null;
  const bv = /\/(BV[\w]+)/i.exec(url.pathname);
  if (bv?.[1]) return bv[1];
  const av = /\/av(\d+)/i.exec(url.pathname);
  if (av?.[1]) return `av${av[1]}`;
  return null;
}

/**
 * Platforms with a good in-page iframe — do NOT store video on R2 for playback.
 * Transcription still downloads audio separately.
 */
export function canEmbedPlayback(sourceUrl: string): boolean {
  try {
    if (extractYoutubeId(sourceUrl)) return true;
    if (extractTikTokId(sourceUrl)) return true;
    if (extractBilibiliId(sourceUrl)) return true;
    return false;
  } catch {
    return false;
  }
}

/** Platforms without a good in-page iframe player — need resolved MP4 + <video> on R2. */
export function needsResolvedPlayback(sourceUrl: string): boolean {
  try {
    if (canEmbedPlayback(sourceUrl)) return false;
    const host = hostOf(new URL(sourceUrl));
    if (host.includes("instagram")) return true;
    if (host.includes("facebook") || host === "fb.watch") return true;
    if (host === "x.com" || host === "twitter.com") return true;
    return false;
  } catch {
    return false;
  }
}

/** Resolve an in-page player for supported platforms; others fall back to thumbnail/link. */
export function resolveMediaEmbed(sourceUrl: string): MediaEmbed {
  const yt = extractYoutubeId(sourceUrl);
  if (yt) {
    // enablejsapi=1: transcript click → seekTo via IFrame API (videotranscriber.ai)
    return {
      kind: "iframe",
      src: `https://www.youtube.com/embed/${yt}?playsinline=1&controls=1&enablejsapi=1&rel=0`,
      title: "YouTube",
    };
  }

  const tt = extractTikTokId(sourceUrl);
  if (tt) {
    // Official TikTok Player (horizontal 16:9 + blurred sides), same as videotranscriber.ai
    return {
      kind: "iframe",
      src: `https://www.tiktok.com/player/v1/${tt}?controls=1&description=0&rel=0`,
      title: "TikTok Player",
    };
  }

  const bili = extractBilibiliId(sourceUrl);
  if (bili) {
    const param = bili.startsWith("av")
      ? `aid=${bili.slice(2)}`
      : `bvid=${bili}`;
    return {
      kind: "iframe",
      src: `https://player.bilibili.com/player.html?${param}&high_quality=1&autoplay=0`,
      title: "Bilibili",
    };
  }

  return { kind: "thumbnail", href: sourceUrl };
}
