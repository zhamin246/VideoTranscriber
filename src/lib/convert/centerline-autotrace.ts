import { execFile, execFileSync } from "child_process";
import { existsSync, readFileSync, statSync } from "fs";
import { mkdtemp, rm, writeFile, readFile } from "fs/promises";
import os from "os";
import path from "path";
import { promisify } from "util";
import { collapseShortNoise, rebuildOrthogonal, straightenOrthogonal } from "./centerline-cleanup";
import { geometryToDxf } from "./export-dxf";
import { sampleCubics } from "./fit-curve";
import type { CadPath, Vec2 } from "./geometry";
import { loadGrayImage } from "./load-pixels";
import { parseSvgPathD, svgToStrokePaths } from "./svg-path";
import { scaleToMillimetres } from "./vectorize";

const execFileAsync = promisify(execFile);

const WORKING_WIN_URL =
  "https://github.com/autotrace/autotrace/releases/download/travis-20190108.39/autotrace-0.40.0-20190108-win64-setup.zip";

function which(cmd: string) {
  try {
    const bin = process.platform === "win32" ? "where" : "which";
    const out = execFileSync(bin, [cmd], { encoding: "utf8", windowsHide: true });
    return out.split(/\r?\n/).map((s) => s.trim()).find((s) => s && existsSync(s)) || "";
  } catch {
    return "";
  }
}

function isLibtoolWrapper(bin: string) {
  try {
    const size = statSync(bin).size;
    if (size > 400_000) return false;
    const head = readFileSync(bin);
    return head.includes(Buffer.from("temporary wrapper script")) || head.includes(Buffer.from(".libs"));
  } catch {
    return false;
  }
}

function resolveRealBinary(bin: string) {
  const dir = path.dirname(bin);
  const nested = path.join(dir, ".libs", "autotrace.exe");
  if (existsSync(nested)) return nested;
  const nestedUnix = path.join(dir, ".libs", "autotrace");
  if (existsSync(nestedUnix)) return nestedUnix;
  return bin;
}

export function resolveAutotracePath() {
  const env = String(process.env.AUTOTRACE_PATH || "").trim();
  const raw =
    (env && existsSync(env) && env) ||
    which(process.platform === "win32" ? "autotrace.exe" : "autotrace") ||
    which("autotrace") ||
    [
      path.join(process.cwd(), "bin", "autotrace.exe"),
      path.join(process.cwd(), "bin", "autotrace"),
      "/usr/bin/autotrace",
      "/usr/local/bin/autotrace",
      "C:\\Program Files\\AutoTrace\\autotrace.exe",
      "C:\\Program Files (x86)\\AutoTrace\\autotrace.exe",
    ].find((p) => existsSync(p)) ||
    "";

  if (!raw) return "";
  return resolveRealBinary(raw);
}

function brokenInstallerHint() {
  return `The official AutoTrace 0.31.10 Windows installer is broken: it only ships a libtool wrapper, not the real program (C:\\Program Files\\AutoTrace\\.libs\\autotrace.exe is missing). Uninstall it, then install the 2019 win64 build: ${WORKING_WIN_URL}`;
}

function execEnv(bin: string) {
  const binDir = path.dirname(bin);
  return {
    cwd: binDir,
    env: {
      ...process.env,
      PATH: `${binDir}${path.delimiter}${process.env.PATH || ""}`,
    },
    timeout: 35_000,
    windowsHide: true as const,
    maxBuffer: 16 * 1024 * 1024,
  };
}

function formatExecError(e: unknown) {
  const err = e as {
    message?: string;
    status?: number;
    code?: string | number;
    stderr?: string | Buffer;
    stdout?: string | Buffer;
  };
  const extra = [err.stderr, err.stdout]
    .map((s) => (typeof s === "string" ? s : Buffer.isBuffer(s) ? s.toString("utf8") : ""))
    .join("\n")
    .trim();
  if (extra) return extra.slice(0, 800);
  if (err.status === 127 || err.code === 127) return brokenInstallerHint();
  return err.message || String(e);
}

