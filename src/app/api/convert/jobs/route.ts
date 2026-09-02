import { auth } from "@/auth";
import { respData, respErr } from "@/lib/resp";
import { CONVERT_RECENT_LIMIT } from "@/lib/convert/history";
import {
  countConvertJobsForUser,
  listConvertJobsForUser,
} from "@/models/convert-job";

function toItem(row: {
  uuid: string;
  title: string;
  original_url: string;
  lineart_url: string;
  created_at: Date | null;
}) {
  return {
    id: row.uuid,
    title: row.title,
    thumbUrl: row.lineart_url,
    originalUrl: row.original_url,
    vectorUrl: row.lineart_url,
    createdAt: row.created_at?.toISOString?.() || null,
  };
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    const email =
      (session?.user as { email?: string } | undefined)?.email ||
      session?.user?.email ||
      "";
    const uuid = (session?.user as { uuid?: string } | undefined)?.uuid || "";
    if (!email && !uuid) {
      return respErr("Sign in to view conversions");
    }

    const url = new URL(req.url);
    const limit = Math.min(
      50,
      Math.max(1, Number(url.searchParams.get("limit") || CONVERT_RECENT_LIMIT))
    );
    const offset = Math.max(0, Number(url.searchParams.get("offset") || 0) || 0);

    const [rows, total] = await Promise.all([
      listConvertJobsForUser({
        user_email: email,
        user_uuid: uuid,
        limit,
        offset,
      }),
      countConvertJobsForUser({ user_email: email, user_uuid: uuid }),
    ]);

    return respData({
      total,
      items: rows.map(toItem),
    });
  } catch (e) {
    console.error("list convert jobs failed:", e);
    return respErr(e instanceof Error ? e.message : "Failed to load conversions");
  }
}
