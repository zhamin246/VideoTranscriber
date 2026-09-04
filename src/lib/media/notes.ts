/**
 * AI Notes (videotranscriber.ai right panel).
 * Prompt Library modes → structured notes with seekable timestamps.
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

export type NoteSection = {
  title: string;
  startSeconds: number;
  endSeconds: number;
  body: string;
};

export type AiNotes = {
  mode: string;
  headline: string;
  sections: NoteSection[];
  bullets: string[];
};

export const NOTE_MODE_PRESETS = [
  {
    value: "smart_summary",
    label: "Smart Summary",
    description: "AI automatically chooses the best summary structure for your video",
  },
  {
    value: "summary",
    label: "Summary",
    description: "Generate a structured summary, highlights, and key insights.",
  },
  {
    value: "core_points",
    label: "Core Points",
    description: "Extract the main arguments, conclusions, and useful details.",
  },
  {
    value: "chapter",
    label: "Chapter Summary",
    description: "Organize the transcript into chapters with concise summaries.",
  },
  {
    value: "study_notes",
    label: "Study Notes",
    description: "Turn the transcript into clear notes for learning and review.",
  },
  {
    value: "creator_repurpose",
    label: "Creator Repurpose",
    description: "Create reusable content ideas, clips, posts, and hooks.",
  },
  {
    value: "meeting_summary",
    label: "Meeting Summary",
    description: "Extract decisions, action items, owners, and follow-ups.",
  },
  {
    value: "soap",
    label: "SOAP Mode",
    description: "Generate structured medical summaries in international SOAP format.",
  },
  {
    value: "case_discussion",
    label: "Case Discussion",
    description: "Organize MDC diagnostic disputes & treatment plans.",
  },
  {
    value: "court_hearing",
    label: "Court Summary",
    description: "Extract dispute focus, party claims & evidence chains.",
  },
  {
    value: "evidence_organization",
    label: "Evidence Organization",
    description: "Chronicle facts, and identify conflicts & unverified matters.",
  },
  {
    value: "interview_notes",
    label: "Interview Notes",
    description: "Extract applicable quotes, key facts, and follow-up directions.",
  },
  {
    value: "podcast_show_notes",
    label: "Podcast Show Notes",
    description: "Generate show notes with chapter breaks and highlight markers.",
  },
  {
    value: "news_brief",
    label: "News Brief",
    description: "Organize a ready-to-publish news brief in the 5W1H format.",
  },
  {
    value: "timeline",
    label: "Timeline",
    description: "Split the recorded material into topic segments in chronological order.",
  },
] as const;

export type NoteModeValue = (typeof NOTE_MODE_PRESETS)[number]["value"] | string;

export function noteModeLabel(mode: string) {
  const hit = NOTE_MODE_PRESETS.find((m) => m.value === mode);
  return hit?.label || "Smart Summary";
}

export function notesAreComplete(notes: AiNotes | null | undefined) {
  return Boolean(
    notes?.headline?.trim() &&
      notes.sections?.length &&
      notes.sections.every((s) => s.title?.trim() && s.body?.trim()),
  );
}

function inferDuration(segments: TranscriptSegment[], hint?: number | null) {
  if (typeof hint === "number" && hint > 0) return hint;
  let max = 0;
  for (const s of segments) {
    if (s.startSeconds > max) max = s.startSeconds;
  }
  return max > 0 ? max + 30 : null;
}

function buildNotesScript(
  segments: TranscriptSegment[],
  maxChars = 28_000,
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

function parseSeconds(raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const m = raw.trim().match(/^(?:(\d+):)?(\d{1,2}):(\d{2})$/);
    if (m) {
      const h = m[1] ? Number(m[1]) : 0;
      return h * 3600 + Number(m[2]) * 60 + Number(m[3]);
    }
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  return NaN;
}

function modeInstruction(mode: string): string {
  const preset = NOTE_MODE_PRESETS.find((m) => m.value === mode);
  const label = preset?.label || "Smart Summary";
  const desc = preset?.description || "Structured summary with key insights.";

  const extras: Record<string, string> = {
    smart_summary:
      "Choose the best structure for this content (topic sections + key takeaways).",
    summary: "Emphasize overview, highlights, and insights.",
    core_points: "Focus sections on arguments/conclusions; bullets = core takeaways.",
    chapter: "One section per major chapter; body = concise chapter summary.",
    study_notes: "Learning-oriented notes: concepts, definitions, things to review.",
    creator_repurpose:
      "Sections = content angles; bullets = hooks, clip ideas, post ideas.",
    meeting_summary:
      "Sections = agenda topics; bullets = decisions, action items, owners.",
    soap: "Map to SOAP: Subjective / Objective / Assessment / Plan as sections.",
    case_discussion: "Organize dispute, diagnosis options, and treatment plan.",
    court_hearing: "Dispute focus, party claims, evidence chain.",
    evidence_organization: "Chronology of facts; flag conflicts / unverified items in bullets.",
    interview_notes: "Quotes, key facts, follow-up questions in bullets.",
    podcast_show_notes: "Show notes with chapter-like sections and highlight bullets.",
    news_brief: "5W1H structure across sections; bullets = headline facts.",
    timeline: "Strict chronological topic segments covering the full duration.",
  };

  return `Mode: ${label}. ${desc} ${extras[mode] || ""}`.trim();
}

function normalizeNotes(
  raw: unknown,
  mode: string,
  durationSeconds: number | null,
  anchors: number[],
): AiNotes | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  const headline = String(
    obj.headline || obj.title || obj.heading || "",
  ).trim();

  const sectionsRaw = Array.isArray(obj.sections)
    ? obj.sections
    : Array.isArray(obj.notes)
      ? obj.notes
      : [];

  const max =
    typeof durationSeconds === "number" && durationSeconds > 0
      ? durationSeconds
      : Number.POSITIVE_INFINITY;

  const sections: NoteSection[] = [];
  for (const row of sectionsRaw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const title = String(r.title || r.heading || r.name || "").trim();
    const body = String(
      r.body || r.summary || r.content || r.text || "",
    ).trim();
    if (!title || !body) continue;

    let start = parseSeconds(
      r.startSeconds ?? r.start ?? r.start_time ?? r.from,
    );
    let end = parseSeconds(r.endSeconds ?? r.end ?? r.end_time ?? r.to);

    if (!Number.isFinite(start)) continue;
    start = Math.max(0, Math.min(max === Infinity ? start : max, start));
    start = snapToAnchor(start, anchors);

    if (!Number.isFinite(end) || end <= start) {
      // default window ~ next section or +90s
      end = Math.min(
        max === Infinity ? start + 90 : max,
        start + Math.max(45, (max === Infinity ? 90 : max / 4)),
      );
    } else {
      end = Math.max(start + 5, Math.min(max === Infinity ? end : max, end));
      end = snapToAnchor(end, anchors);
      if (end <= start) end = start + 30;
    }

    sections.push({
      title,
      startSeconds: Math.round(start),
      endSeconds: Math.round(end),
      body,
    });
  }

  sections.sort((a, b) => a.startSeconds - b.startSeconds);

  // Fix overlapping / non-increasing ends
  for (let i = 0; i < sections.length; i++) {
    const cur = sections[i]!;
    const next = sections[i + 1];
    if (next && cur.endSeconds > next.startSeconds) {
      cur.endSeconds = Math.max(cur.startSeconds + 5, next.startSeconds);
    }
    if (
      typeof durationSeconds === "number" &&
      durationSeconds > 0 &&
      i === sections.length - 1
    ) {
      cur.endSeconds = Math.max(cur.endSeconds, Math.round(durationSeconds));
    }
  }

  const bulletsRaw = Array.isArray(obj.bullets)
    ? obj.bullets
    : Array.isArray(obj.keyTakeaways)
      ? obj.keyTakeaways
      : Array.isArray(obj.takeaways)
        ? obj.takeaways
        : [];
  const bullets = bulletsRaw
    .map((b) => String(b || "").trim())
    .filter(Boolean)
    .slice(0, 12);

  if (!headline || !sections.length) return null;
  return { mode, headline, sections, bullets };
}

function redistributeSectionTimes(
  notes: AiNotes,
  durationSeconds: number,
  anchors: number[],
): AiNotes {
  const n = notes.sections.length;
  if (n < 2 || !(durationSeconds > 0)) return notes;
  const span = Math.max(durationSeconds - 10, durationSeconds * 0.95);
  const sections = notes.sections.map((s, i) => {
    const startIdeal = i === 0 ? 0 : (span * i) / n;
    const endIdeal = i === n - 1 ? durationSeconds : (span * (i + 1)) / n;
    const start = Math.round(snapToAnchor(startIdeal, anchors));
    let end = Math.round(snapToAnchor(endIdeal, anchors));
    if (end <= start) end = Math.min(durationSeconds, start + 30);
    return { ...s, startSeconds: start, endSeconds: end };
  });
  return { ...notes, sections };
}

function sectionsHaveValidTimeline(
  notes: AiNotes,
  durationSeconds: number | null,
): boolean {
  const list = notes.sections;
  if (list.length < 2) return true;
  const dur =
    typeof durationSeconds === "number" && durationSeconds > 0
      ? durationSeconds
      : list[list.length - 1]?.endSeconds || 0;

  const gaps: number[] = [];
  for (let i = 1; i < list.length; i++) {
    gaps.push(list[i]!.startSeconds - list[i - 1]!.startSeconds);
  }
  const median = [...gaps].sort((a, b) => a - b)[Math.floor(gaps.length / 2)] ?? 0;
  if (dur >= 120 && median < 15) return false;

  const last = list[list.length - 1]!.startSeconds;
  if (dur >= 180 && last < dur * 0.35) return false;
  return true;
}

/**
 * Generate AI Notes for the workspace right panel.
 */