export async function autotraceCenterlineDxf(image: string) {
  const bin = resolveAutotracePath();
  if (!bin) {
    throw new Error(
      `AutoTrace is not installed. On Windows use the 2019 win64 zip (not the latest 0.31.10 installer): ${WORKING_WIN_URL} — or set AUTOTRACE_PATH to the real autotrace.exe.`
    );
  }
  if (isLibtoolWrapper(bin)) {
    throw new Error(brokenInstallerHint());
  }

  const gray = await loadGrayImage({ image });
  const dir = await mkdtemp(path.join(os.tmpdir(), "at-centerline-"));
  const svgOut = path.join(dir, "output.svg");
  const dxfOut = path.join(dir, "output.dxf");
  try {
    const inputPpm = path.join(dir, "input.ppm");
    const inputPbm = path.join(dir, "input.pbm");
    await writeFile(inputPpm, encodePpm(gray.gray, gray.width, gray.height));
    await writeFile(inputPbm, encodePbm(gray.gray, gray.width, gray.height));

    const makeArgs = (
      flag: "--" | "-",
      input: string,
      color: boolean,
      format: "svg" | "dxf",
      output: string
    ) => [
      `${flag}centerline`,
      `${flag}background-color`,
      "FFFFFF",
      ...(color ? [`${flag}color-count`, "2"] : []),
      `${flag}despeckle-level`,
      "1",
      `${flag}error-threshold`,
      "2.8",
      `${flag}filter-iterations`,
      "5",
      `${flag}line-threshold`,
      "2",
      `${flag}output-format`,
      format,
      `${flag}output-file`,
      output,
      input,
    ];

    const opts = execEnv(bin);
    const attempts: Array<{ format: "svg" | "dxf"; args: string[] }> = [
      { format: "svg", args: makeArgs("-", inputPpm, true, "svg", svgOut) },
      { format: "svg", args: makeArgs("--", inputPpm, true, "svg", svgOut) },
      { format: "svg", args: makeArgs("-", inputPbm, false, "svg", svgOut) },
      { format: "svg", args: makeArgs("--", inputPbm, false, "svg", svgOut) },
      { format: "dxf", args: makeArgs("-", inputPpm, true, "dxf", dxfOut) },
      { format: "dxf", args: makeArgs("--", inputPpm, true, "dxf", dxfOut) },
      { format: "dxf", args: makeArgs("-", inputPbm, false, "dxf", dxfOut) },
      { format: "dxf", args: makeArgs("--", inputPbm, false, "dxf", dxfOut) },
    ];
    let last = "";
    let used: "svg" | "dxf" | "" = "";
    for (const attempt of attempts) {
      try {
        await execFileAsync(bin, attempt.args, opts);
        last = "";
        used = attempt.format;
        break;
      } catch (e) {
        last = formatExecError(e);
      }
    }
    if (last || !used) throw new Error(last || "AutoTrace did not produce a drawing");

    const geometry =
      used === "svg"
        ? autotraceSvgToGeometry(await readFile(svgOut, "utf8"), gray.width, gray.height)
        : autotraceDxfToGeometry(await readFile(dxfOut, "utf8"), gray.width, gray.height);
    if (!geometry.paths.length) {
      throw new Error("AutoTrace did not produce a DXF drawing");
    }
    const dxf = geometryToDxf(geometry, { fitArcs: false });
    geometry.sourceDxf = dxf;
    return { dxf, geometry };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/not installed|AUTOTRACE_PATH|libtool wrapper|2019 win64/i.test(msg)) throw e;
    throw new Error(msg.includes("ENOENT") ? "AutoTrace executable was not found" : msg);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}

function encodePpm(gray: Uint8Array, width: number, height: number) {
  let sum = 0;
  for (let i = 0; i < gray.length; i++) sum += gray[i];
  const invert = sum / Math.max(1, gray.length) < 128;
  const threshold = invert ? 90 : 160;
  const rgb = Buffer.alloc(width * height * 3);
  for (let i = 0; i < gray.length; i++) {
    const dark = invert ? gray[i] > threshold : gray[i] < threshold;
    const v = dark ? 0 : 255;
    rgb[i * 3] = v;
    rgb[i * 3 + 1] = v;
    rgb[i * 3 + 2] = v;
  }
  return Buffer.concat([Buffer.from(`P6\n${width} ${height}\n255\n`), rgb]);
}

function encodePbm(gray: Uint8Array, width: number, height: number) {
  let sum = 0;
  for (let i = 0; i < gray.length; i++) sum += gray[i];
  const invert = sum / Math.max(1, gray.length) < 128;
  const threshold = invert ? 90 : 160;
  const rowBytes = Math.ceil(width / 8);
  const bits = Buffer.alloc(rowBytes * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dark = invert ? gray[y * width + x] > threshold : gray[y * width + x] < threshold;
      if (dark) bits[y * rowBytes + (x >> 3)] |= 0x80 >> (x & 7);
    }
  }
  return Buffer.concat([Buffer.from(`P4\n${width} ${height}\n`), bits]);
}

