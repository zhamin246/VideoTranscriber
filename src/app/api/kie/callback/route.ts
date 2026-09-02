import { NextRequest } from "next/server";
import { respOk, respErr } from "@/lib/resp";

/**
 * POST /api/kie/callback
 * Optional webhook target for Kie task completion.
 * Set KIE_CALLBACK_URL=https://your-domain/api/kie/callback
 *
 * For now we log the payload; report pipeline can persist resultUrls later.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    console.log(
      "[kie callback]",
      JSON.stringify({
        code: body?.code,
        msg: body?.msg,
        taskId: body?.data?.taskId,
        state: body?.data?.state,
        model: body?.data?.model,
        resultJson: body?.data?.resultJson,
      })
    );
    return respOk();
  } catch (e) {
    console.error("kie callback error:", e);
    return respErr(e instanceof Error ? e.message : "callback failed");
  }
}
