import type { MetadataRoute } from "next";
import { defaultLocale, locales } from "@/i18n/locale";

function siteOrigin() {
  let base = (process.env.NEXT_PUBLIC_WEB_URL || "https://videotranscriber.pro").trim();
  base = base.replace(/\/$/, "");
  if (!/^https?:\/\//i.test(base)) base = `https://${base}`;
  return base;
}

/** Public indexable routes only (see tool-internal-link-map.ts). */
const STATIC_PATHS = [
  "/",
  "/audio-to-text-converter",
  "/mp3-to-srt",
  "/video-to-text",
  "/youtube-transcript-generator",
  "/tiktok-transcript-generator",
  "/instagram-transcript-generator",
  "/facebook-transcript-generator",
  "/x-transcript-generator",
  "/ai-video-summarizer",
  "/youtube-subtitle-downloader",
] as const;

/** Indexable content paths (blog + docs with published copy). */
const POST_SLUGS = ["turboscribe-review-ai-transcription-tool"] as const;
const DOC_PATHS = ["/docs", "/docs/quickstart"] as const;

function absoluteUrl(path: string, locale: string): string {
  const base = siteOrigin();
  if (locale === defaultLocale) {
    return path === "/" ? `${base}/` : `${base}${path}`;
  }
  return path === "/" ? `${base}/${locale}/` : `${base}/${locale}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const path of STATIC_PATHS) {
      entries.push({
        url: absoluteUrl(path, locale),
      });
    }

    entries.push({
      url: absoluteUrl("/pricing", locale),
      changeFrequency: "monthly",
      priority: 0.8,
    });

    entries.push({
      url: absoluteUrl("/posts", locale),
    });
    for (const slug of POST_SLUGS) {
      entries.push({
        url: absoluteUrl(`/posts/${slug}`, locale),
      });
    }

    for (const docPath of DOC_PATHS) {
      entries.push({
        url: absoluteUrl(docPath, locale),
      });
    }
  }

  return entries;
}