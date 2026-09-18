import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  AudioLines,
  FileUp,
  GraduationCap,
  Link2,
  Mic,
  Podcast,
  Sparkles,
  Subtitles,
  Users,
  UsersRound,
  Youtube,
} from "lucide-react";
import FaceRatingSiteHeader from "./site-header";
import FaceRatingFaq from "./faq";
import FaceRatingSiteFooter from "./site-footer";
import HeroUpload from "./hero-upload";
import MediaFilesStrip from "./media-files-strip";
import WorkspaceNav from "./workspace-nav";
import PromoBanner from "./promo-banner";
import ReviewMarquee from "./review-marquee";
import MoreTools from "./more-tools";
import ScrollCta from "./scroll-cta";
import { content, CONVERT_HREF } from "./data";
import { AUDIO_TO_TEXT_CONVERTER_HREF } from "@/lib/convert/audio-to-text-converter-content";
import { YOUTUBE_TRANSCRIPT_GENERATOR_HREF } from "@/lib/convert/youtube-transcript-generator-content";
import { V } from "./visual";
import { useCaseAsset } from "@/lib/convert/use-case-assets";

/**
 * THESIS: AudioCleaner-style converter home — upload well first, not a split face hero.
 * OWN-WORLD: white paper, Lexend, lilac #8882F5, dashed drop well, marquee chips.
 * STORY: drop a photo, get DXF/SVG/PDF linework, try three conversions free.
 * FIRST VIEWPORT: promo bar, header, centered H1, subtitle, purple dropzone.
 * FORM: competitor-canon AudioCleaner layout mapped to transcription.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
 */

const AUDIENCE: { label: string; dot: string }[] = [
  { label: "Architects", dot: "#8882F5" },
  { label: "Product designers", dot: "#6D8DF7" },
  { label: "Laser shops", dot: "#4FB7E9" },
  { label: "Fashion studios", dot: "#A78BFA" },
  { label: "Patent drafters", dot: "#41C5B6" },
  { label: "CNC shops", dot: "#7AA7FF" },
  { label: "Illustrators", dot: "#5EC6E8" },
  { label: "Makers", dot: "#6EE7C8" },
  { label: "Educators", dot: "#8882F5" },
  { label: "Fabricators", dot: "#6D8DF7" },
];

const LOGOS = [
  { src: "/logos/google.svg", alt: "Google" },
  { src: "/logos/spotify.svg", alt: "Spotify" },
  { src: "/logos/microsoft.svg", alt: "Microsoft" },
  { src: "/logos/amazon.svg", alt: "Amazon" },
  { src: "/logos/tiktok.svg", alt: "TikTok" },
  { src: "/logos/netflix.svg", alt: "Netflix" },
];

