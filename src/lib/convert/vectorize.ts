import type { CadGeometry, CadPath, Vec2 } from "./geometry";
import {
  CAD_LAYER,
  CAD_LONGEST_EDGE_MM,
  CAD_MARGIN_MM,
} from "./geometry";
import { addFittedCubics, fairPolyline, smoothPolyline } from "./fit-curve";

const MAX_TRACE_EDGE = 1600;
const MIN_COMPONENT = 3;
const STRAIGHT_DEV = 1.35;
const MIN_PATH_PTS = 2;
const MIN_PATH_LEN_PX = 3;
const SPUR_LEN = 3;
const CORNER_TURN = 1.15;
const EDGE_PAD = 10;

export type GrayImage = {
  width: number;
  height: number;
  gray: Uint8Array;
};

export type VectorizeOptions = {
  /** Dark strokes on light paper: stricter ink, blob cleanup, no cubic fitting. */
  lineArt?: boolean;
};

export function vectorizeGrayImage(
  image: GrayImage,
  options: VectorizeOptions = {}
): CadGeometry {
  if (options.lineArt) return vectorizeLineArt(image);
  return vectorizeSkeleton(image);
}

function padWhite(image: GrayImage, pad: number): GrayImage {
  if (pad <= 0) return image;
  const width = image.width + pad * 2;
  const height = image.height + pad * 2;
  const gray = new Uint8Array(width * height);
  gray.fill(255);
  for (let y = 0; y < image.height; y++) {
    const src = y * image.width;
    const dst = (y + pad) * width + pad;
    gray.set(image.gray.subarray(src, src + image.width), dst);
  }
  return { width, height, gray };
}

function vectorizeSkeleton(image: GrayImage): CadGeometry {
  const resized = resizeIfNeeded(image);
  const padded = padWhite(resized, EDGE_PAD);
  const prepared = prepareBinary(padded, false);
  zhangSuenThin(prepared);
  pruneSpurs(prepared, SPUR_LEN);
  const polylines = stitchPolylines(
    traceSkeleton(prepared).filter(
      (p) => p.points.length >= MIN_PATH_PTS && pathLength(p.points) >= MIN_PATH_LEN_PX
    )
  );
  const simplified = polylines
    .flatMap((p) => {
      const light = smoothPolyline(p.points, p.closed, 8);
      return splitAtCorners(light, p.closed);
    })
    .map((p) => ({
      points: fairPolyline(p.points, p.closed),
      closed: p.closed,
    }))
    .map((p) => simplifyPath(p.points, p.closed, 0))
    .filter((p) => p.points.length >= MIN_PATH_PTS && pathLength(p.points) >= MIN_PATH_LEN_PX)
    .map(classifyPath)
    .map(addFittedCubics)
    .filter((p) => p.points.length >= MIN_PATH_PTS)
    .map((p) => shiftPath(p, -EDGE_PAD, -EDGE_PAD));

  return scaleToMillimetres(simplified, {
    width: resized.width,
    height: resized.height,
  });
}

const LINE_ART_EDGE = 2200;
const LINE_ART_SPUR_PX = 3;
const LINE_ART_STITCH = 4;
const LINE_ART_TJOIN = 2.6;
const N4 = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
] as const;
const N8DIAG = [
  [1, -1],
  [1, 1],
  [-1, 1],
  [-1, -1],
] as const;

/** Already-thin ink drawings: keep strokes, join breaks, simplify pixel stairs. */
function vectorizeLineArt(image: GrayImage): CadGeometry {
  const resized = resizeKeepInk(image, LINE_ART_EDGE);
  const padded = padWhite(resized, EDGE_PAD);
  const prepared = prepareBinary(padded, false, true);
  fillStrokeBreaks(prepared);
  if (meanOrthoValence(prepared) > 2.75) {
    zhangSuenThin(prepared);
    fillStrokeBreaks(prepared);
  }
  pruneSpursLineArt(prepared, LINE_ART_SPUR_PX);
  const traced = traceSkeletonLineArt(prepared).filter(
    (p) => p.points.length >= MIN_PATH_PTS && pathLength(p.points) >= 2
  );
  const simplified = attachTJunctions(
    stitchNearbyEnds(stitchPolylines(traced), LINE_ART_STITCH),
    LINE_ART_TJOIN
  )
    .map((p) => {
      const pts = snapAxisAligned(simplifyPath(p.points, p.closed, 1.2).points);
      const len = pathLength(pts);
      const w = Math.abs(pts[0].x - pts[pts.length - 1].x);
      const h = Math.abs(pts[0].y - pts[pts.length - 1].y);
      const curve = len > 28 && w > 3 && h > 3;
      return {
        points: curve ? smoothPolyline(pts, p.closed, 5) : pts,
        closed: p.closed,
      };
    })
    .filter((p) => p.points.length >= MIN_PATH_PTS && pathLength(p.points) >= 2.2)
    .map(classifyPath)
    .map((p) => shiftPath(p, -EDGE_PAD, -EDGE_PAD));

  return scaleToMillimetres(simplified, {
    width: resized.width,
    height: resized.height,
  });
}

