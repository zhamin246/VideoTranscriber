import { respData, respErr } from "@/lib/resp";
import { auth } from "@/auth";
import { findFaceReportByReportId } from "@/models/face-report";
import type { StoredScanResult } from "@/lib/face-rating/result-store";

/** GET — load one report for owner (or by unlock email match) */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    if (!id) return respErr("Missing report id");

    const row = await findFaceReportByReportId(id);
    if (!row) return respErr("Report not found");

    const session = await auth();
    const email =
      (session?.user as { email?: string } | undefined)?.email?.toLowerCase() ||
      session?.user?.email?.toLowerCase() ||
      "";
    const uuid = (session?.user as { uuid?: string } | undefined)?.uuid || "";

    const owns =
      (email && row.user_email === email) ||
      (uuid && row.user_uuid === uuid);

    // Pending unpaid reports are not viewable as full reports
    if (row.status === "pending") {
      return respErr("Report payment is still pending");
    }

    if (!owns) {
      if (!email && !uuid) {
        return respErr("Sign in to open this report");
      }
      return respErr("You do not have access to this report");
    }

    let scan: StoredScanResult | null = null;
    try {
      scan = JSON.parse(row.scan_json) as StoredScanResult;
    } catch {
      return respErr("Report data is corrupted");
    }

    return respData({
      reportId: row.report_id,
      scan: {
        ...scan,
        unlocked: true,
        unlockEmail: row.user_email,
      },
    });
  } catch (e) {
    console.error("get face report failed:", e);
    return respErr(e instanceof Error ? e.message : "Failed to load report");
  }
}
