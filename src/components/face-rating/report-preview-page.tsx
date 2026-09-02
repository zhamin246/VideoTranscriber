"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Lock, Share2, ShieldCheck } from "lucide-react";
import FaceRatingSiteHeader from "./site-header";
import FaceRatingSiteFooter from "./site-footer";
import CheckoutConsentModal, { useCheckoutConsent } from "./checkout-consent-modal";
import ShareCardModal from "./share-card-modal";
import {
  estimateFaceShape,
  isScanUnlocked,
  loadScanResult,
  scoreBand,
  tierFromScore,
  type StoredScanResult,
} from "@/lib/face-rating/result-store";

const PRICE = "$9.90";
const COHORT = 7997;

/** Tier color for /10 score (product palette; Rising uses amber like competitor). */
function tierColor(score: number): string {
  if (score >= 87) return "#9F1239";
  if (score >= 83) return "#9F1239";
  if (score >= 78) return "#881337";
  if (score >= 60) return "#f59e0b"; // Rising
  return "#E11D48";
}

function bandColor(score: number): string {
  if (score >= 78) return "#059669"; // green
  if (score >= 60) return "#d97706"; // amber-600
  return "#737373";
}

function HarmonyRadar({
  scores,
  color,
}: {
  scores: { label: string; score: number }[];
  color: string;
}) {
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
      const [x, y] = pointAt(i, (Math.min(100, Math.max(8, s.score)) / 100) * maxR);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const dataPts = scores.map((s, i) =>
    pointAt(i, (Math.min(100, Math.max(8, s.score)) / 100) * maxR)
  );
  const labelPos = scores.map((s, i) => {
    const [x, y] = pointAt(i, maxR + 18);
    let anchor: "middle" | "start" | "end" = "middle";
    if (i === 1 || i === 2) anchor = "start";
    if (i === 4 || i === 5) anchor = "end";
    return { ...s, x, y, anchor };
  });

  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      <svg viewBox="0 0 200 200" className="h-auto w-full" aria-hidden>
        {rings.map((pts, i) => (
          <polygon key={i} points={pts} fill="none" stroke="#e8e8e8" strokeWidth={1} />
        ))}
        {Array.from({ length: n }, (_, i) => {
          const [x, y] = pointAt(i, maxR);
          return (
            <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#e8e8e8" strokeWidth={1} />
          );
        })}
        <polygon
          points={dataPoly}
          fill={color}
          fillOpacity={0.14}
          stroke={color}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
        {dataPts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2.4} fill={color} />
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
    </div>
  );
}

/**
 * Section header — matches thefacereport:
 * kicker 10px tracking · accent number · border-b · h2 with italic em
 */
function SectionHead({
  num,
  kicker,
  kickerRest,
  titleBefore,
  titleEm,
  body,
}: {
  num: string;
  kicker: string;
  kickerRest?: string;
  titleBefore: string;
  titleEm: string;
  body: string;
}) {
  return (
    <div className="mb-4 border-b border-[#ececec] pb-2.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9ca3af]">
        <span className="text-[#9F1239]">
          {num} ·{" "}
        </span>
        {kicker}
        {kickerRest ? (
          <span className="font-medium">
            {" "}
            · {kickerRest}
          </span>
        ) : null}
      </p>
      <h2 className="text-[1.7rem] font-black leading-[1.1] tracking-tight text-[#0a0a0a] sm:text-3xl">
        {titleBefore}{" "}
        <em className="font-serif font-normal italic text-[#9F1239]">{titleEm}</em>
      </h2>
      <p className="mt-1.5 max-w-[60ch] text-sm leading-relaxed text-[#0a0a0a]/60">{body}</p>
    </div>
  );
}

/**
 * Locked region pattern from thefacereport:
 * blurred content underneath + full-area unlock overlay (big lock + CTA).
 */
function LockedPanel({
  title,
  body,
  ariaLabel,
  children,
  largeLock,
  onUnlock,
  unlocked,
}: {
  title: string;
  body: string;
  ariaLabel: string;
  children: ReactNode;
  largeLock?: boolean;
  onUnlock: () => void;
  unlocked?: boolean;
}) {
  if (unlocked) {
    return <div className="relative">{children}</div>;
  }
  const lockSize = largeLock ? "h-14 w-14" : "h-12 w-12";
  const iconSize = largeLock ? "h-8 w-8" : "h-7 w-7";
  return (
    <div className="relative isolate">
      <div aria-hidden className="pointer-events-none select-none blur-[6px]">
        {children}
      </div>
      <button
        type="button"
        onClick={onUnlock}
        aria-label={ariaLabel}
        className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/20 px-5 py-6 text-center transition-colors hover:bg-white/35"
      >
        <span
          className={`flex ${lockSize} items-center justify-center rounded-full bg-[#9F1239] text-white shadow-lg`}
        >
          <Lock className={iconSize} strokeWidth={2} />
        </span>
        <span className="mt-3 text-sm font-bold uppercase tracking-wider text-[#0a0a0a]/80">
          {title}
        </span>
        <span className="mt-1 max-w-xs text-xs text-[#0a0a0a]/60">{body}</span>
        <span className="mt-3 inline-block rounded-lg bg-[#9F1239] px-4 py-2 text-xs font-bold text-white shadow-sm">
          Create my full report — {PRICE} once
        </span>
        <span className="mt-1 text-[10px] font-medium text-[#0a0a0a]/60">
          Web report + emailed PDF · no subscription
        </span>
      </button>
    </div>
  );
}

