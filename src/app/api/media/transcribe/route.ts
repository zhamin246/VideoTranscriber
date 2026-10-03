import { NextRequest } from "next/server";

import { beginTranscription } from "@/lib/media/prepare-transcribe";

import {

  formatMaxUploadLabel,

  MAX_UPLOAD_BYTES,

} from "@/lib/convert/pending-upload";

import { persistTranscriptionResult } from "@/lib/media/finalize-transcription-save";

import {

  parseTranscribeMetaFromForm,

  parseTranscribeMetaFromJson,

  toWorkspaceMeta,

} from "@/lib/media/transcribe-request-meta";

import { respData, respErr } from "@/lib/resp";

import { assertCanStartTranscription, PlanLimitError } from "@/services/plan";

import { getUserUuid } from "@/services/user";



export const runtime = "nodejs";

/** Link: GenDownload → Replicate (sync) or Gladia fallback (poll). File: Replicate after R2. */

export const maxDuration = 300;



const WORKSPACE_ID_RE = /^[\w-]{8,64}$/;



/**

 * Unified pipeline:

 * file → ffmpeg MP3 → R2 → Replicate; links → GenDownload → R2 → Replicate, else Gladia

 *

 * Local uploads: extract audio only — never store the raw video on R2.

 * YouTube / TikTok / Bilibili: audio only on R2; playback via iframe.

 * Instagram / Facebook / X: may store resolved video on R2 for <video>.

 *

 * Requires sign-in. Enforces free daily file limit + minute balance; debits minutes after success.

 * Sync completions (Replicate) are saved to Postgres before returning `done`.

 */

export async function POST(req: NextRequest) {

  try {

    const user_uuid = await getUserUuid();

    if (!user_uuid) {

      return respErr("Please sign in to transcribe");

    }



    const gladiaOk = Boolean(

      process.env.GLADIA_API_KEY?.trim() || process.env.GLADIA_API_TOKEN?.trim(),

    );

    const replicateOk = Boolean(process.env.REPLICATE_API_TOKEN?.trim());



    const contentType = req.headers.get("content-type") || "";

    let file: File | null = null;

    let sourceUrl = "";

    let audioUrlLegacy = "";

    let workspaceId = "";

    let language = "auto";

    let separateSpeaker = false;

    let durationSeconds: number | null = null;

    let requestMeta = parseTranscribeMetaFromJson(null);



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

      requestMeta = parseTranscribeMetaFromForm(form);

    } else {

      const body = (await req.json().catch(() => null)) as Record<

        string,

        unknown

      > | null;

      sourceUrl = String(body?.sourceUrl || body?.url || "").trim();

      audioUrlLegacy = String(body?.audioUrl || "").trim();

      workspaceId = String(body?.workspaceId || "").trim();

      language = String(body?.language || "auto").trim() || "auto";

      separateSpeaker = Boolean(body?.separateSpeaker);

      const dur = Number(body?.durationSeconds);

      durationSeconds = Number.isFinite(dur) && dur > 0 ? dur : null;

      requestMeta = parseTranscribeMetaFromJson(body);

    }



    const targetUrl = sourceUrl || audioUrlLegacy;

    if (!requestMeta.pageUrl && targetUrl) {

      requestMeta = { ...requestMeta, pageUrl: targetUrl };

    }



    if (file && !replicateOk) {

      return respErr(

        "REPLICATE_API_TOKEN is required for file uploads and recordings",

      );

    }

    if (!file && !targetUrl) {

      return respErr("Provide a file upload or sourceUrl");

    }

    if (!file && !replicateOk && !gladiaOk) {

      return respErr(

        "Configure REPLICATE_API_TOKEN (GenDownload links) and/or GLADIA_API_KEY (fallback) for link transcription",

      );

    }



    if (file) {

      if (file.size <= 0) return respErr("Empty file");

      if (file.size > MAX_UPLOAD_BYTES) {

        return respErr(

          `File is over ${formatMaxUploadLabel()}. Compress it or upload a shorter clip.`,

        );

      }

    }



    await assertCanStartTranscription(user_uuid, { durationSeconds });



    const begun = await beginTranscription({

      workspaceId,

      sourceUrl: file ? undefined : targetUrl,

      file: file || undefined,

      filename: file?.name,

      language,

      separateSpeaker,

    });



    const resolvedWorkspaceId = begun.workspaceId || workspaceId;

    if (!WORKSPACE_ID_RE.test(resolvedWorkspaceId)) {

      return respErr("Invalid workspace id");

    }



    if (begun.status === "done") {

      const workspaceMeta = toWorkspaceMeta(requestMeta, {

        separateSpeaker,

        sourceLanguage: language,

        mediaKind: begun.mediaKind,

        playbackUrl: begun.playbackUrl,

      });



      let saveExtras: {

        minutesCharged: number;

        minutesDebitFailed: boolean;

        savedToDatabase: true;

      };

      try {

        saveExtras = await persistTranscriptionResult({

          userUuid: user_uuid,

          workspaceId: resolvedWorkspaceId,

          durationSeconds,

          provider: begun.provider,

          meta: workspaceMeta,

          result: {

            text: begun.text,

            segments: begun.segments,

            language: begun.language,

          },

          fallbackUrls: {

            playbackUrl: begun.playbackUrl,

            audioUrl: begun.audioUrl,

            sourceUrl: targetUrl,

          },

        });

      } catch (e) {

        console.error("[transcribe] save after sync transcript failed:", e);

        return respErr(

          e instanceof Error

            ? e.message

            : "Transcript was generated but could not be saved to My files.",

        );

      }



      return respData({

        status: "done",

        provider: begun.provider,

        workspaceId: resolvedWorkspaceId,

        audioUrl: begun.audioUrl,

        playbackUrl: begun.playbackUrl,

        mediaKind: begun.mediaKind,

        storage: begun.storage,

        mediaExpiresAt: begun.mediaExpiresAt,

        text: begun.text,

        segments: begun.segments,

        language: begun.language,

        minutesCharged: saveExtras.minutesCharged,

        minutesDebitFailed: saveExtras.minutesDebitFailed,

        savedToDatabase: true,

      });

    }



    return respData({

      status: "processing",

      provider: begun.provider,

      gladiaJobId: begun.gladiaJobId,

      workspaceId: resolvedWorkspaceId,

      audioUrl: begun.audioUrl,

      playbackUrl: begun.playbackUrl,

      mediaKind: begun.mediaKind,

      storage: begun.storage,

      mediaExpiresAt: begun.mediaExpiresAt,

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

