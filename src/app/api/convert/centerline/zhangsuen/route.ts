import { NextRequest } from "next/server";
import { respData, respErr } from "@/lib/resp";
import { zhangSuenCenterlineDxf } from "@/lib/convert/centerline-zhangsuen";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const image = String(body.image || body.png || "");
    if (!image) return respErr("image is required");
    const { dxf, geometry } = await zhangSuenCenterlineDxf(image);
    return respData({
      dxf,
      pathsCount: geometry.paths.length,
    });
  } catch (e) {
    console.error("zhangsuen centerline failed:", e);
    return respErr(e instanceof Error ? e.message : "Zhang-Suen centerline failed");
  }
}
