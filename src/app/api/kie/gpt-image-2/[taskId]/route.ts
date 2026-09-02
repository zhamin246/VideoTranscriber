import { respData, respErr } from "@/lib/resp";
import { getGptImage2Task } from "@/lib/kie/gpt-image-2";

/**
 * GET /api/kie/gpt-image-2/[taskId]
 * Poll Kie task status and result image URLs.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ taskId: string }> }
) {
  try {
    if (!process.env.KIE_API_KEY) {
      return respErr("KIE_API_KEY is not configured");
    }

    const { taskId: raw } = await ctx.params;
    const taskId = decodeURIComponent(raw || "").trim();
    if (!taskId) return respErr("taskId is required");

    const { task, resultUrls } = await getGptImage2Task(taskId);

    return respData({
      taskId: task.taskId,
      model: task.model,
      state: task.state,
      resultUrls,
      failCode: task.failCode || "",
      failMsg: task.failMsg || "",
      progress: task.progress ?? null,
      creditsConsumed: task.creditsConsumed ?? null,
      createTime: task.createTime ?? null,
      completeTime: task.completeTime ?? null,
    });
  } catch (e) {
    console.error("kie gpt-image-2 status failed:", e);
    return respErr(e instanceof Error ? e.message : "Failed to query task");
  }
}
