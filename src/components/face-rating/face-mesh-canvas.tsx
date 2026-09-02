"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import landmarksData from "./data/hero-landmarks.json";
import tessellation from "./data/face-mesh-tesselation.json";

/** MediaPipe-style landmark named indices (same map as thefacereport). */
const L = {
  LEFT_EYE: { inner: 133, outer: 33, top: 159, bottom: 145, center: 468 },
  RIGHT_EYE: { inner: 362, outer: 263, top: 386, bottom: 374, center: 473 },
  JAW: {
    leftCheekbone: 234,
    rightCheekbone: 454,
    leftJaw: 172,
    rightJaw: 397,
    chin: 152,
  },
  MIDLINE: { foreheadTop: 10, chinBottom: 152 },
  MOUTH: { upperLipTop: 0 },
} as const;

export type HeroMetric = {
  id: string;
  label: string;
  value: string;
  unit: string;
  hint: string;
  /** Resolve measurement segments from projected pixel points */
  lines: (px: { x: number; y: number }[]) => { x1: number; y1: number; x2: number; y2: number }[];
};

export const HERO_METRICS: HeroMetric[] = [
  {
    id: "eye-spacing",
    label: "EYE SPACING",
    value: "1.02×",
    unit: "ideal range",
    hint: "Interocular distance relative to face width",
    lines: (p) => {
      const a = p[L.LEFT_EYE.center] ?? p[L.LEFT_EYE.outer];
      const b = p[L.RIGHT_EYE.center] ?? p[L.RIGHT_EYE.outer];
      return [{ x1: a.x, y1: a.y, x2: b.x, y2: b.y }];
    },
  },
  {
    id: "fwhr",
    label: "FACIAL WIDTH-TO-HEIGHT",
    value: "1.89:1",
    unit: "measured ratio",
    hint: "Cheekbone width compared with midface height",
    lines: (p) => {
      const left = p[L.JAW.leftCheekbone];
      const right = p[L.JAW.rightCheekbone];
      const eyeY = (p[L.LEFT_EYE.top].y + p[L.RIGHT_EYE.top].y) / 2;
      const midX = (left.x + right.x) / 2;
      const lip = p[L.MOUTH.upperLipTop];
      return [
        { x1: left.x, y1: left.y, x2: right.x, y2: right.y },
        { x1: midX, y1: eyeY, x2: midX, y2: lip.y },
      ];
    },
  },
  {
    id: "mandible-width",
    label: "JAW PROPORTION",
    value: "0.90:1",
    unit: "measured ratio",
    hint: "Jaw width compared with cheekbone width",
    lines: (p) => {
      const jl = p[L.JAW.leftJaw];
      const jr = p[L.JAW.rightJaw];
      const cl = p[L.JAW.leftCheekbone];
      const cr = p[L.JAW.rightCheekbone];
      return [
        { x1: cl.x, y1: cl.y, x2: cr.x, y2: cr.y },
        { x1: jl.x, y1: jl.y, x2: jr.x, y2: jr.y },
      ];
    },
  },
];

type MotionState = {
  meshRevealProgress: number;
  meshOpacityScale: number;
  scanProgress: number | null;
  measurementProgress: number;
  phase: "align" | "scan" | "measure" | "complete";
  metricIndex: number;
  mappedPoints: number;
};

const LOOP_MS = 8800;
const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

