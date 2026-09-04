import type { MediaPreview } from "@/lib/media/preview-types";
import { resolveCobaltMedia } from "@/lib/media/cobalt";
import { probeRemoteMediaDuration } from "@/lib/media/mp4-duration";
import { toProxiedThumbnailUrl } from "@/lib/media/thumbnail-proxy";
import { fetchMediaInfoViaYtdlp } from "@/lib/media/ytdlp-worker";

export type { MediaPreview } from "@/lib/media/preview-types";
export { formatDuration } from "@/lib/media/preview-types";

type OEmbedJson = {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
  duration?: number;
  type?: string;
  provider_name?: string;
};

function hostOf(url: URL) {
  return url.hostname.replace(/^www\./i, "").toLowerCase();
}

function youtubeId(url: URL): string | null {
  const host = hostOf(url);
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id && /^[\w-]{6,}$/.test(id) ? id : null;
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
    const v = url.searchParams.get("v");
    if (v && /^[\w-]{6,}$/.test(v)) return v;
    const parts = url.pathname.split("/").filter(Boolean);
    if ((parts[0] === "shorts" || parts[0] === "embed" || parts[0] === "live") && parts[1]) {
      return /^[\w-]{6,}$/.test(parts[1]) ? parts[1] : null;
    }
  }
  return null;
}

function platformLabel(url: URL): string {
  const host = hostOf(url);
  if (host.includes("youtube") || host === "youtu.be") return "YouTube";
  if (host.includes("tiktok")) return "TikTok";
  if (host.includes("instagram")) return "Instagram";
  if (host.includes("facebook") || host === "fb.watch") return "Facebook";
  if (host === "x.com" || host === "twitter.com") return "X";
  if (host.includes("podcasts.apple")) return "Apple Podcasts";
  return host;
}

function oEmbedEndpoint(url: URL): string | null {
  const host = hostOf(url);
  const encoded = encodeURIComponent(url.toString());
  if (host.includes("youtube") || host === "youtu.be") {
    return `https://www.youtube.com/oembed?url=${encoded}&format=json`;
  }
  if (host.includes("tiktok")) {
    return `https://www.tiktok.com/oembed?url=${encoded}`;
  }
  // Public Instagram oEmbed (title + thumbnail). Duration is not included.
  if (host.includes("instagram")) {
    return `https://www.instagram.com/api/v1/oembed/?url=${encoded}`;
  }
  if (host === "x.com" || host === "twitter.com") {
    return `https://publish.twitter.com/oembed?url=${encoded}`;
  }
  return null;
}

async function fetchJson<T>(url: string, timeoutMs = 12_000): Promise<T | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent": "video-transcriber/1.0",
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchText(
  url: string,
  timeoutMs = 12_000,
  userAgent?: string,
): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      cache: "no-store",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent":
          userAgent ||
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function socialScrapeUserAgent(url: URL) {
  const host = hostOf(url);
  if (host.includes("facebook") || host === "fb.watch") {
    return "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";
  }
  if (host.includes("instagram")) {
    return "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
  }
  return undefined;
}

function formatFallbackTitle(url: URL) {
  const id = youtubeId(url);
  if (id) return `YouTube video (${id})`;
  return platformLabel(url);
}

function youtubeThumb(id: string) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

function parseYoutubeDuration(html: string): number | null {
  const patterns = [
    /"lengthSeconds"\s*:\s*"(\d+)"/,
    /"lengthSeconds"\s*:\s*(\d+)/,
    /itemprop="duration"\s+content="PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?"/i,
  ];
  for (const re of patterns) {
    const m = re.exec(html);
    if (!m) continue;
    if (re.source.includes("lengthSeconds")) {
      const n = Number(m[1]);
      return Number.isFinite(n) && n > 0 ? n : null;
    }
    const h = Number(m[1] || 0);
    const min = Number(m[2] || 0);
    const s = Number(m[3] || 0);
    const total = h * 3600 + min * 60 + s;
    return total > 0 ? total : null;
  }
  return null;
}

