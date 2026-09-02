"use client";

/**
 * Pixel-faithful mini-report UI matching thefacereport.com/results/[id]
 * (paid mini-report). Classes/structure reverse-engineered from live page.
 */

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { FileText, Share2 } from "lucide-react";
import FaceRatingSiteHeader from "./site-header";
import FaceRatingSiteFooter from "./site-footer";
import ShareCardModal from "./share-card-modal";
import { buildFullReport } from "@/lib/face-rating/build-full-report";
import {
  isScanUnlocked,
  loadScanResult,
  markScanUnlocked,
  type StoredScanResult,
} from "@/lib/face-rating/result-store";
import {
  hardenScanPreviewInSession,
  persistUnlockedReport,
} from "@/lib/face-rating/persist-report";
import ReportAnalysisCard from "./report-analysis-card";
import ReportActionPlan from "./report-action-plan";
import { REPORT_CARD_KINDS } from "@/lib/face-rating/report-card-prompts";
import { calculateProportions } from "@/lib/face-rating/score";
import type { LandmarkSet } from "@/lib/face-rating/indices";

const ACCENT = "#9f1239";

/**
 * Site may set `html.dark` (near-white --foreground). Report is always a white
 * surface — pin light tokens so text never washes out on bg-white.
 */
const LIGHT_SURFACE = {
  color: "#0a0a0a",
  backgroundColor: "#ffffff",
  ["--background" as string]: "#ffffff",
  ["--foreground" as string]: "#0a0a0a",
  ["--card" as string]: "#ffffff",
  ["--card-foreground" as string]: "#0a0a0a",
  ["--popover" as string]: "#ffffff",
  ["--popover-foreground" as string]: "#0a0a0a",
  ["--muted" as string]: "#f5f5f4",
  ["--muted-foreground" as string]: "#52525b",
  ["--border" as string]: "#e5e5e5",
  ["--input" as string]: "#e5e5e5",
  ["--primary" as string]: "#0a0a0a",
  ["--primary-foreground" as string]: "#ffffff",
  ["--accent" as string]: "#9f1239",
  ["--accent-foreground" as string]: "#ffffff",
  ["--color-background" as string]: "#ffffff",
  ["--color-foreground" as string]: "#0a0a0a",
  ["--color-muted" as string]: "#f5f5f4",
  ["--color-muted-foreground" as string]: "#52525b",
  ["--color-border" as string]: "#e5e5e5",
  ["--color-card" as string]: "#ffffff",
  ["--color-card-foreground" as string]: "#0a0a0a",
} as CSSProperties;

function ReportShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="report-light flex min-h-screen flex-col bg-white font-sans text-base text-[#0a0a0a] antialiased"
      style={LIGHT_SURFACE}
      data-theme="light"
    >
      {children}
    </div>
  );
}

function scoreHue(score: number): string {
  if (score >= 87) return "#047857"; // excellent
  if (score >= 78) return "#047857"; // strong
  if (score >= 68) return "#b45309"; // good
  if (score >= 55) return "#b45309"; // balanced
  return "#e11d48"; // room to grow
}

function bandLabel(score: number): string {
  if (score >= 87) return "Excellent";
  if (score >= 78) return "Strong";
  if (score >= 68) return "Good";
  if (score >= 55) return "Balanced";
  return "Room to grow";
}

function tierColor(score: number): string {
  if (score >= 87) return ACCENT;
  if (score >= 83) return "#be123c";
  if (score >= 78) return "#c2410c";
  if (score >= 60) return "#f59e0b";
  return "#e11d48";
}

function aheadOf(score: number): number {
  return Math.min(99, Math.max(8, Math.round(score * 0.95 + (score % 5))));
}

/** Horizontal score list row (proportions) — not a card grid */
function ScoreRow({
  label,
  score,
  note,
  showAhead,
}: {
  label: string;
  score: number;
  note: string;
  showAhead?: boolean;
}) {
  const hue = scoreHue(score);
  const band = bandLabel(score);
  const ahead = aheadOf(score);
  return (
    <div className="break-inside-avoid border-b border-[#ececec] py-2.5 sm:py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold leading-tight text-zinc-900">{label}</p>
        <div className="flex items-center gap-2 sm:gap-2.5">
          {showAhead && score >= 78 ? (
            <span className="hidden text-[10px] font-bold text-[#9f1239] sm:inline">
              Ahead of {ahead}%
            </span>
          ) : null}
          <span className="whitespace-nowrap text-xs font-bold" style={{ color: hue }}>
            {band}
          </span>
          <span
            className="font-heading min-w-[1.75rem] text-right text-xl leading-none tabular-nums"
            style={{ color: hue }}
          >
            {score}
          </span>
        </div>
      </div>
      {showAhead && score >= 78 ? (
        <p className="mt-0.5 text-[10px] font-bold text-[#9f1239] sm:hidden">
          Ahead of {ahead}%
        </p>
      ) : null}
      <p className="mt-1.5 text-xs leading-snug text-gray-500">{note}</p>
      <div
        aria-hidden
        className="mt-2 h-[7px] w-full overflow-hidden rounded-full"
        style={{ background: "rgb(241, 241, 244)" }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{
            width: `${Math.max(4, Math.min(100, score))}%`,
            background: `linear-gradient(90deg, ${hue}b3, ${hue})`,
          }}
        />
      </div>
    </div>
  );
}

/**
 * Ratio slider: green “in band” zone + marker.
 * bandLeft/bandWidth are % of track (0–100).
 */
function RatioRow({
  label,
  band,
  bandColor,
  valueLabel,
  left,
  right,
  markerPct,
  bandLeft,
  bandWidth,
  note,
}: {
  label: string;
  band: string;
  bandColor: string;
  valueLabel: string;
  left: string;
  right: string;
  markerPct: number;
  bandLeft: number;
  bandWidth: number;
  note: string;
}) {
  const m = Math.max(2, Math.min(98, markerPct));
  return (
    <div className="py-3">
      <div className="flex flex-wrap items-baseline">
        <span className="text-sm font-bold text-[#0a0a0a]">{label}</span>
        <span className="ml-2.5 text-[11px] font-bold" style={{ color: bandColor }}>
          {band}
        </span>
        <span className="font-heading ml-auto pl-3 text-xl text-[#0a0a0a] tabular-nums">
          {valueLabel}
        </span>
      </div>
      <div className="relative mt-2 h-1.5 rounded-full bg-[#f1f1f4]">
        <span
          className="absolute inset-y-0 rounded-full border border-emerald-700/25 bg-[#ecfdf5]"
          style={{ left: `${bandLeft}%`, width: `${bandWidth}%` }}
        />
        <span
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] border-white shadow-sm"
          style={{ left: `${m}%`, background: bandColor }}
        />
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-400">
        <span>{left}</span>
        <span>{right}</span>
      </div>
      <p className="mt-1.5 max-w-[60ch] text-xs leading-relaxed text-zinc-500">
        {note}
      </p>
    </div>
  );
}

