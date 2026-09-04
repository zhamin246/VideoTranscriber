/** Best-effort MP4 duration from an in-memory buffer (looks for mvhd). */
export function parseMp4DurationSeconds(buf: Buffer): number | null {
  const len = buf.length;
  let offset = 0;
  while (offset + 8 <= len) {
    let size = buf.readUInt32BE(offset);
    const type = buf.toString("ascii", offset + 4, offset + 8);
    if (size === 1) {
      if (offset + 16 > len) break;
      const big = Number(buf.readBigUInt64BE(offset + 8));
      size = big;
      if (!Number.isFinite(size) || size < 16) break;
    } else if (size === 0) {
      size = len - offset;
    }
    if (size < 8 || offset + size > len) break;

    if (type === "moov" || type === "trak" || type === "mdia") {
      const nested = buf.subarray(offset + 8, offset + size);
      const found = parseMp4DurationSeconds(nested);
      if (found != null) return found;
    } else if (type === "mvhd") {
      const body = offset + 8;
      if (body + 20 > len) break;
      const version = buf[body];
      if (version === 0 && body + 20 <= len) {
        const timescale = buf.readUInt32BE(body + 12);
        const duration = buf.readUInt32BE(body + 16);
        if (timescale > 0 && duration > 0) return duration / timescale;
      } else if (version === 1 && body + 32 <= len) {
        const timescale = buf.readUInt32BE(body + 20);
        const duration = Number(buf.readBigUInt64BE(body + 24));
        if (timescale > 0 && duration > 0 && Number.isFinite(duration)) {
          return duration / timescale;
        }
      }
    }

    offset += size;
  }
  return null;
}

/** Fetch a short prefix (and optionally suffix) of a media URL and parse duration. */
export async function probeRemoteMediaDuration(
  fileUrl: string,
  timeoutMs = 12_000,
): Promise<number | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const head = await fetch(fileUrl, {
      signal: ctrl.signal,
      headers: { Range: "bytes=0-1048575", Accept: "*/*" },
      redirect: "follow",
    });
    if (!head.ok && head.status !== 206) return null;
    const buf = Buffer.from(await head.arrayBuffer());
    let duration = parseMp4DurationSeconds(buf);
    if (duration != null) return duration;

    const total = Number(
      /\/(\d+)$/.exec(head.headers.get("content-range") || "")?.[1] ||
        head.headers.get("content-length") ||
        0,
    );
    if (total > buf.length + 64) {
      const start = Math.max(0, total - 1_048_576);
      const tail = await fetch(fileUrl, {
        signal: ctrl.signal,
        headers: { Range: `bytes=${start}-${total - 1}`, Accept: "*/*" },
        redirect: "follow",
      });
      if (tail.ok || tail.status === 206) {
        duration = parseMp4DurationSeconds(Buffer.from(await tail.arrayBuffer()));
        if (duration != null) return duration;
      }
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