/** 1px ink skeleton for AutoTrace: always thin, do not prune short strokes. */
export function lineArtSkeletonBitmap(image: GrayImage): GrayImage {
  const resized = resizeKeepInk(image, LINE_ART_EDGE);
  const prepared = prepareBinary(resized, false, true);
  fillStrokeBreaks(prepared);
  zhangSuenThin(prepared);
  fillStrokeBreaks(prepared);
  pruneSpursLineArt(prepared, LINE_ART_SPUR_PX);
  const gray = new Uint8Array(prepared.ink.length);
  for (let i = 0; i < prepared.ink.length; i++) gray[i] = prepared.ink[i] ? 0 : 255;
  return { width: prepared.width, height: prepared.height, gray };
}

function resizeKeepInk(image: GrayImage, maxEdge: number): GrayImage {
  const { width, height, gray } = image;
  const edge = Math.max(width, height);
  if (edge <= maxEdge) return image;
  const scale = maxEdge / edge;
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const out = new Uint8Array(w * h);
  out.fill(255);
  for (let y = 0; y < height; y++) {
    const oy = Math.min(h - 1, Math.floor(y * scale));
    const src = y * width;
    const dst = oy * w;
    for (let x = 0; x < width; x++) {
      const ox = Math.min(w - 1, Math.floor(x * scale));
      const g = gray[src + x];
      if (g < out[dst + ox]) out[dst + ox] = g;
    }
  }
  return { width: w, height: h, gray: out };
}

function inBounds(width: number, height: number, x: number, y: number) {
  return x >= 0 && y >= 0 && x < width && y < height;
}

function lineArtNeighbors(
  ink: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number
) {
  const ortho: Array<[number, number]> = [];
  for (const [ox, oy] of N4) {
    const nx = x + ox;
    const ny = y + oy;
    if (!inBounds(width, height, nx, ny)) continue;
    if (ink[ny * width + nx]) ortho.push([nx, ny]);
  }
  if (ortho.length) return ortho;
  const diag: Array<[number, number]> = [];
  for (const [ox, oy] of N8DIAG) {
    const nx = x + ox;
    const ny = y + oy;
    if (!inBounds(width, height, nx, ny)) continue;
    if (ink[ny * width + nx]) diag.push([nx, ny]);
  }
  return diag;
}

function meanOrthoValence(img: { width: number; height: number; ink: Uint8Array }) {
  const { width, height, ink } = img;
  let n = 0;
  let s = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (!ink[y * width + x]) continue;
      n++;
      for (const [ox, oy] of N4) if (ink[(y + oy) * width + (x + ox)]) s++;
    }
  }
  return n ? s / n : 0;
}

function fillStrokeBreaks(img: { width: number; height: number; ink: Uint8Array }) {
  const { width, height, ink } = img;
  const deg4 = (x: number, y: number) => {
    let n = 0;
    for (const [ox, oy] of N4) {
      const nx = x + ox;
      const ny = y + oy;
      if (!inBounds(width, height, nx, ny)) continue;
      if (ink[ny * width + nx]) n++;
    }
    return n;
  };
  const tryFill = (ax: number, ay: number, bx: number, by: number, mids: Array<[number, number]>) => {
    if (!inBounds(width, height, bx, by)) return;
    if (!ink[ay * width + ax] || !ink[by * width + bx]) return;
    if (mids.every(([x, y]) => !ink[y * width + x]) && (deg4(ax, ay) <= 1 || deg4(bx, by) <= 1)) {
      for (const [x, y] of mids) ink[y * width + x] = 1;
    }
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!ink[y * width + x]) continue;
      tryFill(x, y, x + 2, y, [[x + 1, y]]);
      tryFill(x, y, x, y + 2, [[x, y + 1]]);
      tryFill(x, y, x + 3, y, [
        [x + 1, y],
        [x + 2, y],
      ]);
      tryFill(x, y, x, y + 3, [
        [x, y + 1],
        [x, y + 2],
      ]);
      tryFill(x, y, x + 2, y + 2, [[x + 1, y + 1]]);
      tryFill(x, y, x + 2, y - 2, [[x + 1, y - 1]]);
    }
  }
}

/** Skan type-1 only: delete short junction-to-endpoint twigs, keep isolated strokes. */
function pruneSpursLineArt(
  img: { width: number; height: number; ink: Uint8Array },
  maxLen: number
) {
  const { width, height, ink } = img;
  let changed = true;
  let guard = 0;
  while (changed && guard < 24) {
    guard++;
    changed = false;
    const kill: number[] = [];
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (!ink[y * width + x]) continue;
        if (lineArtNeighbors(ink, width, height, x, y).length !== 1) continue;
        const chain: number[] = [];
        let cx = x;
        let cy = y;
        let px = -1;
        let py = -1;
        for (let step = 0; step <= maxLen + 2; step++) {
          const nbs = lineArtNeighbors(ink, width, height, cx, cy).filter(
            ([nx, ny]) => nx !== px || ny !== py
          );
          chain.push(cy * width + cx);
          if (nbs.length >= 2) {
            if (chain.length - 1 <= maxLen) {
              for (const idx of chain.slice(0, -1)) kill.push(idx);
              changed = true;
            }
            break;
          }
          if (!nbs.length) break;
          px = cx;
          py = cy;
          cx = nbs[0][0];
          cy = nbs[0][1];
        }
      }
    }
    for (const i of kill) ink[i] = 0;
  }
}

