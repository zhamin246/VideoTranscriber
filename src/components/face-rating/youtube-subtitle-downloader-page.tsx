"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  Captions,
  FileUp,
  GraduationCap,
  Link2,
  Mic,
  Newspaper,
  ShieldCheck,
  Subtitles,
  Users,
  Video,
  Youtube,
} from "lucide-react";
import FaceRatingSiteHeader from "./site-header";
import FaceRatingSiteFooter from "./site-footer";
import HeroUpload from "./hero-upload";
import MediaFilesStrip from "./media-files-strip";
import WorkspaceNav from "./workspace-nav";
import PromoBanner from "./promo-banner";
import ReviewMarquee from "./review-marquee";
import MoreTools from "./more-tools";
import ScrollCta from "./scroll-cta";
import { V } from "./visual";
import {
  YOUTUBE_SUBTITLE_DOWNLOADER_HREF,
  youtubeSubtitleDownloaderSeo,
} from "@/lib/convert/youtube-subtitle-downloader-content";

const CHIP_ICONS = [Link2, Subtitles, Captions, Users, FileUp] as const;

function scrollToHero(e: React.MouseEvent) {
  e.preventDefault();
  document.getElementById("landing-hero")?.scrollIntoView({ behavior: "smooth" });
}

export default function YoutubeSubtitleDownloaderPage() {
  const seo = youtubeSubtitleDownloaderSeo;
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

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
                  {seo.hero.h1}
                </h1>
                <p className="mx-auto mt-2 max-w-3xl text-[15px] font-normal leading-6 text-[#4B5563] sm:mt-2 sm:text-lg sm:leading-[27px]">
                  {seo.hero.subtitle}
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:mt-4 sm:gap-x-5">
                  {seo.hero.chips.map((item, i) => {
                    const Icon = CHIP_ICONS[i] ?? ShieldCheck;
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
                <HeroUpload defaultTab="link" />
              </div>
              <MediaFilesStrip />
            </section>

            <section id="how-it-works" className="ac-section-wash pb-16 pt-16 sm:pb-24 sm:pt-32">
              <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 text-center">
                  <h2
                    className="font-bold"
                    style={{ fontSize: 36, fontWeight: 700, lineHeight: "45px", color: "#000" }}
                  >
                    {seo.how.title}
                  </h2>
                  <p className="text-lg text-slate-700" style={{ fontSize: 18, lineHeight: "27px" }}>
                    {seo.how.lead}
                  </p>
                </div>
                <div className="mx-auto mt-16 grid gap-8 md:grid-cols-3">
                  {seo.how.steps.map((step) => (
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
                        <h3 className="text-[24px] font-semibold leading-[30px] text-black">
                          {step.title}
                        </h3>
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
                  <div className="flex w-full flex-col items-center gap-6 text-center">
                    <h2
                      className="font-bold"
                      style={{ fontSize: 36, fontWeight: 700, lineHeight: "45px", color: "#000" }}
                    >
                      {seo.features.title}
                    </h2>
                    <p
                      className="max-w-3xl text-center text-lg font-normal text-slate-700"
                      style={{ fontSize: 18, lineHeight: "27px" }}
                    >
                      {seo.features.lead}
                    </p>
                  </div>
                </div>
                <div className="mx-auto mt-16">
                  <div className="grid gap-20">
                    {seo.features.rows.map((row) => (
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
                                href={YOUTUBE_SUBTITLE_DOWNLOADER_HREF}
                                onClick={scrollToHero}
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
                    {seo.usecases.title}
                  </h2>
                  <p className="text-lg text-slate-700" style={{ fontSize: 18, lineHeight: "27px" }}>
                    {seo.usecases.lead}
                  </p>
                </div>
                <div className="mx-auto mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {seo.usecases.items.map((item, i) => {
                    const Icon = [Video, GraduationCap, Youtube, Mic, Captions, Newspaper][i] ?? Users;
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

            <section
              id="faq"
              style={{
                backgroundColor: "#FBFBFE",
                paddingBottom: 64,
                fontFamily: "var(--font-lexend), Lexend, ui-sans-serif, system-ui, sans-serif",
              }}
            >
              <div className="mx-auto max-w-3xl px-4 pb-12 pt-16 text-center md:pb-16">
                <h2
                  className="font-bold"
                  style={{ fontSize: 36, fontWeight: 700, lineHeight: "45px", color: "#000" }}
                >
                  {seo.faq.title}
                </h2>
              </div>
              <div className="mx-auto mb-10 max-w-7xl px-4 lg:px-24">
                {seo.faq.items.map((item, index) => {
                  const isOpen = faqOpen === index;
                  return (
                    <div key={item.q}>
                      <button
                        type="button"
                        onClick={() => setFaqOpen(isOpen ? null : index)}
                        className="relative mt-4 flex w-full items-center justify-between bg-white text-left"
                        style={{
                          padding: "24px",
                          borderRadius: 8,
                          fontSize: 20,
                          fontWeight: 700,
                          lineHeight: 1.25,
                          letterSpacing: "-0.02em",
                          color: "rgb(76, 76, 76)",
                        }}
                        aria-expanded={isOpen}
                      >
                        <span>{item.q}</span>
                        <ChevronDown
                          className="h-10 w-10 shrink-0"
                          style={{
                            color: "rgb(136, 130, 245)",
                            transform: isOpen ? "rotate(180deg)" : "none",
                            transition: "transform 200ms",
                          }}
                        />
                      </button>
                      {isOpen ? (
                        <div
                          className="mt-2"
                          style={{
                            padding: "8px 24px 16px",
                            fontSize: 16,
                            lineHeight: "24px",
                            fontWeight: 400,
                            color: "rgb(76, 76, 76)",
                          }}
                        >
                          {item.a}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>

            <MoreTools />

            <section className="ac-section-wash overflow-hidden">
              <div className="overflow-hidden text-center" style={{ backgroundColor: "#8882F5" }}>
                <div className="mx-auto grid max-w-6xl items-end gap-y-6 px-4 py-10 lg:px-8">
                  <h2
                    className="font-bold text-white"
                    style={{ fontSize: 36, fontWeight: 700, lineHeight: "45px" }}
                  >
                    {seo.cta.title}
                  </h2>
                  <p
                    className="text-white"
                    style={{ marginTop: 16, fontSize: 18, fontWeight: 400, lineHeight: "27px" }}
                  >
                    {seo.cta.body}
                  </p>
                  <div className="mt-4 flex justify-center">
                    <Link
                      href={YOUTUBE_SUBTITLE_DOWNLOADER_HREF}
                      onClick={scrollToHero}
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
                      {seo.cta.button}
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
