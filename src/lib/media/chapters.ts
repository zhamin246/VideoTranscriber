/**
 * AI chapter outline for workspace Chapter tab (videotranscriber.ai style).
 * Accordion rows: timestamp + title + expandable summary.
 * Timestamps must track real video topic shifts (not Whisper 1–2s chunks).
 * Uses Kie Gemini 2.5 Flash via `@/lib/llm`.
 */

import {
  llmText,
  parseJsonFromModelText,
} from "@/lib/llm";
import {
  buildTranscriptBlocks,
  formatTimestamp,
  type TranscriptSegment,
} from "@/lib/media/workspace-mock";

export type ChapterItem = {
  startSeconds: number;
  title: string;
  /** Short paragraph shown when the accordion row is expanded. */
  summary: string;
};

export function chaptersAreComplete(chapters: ChapterItem[] | null | undefined) {
  return Boolean(
    chapters?.length &&
      chapters.every((c) => c.title?.trim() && c.summary?.trim()),
  );
}

/** Reject collapsed timelines like 00:00 / 00:02 / 00:03 on a 17‑minute video. */
export function chaptersHaveValidTimeline(
  chapters: ChapterItem[] | null | undefined,
  durationSeconds: number | null | undefined,
): boolean {
  if (!chaptersAreComplete(chapters)) return false;
  const list = chapters!;
  const dur =
    typeof durationSeconds === "number" && durationSeconds > 0
      ? durationSeconds
      : list[list.length - 1]?.startSeconds || 0;

  if (list.length >= 2) {
    const gaps: number[] = [];
    for (let i = 1; i < list.length; i++) {
      gaps.push(list[i]!.startSeconds - list[i - 1]!.startSeconds);
    }
    const median = [...gaps].sort((a, b) => a - b)[Math.floor(gaps.length / 2)] ?? 0;
    // Chapters should be minutes-apart for long videos, never 1–3s like STT chunks
    if (dur >= 120 && median < 20) return false;
    if (dur >= 60 && median < 8) return false;
  }

  const last = list[list.length - 1]!.startSeconds;
  // Must reach well into the video (competitor spreads across full length)
  if (dur >= 180 && last < dur * 0.4) return false;
  if (dur >= 60 && last < dur * 0.25) return false;

  return true;
}

function inferDuration(segments: TranscriptSegment[], hint?: number | null) {
  if (typeof hint === "number" && hint > 0) return hint;
  let max = 0;
  for (const s of segments) {
    if (s.startSeconds > max) max = s.startSeconds;
  }
  return max > 0 ? max + 30 : null;
}

/** Coarse ~30s blocks so the model cannot latch onto 1–2s Whisper chunk times. */
function buildChapterScript(
  segments: TranscriptSegment[],
  maxChars = 24_000,
): { script: string; anchors: number[] } {
  const blocks = buildTranscriptBlocks(segments, 30);
  const anchors = blocks.map((b) => b.startSeconds);
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
  if (!anchors.includes(0)) anchors.unshift(0);
  return { script: lines.join("\n"), anchors };
}

function snapToAnchor(seconds: number, anchors: number[]): number {
  if (!anchors.length) return Math.max(0, seconds);
  let best = anchors[0]!;
  let bestDist = Math.abs(best - seconds);
  for (const a of anchors) {
    const d = Math.abs(a - seconds);
    if (d < bestDist) {
      best = a;
      bestDist = d;
    }
  }
  return best;
}

function parseStartSeconds(r: Record<string, unknown>): number {
  let start =
    typeof r.startSeconds === "number"
      ? r.startSeconds
      : typeof r.start === "number"
        ? r.start
        : typeof r.start_time === "number"
          ? r.start_time
          : NaN;

  if (!Number.isFinite(start) && typeof r.timestamp === "string") {
    const m = r.timestamp.trim().match(/^(?:(\d+):)?(\d{1,2}):(\d{2})$/);
    if (m) {
      const h = m[1] ? Number(m[1]) : 0;
      start = h * 3600 + Number(m[2]) * 60 + Number(m[3]);
    }
  }
  // Model sometimes returns mm:ss as "minutes.seconds" floats wrongly — ignore
  return Number.isFinite(start) ? start : NaN;
}

