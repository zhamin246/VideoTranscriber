import { NextRequest } from "next/server";
import { respData, respErr } from "@/lib/resp";
import { answerAsk, streamAsk, type AskSseEvent } from "@/lib/media/ask";
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

async function resolveAskContext(body: {
  workspaceId?: string;
  title?: string;
  durationSeconds?: number | null;
  transcript?: Segment[];
}): Promise<{
  title: string;
  durationSeconds: number | null;
  segments: Segment[];
} | Response> {
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
    return respErr("Transcript required to ask AI");
  }

  return { title, durationSeconds, segments };
}

function encodeSse(event: AskSseEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}

/**
 * POST /api/media/ask
 * Body: { workspaceId?, title?, durationSeconds?, transcript?, question, history?, stream? }
 * When stream:true → text/event-stream with {type:delta|done|error}
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
      question?: string;
      history?: Array<{ role: "user" | "assistant"; content: string }>;
      stream?: boolean;
    } | null;

    if (!body) return respErr("Invalid JSON body");

    const question = String(body.question || "").trim();
    if (!question) return respErr("Question is required");

    const resolved = await resolveAskContext(body);
    if (resolved instanceof Response) return resolved;

    const { title, durationSeconds, segments } = resolved;
    const history = Array.isArray(body.history) ? body.history : [];
    const wantStream = body.stream === true;

    if (!wantStream) {
      const answer = await answerAsk({
        title,
        durationSeconds,
        segments,
        history,
        question,
        signal: req.signal,
      });
      return respData({ answer });
    }

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          let produced = false;
          for await (const text of streamAsk({
            title,
            durationSeconds,
            segments,
            history,
            question,
            signal: req.signal,
          })) {
            if (!text) continue;
            produced = true;
            controller.enqueue(encodeSse({ type: "delta", text }));
          }
          if (!produced) {
            controller.enqueue(
              encodeSse({ type: "error", message: "Empty answer from model" }),
            );
          } else {
            controller.enqueue(encodeSse({ type: "done" }));
          }
        } catch (e) {
          if (e instanceof Error && e.name === "AbortError") {
            controller.enqueue(encodeSse({ type: "done" }));
          } else {
            console.error("ask stream failed:", e);
            controller.enqueue(
              encodeSse({
                type: "error",
                message:
                  e instanceof Error ? e.message : "Failed to ask AI",
              }),
            );
          }
        } finally {
          try {
            controller.close();
          } catch {
            // already closed
          }
        }
      },
      cancel() {
        // client aborted — AbortSignal on req handles upstream cancel
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e) {
    console.error("ask failed:", e);
    return respErr(e instanceof Error ? e.message : "Failed to ask AI");
  }
}
