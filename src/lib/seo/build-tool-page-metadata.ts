import type { Metadata } from "next";
import { defaultLocale } from "@/i18n/locale";
import { normalizeSeoTitle, SEO_SITE_NAME } from "./page-title";

export function siteOrigin(): string {
  let base = (process.env.NEXT_PUBLIC_WEB_URL || "https://videotranscriber.pro").trim();
  base = base.replace(/\/$/, "");
  if (!/^https?:\/\//i.test(base)) base = `https://${base}`;
  return base;
}

/** Canonical URL without trailing slash (except locale home `/` or `/en/`). */
export function canonicalUrlForPath(path: string, locale: string): string {
  const base = siteOrigin();
  const cleanPath = path.replace(/\/$/, "") || "/";
  if (locale === defaultLocale) {
    return cleanPath === "/" ? `${base}/` : `${base}${cleanPath}`;
  }
  return cleanPath === "/" ? `${base}/${locale}/` : `${base}/${locale}${cleanPath}`;
}

export const DEFAULT_OG_IMAGE_PATH = "/apple-touch-icon.png";

/** 1200×630 share image for indexable landing/pricing pages. */
export const SOCIAL_OG_IMAGE_PATH = "/og-social-1200x630.png";
export const SOCIAL_OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

export const INDEXABLE_ROBOTS: Metadata["robots"] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-video-preview": -1,
    "max-image-preview": "large",
    "max-snippet": -1,
  },
};

export const PRIVATE_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
};

export const AUTH_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: true,
  googleBot: { index: false, follow: true },
};

const defaultRobots: Metadata["robots"] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-video-preview": -1,
    "max-image-preview": "large",
    "max-snippet": -1,
  },
};

export function buildToolPageMetadata({
  path,
  locale,
  title,
  description,
  robots,
}: {
  path: string;
  locale: string;
  title: string;
  description: string;
  robots?: Metadata["robots"];
}): Metadata {
  const normalizedTitle = normalizeSeoTitle(title);
  const url = canonicalUrlForPath(path, locale);
  const base = siteOrigin();
  const imageUrl = `${base}${DEFAULT_OG_IMAGE_PATH}`;

  return {
    title: normalizedTitle,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: normalizedTitle,
      description,
      url: path === "/" ? url : url.replace(/\/$/, ""),
      siteName: SEO_SITE_NAME,
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 180,
          height: 180,
          alt: SEO_SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: normalizedTitle,
      description,
      images: [imageUrl],
    },
    robots: robots ?? defaultRobots,
  };
}