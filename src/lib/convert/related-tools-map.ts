import type { ToolInternalLinkHref } from "./tool-internal-link-map";

/** Related tool slugs per current page path (semantic pairing). */
export const RELATED_TOOLS_BY_PATH: Record<
  ToolInternalLinkHref,
  readonly ToolInternalLinkHref[]
> = {
  "/youtube-transcript-generator": [
    "/ai-video-summarizer",
    "/youtube-video-summarizer",
    "/youtube-subtitle-downloader",
  ],
  "/ai-video-summarizer": [
    "/youtube-transcript-generator",
    "/youtube-video-summarizer",
  ],
  "/youtube-video-summarizer": [
    "/ai-video-summarizer",
    "/youtube-transcript-generator",
    "/youtube-subtitle-downloader",
  ],
  "/youtube-subtitle-downloader": [
    "/youtube-transcript-generator",
    "/ai-video-summarizer",
  ],
  "/tiktok-transcript-generator": [
    "/instagram-transcript-generator",
    "/x-transcript-generator",
    "/video-to-text",
  ],
  "/instagram-transcript-generator": [
    "/tiktok-transcript-generator",
    "/facebook-transcript-generator",
    "/video-to-text",
  ],
  "/facebook-transcript-generator": [
    "/instagram-transcript-generator",
    "/x-transcript-generator",
    "/video-to-text",
  ],
  "/x-transcript-generator": [
    "/tiktok-transcript-generator",
    "/instagram-transcript-generator",
    "/facebook-transcript-generator",
  ],
  "/video-to-text": [
    "/audio-to-text-converter",
    "/ai-video-summarizer",
    "/youtube-transcript-generator",
  ],
  "/audio-to-text-converter": ["/video-to-text", "/youtube-transcript-generator"],
};
