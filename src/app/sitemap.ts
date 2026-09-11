import type { MetadataRoute } from "next";
import { defaultLocale, locales } from "@/i18n/locale";

function siteOrigin() {
  let base = (process.env.NEXT_PUBLIC_WEB_URL || "https://videotranscriber.pro").trim();
  base = base.replace(/\/$/, "");
  if (!/^https?:\/\//i.test(base)) base = `https://${base}`;
  return base;
}

/**
 * Public indexable routes only.
 * Pricing, legal pages, and workspace stay out of the sitemap.
 */
const STATIC_PATHS: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/video-to-text-converter", changeFrequency: "weekly", priority: 0.9 },
  { path: "/audio-to-text-converter", changeFrequency: "weekly", priority: 0.9 },
  { path: "/youtube-transcript-generator", changeFrequency: "weekly", priority: 0.9 },
  { path: "/ai-video-summarizer", changeFrequency: "weekly", priority: 0.9 },
  { path: "/youtube-subtitle-downloader", changeFrequency: "weekly", priority: 0.9 },
];

function absoluteUrl(path: string, locale: string): string {
  const base = siteOrigin();
  if (locale === defaultLocale) {
    return path === "/" ? base : `${base}${path}`;
  }
  return path === "/" ? `${base}/${locale}` : `${base}/${locale}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const item of STATIC_PATHS) {
      entries.push({
        url: absoluteUrl(item.path, locale),
        lastModified: now,
        changeFrequency: item.changeFrequency,
        priority: item.priority,
      });
    }
  }

  return entries;
}
