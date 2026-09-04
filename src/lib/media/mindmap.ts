/**
 * MindMap — hierarchical topic tree from transcript (videotranscriber.ai style).
 * LLM → JSON tree → Markdown → markmap render.
 */

import { llmText, parseJsonFromModelText } from "@/lib/llm";
import {
  buildTranscriptBlocks,
  formatTimestamp,
  type TranscriptSegment,
} from "@/lib/media/workspace-mock";

export type MindMapNode = {
  title: string;
  children?: MindMapNode[];
};

export type AiMindMap = {
  title: string;
  children: MindMapNode[];
  /** Markdown for markmap (derived from tree). */
  markdown: string;
  createdAt: number;
};

const MAX_DEPTH = 4;
const MAX_CHILDREN = 10;
const MAX_TITLE = 120;

function buildMindmapScript(
  segments: TranscriptSegment[],
  maxChars = 28_000,
): string {
  const blocks = buildTranscriptBlocks(segments, 30);
  const lines: string[] = [];
  let size = 0;
  for (const b of blocks) {
    const text = b.sentences.map((s) => s.text).join("");
    const line = `[${formatTimestamp(b.startSeconds)}] ${text}`;
    if (size + line.length + 1 > maxChars) {
      lines.push("[…transcript truncated…]");
      break;
    }
    lines.push(line);
    size += line.length + 1;
  }
  return lines.join("\n");
}

function cleanTitle(raw: unknown): string {
  return String(raw || "")
    .replace(/^#+\s*/, "")
    .replace(/^[-*•]\s+/, "")
    .trim()
    .slice(0, MAX_TITLE);
}

function normalizeNode(raw: unknown, depth: number): MindMapNode | null {
  if (depth > MAX_DEPTH) return null;
  if (typeof raw === "string") {
    const title = cleanTitle(raw);
    return title ? { title } : null;
  }
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const title = cleanTitle(obj.title ?? obj.text ?? obj.name ?? obj.topic);
  if (!title) return null;

  const kidsRaw = Array.isArray(obj.children)
    ? obj.children
    : Array.isArray(obj.nodes)
      ? obj.nodes
      : Array.isArray(obj.items)
        ? obj.items
        : [];
  const children = kidsRaw
    .map((c) => normalizeNode(c, depth + 1))
    .filter((c): c is MindMapNode => Boolean(c))
    .slice(0, MAX_CHILDREN);

  return children.length ? { title, children } : { title };
}

export function normalizeMindMap(raw: unknown): AiMindMap | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  // Already a saved payload
  if (typeof obj.markdown === "string" && obj.markdown.trim()) {
    const title =
      cleanTitle(obj.title) ||
      obj.markdown
        .split("\n")
        .find((l) => l.trim())
        ?.replace(/^#+\s*/, "")
        .trim() ||
      "Mind Map";
    const children = Array.isArray(obj.children)
      ? obj.children
          .map((c) => normalizeNode(c, 1))
          .filter((c): c is MindMapNode => Boolean(c))
      : [];
    return {
      title,
      children,
      markdown: String(obj.markdown).trim(),
      createdAt: Number(obj.createdAt) || Date.now(),
    };
  }

  const title = cleanTitle(obj.title ?? obj.root ?? obj.topic) || "Mind Map";
  const kidsRaw = Array.isArray(obj.children)
    ? obj.children
    : Array.isArray(obj.nodes)
      ? obj.nodes
      : Array.isArray(obj.branches)
        ? obj.branches
        : [];
  const children = kidsRaw
    .map((c) => normalizeNode(c, 1))
    .filter((c): c is MindMapNode => Boolean(c))
    .slice(0, MAX_CHILDREN);

  if (!children.length) return null;
  const markdown = mindMapToMarkdown({ title, children });
  return {
    title,
    children,
    markdown,
    createdAt: Date.now(),
  };
}

/** Convert tree → markmap Markdown (# / ## / -). */
export function mindMapToMarkdown(tree: {
  title: string;
  children?: MindMapNode[];
}): string {
  const lines: string[] = [`# ${cleanTitle(tree.title) || "Mind Map"}`];

  const walk = (nodes: MindMapNode[] | undefined, depth: number) => {
    if (!nodes?.length) return;
    for (const n of nodes) {
      const title = cleanTitle(n.title);
      if (!title) continue;
      if (depth === 1) {
        lines.push(`## ${title}`);
      } else {
        const indent = "  ".repeat(Math.max(0, depth - 2));
        lines.push(`${indent}- ${title}`);
      }
      walk(n.children, depth + 1);
    }
  };

  walk(tree.children, 1);
  return lines.join("\n");
}

export function mindmapAreComplete(m: AiMindMap | null | undefined): boolean {
  return Boolean(m?.markdown?.trim() && m.title);
}

/** Flatten tree to plain text outline for TXT export. */
export function mindMapToPlainText(tree: {
  title: string;
  children?: MindMapNode[];
}): string {
  const lines: string[] = [cleanTitle(tree.title) || "Mind Map"];
  const walk = (nodes: MindMapNode[] | undefined, depth: number) => {
    if (!nodes?.length) return;
    for (const n of nodes) {
      const title = cleanTitle(n.title);
      if (!title) continue;
      lines.push(`${"  ".repeat(depth)}- ${title}`);
      walk(n.children, depth + 1);
    }
  };
  walk(tree.children, 1);
  return lines.join("\n");
}

export function mindMapFileBase(title: string) {
  const base = cleanTitle(title)
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return base || "mindmap";
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // delay revoke so the download can start
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function downloadMindMapMarkdown(mindmap: AiMindMap) {
  const md = mindmap.markdown?.trim() || mindMapToMarkdown(mindmap);
  triggerDownload(
    new Blob([md], { type: "text/markdown;charset=utf-8" }),
    `${mindMapFileBase(mindmap.title)}.md`,
  );
}

export function downloadMindMapTxt(mindmap: AiMindMap) {
  triggerDownload(
    new Blob([mindMapToPlainText(mindmap)], {
      type: "text/plain;charset=utf-8",
    }),
    `${mindMapFileBase(mindmap.title)}.txt`,
  );
}

export function downloadMindMapJson(mindmap: AiMindMap) {
  const payload = {
    title: mindmap.title,
    children: mindmap.children,
  };
  triggerDownload(
    new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    }),
    `${mindMapFileBase(mindmap.title)}.json`,
  );
}

