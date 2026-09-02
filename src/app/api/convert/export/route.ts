import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { respErr } from "@/lib/resp";
import { exportGeometry, isExportFormat } from "@/lib/convert/export";
import { sanitizeCadFilename } from "@/lib/convert/geometry";
import { resolveConvertGeometry } from "@/lib/convert/resolve-geometry";
import { findConvertJobByUuid } from "@/models/convert-job";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const email =
      (session?.user as { email?: string } | undefined)?.email ||
      session?.user?.email ||
      "";
    if (!email) return respErr("Sign in to download CAD files");

    const body = await req.json().catch(() => ({}));
    const format = String(body.format || "").toLowerCase();
    if (!isExportFormat(format)) {
      return respErr("format must be dxf, svg, pdf, or geometry");
    }

    const id = String(body.id || "").trim();
    const titleHint = String(body.title || "").trim();
    if (id) {
      const row = await findConvertJobByUuid(id);
      if (row?.user_email && row.user_email !== email.toLowerCase()) {
        return respErr("Conversion not found");
      }
    }

    const resolved = await resolveConvertGeometry({
      id,
      geometry: body.geometry,
      persist: Boolean(id),
    });
    if (!resolved) {
      return respErr("Missing drawing geometry — convert again, then download");
    }

    const file = exportGeometry(resolved.geometry, format);
    const filename = sanitizeCadFilename(
      titleHint || resolved.title || "drawing",
      file.ext
    );
    return new NextResponse(Buffer.from(file.body), {
      status: 200,
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("convert export failed:", e);
    return respErr(e instanceof Error ? e.message : "Failed to export drawing");
  }
}