function traceSkeletonLineArt(img: { width: number; height: number; ink: Uint8Array }) {
  const { width, height, ink } = img;
  const used = new Set<string>();
  const paths: { points: Vec2[]; closed: boolean }[] = [];

  const unusedNeighbors = (x: number, y: number) =>
    lineArtNeighbors(ink, width, height, x, y).filter(
      ([nx, ny]) => !used.has(edgeKey(x, y, nx, ny))
    );

  const pickNext = (
    x: number,
    y: number,
    px: number,
    py: number,
    neighbors: Array<[number, number]>
  ) => {
    if (!neighbors.length) return null;
    if (px === -999) return neighbors[0];
    const dx = x - px;
    const dy = y - py;
    let best: [number, number] | null = null;
    let bestDot = -Infinity;
    for (const [nx, ny] of neighbors) {
      const dot = (nx - x) * dx + (ny - y) * dy;
      if (dot > bestDot) {
        bestDot = dot;
        best = [nx, ny];
      }
    }
    return best;
  };

  const walk = (sx: number, sy: number, fromX: number, fromY: number) => {
    const points: Vec2[] = [{ x: sx + 0.5, y: sy + 0.5 }];
    let x = sx;
    let y = sy;
    let px = fromX;
    let py = fromY;
    for (let step = 0; step < ink.length; step++) {
      const next = pickNext(x, y, px, py, unusedNeighbors(x, y));
      if (!next) break;
      const [nx, ny] = next;
      used.add(edgeKey(x, y, nx, ny));
      points.push({ x: nx + 0.5, y: ny + 0.5 });
      px = x;
      py = y;
      x = nx;
      y = ny;
    }
    if (points.length < 2) return;
    const a = points[0];
    const b = points[points.length - 1];
    const closed = points.length > 4 && Math.hypot(a.x - b.x, a.y - b.y) <= 1.8;
    paths.push({ points, closed });
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!ink[y * width + x]) continue;
      if (lineArtNeighbors(ink, width, height, x, y).length !== 1) continue;
      const nbs = unusedNeighbors(x, y);
      if (!nbs.length) continue;
      walk(x, y, x * 2 - nbs[0][0], y * 2 - nbs[0][1]);
    }
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!ink[y * width + x]) continue;
      const nbs = unusedNeighbors(x, y);
      if (!nbs.length) continue;
      walk(x, y, -999, -999);
    }
  }
  return paths;
}

function stitchNearbyEnds(
  paths: { points: Vec2[]; closed: boolean }[],
  maxDist: number
) {
  type Item = { points: Vec2[]; closed: boolean; dead: boolean };
  const items: Item[] = paths.map((p) => ({
    points: p.points.slice(),
    closed: p.closed,
    dead: false,
  }));
  const cell = Math.max(1, maxDist);
  const keyOf = (x: number, y: number) => `${Math.floor(x / cell)},${Math.floor(y / cell)}`;

  const continueJoin = (a: Vec2[], aStart: boolean, b: Vec2[], bStart: boolean) => {
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
    if (-da.x * gx + -da.y * gy < 0.62) return null;
    if (db.x * gx + db.y * gy < 0.62) return null;
    return dist < 0.8 ? ap.concat(bp.slice(1)) : ap.concat(bp);
  };

  let guard = 0;
  let changed = true;
  while (changed && guard < 2500) {
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
              const merged = continueJoin(item.points, aStart, other.item.points, other.start);
              if (!merged) continue;
              item.points = merged;
              item.closed =
                merged.length > 4 && endKey(merged[0]) === endKey(merged[merged.length - 1]);
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

function attachTJunctions(
  paths: { points: Vec2[]; closed: boolean }[],
  maxDist: number
) {
  const cell = Math.max(1, maxDist);
  const keyOf = (x: number, y: number) => `${Math.floor(x / cell)},${Math.floor(y / cell)}`;
  type Hit = { pi: number; p: Vec2; end: boolean };
  const buckets = new Map<string, Hit[]>();
  const add = (hit: Hit) => {
    const k = keyOf(hit.p.x, hit.p.y);
    const list = buckets.get(k);
    if (list) list.push(hit);
    else buckets.set(k, [hit]);
  };
  for (let pi = 0; pi < paths.length; pi++) {
    const pts = paths[pi].points;
    for (let i = 0; i < pts.length; i++) {
      add({ pi, p: pts[i], end: i === 0 || i === pts.length - 1 });
    }
  }

  return paths.map((path, pi) => {
    if (path.closed || path.points.length < 2) return path;
    const pts = path.points.slice();
    for (const atStart of [true, false]) {
      const end = atStart ? pts[0] : pts[pts.length - 1];
      const dir = outgoingDir(pts, atStart);
      const cx = Math.floor(end.x / cell);
      const cy = Math.floor(end.y / cell);
      let best: Vec2 | null = null;
      let bestD = maxDist;
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const near = buckets.get(`${cx + ox},${cy + oy}`);
          if (!near) continue;
          for (const hit of near) {
            if (hit.pi === pi) continue;
            const gapx = hit.p.x - end.x;
            const gapy = hit.p.y - end.y;
            const dist = Math.hypot(gapx, gapy);
            if (dist < 0.2 || dist > bestD) continue;
            const glen = dist || 1;
            const toward = -dir.x * (gapx / glen) + -dir.y * (gapy / glen);
            if (toward < 0.35) continue;
            best = hit.p;
            bestD = dist;
          }
        }
      }
      if (!best) continue;
      if (atStart) pts.unshift({ x: best.x, y: best.y });
      else pts.push({ x: best.x, y: best.y });
    }
    return { points: pts, closed: path.closed };
  });
}

