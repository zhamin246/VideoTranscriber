/**
 * Client helper: durable preview URLs + save unlocked scan to server.
 */

import type { StoredScanResult } from "./result-store";
import { loadScanResult } from "./result-store";

const PREFIX = "face-rating:scan:";

/** Max side length for stored report previews (keeps data URLs under API caps). */
const MAX_PREVIEW_SIDE = 960;
const JPEG_QUALITY = 0.82;

/**
 * Convert blob: (or fetchable) preview to a durable data: URL.
 * Stripe checkout navigates away — blob: URLs die on return and must not be
 * left in sessionStorage.
 */
export async function previewUrlForStorage(
  previewUrl: string
): Promise<string> {
  if (!previewUrl) return "";
  if (previewUrl.startsWith("data:")) {
    // Re-encode oversized data URLs so checkout/API can store them
    if (previewUrl.length <= 350_000) return previewUrl;
    try {
      const res = await fetch(previewUrl);
      return await blobToDataUrl(await res.blob());
    } catch {
      return "";
    }
  }
  if (!previewUrl.startsWith("blob:") && !previewUrl.startsWith("http")) {
    return "";
  }

  try {
    const res = await fetch(previewUrl);
    const blob = await res.blob();
    return await blobToDataUrl(blob);
  } catch {
    return "";
  }
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(blob);
      const scale = Math.min(
        1,
        MAX_PREVIEW_SIDE / Math.max(bmp.width, bmp.height)
      );
      const w = Math.max(1, Math.round(bmp.width * scale));
      const h = Math.max(1, Math.round(bmp.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(bmp, 0, 0, w, h);
        bmp.close();
        return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      }
      bmp.close();
    } catch {
      /* fall through to FileReader */
    }
  }

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Write a durable preview into the existing session scan (keeps same id). */
export async function hardenScanPreviewInSession(
  scanId: string
): Promise<StoredScanResult | null> {
  if (typeof window === "undefined" || !scanId) return null;
  const existing = loadScanResult(scanId);
  if (!existing) return null;

  const current = existing.previewUrl || "";
  if (current.startsWith("data:") && current.length > 32) {
    return existing;
  }

  const durable = await previewUrlForStorage(current);
  if (!durable) return existing;

  const next: StoredScanResult = { ...existing, previewUrl: durable };
  try {
    sessionStorage.setItem(PREFIX + scanId, JSON.stringify(next));
  } catch {
    // Quota: try without landmarks
    try {
      sessionStorage.setItem(
        PREFIX + scanId,
        JSON.stringify({ ...next, landmarks: undefined })
      );
    } catch {
      /* ignore */
    }
  }
  return next;
}

export async function persistUnlockedReport(
  scan: StoredScanResult,
  email?: string | null
): Promise<{ ok: boolean; message?: string }> {
  try {
    const previewUrl = await previewUrlForStorage(scan.previewUrl || "");
    const payload: StoredScanResult = {
      ...scan,
      previewUrl,
      unlocked: true,
      unlockedAt: scan.unlockedAt || Date.now(),
      unlockEmail: email ?? scan.unlockEmail ?? null,
      landmarks: undefined,
    };

    // Keep local copy durable for post-Stripe reload
    if (scan.id && previewUrl) {
      try {
        sessionStorage.setItem(
          PREFIX + scan.id,
          JSON.stringify({ ...payload, landmarks: scan.landmarks })
        );
      } catch {
        try {
          sessionStorage.setItem(PREFIX + scan.id, JSON.stringify(payload));
        } catch {
          /* ignore */
        }
      }
    }

    const res = await fetch("/api/face-rating/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scan: payload,
        email: email || scan.unlockEmail || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.code !== 0) {
      return {
        ok: false,
        message: data?.message || "Failed to save report",
      };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Failed to save report",
    };
  }
}
