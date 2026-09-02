"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Loader2, RefreshCw } from "lucide-react";
import {
  REPORT_CARD_META,
  type ReportCardKind,
} from "@/lib/face-rating/report-card-prompts";

type Props = {
  kind: ReportCardKind;
  scanId: string;
  previewUrl: string;
  /** Delay before auto-start (stagger cards to avoid rate limits). */
  startDelayMs?: number;
  /** When false, do not auto-start (e.g. wait for previous card). */
  enabled?: boolean;
  /** Nested under Style studio chapter — tighter spacing. */
  nested?: boolean;
};

type GenState =
  | { status: "idle" }
  | { status: "queued"; taskId: string }
  | { status: "generating"; taskId: string }
  | { status: "ready"; url: string; taskId?: string }
  | { status: "error"; message: string; taskId?: string };

function cacheKey(kind: ReportCardKind, scanId: string) {
  return `face-rating:card:${kind}:${scanId}`;
}

function readCache(kind: ReportCardKind, scanId: string): string | null {
  if (typeof window === "undefined" || !scanId) return null;
  try {
    const raw = sessionStorage.getItem(cacheKey(kind, scanId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { url?: string };
    return parsed.url?.startsWith("http") ? parsed.url : null;
  } catch {
    return null;
  }
}

function writeCache(
  kind: ReportCardKind,
  scanId: string,
  url: string,
  taskId?: string
) {
  try {
    sessionStorage.setItem(
      cacheKey(kind, scanId),
      JSON.stringify({ url, taskId: taskId || null, at: Date.now() })
    );
  } catch {
    /* quota */
  }
}

/**
 * Auto-generates one AI analysis card from the user photo (Kie image-to-image).
 */
export default function ReportAnalysisCard({
  kind,
  scanId,
  previewUrl,
  startDelayMs = 0,
  enabled = true,
  nested = false,
}: Props) {
  const meta = REPORT_CARD_META[kind];
  const [state, setState] = useState<GenState>({ status: "idle" });
  const startedRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const pollTask = useCallback(
    (taskId: string) => {
      stopPoll();
      const tick = async () => {
        try {
          const res = await fetch(
            `/api/kie/gpt-image-2/${encodeURIComponent(taskId)}`,
            { cache: "no-store" }
          );
          const data = await res.json().catch(() => ({}));
          if (!res.ok || data?.code !== 0) {
            setState({
              status: "error",
              message: data?.message || "Failed to check generation status",
              taskId,
            });
            stopPoll();
            return;
          }
          const payload = data.data || {};
          const st = String(payload.state || "");
          if (st === "success") {
            const url = Array.isArray(payload.resultUrls)
              ? payload.resultUrls[0]
              : "";
            if (url) {
              writeCache(kind, scanId, url, taskId);
              setState({ status: "ready", url, taskId });
            } else {
              setState({
                status: "error",
                message: "Generation finished but no image URL returned",
                taskId,
              });
            }
            stopPoll();
            return;
          }
          if (st === "fail") {
            setState({
              status: "error",
              message:
                payload.failMsg || payload.failCode || "Generation failed",
              taskId,
            });
            stopPoll();
            return;
          }
          setState({
            status: st === "generating" ? "generating" : "queued",
            taskId,
          });
        } catch (e) {
          setState({
            status: "error",
            message: e instanceof Error ? e.message : "Status poll failed",
            taskId,
          });
          stopPoll();
        }
      };
      void tick();
      pollRef.current = setInterval(tick, 3500);
    },
    [kind, scanId, stopPoll]
  );

  const start = useCallback(
    async (force = false) => {
      if (
        !previewUrl ||
        (!previewUrl.startsWith("data:") && !previewUrl.startsWith("http"))
      ) {
        setState({
          status: "error",
          message: "A saved photo is required to generate this card",
        });
        return;
      }

      if (!force) {
        const cached = readCache(kind, scanId);
        if (cached) {
          setState({ status: "ready", url: cached });
          return;
        }
      }

      setState({ status: "queued", taskId: "" });
      try {
        const res = await fetch(`/api/face-rating/report-cards/${kind}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scanId,
            image: previewUrl,
            aspect_ratio: meta.aspect_ratio,
            resolution: "1K",
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.code !== 0 || !data?.data?.taskId) {
          throw new Error(data?.message || `Could not start ${kind} analysis`);
        }
        const taskId = String(data.data.taskId);
        setState({ status: "generating", taskId });
        pollTask(taskId);
      } catch (e) {
        setState({
          status: "error",
          message:
            e instanceof Error ? e.message : `Could not start ${kind} analysis`,
        });
      }
    },
    [previewUrl, scanId, kind, meta.aspect_ratio, pollTask]
  );

  useEffect(() => {
    if (!enabled) return;
    if (startedRef.current) return;
    if (!scanId || !previewUrl) return;
    startedRef.current = true;
    const t = setTimeout(() => {
      void start(false);
    }, Math.max(0, startDelayMs));
    return () => {
      clearTimeout(t);
      stopPoll();
    };
  }, [enabled, scanId, previewUrl, start, startDelayMs, stopPoll]);

  return (
    <section
      id={meta.sectionId}
      className={nested ? "mt-10 scroll-mt-28" : "mt-14 scroll-mt-24"}
    >
      <div className="mb-4 border-b border-[#ececec] pb-2.5">
        {!nested ? (
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9ca3af]">
            {meta.kicker}
          </p>
        ) : null}
        <h3
          className={
            nested
              ? "text-lg font-black tracking-tight text-[#0a0a0a] sm:text-xl"
              : "font-heading mt-1 text-2xl tracking-tight text-[#0a0a0a] sm:text-3xl"
          }
        >
          {meta.titleBefore}{" "}
          <em className="font-serif font-normal italic text-[#9F1239]">
            {meta.titleEm}
          </em>
        </h3>
        <p className="mt-1.5 max-w-[60ch] text-sm leading-relaxed text-zinc-600">
          {meta.blurb}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e5e5e5] bg-white">
        {state.status === "ready" ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={state.url}
              alt={meta.alt}
              className="mx-auto w-full max-w-xl object-contain"
            />
            <div className="flex items-center justify-between gap-3 border-t border-[#ececec] px-4 py-3">
              <p className="text-xs text-zinc-500">
                Generated from your upload · illustrative AI analysis
              </p>
              <button
                type="button"
                onClick={() => {
                  const filename = `face-rating-${kind}-analysis`;
                  const href = `/api/download-image?url=${encodeURIComponent(state.url)}&filename=${encodeURIComponent(filename)}`;
                  // Same-tab navigation to attachment response triggers a file save
                  const a = document.createElement("a");
                  a.href = href;
                  a.download = filename;
                  a.rel = "noopener";
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9F1239] hover:underline"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </button>
            </div>
          </div>
        ) : state.status === "error" ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <p className="text-sm font-semibold text-[#0a0a0a]">
              Couldn’t generate this card
            </p>
            <p className="max-w-sm text-sm text-zinc-500">{state.message}</p>
            <p className="text-xs text-zinc-400">
              Check KIE_API_KEY and that your photo was saved as a durable image.
            </p>
            <button
              type="button"
              onClick={() => {
                startedRef.current = false;
                void start(true);
              }}
              className="mt-1 inline-flex h-9 items-center gap-2 rounded-full bg-[#9F1239] px-4 text-sm font-bold text-white hover:bg-[#881337]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try again
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <Loader2 className="h-7 w-7 animate-spin text-[#9F1239]" />
            <p className="text-sm font-semibold text-[#0a0a0a]">
              {state.status === "generating"
                ? meta.loading
                : `Starting ${meta.navLabel.toLowerCase()} analysis…`}
            </p>
            <p className="max-w-sm text-xs text-zinc-500">
              Running AI analysis on your photo. This usually takes under a minute.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
