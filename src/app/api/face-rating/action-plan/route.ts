import { NextRequest } from "next/server";
import { respData, respErr } from "@/lib/resp";
import type { StoredScanResult } from "@/lib/face-rating/result-store";
import {
  buildScanPlanSummary,
  generateActionPlanWithGpt56,
} from "@/lib/face-rating/action-plan";

/**
 * POST /api/face-rating/action-plan
 * Body: { scan: StoredScanResult }
 * Uses Kie GPT-5.6 Luna to generate a shortboard-driven habit/outfit/skincare plan.
 */
export async function POST(req: NextRequest) {
  try {
    if (!process.env.KIE_API_KEY) {
      return respErr("KIE_API_KEY is not configured");
    }

    const body = await req.json().catch(() => ({}));
    const scan = body.scan as StoredScanResult | undefined;
    if (!scan?.id || typeof scan.score !== "number" || !scan.components) {
      return respErr("Valid scan payload is required");
    }

    const summary = buildScanPlanSummary(scan);
    const plan = await generateActionPlanWithGpt56(scan);

    return respData({
      plan,
      summary: {
        leverage: summary.leverage,
        standout: summary.standout,
        faceShape: summary.faceShape,
        composite: summary.composite,
      },
    });
  } catch (e) {
    console.error("action-plan generate failed:", e);
    return respErr(
      e instanceof Error ? e.message : "Failed to generate action plan"
    );
  }
}
