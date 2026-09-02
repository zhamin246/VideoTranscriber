import type { CadCubic, CadGeometry, CadPath, Vec2 } from "./geometry";
import { CAD_STROKE_MM } from "./geometry";

function esc(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function contourD(
  points: Vec2[],
  cubics: CadCubic[] | undefined,
  closed: boolean
) {
  if (points.length < 2) return "";
  const first = points[0];
  let d = `M ${esc(first.x)} ${esc(first.y)}`;
  if (cubics?.length) {
    for (const c of cubics) {
      d += ` C ${esc(c.c1.x)} ${esc(c.c1.y)} ${esc(c.c2.x)} ${esc(c.c2.y)} ${esc(c.to.x)} ${esc(c.to.y)}`;
    }
  } else {
    for (let i = 1; i < points.length; i++) {
      d += ` L ${esc(points[i].x)} ${esc(points[i].y)}`;
    }
  }
  if (closed) d += " Z";
  return d;
}

function pathD(path: CadPath) {
  let d = contourD(path.points, path.cubics, path.closed);
  for (const hole of path.holes || []) {
    d += contourD(hole.points, hole.cubics, hole.closed);
  }
  return d;
}

/** Official download: the converter SVG, not a rebuilt copy. */
function vtracerSvgForDownload(svg: string, widthMm: number, heightMm: number): string {
  return svg.replace(/<svg\b([^>]*)>/i, (_all, attrs: string) => {
    const next = String(attrs)
      .replace(/\s*width="[^"]*"/gi, "")
      .replace(/\s*height="[^"]*"/gi, "");
    return `<svg${next} width="${esc(widthMm)}mm" height="${esc(heightMm)}mm">`;
  });
}

/** SVG in millimetres. 1 user unit = 1 mm. Geometry is Y-up; SVG flips it. */
export function geometryToSvg(geometry: CadGeometry): string {
  if (geometry.sourceSvg) {
    return vtracerSvgForDownload(geometry.sourceSvg, geometry.width, geometry.height);
  }

  const w = esc(geometry.width);
  const h = esc(geometry.height);
  const stroke = esc(CAD_STROKE_MM);
  const anyFilled = geometry.paths.some((p) => p.filled);
  const parts: string[] = [];
  for (const path of geometry.paths) {
    const d = pathD(path);
    if (!d) continue;
    if (path.filled) {
      const fill = path.fill || "#000000";
      const rule = path.holes?.length ? "evenodd" : "nonzero";
      parts.push(
        `    <path d="${d}" fill="${fill}" fill-rule="${rule}" stroke="none"/>`
      );
    } else if (anyFilled) {
      parts.push(
        `    <path d="${d}" fill="none" stroke="#000000" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"/>`
      );
    } else {
      parts.push(`    <path d="${d}"/>`);
    }
  }

  const groupStyle = anyFilled
    ? ``
    : ` fill="none" stroke="#000000" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"`;

  const paper = anyFilled
    ? `    <rect x="0" y="0" width="${w}" height="${h}" fill="#ffffff" stroke="none"/>\n`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}">
  <g transform="translate(0 ${h}) scale(1 -1)"${groupStyle}>
${paper}${parts.join("\n")}
  </g>
</svg>
`;
}
