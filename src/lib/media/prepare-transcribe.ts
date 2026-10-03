import { randomBytes } from "crypto";
import {
  canEmbedPlayback,
  needsResolvedPlayback,
} from "@/lib/media/embed";
import {
  extractAudioBuffer,
  isLikelyAudio,
  isLikelyVideo,
} from "@/lib/media/ffmpeg-audio";
import {
  mediaExpiresAt,
  storageConfigured,
  uploadMediaToR2,
} from "@/lib/media/r2-media";
import { putPlaybackCache } from "@/lib/media/playback-cache";
import {
  fetchGladiaJobStatus,
  gladiaConfigured,
  startGladiaTranscriptionJob,
} from "@/lib/media/gladia";
import {
  fetchMediaViaGenDownload,
  gendownloadDisabled,
} from "@/lib/media/gendownload";
import { replicateConfigured, runWhisper } from "@/lib/media/whisper";
import { parsePublicHttpsUrl } from "@/lib/media/source-url";
import type { WhisperResult } from "@/lib/media/whisper";
import { insertMediaAsset } from "@/models/workspace";

export type PrepareTranscribeResult = WhisperResult & {
  workspaceId: string;
  audioUrl: string | null;
  playbackUrl: string | null;
  mediaKind: "audio" | "video" | null;
  storage: "r2" | "memory" | "none";
  mediaExpiresAt: string | null;
};

type BeginTranscribeMeta = {
  workspaceId: string;
  audioUrl: string | null;
  playbackUrl: string | null;
  mediaKind: "audio" | "video" | null;
  storage: "r2" | "memory" | "none";
  mediaExpiresAt: string | null;
};

/** Gladia async job — client polls `/api/media/transcribe/status`. */
export type BeginTranscribeProcessing = BeginTranscribeMeta & {
  status: "processing";
  provider: "gladia";
  gladiaJobId: string;
};

/** Sync transcript (Replicate Whisper on R2 URL). */
export type BeginTranscribeDone = BeginTranscribeMeta & {
  status: "done";
  provider: "replicate";
  text: string;
  segments: WhisperResult["segments"];
  language: string | null;
};

export type BeginTranscribeResult =
  | BeginTranscribeProcessing
  | BeginTranscribeDone;

async function beginGladiaForUrl(input: {
  audioUrl: string;
  workspaceId: string;
  language: string;
  separateSpeaker: boolean;
  playbackUrl: string | null;
  mediaKind: "audio" | "video" | null;
}): Promise<BeginTranscribeProcessing> {
  const { id } = await startGladiaTranscriptionJob({
    audioUrl: input.audioUrl,
    language: input.language,
    diarise: input.separateSpeaker,
  });
  console.info("[gladia] link job started (fallback)", {
    id,
    workspaceId: input.workspaceId,
  });
  return {
    status: "processing",
    provider: "gladia",
    gladiaJobId: id,
    workspaceId: input.workspaceId,
    audioUrl: null,
    playbackUrl: input.playbackUrl,
    mediaKind: input.mediaKind,
    storage: "none",
    mediaExpiresAt: null,
  };
}

async function beginGenDownloadReplicateForUrl(input: {
  sourceUrl: string;
  workspaceId: string;
  language: string;
  separateSpeaker: boolean;
  playbackUrl: string | null;
  mediaKind: "audio" | "video" | null;
}): Promise<BeginTranscribeDone> {
  if (!replicateConfigured()) {
    throw new Error("REPLICATE_API_TOKEN is not configured for link transcription");
  }

  const fetched = await fetchMediaViaGenDownload(input.sourceUrl);
  const audio = await extractAudioBuffer({
    buf: fetched.buf,
    filename: fetched.filename,
    contentType: fetched.contentType,
  });

  let audioUrl: string | null = null;
  let storage: "r2" | "memory" | "none" = "none";
  let expires: Date | null = null;

  const audioAsset = await persistAsset({
    workspaceId: input.workspaceId,
    buf: audio.buf,
    contentType: audio.contentType,
    filename: audio.filename,
    kind: "audio",
  });
  if (audioAsset.url) {
    audioUrl = audioAsset.url;
    storage = audioAsset.storage;
    expires = audioAsset.expiresAt;
  }

  // YouTube / TikTok / Bilibili: keep playback on iframe; R2 MP3 is for Whisper only.
  const playbackUrl = canEmbedPlayback(input.sourceUrl)
    ? null
    : audioUrl || input.playbackUrl;

  const publicAudioUrl =
    audioUrl && /^https:\/\//i.test(audioUrl) ? audioUrl : undefined;

  const transcript = publicAudioUrl
    ? await runWhisper({
        audioUrl: publicAudioUrl,
        language: input.language,
        diarise: input.separateSpeaker,
      })
    : await runWhisper({
        file: new Blob([new Uint8Array(audio.buf)], {
          type: audio.contentType,
        }),
        language: input.language,
        diarise: input.separateSpeaker,
      });

  console.info("[gendownload] link transcribe done", {
    workspaceId: input.workspaceId,
    viaR2: Boolean(publicAudioUrl),
    durationSeconds: fetched.durationSeconds,
  });

  return {
    status: "done",
    provider: "replicate",
    workspaceId: input.workspaceId,
    audioUrl,
    playbackUrl,
    mediaKind: input.mediaKind,
    storage,
    mediaExpiresAt: expires?.toISOString() || null,
    text: transcript.text,
    segments: transcript.segments,
    language: transcript.language,
  };
}

