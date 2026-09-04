import { NextRequest } from "next/server";
import { getPlaybackCache } from "@/lib/media/playback-cache";

export const runtime = "nodejs";
export const maxDuration = 30;

function parseRange(header: string | null, size: number) {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/i.exec(header.trim());
  if (!m) return null;
  let start = m[1] ? Number(m[1]) : 0;
  let end = m[2] ? Number(m[2]) : size - 1;
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  if (m[1] === "" && m[2]) {
    // suffix bytes: bytes=-N
    const n = Number(m[2]);
    start = Math.max(0, size - n);
    end = size - 1;
  }
  if (start < 0 || end < start || start >= size) return null;
  end = Math.min(end, size - 1);
  return { start, end };
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const entry = getPlaybackCache(id);
  if (!entry) {
    return new Response("Playback expired. Transcribe the link again.", {
      status: 404,
    });
  }

  const size = entry.buf.byteLength;
  const range = parseRange(req.headers.get("range"), size);
  const headers = new Headers({
    "Content-Type": entry.contentType || "video/mp4",
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=3600",
    "Content-Disposition": `inline; filename="${entry.filename.replace(/"/g, "")}"`,
  });

  if (range) {
    const { start, end } = range;
    const chunk = entry.buf.subarray(start, end + 1);
    headers.set("Content-Length", String(chunk.byteLength));
    headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
    return new Response(chunk, { status: 206, headers });
  }

  headers.set("Content-Length", String(size));
  return new Response(entry.buf, { status: 200, headers });
}
