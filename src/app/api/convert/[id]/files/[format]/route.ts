import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { respErr } from "@/lib/resp";
import { exportGeometry, isExportFormat } from "@/lib/convert/export";
import { sanitizeCadFilename } from "@/lib/convert/geometry";
import { resolveConvertGeometry } from "@/lib/convert/resolve-geometry";
import { findConvertJobByUuid } from "@/models/convert-job";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string; format: string }> }
) {
  try {
    const session = await auth();
    const email =
      (session?.user as { email?: string } | undefined)?.email ||
      session?.user?.email ||
      "";
    if (!email) return respErr("Sign in to download CAD files");

    const { id: rawId, format: rawFormat } = await ctx.params;
    const id = decodeURIComponent(rawId || "").trim();
    const format = decodeURIComponent(rawFormat || "").toLowerCase();
    if (!id) return respErr("id is required");
    if (!isExportFormat(format)) {
      return respErr("format must be dxf, svg, pdf, or geometry");
    }

    const row = await findConvertJobByUuid(id);
    if (!row || (row.user_email && row.user_email !== email.toLowerCase())) {
      return respErr("Conversion not found");
    }

    const resolved = await resolveConvertGeometry({ id });
    if (!resolved) {
      return respErr("Drawing expired — convert again, then download");
    }

    const file = exportGeometry(resolved.geometry, format);
    const filename = sanitizeCadFilename(row.title || resolved.title, file.ext);
    return new NextResponse(Buffer.from(file.body), {
      status: 200,
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("convert file download failed:", e);
    return respErr(e instanceof Error ? e.message : "Failed to download drawing");
  }
}