function parseDxfPairs(dxf: string) {
  const lines = dxf.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const pairs: Array<[number, string]> = [];
  for (let i = 0; i + 1 < lines.length; i += 2) {
    const code = Number(lines[i].trim());
    if (!Number.isFinite(code)) continue;
    pairs.push([code, lines[i + 1].trim()]);
  }
  return pairs;
}

function dedupePts(points: Vec2[]) {
  const out: Vec2[] = [];
  for (const p of points) {
    const prev = out[out.length - 1];
    if (!prev || Math.hypot(p.x - prev.x, p.y - prev.y) > 0.05) out.push(p);
  }
  return out;
}

function rdp(points: Vec2[], epsilon: number): Vec2[] {
  if (points.length <= 2) return points.slice();
  let maxD = -1;
  let idx = -1;
  const a = points[0];
  const b = points[points.length - 1];
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const len2 = vx * vx + vy * vy;
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    const t = len2 < 1e-8 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / len2));
    const d = Math.hypot(p.x - (a.x + t * vx), p.y - (a.y + t * vy));
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

function pathLen(points: Vec2[]) {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return len;
}

function snapAxisAligned(points: Vec2[]) {
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

function pointToSeg(p: Vec2, a: Vec2, b: Vec2) {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const len2 = vx * vx + vy * vy;
  if (len2 < 1e-8) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * vx + (p.y - a.y) * vy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * vx), p.y - (a.y + t * vy));
}

function flattenPath(path: CadPath): Vec2[] {
  if (!path.cubics?.length || !path.points[0]) return path.points;
  const out: Vec2[] = [{ ...path.points[0] }];
  let p0 = path.points[0];
  for (const c of path.cubics) {
    const chord = Math.hypot(c.to.x - p0.x, c.to.y - p0.y);
    const d1 = pointToSeg(c.c1, p0, c.to);
    const d2 = pointToSeg(c.c2, p0, c.to);
    if (d1 <= 0.7 && d2 <= 0.7) {
      if (chord > 0.05) out.push({ ...c.to });
    } else {
      const steps = Math.min(14, Math.max(4, Math.ceil(chord / 6)));
      out.push(...sampleCubics(p0, [c], steps).slice(1));
    }
    p0 = c.to;
  }
  return out;
}

/** Long hollow ribbons (outline of a 1px stroke) become one centerline. */
function collapseSkinnyRibbon(points: Vec2[], closed: boolean) {
  const pts = dedupePts(points);
  if (pts.length < 3) return { points: pts, closed: false };
  const gap = Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y);
  const loop = closed || (pts.length > 6 && gap <= 2.5);
  if (!loop) return { points: pts, closed: false };
  const n = pts.length;
  let cx = 0;
  let cy = 0;
  for (const p of pts) {
    cx += p.x;
    cy += p.y;
  }
  cx /= n;
  cy /= n;
  let xx = 0;
  let xy = 0;
  let yy = 0;
  for (const p of pts) {
    const dx = p.x - cx;
    const dy = p.y - cy;
    xx += dx * dx;
    xy += dx * dy;
    yy += dy * dy;
  }
  const trace = xx + yy;
  const det = xx * yy - xy * xy;
  const disc = Math.sqrt(Math.max(0, (trace * trace) / 4 - det));
  const l1 = trace / 2 + disc;
  const l2 = trace / 2 - disc;
  const minorStd = Math.sqrt(Math.max(0, l2 / n));
  const majorStd = Math.sqrt(Math.max(0, l1 / n));
  if (minorStd > 11 || majorStd < 8 || minorStd / majorStd > 0.22) {
    if (loop && gap <= 1.2 && pts.length > 2) pts.pop();
    return { points: pts, closed: loop && pathLen(pts) > 12 };
  }
  let vx = 1;
  let vy = 0;
  if (Math.abs(xy) > 1e-6) {
    vx = l1 - yy;
    vy = xy;
  } else if (yy > xx) {
    vx = 0;
    vy = 1;
  }
  const vlen = Math.hypot(vx, vy) || 1;
  vx /= vlen;
  vy /= vlen;
  let tMin = Infinity;
  let tMax = -Infinity;
  for (const p of pts) {
    const t = (p.x - cx) * vx + (p.y - cy) * vy;
    tMin = Math.min(tMin, t);
    tMax = Math.max(tMax, t);
  }
  return {
    points: [
      { x: cx + vx * tMin, y: cy + vy * tMin },
      { x: cx + vx * tMax, y: cy + vy * tMax },
    ],
    closed: false,
  };
}

