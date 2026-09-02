"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Check,
  Eye,
  ListOrdered,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import FaceRatingSiteHeader from "./site-header";
import FaceRatingSiteFooter from "./site-footer";
import AttractivenessUpload from "./attractiveness-upload";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const PRICE = "$9.90";

const PILLARS = [
  {
    kicker: "Understand",
    title: "Know what drives your result",
    body: "40+ measurements across 7 facial regions, a harmony radar, facial ratios, skin observations, and a clear read on your strongest and highest-leverage areas.",
    icon: Target,
  },
  {
    kicker: "See",
    title: "Preview what suits you",
    body: "An AI styling concept and 6 hairstyle try-ons on your photo. You also get face-shape frame guidance and your 12-season color palette.",
    icon: Eye,
  },
  {
    kicker: "Act",
    title: "Follow a prioritized plan",
    body: "First-72-hours actions and a four-week plan ordered around the areas your report identifies—not a generic checklist.",
    icon: ListOrdered,
  },
];

const FEATURE_READINGS = [
  { label: "Face shape", value: "Oval", meta: "92/100 match" },
  { label: "Canthal tilt", value: "+2.1°", meta: "upturned" },
  { label: "Eye spacing", value: "0.46", meta: "of face width" },
  { label: "Nose projection", value: "Not scored", meta: "needs a side photo" },
];

const RATIO_GAUGES = [
  { label: "Facial thirds", band: "Excellent", value: "1.02", left: "shorter", right: "longer", pct: 52 },
  { label: "Midface ratio", band: "Strong", value: "0.98", left: "compact", right: "elongated", pct: 48 },
  { label: "Eye spacing", band: "Strong", value: "0.46", left: "closer-set", right: "wider-set", pct: 55 },
];

const RADAR = [
  { label: "Symmetry", score: 88 },
  { label: "Golden", score: 84 },
  { label: "Thirds", score: 91 },
  { label: "Fifths", score: 86 },
  { label: "Eyes", score: 93 },
  { label: "Jaw", score: 80 },
];

const PLAN = [
  {
    n: "1",
    title: "Brow framing",
    moves: "Moves eyebrow symmetry",
    why: "Sparse tails end the frame before it finishes — the region's lowest score.",
    action: "Book a professional brow shape with the tails left full-length",
    tags: ["grooming", "once, refresh every 3 weeks", "First signal · immediately"],
    whyFirst: "The fastest visible change in the report — and it upgrades the strongest region.",
  },
  {
    n: "2",
    title: "Skin evenness",
    moves: "Moves skin evenness",
    why: "Mild tonal variation that photographs as texture in hard light.",
    action: "Broad-spectrum SPF every morning; a low-strength retinoid three nights a week",
    tags: ["skincare", "daily", "First signal · 4-6 weeks"],
    whyFirst: null,
  },
];

const HOW = [
  {
    n: "1",
    title: "Measure locally",
    body: "MediaPipe maps your face in the browser; the free measurement photo is not sent to a server.",
  },
  {
    n: "2",
    title: "Choose the report",
    body: "With explicit permission, the paid workflow uses cloud AI to create the promised images and recommendations.",
  },
  {
    n: "3",
    title: "Keep the result",
    body: "Read the web report and keep the emailed PDF. A private copy of your photo stays with your report so before-and-after comparisons keep working until you delete it.",
  },
];

