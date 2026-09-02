import { convertBuffer, convertPixels } from "@visioncortex/vtracer";
import { collapseSkinnyFilledPaths } from "./collapse-skinny";
import type { CadGeometry } from "./geometry";
import { geometryToDxf } from "./export-dxf";
import type { GrayImage } from "./vectorize";
import { scaleToMillimetres } from "./vectorize";
import { svgToFilledPaths } from "./svg-path";
import {
  longestEdgeMmFromParams,
  vtracerConfigFromParams,
  type VtracerConfig,
} from "./vtracer-options";
import type { VectorLineParams } from "./vectorline-params";

const MAX_EDGE = 1800;

function resizeGray(image: GrayImage): GrayImage {
  const { width, height, gray } = image;
  const edge = Math.max(width, height);
  if (edge <= MAX_EDGE) return image;
  const scale = MAX_EDGE / edge;
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const sy = (y + 0.5) / scale - 0.5;
    const y0 = Math.max(0, Math.floor(sy));
    const y1 = Math.min(height - 1, y0 + 1);
    const fy = sy - y0;
    for (let x = 0; x < w; x++) {
      const sx = (x + 0.5) / scale - 0.5;
      const x0 = Math.max(0, Math.floor(sx));
      const x1 = Math.min(width - 1, x0 + 1);
      const fx = sx - x0;
      const a = gray[y0 * width + x0];
      const b = gray[y0 * width + x1];
      const c = gray[y1 * width + x0];
      const d = gray[y1 * width + x1];
      out[y * w + x] = Math.round(
        a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy
      );
    }
  }
  return { width: w, height: h, gray: out };
}

function toRgba(image: GrayImage): { rgba: Uint8Array; width: number; height: number } {
  const { width, height, gray } = image;
  const rgba = new Uint8Array(width * height * 4);
  for (let i = 0; i < gray.length; i++) {
    const v = gray[i];
    const o = i * 4;
    rgba[o] = v;
    rgba[o + 1] = v;
    rgba[o + 2] = v;
    rgba[o + 3] = 255;
  }
  return { rgba, width, height };
}

function ensureFilledSvg(svg: string) {
  if (!svg || /<style[\s>]/i.test(svg)) return svg;
  return svg.replace(
    /<svg([^>]*)>/i,
    `<svg$1><style>path,polygon{fill:#000000;stroke:none}</style>`
  );
}

function geometryFromSvg(
  svg: string,
  width: number,
  height: number,
  longestEdgeMm?: number
): CadGeometry {
  const filledSvg = ensureFilledSvg(svg);
  const paths = collapseSkinnyFilledPaths(svgToFilledPaths(filledSvg), { width, height });
  const geometry = {
    ...scaleToMillimetres(paths, { width, height, longestEdgeMm }),
    sourceSvg: filledSvg,
  };
  geometry.sourceDxf = geometryToDxf(geometry);
  return geometry;
}

function configFrom(params?: Partial<VectorLineParams> | VtracerConfig): VtracerConfig {
  if (params && "clustering" in params && params.clustering === "bw") {
    return params;
  }
  return vtracerConfigFromParams(params as Partial<VectorLineParams> | undefined);
}

/** Same path as the official web app: decode the PNG/JPEG inside VTracer. */
export function vectorizeWithVtracerBuffer(
  buffer: Buffer | Uint8Array,
  width: number,
  height: number,
  params?: Partial<VectorLineParams> | VtracerConfig
): CadGeometry {
  const svg = convertBuffer(
    buffer instanceof Buffer ? new Uint8Array(buffer) : buffer,
    configFrom(params)
  );
  return geometryFromSvg(svg, width, height, longestEdgeMmFromParams(params as Partial<VectorLineParams>));
}

export function vectorizeWithVtracer(
  image: GrayImage,
  params?: Partial<VectorLineParams> | VtracerConfig
): CadGeometry {
  const resized = resizeGray(image);
  const { rgba, width, height } = toRgba(resized);
  const svg = convertPixels(rgba, width, height, configFrom(params));
  return geometryFromSvg(svg, width, height, longestEdgeMmFromParams(params as Partial<VectorLineParams>));
}
