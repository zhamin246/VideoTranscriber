"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ChapterItem } from "@/lib/media/chapters";
import type {
  TranscriptBlock,
  TranscriptSentence,
} from "@/lib/media/workspace-mock";

export type SearchHit = {
  id: string;
  startSeconds: number;
  containerKey: string;
  start: number;
  end: number;
  blockIndex?: number;
  sentenceKey?: string;
  chapterIndex?: number;
};

type LeftTab = "transcript" | "subtitles" | "chapter";

const MATCH_BG = "#DEE9FC";
const ACTIVE_RING = "ring-2 ring-[#70A3F3]";

const HUGE = {
  arrowUp01:
    '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18 15s-4.42-6-6-6s-6 6-6 6"/>',
  arrowDown01:
    '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18 9s-4.419 6-6 6s-6-6-6-6"/>',
} as const;

function HugeIcon({ body, className }: { body: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}

function collectHitsInText(
  text: string,
  query: string,
  base: Omit<SearchHit, "id" | "start" | "end"> & { idPrefix: string },
): SearchHit[] {
  const q = query.trim();
  if (!q || !text) return [];
  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const out: SearchHit[] = [];
  let from = 0;
  while (from < lower.length) {
    const idx = lower.indexOf(needle, from);
    if (idx < 0) break;
    out.push({
      id: `${base.idPrefix}-${idx}`,
      startSeconds: base.startSeconds,
      containerKey: base.containerKey,
      start: idx,
      end: idx + q.length,
      blockIndex: base.blockIndex,
      sentenceKey: base.sentenceKey,
      chapterIndex: base.chapterIndex,
    });
    from = idx + Math.max(1, needle.length);
  }
  return out;
}

export function buildTranscriptSearchHits(
  leftTab: LeftTab,
  query: string,
  transcriptBlocks: TranscriptBlock[],
  subtitleCues: TranscriptSentence[],
  chapters: ChapterItem[] | null,
): SearchHit[] {
  const q = query.trim();
  if (!q) return [];

  if (leftTab === "subtitles") {
    return subtitleCues.flatMap((cue, i) =>
      collectHitsInText(cue.text, q, {
        idPrefix: `sub-${i}`,
        startSeconds: cue.startSeconds,
        containerKey: `sub-${i}`,
        sentenceKey: `sub-${i}-${cue.startSeconds}`,
      }),
    );
  }

  if (leftTab === "chapter") {
    const list = chapters || [];
    return list.flatMap((ch, i) => [
      ...collectHitsInText(ch.title, q, {
        idPrefix: `ch-t-${i}`,
        startSeconds: ch.startSeconds,
        containerKey: `ch-title-${i}`,
        chapterIndex: i,
        sentenceKey: `ch-${i}`,
      }),
      ...collectHitsInText(ch.summary || "", q, {
        idPrefix: `ch-s-${i}`,
        startSeconds: ch.startSeconds,
        containerKey: `ch-sum-${i}`,
        chapterIndex: i,
        sentenceKey: `ch-${i}`,
      }),
    ]);
  }

  return transcriptBlocks.flatMap((block, bi) =>
    block.sentences.flatMap((sent, si) => {
      const sentenceKey = `${bi}-${si}-${sent.startSeconds}`;
      return collectHitsInText(sent.text, q, {
        idPrefix: `t-${bi}-${si}`,
        startSeconds: sent.startSeconds,
        containerKey: sentenceKey,
        blockIndex: bi,
        sentenceKey,
      });
    }),
  );
}

export function HighlightedText({
  text,
  containerKey,
  hits,
  activeHitId,
}: {
  text: string;
  containerKey: string;
  hits: SearchHit[];
  activeHitId: string | null;
}): ReactNode {
  const local = hits.filter((h) => h.containerKey === containerKey);
  if (!local.length) return text;

  const nodes: ReactNode[] = [];
  let cursor = 0;
  for (const h of local) {
    if (h.start > cursor) {
      nodes.push(text.slice(cursor, h.start));
    }
    const active = activeHitId === h.id;
    nodes.push(
      <span
        key={h.id}
        data-search-hit={h.id}
        className={`rounded-sm${active ? ` ${ACTIVE_RING}` : ""}`}
        style={{ backgroundColor: MATCH_BG }}
      >
        {text.slice(h.start, h.end)}
      </span>,
    );
    cursor = h.end;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

export function TranscriptSearchPopover({
  open,
  onOpenChange,
  query,
  onQueryChange,
  hits,
  activeIndex,
  onActiveIndexChange,
  onNavigateHit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (q: string) => void;
  hits: SearchHit[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onNavigateHit: (hit: SearchHit) => void;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const hasHits = hits.length > 0;
  const displayIndex = hasHits ? activeIndex + 1 : 0;

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const el = rootRef.current;
      if (!el) return;
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (el.contains(target)) return;
      if (
        target instanceof Element &&
        target.closest('[aria-label="Search"]')
      ) {
        return;
      }
      onOpenChange(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
      if (e.key === "Enter" && hasHits) {
        e.preventDefault();
        const next = e.shiftKey
          ? (activeIndex - 1 + hits.length) % hits.length
          : (activeIndex + 1) % hits.length;
        onActiveIndexChange(next);
        onNavigateHit(hits[next]!);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [
    open,
    onOpenChange,
    hasHits,
    activeIndex,
    hits,
    onActiveIndexChange,
    onNavigateHit,
  ]);

  const go = (delta: number) => {
    if (!hasHits) return;
    const next = (activeIndex + delta + hits.length) % hits.length;
    onActiveIndexChange(next);
    onNavigateHit(hits[next]!);
  };

  if (!open) return null;

  return (
    <div
      ref={rootRef}
      role="dialog"
      className="absolute bottom-full right-0 z-50 mb-2 min-w-[320px] rounded-md bg-white shadow-lg ring-1 ring-slate-200"
    >
      <div className="p-4">
        <div className="mb-3 text-sm font-semibold text-slate-900">Search</div>
        <div className="mb-3 flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Enter keywords"
            autoComplete="off"
            className="w-full rounded-md border-0 !bg-white px-2.5 py-1.5 text-sm !text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:!text-slate-400 outline-none [color-scheme:light] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1C6CFB]"
            style={{ backgroundColor: "#ffffff", color: "#0f172a" }}
          />
          <button
            type="button"
            disabled={!hasHits}
            aria-label="Previous match"
            onClick={() => go(-1)}
            className="inline-flex items-center justify-center rounded-md bg-[#1C6CFB] p-1.5 text-white transition-colors hover:bg-[#1C6CFB]/75 disabled:cursor-not-allowed disabled:bg-[#1C6CFB]/40"
          >
            <HugeIcon body={HUGE.arrowUp01} className="size-4 shrink-0" />
          </button>
          <button
            type="button"
            disabled={!hasHits}
            aria-label="Next match"
            onClick={() => go(1)}
            className="inline-flex items-center justify-center rounded-md bg-[#1C6CFB] p-1.5 text-white transition-colors hover:bg-[#1C6CFB]/75 disabled:cursor-not-allowed disabled:bg-[#1C6CFB]/40"
          >
            <HugeIcon body={HUGE.arrowDown01} className="size-4 shrink-0" />
          </button>
        </div>
        {query.trim() ? (
          <div className="text-xs text-slate-500">
            {hasHits ? `${displayIndex} / ${hits.length}` : "0 / 0"}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Hook-friendly: reset active index when query/hits change. */
export function useSearchActiveIndex(hitsLength: number, query: string) {
  const [activeIndex, setActiveIndex] = useState(0);
  const prevQuery = useRef(query);
  const prevLen = useRef(hitsLength);

  useEffect(() => {
    if (prevQuery.current !== query || prevLen.current !== hitsLength) {
      prevQuery.current = query;
      prevLen.current = hitsLength;
      setActiveIndex(0);
    }
  }, [query, hitsLength]);

  const safeIndex = hitsLength === 0 ? 0 : Math.min(activeIndex, hitsLength - 1);
  return [safeIndex, setActiveIndex] as const;
}

export function useTranscriptSearchHits(
  leftTab: LeftTab,
  query: string,
  transcriptBlocks: TranscriptBlock[],
  subtitleCues: TranscriptSentence[],
  chapters: ChapterItem[] | null,
) {
  return useMemo(
    () =>
      buildTranscriptSearchHits(
        leftTab,
        query,
        transcriptBlocks,
        subtitleCues,
        chapters,
      ),
    [leftTab, query, transcriptBlocks, subtitleCues, chapters],
  );
}