function snapAxisAligned(points: Vec2[]): Vec2[] {
  if (points.length < 2) return points;
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
  const w = maxX - minX;
  const h = maxY - minY;
  if (h <= 1.6 && w >= h * 4) {
    const y = points.reduce((s, p) => s + p.y, 0) / points.length;
    return points.map((p) => ({ x: p.x, y }));
  }
  if (w <= 1.6 && h >= w * 4) {
    const x = points.reduce((s, p) => s + p.x, 0) / points.length;
    return points.map((p) => ({ x, y: p.y }));
  }
  return points;
}

function shiftPath(path: CadPath, dx: number, dy: number): CadPath {
  const move = (p: Vec2) => ({ x: p.x + dx, y: p.y + dy });
  return {
    ...path,
    points: path.points.map(move),
    cubics: path.cubics?.map((c) => ({
      c1: move(c.c1),
      c2: move(c.c2),
      to: move(c.to),
    })),
    holes: path.holes?.map((hole) => ({
      ...hole,
      points: hole.points.map(move),
      cubics: hole.cubics?.map((c) => ({
        c1: move(c.c1),
        c2: move(c.c2),
        to: move(c.to),
      })),
    })),
  };
}

function prepareBinary(
  image: GrayImage,
  doResize = true,
  lineArt = false
): { width: number; height: number; ink: Uint8Array } {
  const resized = doResize ? resizeIfNeeded(image) : image;
  const { width, height, gray } = resized;
  const otsuT = otsu(gray);
  const mean = average(gray);
  const invert = mean < 128;
  const threshold = invert
    ? Math.min(otsuT, 90)
    : lineArt
      ? Math.min(Math.max(otsuT, 48), 184)
      : Math.max(otsuT, 232);
  const ink = new Uint8Array(width * height);
  let filled = 0;
  for (let i = 0; i < gray.length; i++) {
    const isInk = invert ? gray[i] > threshold : gray[i] < threshold;
    ink[i] = isInk ? 1 : 0;
    if (isInk) filled++;
  }
  if (filled / gray.length < 0.004) {
    filled = 0;
    const loose = invert
      ? Math.min(threshold + 50, 240)
      : lineArt
        ? Math.min(threshold + 24, 200)
        : Math.max(threshold, 242);
    for (let i = 0; i < gray.length; i++) {
      const isInk = invert ? gray[i] > loose : gray[i] < loose;
      ink[i] = isInk ? 1 : 0;
      if (isInk) filled++;
    }
  }
  const minBlob = lineArt ? 2 : MIN_COMPONENT;
  if (filled >= minBlob) {
    removeSmallComponents(ink, width, height, minBlob);
  }
  return { width, height, ink };
}

function boxBlur(gray: Uint8Array, width: number, height: number): Uint8Array {
  const tmp = new Uint16Array(gray.length);
  const out = new Uint8Array(gray.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let s = 0;
      let n = 0;
      for (let ox = -1; ox <= 1; ox++) {
        const xx = x + ox;
        if (xx < 0 || xx >= width) continue;
        s += gray[y * width + xx];
        n++;
      }
      tmp[y * width + x] = Math.round(s / n);
    }
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let s = 0;
      let n = 0;
      for (let oy = -1; oy <= 1; oy++) {
        const yy = y + oy;
        if (yy < 0 || yy >= height) continue;
        s += tmp[yy * width + x];
        n++;
      }
      out[y * width + x] = Math.round(s / n);
    }
  }
  return out;
}

function morphClose(ink: Uint8Array, width: number, height: number) {
  const dilate = new Uint8Array(ink.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let on = 0;
      for (let oy = -1; oy <= 1 && !on; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const nx = x + ox;
          const ny = y + oy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          if (ink[ny * width + nx]) {
            on = 1;
            break;
          }
        }
      }
      dilate[y * width + x] = on;
    }
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let on = 1;
      for (let oy = -1; oy <= 1 && on; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const nx = x + ox;
          const ny = y + oy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          if (!dilate[ny * width + nx]) {
            on = 0;
            break;
          }
        }
      }
      ink[y * width + x] = on;
    }
  }
}

