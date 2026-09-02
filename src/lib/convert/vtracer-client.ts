import { applyBackgroundMask, type VectorLinePixels, type VectorLineResult } from "./vectorline-browser";
import { geometryToSvg } from "./export-svg";
import type { CadGeometry } from "./geometry";
import type { VectorLineParams } from "./vectorline-params";

function clampByte(n: number) {
  return n < 0 ? 0 : n > 255 ? 255 : n;
}

export function prepareImageDataForVtracer(
  source: ImageData,
  params: VectorLineParams,
  mask?: Uint8Array | null
): ImageData {
  const copy = applyBackgroundMask(source, mask);
  const d = copy.data;
  const brightness = params.brightness / 100;
  const contrast = params.contrast / 100;
  const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
  const cutoff = params.whiteCutoff;
  for (let i = 0; i < d.length; i += 4) {
    let r = factor * (d[i] - 128) + 128 + brightness * 255;
    let g = factor * (d[i + 1] - 128) + 128 + brightness * 255;
    let b = factor * (d[i + 2] - 128) + 128 + brightness * 255;
    if (params.invert) {
      r = 255 - r;
      g = 255 - g;
      b = 255 - b;
    }
    r = clampByte(r);
    g = clampByte(g);
    b = clampByte(b);
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    if (cutoff < 255 && gray >= cutoff) {
      r = 255;
      g = 255;
      b = 255;
    }
    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
  }
  return copy;
}

function imageDataToPngDataUrl(image: ImageData): string {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not encode pixels");
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the image"));
    reader.readAsDataURL(blob);
  });
}

function probeImageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Could not read image size"));
    img.src = src;
  });
}

/** Original file bytes — same input official VTracer decodes. No canvas. */
async function srcToImagePayload(src: string): Promise<{
  png: string;
  width: number;
  height: number;
}> {
  if (src.startsWith("data:")) {
    const size = await probeImageSize(src);
    return { png: src, ...size };
  }

  const href = /^https?:\/\//i.test(src)
    ? `/api/convert/image-proxy?url=${encodeURIComponent(src)}`
    : src;
  const res = await fetch(href, { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load the image for tracing");
  const blob = await res.blob();
  const png = await blobToDataUrl(blob);
  const size = await probeImageSize(png);
  return { png, ...size };
}

async function postVtracer(
  png: string,
  width: number,
  height: number,
  params: VectorLineParams
): Promise<VectorLineResult> {
  const res = await fetch("/api/convert/vtracer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ png, width, height, params }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.code !== 0 || !json?.data?.geometry) {
    throw new Error(json?.message || "Could not trace outlines");
  }
  const geometry = json.data.geometry as CadGeometry;
  const previewSvg = geometry.paths.some((p) => !p.filled)
    ? geometryToSvg({ ...geometry, sourceSvg: undefined })
    : String(geometry.sourceSvg || geometryToSvg(geometry));
  const previewUrl = URL.createObjectURL(
    new Blob([previewSvg], { type: "image/svg+xml;charset=utf-8" })
  );
  return {
    geometry,
    previewUrl,
    bitmap: new ImageData(1, 1),
    pathsSvgHtml: previewSvg,
    pathsCount: json.data.pathsCount || geometry.paths?.length || 0,
    totalNodes: json.data.totalNodes || 0,
    width,
    height,
  };
}

export async function runVtracerFromImageSrc(
  src: string,
  params: VectorLineParams
): Promise<VectorLineResult> {
  const { png, width, height } = await srcToImagePayload(src);
  return postVtracer(png, width, height, params);
}

export async function runVtracerFromPixels(
  pixels: VectorLinePixels,
  params: VectorLineParams,
  mask?: Uint8Array | null
): Promise<VectorLineResult> {
  const prepared = prepareImageDataForVtracer(pixels.imageData, params, mask);
  const result = await postVtracer(
    imageDataToPngDataUrl(prepared),
    pixels.width,
    pixels.height,
    params
  );
  return { ...result, bitmap: prepared };
}
