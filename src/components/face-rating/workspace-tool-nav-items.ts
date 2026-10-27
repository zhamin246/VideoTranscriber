import type { LucideIcon } from "lucide-react";
import { FileVideo, Mic, Sparkles, Subtitles } from "lucide-react";
import { AI_VIDEO_SUMMARIZER_HREF } from "@/lib/convert/ai-video-summarizer-content";
import { AUDIO_TO_TEXT_CONVERTER_HREF } from "@/lib/convert/audio-to-text-converter-content";
import { FACEBOOK_TRANSCRIPT_GENERATOR_HREF } from "@/lib/convert/facebook-transcript-generator-content";
import { INSTAGRAM_TRANSCRIPT_GENERATOR_HREF } from "@/lib/convert/instagram-transcript-generator-content";
import { TIKTOK_TRANSCRIPT_GENERATOR_HREF } from "@/lib/convert/tiktok-transcript-generator-content";
import { MP3_TO_SRT_HREF } from "@/lib/convert/mp3-to-srt-content";
import { VIDEO_TO_TEXT_CONVERTER_HREF } from "@/lib/convert/video-to-text-converter-content";
import { X_TRANSCRIPT_GENERATOR_HREF } from "@/lib/convert/x-transcript-generator-content";
import { YOUTUBE_SUBTITLE_DOWNLOADER_HREF } from "@/lib/convert/youtube-subtitle-downloader-content";
import { YOUTUBE_TRANSCRIPT_GENERATOR_HREF } from "@/lib/convert/youtube-transcript-generator-content";
import { YOUTUBE_VIDEO_SUMMARIZER_HREF } from "@/lib/convert/youtube-video-summarizer-content";

export type WorkspaceToolNavItem =
  | {
      label: string;
      href: string;
      icon: LucideIcon;
    }
  | {
      label: string;
      href: string;
      platform: "youtube" | "tiktok" | "instagram" | "x" | "facebook";
    };

/** Sidebar — directly under Home. */
export const WORKSPACE_MEDIA_TOOL_NAV: WorkspaceToolNavItem[] = [
  {
    label: "Video to Text",
    href: VIDEO_TO_TEXT_CONVERTER_HREF,
    icon: FileVideo,
  },
  {
    label: "Audio to Text",
    href: AUDIO_TO_TEXT_CONVERTER_HREF,
    icon: Mic,
  },
];

/** Primary side nav — social / platform transcript generators. */
export const WORKSPACE_PLATFORM_TOOL_NAV: WorkspaceToolNavItem[] = [
  {
    label: "YouTube Transcript Generator",
    href: YOUTUBE_TRANSCRIPT_GENERATOR_HREF,
    platform: "youtube",
  },
  {
    label: "TikTok Transcript Generator",
    href: TIKTOK_TRANSCRIPT_GENERATOR_HREF,
    platform: "tiktok",
  },
  {
    label: "Instagram Transcript Generator",
    href: INSTAGRAM_TRANSCRIPT_GENERATOR_HREF,
    platform: "instagram",
  },
  {
    label: "X Transcript Generator",
    href: X_TRANSCRIPT_GENERATOR_HREF,
    platform: "x",
  },
  {
    label: "Facebook Transcript Generator",
    href: FACEBOOK_TRANSCRIPT_GENERATOR_HREF,
    platform: "facebook",
  },
];

/** /ai-tools + header/footer — not shown in workspace sidebar. */
export const WORKSPACE_DIRECTORY_EXTRA_NAV: WorkspaceToolNavItem[] = [
  {
    label: "MP3 to SRT",
    href: MP3_TO_SRT_HREF,
    icon: Subtitles,
  },
];

/** Summarizer & subtitle tools — /ai-tools hub and sidebar link target. */
export const WORKSPACE_AI_TOOLS_NAV: WorkspaceToolNavItem[] = [
  {
    label: "AI Video Summarizer",
    href: AI_VIDEO_SUMMARIZER_HREF,
    icon: Sparkles,
  },
  {
    label: "YouTube Video Summarizer",
    href: YOUTUBE_VIDEO_SUMMARIZER_HREF,
    platform: "youtube",
  },
  {
    label: "YouTube Subtitle Downloader",
    href: YOUTUBE_SUBTITLE_DOWNLOADER_HREF,
    icon: Subtitles,
  },
];

/** All tool landing pages (media + platform + AI tools). */
export const WORKSPACE_TOOL_NAV: WorkspaceToolNavItem[] = [
  ...WORKSPACE_MEDIA_TOOL_NAV,
  ...WORKSPACE_DIRECTORY_EXTRA_NAV,
  ...WORKSPACE_PLATFORM_TOOL_NAV,
  ...WORKSPACE_AI_TOOLS_NAV,
];

export const AI_TOOLS_HREF = "/ai-tools";

export function isAiToolsHubActive(pathname: string): boolean {
  const path = pathname.replace(/\/$/, "") || "/";
  if (path === AI_TOOLS_HREF) return true;
  return [...WORKSPACE_AI_TOOLS_NAV, ...WORKSPACE_DIRECTORY_EXTRA_NAV].some((item) =>
    isToolNavActive(pathname, item.href),
  );
}

export function isToolNavActive(pathname: string, href: string): boolean {
  const path = pathname.replace(/\/$/, "") || "/";
  const target = href.replace(/\/$/, "") || "/";
  if (target === "/") return path === "/";
  return path === target || path.startsWith(`${target}/`);
}
