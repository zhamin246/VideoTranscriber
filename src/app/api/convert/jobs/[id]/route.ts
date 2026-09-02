import { auth } from "@/auth";
import { respData, respErr } from "@/lib/resp";
import { findConvertJobByUuid } from "@/models/convert-job";

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
    if (!email) return respErr("Sign in to view this conversion");

    const { id: raw } = await ctx.params;
    const id = decodeURIComponent(raw || "").trim();
    if (!id) return respErr("id is required");

    const job = await findConvertJobByUuid(id);
    if (!job || job.user_email !== email.toLowerCase()) {
      return respErr("Conversion not found");
    }
    if (job.status !== "complete" || !job.lineart_url) {
      return respErr("Conversion is not ready yet");
    }

    return respData({
      id: job.uuid,
      title: job.title,
      thumbUrl: job.lineart_url,
      originalUrl: job.original_url,
      vectorUrl: job.lineart_url,
    });
  } catch (e) {
    console.error("get convert job failed:", e);
    return respErr(e instanceof Error ? e.message : "Failed to load conversion");
  }
}
