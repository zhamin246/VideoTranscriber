"use client";

import { useMemo } from "react";
import tessellation from "./data/face-mesh-tesselation.json";
import { FACE_OVAL, SYMMETRY_PAIRS } from "@/lib/face-rating/indices";

export type MeshMode =
  | "overlay"
  | "thirds"
  | "mesh"
  | "mesh-only"
  | "regions"
  | "photo";

export type LandmarkPoint = { x: number; y: number; z?: number };

export type SymmetryDeviation = {
  feature: string;
  leftPoint: { x: number; y: number };
  rightPoint: { x: number; y: number };
  deviationPercent: number;
};

type Props = {
  src: string;
  landmarks?: LandmarkPoint[];
  /** Image pixel size used when scoring (for mapping deviation points) */
  imageWidth?: number;
  imageHeight?: number;
  mode: MeshMode;
  accent: string;
  thirds?: { upper: number; middle: number; lower: number };
  deviations?: SymmetryDeviation[];
};

function colorForDeviation(pct: number): string {
  if (pct < 5) return "rgba(34, 197, 94, 0.85)";
  if (pct < 15) return "rgba(234, 179, 8, 0.85)";
  return "rgba(239, 68, 68, 0.85)";
}

/**
 * Analysis geometry panel — structure aligned with thefacereport free-result
 * mesh block (Overlay / Thirds / Full Mesh / Mesh Only / Regions).
 */
