export const CONVERT_HREF = "/";
export const CONVERT_DRAFT_KEY = "imagetocad:convert-draft";
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ACCEPT_UPLOAD =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,image/avif,.jpg,.jpeg,.png,.webp,.heic,.heif,.avif";

export type ConvertDraft = {
  dataUrl: string;
  name: string;
  removeBackground: boolean;
  detailed: boolean;
  resume?: boolean;
};

let memoryFile: File | null = null;

export function isAcceptedUpload(file: File) {
  return (
    /image\/(jpeg|png|webp|heic|heif|avif)/i.test(file.type) ||
    /\.(jpe?g|png|webp|heic|heif|avif)$/i.test(file.name)
  );
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