function resizeIfNeeded(image: GrayImage): GrayImage {
  const { width, height, gray } = image;
  const edge = Math.max(width, height);
  if (edge <= MAX_TRACE_EDGE) return image;
  const scale = MAX_TRACE_EDGE / edge;
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const sy = Math.min(height - 1, Math.floor((y + 0.5) / scale));
    for (let x = 0; x < w; x++) {
      const sx = Math.min(width - 1, Math.floor((x + 0.5) / scale));
      out[y * w + x] = gray[sy * width + sx];
    }
  }
  return { width: w, height: h, gray: out };
}

function otsu(gray: Uint8Array) {
  const hist = new Float64Array(256);
  for (let i = 0; i < gray.length; i++) hist[gray[i]]++;
  const total = gray.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0;
  let wB = 0;
  let max = -1;
  let threshold = 128;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > max) {
      max = between;
      threshold = t;
    }
  }
  return threshold;
}

function average(gray: Uint8Array) {
  let s = 0;
  for (let i = 0; i < gray.length; i++) s += gray[i];
  return s / Math.max(1, gray.length);
}

function removeSmallComponents(
  ink: Uint8Array,
  width: number,
  height: number,
  minSize: number
) {
  const seen = new Uint8Array(ink.length);
  const qx = new Int32Array(ink.length);
  const qy = new Int32Array(ink.length);
  const stack: number[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const start = y * width + x;
      if (!ink[start] || seen[start]) continue;
      let qh = 0;
      let qt = 0;
      qx[qt] = x;
      qy[qt] = y;
      qt++;
      seen[start] = 1;
      const cells: number[] = [];
      while (qh < qt) {
        const cx = qx[qh];
        const cy = qy[qh];
        qh++;
        const idx = cy * width + cx;
        cells.push(idx);
        for (let oy = -1; oy <= 1; oy++) {
          for (let ox = -1; ox <= 1; ox++) {
            if (!ox && !oy) continue;
            const nx = cx + ox;
            const ny = cy + oy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
            const nidx = ny * width + nx;
            if (!ink[nidx] || seen[nidx]) continue;
            seen[nidx] = 1;
            qx[qt] = nx;
            qy[qt] = ny;
            qt++;
          }
        }
      }
      if (cells.length < minSize) {
        for (const i of cells) ink[i] = 0;
      }
      stack.length = 0;
    }
  }
}

const N8 = [
  [0, -1],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
] as const;

function zhangSuenThin(img: { width: number; height: number; ink: Uint8Array }) {
  const { width, height, ink } = img;
  const at = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < width && y < height ? ink[y * width + x] : 0;

  let changed = true;
  let guard = 0;
  while (changed && guard < 80) {
    guard++;
    changed = false;
    for (const pass of [0, 1] as const) {
      const kill: number[] = [];
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const i = y * width + x;
          if (!ink[i]) continue;
          const p2 = at(x, y - 1);
          const p3 = at(x + 1, y - 1);
          const p4 = at(x + 1, y);
          const p5 = at(x + 1, y + 1);
          const p6 = at(x, y + 1);
          const p7 = at(x - 1, y + 1);
          const p8 = at(x - 1, y);
          const p9 = at(x - 1, y - 1);
          const b = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
          if (b < 2 || b > 6) continue;
          const ring = [p2, p3, p4, p5, p6, p7, p8, p9, p2];
          let a = 0;
          for (let k = 0; k < 8; k++) if (ring[k] === 0 && ring[k + 1] === 1) a++;
          if (a !== 1) continue;
          if (pass === 0) {
            if (p2 * p4 * p6 !== 0 || p4 * p6 * p8 !== 0) continue;
          } else if (p2 * p4 * p8 !== 0 || p2 * p6 * p8 !== 0) continue;
          kill.push(i);
        }
      }
      if (kill.length) {
        changed = true;
        for (const i of kill) ink[i] = 0;
      }
    }
  }
}

function nextAlong(
  ink: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
  px: number,
  py: number
): [number, number] | null {
  const cands: Array<[number, number]> = [];
  for (const [ox, oy] of N8) {
    const nx = x + ox;
    const ny = y + oy;
    if (nx === px && ny === py) continue;
    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
    if (!ink[ny * width + nx]) continue;
    cands.push([nx, ny]);
  }
  if (!cands.length) return null;
  if (cands.length === 1 || px < 0) return cands[0];
  const dx = x - px;
  const dy = y - py;
  let best = cands[0];
  let bestDot = -Infinity;
  for (const [nx, ny] of cands) {
    const dot = (nx - x) * dx + (ny - y) * dy;
    if (dot > bestDot) {
      bestDot = dot;
      best = [nx, ny];
    }
  }
  return best;
}

