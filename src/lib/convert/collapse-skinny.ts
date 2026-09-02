import {
  collapseShortNoise,
  explodeOrthogonalRuns,
  mergeCollinearAxis,
  straightenOrthogonal,
} from "./centerline-cleanup";
import { sampleCubics } from "./fit-curve";
import type { CadPath, Vec2 } from "./geometry";

const MIN_LENGTH = 10;
const MIN_FILL_RATIO = 0.06;
const MIN_CHAIN_RATIO = 0.48;
const MAX_PAIR_CV = 0.78;
const MIN_HOLE_AREA_RATIO = 0.05;
const SPECKLE_PERI = 12;
const SPECKLE_AREA = 5;
const MIN_KEEP_HOLE_PERI = 28;
const MIN_KEEP_HOLE_AREA = 14;

type Ring = Vec2[];

function dist(a: Vec2, b: Vec2) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function mid(a: Vec2, b: Vec2): Vec2 {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function pathLen(points: Vec2[]) {
  let n = 0;
  for (let i = 1; i < points.length; i++) n += dist(points[i - 1], points[i]);
  return n;
}

function openRing(points: Vec2[]): Ring {
  if (points.length < 2) return points.map((p) => ({ ...p }));
  const pts = points.map((p) => ({ ...p }));
  if (dist(pts[0], pts[pts.length - 1]) < 0.6) pts.pop();
  return pts;
}

function flattenContour(points: Vec2[], cubics?: { c1: Vec2; c2: Vec2; to: Vec2 }[]) {
  if (!cubics?.length || !points[0]) return openRing(points);
  return openRing(sampleCubics(points[0], cubics, 8));
}

function shoelace(points: Ring) {
  const n = points.length;
  if (n < 3) return 0;
  let a = 0;
  for (let i = 0; i < n; i++) {
    const p = points[i];
    const q = points[(i + 1) % n];
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}

function areaAbs(points: Ring) {
  return Math.abs(shoelace(points));
}

function peri(points: Ring) {
  if (points.length < 2) return 0;
  return pathLen(points) + dist(points[0], points[points.length - 1]);
}

function convexHull(points: Ring) {
  const pts = points
    .slice()
    .sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
  if (pts.length < 3) return pts;
  const cross = (o: Vec2, a: Vec2, b: Vec2) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: Vec2[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }
  const upper: Vec2[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

function pointToSeg(p: Vec2, a: Vec2, b: Vec2) {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const len2 = vx * vx + vy * vy;
  if (len2 < 1e-8) return dist(p, a);
  let t = ((p.x - a.x) * vx + (p.y - a.y) * vy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * vx), p.y - (a.y + t * vy));
}

function pointToPoly(p: Vec2, poly: Vec2[], closed: boolean) {
  let best = Infinity;
  const n = poly.length;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % n];
    best = Math.min(best, pointToSeg(p, a, b));
  }
  return best;
}

function samplePolyline(points: Vec2[], n: number, closed: boolean) {
  const ring = closed ? [...points, points[0]] : points;
  const len = pathLen(ring);
  if (len < 1e-6) return points.slice(0, 1);
  const count = Math.max(2, n);
  const out: Vec2[] = [];
  for (let i = 0; i < count; i++) {
    const target = closed ? (len * i) / count : (len * i) / (count - 1);
    let acc = 0;
    for (let j = 1; j < ring.length; j++) {
      const a = ring[j - 1];
      const b = ring[j];
      const seg = dist(a, b);
      if (acc + seg >= target || j === ring.length - 1) {
        const t = seg < 1e-8 ? 0 : Math.min(1, (target - acc) / seg);
        out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
        break;
      }
      acc += seg;
    }
  }
  return out;
}

function averagePolylines(a: Vec2[], b: Vec2[], closed: boolean) {
  const n = Math.max(8, Math.min(80, Math.max(a.length, b.length)));
  const sa = samplePolyline(a, n, closed);
  let sb = samplePolyline(b, n, closed);
  if (!closed) {
    if (dist(sa[0], sb[0]) > dist(sa[0], sb[sb.length - 1])) sb = sb.slice().reverse();
    return sa.map((p, i) => ({ x: (p.x + sb[i].x) / 2, y: (p.y + sb[i].y) / 2 }));
  }
  let best = Infinity;
  let bestSb = sb;
  for (const cand of [sb, sb.slice().reverse()]) {
    for (let rot = 0; rot < cand.length; rot += Math.max(1, Math.floor(cand.length / 24))) {
      const rotated = cand.slice(rot).concat(cand.slice(0, rot));
      let s = 0;
      for (let i = 0; i < sa.length; i++) s += dist(sa[i], rotated[i]);
      if (s < best) {
        best = s;
        bestSb = rotated;
      }
    }
  }
  return sa.map((p, i) => ({ x: (p.x + bestSb[i].x) / 2, y: (p.y + bestSb[i].y) / 2 }));
}

function rdp(points: Vec2[], eps: number): Vec2[] {
  if (points.length <= 2) return points.map((p) => ({ ...p }));
  const first = points[0];
  const last = points[points.length - 1];
  let maxD = 0;
  let idx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = pointToSeg(points[i], first, last);
    if (d > maxD) {
      maxD = d;
      idx = i;
    }
  }
  if (maxD <= eps) return [{ ...first }, { ...last }];
  const left = rdp(points.slice(0, idx + 1), eps);
  const right = rdp(points.slice(idx), eps);
  return left.slice(0, -1).concat(right);
}

