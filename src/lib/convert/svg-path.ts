import type { CadCubic, CadPath, Vec2 } from "./geometry";

type Contour = {
  closed: boolean;
  points: Vec2[];
  cubics?: CadCubic[];
};

function lineCubic(a: Vec2, b: Vec2): CadCubic {
  return {
    c1: { x: a.x + (b.x - a.x) / 3, y: a.y + (b.y - a.y) / 3 },
    c2: { x: a.x + ((b.x - a.x) * 2) / 3, y: a.y + ((b.y - a.y) * 2) / 3 },
    to: { ...b },
  };
}

function quadToCubic(p0: Vec2, q: Vec2, p3: Vec2): CadCubic {
  return {
    c1: { x: p0.x + (2 / 3) * (q.x - p0.x), y: p0.y + (2 / 3) * (q.y - p0.y) },
    c2: { x: p3.x + (2 / 3) * (q.x - p3.x), y: p3.y + (2 / 3) * (q.y - p3.y) },
    to: { ...p3 },
  };
}

function tokenize(d: string): string[] {
  return d.match(/[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g) || [];
}

function num(tokens: string[], i: { n: number }): number {
  const v = Number(tokens[i.n++]);
  return Number.isFinite(v) ? v : 0;
}

/** Parse an SVG path `d` into closed/open contours. */
export function parseSvgPathD(d: string): Contour[] {
  const tokens = tokenize(d);
  const contours: Contour[] = [];
  const i = { n: 0 };
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  let lastCmd = "";
  let lastC2: Vec2 | null = null;
  let lastQ: Vec2 | null = null;
  let points: Vec2[] = [];
  let cubics: CadCubic[] = [];
  let hasCurve = false;

  const startContour = (nx: number, ny: number) => {
    flush();
    x = nx;
    y = ny;
    sx = nx;
    sy = ny;
    points = [{ x, y }];
    cubics = [];
    hasCurve = false;
    lastC2 = null;
    lastQ = null;
  };

  const flush = () => {
    if (points.length < 2 && cubics.length === 0) {
      points = [];
      cubics = [];
      return;
    }
    const closed =
      points.length > 2 &&
      Math.hypot(points[0].x - points[points.length - 1].x, points[0].y - points[points.length - 1].y) < 0.6;
    contours.push({
      closed,
      points,
      cubics: hasCurve && cubics.length ? cubics : undefined,
    });
    points = [];
    cubics = [];
  };

  const lineTo = (nx: number, ny: number) => {
    const from = { x, y };
    const to = { x: nx, y: ny };
    if (Math.hypot(nx - x, ny - y) < 1e-6) return;
    cubics.push(lineCubic(from, to));
    points.push(to);
    x = nx;
    y = ny;
    lastC2 = null;
    lastQ = null;
  };

  const cubicTo = (c1: Vec2, c2: Vec2, to: Vec2) => {
    hasCurve = true;
    cubics.push({ c1, c2, to: { ...to } });
    points.push({ ...to });
    x = to.x;
    y = to.y;
    lastC2 = c2;
    lastQ = null;
  };

  while (i.n < tokens.length) {
    const t = tokens[i.n];
    const isCmd = /^[A-Za-z]$/.test(t);
    const cmd = isCmd ? t : lastCmd;
    if (isCmd) i.n++;
    if (!cmd) break;
    lastCmd = cmd === "M" ? "L" : cmd === "m" ? "l" : cmd;

    if (cmd === "M" || cmd === "m") {
      const rel = cmd === "m";
      const nx = (rel ? x : 0) + num(tokens, i);
      const ny = (rel ? y : 0) + num(tokens, i);
      startContour(nx, ny);
      while (i.n < tokens.length && !/^[A-Za-z]$/.test(tokens[i.n])) {
        const lx = (rel ? x : 0) + num(tokens, i);
        const ly = (rel ? y : 0) + num(tokens, i);
        lineTo(lx, ly);
      }
      continue;
    }
    if (cmd === "L" || cmd === "l") {
      const rel = cmd === "l";
      while (i.n < tokens.length && !/^[A-Za-z]$/.test(tokens[i.n])) {
        const nx = (rel ? x : 0) + num(tokens, i);
        const ny = (rel ? y : 0) + num(tokens, i);
        lineTo(nx, ny);
      }
      continue;
    }
    if (cmd === "H" || cmd === "h") {
      const rel = cmd === "h";
      while (i.n < tokens.length && !/^[A-Za-z]$/.test(tokens[i.n])) {
        const nx = (rel ? x : 0) + num(tokens, i);
        lineTo(nx, y);
      }
      continue;
    }
    if (cmd === "V" || cmd === "v") {
      const rel = cmd === "v";
      while (i.n < tokens.length && !/^[A-Za-z]$/.test(tokens[i.n])) {
        const ny = (rel ? y : 0) + num(tokens, i);
        lineTo(x, ny);
      }
      continue;
    }
    if (cmd === "C" || cmd === "c") {
      const rel = cmd === "c";
      while (i.n < tokens.length && !/^[A-Za-z]$/.test(tokens[i.n])) {
        const c1 = {
          x: (rel ? x : 0) + num(tokens, i),
          y: (rel ? y : 0) + num(tokens, i),
        };
        const c2 = {
          x: (rel ? x : 0) + num(tokens, i),
          y: (rel ? y : 0) + num(tokens, i),
        };
        const to = {
          x: (rel ? x : 0) + num(tokens, i),
          y: (rel ? y : 0) + num(tokens, i),
        };
        cubicTo(c1, c2, to);
      }
      continue;
    }
    if (cmd === "S" || cmd === "s") {
      const rel = cmd === "s";
      while (i.n < tokens.length && !/^[A-Za-z]$/.test(tokens[i.n])) {
        const prevC2 = lastC2 as Vec2 | null;
        const c1 = prevC2
          ? { x: 2 * x - prevC2.x, y: 2 * y - prevC2.y }
          : { x, y };
        const c2 = {
          x: (rel ? x : 0) + num(tokens, i),
          y: (rel ? y : 0) + num(tokens, i),
        };
        const to = {
          x: (rel ? x : 0) + num(tokens, i),
          y: (rel ? y : 0) + num(tokens, i),
        };
        cubicTo(c1, c2, to);
      }
      continue;
    }
    if (cmd === "Q" || cmd === "q") {
      const rel = cmd === "q";
      while (i.n < tokens.length && !/^[A-Za-z]$/.test(tokens[i.n])) {
        const q = {
          x: (rel ? x : 0) + num(tokens, i),
          y: (rel ? y : 0) + num(tokens, i),
        };
        const to = {
          x: (rel ? x : 0) + num(tokens, i),
          y: (rel ? y : 0) + num(tokens, i),
        };
        lastQ = q;
        cubicTo(quadToCubic({ x, y }, q, to).c1, quadToCubic({ x, y }, q, to).c2, to);
      }
      continue;
    }
    if (cmd === "T" || cmd === "t") {
      const rel = cmd === "t";
      while (i.n < tokens.length && !/^[A-Za-z]$/.test(tokens[i.n])) {
        const q = lastQ
          ? { x: 2 * x - lastQ.x, y: 2 * y - lastQ.y }
          : { x, y };
        const to = {
          x: (rel ? x : 0) + num(tokens, i),
          y: (rel ? y : 0) + num(tokens, i),
        };
        lastQ = q;
        const cubic = quadToCubic({ x, y }, q, to);
        cubicTo(cubic.c1, cubic.c2, to);
      }
      continue;
    }
    if (cmd === "A" || cmd === "a") {
      const rel = cmd === "a";
      while (i.n < tokens.length && !/^[A-Za-z]$/.test(tokens[i.n])) {
        i.n += 5;
        if (i.n + 1 >= tokens.length) break;
        const nx = (rel ? x : 0) + num(tokens, i);
        const ny = (rel ? y : 0) + num(tokens, i);
        lineTo(nx, ny);
      }
      continue;
    }
    if (cmd === "Z" || cmd === "z") {
      if (Math.hypot(x - sx, y - sy) > 1e-4) lineTo(sx, sy);
      if (points.length) points[points.length - 1] = { x: sx, y: sy };
      x = sx;
      y = sy;
      if (points.length >= 2) {
        contours.push({
          closed: true,
          points,
          cubics: hasCurve && cubics.length ? cubics : undefined,
        });
      }
      points = [];
      cubics = [];
      hasCurve = false;
      lastC2 = null;
      lastQ = null;
      continue;
    }
    i.n++;
  }
  flush();
  return contours.filter((c) => c.points.length >= 2);
}

function parseRgbChannel(raw: string): number {
  const t = raw.trim();
  if (t.endsWith("%")) return Math.round((parseFloat(t) / 100) * 255);
  return Number(t);
}

function parseFillColor(fill: string): { hex: string; luma: number } | null {
  const raw = fill.trim().toLowerCase();
  if (!raw || raw === "none") return null;
  if (raw === "black") return { hex: "#000000", luma: 0 };
  if (raw === "white") return { hex: "#ffffff", luma: 255 };

  const hex = /^#([0-9a-f]{3,8})$/i.exec(raw);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = `${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return { hex: `#${h.slice(0, 6)}`, luma: 0.299 * r + 0.587 * g + 0.114 * b };
  }

  const rgb = /^rgba?\(\s*([^)]+)\)/.exec(raw);
  if (rgb) {
    const parts = rgb[1].split(/[, ]+/).filter(Boolean);
    const r = parseRgbChannel(parts[0] || "0");
    const g = parseRgbChannel(parts[1] || "0");
    const b = parseRgbChannel(parts[2] || "0");
    if (![r, g, b].every((n) => Number.isFinite(n))) return null;
    const rr = Math.max(0, Math.min(255, Math.round(r)));
    const gg = Math.max(0, Math.min(255, Math.round(g)));
    const bb = Math.max(0, Math.min(255, Math.round(b)));
    const toHex = (n: number) => n.toString(16).padStart(2, "0");
    return {
      hex: `#${toHex(rr)}${toHex(gg)}${toHex(bb)}`,
      luma: 0.299 * rr + 0.587 * gg + 0.114 * bb,
    };
  }
  return { hex: "#000000", luma: 0 };
}