async function beginLinkTranscription(input: {
  sourceUrl: string;
  workspaceId: string;
  language: string;
  separateSpeaker: boolean;
}): Promise<BeginTranscribeResult> {
  const { mediaKind, playbackUrl } = playbackForRemoteSource(input.sourceUrl);

  const tryGenDownload =
    !gendownloadDisabled() && replicateConfigured();

  if (tryGenDownload) {
    try {
      return await beginGenDownloadReplicateForUrl({
        sourceUrl: input.sourceUrl,
        workspaceId: input.workspaceId,
        language: input.language,
        separateSpeaker: input.separateSpeaker,
        playbackUrl,
        mediaKind,
      });
    } catch (e) {
      console.warn("[gendownload] link path failed, trying Gladia:", e);
      if (!gladiaConfigured()) {
        throw e instanceof Error
          ? e
          : new Error("GenDownload failed and GLADIA_API_KEY is not configured.");
      }
    }
  } else if (!gladiaConfigured()) {
    throw new Error(
      "Configure REPLICATE_API_TOKEN (GenDownload path) and/or GLADIA_API_KEY (fallback) for link transcription.",
    );
  }

  return beginGladiaForUrl({
    audioUrl: input.sourceUrl,
    workspaceId: input.workspaceId,
    language: input.language,
    separateSpeaker: input.separateSpeaker,
    playbackUrl,
    mediaKind,
  });
}

function newWorkspaceId() {
  return randomBytes(8).toString("hex");
}

function looksDirectMediaUrl(url: string) {
  try {
    const u = new URL(url);
    return /\.(mp3|wav|m4a|aac|ogg|oga|flac|opus|mp4|mov|webm|mkv|m4v)(\?|$)/i.test(
      u.pathname,
    );
  } catch {
    return false;
  }
}

async function persistAsset(input: {
  workspaceId: string;
  buf: Buffer;
  contentType: string;
  filename: string;
  kind: "audio" | "video";
}): Promise<{ url: string; storage: "r2" | "memory"; expiresAt: Date | null }> {
  if (storageConfigured()) {
    const uploaded = await uploadMediaToR2({
      workspaceId: input.workspaceId,
      filename: input.filename,
      body: input.buf,
      contentType: input.contentType,
      kind: input.kind,
    });
    try {
      await insertMediaAsset({
        asset_id: uploaded.assetId,
        workspace_id: input.workspaceId,
        kind: input.kind,
        storage_key: uploaded.key,
        public_url: uploaded.url,
        content_type: input.contentType,
        bytes: input.buf.byteLength,
        filename: input.filename.slice(0, 255),
        expires_at: uploaded.expiresAt,
      });
    } catch (e) {
      console.error("media_assets insert failed:", e);
    }
    return {
      url: uploaded.url,
      storage: "r2",
      expiresAt: uploaded.expiresAt,
    };
  }

  if (input.kind === "video") {
    const id = putPlaybackCache({
      buf: input.buf,
      contentType: input.contentType,
      filename: input.filename,
    });
    return {
      url: `/api/media/play/${id}`,
      storage: "memory",
      expiresAt: mediaExpiresAt(),
    };
  }

  return { url: "", storage: "memory", expiresAt: mediaExpiresAt() };
}

function playbackForRemoteSource(source: string) {
  if (canEmbedPlayback(source)) {
    return { mediaKind: "video" as const, playbackUrl: null };
  }
  if (needsResolvedPlayback(source)) {
    return { mediaKind: "video" as const, playbackUrl: null };
  }
  if (looksDirectMediaUrl(source)) {
    const pathName = (() => {
      try {
        return new URL(source).pathname.split("/").pop() || "";
      } catch {
        return "";
      }
    })();
    if (isLikelyVideo(pathName, "")) {
      return { mediaKind: "video" as const, playbackUrl: source };
    }
    return { mediaKind: "audio" as const, playbackUrl: source };
  }
  return { mediaKind: "video" as const, playbackUrl: null };
}

