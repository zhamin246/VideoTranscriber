import { NextRequest } from "next/server";
import { respData, respErr } from "@/lib/resp";
import { autotraceCenterlineDxf } from "@/lib/convert/centerline-autotrace";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const image = String(body.image || body.png || "");
    if (!image) return respErr("image is required");
    const { dxf } = await autotraceCenterlineDxf(image);
    return respData({ dxf });
  } catch (e) {
    console.error("autotrace centerline failed:", e);
    return respErr(e instanceof Error ? e.message : "AutoTrace centerline failed");
  }
}
