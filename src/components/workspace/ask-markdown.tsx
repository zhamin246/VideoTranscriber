"use client";

import { useMemo } from "react";
import MarkdownIt from "markdown-it";
import { parseClockTimestamp } from "@/lib/media/workspace-mock";

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
});

const CLOCK = String.raw`(?:\d{1,2}:)?\d{1,2}:\d{2}`;
const RANGE_RE = new RegExp(
  String.raw`\[(${CLOCK})\s*[~–-]\s*(${CLOCK})\]`,
  "g",
);
const SINGLE_RE = new RegExp(String.raw`\[(${CLOCK})\]`, "g");

function seekButton(label: string, seconds: number) {
  return `<button type="button" class="ask-seek font-medium text-[#1C6CFB] hover:underline" data-seek="${seconds}">${label}</button>`;
}

/** Turn `[MM:SS]` / `[MM:SS~MM:SS]` into seek buttons after Markdown render. */
export function linkifyAskTimestamps(html: string): string {
  let out = html.replace(RANGE_RE, (full, a: string, b: string) => {
    const sa = parseClockTimestamp(a);
    const sb = parseClockTimestamp(b);
    if (sa == null || sb == null) return full;
    return `[${seekButton(a, sa)}~${seekButton(b, sb)}]`;
  });
  out = out.replace(SINGLE_RE, (full, a: string) => {
    const sa = parseClockTimestamp(a);
    if (sa == null) return full;
    return `[${seekButton(a, sa)}]`;
  });
  return out;
}

/** Safe Markdown for Ask AI replies (lists, bold, clickable timestamps). */
export default function AskMarkdown({
  content,
  onSeek,
}: {
  content: string;
  onSeek?: (seconds: number) => void;
}) {
  const html = useMemo(
    () => linkifyAskTimestamps(md.render(content || "")),
    [content],
  );

  if (!content.trim()) {
    return (
      <span className="inline-block h-4 w-1.5 animate-pulse rounded-sm bg-[#3B82F6]/70" />
    );
  }

  return (
    <div
      className="ask-md text-sm leading-6 text-gray-900 [&_a]:text-[#1C6CFB] [&_a]:underline [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.9em] [&_h1]:mb-2 [&_h1]:mt-3 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:mb-1.5 [&_h3]:mt-2 [&_h3]:text-sm [&_h3]:font-semibold [&_li]:my-0.5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5"
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={(e) => {
        if (!onSeek) return;
        const target = (e.target as HTMLElement | null)?.closest?.(
          "button.ask-seek",
        ) as HTMLElement | null;
        if (!target) return;
        e.preventDefault();
        const sec = Number(target.getAttribute("data-seek"));
        if (Number.isFinite(sec)) onSeek(sec);
      }}
    />
  );
}