function parseOg(html: string) {
  const pick = (prop: string) => {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,
      "i",
    );
    const re2 = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`,
      "i",
    );
    return re.exec(html)?.[1] || re2.exec(html)?.[1] || "";
  };
  return {
    title: decodeHtml(pick("og:title") || pick("twitter:title")),
    thumbnailUrl: decodeHtml(pick("og:image") || pick("twitter:image") || pick("og:image:url")),
  };
}

function decodeHtml(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\u00a0/g, " ")
    .trim();
}

function cleanSocialTitle(title: string, platform: string) {
  let t = title.trim();
  if (!t) return "";
  t = t.replace(/\s*\|\s*Facebook\s*$/i, "").trim();
  if (t.includes("|")) {
    const parts = t
      .split("|")
      .map((p) => p.trim())
      .filter(Boolean);
    const best =
      [...parts].reverse().find((p) => !/次播放|views?|心情|reactions?/i.test(p)) ||
      parts[parts.length - 1];
    t = best || t;
  }
  if (!t || t.toLowerCase() === platform.toLowerCase()) return "";
  return t;
}

function needsYtdlpEnrichment(
  source: URL,
  durationSeconds: number | null,
  thumbnailUrl: string,
) {
  const host = hostOf(source);
  const social =
    host.includes("instagram") ||
    host.includes("tiktok") ||
    host.includes("facebook") ||
    host === "fb.watch";
  if (social) {
    return durationSeconds == null || !thumbnailUrl;
  }
  return durationSeconds == null;
}

function needsDurationProbe(source: URL) {
  const host = hostOf(source);
  return (
    host.includes("instagram") ||
    host.includes("tiktok") ||
    host.includes("facebook") ||
    host === "fb.watch" ||
    host.includes("youtube") ||
    host === "youtu.be"
  );
}

/** Lightweight metadata for the paste-link preview card (no audio download). */
export async function fetchMediaPreview(source: URL): Promise<MediaPreview> {
  const platform = platformLabel(source);
  const ytId = youtubeId(source);

  let title = "";
  let thumbnailUrl = ytId ? youtubeThumb(ytId) : "";
  let durationSeconds: number | null = null;

  const oembedUrl = oEmbedEndpoint(source);
  if (oembedUrl) {
    const data = await fetchJson<OEmbedJson>(oembedUrl);
    if (data) {
      title = (data.title || "").trim();
      if (data.thumbnail_url) thumbnailUrl = data.thumbnail_url;
      if (typeof data.duration === "number" && data.duration > 0) {
        durationSeconds = Math.floor(data.duration);
      }
    }
  }

  // YouTube duration is not in oEmbed — scrape watch page as best effort.
  if (ytId && durationSeconds == null) {
    const html = await fetchText(`https://www.youtube.com/watch?v=${ytId}`);
    if (html) {
      durationSeconds = parseYoutubeDuration(html);
      if (!title) {
        const og = parseOg(html);
        if (og.title) title = og.title;
        if (og.thumbnailUrl) thumbnailUrl = og.thumbnailUrl;
      }
    }
  }

  // Generic Open Graph fallback for other hosts when oEmbed failed.
  if (!title || !thumbnailUrl) {
    const html = await fetchText(
      source.toString(),
      12_000,
      socialScrapeUserAgent(source),
    );
    if (html) {
      const og = parseOg(html);
      if (!title && og.title) title = cleanSocialTitle(og.title, platform);
      if (!thumbnailUrl && og.thumbnailUrl) thumbnailUrl = og.thumbnailUrl;
      // Facebook sometimes only exposes twitter:image / og:image:url variants.
      if (!thumbnailUrl) {
        const img =
          /content=["'](https:\/\/[^"']+(?:fbcdn|scontent)[^"']+)["']/i.exec(html)?.[1] ||
          "";
        if (img) thumbnailUrl = decodeHtml(img);
      }
    }
  }

  // Enrich duration / missing cover via yt-dlp worker (same idea as competitor url-info).
  if (needsYtdlpEnrichment(source, durationSeconds, thumbnailUrl)) {
    const info = await fetchMediaInfoViaYtdlp(source.toString());
    if (info) {
      if (!title && info.title) title = info.title.trim();
      if (!thumbnailUrl && info.thumbnail) thumbnailUrl = info.thumbnail;
      if (
        durationSeconds == null &&
        typeof info.duration === "number" &&
        Number.isFinite(info.duration) &&
        info.duration > 0
      ) {
        durationSeconds = Math.floor(info.duration);
      }
    }
  }

  // Fallback duration: resolve a media URL (Cobalt) and parse MP4 mvhd.
  if (durationSeconds == null && needsDurationProbe(source)) {
    try {
      const media = await resolveCobaltMedia(source.toString());
      const probed = await probeRemoteMediaDuration(media.url);
      if (probed != null && probed > 0) {
        durationSeconds = Math.max(1, Math.round(probed));
      }
    } catch {
      /* best-effort */
    }
  }

  if (!title) title = formatFallbackTitle(source);
  if (!thumbnailUrl && ytId) thumbnailUrl = youtubeThumb(ytId);
  title = cleanSocialTitle(title, platform) || title;

  return {
    url: source.toString(),
    title,
    thumbnailUrl: toProxiedThumbnailUrl(thumbnailUrl),
    durationSeconds,
    platform,
  };
}