function samplePolyline(points: Vec2[], n: number) {
  const len = pathLen(points);
  if (len < 1e-6) return points.slice(0, 1);
  const out: Vec2[] = [];
  for (let i = 0; i < n; i++) {
    const target = (len * i) / Math.max(1, n - 1);
    let acc = 0;
    for (let j = 1; j < points.length; j++) {
      const a = points[j - 1];
      const b = points[j];
      const seg = Math.hypot(b.x - a.x, b.y - a.y);
      if (acc + seg >= target || j === points.length - 1) {
        const t = seg < 1e-8 ? 0 : Math.min(1, (target - acc) / seg);
        out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
        break;
      }
      acc += seg;
    }
  }
  return out;
}

function meanDistTo(a: Vec2[], b: Vec2[]) {
  const sa = samplePolyline(a, 10);
  const sb = samplePolyline(b, 24);
  let s = 0;
  for (const p of sa) {
    let best = Infinity;
    for (const q of sb) best = Math.min(best, Math.hypot(p.x - q.x, p.y - q.y));
    s += best;
  }
  return s / Math.max(1, sa.length);
}

function averagePolylines(a: Vec2[], b: Vec2[]) {
  const n = Math.max(8, Math.min(48, Math.max(a.length, b.length)));
  const sa = samplePolyline(a, n);
  const sb = samplePolyline(b, n);
  if (Math.hypot(sa[0].x - sb[0].x, sa[0].y - sb[0].y) > Math.hypot(sa[0].x - sb[n - 1].x, sa[0].y - sb[n - 1].y)) {
    sb.reverse();
  }
  return sa.map((p, i) => ({ x: (p.x + sb[i].x) / 2, y: (p.y + sb[i].y) / 2 }));
}

function collapseParallelPairs(paths: Array<{ points: Vec2[]; closed: boolean }>) {
  const used = new Set<number>();
  const out: Array<{ points: Vec2[]; closed: boolean }> = [];
  const scored = paths
    .map((p, i) => ({ i, len: pathLen(p.points), closed: p.closed }))
    .sort((a, b) => b.len - a.len);
  for (const a of scored) {
    if (used.has(a.i) || a.closed || a.len < 8) continue;
    let partner = -1;
    let best = 1.85;
    for (const b of scored) {
      if (b.i === a.i || used.has(b.i) || b.closed) continue;
      const ratio = a.len / Math.max(1e-6, b.len);
      if (ratio < 0.7 || ratio > 1.45) continue;
      const d = meanDistTo(paths[a.i].points, paths[b.i].points);
      if (d < best) {
        best = d;
        partner = b.i;
      }
    }
    if (partner >= 0) {
      used.add(a.i);
      used.add(partner);
      out.push({ points: snapAxisAligned(averagePolylines(paths[a.i].points, paths[partner].points)), closed: false });
    }
  }
  paths.forEach((p, i) => {
    if (!used.has(i)) out.push(p);
  });
  return out;
}

function finalizePixelPolylines(
  polylines: Array<{ points: Vec2[]; closed: boolean }>,
  width: number,
  height: number
) {
  const prepared = polylines
    .map((p) => {
      const pts = snapAxisAligned(rdp(dedupePts(p.points), 0.7));
      if (pts.length < 2 || pathLen(pts) < 1.6) return null;
      return collapseSkinnyRibbon(pts, p.closed);
    })
    .filter((p): p is { points: Vec2[]; closed: boolean } => Boolean(p));

  let cleaned = collapseParallelPairs(prepared).map((p) => ({
    ...p,
    points: straightenOrthogonal(p.points),
  }));
  cleaned = rebuildOrthogonal(cleaned);
  cleaned = collapseShortNoise(
    cleaned.map((p) => ({
      closed: p.closed,
      points: snapAxisAligned(rdp(dedupePts(p.points), 0.8)),
    })),
    1.6
  );

  const paths: CadPath[] = cleaned.map((p) => ({
    closed: p.closed,
    kind: p.points.length === 2 ? ("straight" as const) : ("curve" as const),
    points: p.points,
    filled: false,
  }));
  return scaleToMillimetres(paths, { width: width || 1, height: height || 1 });
}

