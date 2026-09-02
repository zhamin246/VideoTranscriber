import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  AudioLines,
  Download,
  Earth,
  Files,
  GraduationCap,
  Languages,
  Mic,
  Podcast,
  Sparkles,
  Users,
  UsersRound,
  Youtube,
} from "lucide-react";
import FaceRatingSiteHeader from "./site-header";
import FaceRatingFaq from "./faq";
import FaceRatingSiteFooter from "./site-footer";
import HeroUpload from "./hero-upload";
import WorkspaceNav from "./workspace-nav";
import PromoBanner from "./promo-banner";
import ReviewMarquee from "./review-marquee";
import MoreTools from "./more-tools";
import ScrollCta from "./scroll-cta";
import { content, CONVERT_HREF } from "./data";
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
        <section id="landing-hero" className="ac-section-wash px-4 pb-8 pt-10 sm:px-8">
          <div className="mx-auto max-w-[1152px] text-center" style={{ paddingBottom: 10 }}>
            <h1
              className="font-bold"
              style={{
                fontSize: 40,
                lineHeight: "50px",
                fontWeight: 700,
                letterSpacing: "normal",
                color: "#111827",
              }}
            >
              Convert audio and video to text
            </h1>
            <p
              className="mx-auto"
              style={{
                marginTop: 8,
                maxWidth: 1024,
                fontSize: 18,
                lineHeight: "27px",
                fontWeight: 400,
                color: "#4B5563",
              }}
            >
              {hero.description}
            </p>
          </div>
          <div className="mt-8">
            <HeroUpload />
          </div>
          <div className="-mx-4 mt-5 overflow-x-auto px-4 md:mx-0">
            <div className="mx-auto flex w-max flex-nowrap items-center gap-2.5">
            {(
              [
                { label: "20+ Input Formats", icon: Files, bg: "rgb(232, 252, 250)", fg: "rgb(18, 145, 130)" },
                { label: "63 Languages", icon: Earth, bg: "rgb(235, 244, 254)", fg: "rgb(7, 104, 223)" },
                { label: "6 Export Formats", icon: Download, bg: "rgb(254, 243, 231)", fg: "rgb(235, 134, 10)" },
                { label: "Speaker Recognition", icon: UsersRound, bg: "rgb(243, 237, 253)", fg: "rgb(126, 64, 231)" },
                { label: "Translation", icon: Languages, bg: "rgb(253, 237, 242)", fg: "rgb(228, 37, 94)" },
                { label: "AI Summary", icon: Sparkles, bg: "rgb(234, 250, 240)", fg: "rgb(37, 157, 81)" },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="inline-flex h-12 shrink-0 items-center gap-3 rounded-full border border-slate-200/70 bg-white/95 px-4 text-sm font-semibold text-slate-800 shadow-[0_4px_12px_rgba(100,103,242,0.05)]"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: item.bg, color: item.fg }}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <span className="whitespace-nowrap leading-none">{item.label}</span>
                </div>
              );
            })}
            </div>
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-[11px] leading-5 text-slate-500/80 md:text-xs">
            By using this site, you agree to our{" "}
            <Link href="/terms-of-service" className="underline underline-offset-4 hover:text-slate-700">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className="underline underline-offset-4 hover:text-slate-700">
              Privacy Policy
            </Link>
            .
          </p>
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

            <h2
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
            </h2>
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
                How to Use Video Transcriber AI
              </h2>
              <p className="text-lg text-slate-700" style={{ fontSize: 18, lineHeight: "27px" }}>
                Upload a file, paste a link, or record audio. Video Transcriber writes the transcript so you can copy, download, or share.
              </p>
            </div>
            <div className="mx-auto mt-16 grid gap-8 md:grid-cols-3">
              {[
                {
                  n: "1",
                  title: "Upload your video",
                  body: "Choose a file from your computer or drag and drop it into the upload box. MP4, YouTube links, Zoom recordings, and other common formats all work.",
                  src: "/howtouse/step-1-upload.webp",
                },
                {
                  n: "2",
                  title: "Let AI transcribe",
                  body: "The file is processed automatically. Spoken words become accurate text, with speaker labels and language selection when you need them.",
                  src: "/howtouse/step-2-transcribe.webp",
                },
                {
                  n: "3",
                  title: "Copy, download, or share",
                  body: "When the transcript is ready, copy it to your notes, download a file, or share it. Use it for study, meetings, or content.",
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
                  Convert audio and video to text
                </h2>
                <p className="text-center text-lg font-normal text-slate-700" style={{ fontSize: 18, lineHeight: "27px" }}>
                  Transcribe files, links, or a live recording. Then generate an AI summary and export or share the result.
                </p>
              </div>
            </div>
            <div className="mx-auto mt-16">
              <div className="grid gap-20">
                {[
                  {
                    title: "Convert audio and video to text",
                    body: "Turn audio and video into searchable text in minutes. Upload a file, paste a YouTube, TikTok, Instagram, Facebook, X, or Apple Podcasts link, or record in the browser. 63 languages, 20+ formats, speaker recognition, and translation on the same run.",
                    href: CONVERT_HREF,
                    src: "/features/feature-1-convert.webp",
                    alt: "Convert audio and video to text",
                    imageRight: true,
                  },
                  {
                    title: "Generate summary and key points",
                    body: "Automatically generate a short AI summary and key points from the same recording. Use them to scan what matters without replaying the full file.",
                    href: CONVERT_HREF,
                    src: "/features/feature-2-summary.webp",
                    alt: "Generate an AI summary from audio and video",
                    imageRight: false,
                  },
                  {
                    title: "Export and share",
                    body: "Export the transcript as TXT, DOCX, PDF, SRT, VTT, or CSV. Copy the text, download a file, or share a link so others can open the transcript directly.",
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
                Convert any video and audio to text
              </h2>
              <p className="text-lg text-slate-700" style={{ fontSize: 18, lineHeight: "27px" }}>
                Whether it is a voice memo on your phone, an hour-long meeting, or an online video,
                Video Transcriber turns it into a searchable transcript in minutes. MP3, WAV, M4A, MP4, MOV and 20+ other formats are supported.
              </p>
            </div>
            <div className="mx-auto mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Meeting & call recordings",
                  body: "Turn Zoom, Teams, or phone call recordings into searchable notes. Speaker recognition labels who said what, so decisions and action items never get lost in the audio.",
                  icon: Users,
                },
                {
                  title: "Interviews",
                  body: "Transcribe interview audio to text with timestamps. Quote your sources accurately and jump back to the exact moment instead of scrubbing through the whole recording.",
                  icon: Mic,
                },
                {
                  title: "Podcasts",
                  body: "Convert podcast audio to text for show notes, blog posts, and quotable snippets. A full transcript also makes every episode searchable for your audience.",
                  icon: Podcast,
                },
                {
                  title: "Voice memos",
                  body: "That idea you recorded on a walk? Convert voice memos from your phone into clean text notes you can actually search, edit, and share.",
                  icon: AudioLines,
                },
                {
                  title: "Lectures & online courses",
                  body: "Turn recorded lectures and course videos into study notes. AI summaries and key points help you review hours of material in minutes.",
                  icon: GraduationCap,
                },
                {
                  title: "YouTube & online videos",
                  body: "Paste a YouTube link and get the video transcript without downloading anything. Perfect for research, subtitles, and repurposing video content.",
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
