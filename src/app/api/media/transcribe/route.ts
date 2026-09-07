import { NextRequest } from "next/server";
import { prepareAndTranscribe } from "@/lib/media/prepare-transcribe";
import {
  formatMaxUploadLabel,
  MAX_UPLOAD_BYTES,
} from "@/lib/convert/pending-upload";
import { creditEvents } from "@/lib/events";
import { respData, respErr } from "@/lib/resp";
import {
  assertCanStartTranscription,
  billableMinutes,
  PlanLimitError,
} from "@/services/plan";
import { consumeTranscriptionMinutes } from "@/services/credit";
import { getUserUuid } from "@/services/user";

export const runtime = "nodejs";
/** Download + ffmpeg + Whisper can take several minutes. */
export const maxDuration = 300;

/**
 * Unified pipeline:
 * file or sourceUrl → (download) → ffmpeg MP3 → R2 → Whisper
 *
 * Local uploads: extract audio only — never store the raw video on R2.
 * YouTube / TikTok / Bilibili: audio only on R2; playback via iframe.
 * Instagram / Facebook / X: may store resolved video on R2 for <video>.
 *
 * Requires sign-in. Enforces free daily file limit + minute balance; debits minutes after success.
 */
export async function POST(req: NextRequest) {
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      return respErr("REPLICATE_API_TOKEN is not configured on the server");
    }

    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("Please sign in to transcribe");
    }

    const contentType = req.headers.get("content-type") || "";
    let file: File | null = null;
    let sourceUrl = "";
    let audioUrlLegacy = "";
    let workspaceId = "";
    let language = "auto";
    let separateSpeaker = false;
    let durationSeconds: number | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const raw = form.get("file");
      file = raw instanceof File ? raw : null;
      sourceUrl = String(form.get("sourceUrl") || form.get("url") || "").trim();
      audioUrlLegacy = String(form.get("audioUrl") || "").trim();
      workspaceId = String(form.get("workspaceId") || "").trim();
      language = String(form.get("language") || "auto").trim() || "auto";
      separateSpeaker = String(form.get("separateSpeaker") || "") === "true";
      const dur = Number(form.get("durationSeconds"));
      durationSeconds = Number.isFinite(dur) && dur > 0 ? dur : null;
    } else {
      const body = (await req.json().catch(() => null)) as {
        sourceUrl?: string;
        url?: string;
        audioUrl?: string;
        workspaceId?: string;
        language?: string;
        separateSpeaker?: boolean;
        durationSeconds?: number | null;
      } | null;
      sourceUrl = String(body?.sourceUrl || body?.url || "").trim();
      audioUrlLegacy = String(body?.audioUrl || "").trim();
      workspaceId = String(body?.workspaceId || "").trim();
      language = String(body?.language || "auto").trim() || "auto";
      separateSpeaker = Boolean(body?.separateSpeaker);
      const dur = Number(body?.durationSeconds);
      durationSeconds = Number.isFinite(dur) && dur > 0 ? dur : null;
    }

    if (file) {
      if (file.size <= 0) return respErr("Empty file");
      if (file.size > MAX_UPLOAD_BYTES) {
        return respErr(
          `File is over ${formatMaxUploadLabel()}. Compress it or upload a shorter clip.`,
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

    await assertCanStartTranscription(user_uuid, { durationSeconds });

    const result = await prepareAndTranscribe({
      workspaceId,
      sourceUrl: file ? undefined : targetUrl,
      file: file || undefined,
      filename: file?.name,
      language,
      separateSpeaker,
    });

    const minutes = billableMinutes(durationSeconds, result.segments);
    try {
      await consumeTranscriptionMinutes(
        user_uuid,
        result.workspaceId,
        minutes,
      );
      creditEvents.emit("creditsUpdated");
    } catch (e) {
      // Transcription already succeeded — don't discard it on a rare race.
      console.error("[transcribe] minute debit failed:", e);
    }

    return respData({
      ...result,
      minutesCharged: minutes,
    });
  } catch (e) {
    if (e instanceof PlanLimitError) {
      return respErr(e.message);
    }
    const message = e instanceof Error ? e.message : "Transcription failed";
    console.error("[transcribe]", e);
    return respErr(message);
  }
}
