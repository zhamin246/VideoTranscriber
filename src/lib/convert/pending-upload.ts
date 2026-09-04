export const CONVERT_HREF = "/";
export const CONVERT_DRAFT_KEY = "imagetocad:convert-draft";
/** Client-side cap for audio/video uploads (paid tiers can raise later). */
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024;

const AUDIO_EXTS =
  "mp3,wav,m4a,aac,ogg,oga,flac,wma,opus,aiff,aif,amr,caf";
const VIDEO_EXTS =
  "mp4,mov,webm,mkv,avi,wmv,flv,m4v,mpeg,mpg,3gp,ts";

export const ACCEPT_UPLOAD = [
  "audio/*",
  "video/*",
  ...AUDIO_EXTS.split(",").map((e) => `.${e}`),
  ...VIDEO_EXTS.split(",").map((e) => `.${e}`),
].join(",");

const MEDIA_EXT_RE = new RegExp(
  `\\.(${AUDIO_EXTS.replace(/,/g, "|")}|${VIDEO_EXTS.replace(/,/g, "|")})$`,
  "i",
);

export type ConvertDraft = {
  dataUrl: string;
  name: string;
  removeBackground: boolean;
  detailed: boolean;
  resume?: boolean;
};

let memoryFile: File | null = null;

export function isAcceptedUpload(file: File) {
  if (/^(audio|video)\//i.test(file.type)) return true;
  return MEDIA_EXT_RE.test(file.name);
}

export function formatMaxUploadLabel() {
  const gb = MAX_UPLOAD_BYTES / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb % 1 === 0 ? gb : gb.toFixed(1)} GB`;
  return `${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB`;
}

export function stashPendingFile(file: File) {
  memoryFile = file;
}

export function takePendingFile() {
  const file = memoryFile;
  memoryFile = null;
  return file;
}

export function saveConvertDraft(draft: ConvertDraft) {
  try {
    sessionStorage.setItem(CONVERT_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Quota exceeded — user re-uploads after login.
  }
}

export function loadConvertDraft(): ConvertDraft | null {
  try {
    const raw = sessionStorage.getItem(CONVERT_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConvertDraft;
    if (!parsed?.dataUrl) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearConvertDraft() {
  try {
    sessionStorage.removeItem(CONVERT_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read that file"));
    reader.readAsDataURL(file);
  });
}

/** Resize raster images so the convert API stays under typical body limits. */
export async function fileToWorkingDataUrl(
  file: File,
  maxEdge = 1920
): Promise<string> {
  const dataUrl = await fileToDataUrl(file);
  if (!/^data:image\/(jpeg|png|webp)/i.test(dataUrl)) {
    return dataUrl;
  }

  const img = await loadHtmlImage(dataUrl);
  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
  if (scale >= 0.98) return dataUrl;

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.88);
}

function loadHtmlImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode that image"));
    img.src = src;
  });
}
