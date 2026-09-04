import Replicate from "replicate";
import type { TranscriptSegment } from "@/lib/media/workspace-mock";

/** Pinned version from Replicate model API docs. */
export const WHISPER_MODEL =
  "vaibhavs10/incredibly-fast-whisper:3ab86df6c8f54c11309d4d1f930ac292bad43ace52d10c80d87eb258b3c9f79c";

export type WhisperResult = {
  text: string;
  segments: TranscriptSegment[];
  language: string | null;
};

function getClient() {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new Error("REPLICATE_API_TOKEN is not configured");
  }
  return new Replicate({ auth: token });
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) {
    return Number(v);
  }
  return null;
}

/** Normalize Replicate Whisper output into timestamped segments. */
export function parseWhisperOutput(output: unknown): WhisperResult {
  if (output == null) {
    return { text: "", segments: [], language: null };
  }

  if (typeof output === "string") {
    const text = output.trim();
    return {
      text,
      segments: text ? [{ startSeconds: 0, text }] : [],
      language: null,
    };
  }

  const obj = output as Record<string, unknown>;
  const text =
    typeof obj.text === "string"
      ? obj.text.trim()
      : typeof obj.transcription === "string"
        ? obj.transcription.trim()
        : "";
  const language =
    typeof obj.detected_language === "string"
      ? obj.detected_language
      : typeof obj.language === "string"
        ? obj.language
        : null;

  const rawChunks = Array.isArray(obj.chunks)
    ? obj.chunks
    : Array.isArray(obj.segments)
      ? obj.segments
      : [];

  const segments: TranscriptSegment[] = [];
  for (const item of rawChunks) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const chunkText =
      typeof row.text === "string"
        ? row.text.trim()
        : typeof row.transcript === "string"
          ? row.transcript.trim()
          : "";
    if (!chunkText) continue;

    let start: number | null = null;
    const ts = row.timestamp ?? row.timestamps ?? row.start;
    if (Array.isArray(ts) && ts.length >= 1) {
      start = asNumber(ts[0]);
    } else {
      start = asNumber(ts) ?? asNumber(row.start) ?? asNumber(row.start_time);
    }
    segments.push({
      startSeconds: Math.max(0, start ?? 0),
      text: chunkText,
    });
  }

  if (!segments.length && text) {
    segments.push({ startSeconds: 0, text });
  }

  return {
    text: text || segments.map((s) => s.text).join(" ").trim(),
    segments,
    language,
  };
}

export type WhisperInput = {
  /** Local upload / recording (Replicate uploads ≤100MB). */
  file?: File | Blob;
  /** Public https URL to audio/video. */
  audioUrl?: string;
  language?: string;
  /** Speaker diarization (needs HF token on Replicate side for some setups). */
  diarise?: boolean;
};

/**
 * Run incredibly-fast-whisper on Replicate.
 * Pass either `file` (auto-uploaded) or a public `audioUrl`.
 */
export async function runWhisper(input: WhisperInput): Promise<WhisperResult> {
  const audio = input.file || input.audioUrl;
  if (!audio) {
    throw new Error("Provide an audio file or a public audio URL");
  }

  const replicate = getClient();
  const language =
    input.language && input.language !== "auto" ? input.language : undefined;

  const output = await replicate.run(WHISPER_MODEL, {
    input: {
      audio,
      batch_size: 24,
      task: "transcribe",
      timestamp: "chunk",
      ...(language ? { language } : {}),
      ...(input.diarise ? { diarise_audio: true } : {}),
    },
  });

  return parseWhisperOutput(output);
}