function autotraceSvgToGeometry(svg: string, width: number, height: number) {
  const polylines: Array<{ points: Vec2[]; closed: boolean }> = [];
  const re = /<path\b([^>]*)\/?>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(svg))) {
    const attrs = match[1] || "";
    const fill = /fill:\s*([^;"'\s]+)/i.exec(attrs)?.[1]?.toLowerCase() || "";
    if (fill === "#fff" || fill === "#ffffff" || fill === "white") continue;
    const d = /(?:^|\s)d="([^"]+)"/i.exec(attrs)?.[1];
    if (!d) continue;
    for (const contour of parseSvgPathD(d)) {
      const points = flattenPath({
        closed: contour.closed,
        kind: contour.cubics?.length ? "curve" : "straight",
        points: contour.points,
        cubics: contour.cubics,
      });
      if (points.length < 2) continue;
      polylines.push({ points, closed: contour.closed });
    }
  }
  if (!polylines.length) {
    return finalizePixelPolylines(
      svgToStrokePaths(svg).map((path) => ({ points: flattenPath(path), closed: path.closed })),
      width,
      height
    );
  }
  return finalizePixelPolylines(polylines, width, height);
}

function entityLayer(pairs: Array<[number, string]>, start: number) {
  for (let j = start + 1; j < pairs.length && pairs[j][0] !== 0; j++) {
    if (pairs[j][0] === 8) return pairs[j][1];
  }
  return "";
}

function isPaperLayer(name: string) {
  const m = /^C(\d+)$/i.exec(name.trim());
  if (!m) return false;
  return Number(m[1]) >= 160;
}

function autotraceDxfToGeometry(dxf: string, width: number, height: number) {
  const pairs = parseDxfPairs(dxf);
  const polylines: { points: Vec2[]; closed: boolean }[] = [];

  const pushLine = (points: Vec2[], closed: boolean) => {
    const pts = dedupePts(points);
    if (pts.length < 2) return;
    polylines.push({ points: pts, closed });
  };

  for (let i = 0; i < pairs.length; i++) {
    const [code, value] = pairs[i];
    if (code !== 0) continue;
    const kind = value.toUpperCase();
    if (kind === "LINE") {
      if (isPaperLayer(entityLayer(pairs, i))) continue;
      let x1 = NaN;
      let y1 = NaN;
      let x2 = NaN;
      let y2 = NaN;
      for (let j = i + 1; j < pairs.length && pairs[j][0] !== 0; j++) {
        const [c, v] = pairs[j];
        const n = Number(v);
        if (c === 10) x1 = n;
        else if (c === 20) y1 = n;
        else if (c === 11) x2 = n;
        else if (c === 21) y2 = n;
      }
      if ([x1, y1, x2, y2].every(Number.isFinite)) {
        pushLine(
          [
            { x: x1, y: y1 },
            { x: x2, y: y2 },
          ],
          false
        );
      }
      continue;
    }
    if (kind === "LWPOLYLINE") {
      if (isPaperLayer(entityLayer(pairs, i))) continue;
      const pts: Vec2[] = [];
      let closed = false;
      let x = NaN;
      for (let j = i + 1; j < pairs.length && pairs[j][0] !== 0; j++) {
        const [c, v] = pairs[j];
        if (c === 70) closed = (Number(v) & 1) === 1;
        else if (c === 10) x = Number(v);
        else if (c === 20 && Number.isFinite(x)) {
          pts.push({ x, y: Number(v) });
          x = NaN;
        }
      }
      pushLine(pts, closed);
      continue;
    }
    if (kind === "POLYLINE") {
      if (isPaperLayer(entityLayer(pairs, i))) continue;
      let closed = false;
      for (let j = i + 1; j < pairs.length && pairs[j][0] !== 0; j++) {
        if (pairs[j][0] === 70) closed = (Number(pairs[j][1]) & 1) === 1;
      }
      const pts: Vec2[] = [];
      for (let j = i + 1; j < pairs.length; j++) {
        if (pairs[j][0] !== 0) continue;
        const name = pairs[j][1].toUpperCase();
        if (name === "SEQEND") {
          i = j;
          break;
        }
        if (name !== "VERTEX") continue;
        let x = NaN;
        let y = NaN;
        for (let k = j + 1; k < pairs.length && pairs[k][0] !== 0; k++) {
          if (pairs[k][0] === 10) x = Number(pairs[k][1]);
          if (pairs[k][0] === 20) y = Number(pairs[k][1]);
        }
        if (Number.isFinite(x) && Number.isFinite(y)) pts.push({ x, y });
      }
      pushLine(pts, closed);
    }
  }

  const h = height || 1;
  const flipped = polylines.map((p) => ({
    closed: p.closed,
    points: p.points.map((pt) => ({ x: pt.x, y: h - pt.y })),
  }));
  return finalizePixelPolylines(flipped, width || 1, h);
}
