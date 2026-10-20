import type { LucideIcon } from "lucide-react";
import { FileVideo, Mic, Sparkles, Subtitles } from "lucide-react";
import { AI_VIDEO_SUMMARIZER_HREF } from "@/lib/convert/ai-video-summarizer-content";
import { AUDIO_TO_TEXT_CONVERTER_HREF } from "@/lib/convert/audio-to-text-converter-content";
import { FACEBOOK_TRANSCRIPT_GENERATOR_HREF } from "@/lib/convert/facebook-transcript-generator-content";
import { INSTAGRAM_TRANSCRIPT_GENERATOR_HREF } from "@/lib/convert/instagram-transcript-generator-content";
import { TIKTOK_TRANSCRIPT_GENERATOR_HREF } from "@/lib/convert/tiktok-transcript-generator-content";
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

/** Tool landing pages — order matches competitor-style side nav (transcript → social → file → audio → AI). */
export const WORKSPACE_TOOL_NAV: WorkspaceToolNavItem[] = [
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

export function isToolNavActive(pathname: string, href: string): boolean {
  const path = pathname.replace(/\/$/, "") || "/";
  const target = href.replace(/\/$/, "") || "/";
  if (target === "/") return path === "/";
  return path === target || path.startsWith(`${target}/`);
}
