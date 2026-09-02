"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Share2,
  Layers,
  Grid3X3,
  Scan,
  CircleDot,
  BoxSelect,
  Lock,
} from "lucide-react";
import ResultGeometry, {
  type LandmarkPoint,
  type MeshMode,
  type SymmetryDeviation,
} from "./result-geometry";
import ShareCardModal from "./share-card-modal";
import {
  estimateFaceShape,
  saveScanResult,
} from "@/lib/face-rating/result-store";

export type AttractivenessComponents = {
  symmetry: number;
  thirds: number;
  fifths: number;
  golden: number;
};

export type AttractivenessResultData = {
  score: number;
  components: AttractivenessComponents;
  previewUrl: string;
  cohortSize?: number;
  landmarks?: LandmarkPoint[];
  imageWidth?: number;
  imageHeight?: number;
  deviations?: SymmetryDeviation[];
  detail?: {
    goldenRatio: number;
    thirds: { upper: number; middle: number; lower: number };
    fifths: number[];
    featureSymmetry?: {
      eye: number;
      eyebrow: number;
      nose: number;
      mouth: number;
      jaw: number;
    };
  };
  engine?: "mediapipe" | "demo";
};

type Tier = {
  name: string;
  /** e.g. Top 35% — ahead of 65% of Face Rating scans */
  note: string;
  blurb: string;
  color: string;
};

/**
 * Tier bands match free-result product language used by category leaders
 * (Showstopper / Standout / Glow Up / Rising / Foundation) so the score
 * readout maps cleanly onto the scale explained on the tool page.
 * Colors use Face Rating burgundy/rose system.
 */
function tierFor(score: number): Tier {
  if (score >= 87) {
    return {
      name: "Showstopper",
      note: "Top 5% — ahead of 95% of Face Rating scans",
      blurb: "Closest alignment across this tool’s four geometry components.",
      color: "#9F1239",
    };
  }
  if (score >= 83) {
    return {
      name: "Standout",
      note: "Top 15% — ahead of 85% of Face Rating scans",
      blurb: "Strong measured harmony, with only modest variation across components.",
      color: "#9F1239",
    };
  }
  if (score >= 78) {
    return {
      name: "Glow Up",
      note: "Top 35% — ahead of 65% of Face Rating scans",
      blurb: "Above-average balance with clear levers to push higher.",
      color: "#881337",
    };
  }
  if (score >= 60) {
    return {
      name: "Rising",
      note: "Solid foundation on this scale",
      blurb: "Solid foundation, clear room to push higher",
      color: "#f59e0b",
    };
  }
  return {
    name: "Foundation",
    note: "Distinctive features — biggest upside potential",
    blurb: "Further from this tool’s geometric targets. Distinctive faces often land here.",
    color: "#E11D48",
  };
}

function strongestComponent(c: AttractivenessComponents) {
  const rows = [
    { key: "symmetry" as const, label: "Symmetry", score: c.symmetry },
    { key: "thirds" as const, label: "Facial thirds balance", score: c.thirds },
    { key: "fifths" as const, label: "Facial fifths balance", score: c.fifths },
    { key: "golden" as const, label: "Golden ratio proximity", score: c.golden },
  ];
  return rows.reduce((a, b) => (b.score > a.score ? b : a));
}

function weakestComponent(c: AttractivenessComponents) {
  const rows = [
    { key: "symmetry" as const, label: "Symmetry", score: c.symmetry },
    { key: "thirds" as const, label: "Facial thirds balance", score: c.thirds },
    { key: "fifths" as const, label: "Facial fifths balance", score: c.fifths },
    { key: "golden" as const, label: "Golden ratio proximity", score: c.golden },
  ];
  return rows.reduce((a, b) => (b.score < a.score ? b : a));
}

/**
 * Locked 6-spoke harmony radar (matches thefacereport free-result Beyond card).
 * Silhouette uses real component scores; exact readout stays locked.
 */
