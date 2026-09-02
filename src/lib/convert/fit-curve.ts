import type { CadCubic, CadPath, Vec2 } from "./geometry";

const MIN_ALPHA = 1e-3;

export function chaikin(points: Vec2[], closed: boolean, rounds = 2): Vec2[] {
  if (points.length < 3) return points.slice();
  let pts = points.map((p) => ({ ...p }));
  for (let r = 0; r < rounds; r++) {
    const next: Vec2[] = [];
    const n = pts.length;
    if (!closed) next.push({ ...pts[0] });
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p = pts[i];
      const q = pts[(i + 1) % n];
      next.push({
        x: p.x * 0.75 + q.x * 0.25,
        y: p.y * 0.75 + q.y * 0.25,
      });
      next.push({
        x: p.x * 0.25 + q.x * 0.75,
        y: p.y * 0.25 + q.y * 0.75,
      });
    }
    if (!closed) next.push({ ...pts[n - 1] });
    pts = next;
  }
  return pts;
}

/** Chaikin + Laplacian so skeleton staircases become fair curves. */
export function fairPolyline(points: Vec2[], closed: boolean): Vec2[] {
  if (points.length < 4) return points.slice();
  const rounds = points.length > 16 ? 2 : 1;
  const iters = points.length > 48 ? 16 : 10;
  return smoothPolyline(chaikin(points, closed, rounds), closed, iters);
}

export function smoothPolyline(points: Vec2[], closed: boolean, iterations = 8): Vec2[] {
  if (points.length < 4) return points.slice();
  let pts = points.map((p) => ({ ...p }));
  for (let k = 0; k < iterations; k++) {
    const next = pts.map((p) => ({ ...p }));
    const n = pts.length;
    const start = closed ? 0 : 1;
    const end = closed ? n : n - 1;
    for (let i = start; i < end; i++) {
      const prev = pts[(i - 1 + n) % n];
      const cur = pts[i];
      const nxt = pts[(i + 1) % n];
      next[i] = {
        x: cur.x * 0.5 + prev.x * 0.25 + nxt.x * 0.25,
        y: cur.y * 0.5 + prev.y * 0.25 + nxt.y * 0.25,
      };
    }
    pts = next;
  }
  return pts;
}

export function addFittedCubics(path: CadPath): CadPath {
  if (path.kind !== "curve" || path.points.length < 3) return path;
  const pts = path.closed ? closeRing(path.points) : path.points;
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  const maxErr = Math.min(3.8, Math.max(2.2, len / 85));
  const cubics = fitCubics(pts, maxErr);
  if (!cubics.length) return path;
  return { ...path, cubics };
}

export function bezierPoint(p0: Vec2, c: CadCubic, t: number): Vec2 {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const d = 3 * u * t * t;
  const e = t * t * t;
  return {
    x: a * p0.x + b * c.c1.x + d * c.c2.x + e * c.to.x,
    y: a * p0.y + b * c.c1.y + d * c.c2.y + e * c.to.y,
  };
}

export function sampleCubics(start: Vec2, cubics: CadCubic[], stepsPer = 10): Vec2[] {
  const out: Vec2[] = [{ ...start }];
  let p0 = start;
  for (const c of cubics) {
    for (let i = 1; i <= stepsPer; i++) {
      out.push(bezierPoint(p0, c, i / stepsPer));
    }
    p0 = c.to;
  }
  return out;
}

function closeRing(points: Vec2[]) {
  if (points.length < 2) return points.slice();
  const a = points[0];
  const b = points[points.length - 1];
  if (Math.hypot(a.x - b.x, a.y - b.y) < 0.6) return points.slice();
  return [...points, { ...a }];
}