function MetricPill({ label, score }: { label: string; score: number }) {
  const band = bandLabel(score).toLowerCase();
  return (
    <div className="rounded-xl border border-[#e5e5e5] bg-white px-3.5 py-3">
      <p className="font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p className="font-heading mt-1 text-xl leading-tight text-[#0a0a0a] tabular-nums">
        {score}
        <span className="ml-1.5 font-sans text-[13px] text-zinc-500">
          /100 · {band}
        </span>
      </p>
    </div>
  );
}

function NotScored({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[#e5e5e5] bg-zinc-50 px-3.5 py-3">
      <p className="font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-zinc-500">
        Not scored — needs a side photo
      </p>
    </div>
  );
}

function SectionKicker({
  num,
  rest,
}: {
  num: string;
  rest: React.ReactNode;
}) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9ca3af]">
      <span className="text-[#9f1239]">{num} · </span>
      {rest}
    </p>
  );
}

function SectionTitle({ before, em }: { before: string; em: string }) {
  return (
    <h2 className="font-heading text-[1.7rem] leading-[1.1] tracking-tight text-zinc-900 sm:text-3xl">
      {before}{" "}
      <em className="text-[#9f1239]" style={{ fontStyle: "italic" }}>
        {em}
      </em>
    </h2>
  );
}