function AudienceMarquee() {
  const row = [...AUDIENCE, ...AUDIENCE];
  return (
    <div className="overflow-hidden">
      <div className="ac-marquee flex w-max" style={{ gap: 12 }}>
        {row.map((item, i) => (
          <span
            key={`${item.label}-${i}`}
            className="inline-flex shrink-0 items-center"
            style={{
              height: 52,
              padding: "12px 19px",
              borderRadius: 9999,
              fontSize: 16,
              fontWeight: 700,
              color: "rgb(51, 65, 85)",
              backgroundColor: "rgba(255,255,255,0.9)",
              border: "0.8px solid rgb(194, 207, 253)",
              gap: 10,
            }}
          >
            <span
              className="shrink-0 rounded-full"
              style={{ width: 11, height: 11, backgroundColor: item.dot }}
            />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function TrustStars() {
  return (
    <span className="inline-flex" style={{ gap: 2, color: "rgb(242, 169, 0)" }} aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.6l2.7 6.4 6.9.6-5.2 4.6 1.6 6.7L12 17.8 5.99 20.9l1.62-6.7L2.4 9.6l6.9-.6L12 2.6z" />
        </svg>
      ))}
    </span>
  );
}

export default function FaceRatingLandingPage() {
  const { hero, cta } = content;

  return (
    <div
      className="ac-home min-h-screen antialiased"
      style={{
        backgroundColor: "#ffffff",
        color: V.ink,
        fontFamily: "var(--font-lexend), Lexend, ui-sans-serif, system-ui, sans-serif",
        fontSize: 16,
      }}
    >
      <PromoBanner />
      <ScrollCta />

      <div className="flex min-h-0">
        <WorkspaceNav />
        <div className="min-w-0 flex-1">
      <FaceRatingSiteHeader hideBrandOnDesktop />

      <main>
        <section id="landing-hero" className="ac-section-wash px-4 pb-6 pt-6 sm:px-8 sm:pb-8 sm:pt-10">
          <div className="mx-auto max-w-[1152px] text-center sm:pb-2.5">
            <h1 className="text-[28px] font-bold leading-[1.2] tracking-tight text-[#111827] sm:text-[36px] sm:leading-[46px] md:text-[40px] md:leading-[50px]">
              Get Video to Text from a File or Public Link
            </h1>
            <p className="mx-auto mt-2 max-w-3xl text-[15px] font-normal leading-6 text-[#4B5563] sm:mt-2 sm:text-lg sm:leading-[27px]">
              {hero.description}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:mt-4 sm:gap-x-5">
              {(
                [
                  { label: "File upload", icon: FileUp, color: "#3B82F6" },
                  { label: "Link paste", icon: Link2, color: "#60A5FA" },
                  { label: "Speaker labels", icon: UsersRound, color: "#14B8A6" },
                  { label: "SRT & VTT export", icon: Subtitles, color: "#38BDF8" },
                  { label: "AI notes", icon: Sparkles, color: "#8882F5" },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                return (
                  <span
                    key={item.label}
                    className="inline-flex items-center gap-1 text-[12px] sm:gap-1.5 sm:text-sm"
                    style={{ color: "#475569" }}
                  >
                    <Icon
                      className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                      style={{ color: item.color }}
                      strokeWidth={2}
                    />
                    {item.label}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="mt-5 sm:mt-8">
            <HeroUpload />
          </div>
          <p className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-2 px-4 text-sm text-slate-600">
            <span>Looking for a specific start?</span>
            <Link href={AUDIO_TO_TEXT_CONVERTER_HREF} className="font-medium text-[#6F68F0] underline-offset-2 hover:underline">
              Audio files
            </Link>
            <span aria-hidden>·</span>
            <Link href={YOUTUBE_TRANSCRIPT_GENERATOR_HREF} className="font-medium text-[#6F68F0] underline-offset-2 hover:underline">
              YouTube links
            </Link>
          </p>
          <MediaFilesStrip />
        </section>

        <section
          className="ac-section-wash overflow-hidden"
          style={{ padding: "56px 16px 72px" }}
        >
          <div className="mx-auto max-w-[1200px]" style={{ padding: "32px 31px 36px" }}>
            <div className="grid gap-4 sm:grid-cols-3" style={{ gap: 16 }}>
              <div
                className="relative overflow-hidden text-center"
                style={{
                  minHeight: 129,
                  padding: "21px 16px",
                  borderRadius: 16,
                  background: "rgba(136, 130, 245, 0.07)",
                  border: "0.8px solid rgba(136, 130, 245, 0.16)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
                }}
              >
                <span
                  className="absolute bottom-0 left-0 top-0"
                  style={{ width: 4, background: "#8882F5" }}
                />
                <div className="flex items-center justify-center gap-2">
                  <span style={{ fontSize: 44, fontWeight: 800, lineHeight: "44px", color: "rgb(242, 169, 0)" }}>
                    4.9
                  </span>
                  <TrustStars />
                </div>
                <p style={{ marginTop: 8, fontSize: 18, fontWeight: 700, color: "rgb(100, 116, 139)" }}>
                  User rating
                </p>
              </div>
              <div
                className="relative overflow-hidden text-center"
                style={{
                  minHeight: 129,
                  padding: "21px 16px",
                  borderRadius: 16,
                  background: "rgba(136, 130, 245, 0.07)",
                  border: "0.8px solid rgba(136, 130, 245, 0.16)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
                }}
              >
                <span
                  className="absolute bottom-0 left-0 top-0"
                  style={{ width: 4, background: "#8882F5" }}
                />
                <p style={{ fontSize: 38, fontWeight: 800, lineHeight: "38px", color: "rgb(23, 32, 51)" }}>
                  30,000,000+
                </p>
                <p style={{ marginTop: 8, fontSize: 18, fontWeight: 700, color: "rgb(100, 116, 139)" }}>
                  Files processed
                </p>
              </div>
              <div
                className="relative overflow-hidden text-center"
                style={{
                  minHeight: 129,
                  padding: "21px 16px",
                  borderRadius: 16,
                  background: "rgba(136, 130, 245, 0.07)",
                  border: "0.8px solid rgba(136, 130, 245, 0.16)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
                }}
              >
                <span
                  className="absolute bottom-0 left-0 top-0"
                  style={{ width: 4, background: "#8882F5" }}
                />
                <p style={{ fontSize: 44, fontWeight: 800, lineHeight: "44px", color: "rgb(23, 32, 51)" }}>
                  190+
                </p>
                <p style={{ marginTop: 8, fontSize: 18, fontWeight: 700, color: "rgb(100, 116, 139)" }}>
                  Countries served
                </p>
              </div>
            </div>

            <p
              className="text-center"
              style={{
                marginTop: 40,
                marginBottom: 16,
                fontSize: 36,
                fontWeight: 700,
                color: "rgb(51, 65, 85)",
              }}
            >
              Recognized Globally
            </p>
            <p className="mb-8 text-center text-lg text-slate-500">
              Relied on by top organizations and trusted by innovators.
            </p>
            <div
              className="relative overflow-hidden"
              style={{
                WebkitMaskImage: "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)",
                maskImage: "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)",
              }}
            >
              <div className="ac-marquee flex w-max items-center" style={{ animationDuration: "35s" }}>
                {[...LOGOS, ...LOGOS, ...LOGOS].map((logo, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <div
                    key={`${logo.alt}-${i}`}
                    className="mx-4 flex h-32 w-48 flex-shrink-0 items-center justify-center"
                  >
                    <img
                      src={logo.src}
                      alt={logo.alt}
                      className="max-h-full max-w-full object-contain grayscale transition-all duration-300 hover:grayscale-0"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8">
              <AudienceMarquee />
            </div>
          </div>
        </section>

        <section id="how-it-works" className="ac-section-wash pb-16 pt-16 sm:pb-24 sm:pt-32">
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 text-center">
              <h2
                className="font-bold"
                style={{ fontSize: 36, fontWeight: 700, lineHeight: "45px", color: "#000" }}
              >
                How video to text works on this video transcriber
              </h2>
              <p className="text-lg text-slate-700" style={{ fontSize: 18, lineHeight: "27px" }}>
                Video to text on this video transcriber starts in the browser: add a file or a public link, transcribe speech, then copy or export. A short recording in the browser uses the same workspace. Private or login-walled media may not fetch.
              </p>
            </div>
            <div className="mx-auto mt-16 grid gap-8 md:grid-cols-3">
              {[
                {
                  n: "1",
                  title: "Upload your video",
                  body: "Drop an MP4, MOV, WebM, or MKV, or paste a public link. Audio files such as MP3, WAV, and M4A work here too. This is video to text from speech you already have — not a live captioning desk.",
                  src: "/howtouse/step-1-upload.webp",
                },
                {
                  n: "2",
                  title: "Let AI transcribe",
                  body: "This video transcriber extracts speech with AI. Choose auto language detect or a source language, and optionally separate speakers so dialogue is easier to follow.",
                  src: "/howtouse/step-2-transcribe.webp",
                },
                {
                  n: "3",
                  title: "Copy, download, or share",
                  body: "Copy the transcript, or export TXT, DOCX, SRT, VTT, or CSV. Generate notes, chapters, Ask AI answers, or a mind map in the same workspace. PDF export and translation are not available.",
                  src: "/howtouse/step-3-export.webp",
                },
              ].map((step) => (
                <article
                  key={step.n}
                  className="overflow-hidden rounded-[18px] border border-[#DFE4FB] bg-white p-6 shadow-[0_8px_22px_rgba(46,61,108,0.043)]"
                >
                  <Image
                    src={step.src}
                    alt={step.title}
                    width={540}
                    height={360}
                    unoptimized
                    className="h-auto w-full rounded-2xl bg-[#FAFAFF]"
                  />
                  <div className="mt-6 flex items-center gap-3">
                    <span
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[14px] font-bold text-white"
                      style={{ backgroundColor: "#8882F5" }}
                    >
                      {step.n}
                    </span>
                    <h3 className="text-[24px] font-semibold leading-[30px] text-black">{step.title}</h3>
                  </div>
                  <p className="mt-3 text-lg text-gray-600">{step.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className="pb-16 pt-16 sm:pb-24 sm:pt-32"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(136,130,245,0.05) 40%, rgba(136,130,245,0.05) 60%, rgba(255,255,255,0.02) 100%)",
          }}
        >
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex w-full justify-center">
              <div className="flex w-full max-w-4xl flex-col gap-6 text-center">
                <h2
                  className="whitespace-pre-line font-bold"
                  style={{ fontSize: 36, fontWeight: 700, lineHeight: "45px", color: "#000" }}
                >
                  Video to transcript from a file or public link
                </h2>
                <p className="text-center text-lg font-normal text-slate-700" style={{ fontSize: 18, lineHeight: "27px" }}>
                  Video to script here means the spoken words become a transcript you can edit — not a screenplay generator. Video to transcript keeps the full text next to notes, chapters, and Ask AI.
                </p>
              </div>
            </div>
            <div className="mx-auto mt-16">
              <div className="grid gap-20">
                {[
                  {
                    title: "Convert audio and video to text",
                    body: "Upload MP4, MOV, WebM, or MKV, or paste a public YouTube, TikTok, Instagram, Facebook, X, Apple Podcasts, or Bilibili link. Add speaker labels and language selection when you need them. Private or blocked media may not download.",
                    href: CONVERT_HREF,
                    src: "/features/feature-1-convert.webp",
                    alt: "Convert audio and video to text",
                    imageRight: true,
                  },
                  {
                    title: "Generate summary and key points",
                    body: "After video to text finishes, generate notes and key points from the same file. Use chapters, Ask AI, and a mind map when you want more structure without replaying the full runtime.",
                    href: CONVERT_HREF,
                    src: "/features/feature-2-summary.webp",
                    alt: "Generate an AI summary from audio and video",
                    imageRight: false,
                  },
                  {
                    title: "Export and share",
                    body: "Export as TXT, DOCX, SRT, VTT, or CSV. Copy the text for notes and drafts, or download subtitle files for an editor. PDF transcript export and translation are not in the current export set.",
                    href: CONVERT_HREF,
                    src: "/features/feature-3-export.webp",
                    alt: "Export a transcript or share a link",
                    imageRight: true,
                  },
                ].map((row) => (
                  <div key={row.title} className="items-center md:grid md:grid-cols-12 md:gap-6">
                    <div
                      className={`mx-auto mb-8 max-w-xl md:col-span-5 md:mb-0 md:w-full md:max-w-none lg:col-span-6 ${row.imageRight ? "md:order-1" : ""}`}
                    >
                      <Image
                        src={row.src}
                        alt={row.alt}
                        width={540}
                        height={360}
                        unoptimized
                        className="mx-auto h-auto max-w-full rounded-2xl bg-white md:max-w-none"
                      />
                    </div>
                    <div className="mx-auto max-w-xl md:col-span-7 md:w-full md:max-w-none lg:col-span-6">
                      <div className={row.imageRight ? "md:pr-4 lg:pr-12 xl:pr-16" : "md:pl-4 lg:pl-12 xl:pl-16"}>
                        <h3 className="mb-3 text-[24px] font-semibold leading-[30px] text-black">{row.title}</h3>
                        <p className="mb-4 text-lg text-gray-600">{row.body}</p>
                        <div className="btnList mt-5 flex gap-4">
                          <Link
                            href={row.href}
                            className="inline-flex items-center gap-2 rounded-full text-white"
                            style={{
                              height: 48,
                              padding: "8px 40px",
                              backgroundColor: "#8882F5",
                              fontSize: 18,
                              fontWeight: 500,
                            }}
                          >
                            Try It Free
                            <span className="rotate-90 text-white">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m15 11.25-3-3m0 0-3 3m3-3v7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                              </svg>
                            </span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="usecases" className="ac-section-wash pb-16 pt-16 sm:pb-24 sm:pt-32">
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 text-center">
              <h2
                className="font-bold"
                style={{ fontSize: 36, fontWeight: 700, lineHeight: "45px", color: "#000" }}
              >
                MP4 to text and MP4 to transcript for real recordings
              </h2>
              <p className="text-lg text-slate-700" style={{ fontSize: 18, lineHeight: "27px" }}>
                MP4 to text is the usual local-file job on this video transcriber. MP4 to transcript is the same path: upload the container, transcribe speech, then search the words. MOV, WebM, and MKV follow the same steps.
              </p>
            </div>
            <div className="mx-auto mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Meeting & call recordings",
                  body: "Upload a Zoom, Teams, or phone recording and run video to text. Speaker labels help show who said what when the model can tell speakers apart. This page does not join the live meeting.",
                  icon: Users,
                },
                {
                  title: "Interviews",
                  body: "Use MP4 to transcript on a camera interview, or paste a public interview link. Quote from the text instead of scrubbing the player.",
                  icon: Mic,
                },
                {
                  title: "Podcasts",
                  body: "Turn episode video or audio into a transcript for show notes. Copy TXT or DOCX into the draft you already write.",
                  icon: Podcast,
                },
                {
                  title: "Voice memos",
                  body: "Upload an M4A or WAV memo, or record a short clip in the browser. Video to text here still means speech becomes searchable notes.",
                  icon: AudioLines,
                },
                {
                  title: "Lectures & online courses",
                  body: "Upload a class MP4 or paste a public course link. Generate notes and chapters after transcription instead of replaying every minute.",
                  icon: GraduationCap,
                },
                {
                  title: "YouTube & online videos",
                  body: "Paste a public YouTube URL on this page, or use the YouTube Transcript Generator. Private or members-only videos may not fetch.",
                  icon: Youtube,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.title}
                    className="rounded-[18px] border border-[#DFE4FB] bg-white p-6 shadow-[0_8px_22px_rgba(46,61,108,0.043)]"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: "#EEEDFE", color: "#8882F5" }}
                      >
                        <Icon className="h-5 w-5" strokeWidth={1.75} />
                      </span>
                      <h3 className="text-[18px] font-bold leading-snug text-black">{item.title}</h3>
                    </div>
                    <p className="mt-4 text-[15px] leading-7 text-slate-600">{item.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section
          className="pb-16 pt-16 sm:pb-24 sm:pt-32"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(136,130,245,0.05) 40%, rgba(136,130,245,0.05) 60%, rgba(255,255,255,0.02) 100%)",
          }}
        >
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 text-center">
              <h2
                className="font-bold"
                style={{ fontSize: 36, fontWeight: 700, lineHeight: "45px", color: "#000" }}
              >
                What people are saying
              </h2>
            </div>
            <ReviewMarquee />
          </div>
        </section>

        <FaceRatingFaq />

        <MoreTools />

        <section className="ac-section-wash overflow-hidden">
          <div className="overflow-hidden text-center" style={{ backgroundColor: "#8882F5" }}>
            <div className="mx-auto grid max-w-6xl items-end gap-y-6 px-4 py-10 lg:px-8">
              <h2
                className="font-bold text-white"
                style={{ fontSize: 36, fontWeight: 700, lineHeight: "45px" }}
              >
                {cta.title}
              </h2>
              <p
                className="text-white"
                style={{ marginTop: 16, fontSize: 18, fontWeight: 400, lineHeight: "27px" }}
              >
                {cta.body}
              </p>
              <div className="mt-4 flex justify-center">
                <Link
                  href={CONVERT_HREF}
                  className="inline-flex items-center gap-2"
                  style={{
                    height: 48,
                    padding: "8px 40px",
                    borderRadius: 8,
                    fontSize: 18,
                    fontWeight: 500,
                    color: "rgb(111, 104, 240)",
                    backgroundColor: "#fff",
                  }}
                >
                  {cta.primary}
                  <span
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full"
                    style={{ border: "1.5px solid rgb(111, 104, 240)" }}
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <FaceRatingSiteFooter />
        </div>
      </div>
    </div>
  );
}
