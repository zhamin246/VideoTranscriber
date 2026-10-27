/**
 * Canonical tool URLs (see app/sitemap.ts) and anchor text = target keyword.
 * Single source for footer nav labels and contextual in-body links.
 */
export const TOOL_INTERNAL_LINKS = [
  { href: "/video-to-text", anchor: "Video to Text" },
  { href: "/ai-video-summarizer", anchor: "AI Video Summarizer" },
  { href: "/audio-to-text-converter", anchor: "Audio to Text" },
  { href: "/mp3-to-srt", anchor: "MP3 to SRT" },
  { href: "/youtube-transcript-generator", anchor: "YouTube Transcript Generator" },
  { href: "/youtube-video-summarizer", anchor: "YouTube Video Summarizer" },
  { href: "/youtube-subtitle-downloader", anchor: "YouTube Subtitle Downloader" },
  { href: "/tiktok-transcript-generator", anchor: "TikTok Transcript Generator" },
  { href: "/instagram-transcript-generator", anchor: "Instagram Transcript Generator" },
  { href: "/facebook-transcript-generator", anchor: "Facebook Transcript Generator" },
  { href: "/x-transcript-generator", anchor: "X Transcript Generator" },
] as const;

export type ToolInternalLinkHref = (typeof TOOL_INTERNAL_LINKS)[number]["href"];

export const TOOL_ANCHOR_BY_HREF: Record<ToolInternalLinkHref, string> =
  Object.fromEntries(TOOL_INTERNAL_LINKS.map((t) => [t.href, t.anchor])) as Record<
    ToolInternalLinkHref,
    string
  >;

/** In-body markers: [[Anchor text|/path]] */
export const INTERNAL_LINK_MARKER = /\[\[([^|\]]+)\|([^\]]+)\]\]/g;