function pruneSpurs(
  img: { width: number; height: number; ink: Uint8Array },
  maxLen: number
) {
  const { width, height, ink } = img;
  let changed = true;
  let guard = 0;
  while (changed && guard < 48) {
    guard++;
    changed = false;
    const kill: number[] = [];
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (!ink[y * width + x]) continue;
        if (degreeAt(ink, width, height, x, y) !== 1) continue;
        const chain: number[] = [];
        let cx = x;
        let cy = y;
        let px = -1;
        let py = -1;
        for (let step = 0; step <= maxLen + 2; step++) {
          const i = cy * width + cx;
          const deg = degreeAt(ink, width, height, cx, cy);
          if (step > 0 && deg >= 3) {
            if (chain.length <= maxLen) {
              for (const idx of chain) kill.push(idx);
              changed = true;
            }
            break;
          }
          chain.push(i);
          const next = nextAlong(ink, width, height, cx, cy, px, py);
          if (!next) {
            if (chain.length <= Math.min(10, maxLen)) {
              for (const idx of chain) kill.push(idx);
              changed = true;
            }
            break;
          }
          px = cx;
          py = cy;
          cx = next[0];
          cy = next[1];
        }
      }
    }
    for (const i of kill) ink[i] = 0;
  }
}

function cornerIndices(points: Vec2[], closed: boolean): number[] {
  const n = points.length;
  if (n < 12) return [];
  const w = 10;
  const raw: number[] = [];
  const start = closed ? 0 : w;
  const end = closed ? n : n - w;
  for (let i = start; i < end; i++) {
    const a = points[(i - w + n) % n];
    const b = points[i];
    const c = points[(i + w) % n];
    const ax = b.x - a.x;
    const ay = b.y - a.y;
    const bx = c.x - b.x;
    const by = c.y - b.y;
    const turn = Math.atan2(ax * by - ay * bx, ax * bx + ay * by);
    if (Math.abs(turn) >= CORNER_TURN) raw.push(i);
  }
  if (!raw.length) return [];
  const merged: number[] = [raw[0]];
  for (let i = 1; i < raw.length; i++) {
    if (raw[i] - merged[merged.length - 1] <= w) {
      merged[merged.length - 1] = raw[i];
    } else {
      merged.push(raw[i]);
    }
  }
  if (closed && merged.length > 1) {
    const first = merged[0];
    const last = merged[merged.length - 1];
    if (first + n - last <= w) merged.pop();
  }
  return merged;
}

function splitAtCorners(
  points: Vec2[],
  closed: boolean
): { points: Vec2[]; closed: boolean }[] {
  const corners = cornerIndices(points, closed);
  if (!corners.length) return [{ points, closed }];
  if (closed) {
    const start = corners[0];
    const rotated = points.slice(start).concat(points.slice(0, start));
    const cuts = corners
      .map((i) => (i - start + points.length) % points.length)
      .sort((a, b) => a - b);
    const out: { points: Vec2[]; closed: boolean }[] = [];
    for (let k = 0; k < cuts.length; k++) {
      const a = cuts[k];
      const b = k === cuts.length - 1 ? rotated.length : cuts[k + 1];
      const slice =
        k === cuts.length - 1
          ? rotated.slice(a).concat([rotated[0]])
          : rotated.slice(a, b + 1);
      if (slice.length >= 2) out.push({ points: slice, closed: false });
    }
    return out.length ? out : [{ points, closed }];
  }
  const cuts = [0, ...corners.filter((i) => i > 0 && i < points.length - 1), points.length - 1];
  const uniq = [...new Set(cuts)].sort((a, b) => a - b);
  const out: { points: Vec2[]; closed: boolean }[] = [];
  for (let k = 0; k < uniq.length - 1; k++) {
    const slice = points.slice(uniq[k], uniq[k + 1] + 1);
    if (slice.length >= 2) out.push({ points: slice, closed: false });
  }
  return out.length ? out : [{ points, closed }];
}

function degreeAt(
  ink: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number
) {
  let n = 0;
  for (const [ox, oy] of N8) {
    const nx = x + ox;
    const ny = y + oy;
    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
    if (ink[ny * width + nx]) n++;
  }
  return n;
}

function edgeKey(ax: number, ay: number, bx: number, by: number) {
  return ax < bx || (ax === bx && ay <= by)
    ? `${ax},${ay}-${bx},${by}`
    : `${bx},${by}-${ax},${ay}`;
}

