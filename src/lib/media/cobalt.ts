export type CobaltOk = {
  url: string;
  filename: string;
};

type CobaltJson = {
  status?: string;
  url?: string;
  filename?: string;
  audio?: string | { format?: string };
  audioFilename?: string;
  tunnel?: string[];
  picker?: { type?: string; url?: string }[];
  output?: { filename?: string };
  error?: { code?: string; context?: { service?: string } };
};

function cobaltBase() {
  const raw = process.env.COBALT_API_URL || "https://cobalt.creatview.ai";
  return raw.replace(/\/+$/, "");
}

export function mapCobaltError(code?: string) {
  const c = (code || "").toLowerCase();
  let text = "Could not fetch audio from that link.";
  if (c.includes("auth")) text = "The media service rejected the request (auth).";
  else if (c.includes("invalid_body") || c.includes("link.invalid") || c.endsWith("url.invalid")) {
    text = "That link is not a supported media URL.";
  } else if (c.includes("unavailable") || c.includes("private")) {
    text = "This video is private, region-locked, or no longer available.";
  } else if (c.includes("token") || c.includes("po_token") || c.includes("youtube")) {
    text = "YouTube blocked the request. Try again later or upload the file.";
  } else if (c.includes("rate") || c.includes("limit")) {
    text = "Too many requests. Wait a moment and try again.";
  } else if (c.includes("unsupported") || c.includes("service.unsupported") || c.includes("disabled")) {
    text = "This platform is not supported on the media instance. Upload the file instead.";
  } else if (c.includes("timeout") || c.includes("fetch")) {
    text = "The media instance timed out fetching that page.";
  }
  return code ? `${text} (${code})` : `${text} Try another public URL or upload a file.`;
}

export async function resolveCobaltAudio(sourceUrl: string): Promise<CobaltOk> {
  return resolveCobalt(sourceUrl, "audio");
}

/** Prefer a playable video/audio URL for metadata probing. */
export async function resolveCobaltMedia(sourceUrl: string): Promise<CobaltOk> {
  try {
    return await resolveCobalt(sourceUrl, "auto");
  } catch {
    return resolveCobalt(sourceUrl, "audio");
  }
}

async function resolveCobalt(
  sourceUrl: string,
  downloadMode: "audio" | "auto",
): Promise<CobaltOk> {
  let res: Response;
  try {
    res = await fetch(`${cobaltBase()}/`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "video-transcriber/1.0",
      },
      body: JSON.stringify({
        url: sourceUrl,
        downloadMode,
        audioFormat: downloadMode === "audio" ? "mp3" : undefined,
        alwaysProxy: true,
        localProcessing: "disabled",
      }),
    });
  } catch {
    throw new Error(`Cannot reach the media instance (${cobaltBase()}).`);
  }

  const raw = await res.text();
  let data: CobaltJson = {};
  try {
    data = JSON.parse(raw) as CobaltJson;
  } catch {
    throw new Error(`Media service returned HTTP ${res.status}, not JSON.`);
  }

  if (!res.ok || data.status === "error") {
    throw new Error(mapCobaltError(data.error?.code));
  }

  const filename = data.filename || data.output?.filename || "media.bin";

  if ((data.status === "tunnel" || data.status === "redirect") && data.url) {
    return { url: data.url, filename };
  }

  if (data.status === "local-processing" && data.tunnel?.[0]) {
    return { url: data.tunnel[0], filename };
  }

  if (data.status === "picker") {
    if (typeof data.audio === "string") {
      return { url: data.audio, filename: data.audioFilename || filename };
    }
    const video = data.picker?.find((p) => p.type === "video" && p.url);
    if (video?.url) {
      return { url: video.url, filename };
    }
  }

  throw new Error(`Unexpected media response (${data.status || "empty"}).`);
}

const MAX_AUDIO_BYTES = 80 * 1024 * 1024;

export async function downloadResolvedMedia(fileUrl: string) {
  const res = await fetch(fileUrl, {
    headers: { Accept: "*/*" },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error("Could not download the audio from that link.");
  }
  const len = Number(res.headers.get("content-length") || 0);
  if (len > MAX_AUDIO_BYTES) {
    throw new Error("That file is too large to process here.");
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > MAX_AUDIO_BYTES) {
    throw new Error("That file is too large to process here.");
  }
  const contentType = res.headers.get("content-type") || "audio/mpeg";
  return { buf, contentType };
}
