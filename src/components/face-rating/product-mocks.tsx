"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { content } from "./data";
import { btnPrimary, btnSecondary, V } from "./visual";

const FACE = "/face-rating/hero-face.webp";
const HERO_PHOTO = "https://cdn.imagetocad.app/landing/hero-street-photo.webp?v=4x3";
const BEFORE = "/face-rating/glowup-before.webp";
const AFTER = "/face-rating/glowup-after.webp";

const more = content.moreThan;

function EmptyTrack({ light }: { light?: boolean }) {
  return (
    <div className="relative h-px w-full" style={{ backgroundColor: light ? V.darkLine : V.line }}>
      <span
        className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ left: "42%", backgroundColor: light ? V.accent : V.ink }}
        aria-hidden
      />
    </div>
  );
}

/** Thin measurement overlay on real face — ~10–15 markers */
export function FaceMapOverlay({
  mode = "full",
  className = "",
}: {
  mode?: "full" | "lower" | "thirds";
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 125"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden
    >
      {/* vertical axis */}
      <line x1="50" y1="12" x2="50" y2="112" stroke="rgba(255,255,255,0.45)" strokeWidth="0.35" strokeDasharray="1.2 1.2" />
      {/* thirds */}
      <line x1="22" y1="35" x2="78" y2="35" stroke="rgba(255,255,255,0.35)" strokeWidth="0.3" />
      <line x1="22" y1="58" x2="78" y2="58" stroke="rgba(255,255,255,0.35)" strokeWidth="0.3" />
      <line x1="22" y1="81" x2="78" y2="81" stroke="rgba(255,255,255,0.35)" strokeWidth="0.3" />
      {/* eye line */}
      <line x1="30" y1="52" x2="70" y2="52" stroke="rgba(251,113,133,0.85)" strokeWidth="0.4" />
      <circle cx="38" cy="52" r="1.1" fill="rgba(251,113,133,0.95)" />
      <circle cx="62" cy="52" r="1.1" fill="rgba(251,113,133,0.95)" />
      {/* face width */}
      <line x1="26" y1="62" x2="74" y2="62" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
      <circle cx="26" cy="62" r="0.9" fill="rgba(255,255,255,0.7)" />
      <circle cx="74" cy="62" r="0.9" fill="rgba(255,255,255,0.7)" />
      {/* jaw */}
      <path
        d="M32 78 Q50 102 68 78"
        fill="none"
        stroke={mode === "lower" ? "rgba(251,113,133,0.95)" : "rgba(255,255,255,0.45)"}
        strokeWidth={mode === "lower" ? 0.65 : 0.4}
      />
      {mode === "lower" ? (
        <ellipse cx="50" cy="90" rx="16" ry="12" fill="rgba(251,113,133,0.18)" />
      ) : null}
      {/* landmarks */}
      {[
        [50, 28],
        [38, 52],
        [62, 52],
        [50, 68],
        [42, 78],
        [58, 78],
        [50, 96],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="0.7" fill="rgba(255,255,255,0.75)" />
      ))}
    </svg>
  );
}

