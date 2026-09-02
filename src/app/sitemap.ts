import type { MetadataRoute } from "next";
import { defaultLocale, locales } from "@/i18n/locale";

function siteOrigin() {
  let base = (process.env.NEXT_PUBLIC_WEB_URL || "https://imagetocad.app").trim();
  base = base.replace(/\/$/, "");
  if (!/^https?:\/\//i.test(base)) base = `https://${base}`;
  return base;
}

/**
 * Public indexable routes for imagetocad.
 * Auth, dashboard, and Face Rating leftovers stay out.
 */
const STATIC_PATHS: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.9 },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.4 },
  { path: "/terms-of-service", changeFrequency: "yearly", priority: 0.4 },
  { path: "/refund-policy", changeFrequency: "yearly", priority: 0.4 },
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
