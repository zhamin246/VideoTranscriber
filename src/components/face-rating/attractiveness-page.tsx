import type { ReactNode } from "react";
import Link from "next/link";
import FaceRatingSiteHeader from "./site-header";
import FaceRatingSiteFooter from "./site-footer";
import AttractivenessUpload from "./attractiveness-upload";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FREE_TEST_HREF } from "./data";
import { V } from "./visual";

/**
 * Page copy is original Face Rating wording (not mirrored from competitors).
 * Target density for exact phrase "AI Attractiveness Test" ≈ 2.5% of body words
 * (count = occurrences × 3 / total words). Aim ~7–8 uses on ~850–950 words.
 */

const TIERS = [
  {
    range: "87–100",
    name: "Showstopper",
    body: "Top 5% — closest alignment across this tool’s four geometry components.",
  },
  {
    range: "83–86",
    name: "Standout",
    body: "Top 15% — strong measured harmony, with only modest variation across components.",
  },
  {
    range: "78–82",
    name: "Glow Up",
    body: "Top 35% — above-average balance with clear levers to push higher.",
  },
  {
    range: "60–77",
    name: "Rising",
    body: "Solid foundation. Photo angle, light, and expression often move this band.",
  },
  {
    range: "Below 60",
    name: "Foundation",
    body: "Distinctive features — biggest upside potential. Not a social ranking of your worth.",
  },
];

const FORMULA = [
  {
    title: "Left–right symmetry",
    weight: "35%",
    body: "Paired landmarks are compared across an estimated midline. This slice carries the largest weight because mirror balance is a stable, photo-visible signal.",
  },
  {
    title: "Vertical thirds",
    weight: "25%",
    body: "The visible face window is split into upper, middle, and lower bands. The model’s forehead landmark is treated carefully so the tool does not invent a true hairline it cannot see.",
  },
  {
    title: "Horizontal fifths",
    weight: "25%",
    body: "Width is checked in eye-width steps from ear to ear. This captures spacing of the eyes and the overall upper-face grid.",
  },
  {
    title: "Length-to-width (phi)",
    weight: "15%",
    body: "Overall face height versus width is compared with a phi-inspired target (≈1.618), adjusted for the landmark crop. It is weighted lowest so one ratio cannot dominate the final number.",
  },
];

const RESEARCH_SUPPORTED = [
  {
    label: "Bilateral symmetry",
    body: "Repeatedly linked to higher average attractiveness ratings in review literature.",
  },
  {
    label: "Population-average shapes",
    body: "Composite or “mean-like” faces often score higher in controlled rating studies.",
  },
  {
    label: "Sex-typical cues",
    body: "Features read as more masculine or feminine can matter, and culture shapes that reading.",
  },
  {
    label: "Skin clarity",
    body: "Even tone and texture influence ratings independent of bone layout.",
  },
];

const RESEARCH_MISSES = [
  {
    label: "Motion and expression",
    body: "A natural smile or micro-expression is invisible to a still-frame geometry pass.",
  },
  {
    label: "Voice and manner",
    body: "Sound and social behavior shift how people rank faces in real life.",
  },
  {
    label: "Time and place",
    body: "Ideals change across decades and communities; one formula cannot track all of them.",
  },
  {
    label: "Relationship context",
    body: "Familiarity and warmth often outweigh millimeter-level proportions offline.",
  },
];

const LIMITATIONS = [
  "Reference ranges draw heavily from aesthetic and anthropometric sources that under-represent many populations. A lower number can simply mean distance from those ranges.",
  "A single still cannot capture voice, humor, posture, or movement—signals that dominate real social judgments.",
  "Camera height, lens distortion, and hard shadows change landmark placement. The tool scores the image you feed it, not a fixed “true face.”",
  "The output is a geometric distance score for private feedback. It is not a medical finding, dating rank, or moral rating.",
  "If a result feels harmful, stop. Close the page and use tools that support you—not ones that reduce you to a number.",
];

const TIPS = [
  {
    title: "Camera at eye height",
    body: "Shoot straight-on. Chin-up or chin-down shots stretch vertical thirds and can fake asymmetry.",
  },
  {
    title: "Resting face, not a pose smile",
    body: "A big smile pulls the mouth and cheeks. A calm expression keeps landmarks more stable across runs.",
  },
  {
    title: "Clear jaw and hairline",
    body: "Bangs or hair over the jaw hide edges the detector needs. Pin hair back when you can.",
  },
  {
    title: "Skip ultra-wide selfie lenses",
    body: "Close ultra-wide optics warp the center of the face. Prefer the rear camera or a bit more distance.",
  },
  {
    title: "Soft light from the front",
    body: "Side shadows create false edges. Even window light facing you is usually enough.",
  },
];

