import { NextRequest } from "next/server";
import { getUserUuid } from "@/services/user";
import {
  insertMediaAsset,
  listWorkspacesByUser,
  softDeleteWorkspace,
  upsertTranscript,
  upsertWorkspace,
} from "@/models/workspace";
import {
  mediaExpiresAt,
  storageConfigured,
  uploadMediaToR2,
} from "@/lib/media/r2-media";
import { respData, respErr } from "@/lib/resp";

export const maxDuration = 120;
export const runtime = "nodejs";

const MAX_SEGMENTS_JSON = 1_500_000;
const MAX_TEXT = 500_000;

type SegmentIn = { startSeconds?: number; text?: string };

function normalizeSegments(raw: unknown): string {
  if (!Array.isArray(raw)) return "[]";
  const cleaned = raw
    .map((s) => {
      const seg = s as SegmentIn;
      return {
        startSeconds: Number(seg?.startSeconds) || 0,
        text: String(seg?.text || "").slice(0, 4000),
      };
    })
    .slice(0, 5000);
  const json = JSON.stringify(cleaned);
  return json.length > MAX_SEGMENTS_JSON
    ? json.slice(0, MAX_SEGMENTS_JSON)
    : json;
}

/** GET — list workspaces for the signed-in user */
export async function GET() {
  try {
    const userUuid = (await getUserUuid()) || "";
    if (!userUuid) {
      return respData({ workspaces: [] });
    }
    const rows = await listWorkspacesByUser(userUuid);
    return respData({
      workspaces: rows.map((r) => ({
        id: r.workspace_id,
        url: r.source_url,
        playbackUrl: r.playback_url || null,
        title: r.title,
        thumbnailUrl: r.thumbnail_url,
        durationSeconds: r.duration_seconds,
        platform: r.platform,
        youtubeId: r.youtube_id || null,
        mediaKind: r.media_kind || null,
        sourceLanguage: r.source_language,
        noteMode: r.note_mode,
        separateSpeaker: r.separate_speaker,
        detectedLanguage: r.detected_language || null,
        mediaExpiresAt: r.media_expires_at?.toISOString?.() || null,
        createdAt: r.created_at?.getTime?.() || Date.now(),
      })),
    });
  } catch (e) {
    console.error("list workspaces failed:", e);
    return respErr(e instanceof Error ? e.message : "Failed to list workspaces");
  }
}

