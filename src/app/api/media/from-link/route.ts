import { NextRequest } from "next/server";
import { downloadResolvedMedia, resolveCobaltAudio } from "@/lib/media/cobalt";
import { parsePublicHttpsUrl } from "@/lib/media/source-url";
import { extractAudioViaYtdlp, ytdlpWorkerConfigured } from "@/lib/media/ytdlp-worker";
import { respErr } from "@/lib/resp";

export const maxDuration = 120;
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { url?: string };
    const parsed = parsePublicHttpsUrl(body?.url || "");
    const source = parsed.toString();

    const file = ytdlpWorkerConfigured()
      ? await extractAudioViaYtdlp(source)
      : await fromCobalt(source);

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

async function fromCobalt(source: string) {
  const resolved = await resolveCobaltAudio(source);
  const file = await downloadResolvedMedia(resolved.url);
  return { ...file, filename: resolved.filename };
}

function sanitizeFilename(name: string) {
  const base = name.replace(/[/\\?%*:|"<>]/g, "-").trim() || "audio.mp3";
  return base.slice(0, 180);
}
