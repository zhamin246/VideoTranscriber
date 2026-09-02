import { newStorage } from "@/lib/storage";
import type { CadGeometry } from "./geometry";

function sniffContentType(dataUrl: string): string {
  const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,/.exec(dataUrl);
  return m?.[1] || "image/jpeg";
}

function extForContentType(ct: string): string {
  if (ct.includes("png")) return "png";
  if (ct.includes("webp")) return "webp";
  if (ct.includes("gif")) return "gif";
  return "jpg";
}

async function imageSize(buffer: Buffer): Promise<{ width: number; height: number }> {
  const sharp = (await import("sharp")).default;
  const meta = await sharp(buffer).rotate().metadata();
  const width = meta.width || 0;
  const height = meta.height || 0;
  if (!width || !height) throw new Error("Could not read image size");
  return { width, height };
}

async function upload(key: string, body: Buffer | Uint8Array, contentType: string) {
  const storage = newStorage();
  const uploaded = await storage.uploadFile({
    body,
    key,
    contentType,
    disposition: "inline",
  });
  if (!uploaded?.url) throw new Error("Failed to upload to storage");
  return uploaded.url;
}

export async function persistOriginalImage(
  jobId: string,
  image: string
): Promise<{ url: string; width: number; height: number }> {
  const src = image.trim();

  if (src.startsWith("data:image/")) {
    const contentType = sniffContentType(src);
    const base64 = src.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
    const buffer = Buffer.from(base64, "base64");
    if (!buffer.length) throw new Error("Empty image payload");
    const ext = extForContentType(contentType);
    const size = await imageSize(buffer);
    const url = await upload(`convert/${jobId}/original.${ext}`, buffer, contentType);
    return { url, ...size };
  }

  if (/^https?:\/\//i.test(src)) {
    const res = await fetch(src, { cache: "no-store" });
    if (!res.ok) throw new Error(`Could not fetch original image (${res.status})`);
    const buffer = Buffer.from(await res.arrayBuffer());
    const size = await imageSize(buffer);
    const url = await upload(`convert/${jobId}/original.jpg`, buffer, "image/jpeg");
    return { url, ...size };
  }

  throw new Error("image must be a data URL or https URL");
}

export async function persistLineartFromUrl(jobId: string, sourceUrl: string): Promise<string> {
  const storage = newStorage();
  const uploaded = await storage.downloadAndUpload({
    url: sourceUrl,
    key: `convert/${jobId}/lineart.png`,
    contentType: "image/png",
  });
  if (!uploaded?.url) throw new Error("Failed to store line drawing");
  return uploaded.url;
}

export async function persistBytes(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  return upload(key, body, contentType);
}

export async function persistGeometryJson(jobId: string, geometry: CadGeometry): Promise<string> {
  const body = Buffer.from(JSON.stringify(geometry), "utf8");
  return upload(`convert/${jobId}/geometry.json`, body, "application/json");
}

export async function fetchGeometryJson(url: string): Promise<CadGeometry | null> {
  const src = (url || "").trim();
  if (!src) return null;
  const res = await fetch(src, { cache: "no-store" });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  if (!json || typeof json !== "object") return null;
  const g = json as CadGeometry;
  if (g.version !== 1 || g.units !== "mm" || !Array.isArray(g.paths)) return null;
  return g;
}
