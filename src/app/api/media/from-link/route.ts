import { NextRequest } from "next/server";
import { downloadResolvedMedia, resolveCobaltAudio } from "@/lib/media/cobalt";
import { fetchMediaViaGenDownload, gendownloadDisabled } from "@/lib/media/gendownload";
import { parsePublicHttpsUrl } from "@/lib/media/source-url";
import { extractAudioViaYtdlp, ytdlpWorkerConfigured } from "@/lib/media/ytdlp-worker";
import { extractAudioBuffer } from "@/lib/media/ffmpeg-audio";
import { respErr } from "@/lib/resp";

export const maxDuration = 120;
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { url?: string };
    const parsed = parsePublicHttpsUrl(body?.url || "");
    const source = parsed.toString();

    const file = await fetchLinkAudio(source);

    const filename = sanitizeFilename(file.filename);
    return new Response(new Uint8Array(file.buf), {
      status: 200,
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Media-Filename": filename,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not fetch audio from that link.";
    return respErr(message);
  }
}

async function fetchLinkAudio(source: string) {
  let lastError: unknown;

  if (!gendownloadDisabled()) {
    try {
      return await fromGenDownload(source);
    } catch (e) {
      lastError = e;
      console.warn("[from-link] gendownload failed:", e);
    }
  }

  if (ytdlpWorkerConfigured()) {
    try {
      return await extractAudioViaYtdlp(source);
    } catch (e) {
      lastError = e;
      console.warn("[from-link] ytdlp failed:", e);
    }
  }
  try {
    return await fromCobalt(source);
  } catch (e) {
    lastError = e;
    console.warn("[from-link] cobalt failed:", e);
  }

  const msg =
    lastError instanceof Error ? lastError.message : "Could not fetch audio";
  throw new Error(
    `${msg} (Use POST /api/media/transcribe with sourceUrl for GenDownload + Gladia fallback.)`,
  );
}

async function fromGenDownload(source: string) {
  const fetched = await fetchMediaViaGenDownload(source);
  const audio = await extractAudioBuffer({
    buf: fetched.buf,
    filename: fetched.filename,
    contentType: fetched.contentType,
  });
  return {
    buf: audio.buf,
    contentType: audio.contentType,
    filename: audio.filename,
  };
}

async function fromCobalt(source: string) {
  const resolved = await resolveCobaltAudio(source);
  const file = await downloadResolvedMedia(resolved.url);
  return { ...file, filename: resolved.filename };
}

function sanitizeFilename(name: string) {
  const base = name.replace(/[/\\?%*:|"<>]/g, "-").trim() || "audio.mp3";
  return base.slice(0, 180);
}
