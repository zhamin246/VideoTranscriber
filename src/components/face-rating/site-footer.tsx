import Link from "next/link";
import { CONVERT_HREF } from "./data";
import { AUDIO_TO_TEXT_CONVERTER_HREF } from "@/lib/convert/audio-to-text-converter-content";
import { VIDEO_TO_TEXT_CONVERTER_HREF } from "@/lib/convert/video-to-text-converter-content";
import { AI_VIDEO_SUMMARIZER_HREF } from "@/lib/convert/ai-video-summarizer-content";
import { YOUTUBE_SUBTITLE_DOWNLOADER_HREF } from "@/lib/convert/youtube-subtitle-downloader-content";
import { YOUTUBE_TRANSCRIPT_GENERATOR_HREF } from "@/lib/convert/youtube-transcript-generator-content";

type FooterLink = { label: string; href: string };

type FooterGroup = {
  title: string;
  links: FooterLink[];
  more?: FooterLink;
};

/** 4 columns matching videotranscriber.ai footer layout */
const COLUMNS: FooterGroup[][] = [
  [
    {
      title: "Popular Tools",
      links: [
        { label: "Video to Text Converter", href: VIDEO_TO_TEXT_CONVERTER_HREF },
        { label: "Audio to Text Converter", href: AUDIO_TO_TEXT_CONVERTER_HREF },
        { label: "YouTube Transcript Generator", href: YOUTUBE_TRANSCRIPT_GENERATOR_HREF },
        { label: "AI Video Summarizer", href: AI_VIDEO_SUMMARIZER_HREF },
        { label: "YouTube Subtitle Downloader", href: YOUTUBE_SUBTITLE_DOWNLOADER_HREF },
        { label: "TikTok Transcript Generator", href: CONVERT_HREF },
        { label: "Facebook Transcript Generator", href: CONVERT_HREF },
        { label: "AI Video Translator", href: CONVERT_HREF },
        { label: "AI Medical Dictation", href: CONVERT_HREF },
        { label: "Legal Transcription", href: CONVERT_HREF },
      ],
    },
    {
      title: "Video Transcriber",
      links: [
        { label: "Video Transcript Generator", href: CONVERT_HREF },
        { label: "MP4 to Text Converter", href: CONVERT_HREF },
        { label: "Video to SRT Converter", href: CONVERT_HREF },
        { label: "Time Code Transcription", href: CONVERT_HREF },
        { label: "Speaker Label in Transcription", href: CONVERT_HREF },
      ],
    },
    {
      title: "Audio Transcriber",
      links: [
        { label: "Speech to Text AI", href: CONVERT_HREF },
        { label: "Voice to Text Generator", href: CONVERT_HREF },
        { label: "MP3 to Text Converter", href: CONVERT_HREF },
        { label: "Audio to SRT Converter", href: CONVERT_HREF },
        { label: "M4A to Text Converter", href: CONVERT_HREF },
        { label: "WAV to Text", href: CONVERT_HREF },
      ],
    },
  ],
  [
    {
      title: "YouTube Transcriber",
      links: [
        { label: "YouTube to Transcript", href: CONVERT_HREF },
        { label: "YouTube to Text Converter", href: CONVERT_HREF },
        { label: "YouTube Subtitle Generator", href: CONVERT_HREF },
        { label: "YouTube Video Summarizer", href: CONVERT_HREF },
        { label: "YouTube Transcript Downloader", href: CONVERT_HREF },
      ],
    },
    {
      title: "Social Media Transcriber",
      links: [
        { label: "Instagram Transcript Generator", href: CONVERT_HREF },
        { label: "X Transcript Generator", href: CONVERT_HREF },
        { label: "Bilibili Transcript Generator", href: CONVERT_HREF },
      ],
    },
    {
      title: "AI Translator",
      links: [
        { label: "YouTube Video Translator", href: CONVERT_HREF },
        { label: "AI Audio Translator", href: CONVERT_HREF },
      ],
    },
    {
      title: "Meetings & Business",
      links: [
        { label: "AI Meeting Note Taker", href: "/#usecases" },
        { label: "AI Meeting Minutes Generator", href: "/#usecases" },
        { label: "Interview Transcription", href: "/#usecases" },
        { label: "Sales Call Transcription", href: "/#usecases" },
        { label: "AI Webinar Transcription", href: "/#usecases" },
        { label: "AI Voice Recorder", href: CONVERT_HREF },
      ],
    },
    {
      title: "Learning & Content",
      links: [
        { label: "AI Lecture Note Taker", href: "/#usecases" },
        { label: "Study Notes Generator", href: "/#usecases" },
        { label: "Podcast to Transcript", href: "/#usecases" },
      ],
    },
  ],
  [
    {
      title: "AI Medical Transcriber",
      links: [
        { label: "AI Medical Transcription", href: CONVERT_HREF },
        { label: "AI Medical Scribe", href: CONVERT_HREF },
        { label: "AI SOAP Note Generator", href: CONVERT_HREF },
        { label: "AI H&P Note Generator", href: CONVERT_HREF },
        { label: "AI Clinical Note Generator", href: CONVERT_HREF },
        { label: "AI Nursing Note Taker", href: CONVERT_HREF },
        { label: "AI Therapy Note Generator", href: CONVERT_HREF },
        { label: "AI Progress Note Generator", href: CONVERT_HREF },
        { label: "AI Discharge Summary Generator", href: CONVERT_HREF },
        { label: "AI Medical Records Summary", href: CONVERT_HREF },
      ],
    },
    {
      title: "AI Legal Transcriber",
      links: [
        { label: "Legal Dictation Software", href: CONVERT_HREF },
        { label: "Court Transcript", href: CONVERT_HREF },
        { label: "Deposition Transcript", href: CONVERT_HREF },
        { label: "Witness Statement Transcript", href: CONVERT_HREF },
        { label: "Hearing Transcript", href: CONVERT_HREF },
        { label: "Trial Transcript", href: CONVERT_HREF },
      ],
      more: { label: "All AI Transcript Tools >>", href: CONVERT_HREF },
    },
  ],
  [
    {
      title: "Compare",
      links: [
        { label: "Video Transcriber AI vs HappyScribe", href: "/pricing" },
        { label: "Video Transcriber AI vs Evernote", href: "/pricing" },
        { label: "Video Transcriber AI vs Descript", href: "/pricing" },
        { label: "Video Transcriber AI vs Any2Text", href: "/pricing" },
        { label: "Video Transcriber AI vs Restream", href: "/pricing" },
        { label: "Video Transcriber AI vs TurboScribe", href: "/pricing" },
      ],
      more: { label: "See all comparisons >>", href: "/pricing" },
    },
    {
      title: "About",
      links: [
        { label: "Pricing", href: "/pricing" },
        { label: "Blog", href: "/" },
        { label: "Privacy", href: "/privacy-policy" },
        { label: "Extension Privacy", href: "/privacy-policy" },
        { label: "Terms", href: "/terms-of-service" },
        { label: "Contact Us", href: "mailto:support@videotranscriber.pro" },
        { label: "Help Center", href: "/#faq" },
        { label: "Copyright Claims", href: "/terms-of-service" },
        { label: "Transcript API", href: "/" },
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

function BrandMark() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <img
        src="/favicon.svg"
        alt=""
        width={32}
        height={32}
        className="h-8 w-8 object-contain"
      />
      <span className="text-xl font-bold tracking-tight text-[#5270FF]">
        Video Transcriber
      </span>
    </span>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.924L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.56A3.02 3.02 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3.02 3.02 0 0 0 2.12 2.14C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.56a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8zM9.75 15.5v-7L15.5 12l-5.75 3.5z" />
    </svg>
  );
}

function FooterGroupBlock({ group }: { group: FooterGroup }) {
  return (
    <div className="mb-8 last:mb-0">
      <p className="mb-3 text-sm font-semibold text-[#0F172A]">{group.title}</p>
      <ul className="space-y-2">
        {group.links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-sm leading-5 text-[#64748B] transition-colors hover:text-[#0F172A] hover:underline"
            >
              {l.label}
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
}: {
  compact?: boolean;
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
            aria-label="Go to Video Transcriber homepage"
          >
            <BrandMark />
          </Link>
          <p className="text-sm text-slate-600 md:ml-8">
            <span className="font-medium text-slate-800">Video Transcriber AI</span>
            {" – "}
            Transcribe Video to Text Online Free
          </p>
          <div className="flex flex-wrap items-center gap-4 md:ml-auto">
            <Link
              href="mailto:support@videotranscriber.pro"
              className="text-sm text-slate-600 transition-colors hover:text-[#1C6CFB]"
            >
              Feedback
            </Link>
            <a
              href="https://x.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X"
              className="text-slate-500 transition-colors hover:text-[#1C6CFB]"
            >
              <XIcon className="h-5 w-5" />
            </a>
            <a
              href="https://discord.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Discord"
              className="text-slate-500 transition-colors hover:text-[#1C6CFB]"
            >
              <DiscordIcon className="h-5 w-5" />
            </a>
            <a
              href="https://www.youtube.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="text-slate-500 transition-colors hover:text-[#1C6CFB]"
            >
              <YouTubeIcon className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-1 gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          {COLUMNS.map((col, i) => (
            <div key={i}>
              {col.map((group) => (
                <FooterGroupBlock key={group.title} group={group} />
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