function LockedHarmonyRadar({
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
    <div className="relative mx-auto w-full max-w-[280px]">
      <svg viewBox="0 0 200 200" className="h-auto w-full" aria-hidden>
        {rings.map((pts, i) => (
          <polygon
            key={i}
            points={pts}
            fill="none"
            stroke="#e8e8e8"
            strokeWidth={1}
          />
        ))}
        {Array.from({ length: n }, (_, i) => {
          const [x, y] = pointAt(i, maxR);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="#e8e8e8"
              strokeWidth={1}
            />
          );
        })}
        <polygon
          points={dataPoly}
          fill={color}
          fillOpacity={0.12}
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
            fontSize={10}
            fontWeight={600}
            fill="#6b7280"
            dominantBaseline="middle"
          >
            {l.label}
          </text>
        ))}
      </svg>
      {/* Center lock — silhouette is visible, scores stay locked */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white shadow-md"
          style={{ backgroundColor: color }}
        >
          <Lock className="h-5 w-5 text-white" strokeWidth={2.25} />
        </div>
      </div>
    </div>
  );
}

/**
 * Free attractiveness result — layout mirrors thefacereport post-upload flow:
 * photo → hero score → share card → strongest signal → beyond (locked radar) →
 * analysis geometry (mesh toggles).
 */
