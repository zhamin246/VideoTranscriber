import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ffmpegStatic from "ffmpeg-static";

function resolveFfmpegBin(): string {
  if (process.env.FFMPEG_PATH?.trim()) return process.env.FFMPEG_PATH.trim();
  if (typeof ffmpegStatic === "string" && ffmpegStatic) return ffmpegStatic;
  return "ffmpeg";
}

export function isLikelyAudio(filename: string, contentType?: string) {
  if (contentType && /^audio\//i.test(contentType)) return true;
  return /\.(mp3|wav|m4a|aac|ogg|oga|flac|opus|wma)(\?|$)/i.test(filename);
}

export function isLikelyVideo(filename: string, contentType?: string) {
  // audio/webm recordings must NOT count as video
  if (contentType && /^audio\//i.test(contentType)) return false;
  if (contentType && /^video\//i.test(contentType)) return true;
  return /\.(mp4|mov|webm|mkv|avi|m4v|mpeg|mpg|3gp|ts|flv)(\?|$)/i.test(
    filename,
  );
}

/**
 * Extract a compact MP3 track for Whisper + R2.
 * Replicate incredibly-fast-whisper remote URLs only accept .mp3 / .wav / .flac.
 */
export async function extractAudioBuffer(input: {
  buf: Buffer;
  filename?: string;
  contentType?: string;
}): Promise<{ buf: Buffer; contentType: string; filename: string }> {
  const name = input.filename || "media.bin";
  const ct = input.contentType || "";

  if (
    isLikelyAudio(name, ct) &&
    /\.(mp3|wav|flac)(\?|$)/i.test(name)
  ) {
    return {
      buf: input.buf,
      contentType:
        ct ||
        (/\.wav/i.test(name)
          ? "audio/wav"
          : /\.flac/i.test(name)
            ? "audio/flac"
            : "audio/mpeg"),
      filename: name.replace(/[/\\?%*:|"<>]/g, "-").slice(0, 120) || "audio.bin",
    };
  }

  const bin = resolveFfmpegBin();
  const dir = await mkdtemp(join(tmpdir(), "vt-ff-"));
  const ext =
    /\.([a-z0-9]{2,5})$/i.exec(name)?.[1]?.toLowerCase() ||
    (ct.includes("webm") ? "webm" : ct.includes("mp4") ? "mp4" : "bin");
  const inPath = join(dir, `in.${ext}`);
  const outPath = join(dir, "out.mp3");

  try {
    await writeFile(inPath, input.buf);
    await runFfmpeg(bin, [
      "-y",
      "-i",
      inPath,
      "-vn",
      "-ac",
      "1",
      "-c:a",
      "libmp3lame",
      "-b:a",
      "96k",
      outPath,
    ]);
    const out = await readFile(outPath);
    if (!out.byteLength) {
      throw new Error("ffmpeg produced an empty audio file");
    }
    return {
      buf: out,
      contentType: "audio/mpeg",
      filename: "audio.mp3",
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `Could not extract audio with ffmpeg (${bin}): ${msg}. Install ffmpeg or set FFMPEG_PATH.`,
    );
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}

function runFfmpeg(bin: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(bin, args, { windowsHide: true });
    let stderr = "";
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
      if (stderr.length > 8000) stderr = stderr.slice(-8000);
    });
    child.on("error", (err) => {
      reject(
        new Error(
          err.message.includes("ENOENT")
            ? "ffmpeg binary not found"
            : err.message,
        ),
      );
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr.trim() || `ffmpeg exited with code ${code}`));
    });
  });
}
