import { NextRequest } from "next/server";
import {
  isAllowedThumbnailUrl,
  refererForThumbnail,
} from "@/lib/media/thumbnail-proxy";

export const runtime = "nodejs";
export const maxDuration = 20;

export async function GET(req: NextRequest) {
  const raw = (req.nextUrl.searchParams.get("url") || "")
    .replace(/&amp;/gi, "&")
    .replace(/&#38;/g, "&")
    .trim();
  if (!raw || raw.length > 8192 || !isAllowedThumbnailUrl(raw)) {
    return new Response("Bad thumbnail URL", { status: 400 });
  }

  try {
    const upstream = await fetch(raw, {
      redirect: "follow",
      cache: "no-store",
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: refererForThumbnail(raw),
      },
    });
    if (!upstream.ok) {
      return new Response("Thumbnail unavailable", { status: 502 });
    }
    const type = upstream.headers.get("content-type") || "image/jpeg";
    if (!type.startsWith("image/") && !type.includes("octet-stream")) {
      return new Response("Not an image", { status: 502 });
    }
    const buf = Buffer.from(await upstream.arrayBuffer());
    if (buf.byteLength > 8 * 1024 * 1024) {
      return new Response("Thumbnail too large", { status: 413 });
    }
    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": type.startsWith("image/") ? type : "image/jpeg",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new Response("Thumbnail fetch failed", { status: 502 });
  }
}