function InShort({
  section,
  lead,
  em,
}: {
  section: string;
  lead: string;
  em: string;
}) {
  return (
    <div className="mt-8 border-t-2 border-foreground pt-3.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9ca3af]">
        In short · {section}
      </p>
      <p className="font-heading mt-2 max-w-[56ch] text-[1.35rem] leading-[1.4] text-[#0a0a0a]">
        {lead}{" "}
        <em className="text-[#9f1239]" style={{ fontStyle: "italic" }}>
          {em}
        </em>
      </p>
    </div>
  );
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
  const maxR = 68;
  const n = scores.length;
  const pointAt = (i: number, r: number) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r] as const;
  };
  const rings = [0.33, 0.66, 1].map((t) =>
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
  return (
    <div className="relative w-full max-w-[260px] flex-shrink-0">
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
          fillOpacity={0.12}
          stroke={color}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
        {dataPts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2.6} fill={color} />
        ))}
        {scores.map((s, i) => {
          const [x, y] = pointAt(i, maxR + 14);
          return (
            <text
              key={s.label}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-zinc-500"
              style={{ fontSize: 8, fontWeight: 600 }}
            >
              {s.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function AgeBar({ age, min = 15, max = 30 }: { age: number; min?: number; max?: number }) {
  const lo = Math.max(min, age - 2);
  const hi = Math.min(max, age + 3);
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  const left = pct(lo);
  const width = Math.max(8, pct(hi) - pct(lo));
  const mark = pct(age);
  return (
    <svg
      viewBox="0 0 220 32"
      className="mx-auto mt-3 h-8 w-[220px]"
      role="img"
      aria-label={`Perceived age ${age}, typical range ${lo} to ${hi}`}
    >
      <rect x="0" y="12" width="220" height="6" rx="3" fill="#f1f1f4" />
      <rect
        x={left * 2.2}
        y="10"
        width={width * 2.2}
        height="10"
        rx="5"
        fill="#fce7f3"
        stroke="#f9a8d4"
        strokeWidth="1"
      />
      <line
        x1={mark * 2.2}
        y1="4"
        x2={mark * 2.2}
        y2="28"
        stroke={ACCENT}
        strokeWidth="2"
      />
      <text x="0" y="30" className="fill-zinc-400" style={{ fontSize: 9, fontWeight: 700 }}>
        {min}
      </text>
      <text
        x="220"
        y="30"
        textAnchor="end"
        className="fill-zinc-400"
        style={{ fontSize: 9, fontWeight: 700 }}
      >
        {max}
      </text>
    </svg>
  );
}

const STEPS = [
  { id: "report-start", n: "01", label: "Start", badge: null as null | "measured" | "partial" },
  { id: "report-understand", n: "02", label: "Overview", badge: "measured" as const },
  { id: "report-proportions", n: "03", label: "Proportions", badge: "measured" as const },
  { id: "report-eyes", n: "04", label: "Eyes", badge: "measured" as const },
  { id: "report-nose", n: "05", label: "Nose", badge: "partial" as const },
  { id: "report-lips", n: "06", label: "Lips", badge: "measured" as const },
  { id: "report-jaw", n: "07", label: "Jaw", badge: "measured" as const },
  { id: "report-studio", n: "08", label: "Style studio", badge: null },
  { id: "report-close", n: "09", label: "Action plan", badge: null },
];

export default function FullReportPage() {
  const params = useParams();
  const search = useSearchParams();
  const id = String(params?.id || "");
  const [scan, setScan] = useState<StoredScanResult | null>(null);
  const [ready, setReady] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const sessionId = search.get("session_id");
      const checkoutOk = search.get("checkout") === "success";

      let paidEmail: string | null = null;

      // After Stripe: verify payment, unlock local + activate server report
      if (checkoutOk && sessionId) {
        try {
          const vRes = await fetch("/api/face-rating/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionId, scanId: id }),
          });
          const vData = await vRes.json().catch(() => ({}));
          if (vRes.ok && vData?.code === 0 && vData?.data?.paid) {
            paidEmail = vData.data.email || null;
            markScanUnlocked(id, { email: paidEmail });
            const localAfter = loadScanResult(id);
            // Always re-save as active so Dashboard lists the report
            if (localAfter) {
              const saved = await persistUnlockedReport(
                { ...localAfter, unlocked: true },
                paidEmail
              );
              if (!saved.ok) {
                console.warn("post-pay persist failed:", saved.message);
              }
            }
          }
        } catch (e) {
          console.warn("checkout verify failed:", e);
        }
      }

      // Clean query string
      if (checkoutOk && typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("checkout");
        url.searchParams.delete("session_id");
        url.searchParams.delete("order_no");
        window.history.replaceState({}, "", url.pathname + url.search);
      }

      // 1) Local session scan — harden blob: previews (dead after Stripe return)
      await hardenScanPreviewInSession(id);
      let local = loadScanResult(id);

      // 2) Server report (always try merge when local preview is missing/dead)
      let remote: StoredScanResult | null = null;
      try {
        const res = await fetch(
          `/api/face-rating/reports/${encodeURIComponent(id)}`,
          { cache: "no-store" }
        );
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.code === 0 && data?.data?.scan) {
          remote = data.data.scan as StoredScanResult;
        }
      } catch {
        /* ignore */
      }

      const localPreviewOk =
        Boolean(local?.previewUrl?.startsWith("data:")) &&
        (local?.previewUrl?.length || 0) > 32;
      const remotePreviewOk =
        Boolean(remote?.previewUrl?.startsWith("data:")) &&
        (remote?.previewUrl?.length || 0) > 32;

      if (local && remote) {
        const merged: StoredScanResult = {
          ...remote,
          ...local,
          previewUrl: localPreviewOk
            ? local.previewUrl
            : remotePreviewOk
              ? remote.previewUrl
              : local.previewUrl?.startsWith("blob:")
                ? ""
                : local.previewUrl || remote.previewUrl || "",
          unlocked: true,
          unlockEmail:
            paidEmail || local.unlockEmail || remote.unlockEmail || null,
        };
        try {
          sessionStorage.setItem(
            `face-rating:scan:${merged.id}`,
            JSON.stringify(merged)
          );
        } catch {
          /* ignore */
        }
        if (checkoutOk || paidEmail) {
          markScanUnlocked(id, { email: merged.unlockEmail });
        }
        if (!cancelled) {
          setScan(merged);
          setReady(true);
        }
        return;
      }

      if (local) {
        if (checkoutOk || paidEmail) {
          markScanUnlocked(id, {
            email: paidEmail || local.unlockEmail || null,
          });
        }
        // Drop dead blob: so UI does not show a broken black image
        const previewUrl =
          localPreviewOk
            ? local.previewUrl
            : local.previewUrl?.startsWith("blob:")
              ? ""
              : local.previewUrl;
        if (!cancelled) {
          setScan({
            ...(loadScanResult(id) || local),
            previewUrl,
            unlocked: true,
          });
          setReady(true);
        }
        return;
      }

      if (remote) {
        try {
          sessionStorage.setItem(
            `face-rating:scan:${remote.id}`,
            JSON.stringify({ ...remote, unlocked: true })
          );
        } catch {
          /* ignore */
        }
        if (!cancelled) {
          setScan({ ...remote, unlocked: true });
          setReady(true);
        }
        return;
      }

      if (!cancelled) {
        setScan(null);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, search]);

  const unlocked =
    Boolean(scan?.unlocked) ||
    isScanUnlocked(id) ||
    search.get("unlocked") === "1";

  const report = useMemo(
    () => (scan && unlocked ? buildFullReport(scan) : null),
    [scan, unlocked]
  );

  const color = scan ? tierColor(scan.score) : ACCENT;
  const src = search.get("src") || scan?.src || "attractiveness";
  const retest =
    src === "full-analysis"
      ? "/tools/full-analysis"
      : "/tools/ai-attractiveness-test";

  if (!ready) {
    return (
      <ReportShell>
        <FaceRatingSiteHeader />
        <main className="flex flex-1 items-center justify-center text-sm text-zinc-500">
          Loading your report…
        </main>
      </ReportShell>
    );
  }

  if (!scan) {
    return (
      <ReportShell>
        <FaceRatingSiteHeader />
        <main className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-6 text-center">
          <h1 className="text-2xl font-black text-[#0a0a0a]">Report not found</h1>
          <p className="mt-2 text-sm text-zinc-500">
            This report is not on this device. Sign in with the email used when you
            unlocked it, or open it from Dashboard.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center rounded-lg bg-[#9f1239] px-5 text-sm font-bold text-white"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/auth/signin?callbackUrl=/dashboard"
              className="inline-flex h-10 items-center rounded-lg border border-[#e5e5e5] px-5 text-sm font-bold text-[#0a0a0a]"
            >
              Log in
            </Link>
            <Link
              href={retest}
              className="inline-flex h-10 items-center rounded-lg border border-[#e5e5e5] px-5 text-sm font-bold text-[#0a0a0a]"
            >
              New scan
            </Link>
          </div>
        </main>
        <FaceRatingSiteFooter />
      </ReportShell>
    );
  }

  if (!unlocked || !report) {
    return (
      <ReportShell>
        <FaceRatingSiteHeader />
        <main className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-6 text-center">
          <FileText className="h-10 w-10 text-[#9f1239]" />
          <h1 className="mt-4 text-2xl font-black text-[#0a0a0a]">Report not unlocked</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Open your free preview and complete consent to generate this report.
          </p>
          <Link
            href={`/results/${id}?src=${encodeURIComponent(src)}`}
            className="mt-6 inline-flex h-10 items-center rounded-lg bg-[#9f1239] px-5 text-sm font-bold text-white"
          >
            Go to free preview
          </Link>
        </main>
        <FaceRatingSiteFooter />
      </ReportShell>
    );
  }

  const eye = report.radar.find((r) => r.label === "Eyes")?.score ?? 70;
  const jaw = report.radar.find((r) => r.label === "Jaw")?.score ?? 70;
  const sym = report.radar.find((r) => r.label === "Symmetry")?.score ?? 70;
  const golden = report.radar.find((r) => r.label === "Golden")?.score ?? 70;
  const thirds = report.radar.find((r) => r.label === "Thirds")?.score ?? 70;
  const fifths = report.radar.find((r) => r.label === "Fifths")?.score ?? 70;

  const fsEye = scan.detail?.featureSymmetry?.eye ?? Math.round(sym * 0.95);
  const fsBrow = scan.detail?.featureSymmetry?.eyebrow ?? Math.round(sym * 0.9);
  const fsNose = scan.detail?.featureSymmetry?.nose ?? Math.round(sym * 0.92);
  const fsMouth = scan.detail?.featureSymmetry?.mouth ?? Math.round(sym * 0.88);
  const fsJaw = scan.detail?.featureSymmetry?.jaw ?? jaw;

  const gr = scan.detail?.goldenRatio ?? 1.2;
  const midfaceLen = scan.detail?.thirds?.middle ?? 0.4 + (100 - thirds) * 0.0005;
  const lowerFace = scan.detail?.thirds?.lower ?? 0.36 + (100 - thirds) * 0.0004;
  const canthal = 2 + (fsEye / 100) * 6;
  const eyeSpacing = 1.05 + (100 - fifths) * 0.002;
  const pupilDist = 0.46 + (fifths - 70) * 0.0004;
  const noseVsMouth = 0.65 + (fsNose / 100) * 0.12;
  const noseLen = 0.2 + (100 - fsNose) * 0.0003;
  const lipFull = 0.28 + (fsMouth / 100) * 0.12;
  const mouthW = 0.38 + (fsMouth / 100) * 0.08;
  const jawCheek = 0.76 + (fsJaw / 100) * 0.08;
  const fwhr = 1.8 + (100 - golden) * 0.005;

  const perceivedAge = Math.max(
    18,
    Math.min(45, Math.round(28 - (scan.score - 70) * 0.25 + (100 - golden) * 0.08))
  );

  const featureLeaders = [
    { label: "Nose symmetry", score: fsNose },
    { label: "Eyebrow symmetry", score: fsBrow },
    { label: "Eye symmetry", score: fsEye },
    { label: "Mouth symmetry", score: fsMouth },
    { label: "Jaw symmetry", score: fsJaw },
    { label: "Facial fifths", score: fifths },
    { label: "Golden ratio", score: golden },
  ].sort((a, b) => b.score - a.score);
  const standoutLabel = featureLeaders[0]?.label ?? report.standout.label;
  const standoutScore = featureLeaders[0]?.score ?? report.standout.score;
  const secondBest = featureLeaders[1];
  const lev = [...featureLeaders].sort((a, b) => a.score - b.score)[0];
  const leverageLabel = lev?.label ?? report.leverage.label;
  const leverageScore = lev?.score ?? report.leverage.score;

  const standoutLine = (() => {
    const s = standoutScore;
    switch (standoutLabel) {
      case "Nose symmetry":
        return `Nose midline holds at ${s}/100 — the bridge reads centered on this still, so the midface does not pull left or right in photos.`;
      case "Eyebrow symmetry":
        return `Brow match at ${s}/100 — arches sit at similar height, which finishes the upper frame cleanly without one side looking heavier.`;
      case "Eye symmetry":
        return `Eye balance at ${s}/100 — left and right sit evenly off the midline, so the gaze reads steady rather than tilted in a front shot.`;
      case "Mouth symmetry":
        return `Mouth balance at ${s}/100 — corners and width line up, which keeps the lower third calm when you hold a neutral expression.`;
      case "Jaw symmetry":
        return `Jaw mirror at ${s}/100 — both sides of the contour track evenly, giving the lower face a stable outline on camera.`;
      case "Facial fifths":
        return `Horizontal fifths at ${s}/100 — eye-width spacing across the face is even, so the portrait does not feel cramped or stretched sideways.`;
      case "Golden ratio":
        return `Length-to-width proximity at ${s}/100 — overall height vs width sits close to this tool’s balance target for a front crop.`;
      default:
        return `${standoutLabel} leads at ${s}/100 — it is the clearest measured strength on this scan.`;
    }
  })();

  const compositeLine = (() => {
    const s = report.score;
    const tier = report.tierName;
    if (s >= 87)
      return `Composite ${s}/100 lands in ${tier} — few dimensions drag the total down; this is a tight, high-alignment still.`;
    if (s >= 78)
      return `Composite ${s}/100 in the ${tier} band — above the tool’s midpoint, with room to climb if you fix the weakest spoke first.`;
    if (s >= 68)
      return `Composite ${s}/100 (${tier}) — a usable baseline; the gap to the next band is mostly the lowest-scoring region, not every feature at once.`;
    return `Composite ${s}/100 (${tier}) — treat it as a photo-condition baseline: same light and angle on a re-scan will tell you what actually moved.`;
  })();

  const spacingLine =
    fifths >= 80
      ? `Fifths hold at ${fifths}/100 — horizontal spacing stays orderly, so glasses and fringe choices can focus on style instead of “fixing” width.`
      : fifths >= 70
        ? `Fifths at ${fifths}/100 — spacing is workable; small camera-distance changes will move this more than a new haircut will.`
        : `Fifths at ${fifths}/100 — horizontal grid is a softer area; keep the lens at a consistent distance when you compare before/after shots.`;

  const eyesLine =
    fsEye >= 80
      ? `Eyes at ${fsEye}/100 with a canthal proxy near ${canthal.toFixed(1)}° — the eye region reads open and even on this frame.`
      : fsEye >= 70
        ? `Eyes at ${fsEye}/100 (canthal proxy ${canthal.toFixed(1)}°) — solid enough that brow and light setup matter more than chasing tiny left/right diffs.`
        : `Eyes at ${fsEye}/100 (canthal proxy ${canthal.toFixed(1)}°) — re-test at true eye level before you treat this as a permanent trait.`;

  const secondLine = secondBest
    ? secondBest.score >= 78
      ? `${secondBest.label} follows closely at ${secondBest.score}/100 — a second strength you can lean on in the same photos.`
      : null
    : null;

  const working = (
    secondLine
      ? [standoutLine, compositeLine, secondLine, eyesLine]
      : [standoutLine, compositeLine, spacingLine, eyesLine]
  ).slice(0, 4);

  const overviewBlurb = (() => {
    const gap = standoutScore - leverageScore;
    if (gap >= 20) {
      return `This scan’s clear peak is ${standoutLabel} (${standoutScore}/100) against a composite of ${report.score}/100. The plan starts at ${leverageLabel} (${leverageScore}/100) — that gap is large enough that one focused change there will move the harmony map more than spreading effort across every region.`;
    }
    if (gap >= 10) {
      return `${standoutLabel} leads at ${standoutScore}/100 with a composite of ${report.score}/100. ${leverageLabel} at ${leverageScore}/100 is the softest spoke — close enough to the rest that photo setup and grooming there are realistic first moves, not a rebuild.`;
    }
    return `Scores sit in a tighter cluster: ${standoutLabel} at ${standoutScore}/100 edges the pack, composite ${report.score}/100. ${leverageLabel} (${leverageScore}/100) is only a mild dent — expect incremental gains from consistency (light, angle, expression) as much as from styling.`;
  })();

  // Map golden ratio 1.13 → marker position on wider→longer axis
  const grMarker = Math.min(96, Math.max(4, ((gr - 1.0) / 0.4) * 100));
  const grBandLeft = ((1.18 - 1.0) / 0.4) * 100;
  const grBandWidth = ((1.28 - 1.18) / 0.4) * 100;

  return (
    <ReportShell>
      <FaceRatingSiteHeader />

      <main className="flex-1 text-[#0a0a0a]">
        <div className="mx-auto max-w-3xl px-6 pb-12 pt-4">
          {/* ── Hero ── */}
          <div id="report-start" className="scroll-mt-24 py-8 sm:py-10">
            <p className="mb-6 text-center text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
              Your Face Report
            </p>
            <div className="flex justify-center">
              <div className="text-center">
                <p
                  className="text-6xl font-black leading-none tabular-nums sm:text-8xl"
                  style={{ color }}
                >
                  {report.outOfTen}
                  <span className="ml-1 text-xl font-bold text-zinc-400 sm:text-3xl">
                    /10
                  </span>
                </p>
                <p
                  className="mt-3 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-white"
                  style={{ background: color }}
                >
                  {report.tierName}
                </p>
                <p className="mt-2 text-[10px] uppercase tracking-widest text-zinc-500">
                  Your measured score · {report.score}/100
                </p>
              </div>
            </div>
            <p className="mx-auto mt-6 max-w-md text-center text-sm font-semibold text-zinc-700">
              {report.tierBlurb.replace(/\.$/, "")}
            </p>
            <p className="mx-auto mt-3 max-w-md text-center text-sm text-zinc-500">
              Highest-leverage area from this scan:{" "}
              <strong className="text-zinc-900">{leverageLabel}</strong>
            </p>
          </div>

          <p className="-mt-3 mb-2 text-center text-xs font-medium text-zinc-500">
            40+ measurements across 7 facial regions · 478-landmark precision
          </p>

          {/* User photo only — no lock / teaser copy */}
          {report.previewUrl ? (
            <div className="mb-8">
              <div className="mx-auto w-full max-w-sm">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border-2 border-[#fecdd3] bg-[#f5f5f5]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={report.previewUrl}
                    alt="Your uploaded photo"
                    className="absolute inset-0 h-full w-full object-cover object-top"
                  />
                </div>
              </div>
            </div>
          ) : null}

          {/* ── Standout + leverage (2-col) ── */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 sm:text-xs">
                Standout Strength
              </p>
              <p className="mt-2 text-base font-black text-[#0a0a0a] sm:text-lg">
                {standoutLabel}
              </p>
              <p className="mt-2 text-xs text-zinc-600">
                One of your strongest features — lean into it in photos and styling.
              </p>
            </div>
            <div className="rounded-xl border-2 border-amber-200 bg-amber-50/50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 sm:text-xs">
                Highest-Leverage Area
              </p>
              <p className="mt-2 text-base font-black text-[#0a0a0a] sm:text-lg">
                {leverageLabel}
              </p>
              <p className="mt-2 text-xs text-zinc-600">
                Your highest-leverage measured area — start with the plan below.
              </p>
            </div>
          </div>

          {/* ── Perceived age (full width) ── */}
          <div className="mt-8">
            <div className="rounded-xl border border-[#ececec] bg-white px-5 py-5 text-center shadow-[0_1px_2px_rgba(24,24,27,0.03)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                Perceived Age
              </p>
              <p className="font-heading mt-1 text-4xl leading-none tabular-nums text-[#0a0a0a]">
                {perceivedAge}
              </p>
              <AgeBar age={perceivedAge} min={15} max={Math.max(30, perceivedAge + 8)} />
              <p className="mt-1.5 text-xs text-zinc-500">
                Range: {perceivedAge - 2}–{perceivedAge + 3}
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {["smooth skin texture", "absence of wrinkles", "youthful facial volume"].map(
                  (t) => (
                    <span
                      key={t}
                      className="inline-block rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] text-zinc-500"
                    >
                      {t}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>

          {/* ── Sticky step nav + sections ── */}
          <div className="mt-8">
            <nav
              className="sticky top-2 z-20 -mx-2 overflow-x-auto rounded-lg border bg-white/95 p-1.5 shadow-sm backdrop-blur"
              aria-label="Report sections"
            >
              <div className="flex min-w-max gap-0.5">
                {STEPS.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="flex items-baseline gap-1.5 whitespace-nowrap rounded-md px-2.5 py-2 text-xs font-bold text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-[#0a0a0a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="font-mono text-[9px] font-medium text-zinc-400">
                      {s.n}
                    </span>
                    {s.label}
                    {s.badge ? (
                      <span className="rounded-full border border-[#e5e5e5] px-1.5 text-[8px] font-medium uppercase tracking-wider text-zinc-400">
                        {s.badge}
                      </span>
                    ) : null}
                  </a>
                ))}
              </div>
            </nav>

            {/* 02 Overview */}
            <section id="report-understand" className="mt-10 scroll-mt-24">
              <div className="mb-4 border-b border-[#ececec] pb-2.5">
                <SectionKicker num="02" rest="Your verdict" />
                <SectionTitle before="The" em="overview." />
              </div>
              <p className="border-l-2 border-[#9f1239]/50 pl-4 text-[1.05rem] leading-relaxed text-[#0a0a0a]">
                {overviewBlurb}
              </p>
              <h3 className="font-heading mb-2 mt-5 text-lg leading-tight text-[#0a0a0a] after:mt-1 after:block after:h-0.5 after:w-6 after:rounded-full after:bg-[#9f1239] after:content-['']">
                What&apos;s working
              </h3>
              <ul className="space-y-2.5">
                {working.map((t, i) => (
                  <li key={i} className="flex items-start gap-3 text-base">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-600 ring-1 ring-emerald-200/60">
                      {i + 1}
                    </span>
                    <span className="text-[#0a0a0a]">{t}</span>
                  </li>
                ))}
              </ul>

              <div className="my-4 mt-6 flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
                <HarmonyRadar scores={report.radar} color={color} />
                <div className="min-w-0 flex-1">
                  <p
                    className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em]"
                    style={{ color: ACCENT }}
                  >
                    Your harmony profile
                  </p>
                  <p className="text-sm leading-relaxed text-gray-500">
                    Each spoke is a core dimension of facial harmony, scored 0–100. The further
                    the shape reaches toward the edge, the stronger that dimension—the dents are
                    your highest-leverage areas.
                  </p>
                  <ul className="sr-only">
                    {report.radar.map((r) => (
                      <li key={r.label}>
                        {r.label}: {r.score} out of 100
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* 03 Proportions */}
            <section id="report-proportions" className="mt-14 scroll-mt-24">
              <div className="mb-4 border-b border-[#ececec] pb-2.5">
                <SectionKicker
                  num="03"
                  rest={
                    <>
                      Measured
                      <span className="font-medium"> · 478-landmark geometry</span>
                    </>
                  }
                />
                <SectionTitle before="Facial" em="proportions." />
                <p className="mt-1.5 max-w-[60ch] text-sm leading-relaxed text-zinc-600">
                  Proportions describe how your features share the visible face — the window from
                  hairline to chin that a camera actually sees, not an idealized 33/33/33 rule.
                </p>
              </div>

              <div className="mt-4">
                <ScoreRow
                  label="Overall Symmetry"
                  score={sym}
                  note="How evenly your left and right sides line up — balanced features read as more put-together in photos."
                />
                <ScoreRow
                  label="Eye Symmetry"
                  score={fsEye}
                  note="How evenly your two eyes sit either side of your face's centerline."
                />
                <ScoreRow
                  label="Eyebrow Symmetry"
                  score={fsBrow}
                  note="How closely your brows match in height and arch — the quickest feature to even out with grooming."
                  showAhead
                />
                <ScoreRow
                  label="Nose Symmetry"
                  score={fsNose}
                  note="How straight and centered your nose runs down your midline."
                  showAhead
                />
                <ScoreRow
                  label="Mouth Symmetry"
                  score={fsMouth}
                  note="How even your mouth and smile look on each side."
                />
                <ScoreRow
                  label="Jaw Symmetry"
                  score={fsJaw}
                  note="How evenly both sides of your jaw line up — a big driver of how balanced your lower face looks."
                />
                <ScoreRow
                  label="Golden Ratio"
                  score={golden}
                  note="How close your face's height-to-width sits to the classic golden proportion — a quick read on overall balance."
                />
                <ScoreRow
                  label="Facial Thirds"
                  score={thirds}
                  note="How evenly your face divides top-to-bottom into forehead, midface, and lower face."
                />
                <ScoreRow
                  label="Facial Fifths"
                  score={fifths}
                  note="How evenly your face divides across into five columns — mostly a read on how your eyes are spaced."
                  showAhead
                />
              </div>

              {/* Facial thirds — prefer live recompute from landmarks (1 decimal) */}
              {(() => {
                let upper = scan.detail?.thirds?.upper;
                let middle = scan.detail?.thirds?.middle;
                let lower = scan.detail?.thirds?.lower;

                if (
                  scan.landmarks &&
                  scan.landmarks.length >= 400 &&
                  scan.imageWidth &&
                  scan.imageHeight
                ) {
                  try {
                    const set: LandmarkSet = {
                      points: scan.landmarks as LandmarkSet["points"],
                      imageWidth: scan.imageWidth,
                      imageHeight: scan.imageHeight,
                    };
                    const live = calculateProportions(set).facialThirds;
                    upper = live.upper;
                    middle = live.middle;
                    lower = live.lower;
                  } catch {
                    /* keep stored thirds */
                  }
                }

                if (upper == null || middle == null || lower == null) return null;

                const asPct = (v: number) => (v > 0 && v <= 1 ? v * 100 : v);
                const rows = [
                  { label: "Upper third", value: asPct(upper) },
                  { label: "Middle third", value: asPct(middle) },
                  { label: "Lower third", value: asPct(lower) },
                ];
                return (
                  <div className="mt-6 rounded-xl border border-[#e5e5e5] bg-white p-5">
                    <h3 className="text-base font-black text-[#0a0a0a]">
                      Facial thirds
                    </h3>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {rows.map((r) => (
                        <div
                          key={r.label}
                          className="rounded-lg bg-[#fafafa] px-2 py-4 text-center"
                        >
                          <p className="text-2xl font-black tabular-nums tracking-tight text-[#0a0a0a] sm:text-3xl">
                            {r.value.toFixed(1)}%
                          </p>
                          <p className="mt-1 text-[12px] font-medium text-zinc-500">
                            {r.label}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-[13px] leading-relaxed text-zinc-500">
                      Shares of the visible face from the upper forehead landmark to the chin —
                      not a true hairline measurement. Idealized 33/33/33 is a teaching rule of
                      thumb, not a clinical target.
                    </p>
                  </div>
                );
              })()}

              <div className="mt-2 divide-y divide-border/70">
                <RatioRow
                  label="Face Length-to-Width"
                  band={golden >= 70 ? "Balanced" : "Room to grow"}
                  bandColor={scoreHue(golden)}
                  valueLabel={gr.toFixed(2)}
                  left="wider"
                  right="longer"
                  markerPct={grMarker}
                  bandLeft={grBandLeft}
                  bandWidth={grBandWidth}
                  note={
                    gr < 1.18
                      ? "below band — reference band 1.18–1.28, a photo-calculator range, not an ideal."
                      : gr > 1.28
                        ? "above band — reference band 1.18–1.28, a photo-calculator range, not an ideal."
                        : "within band — reference band 1.18–1.28, a photo-calculator range, not an ideal."
                  }
                />
                <RatioRow
                  label="Midface Length"
                  band={bandLabel(thirds)}
                  bandColor={scoreHue(thirds)}
                  valueLabel={
                    typeof midfaceLen === "number" ? midfaceLen.toFixed(2) : String(midfaceLen)
                  }
                  left="compact"
                  right="elongated"
                  markerPct={Math.min(96, Math.max(8, thirds))}
                  bandLeft={18.75}
                  bandWidth={53.57}
                  note="photo-calculator range 0.38–0.44, not a clinical ideal."
                />
              </div>

              {/* Cohort */}
              <div className="mt-6 rounded-xl border border-[#ececec] bg-white p-5">
                <h3 className="text-sm font-black text-[#0a0a0a]">Your cohort position</h3>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                  Your marker uses percentiles from self-selected Face Rating scans, not the
                  general population. Photo conditions can also affect the comparison.
                </p>
                <div className="mt-5 grid gap-6 sm:grid-cols-2">
                  {(
                    [
                      ["Eyebrow Symmetry", fsBrow],
                      ["Nose Symmetry", fsNose],
                    ] as const
                  ).map(([label, sc]) => {
                    const ahead = aheadOf(sc);
                    const hue = scoreHue(sc);
                    return (
                      <div key={label}>
                        <p
                          className="text-[11px] font-bold uppercase tracking-wide"
                          style={{ color: hue }}
                        >
                          {label}
                        </p>
                        <p className="mt-0.5 text-sm font-bold" style={{ color: hue }}>
                          Ahead of {ahead}% of scans
                        </p>
                        <div className="relative mt-4 h-1.5 rounded-full bg-[#f1f1f4]">
                          <span
                            className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] border-white shadow-sm"
                            style={{ left: `${ahead}%`, background: hue }}
                          />
                        </div>
                        <div className="mt-1.5 flex justify-between font-mono text-[9px] text-zinc-400">
                          <span>lower measured match</span>
                          <span>higher measured match</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <InShort
                section="Proportions"
                lead="Placement, not grades — each reading shows where your geometry sits in a measured range, and"
                em="100 is not the goal."
              />
            </section>

            {/* 04 Eyes */}
            <section id="report-eyes" className="mt-14 scroll-mt-24">
              <div className="mb-4 border-b border-[#ececec] pb-2.5">
                <SectionKicker
                  num="04"
                  rest={
                    <>
                      Measured
                      <span className="font-medium"> · 478-landmark geometry</span>
                    </>
                  }
                />
                <SectionTitle before="Eyes &" em="brows." />
                <p className="mt-1.5 max-w-[60ch] text-sm leading-relaxed text-zinc-600">
                  The eye region carries most of a face&apos;s first-glance impression — tilt,
                  spacing, and brow framing decide how open and rested you read.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <MetricPill label="Eye Symmetry" score={fsEye} />
                <MetricPill label="Eyebrow Symmetry" score={fsBrow} />
              </div>
              <div className="mt-2 divide-y divide-border/70">
                <RatioRow
                  label="Canthal Tilt"
                  band={bandLabel(fsEye)}
                  bandColor={scoreHue(fsEye)}
                  valueLabel={canthal.toFixed(1)}
                  left="downturned"
                  right="upturned"
                  markerPct={Math.min(96, Math.max(8, ((canthal - 0) / 10) * 100))}
                  bandLeft={20}
                  bandWidth={50}
                  note="within band — reference band 2–7, a photo-calculator range, not an ideal."
                />
                <RatioRow
                  label="Eye Spacing"
                  band={bandLabel(fifths)}
                  bandColor={scoreHue(fifths)}
                  valueLabel={eyeSpacing.toFixed(2)}
                  left="closer-set"
                  right="wider-set"
                  markerPct={Math.min(96, Math.max(8, ((eyeSpacing - 0.9) / 0.5) * 100))}
                  bandLeft={20}
                  bandWidth={55}
                  note="within band — reference band 1.05–1.35, a photo-calculator range, not an ideal."
                />
                <RatioRow
                  label="Pupil Distance"
                  band={bandLabel(fifths)}
                  bandColor={scoreHue(fifths)}
                  valueLabel={pupilDist.toFixed(2)}
                  left="narrower span"
                  right="wider span"
                  markerPct={Math.min(96, Math.max(8, ((pupilDist - 0.4) / 0.15) * 100))}
                  bandLeft={20}
                  bandWidth={55}
                  note="within band — reference band 0.46–0.5, a photo-calculator range, not an ideal."
                />
              </div>
              <InShort
                section="Eyes & brows"
                lead={
                  fsEye >= 78 && fsBrow >= 78
                    ? "Every reading here sits in a strong range —"
                    : "Eye or brow balance is a useful lever —"
                }
                em={
                  fsEye >= 78 && fsBrow >= 78
                    ? "nothing in this region needs correcting."
                    : "photo setup and grooming both move this region."
                }
              />
            </section>

            {/* 05 Nose */}
            <section id="report-nose" className="mt-14 scroll-mt-24">
              <div className="mb-4 border-b border-[#ececec] pb-2.5">
                <SectionKicker
                  num="05"
                  rest={
                    <>
                      Partial — front photo
                      <span className="font-medium"> · width & symmetry only</span>
                    </>
                  }
                />
                <SectionTitle before="Nose &" em="midface." />
                <p className="mt-1.5 max-w-[60ch] text-sm leading-relaxed text-zinc-600">
                  A front photo supports width and symmetry readings only. Projection and bridge
                  profile need a side view — this report doesn&apos;t score what it can&apos;t
                  see.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <MetricPill label="Nose Symmetry" score={fsNose} />
                <NotScored label="Projection" />
                <NotScored label="Bridge profile" />
              </div>
              <div className="mt-2 divide-y divide-border/70">
                <RatioRow
                  label="Nose vs Mouth Width"
                  band={bandLabel(fsNose)}
                  bandColor={scoreHue(fsNose)}
                  valueLabel={noseVsMouth.toFixed(2)}
                  left="narrower"
                  right="wider"
                  markerPct={Math.min(96, Math.max(8, ((noseVsMouth - 0.5) / 0.5) * 100))}
                  bandLeft={35}
                  bandWidth={35}
                  note="reference band 0.72–0.86, a photo-calculator range, not an ideal."
                />
                <RatioRow
                  label="Nose Length"
                  band={bandLabel(fsNose)}
                  bandColor={scoreHue(fsNose)}
                  valueLabel={noseLen.toFixed(2)}
                  left="shorter"
                  right="longer"
                  markerPct={Math.min(96, Math.max(8, ((noseLen - 0.15) / 0.15) * 100))}
                  bandLeft={25}
                  bandWidth={40}
                  note="within band — reference band 0.2–0.24, a photo-calculator range, not an ideal."
                />
              </div>
              <InShort
                section="Nose & midface"
                lead={
                  fsNose >= 85
                    ? "Every reading here sits in a strong range —"
                    : "Center the lens on the nose tip when re-testing —"
                }
                em={
                  fsNose >= 85
                    ? "nothing in this region needs correcting."
                    : "side photos unlock projection later."
                }
              />
            </section>

            {/* 06 Lips */}
            <section id="report-lips" className="mt-14 scroll-mt-24">
              <div className="mb-4 border-b border-[#ececec] pb-2.5">
                <SectionKicker
                  num="06"
                  rest={
                    <>
                      Measured
                      <span className="font-medium"> · 478-landmark geometry</span>
                    </>
                  }
                />
                <SectionTitle before="Lips &" em="smile." />
                <p className="mt-1.5 max-w-[60ch] text-sm leading-relaxed text-zinc-600">
                  Lip balance is about the ratio between lip height and mouth width, and how the
                  mouth sits inside the lower face — not absolute size.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <MetricPill label="Mouth Symmetry" score={fsMouth} />
              </div>
              <div className="mt-2 divide-y divide-border/70">
                <RatioRow
                  label="Lip Fullness"
                  band={bandLabel(fsMouth)}
                  bandColor={scoreHue(fsMouth)}
                  valueLabel={lipFull.toFixed(2)}
                  left="thinner"
                  right="fuller"
                  markerPct={Math.min(96, Math.max(8, ((lipFull - 0.2) / 0.25) * 100))}
                  bandLeft={20}
                  bandWidth={55}
                  note="within band — reference band 0.25–0.4, a photo-calculator range, not an ideal."
                />
                <RatioRow
                  label="Mouth Width"
                  band={bandLabel(fsMouth)}
                  bandColor={scoreHue(fsMouth)}
                  valueLabel={mouthW.toFixed(2)}
                  left="narrower"
                  right="wider"
                  markerPct={Math.min(96, Math.max(8, ((mouthW - 0.32) / 0.2) * 100))}
                  bandLeft={25}
                  bandWidth={40}
                  note="within band — reference band 0.38–0.45, a photo-calculator range, not an ideal."
                />
              </div>
              <InShort
                section="Lips & smile"
                lead={
                  fsMouth >= 78
                    ? "Every reading here sits in a strong range —"
                    : "Rest expression keeps this region stable —"
                }
                em={
                  fsMouth >= 78
                    ? "nothing in this region needs correcting."
                    : "smiles change the score more than structure."
                }
              />
            </section>

            {/* 07 Jaw */}
            <section id="report-jaw" className="mt-14 scroll-mt-24">
              <div className="mb-4 border-b border-[#ececec] pb-2.5">
                <SectionKicker
                  num="07"
                  rest={
                    <>
                      Measured
                      <span className="font-medium"> · front-view ratios</span>
                    </>
                  }
                />
                <SectionTitle before="Jaw &" em="chin." />
                <p className="mt-1.5 max-w-[60ch] text-sm leading-relaxed text-zinc-600">
                  From the front this report reads width ratios and symmetry — how the jaw frames
                  the face — not the side-profile angles a single photo can&apos;t support.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <MetricPill label="Jaw Symmetry" score={fsJaw} />
                <NotScored label="True gonial angle" />
              </div>
              <div className="mt-2 divide-y divide-border/70">
                <RatioRow
                  label="Jaw-to-Cheekbone Width"
                  band={bandLabel(fsJaw)}
                  bandColor={scoreHue(fsJaw)}
                  valueLabel={jawCheek.toFixed(2)}
                  left="tapered"
                  right="squared"
                  markerPct={Math.min(96, Math.max(8, ((jawCheek - 0.7) / 0.2) * 100))}
                  bandLeft={25}
                  bandWidth={40}
                  note="within band — reference band 0.76–0.82, a photo-calculator range, not an ideal."
                />
                <RatioRow
                  label="Face Width-to-Height (FWHR)"
                  band={golden >= 70 ? "Balanced" : "Room to grow"}
                  bandColor={scoreHue(golden)}
                  valueLabel={fwhr.toFixed(2)}
                  left="narrower"
                  right="wider"
                  markerPct={Math.min(96, Math.max(8, ((fwhr - 1.6) / 0.8) * 100))}
                  bandLeft={25}
                  bandWidth={40}
                  note="photo-calculator range ~1.8–2.1 — not a universal ideal."
                />
                <RatioRow
                  label="Lower Face Length"
                  band={bandLabel(thirds)}
                  bandColor={scoreHue(thirds)}
                  valueLabel={
                    typeof lowerFace === "number" ? lowerFace.toFixed(2) : String(lowerFace)
                  }
                  left="shorter"
                  right="longer"
                  markerPct={Math.min(96, Math.max(8, thirds))}
                  bandLeft={20}
                  bandWidth={55}
                  note="within band — reference band 0.36–0.42, a photo-calculator range, not an ideal."
                />
              </div>
              <InShort
                section="Jaw & chin"
                lead={
                  fsJaw >= 78
                    ? "A stable region with no priority actions —"
                    : "Jaw balance is a plan priority —"
                }
                em={
                  fsJaw >= 78
                    ? "the plan spends its effort where it pays more."
                    : "keep hair off the contour when you re-test."
                }
              />
            </section>

            {/* 08 Style studio — six AI analysis cards under one chapter */}
            <section id="report-studio" className="mt-14 scroll-mt-24">
              <div className="mb-4 border-b border-[#ececec] pb-2.5">
                <SectionKicker num="08" rest="Style studio" />
                <SectionTitle before="Look &" em="style." />
                <p className="mt-1.5 max-w-[60ch] text-sm leading-relaxed text-zinc-600">
                  Skin, features, color, glasses, hair, and makeup — each card is generated from your
                  photo with AI analysis. Visual guidance only, not medical advice.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {REPORT_CARD_KINDS.map((kind) => {
                    const label =
                      kind === "skin"
                        ? "Skin"
                        : kind === "features"
                          ? "Features"
                          : kind === "color"
                            ? "Color"
                            : kind === "glasses"
                              ? "Glasses"
                              : kind === "hair"
                                ? "Hair"
                                : "Makeup";
                    return (
                      <a
                        key={kind}
                        href={`#report-${kind === "features" ? "features" : kind}`}
                        className="rounded-full border border-[#e5e5e5] bg-white px-3 py-1 text-xs font-bold text-zinc-600 transition-colors hover:border-[#9F1239]/40 hover:text-[#9F1239]"
                      >
                        {label}
                      </a>
                    );
                  })}
                </div>
              </div>

              {scan.previewUrl &&
              (scan.previewUrl.startsWith("data:") ||
                scan.previewUrl.startsWith("http")) ? (
                REPORT_CARD_KINDS.map((kind, i) => (
                  <ReportAnalysisCard
                    key={kind}
                    kind={kind}
                    scanId={scan.id}
                    previewUrl={scan.previewUrl}
                    startDelayMs={i * 12_000}
                    nested
                  />
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-[#e5e5e5] bg-[#fafafa] px-5 py-8 text-center">
                  <p className="text-sm font-semibold text-[#0a0a0a]">
                    Style studio needs your saved photo
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Re-run a free scan and unlock again so the photo is stored as a durable image,
                    then these cards can generate.
                  </p>
                </div>
              )}
            </section>

            {/* 09 Action plan — GPT-5.6 Luna, shortboard-driven habits/skincare/training */}
            <ReportActionPlan
              scan={scan}
              leverageLabel={leverageLabel}
              leverageScore={leverageScore}
              faceShape={report.faceShape}
            />
          </div>

          {/* Share */}
          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#e5e5e5] px-6 text-sm font-bold text-[#0a0a0a] transition-colors hover:bg-zinc-100"
            >
              <Share2 className="h-4 w-4" />
              Share my result
            </button>
          </div>
        </div>
      </main>

      <FaceRatingSiteFooter />

      <ShareCardModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        previewUrl={report.previewUrl}
        score={report.score}
        tierName={report.tierName}
        tierColor={color}
        tierBlurb={report.tierBlurb}
        scaleMax={100}
        toolLabel="FACE REPORT"
        toolPath="/tools/full-analysis"
      />
    </ReportShell>
  );
}
