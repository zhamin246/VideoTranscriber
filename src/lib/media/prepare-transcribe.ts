import { randomBytes } from "crypto";
import {
  canEmbedPlayback,
  needsResolvedPlayback,
} from "@/lib/media/embed";
import {
  downloadResolvedMedia,
  resolveCobaltAudio,
  resolveCobaltMedia,
} from "@/lib/media/cobalt";
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
import { downloadMediaViaReplicate } from "@/lib/media/replicate-download";
import { parsePublicHttpsUrl } from "@/lib/media/source-url";
import {
  extractAudioViaYtdlp,
  ytdlpWorkerConfigured,
} from "@/lib/media/ytdlp-worker";
import { extractYoutubeId } from "@/lib/media/youtube-id";
import { runWhisper, type WhisperResult } from "@/lib/media/whisper";
import { insertMediaAsset } from "@/models/workspace";

export type PrepareTranscribeResult = WhisperResult & {
  workspaceId: string;
  audioUrl: string | null;
  playbackUrl: string | null;
  mediaKind: "audio" | "video" | null;
  storage: "r2" | "memory" | "none";
  mediaExpiresAt: string | null;
};

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

async function downloadDirect(url: string) {
  const res = await fetch(url, { headers: { Accept: "*/*" } });
  if (!res.ok) throw new Error(`Download failed (HTTP ${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > 80 * 1024 * 1024) {
    throw new Error("That file is too large to process here.");
  }
  const contentType = res.headers.get("content-type") || "application/octet-stream";
  const pathName = (() => {
    try {
      return new URL(url).pathname.split("/").pop() || "media.bin";
    } catch {
      return "media.bin";
    }
  })();
  return { buf, contentType, filename: pathName };
}

/**
 * Fetch media for transcription.
 * YouTube → Replicate download-media first (yt-dlp/Cobalt usually hit login wall).
 * Other platforms → yt-dlp / Cobalt, then Replicate as last resort.
 */
async function fetchSocialAudio(sourceUrl: string) {
  if (extractYoutubeId(sourceUrl)) {
    return downloadMediaViaReplicate(sourceUrl);
  }

  let lastError: unknown;
  if (ytdlpWorkerConfigured()) {
    try {
      return await extractAudioViaYtdlp(sourceUrl);
    } catch (e) {
      lastError = e;
      console.warn("[prepare] ytdlp audio failed:", e);
    }
  }
  try {
    const resolved = await resolveCobaltAudio(sourceUrl);
    const file = await downloadResolvedMedia(resolved.url);
    return {
      buf: file.buf,
      contentType: file.contentType,
      filename: resolved.filename || "audio.mp3",
    };
  } catch (e) {
    lastError = e;
    console.warn("[prepare] cobalt audio failed, trying Replicate:", e);
  }

  try {
    return await downloadMediaViaReplicate(sourceUrl);
  } catch (e) {
    const primary =
      lastError instanceof Error ? lastError.message : "Could not fetch audio";
    const fallback = e instanceof Error ? e.message : String(e);
    throw new Error(`${primary} (Replicate fallback: ${fallback})`);
  }
}

async function fetchSocialVideo(sourceUrl: string) {
  try {
    const resolved = await resolveCobaltMedia(sourceUrl);
    const file = await downloadResolvedMedia(resolved.url);
    return {
      buf: file.buf,
      contentType: file.contentType,
      filename: resolved.filename || "video.mp4",
    };
  } catch (e) {
    console.warn("[prepare] cobalt video failed, trying Replicate:", e);
    try {
      return await downloadMediaViaReplicate(sourceUrl);
    } catch (e2) {
      const primary = e instanceof Error ? e.message : "Could not fetch video";
      const fallback = e2 instanceof Error ? e2.message : String(e2);
      throw new Error(`${primary} (Replicate fallback: ${fallback})`);
    }
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

  // Audio without R2: Whisper can take a data-less path via File below
  return { url: "", storage: "memory", expiresAt: mediaExpiresAt() };
}

/**
 * Download / accept media → ffmpeg audio → R2 → Whisper.
 * YouTube / TikTok / Bilibili: audio only (iframe for playback).
 * Instagram / Facebook / X / uploads: store video on R2 when needed for <video>.
 */
export async function prepareAndTranscribe(input: {
  workspaceId?: string;
  sourceUrl?: string;
  file?: File | Blob;
  filename?: string;
  language?: string;
  separateSpeaker?: boolean;
}): Promise<PrepareTranscribeResult> {
  const workspaceId =
    (input.workspaceId || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) ||
    newWorkspaceId();
  const language = input.language || "auto";
  const separateSpeaker = Boolean(input.separateSpeaker);

  let mediaBuf: Buffer | null = null;
  let mediaCt = "";
  let mediaName = "";
  let storeVideo = false;
  let mediaKind: "audio" | "video" | null = null;
  let playbackUrl: string | null = null;
  let storage: "r2" | "memory" | "none" = "none";
  let expires: Date | null = null;

  if (input.file) {
    mediaBuf = Buffer.from(await input.file.arrayBuffer());
    mediaCt =
      (input.file instanceof File ? input.file.type : "") ||
      "application/octet-stream";
    mediaName =
      input.filename ||
      (input.file instanceof File ? input.file.name : "upload.bin");
    storeVideo = isLikelyVideo(mediaName, mediaCt) && !isLikelyAudio(mediaName, mediaCt);
    mediaKind = isLikelyAudio(mediaName, mediaCt)
      ? "audio"
      : isLikelyVideo(mediaName, mediaCt)
        ? "video"
        : "audio";
  } else if (input.sourceUrl) {
    const parsed = parsePublicHttpsUrl(input.sourceUrl);
    const source = parsed.toString();

    if (canEmbedPlayback(source)) {
      // YouTube / TikTok / Bilibili — iframe playback, audio-only to R2
      const audio = await fetchSocialAudio(source);
      mediaBuf = audio.buf;
      mediaCt = audio.contentType;
      mediaName = audio.filename;
      storeVideo = false;
      mediaKind = "video"; // page is video; player is embed
      playbackUrl = null;
    } else if (needsResolvedPlayback(source)) {
      const video = await fetchSocialVideo(source);
      mediaBuf = video.buf;
      mediaCt = video.contentType;
      mediaName = video.filename;
      storeVideo = isLikelyVideo(mediaName, mediaCt) || !isLikelyAudio(mediaName, mediaCt);
      mediaKind = storeVideo ? "video" : "audio";
    } else if (looksDirectMediaUrl(source)) {
      const direct = await downloadDirect(source);
      mediaBuf = direct.buf;
      mediaCt = direct.contentType;
      mediaName = direct.filename;
      storeVideo = isLikelyVideo(mediaName, mediaCt);
      mediaKind = storeVideo ? "video" : "audio";
      if (!storeVideo && isLikelyAudio(mediaName, mediaCt)) {
        // Direct audio URL can also be playback
        playbackUrl = source;
      }
    } else {
      // Unknown platform page — try audio extract
      const audio = await fetchSocialAudio(source);
      mediaBuf = audio.buf;
      mediaCt = audio.contentType;
      mediaName = audio.filename;
      storeVideo = false;
      mediaKind = "audio";
    }
  } else {
    throw new Error("Provide a file upload or sourceUrl");
  }

  if (!mediaBuf?.byteLength) {
    throw new Error("Empty media");
  }

  // Persist video for non-embed playback before ffmpeg (same bytes)
  if (storeVideo) {
    const videoAsset = await persistAsset({
      workspaceId,
      buf: mediaBuf,
      contentType: mediaCt || "video/mp4",
      filename: mediaName || "video.mp4",
      kind: "video",
    });
    playbackUrl = videoAsset.url;
    storage = videoAsset.storage;
    expires = videoAsset.expiresAt;
  }

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
    if (storage === "none") storage = audioAsset.storage;
    expires = audioAsset.expiresAt || expires;
  }
  // Pure audio (uploads / recordings): play the R2 audio object, not a black video stage
  if (mediaKind === "audio" && audioUrl) {
    playbackUrl = audioUrl;
  } else if (!playbackUrl && mediaKind === "audio" && audioUrl) {
    playbackUrl = audioUrl;
  }

  let whisper: WhisperResult;
  if (audioUrl && storageConfigured()) {
    whisper = await runWhisper({
      audioUrl,
      language,
      diarise: separateSpeaker,
    });
  } else {
    // Dev fallback without R2: send bytes directly to Replicate
    const blob = new Blob([new Uint8Array(audio.buf)], {
      type: audio.contentType,
    });
    whisper = await runWhisper({
      file: blob,
      language,
      diarise: separateSpeaker,
    });
  }

  return {
    ...whisper,
    workspaceId,
    audioUrl,
    playbackUrl,
    mediaKind,
    storage,
    mediaExpiresAt: expires?.toISOString() || null,
  };
}
