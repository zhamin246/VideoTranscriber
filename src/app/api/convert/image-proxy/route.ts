import { NextRequest, NextResponse } from "next/server";

const MAX_BYTES = 15 * 1024 * 1024;

function allowedHost(host: string) {
  const extra = process.env.STORAGE_DOMAIN
    ? (() => {
        try {
          return new URL(process.env.STORAGE_DOMAIN).hostname.toLowerCase();
        } catch {
          return "";
        }
      })()
    : "";
  return (
    host === "cdn.imagetocad.app" ||
    host.endsWith(".imagetocad.app") ||
    host.endsWith(".r2.dev") ||
    host.endsWith(".cloudflarestorage.com") ||
    (extra && host === extra)
  );
}

export async function GET(req: NextRequest) {
  try {
    const url = String(req.nextUrl.searchParams.get("url") || "").trim();
    if (!url || !/^https?:\/\//i.test(url)) {
      return NextResponse.json(
        { code: -1, message: "A valid image url is required" },
        { status: 400 }
      );
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json({ code: -1, message: "Invalid url" }, { status: 400 });
    }

    if (!allowedHost(parsed.hostname.toLowerCase())) {
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
        { code: -1, message: `Could not load image (${upstream.status})` },
        { status: 502 }
      );
    }

    const buf = Buffer.from(await upstream.arrayBuffer());
    if (buf.length > MAX_BYTES) {
      return NextResponse.json(
        { code: -1, message: "Image is too large to trace" },
        { status: 413 }
      );
    }

    const contentType = upstream.headers.get("content-type") || "image/png";
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType.split(";")[0],
        "Content-Length": String(buf.length),
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (e) {
    console.error("convert image-proxy failed:", e);
    return NextResponse.json(
      { code: -1, message: e instanceof Error ? e.message : "Could not load image" },
      { status: 500 }
    );
  }
}
