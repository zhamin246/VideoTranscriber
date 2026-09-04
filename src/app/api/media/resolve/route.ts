import { NextRequest } from "next/server";
import { resolveCobaltMedia, downloadResolvedMedia } from "@/lib/media/cobalt";
import { putPlaybackCache } from "@/lib/media/playback-cache";
import {
  createAssetId,
  mediaExpiresAt,
  storageConfigured,
  uploadMediaToR2,
} from "@/lib/media/r2-media";
import { parsePublicHttpsUrl } from "@/lib/media/source-url";
import { insertMediaAsset } from "@/models/workspace";
import { respData, respErr } from "@/lib/resp";

export const maxDuration = 120;
export const runtime = "nodejs";

/**
 * Resolve a social URL → download media once → store on R2 (preferred) or
 * fall back to in-memory /api/media/play/:id when STORAGE_* is unset.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      url?: string;
      workspaceId?: string;
    };
    const parsed = parsePublicHttpsUrl(body?.url || "");
    const workspaceId = String(body?.workspaceId || "")
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 64);
    const resolved = await resolveCobaltMedia(parsed.toString());
    const file = await downloadResolvedMedia(resolved.url);
    const contentType = file.contentType || "video/mp4";
    const filename = resolved.filename || "media.mp4";

    if (storageConfigured()) {
      const uploaded = await uploadMediaToR2({
        workspaceId: workspaceId || "anon",
        filename,
        body: file.buf,
        contentType,
        kind: /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(filename)
          ? "audio"
          : "video",
      });

      if (workspaceId) {
        try {
          await insertMediaAsset({
            asset_id: uploaded.assetId,
            workspace_id: workspaceId,
            kind: /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(filename)
              ? "audio"
              : "video",
            storage_key: uploaded.key,
            public_url: uploaded.url,
            content_type: contentType,
            bytes: file.buf.byteLength,
            filename: filename.slice(0, 255),
            expires_at: uploaded.expiresAt,
          });
        } catch (e) {
          console.error("media_assets insert failed:", e);
        }
      }

      return respData({
        url: uploaded.url,
        assetId: uploaded.assetId,
        key: uploaded.key,
        filename,
        bytes: file.buf.byteLength,
        contentType,
        expiresAt: uploaded.expiresAt.toISOString(),
        storage: "r2",
      });
    }

    // Dev fallback when R2 is not configured
    const id = putPlaybackCache({
      buf: file.buf,
      contentType,
      filename,
    });
    return respData({
      url: `/api/media/play/${id}`,
      assetId: createAssetId(),
      filename,
      bytes: file.buf.byteLength,
      contentType,
      expiresAt: mediaExpiresAt().toISOString(),
      storage: "memory",
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Could not resolve a playable media URL.";
    return respErr(message);
  }
}