export default function AttractivenessResult({
  data,
  onReset,
}: {
  data: AttractivenessResultData;
  onReset: () => void;
}) {
  const {
    score,
    components,
    previewUrl,
    detail,
    landmarks,
    imageWidth,
    imageHeight,
    deviations,
  } = data;
  const tier = tierFor(score);
  const strong = strongestComponent(components);
  const weak = weakestComponent(components);
  const router = useRouter();
  const [meshMode, setMeshMode] = useState<MeshMode>("overlay");
  const [shareOpen, setShareOpen] = useState(false);
  const [openingPreview, setOpeningPreview] = useState(false);

  const openFullPreview = async () => {
    if (openingPreview) return;
    setOpeningPreview(true);
    try {
      const { previewUrlForStorage } = await import(
        "@/lib/face-rating/persist-report"
      );
      const previewUrl =
        (await previewUrlForStorage(data.previewUrl)) || data.previewUrl;
      const id = saveScanResult({
        src: "attractiveness",
        score: data.score,
        components: data.components,
        previewUrl,
        landmarks: data.landmarks,
        imageWidth: data.imageWidth,
        imageHeight: data.imageHeight,
        detail: data.detail,
        faceShape: estimateFaceShape(data.detail?.goldenRatio ?? 1.2),
      });
      if (id) {
        router.push(`/results/${id}?src=attractiveness`);
        return;
      }
    } catch {
      /* fall through */
    }
    setOpeningPreview(false);
    router.push("/pricing");
  };

  /** 6-axis order matches competitor radar: Symmetry → Golden → Thirds → Fifths → Eyes → Jaw */
  const radarScores = [
    { label: "Symmetry", score: components.symmetry },
    { label: "Golden", score: components.golden },
    { label: "Thirds", score: components.thirds },
    { label: "Fifths", score: components.fifths },
    {
      label: "Eyes",
      score: detail?.featureSymmetry?.eye ?? Math.round(components.symmetry * 0.95),
    },
    {
      label: "Jaw",
      score: detail?.featureSymmetry?.jaw ?? Math.round(components.symmetry * 0.9),
    },
  ];

  const weakShort =
    weak.key === "golden"
      ? "Golden ratio"
      : weak.key === "thirds"
        ? "Facial thirds"
        : weak.key === "fifths"
          ? "Facial fifths"
          : "Symmetry";

  const modes: { id: MeshMode; label: string; icon: typeof Layers }[] = [
    { id: "overlay", label: "Overlay", icon: CircleDot },
    { id: "thirds", label: "Facial Thirds", icon: Grid3X3 },
    { id: "mesh", label: "Full Mesh", icon: Layers },
    { id: "mesh-only", label: "Mesh Only", icon: Scan },
    { id: "regions", label: "Regions", icon: BoxSelect },
    { id: "photo", label: "Photo", icon: Scan },
  ];

  return (
    <div
      className="mx-auto w-full max-w-2xl space-y-6 animate-in fade-in duration-500"
      aria-live="polite"
    >
      <ShareCardModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        previewUrl={previewUrl}
        score={score}
        tierName={tier.name}
        tierColor={tier.color}
        tierBlurb={tier.blurb}
        scaleMax={100}
        toolLabel="ATTRACTIVENESS"
        toolPath="/tools/ai-attractiveness-test"
      />
      {/* 1. Photo strip — competitor: max-w-lg, simple chrome */}
      <div className="mx-auto w-full max-w-lg">
        <div className="overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white">
          <div className="relative aspect-[4/3] bg-[#0a0a0a]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Uploaded photo for AI facial analysis"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <p className="text-sm text-[#525252]">Processed locally in your browser</p>
            <button
              type="button"
              onClick={onReset}
              className="text-sm font-bold text-[#9F1239] underline-offset-4 hover:underline"
            >
              Change photo
            </button>
          </div>
        </div>
      </div>

      {/* 2. Hero score — black frame matches thefacereport (1.6px #0a0a0a) */}
      <div
        className="hero-score-section py-10 text-center"
        style={{ border: "1.6px solid #0a0a0a" }}
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-[#737373]">
          Attractiveness
        </p>
        <p
          className="mt-3 text-7xl font-black tabular-nums tracking-tight transition-all duration-700"
          style={{ color: tier.color }}
        >
          {score}
          <span className="ml-2 text-2xl font-semibold text-[#a3a3a3]">/100</span>
        </p>
        <p
          className="mt-4 text-3xl font-black uppercase tracking-tight sm:text-4xl"
          style={{ color: tier.color }}
        >
          {tier.name}
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-[#525252]">{tier.note}</p>
        <p className="mx-auto mt-1 max-w-sm text-sm italic text-[#737373]/80">
          {tier.blurb}
        </p>

        {/* Share card teaser — opens thefacereport-style modal */}
        <button
          type="button"
          className="group mx-auto mt-6 flex flex-col items-center gap-3"
          aria-label="Create a share card for your Attractiveness result"
          onClick={() => setShareOpen(true)}
        >
          <span
            className="relative flex aspect-[1080/1350] w-32 flex-col items-center overflow-hidden rounded-xl bg-[#0a0a0a] px-2.5 pt-3 text-center text-white shadow-xl transition-transform group-hover:-translate-y-1 sm:w-36 sm:rotate-2 group-hover:rotate-0"
            style={{
              boxShadow: `inset 0 2px 0 0 ${tier.color}, inset 0 -2px 0 0 ${tier.color}`,
            }}
          >
            <span className="text-[6px] font-bold tracking-[0.16em] text-white/55">
              FACE RATING
            </span>
            <span className="mt-1 text-[7px] font-bold tracking-wider text-white/45">
              ATTRACTIVENESS
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              className="mt-2 size-11 rounded-full border border-white/80 object-cover"
              src={previewUrl}
            />
            <span className="mt-2 text-3xl font-black leading-none tabular-nums">
              {score}
            </span>
            <span className="mt-0.5 text-[7px] font-medium text-white/45">
              / 100
            </span>
            <span
              className="mt-1.5 max-w-full truncate text-[9px] font-black uppercase tracking-wide"
              style={{ color: tier.color }}
            >
              {tier.name}
            </span>
            <span className="mt-auto mb-2 inline-flex items-center gap-1 text-[6px] font-semibold uppercase tracking-wider text-white/55">
              <Share2 className="h-2.5 w-2.5" />
              Tap to share
            </span>
          </span>
          <span className="text-sm font-semibold text-[#0a0a0a] underline underline-offset-4">
            Make a share card →
          </span>
        </button>
      </div>

      {/* 3. Strongest free signal (only free teaser — no full 4-bar breakdown) */}
      <div
        role="status"
        className="mx-auto grid max-w-xl grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 rounded-lg border border-[#e5e5e5] bg-white px-3 py-2.5 text-left text-sm"
      >
        <Sparkles className="mt-0.5 h-4 w-4 text-[#9F1239]" aria-hidden />
        <p className="font-medium text-[#0a0a0a]">Your strongest measured signal</p>
        <p className="col-start-2 text-sm text-[#525252]">
          <strong className="font-bold text-[#0a0a0a]">
            {strong.label} — {strong.score}/100.
          </strong>{" "}
          That is one concrete reason behind your headline score. Your report keeps the complete
          six-dimension diagnosis and action plan together.
        </p>
      </div>

      {/* 4. Beyond — locked 6-axis harmony radar (matches thefacereport attractiveness result) */}
      <div className="mx-auto mt-6 max-w-2xl">
        <div className="flex flex-col overflow-hidden border-2 border-[#9F1239]/30 bg-white">
          {/* Header */}
          <div className="flex flex-col gap-1 border-b border-[#e5e5e5] bg-[#fafafa] px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-bold uppercase tracking-widest text-[#9F1239]">
                  Beyond your headline score
                </p>
                <h3 className="text-xl font-bold tracking-tight text-[#0a0a0a] sm:text-2xl">
                  See what&apos;s holding your score back — and what to do first
                </h3>
                <p className="text-sm leading-normal text-[#525252]">
                  Map the dimensions behind your result, compare the measured pattern with recent
                  scans and turn it into realistic next steps.
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center border border-[#e5e5e5] px-2.5 py-0.5 text-xs font-bold text-[#0a0a0a]">
                Locked
              </span>
            </div>
            <p className="mt-3 text-sm text-[#525252]">
              <span className="font-bold text-[#0a0a0a]">Highest-leverage area:</span>{" "}
              {weakShort} · {weak.score}/100
            </p>
          </div>

          {/* Body: locked radar + pillars */}
          <div className="flex flex-col gap-6 px-5 py-6">
            <div className="flex flex-col items-center">
              <LockedHarmonyRadar scores={radarScores} color={tier.color} />
              <p className="mt-4 text-center text-xs font-bold uppercase tracking-widest text-[#9F1239]">
                Your harmony profile
              </p>
              <p className="mx-auto mt-1.5 max-w-sm text-center text-sm leading-relaxed text-[#737373]">
                The silhouette uses your scan. Exact scores, explanations and priorities unlock in
                the report.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  k: "Understand",
                  v: "40+ measurements across 7 facial regions, percentiles and every score explained",
                },
                {
                  k: "Visualize",
                  v: "AI styling concept, 6 hairstyles and 12-season colors",
                },
                {
                  k: "Act",
                  v: "72-hour priorities and a personalized 4-week plan",
                },
              ].map((item) => (
                <div key={item.k} className="rounded-lg border border-[#e5e5e5] bg-[#fafafa] p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#9F1239]">
                    {item.k}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#525252]">{item.v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer CTA → freemium /results/[id] preview (thefacereport parity) */}
          <div className="flex flex-col items-stretch gap-2 border-t border-[#e5e5e5] bg-[#fafafa] px-5 py-3">
            <button
              type="button"
              onClick={openFullPreview}
              disabled={openingPreview}
              className="inline-flex h-10 w-full items-center justify-center rounded-full bg-[#9F1239] px-8 text-sm font-bold text-white transition-colors hover:bg-[#881337] disabled:opacity-60"
            >
              {openingPreview ? "Opening preview…" : "See my full preview — free"}
            </button>
            <p className="text-center text-xs font-medium text-[#0a0a0a]">
              Then $9.90 once if you want the full report · 7-day guarantee
            </p>
            <p className="text-center text-[11px] text-[#737373]">
              Saved web report + emailed PDF
            </p>
          </div>
        </div>
      </div>

      {/* Analysis geometry — competitor-style toggle strip + canvas */}
      <div className="space-y-3">
        <div
          role="group"
          aria-label="Photo analysis display options"
          className="mx-auto flex w-fit max-w-full flex-wrap justify-center gap-2"
        >
          {modes.map((m) => {
            const active = meshMode === m.id;
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                type="button"
                aria-pressed={active}
                onClick={() => setMeshMode(m.id)}
                className={`inline-flex h-8 items-center gap-1.5 border px-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "border-[#9F1239]/40 bg-[#FFF1F2] text-[#9F1239]"
                    : "border-[#e5e5e5] bg-transparent text-[#0a0a0a] hover:bg-[#f5f5f5]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {m.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 border border-[#e5e5e5] px-2.5 text-sm font-medium text-[#0a0a0a] hover:bg-[#f5f5f5]"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </button>
        </div>

        <ResultGeometry
          src={previewUrl}
          landmarks={landmarks}
          imageWidth={imageWidth}
          imageHeight={imageHeight}
          mode={meshMode}
          accent={tier.color}
          thirds={detail?.thirds}
          deviations={deviations}
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 pb-4">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-10 items-center border border-[#e5e5e5] px-4 text-sm font-bold text-[#0a0a0a] hover:bg-[#f5f5f5]"
        >
          Try another photo
        </button>
        <button
          type="button"
          onClick={openFullPreview}
          disabled={openingPreview}
          className="inline-flex h-10 items-center rounded-full bg-[#9F1239] px-4 text-sm font-bold text-white hover:bg-[#881337] disabled:opacity-60"
        >
          {openingPreview ? "Opening…" : "Get my Face Report"}
        </button>
      </div>
    </div>
  );
}
