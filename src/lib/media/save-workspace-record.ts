import type { TranscriptSegment } from "@/lib/media/workspace-mock";
import { mediaExpiresAt } from "@/lib/media/r2-media";
import { upsertTranscript, upsertWorkspace } from "@/models/workspace";

const MAX_SEGMENTS_JSON = 1_500_000;
const MAX_TEXT = 500_000;

function segmentsJsonFrom(raw: TranscriptSegment[] | undefined): string {
  if (!Array.isArray(raw)) return "[]";
  const cleaned = raw
    .map((s) => {
      const out: TranscriptSegment = {
        startSeconds: Number(s?.startSeconds) || 0,
        text: String(s?.text || "").slice(0, 4000),
      };
      if (typeof s?.speaker === "number" && Number.isFinite(s.speaker)) {
        out.speaker = s.speaker;
      }
      return out;
    })
    .slice(0, 5000);
  const json = JSON.stringify(cleaned);
  return json.length > MAX_SEGMENTS_JSON
    ? json.slice(0, MAX_SEGMENTS_JSON)
    : json;
}

export type SaveWorkspaceRecordInput = {
  workspaceId: string;
  userUuid: string;
  url: string;
  playbackUrl?: string | null;
  thumbnailUrl?: string;
  title: string;
  platform?: string;
  youtubeId?: string | null;
  mediaKind?: string | null;
  durationSeconds?: number | null;
  sourceLanguage?: string;
  noteMode?: string;
  separateSpeaker?: boolean;
  detectedLanguage?: string | null;
  transcriptText?: string;
  transcript?: TranscriptSegment[];
  mediaExpiresAt?: Date | null;
  provider?: "gladia" | "supadata" | "replicate";
};

/** Upsert workspace + transcript in Postgres (My files source of truth). */
export async function saveWorkspaceRecord(input: SaveWorkspaceRecordInput) {
  const workspaceId = input.workspaceId.trim();
  const userUuid = input.userUuid.trim();
  if (!workspaceId || !userUuid) {
    throw new Error("workspaceId and signed-in user are required to save.");
  }

  const sourceUrl = (input.url || "").trim();
  const playbackUrl = (input.playbackUrl || "").trim();
  if (!sourceUrl && !playbackUrl) {
    throw new Error("url or playbackUrl is required to save.");
  }

  const expires = input.mediaExpiresAt ?? mediaExpiresAt();

  await upsertWorkspace({
    workspace_id: workspaceId,
    user_uuid: userUuid,
    source_url: sourceUrl.slice(0, 4000) || playbackUrl.slice(0, 4000),
    playback_url: playbackUrl.slice(0, 4000),
    thumbnail_url: (input.thumbnailUrl || "").slice(0, 4000),
    title: (input.title || "Untitled").slice(0, 512),
    platform: (input.platform || "Upload").slice(0, 64),
    youtube_id: (input.youtubeId || "").slice(0, 64),
    media_kind: (input.mediaKind || "").slice(0, 16),
    duration_seconds:
      typeof input.durationSeconds === "number" &&
      Number.isFinite(input.durationSeconds)
        ? Math.round(input.durationSeconds)
        : null,
    source_language: (input.sourceLanguage || "auto").slice(0, 32),
    note_mode: (input.noteMode || "smart_summary").slice(0, 64),
    separate_speaker: Boolean(input.separateSpeaker),
    detected_language: (input.detectedLanguage || "").slice(0, 32),
    status: "ready",
    media_expires_at: expires,
    updated_at: new Date(),
  });

  await upsertTranscript({
    workspace_id: workspaceId,
    text: (input.transcriptText || "").slice(0, MAX_TEXT),
    segments_json: segmentsJsonFrom(input.transcript),
    language: (input.detectedLanguage || "").slice(0, 32),
    provider:
      input.provider === "supadata"
        ? "supadata"
        : input.provider === "replicate"
          ? "replicate"
          : "gladia",
    updated_at: new Date(),
  });
}
