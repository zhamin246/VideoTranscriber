import { randomBytes } from "crypto";
import { newStorage } from "@/lib/storage";

export function mediaRetentionDays() {
  const n = Number(process.env.MEDIA_RETENTION_DAYS || 30);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 30;
}

export function mediaExpiresAt(from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + mediaRetentionDays());
  return d;
}

export function createAssetId() {
  return randomBytes(12).toString("hex");
}

export function storageConfigured() {
  return Boolean(
    (process.env.STORAGE_ENDPOINT || "").trim() &&
      (process.env.STORAGE_BUCKET || "").trim() &&
      (
        process.env.STORAGE_ACCESS_KEY_ID ||
        process.env.STORAGE_ACCESS_KEY ||
        ""
      ).trim() &&
      (
        process.env.STORAGE_SECRET_ACCESS_KEY ||
        process.env.STORAGE_SECRET_KEY ||
        ""
      ).trim(),
  );
}

/** Upload bytes to R2 under videotranscriber/… and return public URL + key. */
export async function uploadMediaToR2(input: {
  workspaceId: string;
  filename: string;
  body: Buffer;
  contentType: string;
  kind?: "video" | "audio" | "thumbnail";
}) {
  if (!storageConfigured()) {
    throw new Error("R2 storage is not configured (STORAGE_* env).");
  }
  const safeName =
    input.filename.replace(/[/\\?%*:|"<>]/g, "-").slice(0, 120) || "media.bin";
  const assetId = createAssetId();
  const kind = input.kind || "video";
  const key = `videotranscriber/${input.workspaceId}/${kind}-${assetId}-${safeName}`;
  const storage = newStorage();
  const uploaded = await storage.uploadFile({
    body: input.body,
    key,
    contentType: input.contentType || "application/octet-stream",
    disposition: "inline",
  });
  return {
    assetId,
    key: uploaded.key,
    url: uploaded.url,
    expiresAt: mediaExpiresAt(),
  };
}