function pathFillAttr(attrs: string): string {
  const direct = /(?:^|\s)fill="([^"]+)"/i.exec(attrs)?.[1];
  if (direct) return direct;
  const style = /(?:^|\s)style="([^"]+)"/i.exec(attrs)?.[1] || "";
  return /(?:^|;)\s*fill:\s*([^;]+)/i.exec(style)?.[1]?.trim() || "";
}

/** Open stroke paths from a centerline SVG (fill is usually none). */
export function svgToStrokePaths(svg: string): CadPath[] {
  const paths: CadPath[] = [];
  const re = /<path\b([^>]*)\/?>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(svg))) {
    const d = /(?:^|\s)d="([^"]+)"/i.exec(match[1] || "")?.[1];
    if (!d) continue;
    const contours = parseSvgPathD(d).filter((c) => contourLen(c) >= 2);
    for (const contour of contours) {
      paths.push({
        closed: contour.closed,
        kind: contour.cubics?.length ? "curve" : "straight",
        points: contour.points,
        cubics: contour.cubics,
        filled: false,
      });
    }
  }
  return paths;
}

/**
 * VTracer COLOR+STACKED paints back-to-front. Keep each `<path>` as one shape
 * (extra subpaths are holes, not extra fills). Inherit fill from parent `<g>`.
 */
