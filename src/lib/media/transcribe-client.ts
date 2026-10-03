export type TranscribeWorkspaceMeta = {
  url: string;
  playbackUrl?: string | null;
  thumbnailUrl?: string;
  title: string;
  platform: string;
  youtubeId?: string | null;
  mediaKind?: "audio" | "video" | null;
  sourceLanguage?: string;
  noteMode?: string;
  separateSpeaker?: boolean;
};

export type TranscribeDonePayload = {
  text: string;
  segments: { startSeconds: number; text: string; speaker?: number }[];
  language: string | null;
  minutesCharged?: number;
  savedToDatabase?: boolean;
  minutesDebitFailed?: boolean;
};

/** Poll Gladia until the async job finishes (server saves My files when meta is provided). */
export async function pollTranscriptionUntilDone(input: {
  gladiaJobId: string;
  workspaceId: string;
  durationSeconds: number | null;
  workspace: TranscribeWorkspaceMeta;
}): Promise<TranscribeDonePayload> {
  const deadline = Date.now() + 20 * 60 * 1000;
  while (Date.now() < deadline) {
    const res = await fetch("/api/media/transcribe/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        jobId: input.gladiaJobId,
        workspaceId: input.workspaceId,
        durationSeconds: input.durationSeconds,
        workspace: input.workspace,
      }),
    });
    const json = (await res.json()) as {
      code?: number;
      message?: string;
      data?: { status?: string; savedToDatabase?: boolean } & TranscribeDonePayload;
    };
    if (!res.ok || json.code !== 0) {
      throw new Error(json.message || "Transcription status check failed.");
    }
    if (json.data?.status === "done") {
      const text = json.data.text ?? "";
      const segments = json.data.segments || [];
      if (!text && !segments.length) {
        throw new Error("Gladia returned an empty transcript.");
      }
      return {
        text,
        segments,
        language: json.data.language ?? null,
        minutesCharged: json.data.minutesCharged,
        savedToDatabase: json.data.savedToDatabase,
        minutesDebitFailed: json.data.minutesDebitFailed,
      };
    }
    await new Promise((r) => setTimeout(r, 3_000));
  }
  throw new Error(
    "Gladia is still processing. Wait a minute and refresh My files, or check app.gladia.io for the job.",
  );
}
