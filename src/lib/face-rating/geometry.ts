import type { LandmarkSet, Point3 } from "./indices";

export type Point2 = { x: number; y: number };

export type FittedLine = {
  origin: Point2;
  /** Unit direction of the principal axis (oriented with positive y when possible). */
  direction: Point2;
};

export function distance(a: Point2, b: Point2): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function midpoint(a: Point2, b: Point2): Point2 {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** Pixel coords from normalized landmark. */
export function getPoint(set: LandmarkSet, index: number): Point2 {
  const p = set.points[index];
  if (!p) throw new Error(`Missing landmark ${index}`);
  return { x: p.x * set.imageWidth, y: p.y * set.imageHeight };
}

/** PCA-style line fit through points (principal axis). */
export function fitLine(points: Point2[]): FittedLine {
  const n = points.length;
  const ox = points.reduce((s, p) => s + p.x, 0) / n;
  const oy = points.reduce((s, p) => s + p.y, 0) / n;
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (const p of points) {
    const dx = p.x - ox;
    const dy = p.y - oy;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }
  const angle = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  // Prefer direction with non-negative y (face down in image coords)
  const sign = sin >= 0 ? 1 : -1;
  return {
    origin: { x: ox, y: oy },
    direction: { x: cos * sign, y: sin * sign },
  };
}

/** Signed perpendicular distance from point to fitted line. */
export function perpendicularDistance(p: Point2, line: FittedLine): number {
  const dx = p.x - line.origin.x;
  const dy = p.y - line.origin.y;
  return dx * line.direction.y - dy * line.direction.x;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/** Safe index into landmarks (iris centers may be missing on 468-only meshes). */
export function getPointOptional(
  set: LandmarkSet,
  index: number,
  fallback?: number
): Point2 | null {
  const p = set.points[index] ?? (fallback != null ? set.points[fallback] : undefined);
  if (!p) return null;
  return { x: p.x * set.imageWidth, y: p.y * set.imageHeight };
}

export function toNormalized(points: Point3[]): Point3[] {
  return points.map((p) => ({
    x: p.x,
    y: p.y,
    z: p.z ?? 0,
  }));
}
