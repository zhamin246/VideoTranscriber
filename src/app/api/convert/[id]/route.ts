import { auth } from "@/auth";
import { respData, respErr } from "@/lib/resp";
import { getGptImage2Task } from "@/lib/kie/gpt-image-2";
import { persistLineartFromUrl } from "@/lib/convert/persist-assets";
import {
  findConvertJobByUuid,
  updateConvertJob,
} from "@/models/convert-job";
import { refundConvertCredit } from "@/services/credit";

async function markFailedAndRefund(
  job: { uuid: string; user_uuid?: string | null },
  error: string
) {
  await updateConvertJob(job.uuid, { status: "failed" });
  if (job.user_uuid) {
    await refundConvertCredit(job.uuid, job.user_uuid).catch((err) =>
      console.error("convert refund failed:", err)
    );
  }
  return respData({
    id: job.uuid,
    status: "failed",
    error,
  });
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const email =
      (session?.user as { email?: string } | undefined)?.email ||
      session?.user?.email ||
      "";
    if (!email) {
      return respErr("Sign in to check conversion status");
    }
    if (!process.env.KIE_API_KEY) {
      return respErr("Conversion is not configured yet");
    }

    const { id: raw } = await ctx.params;
    const id = decodeURIComponent(raw || "").trim();
    if (!id) return respErr("id is required");

    const job = await findConvertJobByUuid(id);
    if (!job || (job.user_email && job.user_email !== email.toLowerCase())) {
      return respErr("Conversion not found");
    }

    if (job.status === "complete" && job.lineart_url) {
      return respData({
        id: job.uuid,
        status: "complete",
        previewUrl: job.lineart_url,
        originalUrl: job.original_url,
        title: job.title,
      });
    }

    if (job.status === "failed") {
      if (job.user_uuid) {
        await refundConvertCredit(job.uuid, job.user_uuid).catch(() => undefined);
      }
      return respData({
        id: job.uuid,
        status: "failed",
        error: "Conversion failed",
      });
    }

    const taskId = job.kie_task_id || id;
    const { task, resultUrls } = await getGptImage2Task(taskId);
    const state = String(task.state || "");

    if (state === "success") {
      const previewUrl = resultUrls[0] || "";
      if (!previewUrl) {
        return markFailedAndRefund(
          job,
          "Conversion finished but no drawing was returned"
        );
      }
      try {
        const lineartUrl = await persistLineartFromUrl(job.uuid, previewUrl);
        await updateConvertJob(job.uuid, {
          lineart_url: lineartUrl,
          status: "complete",
        });
        return respData({
          id: job.uuid,
          status: "complete",
          previewUrl: lineartUrl,
          originalUrl: job.original_url,
          title: job.title,
        });
      } catch (e) {
        return markFailedAndRefund(
          job,
          e instanceof Error ? e.message : "Could not save the drawing"
        );
      }
    }

    if (state === "fail") {
      return markFailedAndRefund(
        job,
        task.failMsg || task.failCode || "Conversion failed"
      );
    }

    return respData({
      id: job.uuid,
      status: "processing",
      originalUrl: job.original_url,
      stage:
        state === "generating"
          ? "generating"
          : state === "waiting"
            ? "waiting"
            : "queued",
    });
  } catch (e) {
    console.error("convert status failed:", e);
    return respErr(e instanceof Error ? e.message : "Failed to query conversion");
  }
}
