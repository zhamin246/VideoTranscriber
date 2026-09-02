import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { respData, respErr } from "@/lib/resp";
import { getUuid } from "@/lib/hash";
import { createGptImage2ImageToImage } from "@/lib/kie/gpt-image-2";
import { lineartPrompt } from "@/lib/convert/lineart-prompt";
import { persistOriginalImage } from "@/lib/convert/persist-assets";
import { insertConvertJob } from "@/models/convert-job";
import { findUserByEmail } from "@/models/user";
import {
  consumeConvertCredit,
  InsufficientCreditsError,
  refundConvertCredit,
} from "@/services/credit";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let jobId = "";
  let userUuid = "";
  let charged = false;

  try {
    const session = await auth();
    const email =
      (session?.user as { email?: string } | undefined)?.email ||
      session?.user?.email ||
      "";
    if (!email) {
      return respErr("Sign in to convert your photo");
    }
    if (!process.env.KIE_API_KEY) {
      return respErr("Conversion is not configured yet");
    }

    const body = await req.json().catch(() => ({}));
    const image = String(body.image || "").trim();
    const title = String(body.title || "").trim() || "Conversion";
    const removeBackground = Boolean(body.removeBackground);
    const detailed = body.detailed !== false;

    if (!image) return respErr("image is required");
    if (!image.startsWith("data:image/") && !/^https?:\/\//i.test(image)) {
      return respErr("image must be a data URL or https URL");
    }

    const dbUser = await findUserByEmail(email).catch(() => undefined);
    userUuid =
      (session?.user as { uuid?: string } | undefined)?.uuid ||
      dbUser?.uuid ||
      "";
    if (!userUuid) {
      return respErr("Sign in to convert your photo");
    }

    jobId = getUuid();
    const original = await persistOriginalImage(jobId, image);
    const originalUrl = original.url;

    await consumeConvertCredit(jobId, userUuid);
    charged = true;

    const prompt = lineartPrompt({ removeBackground, detailed });
    const kieTaskId = await createGptImage2ImageToImage({
      prompt,
      images: [originalUrl],
      aspect_ratio: "auto",
      resolution: "1K",
    });

    await insertConvertJob({
      uuid: jobId,
      kie_task_id: kieTaskId,
      user_uuid: userUuid,
      user_email: email.toLowerCase(),
      title,
      original_url: originalUrl,
      status: "processing",
    });

    return respData({
      id: jobId,
      status: "processing",
      originalUrl,
      statusUrl: `/api/convert/${encodeURIComponent(jobId)}`,
    });
  } catch (e) {
    if (charged && jobId && userUuid) {
      await refundConvertCredit(jobId, userUuid).catch((err) =>
        console.error("convert refund failed:", err)
      );
    }
    if (e instanceof InsufficientCreditsError) {
      return respErr(e.message);
    }
    console.error("convert create failed:", e);
    return respErr(e instanceof Error ? e.message : "Failed to start conversion");
  }
}