function rdpClosed(points: Ring, eps: number) {
  const open = rdp([...points, points[0]], eps);
  if (open.length >= 2 && dist(open[0], open[open.length - 1]) < eps * 2) open.pop();
  return open.length >= 3 ? open : points;
}

function farthestEnds(points: Ring): [number, number] {
  const n = points.length;
  let best = -1;
  let i0 = 0;
  let i1 = Math.min(1, n - 1);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = points[i].x - points[j].x;
      const dy = points[i].y - points[j].y;
      const d = dx * dx + dy * dy;
      if (d > best) {
        best = d;
        i0 = i;
        i1 = j;
      }
    }
  }
  return [i0, i1];
}

function walk(points: Ring, from: number, to: number) {
  const out: Vec2[] = [{ ...points[from] }];
  let i = from;
  const guard = points.length + 2;
  let n = 0;
  while (i !== to && n < guard) {
    i = (i + 1) % points.length;
    out.push({ ...points[i] });
    n++;
  }
  return out;
}

function walkIndices(n: number, from: number, to: number) {
  const out = [from];
  let i = from;
  let k = 0;
  while (i !== to && k < n + 2) {
    i = (i + 1) % n;
    out.push(i);
    k++;
  }
  return out;
}

function orientPair(a: Vec2[], b: Vec2[]): [Vec2[], Vec2[]] {
  if (dist(a[0], b[0]) > dist(a[0], b[b.length - 1])) return [a, b.slice().reverse()];
  return [a, b];
}

function cutPrefix(points: Vec2[], trim: number) {
  if (trim <= 0 || points.length < 2) return points;
  let acc = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const seg = dist(a, b);
    if (acc + seg >= trim) {
      const t = seg < 1e-8 ? 0 : (trim - acc) / seg;
      return [{ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }, ...points.slice(i)];
    }
    acc += seg;
  }
  return points.slice(-1);
}

function trimEnds(points: Vec2[], trim: number) {
  const total = pathLen(points);
  if (trim <= 0 || total < trim * 2 + MIN_LENGTH * 0.5) return points;
  const start = cutPrefix(points, trim);
  return cutPrefix(start.slice().reverse(), trim).reverse();
}

function pairStats(a: Vec2[], b: Vec2[]) {
  const sa = samplePolyline(a, 16, false);
  const dists = sa.map((p) => pointToPoly(p, b, false));
  const mean = dists.reduce((s, d) => s + d, 0) / Math.max(1, dists.length);
  const variance =
    dists.reduce((s, d) => s + (d - mean) * (d - mean), 0) / Math.max(1, dists.length);
  return {
    mean,
    max: Math.max(...dists),
    cv: mean < 1e-6 ? 0 : Math.sqrt(variance) / mean,
  };
}

function rdpEps(width: number) {
  return Math.min(2.4, Math.max(1.15, width * 0.45));
}

function cleanOpen(points: Vec2[], width: number) {
  const simplified = rdp(points, rdpEps(width));
  if (simplified.length < 2) return simplified;
  return straightenOrthogonal(simplified);
}

function cleanClosed(points: Ring, width: number) {
  const simplified = rdpClosed(points, rdpEps(width));
  if (simplified.length < 3) return points;
  return straightenOrthogonal(simplified);
}