const FAQS = [
  {
    q: "How much does the full report cost?",
    a: `The full Face Report is ${PRICE} once. There is no subscription or auto-renewal, and it includes a 7-day money-back guarantee.`,
  },
  {
    q: "What's the difference between the free analysis and the paid full report?",
    a: "The free analysis gives you core measurements: symmetry, thirds, fifths, golden ratio, a harmony score, and the strongest / highest-leverage signal. The full report adds a harmony radar, region write-ups, ratio gauges, an AI styling concept, 6 hairstyle previews, color guidance, prioritized actions, a four-week plan, a saved web report, and an emailed PDF.",
  },
  {
    q: "How accurate are the AI recommendations?",
    a: "Recommendations are grounded in your actual measurements rather than generic templates—so advice about your jawline references your specific jaw scores and ratios. Treat AI guidance as a starting point for research and qualified professional advice, not a definitive medical plan.",
  },
  {
    q: "Is my photo private?",
    a: "Free measurement runs in your browser when possible, so that photo is not uploaded for core geometry scoring. If you unlock the full report and consent, the photo is sent securely to generate paid images and write-ups. Free-scan photos auto-delete within two hours; purchased reports keep a private copy until you delete them. Nothing is sold or used to train public models.",
  },
  {
    q: "Can I run the full report on multiple photos?",
    a: "Yes — each report covers one photo. Buy a report whenever you want to analyze a new photo or track changes over time. Each is a one-time charge with no subscription.",
  },
  {
    q: "Can I get a refund?",
    a: "Yes — 7-day money-back guarantee. If you're not happy, contact us within 7 days and we'll refund you in full. If a promised core deliverable cannot be completed, we will refund the report.",
  },
  {
    q: "What photo works best for the full analysis?",
    a: "A clear, front-facing photo with a neutral expression, even soft lighting, hair off the face, and no glasses or hats. Avoid extreme wide-angle selfies — use a back camera at arm's length or have someone take the photo from a few feet away.",
  },
];

function SampleRadar({ scores }: { scores: { label: string; score: number }[] }) {
  const cx = 100;
  const cy = 100;
  const maxR = 62;
  const n = scores.length;
  const pointAt = (i: number, r: number) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r] as const;
  };
  const rings = [0.35, 0.65, 1].map((t) =>
    Array.from({ length: n }, (_, i) => pointAt(i, maxR * t))
      .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
      .join(" ")
  );
  const dataPoly = scores
    .map((s, i) => {
      const [x, y] = pointAt(i, (s.score / 100) * maxR);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const dataPts = scores.map((s, i) => pointAt(i, (s.score / 100) * maxR));
  const labelPos = scores.map((s, i) => {
    const [x, y] = pointAt(i, maxR + 18);
    let anchor: "middle" | "start" | "end" = "middle";
    if (i === 1 || i === 2) anchor = "start";
    if (i === 4 || i === 5) anchor = "end";
    return { ...s, x, y, anchor };
  });

  return (
    <svg viewBox="0 0 200 200" className="mx-auto h-auto w-full max-w-[280px]" aria-hidden>
      {rings.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="#e8e8e8" strokeWidth={1} />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const [x, y] = pointAt(i, maxR);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#e8e8e8" strokeWidth={1} />;
      })}
      <polygon
        points={dataPoly}
        fill="#9F1239"
        fillOpacity={0.14}
        stroke="#9F1239"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      {dataPts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.4} fill="#9F1239" />
      ))}
      {labelPos.map((l) => (
        <text
          key={l.label}
          x={l.x}
          y={l.y}
          textAnchor={l.anchor}
          fontSize={9}
          fontWeight={700}
          fill="#6b7280"
          dominantBaseline="middle"
        >
          {l.label}
        </text>
      ))}
    </svg>
  );
}

/**
 * Face Report landing — structure aligned to thefacereport /tools/full-analysis.
 * Brand burgundy (#9F1239) Face Rating design system.
 */
