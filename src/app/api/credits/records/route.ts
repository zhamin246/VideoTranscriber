import { listCreditRecords } from "@/services/credit";
import { getUserUuid } from "@/services/user";
import { respData, respErr } from "@/lib/resp";

export async function GET(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("Sign in to view credit records");
    }

    const url = new URL(req.url);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 50)));
    const page = Math.max(1, Number(url.searchParams.get("page") || 1) || 1);

    const data = await listCreditRecords(user_uuid, page, limit);
    return respData(data);
  } catch (e) {
    console.error("list credit records failed:", e);
    return respErr(e instanceof Error ? e.message : "Failed to load credit records");
  }
}
