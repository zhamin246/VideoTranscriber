export type Vec2 = { x: number; y: number };

export type CadCubic = {
  c1: Vec2;
  c2: Vec2;
  to: Vec2;
};

export type CadPath = {
  closed: boolean;
  kind: "straight" | "curve";
  points: Vec2[];
  /** Cubic Beziers starting from points[0]. Present on smoothed curve paths. */
  cubics?: CadCubic[];
  /** True when this path is a filled ink region (Potrace/VTracer outlines). */
  filled?: boolean;
  /** SVG/PDF fill for stacked VTracer color layers (`#rrggbb`). */
  fill?: string;
  /** Inner contours for even-odd holes. */
  holes?: Array<{
    closed: boolean;
    points: Vec2[];
    cubics?: CadCubic[];
  }>;
};

export type CadGeometry = {
  version: 1;
  units: "mm";
  /** Sheet size including margin, millimetres, origin bottom-left, Y-up. */
  width: number;
  height: number;
  margin: number;
  contentWidth: number;
  contentHeight: number;
  layer: string;
  paths: CadPath[];
  /** Raw SVG in pixel space (Y-down). SVG download uses this as-is. */
  sourceSvg?: string;
  /** Raw DXF from the browser VectorLine trace. DXF download uses this as-is. */
  sourceDxf?: string;
};

export const CAD_LAYER = "LINEWORK";
export const CAD_LONGEST_EDGE_MM = 300;
export const CAD_MARGIN_MM = 5;
export const CAD_STROKE_MM = 0.15;

export type ConvertExportFormat = "dxf" | "svg" | "pdf" | "geometry";

export function isCadGeometry(value: unknown): value is CadGeometry {
  if (!value || typeof value !== "object") return false;
  const g = value as CadGeometry;
  return g.version === 1 && g.units === "mm" && Array.isArray(g.paths);
}

export function pathCount(geometry: CadGeometry) {
  return geometry.paths.length;
}

export function pointCount(geometry: CadGeometry) {
  return geometry.paths.reduce((n, p) => n + p.points.length, 0);
}

export function sanitizeCadFilename(name: string, ext: string) {
  const base = name.replace(/[^\w.\-]+/g, "_").replace(/^_+|_+$/g, "") || "drawing";
  const cleanExt = ext.replace(/^\./, "").toLowerCase();
  return `${base.slice(0, 80)}.${cleanExt}`;
}