function computeMotion(elapsed: number, metricCount: number): MotionState {
  const e = ((elapsed % LOOP_MS) + LOOP_MS) % LOOP_MS;
  const metricDur = 4200 / metricCount;

  // scan: 250 → 2050
  const scanning = e >= 250 && e < 2050;
  const scanT = scanning ? clamp01((e - 250) / 1800) : e >= 2050 ? 1 : 0;
  const meshReveal = e < 250 ? 0 : e < 2050 ? 0.12 + 0.82 * easeInOut(scanT) : 1;

  // measure: 2400 → 6600
  const measuring = e >= 2400 && e < 6600;
  const metricIndex = measuring
    ? Math.min(metricCount - 1, Math.floor((e - 2400) / metricDur))
    : -1;
  const x = measuring ? ((e - 2400) % metricDur) / metricDur : 0;
  const measurementProgress =
    easeInOut(clamp01(x / 0.22)) * (1 - easeInOut(clamp01((x - 0.9) / 0.1)));

  const complete = e >= 6600;
  const fade = e >= 8350 ? 1 - easeInOut(clamp01((e - 8350) / 450)) : 1;

  const meshOpacityScale =
    (scanning ? 1 : measuring ? 0.38 : complete ? 0.72 : 0.55) * fade;

  const mappedPoints = scanning
    ? Math.round(landmarksData.points.length * easeInOut(scanT))
    : e < 250
      ? 0
      : landmarksData.points.length;

  const phase: MotionState["phase"] = scanning
    ? "scan"
    : measuring
      ? "measure"
      : complete
        ? "complete"
        : "align";

  return {
    meshRevealProgress: meshReveal,
    meshOpacityScale,
    scanProgress: scanning ? easeInOut(scanT) : null,
    measurementProgress,
    phase,
    metricIndex,
    mappedPoints,
  };
}

function projectPoints(
  width: number,
  height: number
): { x: number; y: number; z: number }[] {
  // Landmarks are normalized to the source image (800×800). Canvas is square cover.
  return landmarksData.points.map((p) => ({
    x: p.x * width,
    y: p.y * height,
    z: p.z,
  }));
}

export type FaceMeshCanvasProps = {
  className?: string;
  /** Called when active metric / phase changes (for footer UI) */
  onMotionChange?: (state: {
    metric: HeroMetric | null;
    metricIndex: number;
    mappedPoints: number;
    phase: MotionState["phase"];
    totalPoints: number;
  }) => void;
  /** Imperatively jump to a metric (footer dots) */
  /** Mutable so the parent can call seek without re-binding the canvas effect. */
  seekMetricRef?: MutableRefObject<((index: number) => void) | null>;
};

/**
 * Static photo + Canvas 2D face-mesh overlay with rAF animation.
 * Mirrors thefacereport.com hero technique (precomputed 478 landmarks).
 */