export default function ResultGeometry({
  src,
  landmarks,
  imageWidth = 1,
  imageHeight = 1,
  mode,
  accent,
  thirds,
  deviations,
}: Props) {
  const hasLm = Boolean(landmarks && landmarks.length >= 468);

  const yOf = (i: number) => (hasLm ? landmarks![i].y * 100 : 0);
  const xOf = (i: number) => (hasLm ? landmarks![i].x * 100 : 0);

  const browY = hasLm
    ? ((landmarks![105].y + landmarks![334].y) / 2) * 100
    : 33;
  const noseY = hasLm ? landmarks![2].y * 100 : 66;
  const foreheadY = hasLm ? landmarks![10].y * 100 : 12;
  const chinY = hasLm ? landmarks![152].y * 100 : 90;

  const meshLines = useMemo(() => {
    if (!hasLm) return [] as [number, number, number, number][];
    const edges = tessellation as number[][];
    const out: [number, number, number, number][] = [];
    // Subsample for performance (~1/3 of edges still reads as dense mesh)
    for (let i = 0; i < edges.length; i += 3) {
      const [a, b] = edges[i];
      const pa = landmarks![a];
      const pb = landmarks![b];
      if (!pa || !pb) continue;
      out.push([pa.x * 100, pa.y * 100, pb.x * 100, pb.y * 100]);
    }
    return out;
  }, [hasLm, landmarks]);

  const showPhoto = mode !== "mesh-only";
  const showMesh = mode === "mesh" || mode === "mesh-only" || mode === "overlay";
  const showThirds = mode === "thirds";
  const showRegions = mode === "regions";
  const showOverlay = mode === "overlay";

  return (
    <div className="space-y-3">
      <div
        className={`relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-2xl border border-[#e5e5e5] ${
          mode === "mesh-only" ? "bg-[#0a0a0a]" : "bg-[#0a0a0a]"
        }`}
      >
        {showPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt="Facial analysis geometry"
            className={`h-full w-full object-cover ${
              mode === "mesh" || mode === "overlay" ? "opacity-90" : ""
            }`}
          />
        ) : null}

        {hasLm ? (
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            {showMesh
              ? meshLines.map(([x1, y1, x2, y2], i) => (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={accent}
                    strokeWidth={mode === "mesh-only" ? 0.22 : 0.15}
                    strokeOpacity={mode === "mesh-only" ? 0.55 : 0.28}
                  />
                ))
              : null}

            {showMesh ? (
              <polyline
                points={FACE_OVAL.map((i) => `${xOf(i)},${yOf(i)}`).join(" ")}
                fill="none"
                stroke={accent}
                strokeWidth="0.4"
                strokeOpacity="0.75"
              />
            ) : null}

            {showThirds ? (
              <>
                <rect
                  x="10"
                  y={foreheadY}
                  width="80"
                  height={Math.max(0, browY - foreheadY)}
                  fill={accent}
                  fillOpacity="0.1"
                />
                <rect
                  x="10"
                  y={browY}
                  width="80"
                  height={Math.max(0, noseY - browY)}
                  fill={accent}
                  fillOpacity="0.16"
                />
                <rect
                  x="10"
                  y={noseY}
                  width="80"
                  height={Math.max(0, chinY - noseY)}
                  fill={accent}
                  fillOpacity="0.1"
                />
                {[browY, noseY].map((y) => (
                  <line
                    key={y}
                    x1="10"
                    x2="90"
                    y1={y}
                    y2={y}
                    stroke={accent}
                    strokeWidth="0.45"
                    strokeDasharray="1.5 1"
                    strokeOpacity="0.95"
                  />
                ))}
                {thirds ? (
                  <>
                    <text
                      x="12"
                      y={foreheadY + (browY - foreheadY) * 0.55}
                      fill={accent}
                      fontSize="2.8"
                      fontWeight="700"
                    >
                      Upper{" "}
                      {(thirds.upper > 0 && thirds.upper <= 1
                        ? thirds.upper * 100
                        : thirds.upper
                      ).toFixed(1)}
                      %
                    </text>
                    <text
                      x="12"
                      y={browY + (noseY - browY) * 0.55}
                      fill={accent}
                      fontSize="2.8"
                      fontWeight="700"
                    >
                      Middle{" "}
                      {(thirds.middle > 0 && thirds.middle <= 1
                        ? thirds.middle * 100
                        : thirds.middle
                      ).toFixed(1)}
                      %
                    </text>
                    <text
                      x="12"
                      y={noseY + (chinY - noseY) * 0.55}
                      fill={accent}
                      fontSize="2.8"
                      fontWeight="700"
                    >
                      Lower{" "}
                      {(thirds.lower > 0 && thirds.lower <= 1
                        ? thirds.lower * 100
                        : thirds.lower
                      ).toFixed(1)}
                      %
                    </text>
                  </>
                ) : null}
              </>
            ) : null}

            {showRegions ? (
              <>
                {/* Eyes */}
                <ellipse
                  cx={(xOf(33) + xOf(263)) / 2}
                  cy={(yOf(159) + yOf(386)) / 2}
                  rx={Math.abs(xOf(263) - xOf(33)) * 0.55}
                  ry={Math.abs(yOf(145) - yOf(159)) * 2.2}
                  fill={accent}
                  fillOpacity="0.12"
                  stroke={accent}
                  strokeWidth="0.35"
                />
                {/* Nose */}
                <ellipse
                  cx={xOf(1)}
                  cy={(yOf(6) + yOf(2)) / 2}
                  rx={Math.abs(xOf(358) - xOf(129)) * 0.55}
                  ry={Math.abs(yOf(2) - yOf(6)) * 0.7}
                  fill={accent}
                  fillOpacity="0.1"
                  stroke={accent}
                  strokeWidth="0.35"
                />
                {/* Mouth */}
                <ellipse
                  cx={(xOf(61) + xOf(291)) / 2}
                  cy={(yOf(0) + yOf(17)) / 2}
                  rx={Math.abs(xOf(291) - xOf(61)) * 0.55}
                  ry={Math.abs(yOf(17) - yOf(0)) * 1.1}
                  fill={accent}
                  fillOpacity="0.12"
                  stroke={accent}
                  strokeWidth="0.35"
                />
                {/* Jaw outline */}
                <polyline
                  points={[234, 172, 152, 397, 454]
                    .map((i) => `${xOf(i)},${yOf(i)}`)
                    .join(" ")}
                  fill="none"
                  stroke={accent}
                  strokeWidth="0.4"
                  strokeOpacity="0.8"
                />
              </>
            ) : null}

            {showOverlay && deviations && deviations.length > 0
              ? deviations.map((d, i) => {
                  // deviation points are in pixel space from scorer
                  const lx = (d.leftPoint.x / imageWidth) * 100;
                  const ly = (d.leftPoint.y / imageHeight) * 100;
                  const rx = (d.rightPoint.x / imageWidth) * 100;
                  const ry = (d.rightPoint.y / imageHeight) * 100;
                  const col = colorForDeviation(d.deviationPercent);
                  return (
                    <g key={i}>
                      <line
                        x1={lx}
                        y1={ly}
                        x2={rx}
                        y2={ry}
                        stroke={col}
                        strokeWidth="0.45"
                        strokeOpacity="0.9"
                      />
                      <circle cx={lx} cy={ly} r="0.7" fill={col} />
                      <circle cx={rx} cy={ry} r="0.7" fill={col} />
                    </g>
                  );
                })
              : null}

            {showOverlay && (!deviations || deviations.length === 0) && hasLm
              ? SYMMETRY_PAIRS.map((pair, i) => (
                  <line
                    key={i}
                    x1={xOf(pair.left)}
                    y1={yOf(pair.left)}
                    x2={xOf(pair.right)}
                    y2={yOf(pair.right)}
                    stroke={accent}
                    strokeWidth="0.35"
                    strokeOpacity="0.7"
                  />
                ))
              : null}
          </svg>
        ) : null}
      </div>

      <div className="mx-auto max-w-md text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-[#737373]">
          Analysis geometry
        </p>
        <p className="mt-1 text-sm font-bold text-[#0a0a0a]">
          {hasLm ? `${landmarks!.length} landmarks mapped` : "Landmarks unavailable"}
        </p>
        <p className="mt-1 text-sm text-[#525252]">
          The mesh shows detected facial structure. Colored connectors show symmetry residuals used
          alongside proportion measurements.
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-[#737373]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Low deviation
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" /> Moderate
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" /> High deviation
          </span>
        </div>
      </div>
    </div>
  );
}
