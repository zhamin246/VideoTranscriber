import type { TranscriptSegment } from "@/lib/media/workspace-mock";
import type { WhisperResult } from "@/lib/media/whisper";

const GLADIA_BASE = "https://api.gladia.io";

const POLL_INTERVAL_MS = 2_500;
const MAX_POLL_MS = 280_000;

function gladiaKey() {
  const key =
    process.env.GLADIA_API_KEY?.trim() ||
    process.env.GLADIA_API_TOKEN?.trim() ||
    "";
  if (!key) {
    throw new Error("GLADIA_API_KEY is not configured.");
  }
  return key;
}

export function gladiaConfigured() {
  return Boolean(
    process.env.GLADIA_API_KEY?.trim() || process.env.GLADIA_API_TOKEN?.trim(),
  );
}

function headersJson(): Record<string, string> {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "x-gladia-key": gladiaKey(),
  };
}

function headersAuthOnly(): Record<string, string> {
  return {
    Accept: "application/json",
    "x-gladia-key": gladiaKey(),
  };
}

type UploadResponse = {
  audio_url?: string;
  audio_metadata?: { audio_duration?: number };
};

type InitJobResponse = {
  id?: string;
  result_url?: string;
};

type GladiaJobResponse = {
  status?: string;
  error?: { message?: string } | string;
  result?: {
    transcription?: {
      full_transcript?: string;
      languages?: string[];
      utterances?: {
        start?: number;
        end?: number;
        text?: string;
        speaker?: number;
      }[];
    };
  };
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** POST /v2/upload — multipart audio file (see Gladia docs). */
export async function uploadGladiaAudio(input: {
  buf: Buffer;
  filename: string;
  contentType?: string;
}): Promise<string> {
  const blob = new Blob([new Uint8Array(input.buf)], {
    type: input.contentType || "audio/mpeg",
  });
  const form = new FormData();
  form.append("audio", blob, input.filename || "audio.mp3");

  let res: Response;
  try {
    res = await fetch(`${GLADIA_BASE}/v2/upload`, {
      method: "POST",
      headers: headersAuthOnly(),
      body: form,
      signal: AbortSignal.timeout(120_000),
    });
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    throw new Error(`Cannot reach Gladia upload (${raw}).`);
  }

  const data = (await res.json()) as UploadResponse & {
    message?: string;
  };

  if (!res.ok) {
    throw new Error(
      data.message || `Gladia upload failed (HTTP ${res.status}).`,
    );
  }

  const url = data.audio_url?.trim();
  if (!url) {
    throw new Error("Gladia upload did not return audio_url.");
  }
  return url;
}

/** POST /v2/pre-recorded */
async function startPreRecordedJob(input: {
  audioUrl: string;
  language?: string;
  diarise?: boolean;
}): Promise<{ id: string }> {
  const body: Record<string, unknown> = {
    audio_url: input.audioUrl,
    model: "solaria-1",
  };

  if (input.language && input.language !== "auto") {
    body.language_config = { languages: [input.language] };
  }

  if (input.diarise) {
    body.diarization = true;
    body.diarization_config = {
      min_speakers: 1,
      max_speakers: 8,
    };
  }

  let res: Response;
  try {
    res = await fetch(`${GLADIA_BASE}/v2/pre-recorded`, {
      method: "POST",
      headers: headersJson(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    });
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    throw new Error(`Cannot reach Gladia transcription (${raw}).`);
  }

  const data = (await res.json()) as InitJobResponse & { message?: string };

  if (!res.ok) {
    throw new Error(
      data.message || `Gladia job start failed (HTTP ${res.status}).`,
    );
  }

  const id = data.id?.trim();
  if (!id) {
    throw new Error("Gladia did not return a transcription job id.");
  }
  return { id };
}

async function fetchPreRecordedJob(id: string): Promise<GladiaJobResponse> {
  const res = await fetch(`${GLADIA_BASE}/v2/pre-recorded/${id}`, {
    headers: headersAuthOnly(),
    signal: AbortSignal.timeout(60_000),
  });
  const data = (await res.json()) as GladiaJobResponse & { message?: string };
  if (!res.ok) {
    throw new Error(
      data.message || `Gladia job status failed (HTTP ${res.status}).`,
    );
  }
  return data;
}

function parseGladiaResult(job: GladiaJobResponse): WhisperResult {
  const transcription = job.result?.transcription;
  const text = (transcription?.full_transcript || "").trim();
  const language = transcription?.languages?.[0] || null;

  const segments: TranscriptSegment[] = [];
  for (const u of transcription?.utterances || []) {
    const chunk = (u.text || "").trim();
    if (!chunk) continue;
    const seg: TranscriptSegment = {
      startSeconds: Math.max(0, u.start ?? 0),
      text: chunk,
    };
    if (typeof u.speaker === "number" && Number.isFinite(u.speaker)) {
      seg.speaker = u.speaker;
    }
    segments.push(seg);
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

export async function fetchGladiaJobStatus(id: string): Promise<{
  status: "processing" | "done" | "error";
  result?: WhisperResult;
  error?: string;
}> {
  const job = await fetchPreRecordedJob(id);
  const status = (job.status || "").toLowerCase();

  if (status === "done") {
    return { status: "done", result: parseGladiaResult(job) };
  }
  if (status === "error") {
    const err =
      typeof job.error === "string"
        ? job.error
        : job.error?.message || "Gladia transcription failed.";
    return { status: "error", error: err };
  }
  if (status === "queued" || status === "processing" || !status) {
    return { status: "processing" };
  }
  return { status: "processing" };
}

export async function startGladiaTranscriptionJob(input: {
  audioUrl: string;
  language?: string;
  diarise?: boolean;
}): Promise<{ id: string }> {
  return startPreRecordedJob(input);
}

async function waitForGladiaJob(id: string): Promise<GladiaJobResponse> {
  const deadline = Date.now() + MAX_POLL_MS;
  while (Date.now() < deadline) {
    const job = await fetchPreRecordedJob(id);
    const status = (job.status || "").toLowerCase();

    if (status === "done") {
      return job;
    }
    if (status === "error") {
      const err =
        typeof job.error === "string"
          ? job.error
          : job.error?.message || "Gladia transcription failed.";
      throw new Error(err);
    }

    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error(
    "Gladia transcription timed out. Try a shorter file or try again.",
  );
}

/**
 * Upload audio → pre-recorded job → poll until done.
 * https://docs.gladia.io/api-reference/v2/upload/audio-file
 */
export async function runGladiaTranscription(input: {
  buf: Buffer;
  filename: string;
  contentType?: string;
  language?: string;
  diarise?: boolean;
}): Promise<WhisperResult> {
  const audioUrl = await uploadGladiaAudio(input);
  return runGladiaPreRecordedJob({
    audioUrl,
    language: input.language,
    diarise: input.diarise,
  });
}

/**
 * Gladia fetches audio/video from a public URL (YouTube, TikTok, direct MP3, …).
 * https://docs.gladia.io/api-reference/v2/pre-recorded/init
 */
export async function runGladiaTranscriptionFromUrl(input: {
  sourceUrl: string;
  language?: string;
  diarise?: boolean;
}): Promise<WhisperResult> {
  const sourceUrl = input.sourceUrl.trim();
  if (!sourceUrl.startsWith("https://")) {
    throw new Error("Gladia remote transcription requires an https URL.");
  }
  return runGladiaPreRecordedJob({
    audioUrl: sourceUrl,
    language: input.language,
    diarise: input.diarise,
  });
}

async function runGladiaPreRecordedJob(input: {
  audioUrl: string;
  language?: string;
  diarise?: boolean;
}): Promise<WhisperResult> {
  const { id } = await startPreRecordedJob({
    audioUrl: input.audioUrl,
    language: input.language,
    diarise: input.diarise,
  });
  console.info("[gladia] transcription started", { id });
  const job = await waitForGladiaJob(id);
  return parseGladiaResult(job);
}
