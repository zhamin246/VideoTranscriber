const MAX_AUDIO_BYTES = 80 * 1024 * 1024;

function workerBase() {
  const raw = process.env.YTDLP_WORKER_URL || "https://ytdlp.videotranscriber.pro";
  return raw.replace(/\/+$/, "");
}

export function ytdlpWorkerConfigured() {
  return Boolean(workerBase());
}

function workerHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = process.env.YTDLP_TOKEN?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export type YtdlpMediaInfo = {
  title?: string;
  duration?: number | null;
  thumbnail?: string;
  extractor?: string;
};

/** Metadata only — no media download. Best-effort; returns null on failure. */
export async function fetchMediaInfoViaYtdlp(
  sourceUrl: string,
): Promise<YtdlpMediaInfo | null> {
  const base = workerBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/info`, {
      method: "POST",
      headers: workerHeaders(),
      body: JSON.stringify({ url: sourceUrl }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as YtdlpMediaInfo & { error?: string };
    if (data.error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function extractAudioViaYtdlp(sourceUrl: string) {
  const base = workerBase();
  if (!base) {
    throw new Error("YTDLP_WORKER_URL is not set.");
  }

  let res: Response;
  try {
    res = await fetch(`${base}/extract`, {
      method: "POST",
      headers: workerHeaders(),
      body: JSON.stringify({ url: sourceUrl }),
    });
  } catch {
    throw new Error(`Cannot reach the yt-dlp worker (${base}).`);
  }

  const type = res.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error || "Could not fetch audio from that link.");
  }
  if (!res.ok) {
    throw new Error("Could not fetch audio from that link.");
  }

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > MAX_AUDIO_BYTES) {
    throw new Error("That file is too large to process here.");
  }
  const filename =
    filenameFromDisposition(res.headers.get("content-disposition")) || "audio.mp3";
  const contentType = res.headers.get("content-type") || "audio/mpeg";
  return { buf, contentType, filename };
}

function filenameFromDisposition(header: string | null) {
  if (!header) return "";
  const star = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (star?.[1]) return decodeURIComponent(star[1]);
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain?.[1] || "";
}