function normalizeChapters(
  raw: unknown,
  durationSeconds: number | null,
  anchors: number[],
): ChapterItem[] {
  const list = Array.isArray(raw)
    ? raw
    : raw &&
        typeof raw === "object" &&
        Array.isArray((raw as { chapters?: unknown }).chapters)
      ? (raw as { chapters: unknown[] }).chapters
      : [];

  const max =
    typeof durationSeconds === "number" && durationSeconds > 0
      ? durationSeconds
      : Number.POSITIVE_INFINITY;

  const out: ChapterItem[] = [];
  for (const row of list) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const title = String(r.title || r.heading || r.name || "").trim();
    const summary = String(
      r.summary || r.body || r.description || r.content || "",
    ).trim();
    if (!title || !summary) continue;

    let start = parseStartSeconds(r);
    if (!Number.isFinite(start)) continue;
    start = Math.max(0, Math.min(max === Infinity ? start : max, start));
    start = snapToAnchor(start, anchors);
    out.push({
      startSeconds: Math.round(start),
      title,
      summary,
    });
  }

  out.sort((a, b) => a.startSeconds - b.startSeconds);

  // Enforce increasing times after snap (skip duplicates)
  const deduped: ChapterItem[] = [];
  for (const c of out) {
    const prev = deduped[deduped.length - 1];
    if (prev && c.startSeconds <= prev.startSeconds) continue;
    deduped.push(c);
  }
  return deduped;
}

/**
 * If the model still collapses times, keep titles/summaries but spread starts
 * across the real video using ~equal windows snapped to transcript anchors.
 */
function redistributeTimeline(
  chapters: ChapterItem[],
  durationSeconds: number,
  anchors: number[],
): ChapterItem[] {
  if (chapters.length < 2 || !(durationSeconds > 0)) return chapters;
  const n = chapters.length;
  const span = Math.max(durationSeconds - 15, durationSeconds * 0.9);
  return chapters.map((ch, i) => {
    const ideal = i === 0 ? 0 : (span * i) / (n - 1);
    return {
      ...ch,
      startSeconds: Math.round(snapToAnchor(ideal, anchors)),
    };
  });
}

/**
 * Generate chapter TOC with expandable summaries (competitor Chapter tab).
 */
export async function generateChapters(opts: {
  title?: string;
  durationSeconds?: number | null;
  segments: TranscriptSegment[];
  signal?: AbortSignal;
}): Promise<ChapterItem[]> {
  const segments = opts.segments.filter((s) => s.text?.trim());
  if (!segments.length) {
    throw new Error("No transcript available to generate chapters");
  }

  const durationSeconds = inferDuration(segments, opts.durationSeconds);
  const { script, anchors } = buildChapterScript(segments);
  const durationLabel =
    durationSeconds && durationSeconds > 0
      ? formatTimestamp(durationSeconds)
      : "unknown";

  const system = `You create YouTube-style chapter outlines for videos, matching videotranscriber.ai Chapter UI.
Return ONLY valid JSON (no markdown fences) with this shape:
{"chapters":[{"startSeconds":0,"title":"Short topic title","summary":"2–4 sentence overview of what is said in this chapter"},...]}

CRITICAL — startSeconds is video playback time in SECONDS from the start of the media:
- Use ONLY the bracket timestamps from the transcript (e.g. [00:00], [00:32], [03:14] → 0, 32, 194).
- Spread chapters across the FULL video (last chapter near the end, not all in the first 10 seconds).
- Typical gap between chapters is 30–120 seconds on a multi-minute video. NEVER use 1–5 second gaps.
- First chapter starts at 0.
- title: concise (3–10 words).
- summary: readable paragraph (~40–80 words) of that chapter’s points — not raw transcript dump.
- Same language as the transcript for title and summary.
- Every chapter MUST include title and summary.`;

  const prompt = `Title: ${opts.title || "Untitled"}
Video duration: ${durationLabel} (${durationSeconds ? Math.round(durationSeconds) : "?"} seconds total).
Allowed startSeconds anchors (seconds): ${anchors.slice(0, 80).join(", ")}${anchors.length > 80 ? ", …" : ""}

Transcript (each line is a ~30s block — pick chapter starts from these times):
${script}`;

  const text = await llmText({
    system,
    prompt,
    includeThoughts: false,
    signal: opts.signal,
  });

  const parsed = parseJsonFromModelText<unknown>(text);
  let chapters = normalizeChapters(parsed, durationSeconds, anchors);
  if (!chapters.length) {
    throw new Error("Model returned no chapters");
  }

  if (
    durationSeconds &&
    !chaptersHaveValidTimeline(chapters, durationSeconds)
  ) {
    chapters = redistributeTimeline(chapters, durationSeconds, anchors);
    // Re-dedupe after redistribute
    const fixed: ChapterItem[] = [];
    for (const c of chapters) {
      const prev = fixed[fixed.length - 1];
      if (prev && c.startSeconds <= prev.startSeconds) {
        // nudge to next unused anchor after prev
        const next =
          anchors.find((a) => a > prev.startSeconds + 15) ??
          c.startSeconds + 30;
        fixed.push({ ...c, startSeconds: Math.round(next) });
      } else {
        fixed.push(c);
      }
    }
    chapters = fixed;
  }

  if (!chaptersHaveValidTimeline(chapters, durationSeconds) && durationSeconds) {
    // Still bad — force even spread from titles
    chapters = redistributeTimeline(chapters, durationSeconds, anchors);
  }

  return chapters;
}
