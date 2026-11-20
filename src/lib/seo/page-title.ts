/**
 * Central SEO title rules — em dash (—) only; never pipe or slash before brand.
 */

export const SEO_SITE_NAME = "Video Transcriber";
export const SEO_TITLE_SEPARATOR = " — ";

/** Normalize legacy `| Video Transcriber` / `/ Video Transcriber` suffixes to em dash. */
export function normalizeSeoTitle(title: string): string {
  let t = title.trim();
  t = t.replace(/\s*\/\s*Video Transcriber\s*$/i, `${SEO_TITLE_SEPARATOR}${SEO_SITE_NAME}`);
  t = t.replace(/\s*\|\s*Video Transcriber\s*$/i, `${SEO_TITLE_SEPARATOR}${SEO_SITE_NAME}`);
  return t;
}

/** Optional: `headline — Video Transcriber` when the title has no brand yet. */
export function withSiteBrand(headline: string): string {
  const t = headline.trim();
  if (new RegExp(`${SEO_SITE_NAME}\\s*$`, "i").test(t)) return t;
  if (t.includes(SEO_TITLE_SEPARATOR)) return t;
  return `${t}${SEO_TITLE_SEPARATOR}${SEO_SITE_NAME}`;
}