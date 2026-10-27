"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import FaceRatingSiteHeader from "./site-header";
import FaceRatingSiteFooter from "./site-footer";
import WorkspaceNav from "./workspace-nav";
import PromoBanner from "./promo-banner";
import ScrollCta from "./scroll-cta";
import { PlatformMark } from "./platform-mark";
import {
  WORKSPACE_AI_TOOLS_NAV,
  WORKSPACE_DIRECTORY_EXTRA_NAV,
  WORKSPACE_MEDIA_TOOL_NAV,
  WORKSPACE_PLATFORM_TOOL_NAV,
  WORKSPACE_TOOL_NAV,
  type WorkspaceToolNavItem,
} from "./workspace-tool-nav-items";
import { V } from "./visual";

const TOOL_BLURBS: Record<string, string> = {
  "/video-to-text": "Upload MP4, MOV, WebM, or MKV and export transcripts.",
  "/audio-to-text-converter": "Turn recordings and podcasts into editable text.",
  "/mp3-to-srt": "Upload MP3 and export timed SRT or VTT subtitles.",
  "/ai-video-summarizer": "Summarize long videos with AI chapter notes.",
  "/youtube-video-summarizer": "Summarize YouTube videos from a link.",
  "/youtube-subtitle-downloader": "Download captions and subtitles from YouTube.",
  "/youtube-transcript-generator": "Paste a YouTube URL and get a full transcript.",
  "/tiktok-transcript-generator": "Transcribe TikTok videos from a link.",
  "/instagram-transcript-generator": "Generate transcripts from Instagram reels.",
  "/x-transcript-generator": "Transcribe posts and videos from X.",
  "/facebook-transcript-generator": "Get text from Facebook videos and reels.",
};

const HOT_HREFS = new Set([
  "/video-to-text",
  "/youtube-transcript-generator",
  "/ai-video-summarizer",
  "/tiktok-transcript-generator",
  "/facebook-transcript-generator",
]);

function ToolCardIcon({ item }: { item: WorkspaceToolNavItem }) {
  if ("platform" in item) {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-[#E8EAF0]">
        <PlatformMark kind={item.platform} />
      </span>
    );
  }
  const Icon = item.icon;
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#5270FF] shadow-sm ring-1 ring-[#E8EAF0]">
      <Icon className="h-5 w-5" strokeWidth={1.75} />
    </span>
  );
}

function ToolCard({ item }: { item: WorkspaceToolNavItem }) {
  const hot = HOT_HREFS.has(item.href);
  return (
    <Link
      href={item.href}
      className="group relative flex h-full min-h-[128px] gap-3 rounded-xl border border-[#E8EAF0] bg-white p-4 transition-colors hover:border-[#C7D2FE] hover:bg-[#FAFBFF]"
    >
      <ToolCardIcon item={item} />
      <div className="min-w-0 flex-1 pr-5">
        <div className="flex items-start gap-2">
          <h3 className="line-clamp-2 min-h-[2.75rem] flex-1 text-[15px] font-semibold leading-snug text-[#111827] group-hover:text-[#5270FF]">
            {item.label}
          </h3>
          <span
            className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              hot
                ? "bg-[#FEE2E2] text-[#DC2626]"
                : "invisible"
            }`}
            aria-hidden={!hot}
          >
            Hot
          </span>
        </div>
        <p className="line-clamp-2 mt-1 min-h-[2.5rem] text-[13px] leading-snug text-[#64748B]">
          {TOOL_BLURBS[item.href] || "Free online transcription for this format."}
        </p>
      </div>
      <ArrowRight className="absolute right-4 top-4 h-4 w-4 shrink-0 text-[#94A3B8] opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

function ToolSection({
  title,
  items,
}: {
  title: string;
  items: WorkspaceToolNavItem[];
}) {
  return (
    <section className="mt-10">
      <h2 className="text-[18px] font-bold tracking-tight text-[#111827]">{title}</h2>
      <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.href} className="min-w-0">
            <ToolCard item={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function AiToolsPage() {
  return (
    <div
      className="ac-home min-h-screen antialiased"
      style={{
        backgroundColor: "#ffffff",
        color: V.ink,
        fontFamily: "var(--font-lexend), Lexend, ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <PromoBanner />
      <ScrollCta />

      <div className="flex min-h-0">
        <WorkspaceNav />
        <div className="min-w-0 flex-1 pb-[4.75rem] md:pb-0">
          <FaceRatingSiteHeader hideBrandOnDesktop />

          <main className="px-4 py-8 sm:px-8 sm:py-10">
            <div className="mx-auto max-w-[1152px]">
              <h1 className="text-[28px] font-bold tracking-tight text-[#111827] sm:text-[32px]">
                AI Transcript Tools
              </h1>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#64748B]">
                Browse transcription tools for video, audio, and social platforms—pick
                one to start free.
              </p>

              <ToolSection title="Popular tools" items={WORKSPACE_TOOL_NAV} />

              <ToolSection
                title="Video & audio transcriber"
                items={[...WORKSPACE_MEDIA_TOOL_NAV, ...WORKSPACE_DIRECTORY_EXTRA_NAV]}
              />

              <ToolSection title="AI summarizer & subtitles" items={WORKSPACE_AI_TOOLS_NAV} />

              <ToolSection
                title="Social & platform generators"
                items={WORKSPACE_PLATFORM_TOOL_NAV}
              />
            </div>
          </main>

          <FaceRatingSiteFooter />
        </div>
      </div>
    </div>
  );
}