export function FacePhoto({
  src = FACE,
  alt = "Sample face for analysis visualization",
  map,
  className = "",
  objectClass = "object-[center_20%]",
  priority,
}: {
  src?: string;
  alt?: string;
  map?: "full" | "lower" | "thirds" | "none";
  className?: string;
  objectClass?: string;
  priority?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden bg-[#1a1a1a] ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        className={`h-full w-full object-cover ${objectClass}`}
        sizes="(max-width: 1024px) 100vw, 60vw"
        priority={priority}
      />
      {map && map !== "none" ? <FaceMapOverlay mode={map === "thirds" ? "thirds" : map} /> : null}
    </div>
  );
}

const HERO_CAD = "https://cdn.imagetocad.app/landing/hero-street-lineart.webp?v=4x3";
/** Hero slot is ~4:3 on typical laptops. Generate photo + lineart at this ratio. */
const HERO_PHOTO_W = 4;
const HERO_PHOTO_H = 3;

/** PhotoCAD-style before/after compare — landscape street photo, drag the seam. */
export function HeroFaceVisual({ bleed = false }: { bleed?: boolean }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const userLockedRef = useRef(false);
  const [pos, setPos] = useState(38);

  const setFromClientX = useCallback((clientX: number) => {
    const el = boxRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(100, Math.max(0, next)));
  }, []);

  const lockUser = useCallback(() => {
    userLockedRef.current = true;
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      setFromClientX(e.clientX);
    };
    const onUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [setFromClientX]);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = 22;
    const to = 52;
    const duration = 1600;
    const tick = (now: number) => {
      if (userLockedRef.current) return;
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setPos(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className="flex h-full items-center justify-center py-10 lg:py-0"
    >
      <div
        className="relative w-full overflow-hidden rounded-[18px]"
        style={{
          aspectRatio: `${HERO_PHOTO_W} / ${HERO_PHOTO_H}`,
        }}
      >
        <div
          ref={boxRef}
          role="slider"
          aria-label="Before and after comparison"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          tabIndex={0}
          className="absolute inset-0 cursor-ew-resize select-none touch-none"
          onPointerDown={(e) => {
            lockUser();
            draggingRef.current = true;
            (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
            setFromClientX(e.clientX);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              e.preventDefault();
              lockUser();
              setPos((p) =>
                Math.min(100, Math.max(0, p + (e.key === "ArrowRight" ? 3 : -3)))
              );
            }
          }}
        >
          <Image
            src={HERO_PHOTO}
            alt="Original photo"
            fill
            draggable={false}
            priority
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 60vw"
          />
          <div
            className="absolute inset-0 bg-white"
            style={{ clipPath: `inset(-1px 0 -1px ${pos}%)` }}
          >
            <Image
              src={HERO_CAD}
              alt="CAD line drawing of the same image"
              fill
              draggable={false}
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
          </div>

          <div
            className="absolute top-0 bottom-0 z-20 w-12 -translate-x-1/2"
            style={{ left: `${pos}%` }}
          >
            <span
              className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/90"
              aria-hidden
            />
            <span
              className="absolute left-1/2 top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)]"
              aria-hidden
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M7 4 3 10l4 6M13 4l4 6-4 6"
                  stroke="#525252"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Report interface empty state — hierarchy, not a filled scorecard. */
export function ResultShowcaseCanvas() {
  return (
    <div
      className="mx-auto w-full overflow-hidden border lg:aspect-[16/10]"
      style={{
        borderColor: V.line,
        backgroundColor: V.surface,
        maxWidth: "92%",
        minHeight: "min(72vh, 720px)",
      }}
    >
      <div className="flex h-full min-h-[520px] flex-col p-6 sm:p-8 lg:p-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em]" style={{ color: V.muted }}>
          Face Rating Report
        </p>
        <div className="mt-8 flex items-end gap-4">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.16em]" style={{ color: V.muted }}>
              {more.scoreLabel}
            </p>
            <p
              className="mt-2 font-semibold leading-none tracking-[-0.04em] tabular-nums"
              style={{ color: V.ink, fontSize: "clamp(3.25rem, 8vw, 5.5rem)" }}
            >
              —<span className="ml-2 text-[22px] font-medium tracking-normal" style={{ color: V.muted }}>/ {more.max}</span>
            </p>
          </div>
        </div>

        <div className="mt-10 grid min-h-0 flex-1 gap-4 lg:grid-cols-[0.42fr_0.58fr]">
          <div className="relative min-h-[200px] overflow-hidden" style={{ backgroundColor: V.surfaceAlt }}>
            <FacePhoto map="full" className="absolute inset-0 h-full w-full" objectClass="object-[center_22%]" />
            <p
              className="absolute left-3 top-3 text-[10px] font-medium uppercase tracking-[0.16em] text-white/80"
            >
              Facial Profile
            </p>
          </div>
          <div className="flex flex-col border p-5" style={{ borderColor: V.line }}>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em]" style={{ color: V.muted }}>
              Feature Analysis
            </p>
            <ul className="mt-6 flex-1">
              {more.metrics.map((m) => (
                <li
                  key={m.label}
                  className="grid grid-cols-[1fr_auto] items-center gap-6 border-b py-3.5"
                  style={{ borderColor: V.line }}
                >
                  <span className="text-[15px] font-medium" style={{ color: V.ink }}>
                    {m.label}
                  </span>
                  <span className="text-[15px] tabular-nums" style={{ color: V.muted }}>
                    —
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 border px-5 py-4" style={{ borderColor: V.line }}>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em]" style={{ color: V.muted }}>
            Facial Measurements
          </p>
          <div className="mt-4 grid gap-6 sm:grid-cols-3">
            {["Facial thirds", "Symmetry axis", "Face width"].map((label) => (
              <div key={label}>
                <p className="mb-3 text-[13px]" style={{ color: V.ink }}>
                  {label}
                </p>
                <EmptyTrack />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetectFrame() {
  return (
    <svg viewBox="0 0 100 125" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
      <rect
        x="22"
        y="14"
        width="56"
        height="96"
        fill="none"
        stroke="rgba(244,243,239,0.55)"
        strokeWidth="0.45"
        strokeDasharray="2.2 1.4"
      />
      {[
        [22, 14],
        [78, 14],
        [22, 110],
        [78, 110],
      ].map(([x, y], i) => (
        <path
          key={i}
          d={`M${x + (x < 50 ? 6 : -6)} ${y} H${x} V${y + (y < 60 ? 6 : -6)}`}
          fill="none"
          stroke={V.accent}
          strokeWidth="0.85"
        />
      ))}
    </svg>
  );
}

/** Dark measurement instrument — face + tracks, no user values. */
export function MeasurementsCanvas() {
  const tracks = [
    { label: "Facial thirds", hint: "Reference range" },
    { label: "Symmetry", hint: "Reference range" },
    { label: "Face width", hint: "Reference range" },
  ];

  return (
    <div>
      <div className="grid items-stretch gap-8 lg:grid-cols-[minmax(0,0.52fr)_minmax(0,0.48fr)] lg:gap-12">
        <div className="relative min-h-[320px] overflow-hidden" style={{ backgroundColor: V.darkSurface, aspectRatio: "4 / 5" }}>
          <FacePhoto map="full" className="absolute inset-0 h-full w-full" objectClass="object-[center_18%]" />
          <DetectFrame />
        </div>
        <div className="flex flex-col justify-center border px-6 py-8 sm:px-8" style={{ borderColor: V.darkLine, backgroundColor: V.darkSurface }}>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em]" style={{ color: V.darkMuted }}>
            Measurement
          </p>
          <ul className="mt-10 space-y-10">
            {tracks.map((t) => (
              <li key={t.label}>
                <p className="text-[15px] font-medium" style={{ color: V.darkInk }}>
                  {t.label}
                </p>
                <p className="mt-1 text-[12px] uppercase tracking-[0.14em]" style={{ color: V.darkMuted }}>
                  {t.hint}
                </p>
                <div className="mt-4">
                  <EmptyTrack light />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/** Harmony visualization — labels only, decorative profile, no scores. */
export function HarmonyRadar({
  labels = ["Symmetry", "Proportions", "Harmony", "Balance", "Spacing", "Structure"],
}: {
  labels?: string[];
}) {
  const cx = 100;
  const cy = 100;
  const maxR = 62;
  const n = labels.length;
  const weights = [0.62, 0.58, 0.64, 0.6, 0.59, 0.61];
  const pointAt = (i: number, r: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const;
  };
  const rings = [0.33, 0.66, 1].map((t) =>
    Array.from({ length: n }, (_, i) => pointAt(i, maxR * t))
      .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
      .join(" ")
  );
  const dataPoly = labels
    .map((_, i) => {
      const [x, y] = pointAt(i, weights[i % weights.length] * maxR);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const pts = labels.map((_, i) => pointAt(i, weights[i % weights.length] * maxR));
  const labelPts = labels.map((label, i) => {
    const [x, y] = pointAt(i, maxR + 18);
    return { label, x, y };
  });

  return (
    <div className="mx-auto w-full max-w-[560px]">
      <svg viewBox="0 0 200 200" className="h-auto w-full" aria-hidden>
        {rings.map((ptsStr, i) => (
          <polygon key={i} points={ptsStr} fill="none" stroke="rgba(244,243,239,0.1)" strokeWidth={0.6} />
        ))}
        {Array.from({ length: n }, (_, i) => {
          const [x, y] = pointAt(i, maxR);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(244,243,239,0.08)" strokeWidth={0.6} />;
        })}
        <polygon
          points={dataPoly}
          fill="rgba(251,113,133,0.12)"
          stroke={V.accent}
          strokeWidth={1.15}
          strokeLinejoin="round"
        />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={1.6} fill={V.accent} />
        ))}
        {labelPts.map((l) => (
          <text
            key={l.label}
            x={l.x}
            y={l.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={6.5}
            fill="rgba(244,243,239,0.42)"
          >
            {l.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

/** Key area — highlight a region, never a sample limiter score. */
export function MainLimiterCanvas() {
  const s = content.limiter;

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.6fr)_minmax(0,0.4fr)] lg:gap-14">
      <div className="relative overflow-hidden" style={{ backgroundColor: V.darkSurface, aspectRatio: "4 / 5" }}>
        <FacePhoto map="lower" objectClass="object-[center_78%]" className="absolute inset-0 h-full w-full" />
        <svg viewBox="0 0 100 125" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          <line x1="68" y1="90" x2="92" y2="28" stroke="rgba(251,113,133,0.85)" strokeWidth="0.35" />
          <circle cx="68" cy="90" r="1.2" fill={V.accent} />
        </svg>
        <div className="absolute right-4 top-6 text-right">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em]" style={{ color: V.accent }}>
            Key area
          </p>
          <p className="mt-1 text-[13px] text-white/70">{s.badge}</p>
        </div>
      </div>

      <div className="flex min-w-0 flex-col justify-center">
        <p className="text-[16px] leading-[1.65] sm:text-[17px]" style={{ color: V.darkMuted }}>
          {s.body}
        </p>
        <p className="mt-4 text-[16px] leading-[1.65] sm:text-[17px]" style={{ color: V.darkMuted }}>
          {s.prompt}
        </p>
        <p className="mt-2 text-[16px] font-medium sm:text-[17px]" style={{ color: V.darkInk }}>
          {s.prompt2}
        </p>
        <ul className="mt-8">
          {s.points.map((p) => (
            <li key={p.title} className="border-t py-4 first:border-t-0 first:pt-0" style={{ borderColor: V.darkLine }}>
              <p className="text-[16px] font-semibold" style={{ color: V.darkInk }}>
                {p.title}
              </p>
              <p className="mt-1.5 text-[15px] leading-relaxed" style={{ color: V.darkMuted }}>
                {p.body}
              </p>
            </li>
          ))}
        </ul>
        <Link href={s.cta.href} className={`${btnPrimary} mt-10 w-fit`}>
          {s.cta.label}
        </Link>
      </div>
    </div>
  );
}

/** Paid-offer pair: harmony instrument + styling concept, no user scores. */
export function PaidOfferVisuals() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
      <article className="flex flex-col overflow-hidden border" style={{ borderColor: V.line, backgroundColor: V.surface }}>
        <div className="px-5 pt-5">
          <p className="text-[16px] font-semibold" style={{ color: V.ink }}>
            Harmony profile
          </p>
          <p className="mt-1 text-[14px] leading-relaxed" style={{ color: V.muted }}>
            Six-dimension map · unlocked after analysis
          </p>
        </div>
        <div className="m-4 flex-1 px-2 py-4" style={{ backgroundColor: V.darkBg }}>
          <HarmonyRadar />
        </div>
        <p className="border-t px-5 py-4 text-[13px] leading-relaxed" style={{ borderColor: V.line, color: V.muted }}>
          Axis labels only. Exact scores stay in the report.
        </p>
      </article>
      <article className="flex flex-col overflow-hidden border" style={{ borderColor: V.line, backgroundColor: V.surface }}>
        <div className="px-5 pt-5 pb-4">
          <p className="text-[16px] font-semibold" style={{ color: V.ink }}>
            AI visual concept
          </p>
          <p className="mt-1 text-[14px] leading-relaxed" style={{ color: V.muted }}>
            A styling direction on a sample face
          </p>
        </div>
        <div className="px-4 pb-4">
          <BeforeConceptVisual />
        </div>
      </article>
    </div>
  );
}

/** §16 Before / concept */
export function BeforeConceptVisual() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
      {[
        { src: BEFORE, label: "Current" },
        { src: AFTER, label: "AI Visual Concept" },
      ].map((item) => (
        <div
          key={item.label}
          className="relative aspect-[4/5] overflow-hidden rounded-[14px] border"
          style={{ borderColor: V.line }}
        >
          <Image src={item.src} alt="" fill className="object-cover" sizes="(max-width:640px) 100vw, 50vw" />
          <span
            className="absolute left-3 top-3 rounded-[8px] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-white"
            style={{ backgroundColor: "rgba(13,14,15,0.65)" }}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Full-width report skeleton — locked / empty modules. */
export function FullReportCanvas() {
  const modules = [
    { t: "Face Rating", d: "— / 10", locked: false },
    { t: "Facial Profile", d: "Mapped after upload", locked: true },
    { t: "Measurements", d: "Thirds · symmetry · width", locked: true },
    { t: "Feature Readings", d: more.metrics.map((m) => m.label).join(" · "), locked: true },
    { t: "Key Area", d: "Identified after analysis", locked: true },
    { t: "Improvement Plan", d: "Personalized after analysis", locked: true },
  ];

  return (
    <div
      className="mx-auto w-full overflow-hidden border"
      style={{
        borderColor: V.line,
        backgroundColor: V.surface,
        maxWidth: "94%",
        minHeight: "min(78vh, 820px)",
      }}
    >
      <div className="grid min-h-[700px] lg:grid-cols-[0.38fr_0.62fr]">
        <div
          className="relative min-h-[320px] border-b lg:min-h-[700px] lg:border-b-0 lg:border-r"
          style={{ borderColor: V.line, backgroundColor: V.darkSurface }}
        >
          <FacePhoto map="full" className="absolute inset-0 h-full w-full" />
          <div className="absolute bottom-5 left-5 right-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/70">Face Rating</p>
            <p className="mt-1 text-[32px] font-semibold tabular-nums text-white">
              — <span className="text-[14px] font-medium text-white/55">/ 10</span>
            </p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2">
          {modules.map((m) => (
            <div key={m.t} className="flex flex-col justify-between border-b p-6 sm:border-r" style={{ borderColor: V.line }}>
              <div>
                <p className="text-[13px] font-semibold" style={{ color: V.ink }}>
                  {m.t}
                </p>
                <p className="mt-2 text-[13px] leading-relaxed" style={{ color: V.muted }}>
                  {m.d}
                </p>
              </div>
              {m.locked ? (
                <p className="mt-6 text-[11px] uppercase tracking-[0.16em]" style={{ color: V.muted }}>
                  Locked
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DualResultExamples() {
  return <HarmonyRadar />;
}

export function PricingPreview() {
  const s = content.pricing;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="border p-6 sm:p-8" style={{ borderColor: V.line, backgroundColor: V.surface }}>
        <p className="text-[13px] font-medium" style={{ color: V.muted }}>
          {s.freeTitle}
        </p>
        <p className="mt-6 text-[11px] uppercase tracking-[0.16em]" style={{ color: V.muted }}>
          Open preview
        </p>
        <p className="mt-3 font-semibold tabular-nums" style={{ color: V.ink, fontSize: "2.5rem" }}>
          — / 100
        </p>
        <ul className="mt-8 space-y-4">
          {s.freeItems.map((item) => (
            <li key={item.title} className="border-t pt-4" style={{ borderColor: V.line }}>
              <h3 className="text-[16px] font-semibold" style={{ color: V.ink }}>
                {item.title}
              </h3>
              <p className="mt-1 text-[15px] leading-relaxed" style={{ color: V.muted }}>
                {item.body}
              </p>
            </li>
          ))}
        </ul>
        <Link href={s.freeCta.href} className={`${btnSecondary} mt-10`}>
          {s.freeCta.label}
        </Link>
      </div>
      <div className="border p-6 sm:p-8" style={{ borderColor: V.darkLine, backgroundColor: V.darkBg }}>
        <p className="text-[13px] font-medium" style={{ color: V.darkMuted }}>
          {s.paidTitle}
        </p>
        <p className="mt-2 font-semibold tabular-nums" style={{ color: V.darkInk, fontSize: "40px" }}>
          {s.price}
        </p>
        <p className="text-[13px]" style={{ color: V.darkMuted }}>
          {s.priceNote}
        </p>
        <ul className="mt-8 space-y-4">
          {s.paidItems.map((item) => (
            <li key={item.title} className="border-t pt-4" style={{ borderColor: V.darkLine }}>
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-[16px] font-semibold" style={{ color: V.darkInk }}>
                  {item.title}
                </h3>
                <span className="text-[10px] uppercase tracking-[0.14em]" style={{ color: V.darkMuted }}>
                  Locked
                </span>
              </div>
              <p className="mt-1 text-[15px] leading-relaxed" style={{ color: V.darkMuted }}>
                {item.body}
              </p>
            </li>
          ))}
        </ul>
        <Link href={s.paidCta.href} className={`${btnPrimary} mt-10`}>
          {s.paidCta.label}
        </Link>
      </div>
    </div>
  );
}