function collapseRibbon(points: Ring, maxWidth: number): Vec2[] | null {
  if (points.length < 4) return null;
  const p = peri(points);
  const a = areaAbs(points);
  const width = p < 1e-6 ? 0 : (2 * a) / p;
  const length = p / 2 - width;
  if (width > maxWidth || length < MIN_LENGTH || length < width * 2.4) return null;
  const hull = convexHull(points);
  const hullArea = areaAbs(hull);
  const fillRatio = hullArea < 1e-6 ? 0 : a / hullArea;
  if (points.length > 16 && (hullArea < 1e-6 || fillRatio < MIN_FILL_RATIO)) return null;

  const [i0, i1] = farthestEnds(points);
  if (i0 === i1) return null;
  const chainA = walk(points, i0, i1);
  const chainB = walk(points, i1, i0);
  const la = pathLen(chainA);
  const lb = pathLen(chainB);
  const ratio = la / Math.max(1e-6, lb);
  if (ratio < MIN_CHAIN_RATIO || ratio > 1 / MIN_CHAIN_RATIO) return null;
  if (Math.min(la, lb) < MIN_LENGTH * 0.4) return null;

  const stats = pairStats(chainA, chainB);
  if (stats.mean > maxWidth * 1.45 || stats.max > maxWidth * 2.8 || stats.cv > MAX_PAIR_CV) {
    return null;
  }

  const [oa, ob] = orientPair(chainA, chainB);
  const trim = Math.min(stats.mean, Math.min(pathLen(oa), pathLen(ob)) * 0.12);
  const midLine = averagePolylines(trimEnds(oa, trim), trimEnds(ob, trim), false);
  const simplified = cleanOpen(midLine, width);
  if (simplified.length < 2 || pathLen(simplified) < MIN_LENGTH) return null;
  return simplified;
}

function collapseByOpposites(points: Ring, maxWidth: number): Vec2[] | null {
  const n = points.length;
  if (n < 4) return null;
  const p = peri(points);
  const a = areaAbs(points);
  const width = p < 1e-6 ? 0 : (2 * a) / p;
  const length = p / 2 - width;
  if (width > maxWidth || length < MIN_LENGTH) return null;

  const prefix = [0];
  for (let i = 1; i < n; i++) prefix.push(prefix[i - 1] + dist(points[i - 1], points[i]));
  const along = (i: number, j: number) => {
    if (j >= i) return prefix[j] - prefix[i];
    return p - prefix[i] + prefix[j];
  };
  const minAlong = Math.max(width * 2.2, p * 0.1);

  const [e0, e1] = farthestEnds(points);
  const idxA = walkIndices(n, e0, e1);
  const idxB = walkIndices(n, e1, e0);
  const bank = new Set(idxA.length >= idxB.length ? idxA : idxB);

  const hits: Vec2[] = [];
  const pairDists: number[] = [];
  for (const i of bank) {
    let bestJ = -1;
    let bestD = Infinity;
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      const dAlong = Math.min(along(i, j), along(j, i));
      if (dAlong < minAlong) continue;
      const d = dist(points[i], points[j]);
      if (d < bestD) {
        bestD = d;
        bestJ = j;
      }
    }
    if (bestJ < 0 || bestD > maxWidth * 1.7) continue;
    hits.push(mid(points[i], points[bestJ]));
    pairDists.push(bestD);
  }
  if (hits.length < 3) return null;
  const meanPair = pairDists.reduce((s, d) => s + d, 0) / pairDists.length;
  if (meanPair > maxWidth * 1.25) return null;

  const simplified = cleanOpen(rdp(hits, Math.min(1.6, rdpEps(width))), width);
  if (simplified.length < 2 || pathLen(simplified) < MIN_LENGTH) return null;
  return simplified;
}

function bbox(points: Ring) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY };
}

function holeInside(outer: Ring, hole: Ring) {
  const a = bbox(outer);
  const b = bbox(hole);
  return b.minX >= a.minX - 4 && b.minY >= a.minY - 4 && b.maxX <= a.maxX + 4 && b.maxY <= a.maxY + 4;
}

function collapseRing(outer: Ring, hole: Ring, maxWidth: number): Vec2[] | null {
  if (outer.length < 4 || hole.length < 4) return null;
  if (!holeInside(outer, hole)) return null;
  const outerA = areaAbs(outer);
  const holeA = areaAbs(hole);
  if (outerA < 1e-6 || holeA < MIN_KEEP_HOLE_AREA || holeA / outerA < MIN_HOLE_AREA_RATIO) return null;
  const ringA = Math.max(0, outerA - holeA);
  const width = (2 * ringA) / Math.max(1e-6, peri(outer) + peri(hole));
  if (width > maxWidth || width < 0.15) return null;
  const midLen = (peri(outer) + peri(hole)) / 2;
  if (midLen < MIN_LENGTH * 2) return null;
  const midLine = averagePolylines(outer, hole, true);
  const simplified = cleanClosed(midLine, width);
  if (simplified.length < 3) return null;
  return simplified;
}

