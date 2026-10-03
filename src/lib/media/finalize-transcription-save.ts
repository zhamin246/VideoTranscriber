import { creditEvents } from "@/lib/events";
import { saveWorkspaceRecord } from "@/lib/media/save-workspace-record";
import type { WhisperResult } from "@/lib/media/whisper";
import { billableMinutes } from "@/services/plan";
import { consumeTranscriptionMinutes } from "@/services/credit";

export type TranscribeWorkspaceMeta = {
  url?: string;
  playbackUrl?: string | null;
  thumbnailUrl?: string;
  title?: string;
  platform?: string;
  youtubeId?: string | null;
  mediaKind?: string | null;
  sourceLanguage?: string;
  noteMode?: string;
  separateSpeaker?: boolean;
};

export function resolveWorkspaceSourceUrl(
  meta: TranscribeWorkspaceMeta | null | undefined,
  fallback?: {
    playbackUrl?: string | null;
    audioUrl?: string | null;
    sourceUrl?: string;
    workspaceId?: string;
  },
): string {
  const fromMeta = (meta?.url || meta?.playbackUrl || "").trim();
  if (fromMeta && !fromMeta.startsWith("blob:")) return fromMeta;
  const play = (fallback?.playbackUrl || fallback?.audioUrl || "").trim();
  if (play) return play;
  const src = (fallback?.sourceUrl || "").trim();
  if (src && !src.startsWith("blob:")) return src;
  const id = (fallback?.workspaceId || "").trim();
  return id ? `workspace:${id}` : "";
}

/**
 * Write workspace + transcript to Postgres and debit plan minutes.
 * Throws if DB save fails (Gladia credits already spent — still surface error to client).
 */
export async function persistTranscriptionResult(input: {
  userUuid: string;
  workspaceId: string;
  durationSeconds: number | null;
  provider: "gladia" | "supadata" | "replicate";
  meta: TranscribeWorkspaceMeta | null | undefined;
  result: WhisperResult;
  fallbackUrls?: {
    playbackUrl?: string | null;
    audioUrl?: string | null;
    sourceUrl?: string;
  };
}) {
  const sourceUrl = resolveWorkspaceSourceUrl(input.meta, {
    ...input.fallbackUrls,
    workspaceId: input.workspaceId,
  });
  if (!sourceUrl) {
    throw new Error(
      "Could not save transcript: missing page URL or playback URL.",
    );
  }

  const text = (input.result.text || "").trim();
  const segments = input.result.segments || [];
  if (!text && !segments.length) {
    throw new Error("Could not save an empty transcript.");
  }

  await saveWorkspaceRecord({
    workspaceId: input.workspaceId,
    userUuid: input.userUuid,
    url: sourceUrl,
    playbackUrl:
      input.meta?.playbackUrl ??
      input.fallbackUrls?.playbackUrl ??
      input.fallbackUrls?.audioUrl ??
      null,
    thumbnailUrl: input.meta?.thumbnailUrl || "",
    title: input.meta?.title || "Untitled",
    platform: input.meta?.platform || "Upload",
    youtubeId: input.meta?.youtubeId ?? null,
    mediaKind: input.meta?.mediaKind ?? null,
    durationSeconds: input.durationSeconds,
    sourceLanguage: input.meta?.sourceLanguage || "auto",
    noteMode: input.meta?.noteMode || "smart_summary",
    separateSpeaker: Boolean(input.meta?.separateSpeaker),
    detectedLanguage: input.result.language,
    transcriptText: text,
    transcript: segments,
    provider: input.provider,
  });

  const minutes = billableMinutes(input.durationSeconds, segments);
  let minutesDebitFailed = false;
  try {
    await consumeTranscriptionMinutes(
      input.userUuid,
      input.workspaceId,
      minutes,
    );
    creditEvents.emit("creditsUpdated");
  } catch (e) {
    minutesDebitFailed = true;
    console.error("[persistTranscriptionResult] minute debit failed:", e);
  }

  return {
    minutesCharged: minutes,
    minutesDebitFailed,
    savedToDatabase: true as const,
  };
}