const FAQ = [
  {
    q: "What does Face Rating’s AI Attractiveness Test actually measure?",
    a: "It estimates facial harmony from a photo using four geometry checks—symmetry, vertical thirds, horizontal fifths, and a length-to-width target—combined into one 0–100 score. It does not claim to predict how every person will react to your face.",
  },
  {
    q: "Is the AI Attractiveness Test free?",
    a: "Yes. You can run the free scan without an account. Optional paid Face Report unlocks deeper write-ups and planning; the free path is meant for a quick, private baseline.",
  },
  {
    q: "Will my photo be uploaded for the free AI Attractiveness Test?",
    a: "The free flow is built so landmark work can run in the browser. We design free scoring so the original image stays on your device whenever that path is active; only derived metrics may be kept briefly if you save a result or open a paid report.",
  },
  {
    q: "How is this different from random “beauty score” apps?",
    a: "We publish the component weights (35% / 25% / 25% / 15%) and explain limits on the same page as the scanner. Many apps only return a black-box number with no formula.",
  },
  {
    q: "What score should I aim for?",
    a: "On this scale, about 78+ is above the tool’s midpoint band, 83+ is strong, and 87+ is the top tier. Those cutoffs are for this product only—they are not global beauty percentiles.",
  },
  {
    q: "Can grooming change my score?",
    a: "Hair, makeup, and photo setup can change how landmarks land. That is useful for comparing shots, not for proving permanent skeletal change. Use consistent photo conditions when you re-test.",
  },
  {
    q: "Why might my number feel lower than expected?",
    a: "Common causes: angled selfies, open-mouth smiles, uneven light, and ultra-wide lenses. The top of the scale is also strict—near-90 scores need strong alignment on every component.",
  },
  {
    q: "Is the model biased?",
    a: "Many published aesthetic targets come from datasets and clinical literature with Western and Eurocentric skew. Face Rating’s AI Attractiveness Test does not label race or gender, but its reference ranges still reflect those traditions. Use the score as one geometric lens, not a universal ranking.",
  },
  {
    q: "Should I pick dating photos with this score alone?",
    a: "It can break ties when lighting and angle differ. Warmth and a natural expression often matter more in real matching data than a slightly higher geometry score.",
  },
];

/** Related tools/guides — parity with thefacereport attractiveness footer grid */
const RELATED = [
  {
    title: "Face Symmetry Test",
    body: "5-feature symmetry breakdown",
    href: FREE_TEST_HREF,
  },
  {
    title: "Golden Ratio Calculator",
    body: "Phi (1.618) face proportion analysis",
    href: FREE_TEST_HREF,
  },
  {
    title: "Facial Ratios Calculator",
    body: "fWHR, midface, eye spacing, and more",
    href: FREE_TEST_HREF,
  },
  {
    title: "How to Improve Facial Symmetry",
    body: "Habits, exercises, and treatments",
    href: "/posts",
  },
  {
    title: "Personal Color Analysis",
    body: "What season am I? Free 12-season verdict from a selfie",
    href: FREE_TEST_HREF,
  },
];

const REFS = [
  {
    cite: "Rhodes, G. (2006).",
    title: "Review of evolutionary perspectives on facial beauty.",
    rest: "Summarizes evidence on symmetry, averageness, and related cues.",
  },
  {
    cite: "Langlois & Roggman (1990).",
    title: "Work on averaged faces and attractiveness ratings.",
    rest: "Classic demonstration that mean-like faces often rate higher in lab settings.",
  },
  {
    cite: "Little, A. C. (2014).",
    title: "Broader review of facial attractiveness research.",
    rest: "Covers modern findings beyond single-ratio folklore.",
  },
  {
    cite: "MediaPipe face mesh documentation (Google).",
    title: "Landmark topology used by many browser face tools.",
    rest: "Describes the multi-point mesh underlying on-device face geometry.",
  },
];

function Block({ children }: { children: ReactNode }) {
  return (
    <section style={{ borderTop: `1px solid ${V.line}`, backgroundColor: V.bg }}>
      <div className="mx-auto max-w-[1152px] px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-3xl">{children}</div>
      </div>
    </section>
  );
}