function traceSkeleton(img: { width: number; height: number; ink: Uint8Array }) {
  const { width, height, ink } = img;
  const used = new Set<string>();
  const paths: { points: Vec2[]; closed: boolean }[] = [];

  const isInk = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < width && y < height && ink[y * width + x] === 1;

  const unusedNeighbors = (x: number, y: number) => {
    const out: Array<[number, number]> = [];
    for (const [ox, oy] of N8) {
      const nx = x + ox;
      const ny = y + oy;
      if (!isInk(nx, ny)) continue;
      if (used.has(edgeKey(x, y, nx, ny))) continue;
      out.push([nx, ny]);
    }
    return out;
  };

  const pickNext = (
    x: number,
    y: number,
    px: number,
    py: number,
    neighbors: Array<[number, number]>
  ) => {
    if (!neighbors.length) return null;
    if (px === -999) return neighbors[0];
    const dx = x - px;
    const dy = y - py;
    let best: [number, number] | null = null;
    let bestDot = -Infinity;
    for (const [nx, ny] of neighbors) {
      const dot = (nx - x) * dx + (ny - y) * dy;
      if (dot > bestDot) {
        bestDot = dot;
        best = [nx, ny];
      }
    }
    return best;
  };

  const walk = (sx: number, sy: number, fromX: number, fromY: number) => {
    const points: Vec2[] = [{ x: sx + 0.5, y: sy + 0.5 }];
    let x = sx;
    let y = sy;
    let px = fromX;
    let py = fromY;
    for (let step = 0; step < ink.length; step++) {
      const next = pickNext(x, y, px, py, unusedNeighbors(x, y));
      if (!next) break;
      const [nx, ny] = next;
      used.add(edgeKey(x, y, nx, ny));
      points.push({ x: nx + 0.5, y: ny + 0.5 });
      px = x;
      py = y;
      x = nx;
      y = ny;
    }
    if (points.length < 2) return;
    const a = points[0];
    const b = points[points.length - 1];
    const closed = points.length > 4 && Math.hypot(a.x - b.x, a.y - b.y) <= 1.8;
    paths.push({ points, closed });
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!ink[y * width + x]) continue;
      if (degreeAt(ink, width, height, x, y) !== 1) continue;
      const nbs = unusedNeighbors(x, y);
      if (!nbs.length) continue;
      walk(x, y, x * 2 - nbs[0][0], y * 2 - nbs[0][1]);
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!ink[y * width + x]) continue;
      const nbs = unusedNeighbors(x, y);
      if (!nbs.length) continue;
      walk(x, y, -999, -999);
    }
  }

  return paths;
}

function endKey(p: Vec2) {
  return `${Math.round(p.x)},${Math.round(p.y)}`;
}

function pathEnds(points: Vec2[]) {
  return [endKey(points[0]), endKey(points[points.length - 1])] as const;
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

function joinAt(
  a: Vec2[],
  b: Vec2[],
  joint: string
): Vec2[] | null {
  const ap = a.slice();
  const bp = b.slice();
  if (endKey(ap[0]) === joint) ap.reverse();
  if (endKey(bp[bp.length - 1]) === joint) bp.reverse();
  if (endKey(ap[ap.length - 1]) !== joint || endKey(bp[0]) !== joint) return null;
  return ap.concat(bp.slice(1));
}

function continuationScore(a: Vec2[], b: Vec2[], joint: string) {
  const aStart = endKey(a[0]) === joint;
  const bStart = endKey(b[0]) === joint;
  const da = outgoingDir(a, aStart);
  const db = outgoingDir(b, bStart);
  return da.x * db.x + da.y * db.y;
}

function stitchPolylines(paths: { points: Vec2[]; closed: boolean }[]) {
  type Item = { points: Vec2[]; closed: boolean; dead: boolean };
  const items: Item[] = paths.map((p) => ({
    points: p.points.slice(),
    closed: p.closed,
    dead: false,
  }));

  const mergePair = (a: Item, b: Item, joint: string) => {
    const merged = joinAt(a.points, b.points, joint);
    if (!merged) return false;
    a.points = merged;
    a.closed =
      merged.length > 4 && endKey(merged[0]) === endKey(merged[merged.length - 1]);
    b.dead = true;
    return true;
  };

  let guard = 0;
  let changed = true;
  while (changed && guard < 8000) {
    guard++;
    changed = false;
    const at = new Map<string, Item[]>();
    for (const item of items) {
      if (item.dead || item.closed) continue;
      for (const key of pathEnds(item.points)) {
        const list = at.get(key);
        if (list) list.push(item);
        else at.set(key, [item]);
      }
    }

    for (const [joint, list] of at) {
      const uniq: Item[] = [];
      for (const item of list) {
        if (!item.dead && !uniq.includes(item)) uniq.push(item);
      }
      if (uniq.length === 2) {
        if (mergePair(uniq[0], uniq[1], joint)) {
          changed = true;
          break;
        }
      }
      if (uniq.length >= 3) {
        let bestI = -1;
        let bestJ = -1;
        let best = 0.35;
        for (let i = 0; i < uniq.length; i++) {
          for (let j = i + 1; j < uniq.length; j++) {
            const score = continuationScore(uniq[i].points, uniq[j].points, joint);
            if (score > best) {
              best = score;
              bestI = i;
              bestJ = j;
            }
          }
        }
        if (bestI >= 0 && mergePair(uniq[bestI], uniq[bestJ], joint)) {
          changed = true;
          break;
        }
      }
    }
  }

  return items
    .filter((item) => !item.dead)
    .map((item) => ({ points: item.points, closed: item.closed }));
}

function rdp(points: Vec2[], epsilon: number): Vec2[] {
  if (points.length <= 2) return points.slice();
  let maxD = -1;
  let idx = -1;
  const a = points[0];
  const b = points[points.length - 1];
  for (let i = 1; i < points.length - 1; i++) {
    const d = distToSegment(points[i], a, b);
    if (d > maxD) {
      maxD = d;
      idx = i;
    }
  }
  if (maxD > epsilon && idx > 0) {
    const left = rdp(points.slice(0, idx + 1), epsilon);
    const right = rdp(points.slice(idx), epsilon);
    return left.slice(0, -1).concat(right);
  }
  return [a, b];
}

function distToSegment(p: Vec2, a: Vec2, b: Vec2) {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const len2 = vx * vx + vy * vy;
  if (len2 < 1e-8) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * vx + (p.y - a.y) * vy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * vx), p.y - (a.y + t * vy));
}

