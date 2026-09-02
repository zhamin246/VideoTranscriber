import { NextRequest } from "next/server";
import { respData, respErr } from "@/lib/resp";
import { auth } from "@/auth";
import { listFaceReportsForUser, upsertFaceReport } from "@/models/face-report";
import { tierFromScore } from "@/lib/face-rating/result-store";
import type { StoredScanResult } from "@/lib/face-rating/result-store";

const MAX_PREVIEW_CHARS = 350_000; // ~data URL size cap
const MAX_JSON_CHARS = 800_000;

function sanitizeScan(scan: StoredScanResult): StoredScanResult {
  const preview =
    typeof scan.previewUrl === "string" &&
    scan.previewUrl.startsWith("data:") &&
    scan.previewUrl.length <= MAX_PREVIEW_CHARS
      ? scan.previewUrl
      : "";

  // Drop landmarks — large and not required for full report rebuild
  const { landmarks: _lm, ...rest } = scan;
  return {
    ...rest,
    previewUrl: preview,
    unlocked: true,
  };
}

/** GET — list paid/unlocked reports for the signed-in user */
export async function GET() {
  try {
    const session = await auth();
    const email =
      (session?.user as { email?: string } | undefined)?.email?.toLowerCase() ||
      session?.user?.email?.toLowerCase() ||
      "";
    const uuid = (session?.user as { uuid?: string } | undefined)?.uuid || "";

    if (!email && !uuid) {
      return respErr("Sign in to view your reports");
    }

    const rows = await listFaceReportsForUser({
      user_email: email,
      user_uuid: uuid,
    });

    const list = rows.map((r) => ({
      reportId: r.report_id,
      score: r.score,
      outOfTen: r.out_of_ten,
      tierName: r.tier_name,
      faceShape: r.face_shape,
      src: r.src,
      previewUrl: r.preview_url?.startsWith("data:") ? r.preview_url : "",
      unlockedAt: r.unlocked_at?.toISOString?.() || r.created_at?.toISOString?.() || null,
      createdAt: r.created_at?.toISOString?.() || null,
    }));

    return respData({ reports: list });
  } catch (e) {
    console.error("list face reports failed:", e);
    return respErr(
      e instanceof Error ? e.message : "Failed to load reports"
    );
  }
}

/** POST — save / unlock a full report (after consent or payment) */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const scan = body.scan as StoredScanResult | undefined;
    const emailFromBody = String(body.email || "")
      .trim()
      .toLowerCase();

    if (!scan?.id || typeof scan.score !== "number") {
      return respErr("Invalid scan payload");
    }

    const session = await auth();
    const sessionEmail =
      (session?.user as { email?: string } | undefined)?.email?.toLowerCase() ||
      session?.user?.email?.toLowerCase() ||
      "";
    const uuid = (session?.user as { uuid?: string } | undefined)?.uuid || "";

    const user_email = sessionEmail || emailFromBody || "";
    if (!user_email && !uuid) {
      // Still allow save with email from consent form
      if (!emailFromBody) {
        return respErr("Email required to save report to your dashboard");
      }
    }

    const clean = sanitizeScan({
      ...scan,
      unlocked: true,
      unlockedAt: scan.unlockedAt || Date.now(),
      unlockEmail: user_email || emailFromBody || scan.unlockEmail || null,
    });

    const scanJson = JSON.stringify(clean);
    if (scanJson.length > MAX_JSON_CHARS) {
      return respErr("Scan payload too large to store");
    }

    const tier = tierFromScore(clean.score);
    const outOfTen = (Math.round(clean.score) / 10).toFixed(1);

    const row = await upsertFaceReport({
      report_id: clean.id,
      user_uuid: uuid,
      user_email: user_email || emailFromBody,
      score: Math.round(clean.score),
      out_of_ten: outOfTen,
      tier_name: tier.name,
      face_shape: clean.faceShape || "",
      src: clean.src || "",
      preview_url: clean.previewUrl || "",
      scan_json: scanJson,
      unlocked_at: new Date(clean.unlockedAt || Date.now()),
      status: "active",
    });

    return respData({
      reportId: row.report_id,
      ok: true,
    });
  } catch (e) {
    console.error("save face report failed:", e);
    return respErr(e instanceof Error ? e.message : "Failed to save report");
  }
}
