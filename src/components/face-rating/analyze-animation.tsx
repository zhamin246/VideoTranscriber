"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  previewUrl: string;
  status: string;
  fileName?: string;
  onCancel?: () => void;
};

/** Pseudo face-oval landmark positions (normalized 0–1) for scan animation */
function buildScanDots(count: number) {
  const dots: { x: number; y: number; delay: number }[] = [];
  // Elliptical face cloud + feature clusters
  for (let i = 0; i < count; i++) {
    const t = i / count;
    // denser toward vertical midface
    const angle = t * Math.PI * 8.7;
    const ring = 0.12 + (i % 7) * 0.04;
    const cx = 0.5 + Math.cos(angle) * ring * 0.85 * (0.7 + (i % 5) * 0.06);
    const cy = 0.42 + Math.sin(angle) * ring * 1.15 * (0.75 + (i % 3) * 0.08);
    // keep inside portrait oval
    const nx = (cx - 0.5) / 0.28;
    const ny = (cy - 0.48) / 0.38;
    if (nx * nx + ny * ny > 1.05) continue;
    dots.push({
      x: cx,
      y: cy,
      delay: Math.min(0.92, Math.max(0.05, (cy - 0.12) / 0.78 + (i % 9) * 0.008)),
    });
  }
  // Feature anchors (eyes / nose / mouth)
  const anchors = [
    [0.38, 0.4],
    [0.62, 0.4],
    [0.5, 0.52],
    [0.42, 0.62],
    [0.58, 0.62],
    [0.5, 0.68],
    [0.35, 0.55],
    [0.65, 0.55],
  ];
  anchors.forEach(([x, y], i) => {
    dots.push({ x, y, delay: 0.2 + i * 0.04 });
  });
  return dots;
}

const STEPS = [
  { key: "model", label: "Loading face model" },
  { key: "detect", label: "Detecting 478 landmarks" },
  { key: "score", label: "Scoring symmetry · thirds · fifths · ratio" },
] as const;

function stepIndexFromStatus(status: string): number {
  const s = status.toLowerCase();
  if (s.includes("scor") || s.includes("symmetry") || s.includes("ratio")) return 2;
  if (s.includes("detect") || s.includes("landmark")) return 1;
  return 0;
}

/**
 * Full-bleed analysis animation over the uploaded photo.
 * Scan line + progressive landmark dots + step checklist (thefacereport-style).
 */
export default function AnalyzeAnimation({
  previewUrl,
  status,
  fileName,
  onCancel,
}: Props) {
  const dots = useMemo(() => buildScanDots(96), []);
  const activeStep = stepIndexFromStatus(status);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      setTick((now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Looping scan 0→1 every ~2.2s
  const scanCycle = (tick % 2.2) / 2.2;
  const scanY = 8 + scanCycle * 84;
  // Landmarks light up as scan passes them, with a hold near the end of each cycle
  const reveal = Math.min(1, scanCycle * 1.15);

  const mapped = Math.min(
    478,
    Math.floor(40 + reveal * 420 + Math.sin(tick * 3) * 8)
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white">
      <div className="flex items-center justify-between border-b border-[#e5e5e5] px-4 py-3">
        <div>
          <p className="text-xs font-bold text-[#9F1239]">Analyzing…</p>
          <p className="truncate text-sm text-[#525252]">{fileName || "Your photo"}</p>
        </div>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-bold text-[#0a0a0a] underline-offset-4 hover:underline"
          >
            Cancel
          </button>
        ) : null}
      </div>

      <div className="relative aspect-[4/3] overflow-hidden bg-[#0a0a0a]">
        {/* Photo — slight zoom pulse */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt="Analyzing"
          className="h-full w-full object-cover opacity-90"
          style={{
            transform: `scale(${1.02 + Math.sin(tick * 1.2) * 0.01})`,
            transition: "transform 0.1s linear",
          }}
        />

        {/* Dark vignette */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.45) 100%)",
          }}
        />

        {/* Corner brackets */}
        <div className="pointer-events-none absolute inset-4">
          {[
            "left-0 top-0 border-l-2 border-t-2",
            "right-0 top-0 border-r-2 border-t-2",
            "left-0 bottom-0 border-b-2 border-l-2",
            "right-0 bottom-0 border-b-2 border-r-2",
          ].map((cls) => (
            <span
              key={cls}
              className={`absolute h-6 w-6 border-[#9F1239]/80 ${cls}`}
            />
          ))}
        </div>

        {/* Face guide oval */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[48%] h-[72%] w-[48%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-white/25"
        />

        {/* Landmark dots */}
        <div className="pointer-events-none absolute inset-0">
          {dots.map((d, i) => {
            const on = reveal >= d.delay;
            const pulse = on ? 0.55 + 0.45 * Math.sin(tick * 5 + i) : 0;
            return (
              <span
                key={i}
                className="absolute rounded-full bg-[#FB7185]"
                style={{
                  left: `${d.x * 100}%`,
                  top: `${d.y * 100}%`,
                  width: on ? 3 + pulse : 0,
                  height: on ? 3 + pulse : 0,
                  marginLeft: -1.5,
                  marginTop: -1.5,
                  opacity: on ? 0.35 + pulse * 0.55 : 0,
                  boxShadow: on ? "0 0 6px rgba(159,18,57,0.8)" : "none",
                  transition: "opacity 120ms linear, width 120ms linear, height 120ms linear",
                }}
              />
            );
          })}
        </div>

        {/* Scan line */}
        <div
          className="pointer-events-none absolute inset-x-0"
          style={{ top: `${scanY}%` }}
        >
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#9F1239] to-transparent shadow-[0_0_12px_2px_rgba(159,18,57,0.65)]" />
          <div className="mx-auto h-8 w-full -translate-y-full bg-gradient-to-b from-transparent to-[#9F1239]/15" />
        </div>

        {/* Bottom HUD */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-4 pt-10 text-white">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-bold tracking-tight">Mapping landmarks…</p>
              <p className="mt-0.5 text-xs text-white/70">{status}</p>
            </div>
            <p className="font-mono text-lg font-bold tabular-nums text-[#a5b4ff]">
              {mapped}
              <span className="text-xs font-semibold text-white/50">/478</span>
            </p>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#9F1239] to-[#FB7185] transition-[width] duration-300"
              style={{ width: `${Math.min(96, 18 + activeStep * 28 + reveal * 22)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step checklist */}
      <ul className="space-y-2 px-4 py-4">
        {STEPS.map((step, i) => {
          const done = i < activeStep;
          const current = i === activeStep;
          return (
            <li key={step.key} className="flex items-center gap-2.5 text-sm">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                  done
                    ? "border-[#9F1239] bg-[#9F1239] text-white"
                    : current
                      ? "border-[#9F1239] text-[#9F1239]"
                      : "border-[#e5e5e5] text-[#a3a3a3]"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={
                  done || current
                    ? "font-semibold text-[#0a0a0a]"
                    : "font-medium text-[#a3a3a3]"
                }
              >
                {step.label}
                {current ? (
                  <span className="ml-1 inline-flex gap-0.5">
                    <span className="animate-pulse">·</span>
                    <span className="animate-pulse [animation-delay:150ms]">·</span>
                    <span className="animate-pulse [animation-delay:300ms]">·</span>
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
