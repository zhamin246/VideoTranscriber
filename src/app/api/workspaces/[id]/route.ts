import { NextRequest } from "next/server";
import {
  getTranscriptByWorkspaceId,
  getWorkspaceByPublicId,
  updateWorkspaceAskMessages,
} from "@/models/workspace";
import { respData, respErr } from "@/lib/resp";
import {
  parseAskMessages,
  serializeAskMessages,
} from "@/lib/media/ask";

export const runtime = "nodejs";

type Segment = { startSeconds: number; text: string };

function parseSegments(raw: string | null | undefined): Segment[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((s) => {
        const seg = s as { startSeconds?: number; text?: string };
        return {
          startSeconds: Number(seg?.startSeconds) || 0,
          text: String(seg?.text || ""),
        };
      })
      .filter((s) => s.text);
  } catch {
    return [];
  }
}

/** GET /api/workspaces/:id — load one workspace + transcript + ask history */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const workspaceId = String(id || "").trim();
    if (!workspaceId) return respErr("id required");

    const row = await getWorkspaceByPublicId(workspaceId);
    if (!row || row.status === "deleted") {
      return respErr("Workspace not found");
    }

    const tr = await getTranscriptByWorkspaceId(workspaceId);
    return respData({
      id: row.workspace_id,
      url: row.source_url,
      playbackUrl: row.playback_url || null,
      title: row.title,
      thumbnailUrl: row.thumbnail_url,
      durationSeconds: row.duration_seconds,
      platform: row.platform,
      youtubeId: row.youtube_id || null,
      mediaKind: (row.media_kind as "audio" | "video" | "") || null,
      sourceLanguage: row.source_language,
      noteMode: row.note_mode,
      separateSpeaker: row.separate_speaker,
      createdAt: row.created_at?.getTime?.() || Date.now(),
      transcript: parseSegments(tr?.segments_json),
      transcriptText: tr?.text || "",
      detectedLanguage: row.detected_language || tr?.language || null,
      mediaExpiresAt: row.media_expires_at?.toISOString?.() || null,
      askMessages: parseAskMessages(row.ask_messages_json),
    });
  } catch (e) {
    console.error("get workspace failed:", e);
    return respErr(e instanceof Error ? e.message : "Failed to load workspace");
  }
}

/**
 * PATCH /api/workspaces/:id
 * Body: { askMessages?: AskMessage[] } — persist / clear Ask AI history
 */
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const workspaceId = String(id || "").trim();
    if (!workspaceId) return respErr("id required");

    const row = await getWorkspaceByPublicId(workspaceId);
    if (!row || row.status === "deleted") {
      return respErr("Workspace not found");
    }

    const body = (await req.json().catch(() => null)) as {
      askMessages?: unknown;
    } | null;
    if (!body || !("askMessages" in body)) {
      return respErr("askMessages required");
    }

    const json = serializeAskMessages(body.askMessages);
    const updated = await updateWorkspaceAskMessages(workspaceId, json);
    if (!updated) return respErr("Failed to update");

    return respData({
      id: workspaceId,
      askMessages: parseAskMessages(updated.ask_messages_json),
    });
  } catch (e) {
    console.error("patch workspace failed:", e);
    return respErr(
      e instanceof Error ? e.message : "Failed to update workspace",
    );
  }
}
