/** Homepage 2-gram. Inner pages must not use this phrase. */
const HOME_KEYWORD = /\bvideo\s+transcriber(?:\s+ai)?\b/gi;

export function softenHomeKeyword(text: string): string {
  let s = String(text || "");
  s = s.replace(/\s*\|\s*Video Transcriber\s*$/i, "");
  s = s.replace(/Video Transcriber vs\s+/gi, "vs ");
  if (/^video transcriber$/i.test(s.trim())) return "Video tools";
  s = s.replace(/\binto Video Transcriber\b/gi, "in");
  s = s.replace(/\bWhen Video Transcriber\b/gi, "When it");
  s = s.replace(HOME_KEYWORD, "the workspace");
  s = s.replace(/\.\s+the workspace/g, ". The workspace");
  return s.replace(/\s{2,}/g, " ").trim();
}

/** On keyword-sensitive pages, avoid flooding "to text" and the homepage 2-gram. */
export function softenToTextLabel(label: string): string {
  return softenHomeKeyword(
    label
      .replace(/\s+to Text$/i, " transcript")
      .replace(/\s+to text$/i, " transcript")
      .replace(/Transcribe Video to Text Online Free/i, "Transcribe video online free"),
  );
}

export function isToTextSensitivePath(pathname: string): boolean {
  return (
    pathname.includes("/tiktok-transcript-generator") ||
    pathname.includes("/instagram-transcript-generator")
  );
}
