import { NextRequest } from "next/server";
import { respData, respErr } from "@/lib/resp";
import { vectorizeWithVtracerBuffer } from "@/lib/convert/trace-vtracer";
import { pathCount, pointCount } from "@/lib/convert/geometry";
import type { VectorLineParams } from "@/lib/convert/vectorline-params";

export const runtime = "nodejs";
export const maxDuration = 60;

function pngFromBody(png: string) {
  const raw = String(png || "").trim();
  const comma = raw.indexOf(",");
  const b64 = raw.startsWith("data:") && comma > 0 ? raw.slice(comma + 1) : raw;
  if (!b64) return null;
  return Buffer.from(b64, "base64");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const buffer = pngFromBody(String(body.png || body.image || ""));
    if (!buffer?.length) return respErr("png is required");

    const width = Number(body.width) || 0;
    const height = Number(body.height) || 0;
    const params = (body.params || {}) as Partial<VectorLineParams>;
    const geometry = vectorizeWithVtracerBuffer(buffer, width, height, params);
    if (!geometry.paths.length) {
      return respErr("No outlines found to vectorize");
    }

    return respData({
      geometry,
      width: geometry.contentWidth,
      height: geometry.contentHeight,
      pathsCount: pathCount(geometry),
      totalNodes: pointCount(geometry),
    });
  } catch (e) {
    console.error("vtracer failed:", e);
    return respErr(e instanceof Error ? e.message : "Failed to trace outlines");
  }
}