export async function generateNotes(opts: {
  title?: string;
  durationSeconds?: number | null;
  segments: TranscriptSegment[];
  mode?: string;
  length?: "short" | "medium";
  signal?: AbortSignal;
}): Promise<AiNotes> {
  const segments = opts.segments.filter((s) => s.text?.trim());
  if (!segments.length) {
    throw new Error("No transcript available to generate notes");
  }

  const mode = (opts.mode || "smart_summary").trim() || "smart_summary";
  const length = opts.length === "short" ? "short" : "medium";
  const durationSeconds = inferDuration(segments, opts.durationSeconds);
  const { script, anchors } = buildNotesScript(segments);
  const durationLabel =
    durationSeconds && durationSeconds > 0
      ? formatTimestamp(durationSeconds)
      : "unknown";

  const system = `You write AI Notes for a video/audio transcript workspace (like videotranscriber.ai).
Return ONLY valid JSON (no markdown fences):
{"headline":"Overall title","sections":[{"title":"Section title","startSeconds":0,"endSeconds":120,"body":"1–3 paragraphs of notes"},...],"bullets":["Key takeaway 1","Key takeaway 2"]}

Rules:
- ${modeInstruction(mode)}
- Length preference: ${length} (${length === "short" ? "3–5 sections, shorter bodies" : "4–8 sections, fuller bodies"}).
- startSeconds / endSeconds are playback times in SECONDS. Use bracket times from the transcript ([00:00], [03:14] → 0, 194).
- Spread sections across the FULL media; last section should reach near the end.
- Typical section length is 30–180 seconds on multi-minute media. Never collapse all starts into the first 10 seconds.
- headline: concise overall title (same language as transcript).
- section title: short topic name; body: readable prose (not raw transcript dump). Same language as transcript.
- bullets: 3–7 key takeaways / action items (mode-dependent). Same language.
- Every section needs title, startSeconds, endSeconds, body.`;

  const prompt = `Title: ${opts.title || "Untitled"}
Video duration: ${durationLabel} (${durationSeconds ? Math.round(durationSeconds) : "?"} seconds).
Allowed time anchors (seconds): ${anchors.slice(0, 80).join(", ")}${anchors.length > 80 ? ", …" : ""}

Transcript (~30s blocks):
${script}`;

  const text = await llmText({
    system,
    prompt,
    includeThoughts: false,
    signal: opts.signal,
  });

  const parsed = parseJsonFromModelText<unknown>(text);
  let notes = normalizeNotes(parsed, mode, durationSeconds, anchors);
  if (!notes) {
    throw new Error("Model returned no notes");
  }

  if (
    durationSeconds &&
    !sectionsHaveValidTimeline(notes, durationSeconds)
  ) {
    notes = redistributeSectionTimes(notes, durationSeconds, anchors);
  }

  return notes;
}

/** Format range like competitor: [00:00~03:14] */
export function formatNoteRange(startSeconds: number, endSeconds: number) {
  return `[${formatTimestamp(startSeconds)}~${formatTimestamp(endSeconds)}]`;
}