export default function FullAnalysisPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-base text-[#0a0a0a] antialiased">
      <FaceRatingSiteHeader />

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top,#27272a_0%,#18181b_60%)]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(rgba(159,18,57,0.18) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
              maskImage: "linear-gradient(to bottom, black, transparent 85%)",
              WebkitMaskImage: "linear-gradient(to bottom, black, transparent 85%)",
            }}
          />
          <div className="relative mx-auto max-w-6xl px-6 py-16 text-center sm:py-20">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/90">
              <span className="size-1.5 rounded-full bg-[#FB7185]" />
              One-time · No subscription · 7-day guarantee
            </div>
            <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Know what suits your face—and what to do next.
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-white/75">
              One private scan turns 478 landmarks into a clear Face Report with 40+ measurements, 6
              hairstyle try-ons, your 12-season palette, an AI styling concept, and a prioritized
              four-week plan.
            </p>

            <div className="mx-auto mt-8 flex max-w-md flex-col items-center">
              <p className="text-5xl font-black tabular-nums tracking-tight text-white">{PRICE}</p>
              <p className="mt-1 text-sm text-white/60">
                Web report + emailed PDF · no subscription
              </p>
              <a
                href="#report-analyzer"
                className="mt-6 inline-flex h-12 w-full max-w-sm items-center justify-center rounded-lg bg-[#9F1239] px-6 text-sm font-bold text-white shadow-lg transition-colors hover:bg-[#881337] sm:w-auto sm:min-w-[280px]"
              >
                Create my full report — {PRICE} once
              </a>
              <p className="mt-3 max-w-sm text-xs leading-relaxed text-white/50">
                Free measurements come first. Stripe asks for your email so we can send your PDF and
                save your report.
              </p>
            </div>

            <div className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-4 border-t border-white/10 pt-8">
              {[
                { n: "22,000+", l: "analyses in 30 days" },
                { n: "7-day", l: "money-back guarantee" },
                { n: "478", l: "facial landmarks" },
              ].map((s) => (
                <div key={s.l} className="text-center">
                  <p className="text-xl font-black text-white sm:text-2xl">{s.n}</p>
                  <p className="mt-1 text-[11px] font-medium leading-snug text-white/55 sm:text-xs">
                    {s.l}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Understand / See / Act ── */}
        <section className="border-b border-[#e5e5e5] bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-[#9F1239]">
              A report built for decisions
            </p>
            <h2 className="mt-3 text-center text-3xl font-black tracking-tight text-[#0a0a0a] sm:text-4xl">
              Understand. See. Act.
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {PILLARS.map((p) => (
                <div
                  key={p.kicker}
                  className="rounded-2xl border border-[#e5e5e5] bg-[#fafafa]/60 p-6"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#9F1239]/10 text-[#9F1239]">
                    <p.icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <p className="mt-4 text-xs font-bold uppercase tracking-wider text-[#9F1239]">
                    {p.kicker}
                  </p>
                  <h3 className="mt-1 text-lg font-black tracking-tight text-[#0a0a0a]">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#525252]">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Sample report ── */}
        <section className="bg-[#fafafa] py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-[#737373]">
              Sample report preview
            </p>
            <h2 className="mt-3 text-center text-3xl font-black tracking-tight text-[#0a0a0a] sm:text-4xl">
              Not a number — a full breakdown
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-[#525252]">
              These cards use clearly labelled sample data. Your report is generated from your own
              scan and photo.
            </p>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {/* Feature readings */}
              <div className="overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white shadow-sm">
                <div className="border-b border-[#e5e5e5] bg-[#f5f5f5]/80 px-5 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#737373]">
                    Measured
                  </p>
                  <h3 className="text-lg font-black tracking-tight">Your feature readings</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 p-5">
                  {FEATURE_READINGS.map((f) => (
                    <div
                      key={f.label}
                      className="rounded-xl border border-[#e5e5e5] bg-[#fafafa] p-3"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#737373]">
                        {f.label}
                      </p>
                      <p className="mt-1 text-base font-black text-[#0a0a0a]">{f.value}</p>
                      <p className="text-xs text-[#737373]">{f.meta}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-4 border-t border-[#e5e5e5] px-5 py-4">
                  {RATIO_GAUGES.map((g) => (
                    <div key={g.label}>
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-bold">
                          {g.label}{" "}
                          <span className="font-semibold text-emerald-600">{g.band}</span>
                        </p>
                        <p className="text-sm font-black tabular-nums text-[#0a0a0a]">{g.value}</p>
                      </div>
                      <div className="relative mt-2 h-2 rounded-full bg-[#e5e5e5]">
                        <div
                          className="absolute inset-y-0 left-[20%] right-[20%] rounded-full bg-[#9F1239]/20"
                          aria-hidden
                        />
                        <div
                          className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white bg-[#9F1239] shadow"
                          style={{ left: `calc(${g.pct}% - 7px)` }}
                        />
                      </div>
                      <div className="mt-1 flex justify-between text-[10px] text-[#a3a3a3]">
                        <span>{g.left}</span>
                        <span>{g.right}</span>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs leading-relaxed text-[#737373]">
                    Placement inside the shaded reference band — and an honest “not scored” state
                    when a front photo can&apos;t support the read.
                  </p>
                </div>
              </div>

              {/* Harmony radar */}
              <div className="overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white shadow-sm">
                <div className="border-b border-[#e5e5e5] bg-[#f5f5f5]/80 px-5 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#737373]">
                    Diagnostic
                  </p>
                  <h3 className="text-lg font-black tracking-tight">Your harmony radar</h3>
                </div>
                <div className="px-5 py-6">
                  <p className="mb-2 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#9F1239]">
                    Your harmony profile
                  </p>
                  <SampleRadar scores={RADAR} />
                  <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-relaxed text-[#737373]">
                    Each spoke is a core dimension of facial harmony, scored 0–100. The further the
                    shape reaches toward the edge, the stronger that dimension—the dents are your
                    highest-leverage areas.
                  </p>
                  <ul className="sr-only">
                    {RADAR.map((r) => (
                      <li key={r.label}>
                        {r.label}: {r.score} out of 100
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Ranked plan */}
              <div className="overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white shadow-sm lg:col-span-2">
                <div className="border-b border-[#e5e5e5] bg-[#f5f5f5]/80 px-5 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#737373]">
                    Every recommendation, ranked
                  </p>
                  <h3 className="text-lg font-black tracking-tight">Your ranked plan</h3>
                </div>
                <div className="divide-y divide-[#e5e5e5]">
                  {PLAN.map((item) => (
                    <div key={item.n} className="flex gap-4 px-5 py-5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#9F1239] text-sm font-black text-white">
                        {item.n}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-black text-[#0a0a0a]">{item.title}</p>
                        <p className="text-xs font-semibold text-[#9F1239]">{item.moves}</p>
                        <p className="mt-1 text-sm text-[#525252]">{item.why}</p>
                        <ul className="mt-2 space-y-1">
                          <li className="flex gap-2 text-sm">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#9F1239]" />
                            {item.action}
                          </li>
                        </ul>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {item.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded-md bg-[#f5f5f5] px-2 py-0.5 text-[10px] font-semibold text-[#525252]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                        {item.whyFirst ? (
                          <p className="mt-2 text-xs font-medium text-[#737373]">
                            <strong className="text-[#0a0a0a]">Why first:</strong> {item.whyFirst}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="border-t border-[#e5e5e5] px-5 py-3 text-xs text-[#737373]">
                  Each move names what it targets, its upkeep, cost band, and honest time to the
                  first visible result.
                </p>
              </div>

              {/* Style cards + visual teasers */}
              <div className="overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white shadow-sm">
                <div className="border-b border-[#e5e5e5] bg-[#f5f5f5]/80 px-5 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#737373]">
                    Styling
                  </p>
                  <h3 className="text-lg font-black tracking-tight">Style decision cards</h3>
                </div>
                <div className="p-5">
                  <div className="relative overflow-hidden rounded-xl border border-[#FECDD3] bg-gradient-to-br from-[#FFF1F2] via-[#fafafa] to-[#FFE4E6] p-5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#9F1239] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      <Sparkles className="h-3 w-3" />
                      Recommended
                    </span>
                    <p className="mt-3 text-xl font-black tracking-tight">Soft waves</p>
                    <p className="mt-1 text-sm text-[#525252]">
                      Volume and bend through the lengths
                    </p>
                    <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      {[
                        ["Maintenance", "medium"],
                        ["Styling time", "10 min"],
                        ["Cut cadence", "8–10 weeks"],
                        ["Parting", "Center"],
                      ].map(([k, v]) => (
                        <div key={k} className="rounded-lg bg-white/80 px-2.5 py-2">
                          <dt className="font-semibold text-[#737373]">{k}</dt>
                          <dd className="font-bold text-[#0a0a0a]">{v}</dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-4 text-xs leading-relaxed text-[#525252]">
                      <strong className="text-[#0a0a0a]">Why it works:</strong> Matched to face
                      shape — framing finishes just below the jaw.
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-[#525252]">
                      <strong className="text-[#0a0a0a]">The honest tradeoff:</strong> Needs a round
                      brush or ten minutes of hot-tool time to hold the bend.
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white shadow-sm">
                <div className="border-b border-[#e5e5e5] bg-[#f5f5f5]/80 px-5 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#737373]">
                    Visualized
                  </p>
                  <h3 className="text-lg font-black tracking-tight">Your AI styling concept</h3>
                  <p className="mt-0.5 text-sm text-[#737373]">Visualized on your own photo</p>
                </div>
                <div className="grid grid-cols-2 gap-px bg-[#e5e5e5]">
                  <div className="relative aspect-[3/4] overflow-hidden bg-white">
                    <Image
                      src="/face-rating/glowup-before.webp?v=3"
                      alt="AI styling concept — before"
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 45vw, 270px"
                    />
                    <span className="absolute left-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                      before
                    </span>
                  </div>
                  <div className="relative aspect-[3/4] overflow-hidden bg-white">
                    <Image
                      src="/face-rating/glowup-after.webp?v=3"
                      alt="AI styling concept — after"
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 45vw, 270px"
                    />
                    <span className="absolute left-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                      after
                    </span>
                  </div>
                </div>
                <p className="border-t border-[#e5e5e5] px-5 py-3 text-xs text-[#737373]">
                  A styling and grooming concept—not a forecast or a promise of structural change.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Upload / analyzer ── */}
        <section id="report-analyzer" className="scroll-mt-20 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-[#9F1239]">
              Start with a free scan
            </p>
            <h2 className="mt-3 text-center text-3xl font-black tracking-tight text-[#0a0a0a] sm:text-4xl">
              Create your personal Face Report
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-[#525252]">
              Your core measurements run free first. Review them, then choose whether to create the
              complete report for {PRICE}.
            </p>
            <div className="mt-10">
              {/* After scan → freemium /results/[id] preview (checkout path) */}
              <AttractivenessUpload
                completeMode="results"
                resultsSrc="full-analysis"
              />
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="border-t border-[#e5e5e5] bg-[#fafafa] py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-[#737373]">
              How it works
            </p>
            <h2 className="mt-3 text-center text-3xl font-black tracking-tight sm:text-4xl">
              Private free scan, then your complete report
            </h2>
            <ol className="mx-auto mt-10 max-w-3xl space-y-6">
              {HOW.map((step) => (
                <li key={step.n} className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#9F1239] text-sm font-black text-white">
                    {step.n}
                  </span>
                  <div>
                    <h3 className="text-base font-black text-[#0a0a0a]">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-[#525252]">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mx-auto mt-12 max-w-md rounded-2xl border-2 border-[#e5e5e5] bg-white p-6 text-center shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-[#9F1239]">
                The Face Report
              </p>
              <p className="mt-2 text-4xl font-black tabular-nums text-[#9F1239]">{PRICE}</p>
              <p className="mt-1 text-sm text-[#525252]">
                Web report + emailed PDF · no subscription
              </p>
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-left">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <p className="text-xs font-semibold leading-snug text-emerald-900">
                  Not happy with your report? Full refund within 7 days — just ask, no questions.
                </p>
              </div>
              <a
                href="#report-analyzer"
                className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#9F1239] text-sm font-bold text-white hover:bg-[#881337]"
              >
                Create my full report — {PRICE} once
              </a>
              <p className="mt-3 text-xs text-[#737373]">
                Stripe asks for your email so we can send your PDF and save your report.
              </p>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-6">
            <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-[#737373]">
              Questions
            </p>
            <h2 className="mt-3 text-center text-3xl font-black tracking-tight">
              Frequently asked
            </h2>
            <Accordion type="single" collapsible className="mt-8 w-full">
              {FAQS.map((f, i) => (
                <AccordionItem key={f.q} value={`faq-${i}`} className="border-[#e5e5e5]">
                  <AccordionTrigger className="text-left text-sm font-bold text-[#0a0a0a] hover:no-underline sm:text-base">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-[#525252]">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <p className="mt-8 text-center text-sm text-[#737373]">
              Prefer the free score only?{" "}
              <Link
                href="/tools/ai-attractiveness-test"
                className="font-semibold text-[#9F1239] underline-offset-2 hover:underline"
              >
                Run AI Attractiveness Test
              </Link>
            </p>
          </div>
        </section>
      </main>

      <FaceRatingSiteFooter />
    </div>
  );
}