function simplifyPath(points: Vec2[], closed: boolean, extraEpsilon = 0) {
  let pts = points;
  if (closed && pts.length > 1) {
    const a = pts[0];
    const b = pts[pts.length - 1];
    if (Math.hypot(a.x - b.x, a.y - b.y) < 1.2) pts = pts.slice(0, -1);
  }
  const simplified = rdp(pts, rdpEpsilon(pathLength(pts)) + extraEpsilon);
  return { points: simplified, closed };
}

function rdpEpsilon(len: number) {
  if (len < 28) return 0.7;
  if (len < 90) return 1.05;
  return Math.min(2.2, 1.15 + len / 420);
}

function classifyPath(path: { points: Vec2[]; closed: boolean }): CadPath {
  const pts = path.points;
  if (pts.length === 2) return { ...path, kind: "straight" };
  let maxD = 0;
  const a = pts[0];
  const b = pts[pts.length - 1];
  for (let i = 1; i < pts.length - 1; i++) {
    maxD = Math.max(maxD, distToSegment(pts[i], a, b));
  }
  const chord = Math.hypot(b.x - a.x, b.y - a.y);
  if (maxD <= STRAIGHT_DEV && pathLength(pts) <= chord * 1.2 + 1.5) {
    return {
      closed: false,
      kind: "straight",
      points: [a, b],
    };
  }
  return { ...path, kind: "curve" };
}

function pathLength(points: Vec2[]) {
  let n = 0;
  for (let i = 1; i < points.length; i++) {
    n += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return n;
}

export function scaleToMillimetres(
  paths: CadPath[],
  frame?: { width: number; height: number; longestEdgeMm?: number }
): CadGeometry {
  if (!paths.length) {
    return {
      version: 1,
      units: "mm",
      width: CAD_LONGEST_EDGE_MM + CAD_MARGIN_MM * 2,
      height: CAD_LONGEST_EDGE_MM + CAD_MARGIN_MM * 2,
      margin: CAD_MARGIN_MM,
      contentWidth: CAD_LONGEST_EDGE_MM,
      contentHeight: CAD_LONGEST_EDGE_MM,
      layer: CAD_LAYER,
      paths: [],
    };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  if (frame && frame.width > 0 && frame.height > 0) {
    minX = 0;
    minY = 0;
    maxX = frame.width;
    maxY = frame.height;
  } else {
    for (const path of paths) {
      const contours = [path, ...(path.holes || [])];
      for (const contour of contours) {
        for (const p of contour.points) {
          minX = Math.min(minX, p.x);
          minY = Math.min(minY, p.y);
          maxX = Math.max(maxX, p.x);
          maxY = Math.max(maxY, p.y);
        }
      }
    }
  }
  const contentW = Math.max(1, maxX - minX);
  const contentH = Math.max(1, maxY - minY);
  const longestEdge = frame?.longestEdgeMm || CAD_LONGEST_EDGE_MM;
  const scale = longestEdge / Math.max(contentW, contentH);
  const margin = CAD_MARGIN_MM;
  const mapped: CadPath[] = paths.map((path) => ({
    ...path,
    points: path.points.map((p) => ({
      x: roundMm((p.x - minX) * scale + margin),
      y: roundMm((maxY - p.y) * scale + margin),
    })),
    cubics: path.cubics?.map((c) => ({
      c1: {
        x: roundMm((c.c1.x - minX) * scale + margin),
        y: roundMm((maxY - c.c1.y) * scale + margin),
      },
      c2: {
        x: roundMm((c.c2.x - minX) * scale + margin),
        y: roundMm((maxY - c.c2.y) * scale + margin),
      },
      to: {
        x: roundMm((c.to.x - minX) * scale + margin),
        y: roundMm((maxY - c.to.y) * scale + margin),
      },
    })),
    holes: path.holes?.map((hole) => ({
      ...hole,
      points: hole.points.map((p) => ({
        x: roundMm((p.x - minX) * scale + margin),
        y: roundMm((maxY - p.y) * scale + margin),
      })),
      cubics: hole.cubics?.map((c) => ({
        c1: {
          x: roundMm((c.c1.x - minX) * scale + margin),
          y: roundMm((maxY - c.c1.y) * scale + margin),
        },
        c2: {
          x: roundMm((c.c2.x - minX) * scale + margin),
          y: roundMm((maxY - c.c2.y) * scale + margin),
        },
        to: {
          x: roundMm((c.to.x - minX) * scale + margin),
          y: roundMm((maxY - c.to.y) * scale + margin),
        },
      })),
    })),
  }));

  return {
    version: 1,
    units: "mm",
    width: roundMm(contentW * scale + margin * 2),
    height: roundMm(contentH * scale + margin * 2),
    margin,
    contentWidth: roundMm(contentW * scale),
    contentHeight: roundMm(contentH * scale),
    layer: CAD_LAYER,
    paths: mapped,
  };
}

function roundMm(n: number) {
  return Math.round(n * 100) / 100;
}
