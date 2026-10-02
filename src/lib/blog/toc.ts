export type BlogTocItem = {
  id: string;
  title: string;
  level: 2 | 3;
};

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Extract ## / ### headings for in-page navigation. */
export function extractHeadingsFromMarkdown(
  content?: string | null,
): BlogTocItem[] {
  if (!content) return [];
  const items: BlogTocItem[] = [];
  const seen = new Map<string, number>();

  for (const line of content.split(/\r?\n/)) {
    const m = /^(#{2,3})\s+(.+)$/.exec(line.trim());
    if (!m) continue;
    const level = m[1].length === 2 ? 2 : 3;
    const title = m[2].replace(/\s+#+\s*$/, "").trim();
    if (!title) continue;
    let id = slugifyHeading(title);
    const n = (seen.get(id) || 0) + 1;
    seen.set(id, n);
    if (n > 1) id = `${id}-${n}`;
    items.push({ id, title, level });
  }

  return items;
}
