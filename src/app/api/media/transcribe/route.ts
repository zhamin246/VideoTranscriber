import { NextRequest } from "next/server";
import { prepareAndTranscribe } from "@/lib/media/prepare-transcribe";
import { respData, respErr } from "@/lib/resp";

export const runtime = "nodejs";
/** Download + ffmpeg + Whisper can take several minutes. */
export const maxDuration = 300;

const MAX_BYTES = 100 * 1024 * 1024;

/**
 * Unified pipeline:
 * file or sourceUrl → (download) → ffmpeg audio → R2 → Whisper
 *
 * YouTube / TikTok / Bilibili: audio only on R2; playback via iframe (no video on R2).
 * Instagram / Facebook / X / uploads: video on R2 for <video> when needed.
 */
export async function POST(req: NextRequest) {
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      return respErr("REPLICATE_API_TOKEN is not configured on the server");
    }

    const contentType = req.headers.get("content-type") || "";
    let file: File | null = null;
    let sourceUrl = "";
    let audioUrlLegacy = "";
    let workspaceId = "";
    let language = "auto";
    let separateSpeaker = false;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const raw = form.get("file");
      file = raw instanceof File ? raw : null;
      sourceUrl = String(form.get("sourceUrl") || form.get("url") || "").trim();
      audioUrlLegacy = String(form.get("audioUrl") || "").trim();
      workspaceId = String(form.get("workspaceId") || "").trim();
      language = String(form.get("language") || "auto").trim() || "auto";
      separateSpeaker = String(form.get("separateSpeaker") || "") === "true";
    } else {
      const body = (await req.json().catch(() => null)) as {
        sourceUrl?: string;
        url?: string;
        audioUrl?: string;
        workspaceId?: string;
        language?: string;
        separateSpeaker?: boolean;
      } | null;
      sourceUrl = String(body?.sourceUrl || body?.url || "").trim();
      audioUrlLegacy = String(body?.audioUrl || "").trim();
      workspaceId = String(body?.workspaceId || "").trim();
      language = String(body?.language || "auto").trim() || "auto";
      separateSpeaker = Boolean(body?.separateSpeaker);
    }

    if (file) {
      if (file.size <= 0) return respErr("Empty file");
      if (file.size > MAX_BYTES) {
        return respErr(
          "File is over 100 MB. Compress it or upload a shorter clip.",
        );
      }
    }

    // Prefer full prepare pipeline for file / page URL.
    // Legacy `audioUrl` alone still goes through prepare when it is a direct media URL
    // (download → ffmpeg → R2 → whisper) so Replicate never sees short-lived CDN links.
    const targetUrl = sourceUrl || audioUrlLegacy;
    if (!file && !targetUrl) {
      return respErr("Provide a file upload or sourceUrl");
    }

    const result = await prepareAndTranscribe({
      workspaceId,
      sourceUrl: file ? undefined : targetUrl,
      file: file || undefined,
      filename: file?.name,
      language,
      separateSpeaker,
    });

    return respData(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Transcription failed";
    console.error("[transcribe]", e);
    return respErr(message);
  }
}
