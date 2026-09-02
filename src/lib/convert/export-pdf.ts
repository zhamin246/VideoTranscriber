import type { CadCubic, CadGeometry, CadPath, Vec2 } from "./geometry";
import { CAD_STROKE_MM } from "./geometry";

const MM_TO_PT = 72 / 25.4;

function pdfEscape(stream: string) {
  return stream;
}

function xrefEntry(offset: number) {
  return `${String(offset).padStart(10, "0")} 00000 n \n`;
}

function emitContour(
  ops: string[],
  points: Vec2[],
  cubics: CadCubic[] | undefined,
  close: boolean
) {
  if (points.length < 2) return;
  const first = points[0];
  ops.push(`${first.x.toFixed(2)} ${first.y.toFixed(2)} m`);
  if (cubics?.length) {
    for (const c of cubics) {
      ops.push(
        `${c.c1.x.toFixed(2)} ${c.c1.y.toFixed(2)} ${c.c2.x.toFixed(2)} ${c.c2.y.toFixed(2)} ${c.to.x.toFixed(2)} ${c.to.y.toFixed(2)} c`
      );
    }
  } else {
    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      ops.push(`${p.x.toFixed(2)} ${p.y.toFixed(2)} l`);
    }
  }
  if (close) ops.push("h");
}

function fillRgb(fill?: string): [number, number, number] {
  const m = /^#([0-9a-f]{6})$/i.exec(fill || "");
  if (!m) return [0, 0, 0];
  const n = parseInt(m[1], 16);
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function emitPath(ops: string[], path: CadPath) {
  if (path.points.length < 2) return;
  if (path.filled) {
    const [r, g, b] = fillRgb(path.fill);
    ops.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
  }
  emitContour(ops, path.points, path.cubics, path.closed || Boolean(path.filled));
  for (const hole of path.holes || []) {
    emitContour(ops, hole.points, hole.cubics, hole.closed || Boolean(path.filled));
  }
  if (path.filled) ops.push(path.holes?.length ? "f*" : "f");
  else ops.push(path.closed ? "s" : "S");
}

/** Single-page vector PDF. User space is millimetres via a scale matrix. */
export function geometryToPdf(geometry: CadGeometry): Uint8Array {
  const wPt = geometry.width * MM_TO_PT;
  const hPt = geometry.height * MM_TO_PT;
  const strokePt = CAD_STROKE_MM * MM_TO_PT;

  const ops: string[] = [];
  ops.push(`${strokePt.toFixed(3)} w`);
  ops.push("0 0 0 RG");
  ops.push("0 0 0 rg");
  ops.push("1 J 1 j");
  ops.push(`${MM_TO_PT.toFixed(6)} 0 0 ${MM_TO_PT.toFixed(6)} 0 0 cm`);
  if (geometry.paths.some((p) => p.filled)) {
    ops.push("1 1 1 rg");
    ops.push(`0 0 ${geometry.width.toFixed(2)} ${geometry.height.toFixed(2)} re`);
    ops.push("f");
  }

  for (const path of geometry.paths) emitPath(ops, path);
  const stream = pdfEscape(ops.join("\n") + "\n");

  const objects: string[] = [];
  objects[1] = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  objects[2] = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
  objects[3] =
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${wPt.toFixed(2)} ${hPt.toFixed(2)}] /Contents 4 0 R /Resources << >> >>\nendobj\n`;
  objects[4] =
    `4 0 obj\n<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}endstream\nendobj\n`;

  let body = "%PDF-1.4\n";
  const offsets = [0];
  for (let i = 1; i <= 4; i++) {
    offsets[i] = Buffer.byteLength(body, "utf8");
    body += objects[i];
  }
  const xrefPos = Buffer.byteLength(body, "utf8");
  let xref = "xref\n0 5\n0000000000 65535 f \n";
  for (let i = 1; i <= 4; i++) xref += xrefEntry(offsets[i]);
  body += xref;
  body += `trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`;
  return new Uint8Array(Buffer.from(body, "utf8"));
}
