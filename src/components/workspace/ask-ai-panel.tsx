"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Eraser, Loader2, Square } from "lucide-react";
import { toast } from "sonner";
import {
  ASK_SUGGESTIONS,
  createAskMessageId,
  type AskMessage,
  type AskSseEvent,
} from "@/lib/media/ask";
import type { TranscriptSegment } from "@/lib/media/workspace-mock";
import AskMarkdown from "@/components/workspace/ask-markdown";

const HUGE = {
  arrowUp02:
    '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 5.5V19m6-8s-4.419-6-6-6s-6 6-6 6"/>',
  arrowRight01:
    '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 6s6 4.419 6 6s-6 6-6 6"/>',
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

async function readAskSse(
  res: Response,
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (!res.body) throw new Error("Empty stream body");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const abort = () => {
    void reader.cancel().catch(() => undefined);
  };
  signal?.addEventListener("abort", abort, { once: true });

  try {
    while (true) {
      if (signal?.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split(/\r?\n/);
      buffer = parts.pop() ?? "";

      for (const line of parts) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const raw = trimmed.slice(5).trim();
        if (!raw) continue;
        let event: AskSseEvent;
        try {
          event = JSON.parse(raw) as AskSseEvent;
        } catch {
          continue;
        }
        if (event.type === "delta" && event.text) {
          onDelta(event.text);
        } else if (event.type === "error") {
          throw new Error(event.message || "Failed to get an answer");
        }
      }
    }
  } finally {
    signal?.removeEventListener("abort", abort);
    reader.releaseLock();
  }
}

export default function AskAiPanel({
  workspaceId,
  title,
  durationSeconds,
  transcript,
  messages,
  onMessagesChange,
  onSeek,
}: {
  workspaceId: string;
  title: string;
  durationSeconds: number | null;
  transcript?: TranscriptSegment[];
  messages: AskMessage[];
  onMessagesChange: (messages: AskMessage[]) => void;
  onSeek?: (seconds: number) => void;
}) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, busy, streamingId]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const stopGenerating = () => {
    abortRef.current?.abort();
  };

  const clearChat = () => {
    if (busy) abortRef.current?.abort();
    if (!messages.length) return;
    onMessagesChange([]);
    toast.success("Conversation cleared");
  };

  const copyAnswer = async (text: string) => {
    const value = text.trim();
    if (!value) {
      toast.message("Nothing to copy");
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  const send = async (raw: string) => {
    const question = raw.trim();
    if (!question || busy) return;

    const userMsg: AskMessage = {
      id: createAskMessageId(),
      role: "user",
      content: question,
      createdAt: Date.now(),
    };
    const assistantId = createAskMessageId();
    const assistantMsg: AskMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: Date.now(),
    };
    const history = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    const nextList = [...messages, userMsg, assistantMsg];
    onMessagesChange(nextList);
    setDraft("");
    setBusy(true);
    setStreamingId(assistantId);

    const controller = new AbortController();
    abortRef.current = controller;

    let assembled = "";
    const patchAssistant = (content: string) => {
      const base = messagesRef.current;
      const idx = base.findIndex((m) => m.id === assistantId);
      if (idx < 0) {
        onMessagesChange([...base, { ...assistantMsg, content }]);
        return;
      }
      const copy = base.slice();
      copy[idx] = { ...copy[idx], content };
      onMessagesChange(copy);
    };

    try {
      const res = await fetch("/api/media/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          workspaceId,
          title,
          durationSeconds,
          transcript: transcript?.length ? transcript : undefined,
          question,
          history,
          stream: true,
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(json?.message || "Failed to get an answer");
      }

      if (contentType.includes("text/event-stream")) {
        await readAskSse(
          res,
          (text) => {
            assembled += text;
            patchAssistant(assembled);
          },
          controller.signal,
        );
        if (controller.signal.aborted) {
          if (!assembled.trim()) {
            onMessagesChange(
              messagesRef.current.filter((m) => m.id !== assistantId),
            );
          }
          return;
        }
        if (!assembled.trim()) {
          throw new Error("Empty answer");
        }
      } else {
        const json = (await res.json()) as {
          code?: number;
          message?: string;
          data?: { answer?: string };
        };
        if (json.code !== 0) {
          throw new Error(json.message || "Failed to get an answer");
        }
        assembled = String(json.data?.answer || "").trim();
        if (!assembled) throw new Error("Empty answer");
        patchAssistant(assembled);
      }
    } catch (e) {
      if (
        (e instanceof DOMException && e.name === "AbortError") ||
        controller.signal.aborted
      ) {
        if (!assembled.trim()) {
          onMessagesChange(
            messagesRef.current.filter((m) => m.id !== assistantId),
          );
        }
        return;
      }
      const msg = e instanceof Error ? e.message : "Failed to ask AI";
      toast.error(msg);
      if (!assembled.trim()) {
        patchAssistant(`Sorry — ${msg}`);
      }
    } finally {
      setBusy(false);
      setStreamingId(null);
      abortRef.current = null;
    }
  };

  const empty = messages.length === 0;

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 pb-6">
        {empty && !busy ? (
          <div className="flex flex-col items-center px-2 pt-10 text-center">
            <h2 className="text-2xl font-bold text-slate-900">
              <span className="mr-2" aria-hidden>
                👋
              </span>
              Hi, Video Transcriber
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-500">
              I&apos;m your AI assistant. Feel free to ask me anything about this
              audio! Experience the magic of Video Transcriber AI right now!
            </p>
            <div className="mt-8 w-full max-w-lg space-y-2.5 text-left">
              {ASK_SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  type="button"
                  disabled={busy}
                  onClick={() => void send(`${s.emoji} ${s.text}`)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg p-3 text-left text-sm text-slate-700 ring-1 ring-inset ring-slate-200 transition-colors hover:bg-slate-50"
                >
                  <span className="min-w-0 flex-1">
                    <span className="mr-1.5" aria-hidden>
                      {s.emoji}
                    </span>
                    {s.text}
                  </span>
                  <HugeIcon
                    body={HUGE.arrowRight01}
                    className="size-4 shrink-0 text-slate-400"
                  />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-1">
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="mb-6 flex justify-end">
                  <div className="max-w-[500px] rounded-lg bg-gray-100 px-4 py-2 text-sm leading-6 text-gray-900">
                    {m.content}
                  </div>
                </div>
              ) : (
                <div key={m.id} className="group mb-3 mt-5 flex items-start">
                  <div className="mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#3B82F6] text-[10px] font-bold text-white">
                    VT
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2.5 mt-0.5 flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        Video Transcriber
                      </span>
                      {streamingId === m.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#3B82F6]" />
                      ) : null}
                    </div>
                    <AskMarkdown content={m.content} onSeek={onSeek} />
                    {m.content.trim() && streamingId !== m.id ? (
                      <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                        <button
                          type="button"
                          aria-label="Copy answer"
                          onClick={() => void copyAnswer(m.content)}
                          className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copy
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>

      <div className="relative w-full p-4 pt-1">
        {!empty ? (
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              disabled={busy}
              onClick={clearChat}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
            >
              <Eraser className="h-3.5 w-3.5" />
              Clear chat
            </button>
          </div>
        ) : null}
        <div className="relative w-full">
          <textarea
            rows={4}
            maxLength={5000}
            value={draft}
            disabled={busy}
            placeholder="Ask me anything about this content..."
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!busy) void send(draft);
              }
            }}
            className="h-24 w-full resize-none rounded-2xl border-0 bg-white px-2.5 py-1.5 pr-14 text-sm text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 outline-none [color-scheme:light] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1C6CFB] disabled:opacity-75"
            style={{ backgroundColor: "#ffffff", color: "#0f172a" }}
          />
          {busy ? (
            <button
              type="button"
              aria-label="Stop generating"
              title="Stop generating"
              onClick={stopGenerating}
              className="absolute bottom-6 right-3 inline-flex items-center justify-center rounded-full bg-[#1C6CFB] p-1.5 text-white transition-colors hover:bg-[#1558d6]"
            >
              <Square className="size-4 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!draft.trim()}
              aria-label="Send"
              onClick={() => void send(draft)}
              className="absolute bottom-6 right-3 inline-flex items-center justify-center rounded-full bg-[#1C6CFB] p-1.5 text-white transition-colors hover:bg-[#1C6CFB]/75 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <HugeIcon body={HUGE.arrowUp02} className="size-5 shrink-0" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