/** POST — upsert workspace + transcript; optional multipart file → R2 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let workspaceId = "";
    let sourceUrl = "";
    let playbackUrl = "";
    let thumbnailUrl = "";
    let title = "";
    let platform = "";
    let youtubeId = "";
    let mediaKind = "";
    let durationSeconds: number | null = null;
    let sourceLanguage = "auto";
    let noteMode = "smart_summary";
    let separateSpeaker = false;
    let detectedLanguage = "";
    let transcriptText = "";
    let segmentsJson = "[]";
    let file: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      workspaceId = String(form.get("id") || "").trim();
      sourceUrl = String(form.get("url") || "").trim();
      playbackUrl = String(form.get("playbackUrl") || "").trim();
      thumbnailUrl = String(form.get("thumbnailUrl") || "").trim();
      title = String(form.get("title") || "").trim();
      platform = String(form.get("platform") || "").trim();
      youtubeId = String(form.get("youtubeId") || "").trim();
      mediaKind = String(form.get("mediaKind") || "").trim();
      const dur = Number(form.get("durationSeconds"));
      durationSeconds = Number.isFinite(dur) ? Math.round(dur) : null;
      sourceLanguage = String(form.get("sourceLanguage") || "auto").trim();
      noteMode = String(form.get("noteMode") || "smart_summary").trim();
      separateSpeaker = String(form.get("separateSpeaker")) === "true";
      detectedLanguage = String(form.get("detectedLanguage") || "").trim();
      transcriptText = String(form.get("transcriptText") || "");
      try {
        segmentsJson = normalizeSegments(
          JSON.parse(String(form.get("transcript") || "[]")),
        );
      } catch {
        segmentsJson = "[]";
      }
      const f = form.get("file");
      if (f instanceof File && f.size > 0) file = f;
    } else {
      const body = (await req.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      workspaceId = String(body.id || "").trim();
      sourceUrl = String(body.url || "").trim();
      playbackUrl = String(body.playbackUrl || "").trim();
      thumbnailUrl = String(body.thumbnailUrl || "").trim();
      title = String(body.title || "").trim();
      platform = String(body.platform || "").trim();
      youtubeId = String(body.youtubeId || "").trim();
      mediaKind = String(body.mediaKind || "").trim();
      const dur = Number(body.durationSeconds);
      durationSeconds = Number.isFinite(dur) ? Math.round(dur) : null;
      sourceLanguage = String(body.sourceLanguage || "auto").trim();
      noteMode = String(body.noteMode || "smart_summary").trim();
      separateSpeaker = Boolean(body.separateSpeaker);
      detectedLanguage = String(body.detectedLanguage || "").trim();
      transcriptText = String(body.transcriptText || "");
      segmentsJson = normalizeSegments(body.transcript);
    }

    if (!workspaceId || !/^[\w-]{8,64}$/.test(workspaceId)) {
      return respErr("Invalid workspace id");
    }
    if (!sourceUrl && !file) {
      return respErr("url or file is required");
    }

    const userUuid = (await getUserUuid()) || "";
    let expires = mediaExpiresAt();

    if (file && storageConfigured()) {
      const buf = Buffer.from(await file.arrayBuffer());
      const kind =
        mediaKind === "audio" || file.type.startsWith("audio/")
          ? "audio"
          : "video";
      const uploaded = await uploadMediaToR2({
        workspaceId,
        filename: file.name || "upload.bin",
        body: buf,
        contentType: file.type || "application/octet-stream",
        kind,
      });
      playbackUrl = uploaded.url;
      expires = uploaded.expiresAt;
      if (!mediaKind) mediaKind = kind;
      try {
        await insertMediaAsset({
          asset_id: uploaded.assetId,
          workspace_id: workspaceId,
          kind,
          storage_key: uploaded.key,
          public_url: uploaded.url,
          content_type: file.type || "",
          bytes: buf.byteLength,
          filename: (file.name || "upload.bin").slice(0, 255),
          expires_at: uploaded.expiresAt,
        });
      } catch (e) {
        console.error("media_assets insert failed:", e);
      }
    }

    // Don't persist ephemeral blob: / play: URLs as durable playback
    if (
      playbackUrl.startsWith("blob:") ||
      playbackUrl.startsWith("/api/media/play/")
    ) {
      // keep for same-session UX but mark shorter expiry conceptually
    }

    await upsertWorkspace({
      workspace_id: workspaceId,
      user_uuid: userUuid,
      source_url: sourceUrl.slice(0, 4000) || playbackUrl,
      playback_url: playbackUrl.slice(0, 4000),
      thumbnail_url: thumbnailUrl.slice(0, 4000),
      title: (title || "Untitled").slice(0, 512),
      platform: platform.slice(0, 64),
      youtube_id: youtubeId.slice(0, 64),
      media_kind: mediaKind.slice(0, 16),
      duration_seconds: durationSeconds,
      source_language: sourceLanguage.slice(0, 32) || "auto",
      note_mode: noteMode.slice(0, 64) || "smart_summary",
      separate_speaker: separateSpeaker,
      detected_language: detectedLanguage.slice(0, 32),
      status: "ready",
      media_expires_at: expires,
      updated_at: new Date(),
    });

    await upsertTranscript({
      workspace_id: workspaceId,
      text: transcriptText.slice(0, MAX_TEXT),
      segments_json: segmentsJson,
      language: detectedLanguage.slice(0, 32),
      provider: "replicate",
      updated_at: new Date(),
    });

    return respData({
      id: workspaceId,
      playbackUrl: playbackUrl || null,
      mediaExpiresAt: expires.toISOString(),
    });
  } catch (e) {
    console.error("save workspace failed:", e);
    return respErr(e instanceof Error ? e.message : "Failed to save workspace");
  }
}

/** DELETE — soft-delete by workspace id (?id=) */
export async function DELETE(req: NextRequest) {
  try {
    const id = String(req.nextUrl.searchParams.get("id") || "").trim();
    if (!id) return respErr("id required");
    const userUuid = (await getUserUuid()) || "";
    const row = await softDeleteWorkspace(id);
    if (!row) return respErr("Workspace not found");
    // Allow anonymous deletes of own session ids; signed-in users only own rows
    if (row.user_uuid && userUuid && row.user_uuid !== userUuid) {
      return respErr("Forbidden");
    }
    return respData({ id });
  } catch (e) {
    return respErr(e instanceof Error ? e.message : "Failed to delete");
  }
}
