import type { ReactNode } from "react";
import { content } from "./data";
import { ScanFace, Scale, Sparkles } from "lucide-react";

function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e5e5e5]">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#405bff] to-[#7084ff]"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function CardIcon({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#eef0ff] to-[#e0e5ff] text-[#405bff] shadow-sm ring-1 ring-[#405bff]/20">
      {children}
    </div>
  );
}

/**
 * Sample metrics — product-style result cards (thefacereport structure,
 * Voltage Blue system instead of rose).
 */
export default function FaceRatingSampleMetrics() {
  const { sample } = content;

  const shapeAlts = [
    { label: "Heart", pct: 5 },
    { label: "Round", pct: 2 },
    { label: "Square", pct: 1 },
  ];

  const symmetryParts = [
    { label: "Eyes", score: 91 },
    { label: "Nose", score: 84 },
    { label: "Mouth", score: 89 },
    { label: "Jaw", score: 82 },
  ];

  const scoreRows = [
    { label: "Golden Ratio", value: "1.36" },
    { label: "Facial Thirds", value: "Even" },
    { label: "Canthal Tilt", value: "+4°" },
  ];

  return (
    <section className="border-t border-[#e5e5e5] bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#405bff]">
            {sample.eyebrow}
          </p>
          <h2 className="text-[clamp(1.75rem,4vw,2.25rem)] font-black leading-[1.1] tracking-tight text-[#0a0a0a] lg:text-4xl lg:tracking-[-0.025em]">
            {sample.title}{" "}
            <span className="font-serif font-normal italic text-[#405bff]">
              {sample.titleAccent}
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg font-medium leading-[1.625] text-black/60">
            {sample.body}
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {/* Face shape */}
          <div className="rounded-2xl border border-[#e5e5e5] bg-gradient-to-b from-white to-[#f9fafb] p-6 shadow-[0_1px_2px_rgba(24,24,27,0.04),0_10px_30px_-15px_rgba(24,24,27,0.12)]">
            <div className="mb-4 flex items-center gap-2">
              <CardIcon>
                <ScanFace className="h-4 w-4" strokeWidth={2} />
              </CardIcon>
              <p className="text-xs font-semibold uppercase tracking-wider text-black/60">
                Face Shape
              </p>
            </div>
            <p className="bg-gradient-to-b from-[#405bff] to-[#7084ff] bg-clip-text text-4xl font-black tracking-tight text-transparent">
              Oval
            </p>
            <p className="mt-1 text-sm font-medium text-black/60">92% confidence</p>
            <div className="mt-4">
              <ProgressBar value={92} />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {shapeAlts.map((a) => (
                <span
                  key={a.label}
                  className="rounded-md border border-[#e5e5e5] bg-white px-2 py-0.5 text-xs font-medium text-black/60"
                >
                  {a.label} {a.pct}%
                </span>
              ))}
            </div>
          </div>

          {/* Symmetry */}
          <div className="rounded-2xl border border-[#e5e5e5] bg-gradient-to-b from-white to-[#f9fafb] p-6 shadow-[0_1px_2px_rgba(24,24,27,0.04),0_10px_30px_-15px_rgba(24,24,27,0.12)]">
            <div className="mb-4 flex items-center gap-2">
              <CardIcon>
                <Scale className="h-4 w-4" strokeWidth={2} />
              </CardIcon>
              <p className="text-xs font-semibold uppercase tracking-wider text-black/60">
                Symmetry
              </p>
            </div>
            <p className="text-3xl font-black tracking-tight text-[#0a0a0a]">
              87<span className="text-lg text-black/30">/100</span>
            </p>
            <p className="mt-1 text-sm font-medium text-black/60">Above average symmetry</p>
            <div className="mt-4 space-y-2.5">
              {symmetryParts.map((p) => (
                <div key={p.label} className="flex items-center gap-3">
                  <span className="w-12 text-xs font-medium text-black/60">{p.label}</span>
                  <div className="min-w-0 flex-1">
                    <ProgressBar value={p.score} />
                  </div>
                  <span className="w-6 text-right text-xs font-bold text-[#0a0a0a]">
                    {p.score}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Attractiveness score — solid brand card */}
          <div className="rounded-2xl border border-[#405bff]/20 bg-[#405bff] p-6 text-white shadow-[0_1px_2px_rgba(64,91,255,0.2),0_16px_40px_-12px_rgba(64,91,255,0.45)]">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                <Sparkles className="h-4 w-4 text-white" strokeWidth={2} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
                Attractiveness Score
              </p>
            </div>
            <p className="text-4xl font-black tracking-tight tabular-nums">
              84<span className="text-lg font-bold text-white/60">/100</span>
            </p>
            <p className="mt-1 text-sm font-medium text-white/80">Solid proportion balance</p>
            <div className="mt-5 space-y-0 border-t border-white/20 pt-1">
              {scoreRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between border-b border-white/15 py-2.5 text-sm last:border-b-0"
                >
                  <span className="font-medium text-white/80">{row.label}</span>
                  <span className="font-bold tabular-nums text-white">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
