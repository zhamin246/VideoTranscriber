import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { content } from "./data";
import { V } from "./visual";
import BeforeAfter from "./before-after";

/** Red uppercase section label — used on every landing block except hero/footer. */
function SectionKicker({ children, onDark }: { children: string; onDark?: boolean }) {
  return (
    <p
      className="text-[12px] font-semibold uppercase tracking-[0.16em]"
      style={{ color: onDark ? V.accentSoft : V.accent }}
    >
      {children}
    </p>
  );
}

function WhyTitle() {
  const { why } = content;
  const italic = why.titleItalic;
  const idx = why.title.indexOf(italic);
  if (idx < 0) return <>{why.title}</>;
  return (
    <>
      {why.title.slice(0, idx)}
      <span className="font-serif font-normal italic" style={{ color: V.accentItalic }}>
        {italic}
      </span>
      {why.title.slice(idx + italic.length)}
    </>
  );
}

/** Comparison table — traditional vs typical tools vs us. */
export function SectionWhy() {
  const s = content.why;
  const cols =
    "grid grid-cols-[minmax(7.5rem,0.85fr)_repeat(3,minmax(10rem,1.1fr))]";

  return (
    <section id="why-us" style={{ backgroundColor: V.bg, color: V.ink }}>
      <div
        className="mx-auto max-w-[1152px] px-5 sm:px-8"
        style={{
          paddingTop: "clamp(4.5rem, 8vw, 6.5rem)",
          paddingBottom: "clamp(4.5rem, 8vw, 6.5rem)",
        }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <SectionKicker>{s.kicker}</SectionKicker>
          <h2
            className="mt-3 font-black tracking-tight"
            style={{
              fontSize: "clamp(1.85rem, 3.4vw, 2.75rem)",
              lineHeight: 1.12,
              letterSpacing: "-0.03em",
            }}
          >
            <WhyTitle />
          </h2>
          <p className="mt-3 text-[16px] sm:text-[18px]" style={{ color: V.muted }}>
            {s.lead}
          </p>
        </div>

        <div className="mt-12 -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
          <div
            className="min-w-[760px] overflow-hidden rounded-[24px] border bg-white shadow-[0_18px_40px_-28px_rgba(24,24,27,0.18)]"
            style={{ borderColor: V.line }}
          >
            <div className={`${cols} border-b`} style={{ borderColor: V.line }}>
              <div className="px-5 py-5 text-[13px] font-bold sm:px-6 sm:py-6" style={{ color: V.ink }}>
                {s.capability}
              </div>
              <div className="px-4 py-5 text-center sm:px-5 sm:py-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: V.muted }}>
                  {s.traditional.kicker}
                </p>
                <p className="mt-1 text-[14px] font-bold leading-snug sm:text-[15px]" style={{ color: V.ink }}>
                  {s.traditional.title}
                </p>
              </div>
              <div className="px-4 py-5 text-center sm:px-5 sm:py-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: V.muted }}>
                  {s.typical.kicker}
                </p>
                <p className="mt-1 text-[14px] font-bold leading-snug sm:text-[15px]" style={{ color: V.ink }}>
                  {s.typical.title}
                </p>
              </div>
              <div className="px-4 py-5 text-center sm:px-5 sm:py-6" style={{ backgroundColor: V.accentBand }}>
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: V.accent }}
                >
                  {s.ours.kicker}
                </p>
                <p
                  className="mt-1 inline-flex flex-wrap items-center justify-center gap-2 text-[14px] font-bold leading-snug sm:text-[15px]"
                  style={{ color: V.ink }}
                >
                  {s.ours.title}
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white"
                    style={{ backgroundColor: V.accent }}
                  >
                    {s.ours.badge}
                  </span>
                </p>
              </div>
            </div>

            {s.rows.map((row, i) => (
              <div
                key={row.capability}
                className={`${cols} ${i < s.rows.length - 1 ? "border-b" : ""}`}
                style={{ borderColor: V.line }}
              >
                <div
                  className="flex items-center px-5 py-4 text-[14px] font-bold sm:px-6 sm:py-5 sm:text-[15px]"
                  style={{ color: V.ink }}
                >
                  {row.capability}
                </div>
                <div
                  className="flex items-center px-4 py-4 text-center text-[13px] leading-snug sm:px-5 sm:py-5 sm:text-[14px]"
                  style={{ color: V.muted }}
                >
                  {row.traditional}
                </div>
                <div
                  className="flex items-center px-4 py-4 text-center text-[13px] leading-snug sm:px-5 sm:py-5 sm:text-[14px]"
                  style={{ color: V.muted }}
                >
                  {row.typical}
                </div>
                <div
                  className="flex items-center px-4 py-4 text-center text-[13px] font-semibold leading-snug sm:px-5 sm:py-5 sm:text-[14px]"
                  style={{ backgroundColor: V.accentBand, color: V.ink }}
                >
                  {row.ours}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ToolsTitle() {
  const { freeTests } = content;
  const italic = freeTests.titleItalic;
  const idx = italic ? freeTests.title.indexOf(italic) : -1;
  if (!italic || idx < 0) return <>{freeTests.title}</>;
  return (
    <>
      {freeTests.title.slice(0, idx)}
      <span className="font-serif font-normal italic" style={{ color: V.accentSoft }}>
        {italic}
      </span>
      {freeTests.title.slice(idx + italic.length)}
    </>
  );
}

function ToolsArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className="shrink-0">
      <path
        d="M2.5 7h9M7.5 3.5 11 7l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Free tools — dark featured cards + more-measurements grid (approved comp). */
export function SectionTools() {
  const s = content.freeTests;
  return (
    <section
      id="free-tests"
      style={{
        backgroundColor: V.darkBg,
        color: V.darkInk,
        backgroundImage:
          "radial-gradient(ellipse 70% 45% at 50% 0%, #1C1E21 0%, #0D0E0F 55%)",
      }}
    >
      <div
        className="mx-auto max-w-[1152px] px-5 sm:px-8"
        style={{
          paddingTop: "clamp(4.5rem, 8vw, 6.5rem)",
          paddingBottom: "clamp(4.5rem, 8vw, 6.5rem)",
        }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <SectionKicker onDark>{s.kicker}</SectionKicker>
          <h2
            className="mt-4 font-black tracking-tight text-white"
            style={{
              fontSize: "clamp(1.85rem, 3.4vw, 2.65rem)",
              lineHeight: 1.12,
              letterSpacing: "-0.03em",
            }}
          >
            <ToolsTitle />
          </h2>
          <p className="mt-3 text-[16px]" style={{ color: V.darkMuted }}>
            {s.lead}
          </p>
        </div>

        {/* Featured tools — hover: rose border + glow + lift (thefacereport pattern) */}
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {s.featured.map((item) => (
            <li key={item.title}>
              <Link href={item.href} className="group block h-full">
                <article
                  className="flex h-full flex-col rounded-[18px] border border-white/10 bg-gradient-to-b from-[#27272A] to-[#1F1F23] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:-translate-y-0.5 group-hover:border-[#FB7185]/30 group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_28px_-8px_rgba(251,113,133,0.4)] sm:p-7"
                >
                  <h3 className="text-[18px] font-bold tracking-tight text-white sm:text-[20px]">
                    {item.title}
                  </h3>
                  <p className="mt-3 flex-1 text-[14px] leading-relaxed sm:text-[15px]" style={{ color: V.darkMuted }}>
                    {item.body}
                  </p>
                  <span
                    className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-semibold transition-all duration-300 group-hover:gap-2.5"
                    style={{ color: V.accentSoft }}
                  >
                    {item.cta}
                    <ToolsArrow />
                  </span>
                </article>
              </Link>
            </li>
          ))}
        </ul>

        {/* More free measurements */}
        {s.more.length > 0 ? (
        <div className="mt-14 sm:mt-16">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            {s.moreLabel}
          </p>
          <ul className="mt-5 grid gap-x-8 sm:grid-cols-2">
            {s.more.map((item) => (
              <li
                key={item.title}
                className="border-t py-5"
                style={{ borderColor: "rgba(255,255,255,0.1)" }}
              >
                <Link
                  href={item.href}
                  className="group grid grid-cols-[1fr_auto] items-start gap-4 transition-colors duration-300"
                >
                  <div className="min-w-0">
                    <h3 className="text-[16px] font-bold tracking-tight text-white transition-colors duration-300 group-hover:text-white/90">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-[13px] leading-snug sm:text-[14px]" style={{ color: V.darkMuted }}>
                      {item.body}
                    </p>
                    <span
                      className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold transition-all duration-300 group-hover:gap-2.5 sm:text-[14px]"
                      style={{ color: V.accentSoft }}
                    >
                      {item.cta}
                    </span>
                  </div>
                  <span
                    className="mt-1 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5"
                    style={{ color: V.accentSoft }}
                    aria-hidden
                  >
                    <ToolsArrow />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        ) : null}
      </div>
    </section>
  );
}

const TOOL_LOGOS: {
  src: string;
  alt: string;
  label?: string;
  imgClass: string;
}[] = [
  { src: "/logos/autocad.svg", alt: "AutoCAD", imgClass: "h-10 w-auto" },
  { src: "/logos/illustrator.svg", alt: "Illustrator", label: "Illustrator", imgClass: "h-8 w-8" },
  { src: "/logos/fusion360.svg", alt: "Fusion 360", label: "Fusion 360", imgClass: "h-8 w-8" },
  { src: "/logos/rhinoceros.svg", alt: "Rhino", label: "Rhino", imgClass: "h-8 w-8" },
  { src: "/logos/sketchup.svg", alt: "SketchUp", label: "SketchUp", imgClass: "h-8 w-8" },
  { src: "/logos/coreldraw.svg", alt: "CorelDRAW", label: "CorelDRAW", imgClass: "h-8 w-8" },
  { src: "/logos/lightburn.svg", alt: "LightBurn", label: "LightBurn", imgClass: "h-8 w-8" },
  { src: "/logos/inkscape.svg", alt: "Inkscape", label: "Inkscape", imgClass: "h-8 w-8" },
  { src: "/logos/cricut.svg", alt: "Cricut", label: "Cricut", imgClass: "h-8 w-8" },
  { src: "/logos/glowforge.svg", alt: "Glowforge", imgClass: "h-10 w-auto opacity-80" },
];

/** Compatibility strip — PhotoCAD logo cloud, on How-it-works paper. */
export function SectionLogoCloud() {
  return (
    <section
      aria-label="Works with the tools you already use"
      style={{ backgroundColor: "#F9F8F6", color: V.ink }}
      className="px-5 py-7 sm:px-8"
    >
      <div className="mx-auto max-w-[1152px]">
        <p className="text-center text-[18px] font-semibold uppercase tracking-[0.05em] text-[#737373]">
          Works with the tools you already use
        </p>
        <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 sm:gap-x-12">
          {TOOL_LOGOS.map((logo) => (
            <li key={logo.alt} className="flex items-center gap-2 grayscale opacity-60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo.src} alt={logo.alt} className={`shrink-0 ${logo.imgClass}`} />
              {logo.label ? (
                <span className="text-base font-semibold text-[#737373] sm:text-lg">{logo.label}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function HowTitle() {
  const { how } = content;
  const italic = how.titleItalic;
  const idx = italic ? how.title.lastIndexOf(italic) : -1;
  if (!italic || idx < 0) return <>{how.title}</>;
  return (
    <>
      {how.title.slice(0, idx)}
      <span className="font-serif font-normal italic" style={{ color: V.accentItalic }}>
        {italic}
      </span>
      {how.title.slice(idx + italic.length)}
    </>
  );
}

const HOW_STEP_ART: Record<string, { src: string; alt: string }> = {
  "1": { src: "/how-it-work/step-1-upload.webp", alt: "" },
  "2": { src: "/how-it-work/step-2-convert.webp", alt: "" },
  "3": { src: "/how-it-work/step-3-download.webp", alt: "" },
};

function HowStepArt({ n }: { n: string }) {
  const art = HOW_STEP_ART[n] ?? HOW_STEP_ART["3"];
  return (
    <Image
      src={art.src}
      alt={art.alt}
      width={200}
      height={200}
      className="mx-auto h-[132px] w-auto object-contain"
      aria-hidden
    />
  );
}

/** Three-step ritual — illustration cards on paper. */
export function SectionHow() {
  const s = content.how;
  return (
    <section id="how-it-works" style={{ backgroundColor: V.bg, color: V.ink }}>
      <div
        className="mx-auto max-w-[1152px] px-5 sm:px-8"
        style={{
          paddingTop: "clamp(2.5rem, 5vw, 4rem)",
          paddingBottom: "clamp(4.5rem, 8vw, 6.5rem)",
        }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <SectionKicker>{s.kicker}</SectionKicker>
          <h2
            className="mt-3 font-black tracking-tight"
            style={{
              fontSize: "clamp(1.85rem, 3.6vw, 2.85rem)",
              lineHeight: 1.12,
              letterSpacing: "-0.03em",
              color: V.ink,
            }}
          >
            <HowTitle />
          </h2>
          {s.lead ? (
            <p className="mt-4 text-[15px] leading-relaxed sm:text-[16px]" style={{ color: V.muted }}>
              {s.lead}
            </p>
          ) : null}
        </div>

        <ol className="mt-12 grid gap-5 sm:grid-cols-3">
          {s.steps.map((step) => (
            <li
              key={step.n}
              className="rounded-[20px] border bg-white px-6 pb-8 pt-6 text-center"
              style={{ borderColor: V.line }}
            >
              <HowStepArt n={step.n} />
              <h3 className="mt-4 text-[18px] font-bold tracking-tight" style={{ color: V.ink }}>
                {step.title}
              </h3>
              <p className="mx-auto mt-2 max-w-[42ch] text-[14px] leading-snug" style={{ color: V.muted }}>
                {step.body}
              </p>
            </li>
          ))}
        </ol>

        <p className="mt-10 text-center text-[12px] leading-relaxed" style={{ color: V.muted }}>
          {s.trust}
        </p>
      </div>
    </section>
  );
}

function UseCasesTitle() {
  const { useCases: s } = content;
  const italic = s.titleItalic;
  const idx = italic ? s.title.indexOf(italic) : -1;
  if (!italic || idx < 0) return <>{s.title}</>;
  return (
    <>
      {s.title.slice(0, idx)}
      <span className="font-serif font-normal italic" style={{ color: V.accentSoft }}>
        {italic}
      </span>
      {s.title.slice(idx + italic.length)}
    </>
  );
}

/** Alternating before/after use cases — PhotoCAD pattern, dark well. */
export function SectionUseCases() {
  const s = content.useCases;
  return (
    <section
      id="use-cases"
      style={{
        backgroundColor: V.darkBg,
        color: V.darkInk,
        backgroundImage: "radial-gradient(ellipse 70% 40% at 50% 0%, #1C1E21 0%, #18181B 58%)",
      }}
    >
      <div
        className="mx-auto max-w-[1152px] px-5 sm:px-8"
        style={{
          paddingTop: "clamp(4.5rem, 8vw, 6.5rem)",
          paddingBottom: "clamp(4.5rem, 8vw, 6.5rem)",
        }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <SectionKicker onDark>{s.kicker}</SectionKicker>
          <h2
            className="mt-3 font-black tracking-tight text-white"
            style={{
              fontSize: "clamp(1.85rem, 3.6vw, 2.85rem)",
              lineHeight: 1.12,
              letterSpacing: "-0.03em",
            }}
          >
            <UseCasesTitle />
          </h2>
          <p className="mt-5 text-[18px] leading-snug sm:text-[22px]" style={{ color: V.darkMuted }}>
            {s.lead}
          </p>
        </div>

        <ul className="mt-14 space-y-16 md:mt-16 md:space-y-24">
          {s.items.map((item) => (
            <li
              key={item.link}
              className={`grid grid-cols-1 items-center gap-8 md:gap-10 lg:gap-16 ${
                item.imageLeft
                  ? "md:grid-cols-[3fr_2fr]"
                  : "md:grid-cols-[2fr_3fr]"
              }`}
            >
              <div className={item.imageLeft ? "" : "md:order-2"}>
                <BeforeAfter
                  beforeSrc={item.before}
                  afterSrc={item.after}
                  beforeAlt={item.beforeAlt}
                  afterAlt={item.afterAlt}
                  aspect={item.aspect}
                />
              </div>
              <div className={item.imageLeft ? "md:text-left lg:pr-8" : "md:order-1 md:text-left lg:pl-8"}>
                <p className="text-center text-[22px] font-medium leading-snug text-white md:text-left md:text-[28px]">
                  {item.copy}
                </p>
                <Link
                  href={item.href}
                  className="group mt-5 inline-flex w-full items-center justify-center gap-2 text-[18px] font-semibold md:w-auto md:justify-start"
                  style={{ color: V.accentSoft }}
                >
                  {item.link}
                  <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-14 text-center">
          <Link
            href={s.more.href}
            className="inline-flex items-center gap-2 text-[16px] font-semibold"
            style={{ color: V.accentSoft }}
          >
            {s.more.label}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </p>
      </div>
    </section>
  );
}

function UsersSayTitle() {
  const { usersSay: s } = content;
  const italic = s.titleItalic;
  const idx = italic ? s.title.indexOf(italic) : -1;
  if (!italic || idx < 0) return <>{s.title}</>;
  return (
    <>
      {s.title.slice(0, idx)}
      <span className="font-serif font-normal italic" style={{ color: V.accentItalic }}>
        {italic}
      </span>
      {s.title.slice(idx + italic.length)}
    </>
  );
}

function UsersSayStars({ rating = 5 }: { rating?: number }) {
  return (
    <div className="flex items-center gap-1" role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          aria-hidden
          style={{ color: i < rating ? V.accentSoft : "#E4E4E7" }}
        >
          <path
            d="M8 1.4l1.76 3.56 3.93.57-2.84 2.77.67 3.91L8 10.36l-3.52 1.85.67-3.91L2.3 5.53l3.93-.57L8 1.4z"
            fill="currentColor"
          />
        </svg>
      ))}
    </div>
  );
}

/** Anonymized user quotes — stars + quote + author. */
export function SectionUsersSay() {
  const s = content.usersSay;
  return (
    <section id="users-say" style={{ backgroundColor: V.bg, color: V.ink }}>
      <div
        className="mx-auto max-w-[1152px] px-5 sm:px-8"
        style={{
          paddingTop: "clamp(4.5rem, 8vw, 6.5rem)",
          paddingBottom: "clamp(4.5rem, 8vw, 6.5rem)",
        }}
      >
        <div className="mx-auto max-w-2xl text-center">
          <SectionKicker>{s.kicker}</SectionKicker>
          <h2
            className="mt-3 font-black tracking-tight"
            style={{
              fontSize: "clamp(1.9rem, 3.6vw, 2.85rem)",
              lineHeight: 1.12,
              letterSpacing: "-0.03em",
            }}
          >
            <UsersSayTitle />
          </h2>
          <p className="mt-3 text-[15px] sm:text-[16px]" style={{ color: V.muted }}>
            {s.lead}
          </p>
        </div>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-5">
          {s.items.map((item) => (
            <li key={item.name}>
              <article
                className="flex h-full flex-col rounded-[16px] border bg-white p-5 sm:p-6"
                style={{ borderColor: V.line }}
              >
                <UsersSayStars rating={item.rating} />

                <blockquote className="mt-4 flex-1">
                  <p
                    className="text-[15px] font-medium leading-[1.55] tracking-[-0.01em] sm:text-[16px]"
                    style={{ color: V.ink }}
                  >
                    “{item.quote}”
                  </p>
                </blockquote>

                <footer className="mt-6 flex items-center gap-3 border-t pt-4" style={{ borderColor: V.line }}>
                  <span className="relative size-9 shrink-0 overflow-hidden rounded-full" style={{ backgroundColor: V.accentTint }}>
                    <Image
                      src={item.avatar}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="36px"
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold leading-tight">{item.name}</p>
                    <p className="mt-0.5 text-[12px] leading-tight" style={{ color: V.muted }}>
                      {item.role}
                    </p>
                  </div>
                </footer>
              </article>
            </li>
          ))}
        </ul>

        <p
          className="mx-auto mt-10 max-w-xl text-center text-[12px] leading-relaxed sm:text-[13px]"
          style={{ color: V.muted }}
        >
          <span
            className="inline-flex items-center rounded-full border bg-white px-3 py-1.5"
            style={{ borderColor: V.line }}
          >
            {s.footer}
          </span>
        </p>
      </div>
    </section>
  );
}

function GuidesTitle() {
  const { guides: s } = content;
  const italic = s.titleItalic;
  const idx = italic ? s.title.indexOf(italic) : -1;
  if (!italic || idx < 0) return <>{s.title}</>;
  return (
    <>
      {s.title.slice(0, idx)}
      <span className="font-serif font-normal italic" style={{ color: V.accentItalic }}>
        {italic}
      </span>
      {s.title.slice(idx + italic.length)}
    </>
  );
}

/** Evidence-based guides — three article cards (approved comp). */
export function SectionGuides() {
  const s = content.guides;
  return (
    <section id="guides" style={{ backgroundColor: V.accentBand, color: V.ink }}>
      <div
        className="mx-auto max-w-[1152px] px-5 sm:px-8"
        style={{
          paddingTop: "clamp(4.5rem, 8vw, 6.5rem)",
          paddingBottom: "clamp(4.5rem, 8vw, 6.5rem)",
        }}
      >
        <div className="mx-auto max-w-xl text-center">
          <SectionKicker>{s.kicker}</SectionKicker>
          <h2
            className="mt-3 font-black tracking-tight"
            style={{
              fontSize: "clamp(1.9rem, 3.6vw, 2.75rem)",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
            }}
          >
            <GuidesTitle />
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed sm:text-[16px]" style={{ color: V.muted }}>
            {s.lead}
          </p>
        </div>

        <ul className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {s.items.map((item) => (
            <li key={item.title}>
              <Link
                href={item.href}
                className="flex h-full flex-col rounded-[16px] border bg-white p-6 transition-shadow hover:shadow-sm sm:p-7"
                style={{ borderColor: V.line }}
              >
                <span
                  className="mb-4 block h-0.5 w-7 rounded-full"
                  style={{ backgroundColor: V.accent }}
                  aria-hidden
                />
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: V.accent }}
                >
                  {item.category}
                </p>
                <h3 className="mt-2 text-[18px] font-bold tracking-tight sm:text-[20px]" style={{ color: V.ink }}>
                  {item.title}
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed sm:text-[15px]" style={{ color: V.muted }}>
                  {item.body}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}


