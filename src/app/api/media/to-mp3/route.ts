import { NextRequest } from "next/server";
import { extractAudioBuffer } from "@/lib/media/ffmpeg-audio";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/media/to-mp3
 * Convert recorded/uploaded audio (webm/ogg/…) → audio/mpeg for Whisper + My files.
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof Blob) || !file.size) {
      return Response.json(
        { code: -1, message: "file required" },
        { status: 400 },
      );
    }

    const filename =
      (file instanceof File && file.name) ||
      String(form.get("filename") || "recording.webm");
    const contentType =
      (file instanceof File && file.type) ||
      file.type ||
      "application/octet-stream";

    const buf = Buffer.from(await file.arrayBuffer());
    const audio = await extractAudioBuffer({
      buf,
      filename,
      contentType,
    });

    const base =
      filename.replace(/\.[^.]+$/i, "").replace(/[/\\?%*:|"<>]/g, "-").slice(0, 80) ||
      "recording";
    const outName = `${base}.mp3`;

    return new Response(new Uint8Array(audio.buf), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="${outName}"`,
        "Cache-Control": "no-store",
        "X-Filename": outName,
      },
    });
  } catch (e) {
    console.error("to-mp3 failed:", e);
    return Response.json(
      {
        code: -1,
        message: e instanceof Error ? e.message : "Could not convert to mp3",
      },
      { status: 500 },
    );
  }
}