function H2({ children }: { children: ReactNode }) {
  return (
    <h2
      className="font-black tracking-tight"
      style={{
        color: V.ink,
        fontSize: "clamp(1.5rem, 2.5vw, 1.85rem)",
        letterSpacing: "-0.025em",
      }}
    >
      {children}
    </h2>
  );
}

function P({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 text-[16px] font-medium leading-relaxed" style={{ color: V.muted }}>
      {children}
    </p>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <p
      className="text-[11px] font-semibold uppercase tracking-[0.16em]"
      style={{ color: V.accent }}
    >
      {children}
    </p>
  );
}

/**
 * AI Attractiveness Test tool page — Face Rating design system (burgundy/rose).
 * Single white paper background throughout (no alternating bands).
 */
export default function AttractivenessToolPage() {
  return (
    <div
      className="flex min-h-screen flex-col font-sans text-base antialiased"
      style={{ backgroundColor: V.bg, color: V.ink }}
    >
      <FaceRatingSiteHeader />

      <main className="flex-1">
        <section className="mx-auto max-w-[1152px] px-5 py-12 sm:px-8" style={{ backgroundColor: V.bg }}>
          <div className="text-center">
            <h1
              className="font-black tracking-tight"
              style={{
                fontSize: "clamp(1.85rem, 3.5vw, 2.75rem)",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                color: V.ink,
              }}
            >
              AI Attractiveness{" "}
              <span className="font-serif font-normal italic" style={{ color: V.accentItalic }}>
                Test
              </span>
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-[16px] leading-relaxed" style={{ color: V.muted }}>
              Run a free Face Rating scan from one selfie. The AI Attractiveness Test turns landmark
              geometry into a clear 0–100 balance score—with weights and limits spelled out on this
              page.
            </p>
          </div>
          <div className="mt-10">
            <AttractivenessUpload />
          </div>
        </section>

        <Block>
          <H2>What you get from this scan</H2>
          <P>
            Face Rating built the AI Attractiveness Test for people who want a private, repeatable
            check—not a viral roast and not a mystery API number. Upload a front photo, let the
            browser map hundreds of facial points, and read a score that breaks into four geometry
            pieces you can actually inspect.
          </P>
          <P>
            Use the result as a personal baseline before styling experiments, photo picks, or a
            deeper Face Report. It is a measurement of the image you provide, not a lifetime rank of
            your worth.
          </P>
        </Block>

        <Block>
          <H2>How to read your 0–100 result</H2>
          <P>
            On the AI Attractiveness Test scale, higher values mean the photo’s landmarks sit closer
            to the tool’s chosen balance targets. The bands below match how Face Rating labels live
            results, so the story and the number stay consistent:
          </P>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {TIERS.map((t) => (
              <li
                key={t.range}
                className="rounded-xl border border-[#e5e5e5] bg-white p-4 sm:p-5"
              >
                <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span
                    className="inline-flex items-center rounded-md bg-[#FFF1F2] px-2 py-0.5 text-[13px] font-black tabular-nums"
                    style={{ color: V.accent }}
                  >
                    {t.range}
                  </span>
                  <span className="text-[16px] font-black" style={{ color: V.ink }}>
                    {t.name}
                  </span>
                </p>
                <p className="mt-2 text-[14px] font-medium leading-relaxed" style={{ color: V.muted }}>
                  {t.body}
                </p>
              </li>
            ))}
          </ul>
        </Block>

        <Block>
          <H2>The four pieces behind the score</H2>
          <P>
            Every AI Attractiveness Test run combines the same four components. The percentages are
            Face Rating’s production mix—published here so you can see what dominates the total.
          </P>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {FORMULA.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-[#e5e5e5] bg-white p-4 sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-[16px] font-black leading-snug" style={{ color: V.ink }}>
                    {f.title}
                  </h3>
                  <span
                    className="shrink-0 rounded-full bg-[#9F1239] px-2.5 py-0.5 text-[12px] font-black tabular-nums text-white"
                  >
                    {f.weight}
                  </span>
                </div>
                <div
                  className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#f5f5f5]"
                  aria-hidden
                >
                  <div
                    className="h-full rounded-full bg-[#9F1239]"
                    style={{ width: f.weight }}
                  />
                </div>
                <p className="mt-3 text-[14px] font-medium leading-relaxed" style={{ color: V.muted }}>
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </Block>

        <Block>
          <H2>Research context (and what a still image skips)</H2>
          <P>
            Psychology and vision research describe several cues that often move average
            attractiveness ratings. The AI Attractiveness Test only samples the geometry subset that
            a single photo can support.
          </P>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-[#e5e5e5] bg-white p-4 sm:p-5">
              <Label>Often supported in literature</Label>
              <ul className="mt-4 space-y-3">
                {RESEARCH_SUPPORTED.map((r) => (
                  <li
                    key={r.label}
                    className="rounded-lg border border-[#f0f0f0] bg-[#fafafa] px-3 py-2.5"
                  >
                    <p className="text-[14px] font-black" style={{ color: V.ink }}>
                      {r.label}
                    </p>
                    <p className="mt-0.5 text-[13px] font-medium leading-relaxed" style={{ color: V.muted }}>
                      {r.body}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-[#e5e5e5] bg-white p-4 sm:p-5">
              <Label>Outside a photo score</Label>
              <ul className="mt-4 space-y-3">
                {RESEARCH_MISSES.map((r) => (
                  <li
                    key={r.label}
                    className="rounded-lg border border-[#f0f0f0] bg-[#fafafa] px-3 py-2.5"
                  >
                    <p className="text-[14px] font-black" style={{ color: V.ink }}>
                      {r.label}
                    </p>
                    <p className="mt-0.5 text-[13px] font-medium leading-relaxed" style={{ color: V.muted }}>
                      {r.body}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Block>

        <Block>
          <H2>Honest limits of automated face scoring</H2>
          <div className="mt-2">
            <Label>Read this before you over-index on a number</Label>
          </div>
          <ul className="mt-5 space-y-3">
            {LIMITATIONS.map((line, i) => (
              <li
                key={line}
                className="flex gap-3 rounded-xl border border-[#e5e5e5] bg-white p-4"
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFF1F2] text-[12px] font-black"
                  style={{ color: V.accent }}
                  aria-hidden
                >
                  {i + 1}
                </span>
                <p className="text-[14px] font-medium leading-relaxed" style={{ color: V.muted }}>
                  {line}
                </p>
              </li>
            ))}
          </ul>
        </Block>

        <Block>
          <H2>Photo setup that keeps results comparable</H2>
          <P>
            When you re-run this scan, keep the setup similar so score swings reflect the face
            crop—not a new camera angle.
          </P>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {TIPS.map((t, i) => (
              <div
                key={t.title}
                className="rounded-xl border border-[#e5e5e5] bg-white p-4 sm:p-5"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#9F1239] text-[13px] font-black text-white"
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <p className="text-[13px] font-bold uppercase tracking-[0.12em]" style={{ color: V.accent }}>
                    {t.title}
                  </p>
                </div>
                <p className="mt-3 text-[14px] font-medium leading-relaxed" style={{ color: V.muted }}>
                  {t.body}
                </p>
              </div>
            ))}
          </div>
        </Block>

        <Block>
          <H2>FAQ</H2>
          <Accordion type="single" collapsible className="mt-6 w-full">
            {FAQ.map((item, i) => (
              <AccordionItem
                key={item.q}
                value={`faq-${i}`}
                className="border-b"
                style={{ borderColor: V.line }}
              >
                <AccordionTrigger className="py-4 text-left text-[16px] font-bold hover:no-underline data-[state=open]:text-[#9F1239]" style={{ color: V.ink }}>
                  {item.q}
                </AccordionTrigger>
                <AccordionContent
                  className="pb-4 text-[14px] font-medium leading-relaxed"
                  style={{ color: V.muted }}
                >
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Block>

        <Block>
          <H2>Further reading</H2>
          <ul className="mt-6 space-y-4">
            {REFS.map((r) => (
              <li key={r.cite} className="text-[14px] leading-relaxed" style={{ color: V.muted }}>
                <span className="font-semibold" style={{ color: V.ink }}>
                  {r.cite}
                </span>{" "}
                <span className="font-serif italic" style={{ color: V.accentItalic }}>
                  {r.title}
                </span>{" "}
                {r.rest}
              </li>
            ))}
          </ul>
        </Block>

        <Block>
          <H2>Related Tools and Guides</H2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {RELATED.map((r) => (
              <Link
                key={r.title}
                href={r.href}
                className="block border border-[#e5e5e5] bg-white p-5 transition-transform duration-200 hover:translate-y-[-2px] hover:border-[#9F1239]/25"
              >
                <p className="font-bold" style={{ color: V.ink }}>
                  {r.title}
                </p>
                <p className="mt-1 text-[14px] font-medium leading-snug" style={{ color: V.muted }}>
                  {r.body}
                </p>
              </Link>
            ))}
          </div>
        </Block>
      </main>

      <FaceRatingSiteFooter />
    </div>
  );
}
