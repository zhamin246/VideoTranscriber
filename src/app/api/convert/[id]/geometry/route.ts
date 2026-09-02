import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { respData, respErr } from "@/lib/resp";
import { isCadGeometry } from "@/lib/convert/geometry";
import { persistGeometryJson } from "@/lib/convert/persist-assets";
import { putConvertJob } from "@/lib/convert/job-store";
import { findConvertJobByUuid, updateConvertJob } from "@/models/convert-job";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const email =
      (session?.user as { email?: string } | undefined)?.email ||
      session?.user?.email ||
      "";
    if (!email) return respErr("Sign in to save drawing geometry");

    const { id: raw } = await ctx.params;
    const id = decodeURIComponent(raw || "").trim();
    if (!id) return respErr("id is required");

    const row = await findConvertJobByUuid(id);
    if (!row || (row.user_email && row.user_email !== email.toLowerCase())) {
      return respErr("Conversion not found");
    }

    const body = await req.json().catch(() => ({}));
    if (!isCadGeometry(body.geometry)) {
      return respErr("geometry is required");
    }

    const geometry = body.geometry;
    putConvertJob({
      id,
      title: row.title || "drawing",
      geometry,
    });
    let geometryUrl: string;
    try {
      geometryUrl = await persistGeometryJson(id, geometry);
    } catch (first) {
      console.error("persist full geometry failed, retrying without source files:", first);
      geometryUrl = await persistGeometryJson(id, {
        ...geometry,
        sourceSvg: undefined,
        sourceDxf: undefined,
      });
    }
    await updateConvertJob(id, { geometry_url: geometryUrl });
    return respData({ id, geometryUrl });
  } catch (e) {
    console.error("persist convert geometry failed:", e);
    return respErr(e instanceof Error ? e.message : "Failed to save geometry");
  }
}
