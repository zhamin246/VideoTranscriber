import { promises as fs } from "fs";
import path from "path";
import { getConvertSample } from "./samples";
import type { GrayImage } from "./vectorize";

const FETCH_TIMEOUT_MS = 25_000;

const MAX_TRACE_EDGE = 1800;

export async function loadGrayImage(input: {
  image?: string;
  sampleId?: string;
}): Promise<GrayImage> {
  const buffer = await readImageBuffer(input);
  const sharp = (await import("sharp")).default;
  const { data, info } = await sharp(buffer)
    .rotate()
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.channels !== 1) {
    throw new Error("Failed to decode a grayscale image");
  }
  return {
    width: info.width,
    height: info.height,
    gray: new Uint8Array(data),
  };
}

/** PNG bytes for VTracer `convertBuffer`, matching the official web decoder. */
export async function loadTracePng(input: {
  image?: string;
  sampleId?: string;
}): Promise<{ png: Buffer; width: number; height: number }> {
  const buffer = await readImageBuffer(input);
  const sharp = (await import("sharp")).default;
  const meta = await sharp(buffer).rotate().metadata();
  const width = meta.width || 0;
  const height = meta.height || 0;
  if (!width || !height) throw new Error("Could not read image size");

  const edge = Math.max(width, height);
  let pipeline = sharp(buffer).rotate();
  if (edge > MAX_TRACE_EDGE) {
    pipeline = pipeline.resize({
      width: MAX_TRACE_EDGE,
      height: MAX_TRACE_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    });
  }
  const png = await pipeline.png().toBuffer();
  const out = await sharp(png).metadata();
  return {
    png,
    width: out.width || width,
    height: out.height || height,
  };
}

async function readImageBuffer(input: {
  image?: string;
  sampleId?: string;
}): Promise<Buffer> {
  const sample = getConvertSample(input.sampleId);
  const src = sample ? sample.vectorUrl : String(input.image || "").trim();
  if (!src) throw new Error("image or sampleId is required");

  if (src.startsWith("data:image/")) {
    const comma = src.indexOf(",");
    if (comma < 0) throw new Error("Invalid data URL");
    return Buffer.from(src.slice(comma + 1), "base64");
  }

  if (src.startsWith("/")) {
    return readPublicPath(src);
  }

  if (/^https?:\/\//i.test(src)) {
    const res = await fetch(src, {
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Could not fetch line art (${res.status})`);
    return Buffer.from(await res.arrayBuffer());
  }

  throw new Error("image must be a public path, https URL, or data URL");
}

async function readPublicPath(publicUrl: string) {
  const rel = publicUrl.replace(/^\/+/, "");
  if (rel.includes("..")) throw new Error("Invalid image path");
  const file = path.join(process.cwd(), "public", rel);
  return fs.readFile(file);
}
