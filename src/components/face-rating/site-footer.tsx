import Link from "next/link";
import { CONVERT_HREF } from "./data";
import { AUDIO_TO_TEXT_CONVERTER_HREF } from "@/lib/convert/audio-to-text-converter-content";
import { AI_VIDEO_SUMMARIZER_HREF } from "@/lib/convert/ai-video-summarizer-content";
import { YOUTUBE_SUBTITLE_DOWNLOADER_HREF } from "@/lib/convert/youtube-subtitle-downloader-content";
import { YOUTUBE_TRANSCRIPT_GENERATOR_HREF } from "@/lib/convert/youtube-transcript-generator-content";
import { TIKTOK_TRANSCRIPT_GENERATOR_HREF } from "@/lib/convert/tiktok-transcript-generator-content";
import { INSTAGRAM_TRANSCRIPT_GENERATOR_HREF } from "@/lib/convert/instagram-transcript-generator-content";
import { softenToTextLabel } from "./nav-labels";

type FooterLink = { label: string; href: string };

type FooterGroup = {
  title: string;
  links: FooterLink[];
  more?: FooterLink;
};

/** Link columns: real pages only. */
const COLUMNS: FooterGroup[][] = [
  [
    {
      title: "Video Transcriber",
      links: [
        { label: "Video to Text", href: CONVERT_HREF },
        { label: "AI Video Summarizer", href: AI_VIDEO_SUMMARIZER_HREF },
      ],
    },
  ],
  [
    {
      title: "Audio Transcriber",
      links: [
        { label: "Audio to Text", href: AUDIO_TO_TEXT_CONVERTER_HREF },
      ],
    },
    {
      title: "Social Media Transcriber",
      links: [
        { label: "YouTube Transcript Generator", href: YOUTUBE_TRANSCRIPT_GENERATOR_HREF },
        { label: "YouTube Subtitle Downloader", href: YOUTUBE_SUBTITLE_DOWNLOADER_HREF },
        { label: "TikTok Transcript Generator", href: TIKTOK_TRANSCRIPT_GENERATOR_HREF },
        { label: "Instagram Transcript Generator", href: INSTAGRAM_TRANSCRIPT_GENERATOR_HREF },
      ],
    },
  ],
  [
    {
      title: "About",
      links: [
        { label: "Pricing", href: "/pricing" },
        { label: "Blog", href: "/posts" },
        { label: "Privacy", href: "/privacy-policy" },
        { label: "Terms", href: "/terms-of-service" },
        { label: "Contact Us", href: "mailto:support@videotranscriber.pro" },
        { label: "Help Center", href: "/#faq" },
      ],
    },
  ],
];

const LANGUAGES = [
  "English",
  "简体中文",
  "繁體中文",
  "日本語",
  "한국어",
  "Español",
  "Português",
  "Français",
  "Bahasa Indonesia",
  "Deutsch",
  "Русский",
] as const;

function BrandMark({ hideName = false }: { hideName?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <img
        src="/favicon.svg"
        alt=""
        width={32}
        height={32}
        className="h-8 w-8 object-contain"
      />
      {hideName ? null : (
        <span className="text-xl font-bold tracking-tight text-[#5270FF]">
          Video Transcriber
        </span>
      )}
    </span>
  );
}

function FooterGroupBlock({
  group,
  softenToTextAnchors = false,
}: {
  group: FooterGroup;
  softenToTextAnchors?: boolean;
}) {
  return (
    <div className="mb-8 last:mb-0">
      <p className="mb-3 text-sm font-semibold text-[#0F172A]">
        {softenToTextAnchors ? softenToTextLabel(group.title) : group.title}
      </p>
      <ul className="space-y-2">
        {group.links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-sm leading-5 text-[#64748B] transition-colors hover:text-[#0F172A] hover:underline"
            >
              {softenToTextAnchors ? softenToTextLabel(l.label) : l.label}
            </Link>
          </li>
        ))}
      </ul>
      {group.more ? (
        <Link
          href={group.more.href}
          className="mt-3 inline-block text-sm font-medium text-[#1C6CFB] hover:underline"
        >
          {group.more.label}
        </Link>
      ) : null}
    </div>
  );
}

export default function FaceRatingSiteFooter({
  compact = false,
  softenToTextAnchors = false,
}: {
  compact?: boolean;
  softenToTextAnchors?: boolean;
}) {
  return (
    <footer
      className="border-t border-slate-200 bg-[#F8FAFC] text-slate-700"
      style={{
        fontFamily:
          "var(--font-lexend), Lexend, ui-sans-serif, system-ui, sans-serif",
        paddingTop: compact ? 16 : 24,
      }}
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        {/* Brand row */}
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-center">
          <Link
            href="/"
            className="inline-flex shrink-0"
            aria-label={softenToTextAnchors ? "Home" : "Go to Video Transcriber homepage"}
          >
            <BrandMark hideName={softenToTextAnchors} />
          </Link>
          <p className="text-sm text-slate-600 md:ml-8">
            {softenToTextAnchors ? (
              "Transcribe video online free"
            ) : (
              <>
                <span className="font-medium text-slate-800">Video Transcriber AI</span>
                {" – Transcribe Video to Text Online Free"}
              </>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-4 md:ml-auto">
            <Link
              href="mailto:support@videotranscriber.pro"
              className="text-sm text-slate-600 transition-colors hover:text-[#1C6CFB]"
            >
              Feedback
            </Link>
          </div>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-1 gap-8 py-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
          {COLUMNS.map((col, i) => (
            <div key={i}>
              {col.map((group) => (
                <FooterGroupBlock
                  key={group.title}
                  group={group}
                  softenToTextAnchors={softenToTextAnchors}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Languages + copyright */}
        <div className="border-t border-slate-200 py-6 text-center">
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            {LANGUAGES.map((lang) => {
              const active = lang === "English";
              return (
                <Link
                  key={lang}
                  href="/"
                  className={`rounded-md px-2 py-1 text-sm transition-colors ${
                    active
                      ? "bg-[#1C6CFB]/15 font-medium text-[#1C6CFB]"
                      : "text-slate-500 hover:text-[#1C6CFB]"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {lang}
                </Link>
              );
            })}
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Copyright {new Date().getFullYear()} videotranscriber.ai. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
