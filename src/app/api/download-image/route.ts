import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/download-image?url=...&filename=...
 * Server-side fetch so cross-origin CDN images download as a file
 * instead of opening in a new tab.
 */
export async function GET(req: NextRequest) {
  try {
    const url = String(req.nextUrl.searchParams.get("url") || "").trim();
    const filenameRaw = String(
      req.nextUrl.searchParams.get("filename") || "face-rating-analysis.jpg"
    ).trim();
    const filename = filenameRaw.replace(/[^\w.\-]+/g, "_").slice(0, 120);

    if (!url || !/^https?:\/\//i.test(url)) {
      return NextResponse.json(
        { code: -1, message: "A valid https image url is required" },
        { status: 400 }
      );
    }

    // Basic allowlist — Kie / CDN hosts we generate to
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json(
        { code: -1, message: "Invalid url" },
        { status: 400 }
      );
    }
    const host = parsed.hostname.toLowerCase();
    const allowed =
      host.endsWith("aiquickdraw.com") ||
      host.endsWith("kie.ai") ||
      host.endsWith("nearerai.com") ||
      host.endsWith("r2.dev") ||
      host.endsWith("cloudflarestorage.com") ||
      host === "localhost" ||
      host.endsWith("face-rating.app");
    if (!allowed) {
      return NextResponse.json(
        { code: -1, message: "Image host not allowed" },
        { status: 403 }
      );
    }

    const upstream = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "image/*,*/*" },
    });
    if (!upstream.ok) {
      return NextResponse.json(
        { code: -1, message: `Upstream fetch failed (${upstream.status})` },
        { status: 502 }
      );
    }

    const contentType =
      upstream.headers.get("content-type") || "image/jpeg";
    const buf = Buffer.from(await upstream.arrayBuffer());
    const ext = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : "jpg";
    const finalName = filename.includes(".")
      ? filename
      : `${filename}.${ext}`;

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(buf.length),
        "Content-Disposition": `attachment; filename="${finalName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    console.error("download-image failed:", e);
    return NextResponse.json(
      {
        code: -1,
        message: e instanceof Error ? e.message : "Download failed",
      },
      { status: 500 }
    );
  }
}
