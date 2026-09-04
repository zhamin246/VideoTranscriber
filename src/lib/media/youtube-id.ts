/** Extract a YouTube video id from a URL string or URL object. */
export function extractYoutubeId(raw: string | URL): string | null {
  let url: URL;
  try {
    url = typeof raw === "string" ? new URL(raw) : raw;
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./i, "").toLowerCase();
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id && /^[\w-]{6,}$/.test(id) ? id : null;
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
    const v = url.searchParams.get("v");
    if (v && /^[\w-]{6,}$/.test(v)) return v;
    const parts = url.pathname.split("/").filter(Boolean);
    if ((parts[0] === "shorts" || parts[0] === "embed" || parts[0] === "live") && parts[1]) {
      return /^[\w-]{6,}$/.test(parts[1]) ? parts[1] : null;
    }
  }
  return null;
}