/**
 * Freemium /results/[id] preview — layout & chrome aligned to thefacereport results page.
 */
export default function ReportPreviewPage() {
  const params = useParams();
  const search = useSearchParams();
  const id = String(params?.id || "");
  const [data, setData] = useState<StoredScanResult | null>(null);
  const [ready, setReady] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const { open: checkoutOpen, setOpen: setCheckoutOpen, openCheckout } =
    useCheckoutConsent();

  const reloadScan = () => {
    const scan = loadScanResult(id);
    setData(scan);
    const flag =
      Boolean(scan?.unlocked) ||
      isScanUnlocked(id) ||
      search.get("unlocked") === "1";
    setUnlocked(flag);
  };

  useEffect(() => {
    reloadScan();
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- id/search drive reload
  }, [id, search]);

  const tier = useMemo(() => (data ? tierFromScore(data.score) : null), [data]);
  const color = data ? tierColor(data.score) : "#9F1239";
  const outOfTen = data ? (Math.round(data.score) / 10).toFixed(1) : "0";
  const faceShape =
    data?.faceShape ||
    estimateFaceShape(data?.detail?.goldenRatio ?? 1.2);

  const fs = data?.detail?.featureSymmetry;
  const radar = data
    ? [
        { label: "Symmetry", score: data.components.symmetry },
        { label: "Golden", score: data.components.golden },
        { label: "Thirds", score: data.components.thirds },
        { label: "Fifths", score: data.components.fifths },
        { label: "Eyes", score: fs?.eye ?? Math.round(data.components.symmetry * 0.95) },
        { label: "Jaw", score: fs?.jaw ?? Math.round(data.components.symmetry * 0.9) },
      ]
    : [];

  const standout = useMemo(() => {
    if (!fs) return { label: "Symmetry", score: data?.components.symmetry ?? 0 };
    const rows = [
      { label: "Eye symmetry", score: fs.eye },
      { label: "Eyebrow symmetry", score: fs.eyebrow },
      { label: "Nose symmetry", score: fs.nose },
      { label: "Mouth symmetry", score: fs.mouth },
      { label: "Jaw symmetry", score: fs.jaw },
    ];
    return rows.reduce((a, b) => (b.score > a.score ? b : a));
  }, [fs, data]);

  const leverage = useMemo(() => {
    if (!data) return { label: "Golden ratio", score: 0 };
    const rows = [
      { label: "Symmetry", score: data.components.symmetry },
      { label: "Golden ratio", score: data.components.golden },
      { label: "Facial thirds", score: data.components.thirds },
      { label: "Facial fifths", score: data.components.fifths },
    ];
    return rows.reduce((a, b) => (b.score < a.score ? b : a));
  }, [data]);

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <FaceRatingSiteHeader />
        <main className="flex flex-1 items-center justify-center text-sm text-[#737373]">
          Loading your report…
        </main>
      </div>
    );
  }

  const src = search.get("src") || data?.src || "attractiveness";
  const retestHref =
    src === "full-analysis"
      ? "/tools/full-analysis"
      : "/tools/ai-attractiveness-test";
  const retestLabel =
    src === "full-analysis"
      ? "Create my Face Report"
      : "Run AI Attractiveness Test";

  if (!data || !tier) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <FaceRatingSiteHeader />
        <main className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-6 text-center">
          <h1 className="text-2xl font-black">Scan not found</h1>
          <p className="mt-2 text-sm text-[#525252]">
            This preview only works in the browser session where you ran the free test.
          </p>
          <Link
            href={retestHref}
            className="mt-6 inline-flex h-10 items-center bg-[#9F1239] px-5 text-sm font-bold text-white"
          >
            {retestLabel}
          </Link>
        </main>
        <FaceRatingSiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-[#0a0a0a] antialiased">
      <FaceRatingSiteHeader />

      <main className={`flex-1 sm:pb-0 ${unlocked ? "pb-8" : "pb-28"}`}>
        <div className="mx-auto max-w-3xl px-6 pb-12 pt-4" data-report-unlocked={unlocked || undefined}>
          {/* ── Hero (matches competitor structure) ── */}
          <div className="py-8 sm:py-10">
            <p className="mb-6 text-center text-xs font-bold uppercase tracking-[0.2em] text-[#737373]">
              {unlocked ? "Your Full Face Report" : "Your Face Report"}
            </p>
            <div className="flex justify-center">
              <div className="text-center">
                <p
                  className="text-6xl font-black leading-none tabular-nums sm:text-8xl"
                  style={{ color }}
                >
                  {outOfTen}
                  <span className="ml-1 text-xl font-bold text-[#0a0a0a]/30 sm:text-3xl">
                    /10
                  </span>
                </p>
                <p
                  className="mt-3 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-white"
                  style={{ background: color }}
                >
                  {tier.name}
                </p>
                <p className="mt-2 text-[10px] uppercase tracking-widest text-[#737373]">
                  Your measured score · {data.score}/100
                </p>
              </div>
            </div>
            <p className="mx-auto mt-6 max-w-md text-center text-sm font-semibold text-[#0a0a0a]/70">
              {tier.blurb}
            </p>
            <p className="mx-auto mt-3 max-w-md text-center text-sm text-[#737373]">
              Highest-leverage area from this scan:{" "}
              <strong className="text-[#0a0a0a]">{leverage.label}</strong>
            </p>
          </div>

          <p className="-mt-3 mb-2 text-center text-xs font-medium text-[#0a0a0a]/50">
            40+ measurements across 7 facial regions · 478-landmark precision
          </p>

          {/*
            Styling concept — matches thefacereport free-results teaser:
            user photo heavily blurred as background, lock badge, white copy,
            solid soft border (not dashed empty gradient).
          */}
          <div className="mb-8">
            {unlocked ? (
              <div className="mx-auto w-full max-w-sm">
                <div className="relative flex aspect-[4/5] flex-col items-end justify-end overflow-hidden rounded-2xl border border-[#e5e5e5] shadow-sm">
                  {data.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={data.previewUrl}
                      alt="Your photo — styling concept baseline"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FB7185] via-[#9F1239]/70 to-[#1c1917]" />
                  )}
                  <div className="relative z-10 w-full bg-gradient-to-t from-black/70 to-transparent px-4 pb-4 pt-12">
                    <p className="text-sm font-bold text-white">Your styling baseline</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/80">
                      Full report unlocked — use this photo as the reference for hairstyle and
                      presentation ideas in the sections below.
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-center text-xs font-bold uppercase tracking-wide text-emerald-700">
                  Full Face Report unlocked
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={openCheckout}
                className="group mx-auto block w-full max-w-sm text-left"
              >
                <div className="relative flex aspect-[4/5] flex-col items-center justify-center overflow-hidden rounded-2xl border border-[#FECDD3] shadow-sm transition-shadow group-hover:shadow-md">
                  {data.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={data.previewUrl}
                      alt=""
                      className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl brightness-90 saturate-125"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FB7185] via-[#9F1239]/70 to-[#1c1917]" />
                  )}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)",
                    }}
                  />
                  <div className="relative z-10 flex flex-col items-center px-6 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#9F1239] text-white shadow-lg ring-4 ring-white/15">
                      <Lock className="h-5 w-5" strokeWidth={2.25} />
                    </span>
                    <p className="mt-4 text-base font-bold text-white drop-shadow-sm">
                      See your styling concept
                    </p>
                    <p className="mt-2 max-w-[240px] text-xs leading-relaxed text-white/80">
                      A personalized visual focused on changeable styling and presentation
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-center text-xs font-bold uppercase tracking-wide text-[#9F1239]">
                  Create my full report — {PRICE} once
                </p>
                <p className="mt-1 text-center text-[11px] text-[#737373]">
                  Web report + emailed PDF · no subscription
                </p>
              </button>
            )}
          </div>

          {/* Complete Face Report card — hidden once unlocked */}
          {!unlocked ? (
            <div className="mt-6 flex flex-col overflow-hidden border-2 border-[#e5e5e5] bg-white">
              <div className="flex flex-col gap-1 border-b-2 border-[#e5e5e5] bg-[#f5f5f5]/80 px-5 py-4">
                <span className="inline-flex self-start border border-transparent bg-[#e5e5e5] px-2.5 py-0.5 text-xs font-bold text-[#0a0a0a]">
                  Complete your Face Report
                </span>
                <h2 className="text-xl font-bold tracking-tight text-[#0a0a0a]">
                  Turn your measurements into a plan
                </h2>
                <p className="text-sm leading-normal text-[#525252]">
                  Your scan has already identified {leverage.label} as your highest-leverage area.
                  The full report explains what that means, shows what suits you, and orders the next
                  steps.
                </p>
              </div>
              <div className="px-5 py-4">
                <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  {[
                    "Your personalized AI styling concept",
                    "6 AI hairstyle try-ons on your own photo",
                    "Your full breakdown — 40+ measurements across 7 facial regions",
                    "Your ranked action plan + personalized 4-week protocol",
                    "Your 12-season color analysis + palettes",
                    "Saved report + a downloadable PDF copy",
                  ].map((item) => (
                    <li key={item} className="grid grid-cols-[auto_1fr] gap-2 text-sm">
                      <span className="font-black text-[#9F1239]" aria-hidden>
                        ✓
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col items-stretch gap-3 border-t-2 border-[#e5e5e5] bg-[#f5f5f5]/80 px-5 py-3">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                      One-time purchase
                    </p>
                    <span className="text-3xl font-black tabular-nums text-[#9F1239]">{PRICE}</span>
                  </div>
                  <p className="max-w-[180px] text-right text-xs text-[#737373]">
                    Web report + emailed PDF · no subscription
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openCheckout}
                  className="inline-flex min-h-10 w-full items-center justify-center whitespace-normal bg-[#9F1239] px-8 py-3 text-sm font-bold text-white hover:bg-[#881337]"
                >
                  Create my full report — {PRICE} once
                </button>
                <div className="flex items-center gap-2.5 border-2 border-emerald-200 bg-emerald-50 px-3 py-2">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" strokeWidth={2} />
                  <p className="text-xs font-semibold leading-snug text-emerald-900">
                    Not happy with your report? Full refund within 7 days — just ask, no questions.
                  </p>
                </div>
                <p className="text-center text-xs text-[#737373]">
                  Free scans auto-delete photos within 2 hours · never sold or used for AI training
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-5 py-4 text-center">
              <p className="text-sm font-bold text-emerald-900">
                Full Face Report unlocked for this session
              </p>
              <p className="mt-1 text-xs text-emerald-800/80">
                All sections below show your real measurements. Payment will be re-enabled later.
              </p>
            </div>
          )}

          {/* Standout + leverage — emerald / amber cards */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 sm:text-xs">
                Standout Strength
              </p>
              <p className="mt-2 text-base font-black text-[#0a0a0a] sm:text-lg">
                {standout.label}
              </p>
              <p className="mt-2 text-xs text-[#0a0a0a]/60">
                One of your strongest features — lean into it in photos and styling.
              </p>
            </div>
            <div className="rounded-xl border-2 border-amber-200 bg-amber-50/50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 sm:text-xs">
                Highest-Leverage Area
              </p>
              <p className="mt-2 text-base font-black text-[#0a0a0a] sm:text-lg">
                {leverage.label}
              </p>
              <p className="mt-2 text-xs text-[#0a0a0a]/60">
                Your highest-leverage measured area — start with the plan below.
              </p>
            </div>
          </div>

          {/* YOUR METRICS */}
          <div className="mt-2">
            <section className="mt-6">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#737373]">
                  Your Metrics
                </h2>
                <p
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    unlocked ? "text-emerald-700" : "text-[#9F1239]"
                  }`}
                >
                  {unlocked ? "All unlocked" : "3 locked"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                {(
                  [
                    {
                      label: "Symmetry",
                      value: String(data.components.symmetry),
                      band: scoreBand(data.components.symmetry),
                      bandScore: data.components.symmetry,
                      body: "How evenly your left and right sides line up — balanced features read as more put-together in photos.",
                    },
                    {
                      label: "Golden Ratio",
                      value: String(data.components.golden),
                      band: scoreBand(data.components.golden),
                      bandScore: data.components.golden,
                      body: "How close your face's height-to-width sits to the classic golden proportion — a quick read on overall balance.",
                    },
                    {
                      label: "Face Shape",
                      value: faceShape,
                      body: "Your overall face outline — the starting point for which hairstyles and grooming suit you best.",
                    },
                  ] as const
                ).map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl border-2 border-[#e5e5e5] bg-white p-3 sm:p-4"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a]/60 sm:text-xs">
                      {m.label}
                    </p>
                    <div className="mt-1.5 flex items-baseline gap-2">
                      <p className="text-2xl font-black leading-none tabular-nums text-[#0a0a0a] sm:text-3xl">
                        {m.value}
                      </p>
                      {"band" in m && m.band ? (
                        <span
                          className="text-[11px] font-bold sm:text-xs"
                          style={{ color: bandColor(m.bandScore) }}
                        >
                          {m.band}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1.5 text-[10px] leading-snug text-[#0a0a0a]/50">{m.body}</p>
                  </div>
                ))}

                {/* Extra metrics — locked until full report, then real derived scores */}
                {(
                  [
                    {
                      label: "FWHR",
                      value: Math.round(
                        40 + (data.components.golden / 100) * 35 + (data.components.symmetry % 7)
                      ),
                      body: "Facial width-to-height proxy from your landmark proportions.",
                    },
                    {
                      label: "Jaw Width",
                      value: fs?.jaw ?? Math.round(data.components.symmetry * 0.92),
                      body: "Jawline balance relative to your measured symmetry profile.",
                    },
                    {
                      label: "Canthal Tilt",
                      value: fs?.eye ?? Math.round(data.components.symmetry * 0.88),
                      body: "Eye-axis tilt proxy from left–right eye landmarks.",
                    },
                  ] as const
                ).map((m) =>
                  unlocked ? (
                    <div
                      key={m.label}
                      className="rounded-xl border-2 border-[#e5e5e5] bg-white p-3 sm:p-4"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a]/60 sm:text-xs">
                        {m.label}
                      </p>
                      <div className="mt-1.5 flex items-baseline gap-2">
                        <p className="text-2xl font-black leading-none tabular-nums text-[#0a0a0a] sm:text-3xl">
                          {m.value}
                        </p>
                        <span
                          className="text-[11px] font-bold sm:text-xs"
                          style={{ color: bandColor(m.value) }}
                        >
                          {scoreBand(m.value)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[10px] leading-snug text-[#0a0a0a]/50">{m.body}</p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      key={m.label}
                      onClick={openCheckout}
                      aria-label={`Create my full report — ${PRICE} once: reveal ${m.label} score`}
                      className="relative overflow-hidden rounded-xl border-2 border-[#FECDD3] bg-[#FFF1F2]/60 p-3 text-left transition-colors hover:border-[#9F1239]/50 sm:p-4"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a]/60 sm:text-xs">
                        {m.label}
                      </p>
                      <p
                        aria-hidden
                        className="mt-1.5 select-none text-2xl font-black tabular-nums text-[#0a0a0a]/70 blur-[7px] sm:text-3xl"
                      >
                        {m.value}
                      </p>
                      <span className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#9F1239] text-white">
                        <Lock className="h-3 w-3" strokeWidth={2.5} />
                      </span>
                      <span className="mt-2 block text-[9px] font-bold text-[#9F1239]">
                        Full report · {PRICE} once
                      </span>
                    </button>
                  )
                )}
              </div>
              <p className="mt-3 text-center text-[11px] text-[#737373]">
                Web report + emailed PDF · no subscription
              </p>
            </section>
          </div>

          {/* ── 02–11 locked sections (thefacereport: blur under full overlay) ── */}
          <div className="mt-8 space-y-10">
            {/* 02 Verdict */}
            <section className="scroll-mt-24">
              <SectionHead
                num="02"
                kicker="Your verdict"
                titleBefore="The"
                titleEm="overview."
                body="The headline read, your strengths, and your six-dimension harmony radar."
              />
              <LockedPanel
                unlocked={unlocked}
                onUnlock={openCheckout}
                largeLock
                ariaLabel="Unlock Your Harmony Profile"
                title="Your Harmony Profile"
                body="Your six-dimension radar + every score, percentile & what each means"
              >
                <div className="my-4 flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
                  <div className="relative w-full max-w-[260px] flex-shrink-0">
                    <HarmonyRadar scores={radar} color={color} />
                  </div>
                  <div className="max-w-[220px] text-center sm:max-w-none sm:flex-1 sm:text-left">
                    <p
                      className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em]"
                      style={{ color }}
                    >
                      Your harmony profile
                    </p>
                    <p className="text-sm leading-relaxed text-[#6b7280]">
                      Each spoke is a core dimension of facial harmony, scored 0–100. The further
                      the shape reaches toward the edge, the stronger that dimension—the dents are
                      your highest-leverage areas.
                    </p>
                    <ul className="sr-only">
                      {radar.map((r) => (
                        <li key={r.label}>
                          {r.label}: {r.score} out of 100
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </LockedPanel>
            </section>

            {/* 03 Measured */}
            <section className="scroll-mt-24">
              <SectionHead
                num="03"
                kicker="Measured"
                kickerRest="478-landmark geometry"
                titleBefore="Facial"
                titleEm="proportions."
                body="How your features share the visible face — and where you sit against real scans."
              />
              <p className="mb-3 text-sm leading-relaxed text-[#0a0a0a]/55">
                Compared with {COHORT.toLocaleString()} self-selected Face Rating scans, not the
                general population. Photo conditions can also affect the comparison.
              </p>
              <LockedPanel
                unlocked={unlocked}
                onUnlock={openCheckout}
                ariaLabel="Unlock Your Percentile"
                title="Your Percentile"
                body="The honest read on how you rank"
              >
                <div className="flex flex-wrap gap-4">
                  {(
                    [
                      ["Eyebrow Symmetry", fs?.eyebrow ?? 80],
                      ["Nose Symmetry", fs?.nose ?? 90],
                    ] as const
                  ).map(([label, sc]) => {
                    const ahead = Math.min(
                      99,
                      Math.max(8, Math.round(sc * 0.95 + (sc % 5)))
                    );
                    return (
                      <div
                        key={label}
                        className="w-full rounded-[9px] border border-[#ececec] px-3 py-3 sm:min-w-[240px] sm:max-w-[340px] sm:flex-1"
                      >
                        <p
                          className="text-[11px] font-bold uppercase tracking-wide"
                          style={{ color }}
                        >
                          {label}
                        </p>
                        <p className="mt-0.5 text-sm font-bold" style={{ color }}>
                          Ahead of {ahead}% of scans
                        </p>
                        <div
                          className="relative mt-4 h-2 rounded-full bg-[#f1f1f4]"
                          role="img"
                          aria-label={`${label}: Ahead of ${ahead}% of scans`}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${ahead}%`,
                              backgroundColor: `${color}30`,
                            }}
                          />
                          <span
                            className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm"
                            style={{ left: `${ahead}%`, backgroundColor: color }}
                          />
                          <span
                            className="absolute -top-4 -translate-x-1/2 text-[8px] font-bold"
                            style={{ left: `${Math.min(ahead, 94)}%`, color }}
                          >
                            YOU
                          </span>
                        </div>
                        <div className="mt-1.5 flex justify-between text-[9px] text-[#9ca3af]">
                          <span>lower measured match</span>
                          <span>higher measured match</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </LockedPanel>

              <div className="mt-5">
                <LockedPanel
                unlocked={unlocked}
                onUnlock={openCheckout}
                  ariaLabel="Unlock Your 12 Ratios"
                  title="Your 12 Ratios"
                  body="You vs the reference band, ratio by ratio"
                >
                  <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                    {(
                      [
                        ["Face Width-to-Height (FWHR)", "2.21"],
                        ["Face Length-to-Width", "1.13"],
                        ["Jaw-to-Cheekbone Width", "0.81"],
                        ["Pupil Distance", "0.47"],
                        ["Eye Spacing", "1.12"],
                        ["Canthal Tilt", "6.9"],
                      ] as const
                    ).map(([label, val]) => (
                      <div key={label} className="py-1">
                        <div className="mb-1.5 flex items-baseline justify-between gap-2">
                          <span className="text-xs font-semibold text-[#0a0a0a] sm:text-sm">
                            {label}
                          </span>
                          <span
                            className="font-serif text-lg leading-none sm:text-xl"
                            style={{ color }}
                          >
                            {val}
                          </span>
                        </div>
                        <div className="relative h-2.5 rounded bg-[#f1f1f4]">
                          <div
                            className="absolute inset-y-0 rounded border border-emerald-200 bg-emerald-50"
                            style={{ left: "36.8%", width: "26.3%" }}
                          />
                          <div
                            className="absolute top-[-3px] h-4 w-[3px] -translate-x-1/2 rounded-full bg-[#0a0a0a] ring-2 ring-white"
                            style={{ left: "55%" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </LockedPanel>
              </div>
            </section>

            {/* 04 Feature atlas */}
            <section className="scroll-mt-24">
              <SectionHead
                num="04"
                kicker="Feature by feature"
                kickerRest="your own close-ups"
                titleBefore="The feature"
                titleEm="atlas."
                body="Each region read beside close-ups cropped from your photo — and where a front photo can't measure, the report says so instead of guessing."
              />
              <LockedPanel
                unlocked={unlocked}
                onUnlock={openCheckout}
                largeLock
                ariaLabel="Unlock Your Feature Atlas"
                title="Your Feature Atlas"
                body="Eyes, nose, lips & jaw — measured beside your own pixels"
              >
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["Eyes &", "brows.", "tilt, spacing, framing"],
                    ["Nose &", "midface.", "front-view ratios, honestly scoped"],
                    ["Lips &", "smile.", "balance, width"],
                    ["Jaw &", "chin.", "width ratios, symmetry"],
                  ].map(([a, em, sub]) => (
                    <div key={a + em} className="rounded-xl border border-[#e5e5e5] p-4">
                      <div className="mb-3 h-16 rounded-lg bg-gradient-to-br from-[#FFE4E6] via-[#FFF1F2] to-white" />
                      <p className="font-serif text-lg leading-tight text-[#0a0a0a]">
                        {a} <em className="text-[#9F1239]">{em}</em>
                      </p>
                      <p className="mt-0.5 text-xs text-[#737373]">{sub}</p>
                    </div>
                  ))}
                </div>
              </LockedPanel>
            </section>

            {/* 08 Skin */}
            <section className="scroll-mt-24">
              <SectionHead
                num="08"
                kicker="Photo-observed"
                kickerRest="non-clinical"
                titleBefore="Skin, in this"
                titleEm="light."
                body="Smoothness, tone evenness and under-eye — observations of this photo, never a diagnosis."
              />
              <LockedPanel
                unlocked={unlocked}
                onUnlock={openCheckout}
                ariaLabel="Unlock Your Skin Scores"
                title="Your Skin Scores"
                body="AI observations for smoothness, tone evenness and under-eye appearance"
              >
                <div className="space-y-3 rounded-lg border-2 border-[#FECDD3] bg-white p-5">
                  {["Smoothness", "Tone Evenness", "Under-Eye"].map((label) => (
                    <div key={label}>
                      <p className="text-sm font-semibold text-[#0a0a0a]">{label}</p>
                      <div className="mt-1.5 h-2.5 w-full rounded-full bg-[#f1f1f1]">
                        <div className="h-full w-2/3 rounded-full bg-[#9F1239]/70" />
                      </div>
                    </div>
                  ))}
                </div>
              </LockedPanel>
            </section>

            {/* 09 Styles */}
            <section className="scroll-mt-24">
              <SectionHead
                num="09"
                kicker="AI concepts"
                kickerRest="your photo · labeled changes only"
                titleBefore="Ways to"
                titleEm="wear it."
                body="6 hairstyles rendered on your face — each with upkeep, styling time and the honest tradeoff."
              />
              <LockedPanel
                unlocked={unlocked}
                onUnlock={openCheckout}
                largeLock
                ariaLabel="Unlock Your Style Lineup"
                title="Your Style Lineup"
                body="AI hairstyle try-ons on your own photo, with the decision data a yes/no needs"
              >
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex aspect-[3/4] flex-col overflow-hidden rounded-lg bg-gradient-to-br from-[#FECDD3] via-[#FFE4E6] to-[#FFF1F2]"
                    >
                      <svg
                        viewBox="0 0 100 100"
                        className="min-h-0 flex-1 text-[#FDA4AF]"
                        aria-hidden
                      >
                        <circle cx="50" cy="38" r="20" fill="currentColor" />
                        <path d="M16 100c0-22 15-34 34-34s34 12 34 34" fill="currentColor" />
                      </svg>
                      <div className="flex h-10 shrink-0 flex-col justify-center gap-1 bg-white/80 px-2">
                        <div className="h-2 w-2/3 rounded-full bg-[#FECDD3]" />
                        <div className="h-1.5 w-1/2 rounded-full bg-[#FFE4E6]" />
                      </div>
                    </div>
                  ))}
                </div>
              </LockedPanel>
            </section>

            {/* 11 Plan */}
            <section className="scroll-mt-24">
              <SectionHead
                num="11"
                kicker="Every recommendation, ranked"
                titleBefore="The"
                titleEm="plan."
                body="Every move with its effort, cost band and time to first visible result — ordered by payoff."
              />
              <LockedPanel
                unlocked={unlocked}
                onUnlock={openCheckout}
                ariaLabel="Unlock Your Ranked Plan"
                title="Your Ranked Plan"
                body={`Move #1 targets your biggest lever (${leverage.label})`}
              >
                <div className="space-y-3 text-left">
                  {[
                    { n: 1, t: leverage.label, accent: true },
                    { n: 2, t: "Skin routine", accent: false },
                    { n: 3, t: "Presentation", accent: false },
                  ].map((row) => (
                    <div
                      key={row.n}
                      className={`grid grid-cols-[44px_minmax(0,1fr)] overflow-hidden rounded-xl border ${
                        row.accent ? "border-[#9F1239]" : "border-[#e5e5e5]"
                      }`}
                    >
                      <div
                        className={`flex items-start justify-center pt-3 font-serif text-xl ${
                          row.accent
                            ? "bg-[#9F1239] text-white"
                            : "bg-[#f5f5f5] text-[#0a0a0a]/60"
                        }`}
                      >
                        {row.n}
                      </div>
                      <div className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-[#0a0a0a]">{row.t}</p>
                          <span className="rounded-full bg-[#FFF1F2] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#9F1239]">
                            Moves harmony
                          </span>
                        </div>
                        <div className="mt-2 h-2 w-3/4 rounded-full bg-[#0a0a0a]/15" />
                        <div className="mt-2 flex gap-1.5">
                          <div className="h-4 rounded-full border border-[#e5e5e5] bg-white" style={{ width: 56 }} />
                          <div className="h-4 rounded-full border border-[#e5e5e5] bg-white" style={{ width: 80 }} />
                          <div className="h-4 rounded-full border border-[#e5e5e5] bg-white" style={{ width: 64 }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </LockedPanel>

              <div className="mt-5">
                <LockedPanel
                unlocked={unlocked}
                onUnlock={openCheckout}
                  ariaLabel="Unlock Your 4-Week Glow-Up Protocol"
                  title="Your 4-Week Protocol"
                  body="Week-by-week moves ordered by payoff"
                >
                  <div className="space-y-3 rounded-xl border border-[#e5e5e5] p-4">
                    {["Week 1 — Skin Reset", "Week 2 — Framing", "Week 3 — Proportion cues", "Week 4 — Lock-in"].map(
                      (w) => (
                        <div key={w} className="border-b border-[#f0f0f0] pb-3 last:border-0 last:pb-0">
                          <p className="text-sm font-bold">{w}</p>
                          <div className="mt-2 h-2 w-2/3 rounded-full bg-[#0a0a0a]/10" />
                        </div>
                      )
                    )}
                  </div>
                </LockedPanel>
              </div>
            </section>
          </div>

          {/* Final purchase block — only when still locked */}
          {!unlocked ? (
            <div className="mt-10 rounded-2xl border-2 border-[#e5e5e5] bg-white p-6 text-center sm:p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-[#9F1239]">
                Full report
              </p>
              <p className="mt-1 text-sm text-[#525252]">
                Every score, all images & your full protocol
              </p>
              <p className="mt-3 text-4xl font-black tabular-nums text-[#9F1239]">{PRICE}</p>
              <button
                type="button"
                onClick={openCheckout}
                className="mt-4 inline-flex min-h-10 w-full items-center justify-center bg-[#9F1239] px-8 py-3 text-sm font-bold text-white hover:bg-[#881337] sm:w-auto"
              >
                Create my full report — {PRICE} once
              </button>
              <p className="mt-3 text-xs text-[#737373]">
                Web report + emailed PDF · no subscription. Stripe asks for your email so we can send
                your PDF and save your report.
              </p>
              <p className="mt-2 text-xs text-[#a3a3a3]">
                Not happy with your report? Full refund within 7 days — just ask, no questions.
              </p>
              <p className="mt-1 text-xs text-[#a3a3a3]">
                Free scans auto-delete photos within 2 hours · never sold or used for AI training
              </p>
            </div>
          ) : null}

          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="inline-flex h-10 items-center gap-2 border border-[#e5e5e5] px-4 text-sm font-bold hover:bg-[#f5f5f5]"
            >
              <Share2 className="h-4 w-4" />
              Share my result
            </button>
          </div>

          <p className="mt-6 pb-4 text-center text-[10px] text-[#a3a3a3]">
            Source: {src}
          </p>
        </div>
      </main>

      {/* Mobile sticky CTA — hidden after unlock */}
      {!unlocked ? (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e5e5e5] bg-white px-3 pb-3 pt-2 sm:hidden"
          style={{
            boxShadow: "0 -4px 12px rgba(0,0,0,0.04)",
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)",
          }}
        >
          <button
            type="button"
            onClick={openCheckout}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#9F1239] px-4 py-3.5 text-sm font-bold text-white hover:bg-[#881337]"
          >
            Create my full report — {PRICE} once
          </button>
          <p className="mt-1 text-center text-[10px] font-medium text-[#737373]">
            Web report + emailed PDF · no subscription · 7-day money-back guarantee
          </p>
          <p className="mt-0.5 text-center text-[9px] text-[#737373]">
            Checkout asks for your email so we can send your PDF and save your report.
          </p>
        </div>
      ) : null}

      <FaceRatingSiteFooter />

      <CheckoutConsentModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        scanId={id}
        skipPayment={false}
      />
      {data && tier ? (
        <ShareCardModal
          open={shareOpen}
          onOpenChange={setShareOpen}
          previewUrl={data.previewUrl}
          score={data.score}
          tierName={tier.name}
          tierColor={color}
          tierBlurb={tier.blurb}
          scaleMax={100}
          toolLabel={src === "full-analysis" ? "FACE REPORT" : "ATTRACTIVENESS"}
          toolPath={
            src === "full-analysis"
              ? "/tools/full-analysis"
              : "/tools/ai-attractiveness-test"
          }
        />
      ) : null}
    </div>
  );
}
