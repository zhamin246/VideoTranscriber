import Replicate from "replicate";

/** Pinned version — community model; pin to avoid breaking input/output changes. */
export const DOWNLOAD_MEDIA_MODEL =
  "mptamilselvan/download-media:e2fece7512a3969f839ec06a1a7211370f4f41db70a86c3fb7a7c58d0371ecf4";

const MAX_BYTES = 80 * 1024 * 1024;

function getClient() {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new Error("REPLICATE_API_TOKEN is not configured");
  }
  return new Replicate({ auth: token });
}

function extractOutputUrl(output: unknown): string {
  if (typeof output === "string" && /^https?:\/\//i.test(output)) {
    return output;
  }
  if (Array.isArray(output) && output.length) {
    return extractOutputUrl(output[0]);
  }
  if (output && typeof output === "object") {
    const o = output as {
      url?: string | (() => string);
      href?: string;
    };
    if (typeof o.url === "function") {
      const u = o.url();
      if (u) return u;
    }
    if (typeof o.url === "string" && o.url) return o.url;
    if (typeof o.href === "string" && o.href) return o.href;
  }
  throw new Error("Replicate download-media returned no media URL");
}

function guessFilename(url: string, contentType: string) {
  try {
    const path = new URL(url).pathname.split("/").pop() || "";
    if (path && /\.[a-z0-9]{2,5}$/i.test(path)) return path.slice(0, 120);
  } catch {
    /* ignore */
  }
  if (/audio\//i.test(contentType)) return "audio.mp3";
  if (/webm/i.test(contentType)) return "media.webm";
  if (/mp4|mpeg/i.test(contentType)) return "video.mp4";
  return "media.bin";
}

/**
 * Last-resort (and YouTube-first) media fetch via Replicate download-media.
 * Returns raw bytes — caller still runs ffmpeg + R2.
 */
export async function downloadMediaViaReplicate(mediaUrl: string) {
  const replicate = getClient();
  const output = await replicate.run(DOWNLOAD_MEDIA_MODEL, {
    input: { media_url: mediaUrl },
  });
  const fileUrl = extractOutputUrl(output);
  const res = await fetch(fileUrl, { headers: { Accept: "*/*" } });
  if (!res.ok) {
    throw new Error(
      `Could not download Replicate media output (HTTP ${res.status})`,
    );
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.byteLength) {
    throw new Error("Replicate download-media returned an empty file");
  }
  if (buf.byteLength > MAX_BYTES) {
    throw new Error("That file is too large to process here.");
  }
  const contentType =
    res.headers.get("content-type") || "application/octet-stream";
  return {
    buf,
    contentType,
    filename: guessFilename(fileUrl, contentType),
  };
}