function maxRibbonWidth(frame?: { width: number; height: number }) {
  const edge = Math.max(frame?.width || 0, frame?.height || 0);
  if (edge <= 0) return 14;
  return Math.max(10, Math.min(22, edge * 0.014));
}

function asCenterline(points: Vec2[], closed: boolean): CadPath {
  return {
    closed,
    kind: !closed && points.length === 2 ? "straight" : "curve",
    points,
    filled: false,
  };
}

function isSpeckle(path: CadPath) {
  const outer = flattenContour(path.points, path.cubics);
  const p = peri(outer);
  const a = areaAbs(outer);
  return p < SPECKLE_PERI || (a < SPECKLE_AREA && p < SPECKLE_PERI * 1.8);
}

function simplifyFilled(path: CadPath): CadPath {
  const outer = flattenContour(path.points, path.cubics);
  const p = peri(outer);
  const a = areaAbs(outer);
  const width = p < 1e-6 ? 1.5 : Math.min(8, (2 * a) / p);
  const points = cleanClosed(outer, width);
  const holes = path.holes
    ?.map((hole) => {
      const h = flattenContour(hole.points, hole.cubics);
      if (peri(h) < MIN_KEEP_HOLE_PERI || areaAbs(h) < MIN_KEEP_HOLE_AREA) return null;
      return {
        closed: true as const,
        points: cleanClosed(h, width),
      };
    })
    .filter((h): h is { closed: true; points: Vec2[] } => Boolean(h));
  return {
    ...path,
    points,
    cubics: undefined,
    holes: holes?.length ? holes : undefined,
    kind: "curve",
  };
}

function keepHoles(path: CadPath) {
  return (path.holes || [])
    .map((hole) => {
      const points = flattenContour(hole.points, hole.cubics);
      if (peri(points) < MIN_KEEP_HOLE_PERI || areaAbs(points) < MIN_KEEP_HOLE_AREA) return null;
      return { ...hole, points, cubics: undefined };
    })
    .filter((h): h is NonNullable<typeof h> => Boolean(h));
}

function collapseOne(path: CadPath, maxWidth: number): CadPath[] {
  if (!path.filled && !path.closed) return [path];
  const holes = keepHoles(path);
  const withHoles = { ...path, holes: holes.length ? holes : undefined };
  if (holes.length >= 2) return [simplifyFilled(withHoles)];
  const outer = flattenContour(path.points, path.cubics);
  if (holes.length === 1) {
    const hole = flattenContour(holes[0].points, holes[0].cubics);
    const ring = collapseRing(outer, hole, maxWidth);
    if (ring) return [asCenterline(ring, true)];
    return [simplifyFilled(withHoles)];
  }
  const ribbon = collapseRibbon(outer, maxWidth) || collapseByOpposites(outer, maxWidth);
  if (ribbon) return [asCenterline(ribbon, false)];
  return [simplifyFilled(withHoles)];
}

function finalizeOpen(paths: CadPath[]): CadPath[] {
  const strokes = paths.map((p) => ({ points: p.points, closed: p.closed }));
  const exploded = explodeOrthogonalRuns(strokes);
  const merged = mergeCollinearAxis(exploded, { offset: 2.2, gap: 12 });
  const cleaned = collapseShortNoise(merged, 2.4);
  return cleaned
    .filter((p) => p.points.length >= 2 && pathLen(p.points) >= 2.4)
    .map((p) => asCenterline(p.points, p.closed));
}

/**
 * VTracer traces ink as filled outlines. Thin sausages/rings become
 * centerlines; leftover filled outlines are simplified. Open H/V runs
 * are snapped and collinear fragments merged.
 */
export function collapseSkinnyFilledPaths(
  paths: CadPath[],
  frame?: { width: number; height: number }
): CadPath[] {
  const maxWidth = maxRibbonWidth(frame);
  const collapsed: CadPath[] = [];
  for (const path of paths) {
    if (isSpeckle(path)) continue;
    collapsed.push(...collapseOne(path, maxWidth));
  }
  const open = collapsed.filter((p) => !p.filled);
  const filled = collapsed.filter((p) => p.filled);
  return [...filled, ...finalizeOpen(open)];
}
