import { NextRequest } from "next/server";
import {
  isAllowedStreamUrl,
  refererForStream,
} from "@/lib/media/stream-proxy";

export const runtime = "nodejs";
export const maxDuration = 120;

function parseRangeRequest(header: string | null) {
  if (!header) return null;
  const m = /^bytes=(\d+)-(\d*)$/i.exec(header.trim());
  if (!m) return null;
  const start = Number(m[1]);
  const end = m[2] ? Number(m[2]) : null;
  if (!Number.isFinite(start) || start < 0) return null;
  if (end != null && (!Number.isFinite(end) || end < start)) return null;
  return { start, end };
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url") || "";
  if (!raw || raw.length > 8192 || !isAllowedStreamUrl(raw)) {
    return new Response("Bad media URL", { status: 400 });
  }

  const rangeHeader = req.headers.get("range");
  const range = parseRangeRequest(rangeHeader);
  try {
    const upstream = await fetch(raw, {
      redirect: "follow",
      headers: {
        Accept: "*/*",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: refererForStream(raw),
        ...(rangeHeader ? { Range: rangeHeader } : {}),
      },
    });

    if (!upstream.ok && upstream.status !== 206) {
      return new Response("Media unavailable", { status: 502 });
    }

    const headers = new Headers();
    const type = upstream.headers.get("content-type") || "video/mp4";
    headers.set("Content-Type", type);
    headers.set("Accept-Ranges", "bytes");
    headers.set("Cache-Control", "private, max-age=300");

    const status = upstream.status;
    const len = upstream.headers.get("content-length");
    let cr = upstream.headers.get("content-range");

    // Cobalt often returns 206 without Content-Range — synthesize it for <video>.
    if (status === 206 && !cr && range && len) {
      const size = Number(len);
      const end = range.end != null ? range.end : range.start + size - 1;
      cr = `bytes ${range.start}-${end}/*`;
    }
    if (cr) headers.set("Content-Range", cr);
    if (len) headers.set("Content-Length", len);

    return new Response(upstream.body, { status, headers });
  } catch {
    return new Response("Media fetch failed", { status: 502 });
  }
}