function unit(v: Vec2): Vec2 {
  const len = Math.hypot(v.x, v.y);
  if (len < 1e-8) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

function tangentAt(points: Vec2[], index: number, toward: number): Vec2 {
  const i = Math.max(0, Math.min(points.length - 1, index));
  const j = Math.max(0, Math.min(points.length - 1, toward));
  if (i === j) {
    const n = toward >= index ? 1 : -1;
    const k = Math.max(0, Math.min(points.length - 1, i + n));
    return unit({ x: points[k].x - points[i].x, y: points[k].y - points[i].y });
  }
  return unit({ x: points[j].x - points[i].x, y: points[j].y - points[i].y });
}

function chordParams(points: Vec2[], a: number, b: number) {
  const u = [0];
  let total = 0;
  for (let i = a + 1; i <= b; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    u.push(total);
  }
  if (total < 1e-8) return u.map(() => 0);
  return u.map((v) => v / total);
}

function lineCubic(a: Vec2, b: Vec2): CadCubic {
  return {
    c1: { x: a.x + (b.x - a.x) / 3, y: a.y + (b.y - a.y) / 3 },
    c2: { x: a.x + ((b.x - a.x) * 2) / 3, y: a.y + ((b.y - a.y) * 2) / 3 },
    to: { ...b },
  };
}

function leastSquaresCubic(
  points: Vec2[],
  a: number,
  b: number,
  t1: Vec2,
  t2: Vec2
): CadCubic {
  const p0 = points[a];
  const p3 = points[b];
  const u = chordParams(points, a, b);
  let c11 = 0;
  let c12 = 0;
  let c22 = 0;
  let x1 = 0;
  let x2 = 0;
  for (let i = 0; i < u.length; i++) {
    const t = u[i];
    const omt = 1 - t;
    const b1 = 3 * omt * omt * t;
    const b2 = 3 * omt * t * t;
    const b0b1 = omt * omt * omt + b1;
    const b2b3 = b2 + t * t * t;
    const ax = b1 * t1.x;
    const ay = b1 * t1.y;
    const bx = -b2 * t2.x;
    const by = -b2 * t2.y;
    const dx = points[a + i].x - b0b1 * p0.x - b2b3 * p3.x;
    const dy = points[a + i].y - b0b1 * p0.y - b2b3 * p3.y;
    c11 += ax * ax + ay * ay;
    c12 += ax * bx + ay * by;
    c22 += bx * bx + by * by;
    x1 += ax * dx + ay * dy;
    x2 += bx * dx + by * dy;
  }
  const det = c11 * c22 - c12 * c12;
  let alpha1: number;
  let alpha2: number;
  if (Math.abs(det) < 1e-8) {
    const chord = Math.hypot(p3.x - p0.x, p3.y - p0.y) / 3;
    alpha1 = chord;
    alpha2 = chord;
  } else {
    alpha1 = (x1 * c22 - x2 * c12) / det;
    alpha2 = (c11 * x2 - c12 * x1) / det;
  }
  const chord = Math.hypot(p3.x - p0.x, p3.y - p0.y);
  const maxA = Math.max(chord, 8);
  alpha1 = Math.min(maxA, Math.max(MIN_ALPHA, alpha1));
  alpha2 = Math.min(maxA, Math.max(MIN_ALPHA, alpha2));
  return {
    c1: { x: p0.x + t1.x * alpha1, y: p0.y + t1.y * alpha1 },
    c2: { x: p3.x - t2.x * alpha2, y: p3.y - t2.y * alpha2 },
    to: { ...p3 },
  };
}

function cubicError(
  points: Vec2[],
  a: number,
  b: number,
  cubic: CadCubic
): { err: number; split: number } {
  const p0 = points[a];
  const u = chordParams(points, a, b);
  let err = -1;
  let split = Math.floor((a + b) / 2);
  for (let i = 1; i < u.length - 1; i++) {
    const q = bezierPoint(p0, cubic, u[i]);
    const d = Math.hypot(q.x - points[a + i].x, q.y - points[a + i].y);
    if (d > err) {
      err = d;
      split = a + i;
    }
  }
  return { err: Math.max(0, err), split };
}

function fitSpan(points: Vec2[], a: number, b: number, maxErr: number, depth: number): CadCubic[] {
  if (b <= a) return [];
  if (b - a === 1 || depth > 12) return [lineCubic(points[a], points[b])];
  const t1 = tangentAt(points, a, a + 1);
  const t2 = tangentAt(points, b, b - 1);
  // t2 should point in increasing-u (from previous toward end), tangentAt(b, b-1) points backward.
  const t2fwd = { x: -t2.x, y: -t2.y };
  const cubic = leastSquaresCubic(points, a, b, t1, t2fwd);
  const { err, split } = cubicError(points, a, b, cubic);
  if (err <= maxErr || split <= a || split >= b) return [cubic];
  return fitSpan(points, a, split, maxErr, depth + 1).concat(
    fitSpan(points, split, b, maxErr, depth + 1)
  );
}

function fitCubics(points: Vec2[], maxErr: number): CadCubic[] {
  if (points.length < 2) return [];
  if (points.length === 2) return [lineCubic(points[0], points[1])];
  return fitSpan(points, 0, points.length - 1, maxErr, 0);
}

/** Greedy circular-arc fit for DXF bulge polylines. Error is in the same units as points. */
export function fitBulgePolyline(
  points: Vec2[],
  closed: boolean,
  maxErr: number
): { x: number; y: number; bulge: number }[] {
  if (points.length < 2) return points.map((p) => ({ x: p.x, y: p.y, bulge: 0 }));
  const pts =
    closed && points.length > 2
      ? endKey(points[0]) === endKey(points[points.length - 1])
        ? points
        : [...points, points[0]]
      : points;
  const verts: { x: number; y: number; bulge: number }[] = [];
  let i = 0;
  while (i < pts.length - 1) {
    let j = i + 1;
    let bulge = 0;
    for (let k = i + 2; k < pts.length; k++) {
      const next = bulgeThrough(pts, i, k, maxErr);
      if (next === null) break;
      j = k;
      bulge = next;
    }
    verts.push({ x: pts[i].x, y: pts[i].y, bulge });
    i = j;
  }
  const last = pts[pts.length - 1];
  if (!verts.length || endKey(verts[verts.length - 1]) !== endKey(last)) {
    verts.push({ x: last.x, y: last.y, bulge: 0 });
  } else {
    verts[verts.length - 1].bulge = 0;
  }
  if (closed && verts.length > 2) verts.pop();
  return verts;
}

function endKey(p: { x: number; y: number }) {
  return `${Math.round(p.x * 100)},${Math.round(p.y * 100)}`;
}

function bulgeThrough(points: Vec2[], i: number, j: number, maxErr: number): number | null {
  const a = points[i];
  const c = points[j];
  const mid = points[Math.floor((i + j) / 2)];
  const bulge = bulgeFromThree(a, mid, c);
  if (bulge === null) return null;
  const circle = circleFromBulge(a, c, bulge);
  if (!circle) return Math.abs(bulge) < 1e-4 ? 0 : null;
  for (let k = i + 1; k < j; k++) {
    const d = Math.abs(Math.hypot(points[k].x - circle.cx, points[k].y - circle.cy) - circle.r);
    if (d > maxErr) return null;
  }
  return bulge;
}

function bulgeFromThree(a: Vec2, m: Vec2, b: Vec2): number | null {
  const ux = b.x - a.x;
  const uy = b.y - a.y;
  const chord = Math.hypot(ux, uy);
  if (chord < 1e-6) return null;
  const nx = -uy / chord;
  const ny = ux / chord;
  const mx = m.x - (a.x + b.x) / 2;
  const my = m.y - (a.y + b.y) / 2;
  const sagitta = mx * nx + my * ny;
  if (Math.abs(sagitta) < 1e-4) return 0;
  const sweep = 4 * Math.atan2(sagitta, chord / 2);
  if (Math.abs(sweep) > Math.PI * 1.6) return null;
  return Math.tan(sweep / 4);
}

function circleFromBulge(a: Vec2, b: Vec2, bulge: number) {
  if (Math.abs(bulge) < 1e-6) return null;
  const chord = Math.hypot(b.x - a.x, b.y - a.y);
  if (chord < 1e-6) return null;
  const sagitta = (bulge * chord) / 2;
  const radius = ((chord / 2) ** 2 + sagitta ** 2) / (2 * Math.abs(sagitta));
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const nx = -(b.y - a.y) / chord;
  const ny = (b.x - a.x) / chord;
  const sign = bulge >= 0 ? 1 : -1;
  const d = radius - Math.abs(sagitta);
  return { cx: mx + nx * d * sign, cy: my + ny * d * sign, r: radius };
}
