/** Rough reading time from markdown/plain text (~200 wpm). */
export function estimateReadingMinutes(
  content?: string | null,
  description?: string | null,
): number {
  const raw = `${content || ""} ${description || ""}`;
  const text = raw
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_\[\]()!`~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = text ? text.split(/\s+/).length : 0;
  return Math.max(1, Math.min(60, Math.ceil(words / 200)));
}
