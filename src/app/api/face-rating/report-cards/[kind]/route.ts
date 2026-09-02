import { NextRequest } from "next/server";
import { respData, respErr } from "@/lib/resp";
import {
  isReportCardKind,
  promptForReportCard,
  REPORT_CARD_META,
  type ReportCardKind,
} from "@/lib/face-rating/report-card-prompts";
import { createGptImage2ImageToImage } from "@/lib/kie/gpt-image-2";

/**
 * POST /api/face-rating/report-cards/[kind]
 * kind: skin | features | color | glasses | hair | makeup
 *
 * Body: { image: string, scanId?: string, aspect_ratio?: string, resolution?: string }
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ kind: string }> }
) {
  try {
    if (!process.env.KIE_API_KEY) {
      return respErr("KIE_API_KEY is not configured");
    }

    const { kind: rawKind } = await ctx.params;
    const kind = String(rawKind || "").trim().toLowerCase();
    if (!isReportCardKind(kind)) {
      return respErr(
        `Unknown card kind "${rawKind}". Use: skin, features, color, glasses, hair, makeup`
      );
    }

    const body = await req.json().catch(() => ({}));
    const image = String(body.image || body.previewUrl || "").trim();
    const scanId = String(body.scanId || "").trim();

    if (!image) {
      return respErr("image (user photo URL or data:) is required");
    }
    if (!image.startsWith("http") && !image.startsWith("data:image/")) {
      return respErr("image must be an https URL or data:image payload");
    }

    const meta = REPORT_CARD_META[kind as ReportCardKind];
    const aspect_ratio = (body.aspect_ratio ||
      meta.aspect_ratio ||
      "4:5") as "4:5" | "3:4" | "1:1" | "auto";
    const resolution = (body.resolution || "1K") as "1K" | "2K" | "4K";
    const callBackUrl =
      body.callBackUrl || process.env.KIE_CALLBACK_URL || undefined;

    const taskId = await createGptImage2ImageToImage({
      prompt: promptForReportCard(kind as ReportCardKind),
      images: [image],
      aspect_ratio,
      resolution,
      callBackUrl: callBackUrl ? String(callBackUrl) : undefined,
    });

    return respData({
      kind,
      scanId: scanId || null,
      taskId,
      model: "gpt-image-2-image-to-image",
      statusUrl: `/api/kie/gpt-image-2/${encodeURIComponent(taskId)}`,
    });
  } catch (e) {
    console.error("report card create failed:", e);
    return respErr(
      e instanceof Error ? e.message : "Failed to start report card generation"
    );
  }
}
