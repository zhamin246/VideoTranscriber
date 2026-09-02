import { NextRequest } from "next/server";
import { grantDueYearlyCreditsAll } from "@/services/credit";
import { respData, respErr } from "@/lib/resp";

export const dynamic = "force-dynamic";

function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return new Response("unauthorized", { status: 401 });
  }

  try {
    const granted = await grantDueYearlyCreditsAll();
    return respData({ granted });
  } catch (e) {
    console.error("grant yearly credits cron failed:", e);
    return respErr("grant yearly credits failed");
  }
}
