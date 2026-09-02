import { NextRequest } from "next/server";
import { respData, respErr } from "@/lib/resp";
import {
  createGptImage2ImageToImage,
  type GptImage2AspectRatio,
  type GptImage2Resolution,
} from "@/lib/kie/gpt-image-2";

/**
 * POST /api/kie/gpt-image-2
 * Create a Kie GPT Image 2 image-to-image task.
 *
 * Body:
 * {
 *   prompt: string;
 *   images: string[];           // https URLs and/or data:image URLs
 *   aspect_ratio?: string;      // default auto
 *   resolution?: "1K"|"2K"|"4K";
 *   callBackUrl?: string;       // optional webhook
 *   wait?: boolean;             // if true, poll until done (dev only; can be slow)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    if (!process.env.KIE_API_KEY) {
      return respErr("KIE_API_KEY is not configured");
    }

    const body = await req.json().catch(() => ({}));
    const prompt = String(body.prompt || "").trim();
    const images = Array.isArray(body.images)
      ? body.images.map((x: unknown) => String(x || "")).filter(Boolean)
      : body.image
        ? [String(body.image)]
        : [];

    if (!prompt) return respErr("prompt is required");
    if (!images.length) {
      return respErr("images[] (or image) is required for image-to-image");
    }

    const aspect_ratio = (body.aspect_ratio || "auto") as GptImage2AspectRatio;
    const resolution = (body.resolution || "1K") as GptImage2Resolution;
    const callBackUrl = body.callBackUrl
      ? String(body.callBackUrl)
      : process.env.KIE_CALLBACK_URL || undefined;

    const taskId = await createGptImage2ImageToImage({
      prompt,
      images,
      aspect_ratio,
      resolution,
      callBackUrl,
    });

    // Optional blocking wait — useful for local smoke tests only
    if (body.wait === true) {
      const { runGptImage2ImageToImage } = await import("@/lib/kie/gpt-image-2");
      const result = await runGptImage2ImageToImage(
        { prompt, images, aspect_ratio, resolution },
        { timeoutMs: 8 * 60_000, intervalMs: 3_000 }
      );
      return respData({
        taskId: result.taskId,
        state: result.task.state,
        resultUrls: result.resultUrls,
        creditsConsumed: result.task.creditsConsumed ?? null,
      });
    }

    return respData({
      taskId,
      model: "gpt-image-2-image-to-image",
      state: "queued",
      statusUrl: `/api/kie/gpt-image-2/${encodeURIComponent(taskId)}`,
    });
  } catch (e) {
    console.error("kie gpt-image-2 create failed:", e);
    return respErr(e instanceof Error ? e.message : "Failed to create task");
  }
}
