import { NextRequest } from "next/server";
import { respData, respErr } from "@/lib/resp";
import { generateMindMap } from "@/lib/media/mindmap";
import {
  getTranscriptByWorkspaceId,
  getWorkspaceByPublicId,
} from "@/models/workspace";

export const runtime = "nodejs";
export const maxDuration = 120;

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

/**
 * POST /api/media/mindmap
 * Body: { workspaceId?, title?, durationSeconds?, transcript? }
 */
export async function POST(req: NextRequest) {
  try {
    if (!process.env.KIE_API_KEY) {
      return respErr("KIE_API_KEY is not configured");
    }

    const body = (await req.json().catch(() => null)) as {
      workspaceId?: string;
      title?: string;
      durationSeconds?: number | null;
      transcript?: Segment[];
    } | null;

    if (!body) return respErr("Invalid JSON body");

    let title = String(body.title || "").trim();
    let durationSeconds =
      typeof body.durationSeconds === "number" ? body.durationSeconds : null;
    let segments: Segment[] = Array.isArray(body.transcript)
      ? body.transcript.filter((s) => s?.text)
      : [];

    const workspaceId = String(body.workspaceId || "").trim();
    if (workspaceId) {
      const row = await getWorkspaceByPublicId(workspaceId);
      if (!row || row.status === "deleted") {
        return respErr("Workspace not found");
      }
      title = title || row.title || "";
      if (durationSeconds == null && row.duration_seconds != null) {
        durationSeconds = row.duration_seconds;
      }
      if (!segments.length) {
        const tr = await getTranscriptByWorkspaceId(workspaceId);
        segments = parseSegments(tr?.segments_json);
      }
    }

    if (!segments.length) {
      return respErr("Transcript required to generate mind map");
    }

    const mindmap = await generateMindMap({
      title,
      durationSeconds,
      segments,
      signal: req.signal,
    });

    return respData({ mindmap });
  } catch (e) {
    console.error("mindmap failed:", e);
    return respErr(
      e instanceof Error ? e.message : "Failed to generate mind map",
    );
  }
}
