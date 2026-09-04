import { formatDuration } from "@/lib/media/preview-types";

export type TranscriptSegment = {
  startSeconds: number;
  text: string;
};

export type TranscriptSentence = {
  startSeconds: number;
  endSeconds: number;
  text: string;
};

export type TranscriptBlock = {
  startSeconds: number;
  sentences: TranscriptSentence[];
};

/** Match videotranscriber.ai: ~30s display blocks, ~4–5s / ~24-char clickable sentences. */
export const TRANSCRIPT_DISPLAY_WINDOW_SECONDS = 30;
export const TRANSCRIPT_SENTENCE_TARGET_SECONDS = 4.5;
export const TRANSCRIPT_SENTENCE_TARGET_CHARS = 24;

function joinChunkTexts(parts: string[]) {
  return parts
    .map((p) => p.trim())
    .filter(Boolean)
    .reduce((acc, cur) => {
      if (!acc) return cur;
      if (/[\u4e00-\u9fff]$/.test(acc) && /^[\u4e00-\u9fff]/.test(cur)) {
        return acc + cur;
      }
      return `${acc} ${cur}`;
    }, "");
}

function endsSentence(text: string) {
  return /[。！？；.!?;]$/.test(text.trim());
}

/**
 * Collapse dense Whisper chunks into competitor-style clickable sentences
 * (~4.5s or ~24 chars, break early on punctuation).
 */
export function mergeIntoSentences(
  segments: TranscriptSegment[],
  opts?: { targetSeconds?: number; targetChars?: number },
): TranscriptSentence[] {
  const targetSeconds = opts?.targetSeconds ?? TRANSCRIPT_SENTENCE_TARGET_SECONDS;
  const targetChars = opts?.targetChars ?? TRANSCRIPT_SENTENCE_TARGET_CHARS;
  if (!segments.length) return [];

  const out: TranscriptSentence[] = [];
  let bucketStart = segments[0]!.startSeconds;
  let bucketEnd = bucketStart;
  let texts: string[] = [];

  const flush = (endHint?: number) => {
    if (!texts.length) return;
    const text = joinChunkTexts(texts);
    if (!text) {
      texts = [];
      return;
    }
    out.push({
      startSeconds: Math.max(0, bucketStart),
      endSeconds: Math.max(bucketStart, endHint ?? bucketEnd),
      text,
    });
    texts = [];
  };

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!;
    const t = seg.text?.trim();
    if (!t) continue;

    const next = segments[i + 1];
    const segEnd =
      typeof next?.startSeconds === "number" && next.startSeconds > seg.startSeconds
        ? next.startSeconds
        : seg.startSeconds + 1.5;

    if (!texts.length) {
      bucketStart = seg.startSeconds;
    }

    texts.push(t);
    bucketEnd = segEnd;
    const joined = joinChunkTexts(texts);
    const dur = bucketEnd - bucketStart;
    const fullEnough =
      joined.length >= targetChars ||
      dur >= targetSeconds ||
      endsSentence(joined);

    if (fullEnough) {
      flush(segEnd);
    }
  }
  flush();
  return out;
}

/**
 * Group sentences into ~30s transcript rows (timestamp header + inline sentences).
 */
export function buildTranscriptBlocks(
  segments: TranscriptSegment[],
  targetWindowSeconds = TRANSCRIPT_DISPLAY_WINDOW_SECONDS,
): TranscriptBlock[] {
  const sentences = mergeIntoSentences(segments);
  if (!sentences.length) return [];

  const blocks: TranscriptBlock[] = [];
  let current: TranscriptSentence[] = [];
  let blockStart = sentences[0]!.startSeconds;

  const flush = () => {
    if (!current.length) return;
    blocks.push({
      startSeconds: Math.max(0, blockStart),
      sentences: current,
    });
    current = [];
  };

  for (const sent of sentences) {
    if (current.length && sent.startSeconds - blockStart >= targetWindowSeconds) {
      flush();
      blockStart = sent.startSeconds;
    }
    if (!current.length) blockStart = sent.startSeconds;
    current.push(sent);
  }
  flush();
  return blocks;
}

/** @deprecated Prefer buildTranscriptBlocks — kept for plain text export helpers. */
export function mergeTranscriptSegments(
  segments: TranscriptSegment[],
  targetWindowSeconds = TRANSCRIPT_DISPLAY_WINDOW_SECONDS,
): TranscriptSegment[] {
  return buildTranscriptBlocks(segments, targetWindowSeconds).map((b) => ({
    startSeconds: b.startSeconds,
    text: joinChunkTexts(b.sentences.map((s) => s.text)),
  }));
}

export type NoteSection = {
  title: string;
  range: string;
  body: string;
};

export function buildMockTranscript(title: string, durationSeconds: number | null): TranscriptSegment[] {
  const total = durationSeconds && durationSeconds > 0 ? durationSeconds : 273;
  const marks = [34, 82, 116, 155, 208].filter((t) => t < total);
  const lines = [
    `[music] Welcome. Thanks for joining us today.`,
    `Here's what you need to know about this story.`,
    `The speakers walk through the key moments on camera.`,
    `Music and ambient sound continue under the narration.`,
    `Closing remarks and a short discussion wrap up the clip.`,
  ];
  return marks.map((startSeconds, i) => ({
    startSeconds,
    text: lines[i] || `Segment about “${title.slice(0, 40)}…”`,
  }));
}

export function buildMockNotes(title: string, durationSeconds: number | null): {
  headline: string;
  sections: NoteSection[];
  bullets: string[];
} {
  const total = durationSeconds && durationSeconds > 0 ? durationSeconds : 273;
  const end = (s: number) => formatDuration(Math.min(s, total)) || "0:00";
  return {
    headline: title.length > 48 ? `${title.slice(0, 48)}…` : title,
    sections: [
      {
        title: "Opening and atmosphere",
        range: `[${end(34)} - ${end(79)}]`,
        body: "The clip opens with music and a short welcome, setting a formal on-location tone before the main narration begins.",
      },
      {
        title: "Core narrative",
        range: `[${end(82)} - ${end(153)}]`,
        body: "Speakers describe the central events, naming key people and places. Visual cutaways reinforce the spoken points.",
      },
      {
        title: "Performance and reaction",
        range: `[${end(155)} - ${end(245)}]`,
        body: "Music and audience reactions appear. The segment highlights cultural details and on-site responses.",
      },
      {
        title: "Closing notes",
        range: `[${end(245)} - ${end(total)}]`,
        body: "A brief exchange wraps the piece, including light commentary on language and delivery.",
      },
    ],
    bullets: [
      "Strong sense of place through music and crowd reactions.",
      "Narrative focuses on a few clear beats rather than dense detail.",
      "Closing banter softens the formal tone of the opening.",
    ],
  };
}

export function formatTimestamp(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Parse `MM:SS` / `HH:MM:SS` clock tokens (Ask AI / Notes). */
export function parseClockTimestamp(token: string): number | null {
  const parts = String(token || "")
    .trim()
    .split(":")
    .map((p) => Number(p));
  if (parts.length < 2 || parts.length > 3) return null;
  if (parts.some((n) => !Number.isFinite(n) || n < 0)) return null;
  if (parts.length === 3) {
    return Math.floor(parts[0]! * 3600 + parts[1]! * 60 + parts[2]!);
  }
  return Math.floor(parts[0]! * 60 + parts[1]!);
}

/** @deprecated Prefer importing from `@/lib/media/notes` */
export { noteModeLabel } from "@/lib/media/notes";
