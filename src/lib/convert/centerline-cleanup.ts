import type { Vec2 } from "./geometry";

export type Stroke = { points: Vec2[]; closed: boolean };

function copyPts(points: Vec2[]) {
  return points.map((p) => ({ x: p.x, y: p.y }));
}

function pathLen(points: Vec2[]) {
  let n = 0;
  for (let i = 1; i < points.length; i++) {
    n += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return n;
}

function median(values: number[]) {
  if (!values.length) return 0;
  const s = values.slice().sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

function meanAbsDev(values: number[], center: number) {
  if (!values.length) return 0;
  let s = 0;
  for (const v of values) s += Math.abs(v - center);
  return s / values.length;
}

function bbox(points: Vec2[]) {
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
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

function outgoingDir(points: Vec2[], atStart: boolean): Vec2 {
  if (points.length < 2) return { x: 0, y: 0 };
  const a = atStart ? points[0] : points[points.length - 1];
  const b = atStart ? points[1] : points[points.length - 2];
  const x = b.x - a.x;
  const y = b.y - a.y;
  const len = Math.hypot(x, y) || 1;
  return { x: x / len, y: y / len };
}

function pointAlong(points: Vec2[], start: number, signed: number): Vec2 {
  const dir = signed < 0 ? -1 : 1;
  let left = Math.abs(signed);
  let i = start;
  while (left > 1e-6) {
    const ni = i + dir;
    if (ni < 0 || ni >= points.length) return points[i];
    const step = Math.hypot(points[ni].x - points[i].x, points[ni].y - points[i].y);
    if (step >= left || step < 1e-8) {
      const t = step < 1e-8 ? 0 : left / step;
      return {
        x: points[i].x + (points[ni].x - points[i].x) * t,
        y: points[i].y + (points[ni].y - points[i].y) * t,
      };
    }
    left -= step;
    i = ni;
  }
  return points[i];
}

function snapMostlyAxis(points: Vec2[], maxDev: number): Vec2[] {
  if (points.length < 2) return points;
  const { w, h } = bbox(points);
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const mx = median(xs);
  const my = median(ys);
  const allow = pathLen(points) > 40 ? Math.max(maxDev, 3.4) : maxDev;
  if (w >= Math.max(6, h * 2.1) && meanAbsDev(ys, my) <= allow) {
    return points.map((p) => ({ x: p.x, y: my }));
  }
  if (h >= Math.max(6, w * 2.1) && meanAbsDev(xs, mx) <= allow) {
    return points.map((p) => ({ x: mx, y: p.y }));
  }
  if (h <= 2.2 && w >= h * 3) return points.map((p) => ({ x: p.x, y: my }));
  if (w <= 2.2 && h >= w * 3) return points.map((p) => ({ x: mx, y: p.y }));
  return points;
}

function splitAtSmoothedCorners(points: Vec2[]) {
  if (points.length < 4) return [points];
  const corners = new Set<number>();
  for (let i = 1; i < points.length - 1; i++) {
    const back = pointAlong(points, i, -7);
    const fwd = pointAlong(points, i, 7);
    const ix = points[i].x - back.x;
    const iy = points[i].y - back.y;
    const ox = fwd.x - points[i].x;
    const oy = fwd.y - points[i].y;
    const il = Math.hypot(ix, iy) || 1;
    const ol = Math.hypot(ox, oy) || 1;
    if (il < 3.5 || ol < 3.5) continue;
    if (ix / il * (ox / ol) + iy / il * (oy / ol) < 0.45) corners.add(i);
  }
  if (!corners.size) return [points];
  const pieces: Vec2[][] = [];
  let start = 0;
  for (let i = 1; i < points.length - 1; i++) {
    if (!corners.has(i)) continue;
    pieces.push(points.slice(start, i + 1));
    start = i;
  }
  pieces.push(points.slice(start));
  return pieces.filter((p) => p.length >= 2);
}

/** Pull long H/V runs onto one coordinate. Leaves real corners and diagonals alone. */
export function straightenOrthogonal(points: Vec2[]): Vec2[] {
  const pts = copyPts(points);
  if (pts.length < 2) return pts;
  const pieces = splitAtSmoothedCorners(pts).map((piece) => snapMostlyAxis(piece, 2.8));
  if (pieces.length === 1) return snapMostlyAxis(pieces[0], 2.8);
  const joined = copyPts(pieces[0]);
  for (let i = 1; i < pieces.length; i++) {
    const next = pieces[i];
    const last = joined[joined.length - 1];
    const first = next[0];
    last.x = (last.x + first.x) / 2;
    last.y = (last.y + first.y) / 2;
    for (let j = 1; j < next.length; j++) joined.push({ x: next[j].x, y: next[j].y });
  }
  return joined;
}

/** Turn L / U polylines into separate H and V strokes so collinear merge can run. */
export function explodeOrthogonalRuns(paths: Stroke[]): Stroke[] {
  const out: Stroke[] = [];
  for (const path of paths) {
    if (path.closed) {
      out.push({ closed: true, points: straightenOrthogonal(path.points) });
      continue;
    }
    const pieces = splitAtSmoothedCorners(copyPts(path.points));
    if (pieces.length <= 1) {
      out.push({ closed: false, points: snapMostlyAxis(pieces[0] || path.points, 2.8) });
      continue;
    }
    for (const piece of pieces) {
      if (piece.length < 2 || pathLen(piece) < 2.2) continue;
      out.push({ closed: false, points: snapMostlyAxis(piece, 2.8) });
    }
  }
  return out;
}

function axisMeta(points: Vec2[]) {
  const { w, h, minX, maxX, minY, maxY } = bbox(points);
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const mx = median(xs);
  const my = median(ys);
  if (w >= 5 && (h <= 3.2 || (w >= h * 4 && meanAbsDev(ys, my) <= 2.2))) {
    return { axis: "h" as const, c: my, t0: minX, t1: maxX, len: w };
  }
  if (h >= 5 && (w <= 3.2 || (h >= w * 4 && meanAbsDev(xs, mx) <= 2.2))) {
    return { axis: "v" as const, c: mx, t0: minY, t1: maxY, len: h };
  }
  return null;
}

function rangeGap(a0: number, a1: number, b0: number, b1: number) {
  if (a1 < b0) return b0 - a1;
  if (b1 < a0) return a0 - b1;
  return 0;
}

/** Join broken collinear H/V fragments that already sit on the same line. */
export function mergeCollinearAxis(
  paths: Stroke[],
  opts?: { offset?: number; gap?: number }
): Stroke[] {
  const offset = opts?.offset ?? 2.4;
  const maxGap = opts?.gap ?? 8;
  const n = paths.length;
  const meta = paths.map((p) => (p.closed ? null : axisMeta(p.points)));
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (i: number): number => {
    if (parent[i] !== i) parent[i] = find(parent[i]);
    return parent[i];
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[rb] = ra;
  };

  for (let i = 0; i < n; i++) {
    const a = meta[i];
    if (!a) continue;
    for (let j = i + 1; j < n; j++) {
      const b = meta[j];
      if (!b || a.axis !== b.axis) continue;
      if (Math.abs(a.c - b.c) > offset) continue;
      if (rangeGap(a.t0, a.t1, b.t0, b.t1) > maxGap) continue;
      union(i, j);
    }
  }

  const groups = new Map<number, number[]>();
  const leftover: Stroke[] = [];
  for (let i = 0; i < n; i++) {
    if (!meta[i]) {
      leftover.push(paths[i]);
      continue;
    }
    const r = find(i);
    const list = groups.get(r);
    if (list) list.push(i);
    else groups.set(r, [i]);
  }

  const merged: Stroke[] = [];
  for (const idxs of groups.values()) {
    if (idxs.length === 1) {
      merged.push(paths[idxs[0]]);
      continue;
    }
    const first = meta[idxs[0]]!;
    let cSum = 0;
    let wSum = 0;
    let t0 = Infinity;
    let t1 = -Infinity;
    for (const i of idxs) {
      const m = meta[i]!;
      cSum += m.c * m.len;
      wSum += m.len;
      t0 = Math.min(t0, m.t0);
      t1 = Math.max(t1, m.t1);
    }
    const c = wSum > 0 ? cSum / wSum : first.c;
    merged.push({
      closed: false,
      points:
        first.axis === "h"
          ? [
              { x: t0, y: c },
              { x: t1, y: c },
            ]
          : [
              { x: c, y: t0 },
              { x: c, y: t1 },
            ],
    });
  }
  return merged.concat(leftover);
}

function continueJoin(a: Vec2[], aStart: boolean, b: Vec2[], bStart: boolean, maxDist: number) {
  const ap = a.slice();
  const bp = b.slice();
  if (aStart) ap.reverse();
  if (!bStart) bp.reverse();
  const from = ap[ap.length - 1];
  const to = bp[0];
  const gapx = to.x - from.x;
  const gapy = to.y - from.y;
  const dist = Math.hypot(gapx, gapy);
  if (dist < 0.15 || dist > maxDist) return null;
  const da = outgoingDir(ap, false);
  const db = outgoingDir(bp, true);
  const glen = dist || 1;
  const gx = gapx / glen;
  const gy = gapy / glen;
  if (-da.x * gx + -da.y * gy < 0.72) return null;
  if (db.x * gx + db.y * gy < 0.72) return null;
  if (-da.x * db.x + -da.y * db.y < 0.72) return null;
  const joined = dist < 0.8 ? ap.concat(bp.slice(1)) : ap.concat(bp);
  const chord = Math.hypot(
    joined[joined.length - 1].x - joined[0].x,
    joined[joined.length - 1].y - joined[0].y
  );
  if (pathLen(joined) > chord * 1.22 + 2) return null;
  return joined;
}

/** End-to-end join only when both strokes already aim at each other. */
export function stitchAlignedEnds(paths: Stroke[], maxDist: number): Stroke[] {
  type Item = { points: Vec2[]; closed: boolean; dead: boolean };
  const items: Item[] = paths.map((p) => ({
    points: copyPts(p.points),
    closed: p.closed,
    dead: false,
  }));
  const cell = Math.max(1, maxDist);
  const keyOf = (x: number, y: number) => `${Math.floor(x / cell)},${Math.floor(y / cell)}`;

  let guard = 0;
  let changed = true;
  while (changed && guard < 1200) {
    guard++;
    changed = false;
    const buckets = new Map<string, Array<{ item: Item; start: boolean }>>();
    const addEnd = (item: Item, start: boolean) => {
      const p = start ? item.points[0] : item.points[item.points.length - 1];
      const k = keyOf(p.x, p.y);
      const list = buckets.get(k);
      if (list) list.push({ item, start });
      else buckets.set(k, [{ item, start }]);
    };
    for (const item of items) {
      if (item.dead || item.closed || item.points.length < 2) continue;
      addEnd(item, true);
      addEnd(item, false);
    }

    outer: for (const item of items) {
      if (item.dead || item.closed || item.points.length < 2) continue;
      for (const aStart of [true, false]) {
        const p = aStart ? item.points[0] : item.points[item.points.length - 1];
        const cx = Math.floor(p.x / cell);
        const cy = Math.floor(p.y / cell);
        for (let oy = -1; oy <= 1; oy++) {
          for (let ox = -1; ox <= 1; ox++) {
            const near = buckets.get(`${cx + ox},${cy + oy}`);
            if (!near) continue;
            for (const other of near) {
              if (other.item === item || other.item.dead) continue;
              const merged = continueJoin(item.points, aStart, other.item.points, other.start, maxDist);
              if (!merged) continue;
              item.points = merged;
              other.item.dead = true;
              changed = true;
              break outer;
            }
          }
        }
      }
    }
  }

  return items
    .filter((it) => !it.dead)
    .map((it) => ({ points: it.points, closed: it.closed }));
}

function distToSegment(p: Vec2, a: Vec2, b: Vec2) {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const len2 = vx * vx + vy * vy;
  if (len2 < 1e-8) return { d: Math.hypot(p.x - a.x, p.y - a.y), q: a };
  let t = ((p.x - a.x) * vx + (p.y - a.y) * vy) / len2;
  t = Math.max(0, Math.min(1, t));
  const q = { x: a.x + t * vx, y: a.y + t * vy };
  return { d: Math.hypot(p.x - q.x, p.y - q.y), q };
}

function closestOnPath(p: Vec2, points: Vec2[]) {
  let best = { d: Infinity, q: points[0] };
  for (let i = 1; i < points.length; i++) {
    const hit = distToSegment(p, points[i - 1], points[i]);
    if (hit.d < best.d) best = hit;
  }
  return best;
}

/** Snap a dangling H/V end onto a crossing axis stroke. Does not join into one polyline. */
export function attachEndsToAxis(paths: Stroke[], maxDist: number): Stroke[] {
  const axis = paths.map((p) => (p.closed ? null : axisMeta(p.points)));
  return paths.map((path, pi) => {
    const self = axis[pi];
    if (!self || path.points.length < 2) return path;
    const pts = copyPts(path.points);
    for (const atStart of [true, false]) {
      const end = atStart ? pts[0] : pts[pts.length - 1];
      const dir = outgoingDir(pts, atStart);
      let best: Vec2 | null = null;
      let bestD = maxDist;
      for (let qi = 0; qi < paths.length; qi++) {
        if (qi === pi) continue;
        const other = axis[qi];
        if (!other || other.axis === self.axis || other.len < 12) continue;
        const hit = closestOnPath(end, paths[qi].points);
        if (hit.d < 0.12 || hit.d > bestD) continue;
        const gx = hit.q.x - end.x;
        const gy = hit.q.y - end.y;
        const glen = Math.hypot(gx, gy) || 1;
        if (-dir.x * (gx / glen) + -dir.y * (gy / glen) < 0.2) continue;
        best = hit.q;
        bestD = hit.d;
      }
      if (!best) continue;
      if (atStart) pts[0] = { x: best.x, y: best.y };
      else pts[pts.length - 1] = { x: best.x, y: best.y };
    }
    return { points: snapMostlyAxis(pts, 2.8), closed: false };
  });
}

/** Delete short twigs that grow out of a longer stroke. Keep isolated marks. */
export function dropAttachedTwigs(paths: Stroke[], maxLen: number): Stroke[] {
  return paths.filter((path, i) => {
    if (path.closed) return true;
    const len = pathLen(path.points);
    if (len > maxLen) return true;
    const ends = [path.points[0], path.points[path.points.length - 1]];
    for (let j = 0; j < paths.length; j++) {
      if (j === i || pathLen(paths[j].points) < Math.max(12, len * 2.5)) continue;
      for (const end of ends) {
        if (closestOnPath(end, paths[j].points).d <= 1.8) return false;
      }
    }
    return true;
  });
}

export function collapseShortNoise(paths: Stroke[], minLen: number): Stroke[] {
  return paths.filter((p) => p.points.length >= 2 && pathLen(p.points) >= minLen);
}

/** Flatten leftover long H/V polylines that still carry a few pixels of jitter. */
export function forceSnapLongAxis(paths: Stroke[]): Stroke[] {
  return paths.map((path) => {
    if (path.closed || path.points.length < 2) return path;
    const { w, h, minX, maxX, minY, maxY } = bbox(path.points);
    const xs = path.points.map((p) => p.x);
    const ys = path.points.map((p) => p.y);
    const mx = median(xs);
    const my = median(ys);
    if (w >= Math.max(20, h * 5) && h <= 16 && meanAbsDev(ys, my) <= 3.2) {
      return {
        closed: false,
        points: [
          { x: minX, y: my },
          { x: maxX, y: my },
        ],
      };
    }
    if (h >= Math.max(20, w * 5) && w <= 16 && meanAbsDev(xs, mx) <= 3.2) {
      return {
        closed: false,
        points: [
          { x: mx, y: minY },
          { x: mx, y: maxY },
        ],
      };
    }
    return path;
  });
}

/** Split, collinear-merge, and T-snap AutoTrace centerlines. Leaves curves alone. */
export function rebuildOrthogonal(paths: Stroke[]): Stroke[] {
  let out = explodeOrthogonalRuns(paths);
  out = mergeCollinearAxis(out, { offset: 2.4, gap: 8 });
  out = forceSnapLongAxis(out);
  out = mergeCollinearAxis(out, { offset: 2.4, gap: 8 });
  out = attachEndsToAxis(out, 2.8);
  out = dropSlatBridges(out, 6);
  out = dropAttachedTwigs(out, 3.2);
  return out;
}

/** Drop short rungs that only exist because two parallel slats grew a bridge. */
export function dropSlatBridges(paths: Stroke[], maxLen: number): Stroke[] {
  return paths.filter((path, i) => {
    const meta = axisMeta(path.points);
    if (!meta || meta.len > maxLen) return true;
    const ends = [path.points[0], path.points[path.points.length - 1]];
    const need = meta.axis === "h" ? "v" : "h";
    let hits = 0;
    for (let j = 0; j < paths.length; j++) {
      if (j === i) continue;
      const other = axisMeta(paths[j].points);
      if (!other || other.axis !== need || other.len < 16) continue;
      if (ends.some((end) => closestOnPath(end, paths[j].points).d <= 1.8)) hits++;
      if (hits >= 2) return false;
    }
    return true;
  });
}