export function svgToFilledPaths(svg: string): CadPath[] {
  const paths: CadPath[] = [];
  const fillStack: string[] = ["#000000"];
  const re = /<\/?g\b([^>]*)>|<(path)\b([^>]*)\/?>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(svg))) {
    const full = match[0];
    if (full.startsWith("</g")) {
      if (fillStack.length > 1) fillStack.pop();
      continue;
    }
    if (full.startsWith("<g")) {
      const hex = parseFillColor(pathFillAttr(match[1] || ""))?.hex;
      fillStack.push(hex || fillStack[fillStack.length - 1]);
      continue;
    }
    const attrs = match[3] || "";
    const d = /(?:^|\s)d="([^"]+)"/i.exec(attrs)?.[1];
    if (!d) continue;
    const color =
      parseFillColor(pathFillAttr(attrs)) || parseFillColor(fillStack[fillStack.length - 1]);
    if (!color) continue;
    const contours = parseSvgPathD(d)
      .map(stripOriginSpikes)
      .filter((c) => contourLen(c) >= 2 && contourArea(c) >= 0.25)
      .sort((a, b) => contourArea(b) - contourArea(a));
    if (!contours.length) continue;
    if (color.luma > 220) continue;
    const [outer, ...holes] = contours;
    paths.push({
      closed: true,
      kind: outer.cubics?.length ? "curve" : "straight",
      points: outer.points,
      cubics: outer.cubics,
      filled: true,
      fill: color.hex,
      holes: holes.length
        ? holes.map((h) => ({
            closed: true,
            points: h.points,
            cubics: h.cubics,
          }))
        : undefined,
    });
  }
  return paths;
}

/** Drop (0,0) vertices that only exist because a path started without M. */
function stripOriginSpikes(c: Contour): Contour {
  const near0 = (p: Vec2) => Math.hypot(p.x, p.y) < 0.6;
  const far = (p: Vec2) => Math.hypot(p.x, p.y) > 8;
  const points = c.points.filter((p, i, arr) => {
    if (!near0(p)) return true;
    const prev = arr[i - 1];
    const next = arr[i + 1];
    if (!prev) return !next || !far(next);
    if (!next) return !far(prev);
    return !far(prev) || !far(next);
  });
  return { ...c, points, cubics: undefined };
}

function contourLen(c: Contour) {
  let n = 0;
  for (let i = 1; i < c.points.length; i++) {
    n += Math.hypot(c.points[i].x - c.points[i - 1].x, c.points[i].y - c.points[i - 1].y);
  }
  return n;
}

function contourArea(c: Contour) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of c.points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return Math.max(0, maxX - minX) * Math.max(0, maxY - minY);
}