/**
 * Start Gladia async job (returns immediately). Poll `/api/media/transcribe/status`.
 */
export async function beginTranscription(input: {
  workspaceId?: string;
  sourceUrl?: string;
  file?: File | Blob;
  filename?: string;
  language?: string;
  separateSpeaker?: boolean;
}): Promise<BeginTranscribeResult> {
  const workspaceId =
    (input.workspaceId || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) ||
    newWorkspaceId();
  const language = input.language || "auto";
  const separateSpeaker = Boolean(input.separateSpeaker);

  if (input.sourceUrl && !input.file) {
    const parsed = parsePublicHttpsUrl(input.sourceUrl);
    const sourceUrl = parsed.toString();

    return beginLinkTranscription({
      sourceUrl,
      workspaceId,
      language,
      separateSpeaker,
    });
  }

  if (!input.file) {
    throw new Error("Provide a file upload or sourceUrl");
  }

  const mediaCt =
    (input.file instanceof File ? input.file.type : "") ||
    "application/octet-stream";
  const mediaName =
    input.filename ||
    (input.file instanceof File ? input.file.name : "upload.bin");
  const mediaKind: "audio" | "video" | null = isLikelyAudio(mediaName, mediaCt)
    ? "audio"
    : isLikelyVideo(mediaName, mediaCt)
      ? "video"
      : "audio";

  const mediaBuf = Buffer.from(await input.file.arrayBuffer());
  if (!mediaBuf.byteLength) {
    throw new Error("Empty media");
  }

  let playbackUrl: string | null = null;
  let storage: "r2" | "memory" | "none" = "none";
  let expires: Date | null = null;

  const audio = await extractAudioBuffer({
    buf: mediaBuf,
    filename: mediaName,
    contentType: mediaCt,
  });

  let audioUrl: string | null = null;
  const audioAsset = await persistAsset({
    workspaceId,
    buf: audio.buf,
    contentType: audio.contentType,
    filename: audio.filename,
    kind: "audio",
  });
  if (audioAsset.url) {
    audioUrl = audioAsset.url;
    storage = audioAsset.storage;
    expires = audioAsset.expiresAt;
  }
  if (mediaKind === "audio" && audioUrl) {
    playbackUrl = audioUrl;
  } else if (audioUrl) {
    playbackUrl = audioUrl;
  }

  if (!replicateConfigured()) {
    throw new Error("REPLICATE_API_TOKEN is not configured for file transcription");
  }

  const publicAudioUrl =
    audioUrl && /^https:\/\//i.test(audioUrl) ? audioUrl : undefined;

  const transcript = publicAudioUrl
    ? await runWhisper({
        audioUrl: publicAudioUrl,
        language,
        diarise: separateSpeaker,
      })
    : await runWhisper({
        file: new Blob([new Uint8Array(audio.buf)], {
          type: audio.contentType,
        }),
        language,
        diarise: separateSpeaker,
      });

  console.info("[replicate] file transcribe done", {
    workspaceId,
    viaR2: Boolean(publicAudioUrl),
  });

  return {
    status: "done",
    provider: "replicate",
    workspaceId,
    audioUrl,
    playbackUrl,
    mediaKind,
    storage,
    mediaExpiresAt: expires?.toISOString() || null,
    text: transcript.text,
    segments: transcript.segments,
    language: transcript.language,
  };
}

/**
 * File / recording → ffmpeg MP3 → R2 → Replicate Whisper (public audio URL).
 * Public link → GenDownload extract + R2 + Replicate; Gladia fallback on failure.
 */
export async function prepareAndTranscribe(input: {
  workspaceId?: string;
  sourceUrl?: string;
  file?: File | Blob;
  filename?: string;
  language?: string;
  separateSpeaker?: boolean;
}): Promise<PrepareTranscribeResult> {
  const begun = await beginTranscription(input);
  if (begun.status === "done") {
    const { status: _s, provider: _p, text, segments, language, ...meta } =
      begun;
    return { text, segments, language, ...meta };
  }
  const deadline = Date.now() + 780_000;
  while (Date.now() < deadline) {
    const st = await fetchGladiaJobStatus(begun.gladiaJobId);
    if (st.status === "error") {
      throw new Error(st.error || "Gladia transcription failed.");
    }
    if (st.status === "done" && st.result) {
      const { status: _s, gladiaJobId: _id, ...meta } = begun;
      return { ...st.result, ...meta };
    }
    await new Promise((r) => setTimeout(r, 2_500));
  }
  throw new Error(
    `Gladia job ${begun.gladiaJobId} is still processing. Poll /api/media/transcribe/status?jobId=${begun.gladiaJobId}`,
  );
}
