import { downloadResolvedMedia } from "@/lib/media/cobalt";

export type GenDownloadFormat = {
  label?: string;
  type?: string;
  ext?: string;
  filesize?: number | null;
  url?: string;
};

export type GenDownloadExtract = {
  title?: string;
  thumbnail?: string;
  duration?: number;
  source?: string;
  author?: string;
  formats?: GenDownloadFormat[];
  error?: string;
  message?: string;
};

function gendownloadBase() {
  const raw = process.env.GENDOWNLOAD_API_URL || "https://gendownload.com";
  return raw.replace(/\/+$/, "");
}

export function gendownloadDisabled() {
  return process.env.GENDOWNLOAD_DISABLED === "true";
}

function sanitizeFilenamePart(title: string) {
  const base = title.replace(/[/\\?%*:|"<>]/g, "-").trim() || "media";
  return base.slice(0, 120);
}

/** Prefer audio; otherwise smallest video by filesize. */
export function pickGenDownloadFormat(formats: GenDownloadFormat[]) {
  const withUrl = formats.filter((f) => f.url?.trim());
  if (!withUrl.length) return null;

  const audio = withUrl.filter((f) => (f.type || "").toLowerCase() === "audio");
  if (audio.length) {
    audio.sort((a, b) => {
      const sa = a.filesize ?? Number.MAX_SAFE_INTEGER;
      const sb = b.filesize ?? Number.MAX_SAFE_INTEGER;
      return sa - sb;
    });
    return audio[0];
  }

  const video = withUrl.filter((f) => (f.type || "").toLowerCase() === "video");
  const pool = video.length ? video : withUrl;
  pool.sort((a, b) => {
    const sa = a.filesize ?? Number.MAX_SAFE_INTEGER;
    const sb = b.filesize ?? Number.MAX_SAFE_INTEGER;
    return sa - sb;
  });
  return pool[0];
}

export async function extractGenDownload(sourceUrl: string): Promise<GenDownloadExtract> {
  let res: Response;
  try {
    res = await fetch(`${gendownloadBase()}/api/extract`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "video-transcriber/1.0",
      },
      body: JSON.stringify({ url: sourceUrl }),
    });
  } catch {
    throw new Error(`Cannot reach GenDownload (${gendownloadBase()}).`);
  }

  const raw = await res.text();
  let data: GenDownloadExtract = {};
  try {
    data = JSON.parse(raw) as GenDownloadExtract;
  } catch {
    throw new Error(`GenDownload returned HTTP ${res.status}, not JSON.`);
  }

  if (!res.ok) {
    const msg =
      data.message || data.error || `GenDownload extract failed (HTTP ${res.status}).`;
    throw new Error(msg);
  }

  if (!data.formats?.length) {
    throw new Error("GenDownload returned no download formats for that URL.");
  }

  return data;
}

export async function fetchMediaViaGenDownload(sourceUrl: string): Promise<{
  buf: Buffer;
  contentType: string;
  filename: string;
  title: string | null;
  durationSeconds: number | null;
}> {
  const meta = await extractGenDownload(sourceUrl);
  const format = pickGenDownloadFormat(meta.formats || []);
  if (!format?.url) {
    throw new Error("GenDownload could not resolve a downloadable format.");
  }

  const { buf, contentType } = await downloadResolvedMedia(format.url);
  const ext = (format.ext || "bin").replace(/^\./, "");
  const title = meta.title?.trim() || null;
  const filename = `${sanitizeFilenamePart(title || "media")}.${ext}`;

  return {
    buf,
    contentType,
    filename,
    title,
    durationSeconds:
      typeof meta.duration === "number" && meta.duration > 0 ? meta.duration : null,
  };
}
