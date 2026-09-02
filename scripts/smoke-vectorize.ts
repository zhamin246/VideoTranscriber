import { readFileSync, writeFileSync } from "fs";
import sharp from "sharp";
import { loadGrayImage } from "../src/lib/convert/load-pixels";
import { vectorizeGrayImage } from "../src/lib/convert/vectorize";
import { geometryToDxf } from "../src/lib/convert/export-dxf";
import { geometryToSvg } from "../src/lib/convert/export-svg";
import { geometryToPdf } from "../src/lib/convert/export-pdf";
import type { CadGeometry } from "../src/lib/convert/geometry";
import { sampleCubics } from "../src/lib/convert/fit-curve";

function rasterGeometry(geometry: CadGeometry, size = 1000) {
  const scale = (size - 24) / Math.max(geometry.width, geometry.height);
  const w = Math.max(1, Math.ceil(geometry.width * scale) + 24);
  const h = Math.max(1, Math.ceil(geometry.height * scale) + 24);
  const pix = Buffer.alloc(w * h, 255);
  const set = (x: number, y: number) => {
    const yy = h - 1 - y;
    if (x < 0 || yy < 0 || x >= w || yy >= h) return;
    pix[yy * w + x] = 0;
  };
  const line = (x0: number, y0: number, x1: number, y1: number) => {
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    let x = x0;
    let y = y0;
    while (true) {
      set(x, y);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  };
  for (const path of geometry.paths) {
    const contours = [path, ...(path.holes || [])];
    for (const contour of contours) {
      const pts =
        contour.cubics?.length && contour.points[0]
          ? sampleCubics(contour.points[0], contour.cubics, 10)
          : contour.points;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        line(
          Math.round(a.x * scale + 12),
          Math.round(a.y * scale + 12),
          Math.round(b.x * scale + 12),
          Math.round(b.y * scale + 12)
        );
      }
    }
  }
  return { pix, w, h };
}

async function main() {
  const arg = process.argv[2] || "portrait";
  const t0 = Date.now();
  const isFile = /\.(png|webp|jpe?g)$/i.test(arg) || arg.includes("\\") || arg.includes("/");
  const gray = isFile
    ? await (async () => {
        const buf = readFileSync(arg);
        const { data, info } = await sharp(buf)
          .grayscale()
          .raw()
          .toBuffer({ resolveWithObject: true });
        return {
          width: info.width,
          height: info.height,
          gray: new Uint8Array(data),
        };
      })()
    : await loadGrayImage({ sampleId: arg });
  const geometry = vectorizeGrayImage(gray);
  const sampleId = isFile ? "user" : arg;
  const dxf = geometryToDxf(geometry);
  const svg = geometryToSvg(geometry);
  const pdf = geometryToPdf(geometry);
  const twoPoint = geometry.paths.filter((p) => p.points.length === 2).length;
  writeFileSync(`scripts/out-${sampleId}.svg`, svg);
  const raster = rasterGeometry(geometry);
  await sharp(raster.pix, {
    raw: { width: raster.w, height: raster.h, channels: 1 },
  }).png().toFile(`scripts/out-${sampleId}.png`);
  console.log(
    JSON.stringify(
      {
        sampleId,
        ms: Date.now() - t0,
        size: `${gray.width}x${gray.height}`,
        sheet: `${geometry.width}x${geometry.height}mm`,
        paths: geometry.paths.length,
        twoPoint,
        twoPointPct: Math.round((100 * twoPoint) / Math.max(1, geometry.paths.length)),
        points: geometry.paths.reduce((n, p) => n + p.points.length, 0),
        avgPts: Number(
          (
            geometry.paths.reduce((n, p) => n + p.points.length, 0) /
            Math.max(1, geometry.paths.length)
          ).toFixed(1)
        ),
        straight: geometry.paths.filter((p) => p.kind === "straight").length,
        curve: geometry.paths.filter((p) => p.kind === "curve").length,
        cubics: geometry.paths.reduce((n, p) => n + (p.cubics?.length || 0), 0),
        dxfBytes: Buffer.byteLength(dxf),
        svgBytes: Buffer.byteLength(svg),
        pdfBytes: pdf.byteLength,
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
