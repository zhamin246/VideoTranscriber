import type { VectorLineParams } from "./vectorline-params";

export type VtracerConfig = {
  clustering: "bw";
  hierarchical: "cutout";
  mode: "pixel" | "polygon" | "spline";
  filterSpeckle: number;
  cornerThreshold: number;
  lengthThreshold: number;
  spliceThreshold: number;
  pathPrecision: number;
};

/** Official VTracer B/W + cutout holes + POLYGON. */
export const OFFICIAL_VTRACER_BW_POLYGON: VtracerConfig = {
  clustering: "bw",
  hierarchical: "cutout",
  mode: "polygon",
  filterSpeckle: 0,
  cornerThreshold: 60,
  lengthThreshold: 4,
  spliceThreshold: 45,
  pathPrecision: 8,
};

/** Same knobs as https://www.visioncortex.org/vtracer/ for CAD export. */
export function vtracerConfigFromParams(
  _params?: Partial<VectorLineParams>
): VtracerConfig {
  return { ...OFFICIAL_VTRACER_BW_POLYGON };
}

export function longestEdgeMmFromParams(params?: Partial<VectorLineParams>) {
  if (params?.enableSize && params.physWidthMm && params.physWidthMm > 0) {
    return params.physWidthMm;
  }
  return 300;
}
