/**
 * Ask AI — chat over a workspace transcript (videotranscriber.ai style).
 */

import { llmChat, llmChatStream, type LlmMessage } from "@/lib/llm";
import {
  buildTranscriptBlocks,
  formatTimestamp,
  type TranscriptSegment,
} from "@/lib/media/workspace-mock";

export type AskMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

export type AskSseEvent =
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

export const ASK_SUGGESTIONS = [
  {
    emoji: "💡",
    text: "List 3 core points and their supporting arguments.",
  },
  {
    emoji: "✨",
    text: "What are the innovative aspects of this content?",
  },
  {
    emoji: "🎯",
    text: "Briefly summarize the core content of the document.",
  },
  {
    emoji: "⚡",
    text: "List 5 key findings.",
  },
  {
    emoji: "🔑",
    text: "List 5 keywords and explain their meanings.",
  },
] as const;

export function createAskMessageId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function buildAskScript(
  segments: TranscriptSegment[],
  maxChars = 28_000,
): string {
  const blocks = buildTranscriptBlocks(segments, 30);
  const lines: string[] = [];
  let size = 0;
  for (const b of blocks) {
    const text = b.sentences.map((s) => s.text).join("");
    const line = `[${formatTimestamp(b.startSeconds)}] ${text}`;
    if (size + line.length + 1 > maxChars) {
      lines.push("[…transcript truncated…]");
      break;
    }
    lines.push(line);
    size += line.length + 1;
  }
  return lines.join("\n");
}

export async function answerAsk(opts: {
  title?: string;
  durationSeconds?: number | null;
  segments: TranscriptSegment[];
  /** Prior turns (user/assistant), excluding the new question if already appended. */
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  question: string;
  signal?: AbortSignal;
}): Promise<string> {
  const messages = buildAskMessages(opts);
  const { text } = await llmChat({
    messages,
    includeThoughts: false,
    signal: opts.signal,
  });

  const answer = text.trim();
  if (!answer) throw new Error("Empty answer from model");
  return answer;
}

/** Stream Ask AI answer as text deltas (for SSE proxy). */
export async function* streamAsk(opts: {
  title?: string;
  durationSeconds?: number | null;
  segments: TranscriptSegment[];
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  question: string;
  signal?: AbortSignal;
}): AsyncGenerator<string, void, unknown> {
  const messages = buildAskMessages(opts);
  for await (const delta of llmChatStream({
    messages,
    includeThoughts: false,
    signal: opts.signal,
  })) {
    if (delta) yield delta;
  }
}

function buildAskMessages(opts: {
  title?: string;
  durationSeconds?: number | null;
  segments: TranscriptSegment[];
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  question: string;
}): LlmMessage[] {
  const segments = opts.segments.filter((s) => s.text?.trim());
  if (!segments.length) {
    throw new Error("No transcript available to ask about");
  }
  const question = opts.question.trim();
  if (!question) {
    throw new Error("Question is required");
  }
  if (question.length > 5000) {
    throw new Error("Question is too long (max 5000 characters)");
  }

  const script = buildAskScript(segments);
  const durationLabel =
    typeof opts.durationSeconds === "number" && opts.durationSeconds > 0
      ? formatTimestamp(opts.durationSeconds)
      : "unknown";

  const system = `You are Video Transcriber AI, an assistant for one audio/video transcript.
Answer ONLY using the transcript below. If the transcript does not contain the answer, say so briefly.
Match the language of the user's question when possible; otherwise match the transcript language.
Be clear and helpful. Use short paragraphs or bullet lists when useful. Prefer Markdown (bold, lists).

Timestamps (required when citing moments):
- When you refer to a specific moment, include a bracket timestamp next to that claim using ONLY times that appear in the transcript brackets.
- Formats: [MM:SS], [HH:MM:SS], or a range [MM:SS~MM:SS] (tilde between start and end).
- Example: The speaker introduces the roadmap [00:32]. Later they cover pricing [03:14~05:02].
- Do NOT invent timestamps. If unsure of the exact time, omit the bracket rather than guessing.

Title: ${opts.title || "Untitled"}
Duration: ${durationLabel}

Transcript (~30s blocks):
${script}`;

  const history = (opts.history || [])
    .filter((m) => m.content?.trim() && (m.role === "user" || m.role === "assistant"))
    .slice(-12);

  return [
    { role: "system", content: system },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content.trim(),
    })),
    { role: "user", content: question },
  ];
}