export function downloadMindMapSvg(svg: SVGSVGElement, title: string) {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  try {
    const bbox = svg.getBBox();
    const pad = 24;
    clone.setAttribute(
      "viewBox",
      `${bbox.x - pad} ${bbox.y - pad} ${bbox.width + pad * 2} ${bbox.height + pad * 2}`,
    );
  } catch {
    /* ignore empty bbox */
  }
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const xml = new XMLSerializer().serializeToString(clone);
  triggerDownload(
    new Blob([xml], { type: "image/svg+xml;charset=utf-8" }),
    `${mindMapFileBase(title)}.svg`,
  );
}

/**
 * Export live markmap as PNG via DOM snapshot (html-to-image).
 * Pass the stage wrapper (HTMLElement), not a raw SVG clone — markmap
 * foreignObject taints canvas when SVG is re-serialized into an Image.
 */
export async function downloadMindMapPng(
  stage: HTMLElement,
  title: string,
): Promise<void> {
  const { toBlob } = await import("html-to-image");
  const rect = stage.getBoundingClientRect();
  const blob = await toBlob(stage, {
    backgroundColor: "#FAFBFC",
    pixelRatio: 2,
    cacheBust: true,
    width: Math.max(1, Math.ceil(rect.width)),
    height: Math.max(1, Math.ceil(rect.height)),
    filter: (node) => {
      if (!(node instanceof HTMLElement)) return true;
      // skip floating toolbar / menus inside stage (none expected)
      return !node.dataset?.mmExportIgnore;
    },
  });
  if (!blob) throw new Error("PNG encode failed");
  triggerDownload(blob, `${mindMapFileBase(title)}.png`);
}

/**
 * Generate a topic mind map from transcript via Gemini.
 */
export async function generateMindMap(opts: {
  title?: string;
  durationSeconds?: number | null;
  segments: TranscriptSegment[];
  signal?: AbortSignal;
}): Promise<AiMindMap> {
  const segments = opts.segments.filter((s) => s.text?.trim());
  if (!segments.length) {
    throw new Error("No transcript available to generate mind map");
  }

  const script = buildMindmapScript(segments);
  const durationLabel =
    typeof opts.durationSeconds === "number" && opts.durationSeconds > 0
      ? formatTimestamp(opts.durationSeconds)
      : "unknown";

  const prompt = `You build a mind map from one audio/video transcript.
Organize by TOPIC RELATIONSHIPS (not a chronological outline).
Match the language of the transcript.

Return ONLY valid JSON (no markdown fences):
{"title":"Central topic (short)","children":[{"title":"Branch","children":[{"title":"Leaf"},{"title":"Leaf"}]}]}

Rules:
- Root title: 3–12 words capturing the whole piece.
- 4–8 top-level branches; each branch may have 2–6 children.
- Max depth 3 levels below the root (root → branch → leaf → optional sub-leaf).
- Titles must be concise (prefer under 8 words). No timestamps in titles.
- Do not invent topics absent from the transcript.

Title: ${opts.title || "Untitled"}
Duration: ${durationLabel}

Transcript (~30s blocks):
${script}`;

  const text = await llmText({
    prompt,
    includeThoughts: false,
    signal: opts.signal,
  });

  const parsed = parseJsonFromModelText<unknown>(text);
  const mindmap = normalizeMindMap(parsed);
  if (!mindmap) {
    throw new Error("Model returned no mind map");
  }
  return mindmap;
}