export default function FaceMeshCanvas({
  className,
  onMotionChange,
  seekMetricRef,
}: FaceMeshCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const motionTimeRef = useRef(0);
  const loopStartRef = useRef(0);
  const offsetRef = useRef(0);
  const visibleRef = useRef(true);
  const reducedMotionRef = useRef(false);
  const onMotionChangeRef = useRef(onMotionChange);
  onMotionChangeRef.current = onMotionChange;

  const [ready, setReady] = useState(false);

  const seekMetric = useCallback((index: number) => {
    const metricDur = 4200 / HERO_METRICS.length;
    // jump into measure phase at 24% through that metric
    const t = 2400 + metricDur * (index + 0.24);
    motionTimeRef.current = t;
    offsetRef.current = t;
    loopStartRef.current = performance.now();
  }, []);

  useEffect(() => {
    if (seekMetricRef) seekMetricRef.current = seekMetric;
  }, [seekMetric, seekMetricRef]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      reducedMotionRef.current = mq.matches;
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.08 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let lastMetric = -2;
    let lastPhase = "";
    let lastMapped = -1;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = wrap.getBoundingClientRect();
      const cssW = Math.max(1, Math.round(rect.width));
      const cssH = Math.max(1, Math.round(rect.height));
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const edges = tessellation as [number, number][];
    const total = landmarksData.points.length;

    const draw = (now: number) => {
      if (!visibleRef.current && !reducedMotionRef.current) {
        raf = requestAnimationFrame(draw);
        return;
      }

      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;

      let elapsed: number;
      if (reducedMotionRef.current) {
        // freeze mid-measure first metric
        elapsed = 2400 + 0.5 * (4200 / HERO_METRICS.length);
      } else {
        elapsed =
          (offsetRef.current + (now - loopStartRef.current)) % LOOP_MS;
        motionTimeRef.current = elapsed;
      }

      const motion = computeMotion(elapsed, HERO_METRICS.length);
      const pts = projectPoints(cssW, cssH);

      // clear
      ctx.clearRect(0, 0, cssW, cssH);

      const reveal = motion.meshRevealProgress;
      const opacity = motion.meshOpacityScale;
      const maxIdx = Math.max(
        0,
        Math.min(total, Math.floor(total * reveal) || motion.mappedPoints)
      );

      // mesh color — brand rose (#FB7185 / #E11D48)
      const edgeAlpha = 0.62 * opacity;
      const vertAlpha = 0.92 * opacity;

      // draw tessellation edges (only when both endpoints revealed)
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = `rgba(251, 113, 133, ${edgeAlpha})`;
      ctx.lineWidth = Math.max(0.7, cssW * 0.00135);

      ctx.beginPath();
      for (let i = 0; i < edges.length; i++) {
        const [a, b] = edges[i];
        if (a >= maxIdx || b >= maxIdx) continue;
        const pa = pts[a];
        const pb = pts[b];
        if (!pa || !pb) continue;
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
      }
      ctx.stroke();

      // vertices
      if (reveal > 0.05) {
        const r = Math.max(0.9, cssW * 0.0022);
        ctx.fillStyle = `rgba(225, 29, 72, ${vertAlpha})`;
        for (let i = 0; i < maxIdx; i++) {
          const p = pts[i];
          if (!p) continue;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // scan sweep line
      if (motion.scanProgress != null) {
        const y = cssH * motion.scanProgress;
        const grad = ctx.createLinearGradient(0, y - 18, 0, y + 18);
        grad.addColorStop(0, "rgba(251, 113, 133,0)");
        grad.addColorStop(0.5, "rgba(251, 113, 133,0.4)");
        grad.addColorStop(1, "rgba(251, 113, 133,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, y - 18, cssW, 36);
      }

      // measurement lines
      if (motion.metricIndex >= 0 && motion.measurementProgress > 0.02) {
        const metric = HERO_METRICS[motion.metricIndex];
        const segs = metric.lines(pts);
        const mp = motion.measurementProgress;
        ctx.strokeStyle = `rgba(255,255,255,${0.92 * mp})`;
        ctx.lineWidth = Math.max(1.6, cssW * 0.0032);
        ctx.fillStyle = `rgba(255,255,255,${0.95 * mp})`;

        for (const seg of segs) {
          const dx = seg.x2 - seg.x1;
          const dy = seg.y2 - seg.y1;
          const x2 = seg.x1 + dx * mp;
          const y2 = seg.y1 + dy * mp;
          ctx.beginPath();
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();

          // endpoints
          const er = Math.max(3.2, cssW * 0.007);
          for (const [ex, ey] of [
            [seg.x1, seg.y1],
            [x2, y2],
          ] as const) {
            ctx.beginPath();
            ctx.arc(ex, ey, er, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.fillStyle = `rgba(159, 18, 57,${0.85 * mp})`;
            ctx.arc(ex, ey, er * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = `rgba(255,255,255,${0.95 * mp})`;
          }
        }
      }

      // notify UI when state changes
      if (
        motion.metricIndex !== lastMetric ||
        motion.phase !== lastPhase ||
        motion.mappedPoints !== lastMapped
      ) {
        lastMetric = motion.metricIndex;
        lastPhase = motion.phase;
        lastMapped = motion.mappedPoints;
        onMotionChangeRef.current?.({
          metric:
            motion.metricIndex >= 0 ? HERO_METRICS[motion.metricIndex] : null,
          metricIndex: motion.metricIndex,
          mappedPoints: motion.mappedPoints,
          phase: motion.phase,
          totalPoints: total,
        });
      }

      raf = requestAnimationFrame(draw);
    };

    loopStartRef.current = performance.now();
    offsetRef.current = 0;
    setReady(true);
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={wrapRef} className={`relative overflow-hidden ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/face-rating/hero-face.webp"
        alt="Sample face with 478 detected landmarks and live facial measurement lines"
        className="absolute inset-0 h-full w-full object-cover object-center"
        draggable={false}
      />
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden
        data-ready={ready ? "1" : "0"}
      />
    </div>
  );
}
