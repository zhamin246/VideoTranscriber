"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import {
  ArrowLeft,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  Subtitles,
} from "lucide-react";
import {
  buildMockTranscript,
  buildTranscriptBlocks,
  formatTimestamp,
  mergeIntoSentences,
} from "@/lib/media/workspace-mock";
import {
  chaptersAreComplete,
  chaptersHaveValidTimeline,
  type ChapterItem,
} from "@/lib/media/chapters";
import {
  formatNoteRange,
  noteModeLabel,
  notesAreComplete,
  NOTE_MODE_PRESETS,
  type AiNotes,
} from "@/lib/media/notes";
import {
  mindmapAreComplete,
  type AiMindMap,
} from "@/lib/media/mindmap";
import {
  buildChaptersTxt,
  buildTxtFromCues,
  cuesFromBlocks,
  cuesFromSentences,
} from "@/lib/media/transcript-export";
import ExportSettingsDialog from "@/components/workspace/export-settings-dialog";
import AskAiPanel from "@/components/workspace/ask-ai-panel";
import MindMapPanel from "@/components/workspace/mindmap-panel";
import {
  HighlightedText,
  TranscriptSearchPopover,
  useSearchActiveIndex,
  useTranscriptSearchHits,
  type SearchHit,
} from "@/components/workspace/transcript-search";
import type { AskMessage } from "@/lib/media/ask";
import { resolveMediaEmbed } from "@/lib/media/embed";
import { toProxiedPlaybackUrl } from "@/lib/media/stream-proxy";
import CompactAudioPlayer, {
  type MediaSeekRequest,
} from "@/components/workspace/compact-audio-player";
import {
  loadWorkspace,
  fetchWorkspace,
  persistAskMessages,
  saveWorkspace,
  type WorkspacePayload,
} from "@/lib/media/workspace-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function seekYoutubeIframe(iframe: HTMLIFrameElement | null, seconds: number) {
  if (!iframe?.contentWindow) return;
  const t = Math.max(0, seconds);
  // YouTube IFrame API command channel (requires enablejsapi=1)
  iframe.contentWindow.postMessage(
    JSON.stringify({ event: "command", func: "seekTo", args: [t, true] }),
    "*",
  );
  iframe.contentWindow.postMessage(
    JSON.stringify({ event: "command", func: "playVideo", args: [] }),
    "*",
  );
}

type LeftTab = "transcript" | "subtitles" | "chapter";
type RightTab = "notes" | "ask" | "infographic" | "mindmap";

const ring = "shadow-[inset_0_0_0_1px_rgb(203,213,225)]";

/** Exact Hugeicons bodies from videotranscriber.ai (Iconify `i-hugeicons:*`). */
const HUGE = {
  translate:
    '<g fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 5.828h2.7m3.3 0H9.5m-1.8 0h1.8m-1.8 0V5m1.8.828c-.316 1.131-.98 2.201-1.736 3.141M5.836 11a19 19 0 0 0 1.928-2.03m0 0c-.385-.453-.925-1.184-1.08-1.515m1.08 1.514l1.157 1.203M13.5 19l.833-2m4.167 2l-.833-2m-3.334 0L16 13l1.667 4m-3.334 0h3.334"/><path stroke-linecap="round" d="M14 10V8c0-2.828 0-4.243-.879-5.121C12.243 2 10.828 2 8 2s-4.243 0-5.121.879C2 3.757 2 5.172 2 8s0 4.243.879 5.121C3.757 14 5.172 14 8 14h2"/><path d="M10 16c0-2.828 0-4.243.879-5.121C11.757 10 13.172 10 16 10s4.243 0 5.121.879C22 11.757 22 13.172 22 16s0 4.243-.879 5.121C20.243 22 18.828 22 16 22s-4.243 0-5.121-.879C10 20.243 10 18.828 10 16Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M4 16.5c0 1.404 0 2.107.337 2.611a2 2 0 0 0 .552.552C5.393 20 6.096 20 7.5 20M20 7.5c0-1.404 0-2.107-.337-2.611a2 2 0 0 0-.552-.552C18.607 4 17.904 4 16.5 4"/></g>',
  settings03:
    '<g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M15.5 12a3.5 3.5 0 1 1-7 0a3.5 3.5 0 0 1 7 0Z"/><path d="M20.79 9.152C21.598 10.542 22 11.237 22 12s-.403 1.458-1.21 2.848l-1.923 3.316c-.803 1.384-1.205 2.076-1.865 2.456s-1.462.38-3.065.38h-3.874c-1.603 0-2.405 0-3.065-.38s-1.062-1.072-1.865-2.456L3.21 14.848C2.403 13.458 2 12.763 2 12s.403-1.458 1.21-2.848l1.923-3.316C5.936 4.452 6.338 3.76 6.998 3.38S8.46 3 10.063 3h3.874c1.603 0 2.405 0 3.065.38s1.062 1.072 1.865 2.456z"/></g>',
  appleReminder:
    '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M3 12c0-4.243 0-6.364 1.318-7.682S7.758 3 12 3s6.364 0 7.682 1.318S21 7.758 21 12s0 6.364-1.318 7.682S16.242 21 12 21s-6.364 0-7.682-1.318S3 16.242 3 12"/><path d="M7.375 8H7.25m.125 4H7.25m.125 4H7.25m.25-8A.25.25 0 1 1 7 8a.25.25 0 0 1 .5 0m0 4a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0m0 4a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0M11 8h6m-6 4h6m-6 4h6"/></g>',
  aiChat02:
    '<g fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.5"><path d="M14.17 20.89c4.184-.277 7.516-3.657 7.79-7.9c.053-.83.053-1.69 0-2.52c-.274-4.242-3.606-7.62-7.79-7.899a33 33 0 0 0-4.34 0c-4.184.278-7.516 3.657-7.79 7.9a20 20 0 0 0 0 2.52c.1 1.545.783 2.976 1.588 4.184c.467.845.159 1.9-.328 2.823c-.35.665-.526.997-.385 1.237c.14.24.455.248 1.084.263c1.245.03 2.084-.322 2.75-.813c.377-.279.566-.418.696-.434s.387.09.899.3c.46.19.995.307 1.485.34c1.425.094 2.914.094 4.342 0Z"/><path stroke-linecap="round" d="m7.5 15l1.842-5.526a.694.694 0 0 1 1.316 0L12.5 15m3-6v6m-7-2h3"/></g>',
  image02:
    '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="m3 16l4.47-4.47a1.81 1.81 0 0 1 2.56 0L14 15.5m1.5 1.5L14 15.5m7 .5l-2.47-2.47a1.81 1.81 0 0 0-2.56 0L14 15.5M15.5 8a.5.5 0 0 0 0-1m0 1a.5.5 0 0 1 0-1m0 1V7"/><path d="M3.698 19.747C2.5 18.345 2.5 16.23 2.5 12s0-6.345 1.198-7.747q.256-.3.555-.555C5.655 2.5 7.77 2.5 12 2.5s6.345 0 7.747 1.198q.3.256.555.555C21.5 5.655 21.5 7.77 21.5 12s0 6.345-1.198 7.747q-.256.3-.555.555C18.345 21.5 16.23 21.5 12 21.5s-6.345 0-7.747-1.198q-.3-.256-.555-.555"/></g>',
  hierarchySquare04:
    '<g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12c0-1.414 0-2.121-.513-2.56C7.975 9 7.15 9 5.5 9s-2.475 0-2.987.44C2 9.878 2 10.585 2 12s0 2.121.513 2.56C3.025 15 3.85 15 5.5 15s2.475 0 2.987-.44C9 14.122 9 13.415 9 12Zm13-7c0-1.414 0-2.121-.41-2.56S20.52 2 19.2 2h-1.4c-1.32 0-1.98 0-2.39.44C15 2.878 15 3.585 15 5s0 2.121.41 2.56S16.48 8 17.8 8h1.4c1.32 0 1.98 0 2.39-.44C22 7.122 22 6.415 22 5Zm0 14c0-1.414 0-2.121-.41-2.56S20.52 16 19.2 16h-1.4c-1.32 0-1.98 0-2.39.44C15 16.878 15 17.585 15 19s0 2.121.41 2.56s1.07.44 2.39.44h1.4c1.32 0 1.98 0 2.39-.44c.41-.439.41-1.146.41-2.56Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 11.999v4.047c0 1.874.917 2.716 3 2.954m-3-7.001V7.952c0-1.767.779-2.694 3-2.952m-3 6.999H9"/></g>',
  arrowDown01:
    '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18 9s-4.419 6-6 6s-6-6-6-6"/>',
  closedCaption:
    '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"><path d="M2 12c0-3.98 0-5.97 1.053-7.298q.253-.319.554-.587C4.862 3 6.741 3 10.5 3h3c3.759 0 5.638 0 6.892 1.115q.302.268.555.587C22 6.03 22 8.02 22 12s0 5.97-1.053 7.298a4.6 4.6 0 0 1-.555.587C19.138 21 17.26 21 13.5 21h-3c-3.759 0-5.638 0-6.893-1.115a4.6 4.6 0 0 1-.554-.587C2 17.97 2 15.98 2 12Z"/><path d="M10.5 9H10c-.932 0-1.398 0-1.765.152a2 2 0 0 0-1.083 1.083C7 10.602 7 11.068 7 12s0 1.398.152 1.765a2 2 0 0 0 1.083 1.083C8.602 15 9.068 15 10 15h.5M17 9h-.5c-.932 0-1.398 0-1.765.152a2 2 0 0 0-1.083 1.083c-.152.367-.152.833-.152 1.765s0 1.398.152 1.765a2 2 0 0 0 1.083 1.083c.367.152.833.152 1.765.152h.5"/></g>',
  leftToRightListBullet:
    '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"><path d="M8 5.5h12m-12 7h12m-12 7h12"/><path stroke-linejoin="round" d="M4.375 5.5H4.25m.25 0a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0m-.125 7H4.25m.25 0a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0m-.125 7H4.25m.25 0a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0"/></g>',
} as const;

function HugeIcon({
  body,
  className,
}: {
  body: string;
  className?: string;
}) {
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

export default function TranscriptWorkspace({ id }: { id: string }) {
  const router = useRouter();
  const [payload, setPayload] = useState<WorkspacePayload | null | undefined>(undefined);
  const [leftTab, setLeftTab] = useState<LeftTab>("transcript");
  const [rightTab, setRightTab] = useState<RightTab>("notes");
  const [activeSeg, setActiveSeg] = useState(0);
  const [activeSentence, setActiveSentence] = useState<string | null>(null);
  const [seekRequest, setSeekRequest] = useState<MediaSeekRequest | null>(null);
  const [chapters, setChapters] = useState<ChapterItem[] | null>(null);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [chaptersError, setChaptersError] = useState("");
  const [openChapter, setOpenChapter] = useState<string | null>("0");
  const [exportOpen, setExportOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [aiNotes, setAiNotes] = useState<AiNotes | null>(null);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState("");
  const [promptLibraryOpen, setPromptLibraryOpen] = useState(false);
  const [askMessages, setAskMessages] = useState<AskMessage[]>([]);
  const [mindmap, setMindmap] = useState<AiMindMap | null>(null);
  const [mindmapLoading, setMindmapLoading] = useState(false);
  const [mindmapError, setMindmapError] = useState("");
  const youtubeRef = useRef<HTMLIFrameElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const transcriptScrollRef = useRef<HTMLDivElement | null>(null);
  const promptLibraryRef = useRef<HTMLDivElement | null>(null);
  const notesGenRef = useRef(0);
  const mindmapGenRef = useRef(0);
  const askPersistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const askTouchedRef = useRef(false);

  const queuePersistAskMessages = (workspaceId: string, next: AskMessage[]) => {
    askTouchedRef.current = true;
    if (askPersistTimerRef.current) clearTimeout(askPersistTimerRef.current);
    askPersistTimerRef.current = setTimeout(() => {
      void persistAskMessages(workspaceId, next);
    }, next.length === 0 ? 0 : 900);
  };

  useEffect(() => {
    return () => {
      if (askPersistTimerRef.current) clearTimeout(askPersistTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    askTouchedRef.current = false;
    const local = loadWorkspace(id);
    if (local) {
      setPayload(local);
      if (
        chaptersAreComplete(local.chapters) &&
        chaptersHaveValidTimeline(local.chapters, local.durationSeconds)
      ) {
        setChapters(local.chapters!);
      }
      if (notesAreComplete(local.aiNotes)) {
        setAiNotes(local.aiNotes!);
      }
      const localAsk =
        Array.isArray(local.askMessages) && local.askMessages.length
          ? local.askMessages
          : [];
      if (localAsk.length) {
        setAskMessages(localAsk);
      }
      if (mindmapAreComplete(local.mindmap)) {
        setMindmap(local.mindmap!);
      }
      // Hydrate Ask history from DB when session cache has none
      if (!localAsk.length) {
        void fetchWorkspace(id).then((remote) => {
          if (cancelled || askTouchedRef.current || !remote) return;
          const remoteAsk = Array.isArray(remote.askMessages)
            ? remote.askMessages
            : [];
          if (!remoteAsk.length) return;
          setAskMessages(remoteAsk);
          saveWorkspace({ ...local, askMessages: remoteAsk });
          setPayload((p) => (p ? { ...p, askMessages: remoteAsk } : p));
        });
      }
      return () => {
        cancelled = true;
      };
    }
    (async () => {
      const remote = await fetchWorkspace(id);
      if (cancelled) return;
      if (remote) {
        try {
          sessionStorage.setItem(
            `videotranscriber:workspace:${remote.id}`,
            JSON.stringify(remote),
          );
        } catch {
          /* ignore */
        }
        if (
          chaptersAreComplete(remote.chapters) &&
          chaptersHaveValidTimeline(remote.chapters, remote.durationSeconds)
        ) {
          setChapters(remote.chapters!);
        }
        if (notesAreComplete(remote.aiNotes)) {
          setAiNotes(remote.aiNotes!);
        }
        if (Array.isArray(remote.askMessages) && !askTouchedRef.current) {
          setAskMessages(remote.askMessages);
        }
        if (mindmapAreComplete(remote.mindmap)) {
          setMindmap(remote.mindmap!);
        }
      }
      setPayload(remote);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Generate AI chapters when Chapter tab opens (once per workspace session).
  useEffect(() => {
    if (leftTab !== "chapter") return;
    if (!payload?.id) return;
    if (
      chaptersAreComplete(chapters) &&
      chaptersHaveValidTimeline(chapters, payload.durationSeconds)
    ) {
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      setChaptersLoading(true);
      setChaptersError("");
      try {
        const res = await fetch("/api/media/chapters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            workspaceId: payload.id,
            title: payload.title,
            durationSeconds: payload.durationSeconds,
            transcript: payload.transcript?.length
              ? payload.transcript
              : undefined,
          }),
        });
        const json = (await res.json()) as {
          code?: number;
          message?: string;
          data?: { chapters?: ChapterItem[] };
        };
        if (cancelled) return;
        if (!res.ok || json.code !== 0) {
          throw new Error(json.message || "Failed to generate chapters");
        }
        const list = Array.isArray(json.data?.chapters) ? json.data!.chapters! : [];
        if (!list.length) throw new Error("No chapters returned");
        setChapters(list);
        setOpenChapter("0");
        setPayload((prev) => {
          if (!prev) return prev;
          const next = { ...prev, chapters: list };
          saveWorkspace(next);
          return next;
        });
      } catch (e) {
        if (cancelled || (e instanceof DOMException && e.name === "AbortError")) {
          return;
        }
        setChaptersError(
          e instanceof Error ? e.message : "Failed to generate chapters",
        );
      } finally {
        if (!cancelled) setChaptersLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- generate once when opening Chapter
  }, [leftTab, payload?.id]);

  const generateAiNotes = async (
    mode: string,
    opts?: { force?: boolean },
  ) => {
    if (!payload?.id) return;
    if (!opts?.force && notesAreComplete(aiNotes) && aiNotes?.mode === mode) {
      return;
    }
    const ticket = ++notesGenRef.current;
    setNotesLoading(true);
    setNotesError("");
    setPromptLibraryOpen(false);
    try {
      const res = await fetch("/api/media/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: payload.id,
          title: payload.title,
          durationSeconds: payload.durationSeconds,
          noteMode: mode,
          transcript: payload.transcript?.length
            ? payload.transcript
            : undefined,
        }),
      });
      const json = (await res.json()) as {
        code?: number;
        message?: string;
        data?: { notes?: AiNotes };
      };
      if (ticket !== notesGenRef.current) return;
      if (!res.ok || json.code !== 0) {
        throw new Error(json.message || "Failed to generate notes");
      }
      const nextNotes = json.data?.notes;
      if (!notesAreComplete(nextNotes)) {
        throw new Error("No notes returned");
      }
      setAiNotes(nextNotes!);
      setPayload((prev) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          noteMode: mode,
          aiNotes: nextNotes!,
        };
        saveWorkspace(next);
        return next;
      });
      toast.success("Notes ready");
    } catch (e) {
      if (ticket !== notesGenRef.current) return;
      setNotesError(
        e instanceof Error ? e.message : "Failed to generate notes",
      );
      toast.error(
        e instanceof Error ? e.message : "Failed to generate notes",
      );
    } finally {
      if (ticket === notesGenRef.current) setNotesLoading(false);
    }
  };

  // Auto-generate AI Notes when Notes tab is open and empty.
  useEffect(() => {
    if (rightTab !== "notes") return;
    if (!payload?.id) return;
    if (notesLoading) return;
    if (notesAreComplete(aiNotes)) return;
    void generateAiNotes(payload.noteMode || "smart_summary");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once when opening Notes empty
  }, [rightTab, payload?.id]);

  const generateMindMapForWorkspace = async (opts?: { force?: boolean }) => {
    if (!payload?.id) return;
    if (!opts?.force && mindmapAreComplete(mindmap)) return;
    const ticket = ++mindmapGenRef.current;
    setMindmapLoading(true);
    setMindmapError("");
    try {
      const res = await fetch("/api/media/mindmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: payload.id,
          title: payload.title,
          durationSeconds: payload.durationSeconds,
          transcript: payload.transcript?.length
            ? payload.transcript
            : undefined,
        }),
      });
      const json = (await res.json()) as {
        code?: number;
        message?: string;
        data?: { mindmap?: AiMindMap };
      };
      if (ticket !== mindmapGenRef.current) return;
      if (!res.ok || json.code !== 0) {
        throw new Error(json.message || "Failed to generate mind map");
      }
      const next = json.data?.mindmap;
      if (!mindmapAreComplete(next)) {
        throw new Error("No mind map returned");
      }
      setMindmap(next!);
      setPayload((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, mindmap: next! };
        saveWorkspace(updated);
        return updated;
      });
      toast.success("Mind map ready");
    } catch (e) {
      if (ticket !== mindmapGenRef.current) return;
      const msg =
        e instanceof Error ? e.message : "Failed to generate mind map";
      setMindmapError(msg);
      toast.error(msg);
    } finally {
      if (ticket === mindmapGenRef.current) setMindmapLoading(false);
    }
  };

  // Auto-generate MindMap when tab opens and empty.
  useEffect(() => {
    if (rightTab !== "mindmap") return;
    if (!payload?.id) return;
    if (mindmapLoading) return;
    if (mindmapAreComplete(mindmap)) return;
    void generateMindMapForWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once when opening MindMap empty
  }, [rightTab, payload?.id]);

  useEffect(() => {
    if (!promptLibraryOpen) return;
    const onDown = (e: MouseEvent) => {
      const el = promptLibraryRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setPromptLibraryOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [promptLibraryOpen]);

  const rawTranscript = useMemo(() => {
    if (payload?.transcript?.length) return payload.transcript;
    return payload
      ? buildMockTranscript(payload.title, payload.durationSeconds)
      : [];
  }, [payload]);

  // Transcript: ~30s paragraphs with inline clickable sentences
  const transcriptBlocks = useMemo(
    () => buildTranscriptBlocks(rawTranscript),
    [rawTranscript],
  );

  // Subtitles: one cue per sentence (~4–5s) — fine-grained timeline
  const subtitleCues = useMemo(
    () => mergeIntoSentences(rawTranscript),
    [rawTranscript],
  );
  const searchHits = useTranscriptSearchHits(
    leftTab,
    searchQuery,
    transcriptBlocks,
    subtitleCues,
    chapters,
  );
  const [searchActiveIndex, setSearchActiveIndex] = useSearchActiveIndex(
    searchHits.length,
    searchQuery,
  );
  const activeSearchHitId =
    searchHits.length > 0 ? searchHits[searchActiveIndex]?.id ?? null : null;

  useEffect(() => {
    if (!searchOpen || !searchHits.length) return;
    const hit = searchHits[searchActiveIndex];
    if (!hit) return;
    const frame = requestAnimationFrame(() => {
      transcriptScrollRef.current
        ?.querySelector(`[data-search-hit="${CSS.escape(hit.id)}"]`)
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [searchOpen, searchHits, searchActiveIndex]);

  const embed = useMemo(
    () => (payload ? resolveMediaEmbed(payload.url) : { kind: "none" as const }),
    [payload],
  );

  if (payload === undefined) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#F7F8FA] text-sm text-slate-500">
        Loading workspace…
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-[#F7F8FA] px-4 text-center">
        <p className="text-sm text-slate-600">This workspace session expired or was not found.</p>
        <Link href="/" className="text-sm font-medium text-blue-600 hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  const audioSrc = (() => {
    if (payload.mediaKind === "audio") {
      return payload.playbackUrl || payload.url || "";
    }
    const play = payload.playbackUrl || "";
    if (/\/audio-/i.test(play) || /\.(mp3|m4a|wav|aac|ogg|opus)(\?|$)/i.test(play)) {
      return play;
    }
    // Browser recordings (converted to mp3, or legacy .webm)
    if (
      /^recording-/i.test(payload.title) &&
      /\.(mp3|webm|m4a|ogg)$/i.test(payload.title) &&
      play
    ) {
      return play;
    }
    return "";
  })();

  const copyTranscript = async () => {
    let text = "";
    let okMsg = "Transcript Copied Successfully.";
    if (leftTab === "subtitles") {
      text = buildTxtFromCues(cuesFromSentences(subtitleCues), true);
      okMsg = "Subtitles Copied Successfully.";
    } else if (leftTab === "chapter") {
      if (!chaptersAreComplete(chapters)) {
        toast.message("Generate chapters first");
        return;
      }
      text = buildChaptersTxt(chapters!, true);
      okMsg = "Chapters Copied Successfully.";
    } else {
      text = buildTxtFromCues(cuesFromBlocks(transcriptBlocks), true);
    }
    if (!text.trim()) {
      toast.error("Nothing to copy");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success(okMsg);
    } catch {
      toast.error("Could not copy");
    }
  };

  const actionBtnClass =
    "inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-300 bg-slate-50 px-3 text-sm font-medium text-slate-700 shadow-none transition-colors hover:bg-white";

  const seekPlayback = (seconds: number) => {
    const t = Math.max(0, seconds);
    setSeekRequest({ seconds: t, nonce: Date.now() });

    if (audioSrc) {
      return;
    }
    if (youtubeRef.current) {
      seekYoutubeIframe(youtubeRef.current, t);
      return;
    }
    const video = videoRef.current;
    if (video) {
      video.currentTime = t;
      void video.play().catch(() => {
        /* seek still applied */
      });
    }
  };

  const seekToSentence = (
    blockIndex: number,
    sentenceKey: string,
    startSeconds: number,
  ) => {
    setActiveSeg(blockIndex);
    setActiveSentence(sentenceKey);
    seekPlayback(startSeconds);
  };

  const seekToSubtitle = (index: number, startSeconds: number) => {
    setActiveSentence(`sub-${index}-${startSeconds}`);
    seekPlayback(startSeconds);
  };

  const seekToBlock = (blockIndex: number, startSeconds: number) => {
    setActiveSeg(blockIndex);
    const first = transcriptBlocks[blockIndex]?.sentences[0];
    setActiveSentence(
      first ? `${blockIndex}-0-${first.startSeconds}` : null,
    );
    seekPlayback(startSeconds);
  };

  const navigateSearchHit = (hit: SearchHit) => {
    if (hit.blockIndex != null) setActiveSeg(hit.blockIndex);
    if (hit.sentenceKey) setActiveSentence(hit.sentenceKey);
    if (hit.chapterIndex != null) setOpenChapter(String(hit.chapterIndex));
    seekPlayback(hit.startSeconds);
    requestAnimationFrame(() => {
      transcriptScrollRef.current
        ?.querySelector(`[data-search-hit="${CSS.escape(hit.id)}"]`)
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  };

  return (
    <div className="flex min-h-svh flex-col bg-[#F7F8FA] text-slate-900">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200/80 bg-white px-3 md:px-4">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-800" title={payload.title}>
            {payload.title}
          </p>
        </div>
        <div className="hidden items-center gap-1 sm:flex">
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => toast.message("Feedback coming soon")}
          >
            <MessageSquare className="h-4 w-4" />
            Feedback
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#3B82F6] px-3 text-sm font-medium text-white hover:bg-blue-600"
            onClick={() => toast.message("Translate & Dub coming soon")}
          >
            <HugeIcon body={HUGE.translate} className="h-5 w-5" />
            Translate &amp; Dub
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            New
          </button>
        </div>
      </header>

      <div className="mx-auto grid h-[calc(100svh-3.5rem)] w-full max-w-[1600px] grid-cols-1 overflow-hidden lg:grid-cols-2">
        {/* Left column — 50% */}
        <section className="flex min-h-0 min-w-0 flex-col border-slate-200 lg:border-r">
          <div className="shrink-0 px-3 pb-2 pt-3 sm:px-4">
            {audioSrc ? (
              <CompactAudioPlayer
                src={toProxiedPlaybackUrl(audioSrc)}
                durationHint={payload.durationSeconds}
                seekRequest={seekRequest}
              />
            ) : (
            <div className="w-full overflow-hidden rounded-xl bg-black">
              <div className="mx-auto w-full max-w-[400px]">
                {embed.kind === "iframe" && !payload.playbackUrl ? (
                  <div className="relative aspect-video w-full min-w-0 bg-black">
                    <iframe
                      ref={youtubeRef}
                      title={embed.title || payload.title}
                      src={embed.src}
                      className="absolute inset-0 h-full w-full border-0"
                      allow="fullscreen; autoplay"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  </div>
                ) : payload.playbackUrl ? (
                  <div
                    className="relative mx-auto w-full bg-black"
                    style={{
                      aspectRatio:
                        payload.platform === "Instagram" ||
                        payload.platform === "TikTok" ||
                        payload.platform === "Facebook"
                          ? "9 / 16"
                          : "16 / 9",
                      maxHeight: "50vh",
                    }}
                  >
                    <video
                      ref={videoRef}
                      src={toProxiedPlaybackUrl(payload.playbackUrl)}
                      controls
                      playsInline
                      preload="metadata"
                      poster={payload.thumbnailUrl || undefined}
                      className="absolute inset-0 h-full w-full object-contain"
                      controlsList="nodownload"
                    />
                  </div>
                ) : payload.thumbnailUrl || embed.kind === "thumbnail" ? (
                  <div className="relative aspect-video w-full bg-black">
                    {payload.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={payload.thumbnailUrl}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover opacity-90"
                      />
                    ) : null}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <a
                        href={payload.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-slate-800"
                      >
                        Open on {payload.platform || "source"}{" "}
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex aspect-video items-center justify-center text-sm text-slate-400">
                    No preview available
                  </div>
                )}
              </div>
            </div>
            )}
          </div>

          <div className={`mx-3 mb-3 flex min-h-0 flex-1 flex-col rounded-xl bg-white sm:mx-4 ${ring}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
              <div
                className="flex items-center gap-1 rounded-lg p-1"
                style={{ backgroundColor: "#EBEDEE" }}
              >
                {(
                  [
                    { id: "transcript" as const, label: "Transcript", Icon: FileText },
                    { id: "subtitles" as const, label: "Subtitles", Icon: Subtitles },
                    { id: "chapter" as const, label: "Chapter", body: HUGE.leftToRightListBullet },
                  ] as const
                ).map((tab) => {
                  const active = leftTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setLeftTab(tab.id)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors"
                      style={
                        active
                          ? {
                              backgroundColor: "#FFFFFF",
                              color: "#1C6CFB",
                              boxShadow: "0 1px 2px rgba(15,23,42,0.08)",
                            }
                          : { backgroundColor: "transparent", color: "#64748B" }
                      }
                    >
                      {"Icon" in tab ? (
                        <tab.Icon className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <HugeIcon body={tab.body} className="h-5 w-5 shrink-0" />
                      )}
                      {tab.label}
                    </button>
                  );
                })}
              </div>
              <div className="relative flex items-center gap-2">
                <div className="relative">
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    aria-label="Search"
                    aria-expanded={searchOpen}
                    onClick={() => setSearchOpen((o) => !o)}
                  >
                    <Search className="h-5 w-5" strokeWidth={1.5} />
                  </button>
                  <TranscriptSearchPopover
                    open={searchOpen}
                    onOpenChange={setSearchOpen}
                    query={searchQuery}
                    onQueryChange={setSearchQuery}
                    hits={searchHits}
                    activeIndex={searchActiveIndex}
                    onActiveIndexChange={setSearchActiveIndex}
                    onNavigateHit={navigateSearchHit}
                  />
                </div>
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
                  aria-label="Translate"
                  onClick={() => toast.message("Translation coming soon")}
                >
                  <HugeIcon body={HUGE.translate} className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => void copyTranscript()}
                  className={actionBtnClass}
                >
                  <Copy className="h-4 w-4 shrink-0" />
                  Copy
                </button>
                <button
                  type="button"
                  onClick={() => setExportOpen(true)}
                  className={actionBtnClass}
                >
                  <Download className="h-4 w-4 shrink-0" />
                  Export
                </button>
              </div>
            </div>

            <div ref={transcriptScrollRef} className="flex-1 overflow-y-auto px-3 py-3">
              {leftTab === "transcript" ? (
                <div className="space-y-2">
                  {transcriptBlocks.map((block, bi) => {
                    const blockActive = activeSeg === bi;
                    return (
                      <div
                        key={`${block.startSeconds}-${bi}`}
                        className="group relative rounded-xl px-3 py-2.5 transition-colors"
                        style={
                          blockActive
                            ? { backgroundColor: "rgba(59,130,246,0.05)" }
                            : undefined
                        }
                      >
                        <button
                          type="button"
                          onClick={() => seekToBlock(bi, block.startSeconds)}
                          className="text-base font-medium text-[#2563EB] hover:underline"
                        >
                          {formatTimestamp(block.startSeconds)}
                        </button>
                        <p className="mt-1 text-left text-base leading-relaxed text-slate-500 whitespace-pre-wrap break-words">
                          {block.sentences.map((sent, si) => {
                            const key = `${bi}-${si}-${sent.startSeconds}`;
                            const on = activeSentence === key;
                            return (
                              <span
                                key={key}
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  seekToSentence(bi, key, sent.startSeconds);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    seekToSentence(bi, key, sent.startSeconds);
                                  }
                                }}
                                className="inline cursor-pointer rounded-md px-0.5 py-0.5 transition-colors hover:bg-gray-100 hover:text-[#3C82F6]"
                                style={
                                  on
                                    ? {
                                        backgroundColor: "rgba(59,130,246,0.12)",
                                        color: "#3C82F6",
                                      }
                                    : undefined
                                }
                                title={formatTimestamp(sent.startSeconds)}
                              >
                                <HighlightedText
                                  text={sent.text}
                                  containerKey={key}
                                  hits={searchHits}
                                  activeHitId={activeSearchHitId}
                                />
                              </span>
                            );
                          })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : leftTab === "subtitles" ? (
                <div className="space-y-1">
                  {subtitleCues.map((cue, i) => {
                    const key = `sub-${i}-${cue.startSeconds}`;
                    const on = activeSentence === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => seekToSubtitle(i, cue.startSeconds)}
                        className="group flex w-full items-start gap-4 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-[rgba(59,130,246,0.05)]"
                        style={
                          on
                            ? { backgroundColor: "rgba(59,130,246,0.05)" }
                            : undefined
                        }
                      >
                        <span className="shrink-0 text-base font-medium text-[#2563EB] tabular-nums">
                          {formatTimestamp(cue.startSeconds)}
                        </span>
                        <span
                          className="min-w-0 flex-1 text-base leading-relaxed text-slate-500 group-hover:text-blue-500"
                          style={on ? { color: "#3C82F6" } : undefined}
                        >
                          <HighlightedText
                            text={cue.text}
                            containerKey={`sub-${i}`}
                            hits={searchHits}
                            activeHitId={activeSearchHitId}
                          />
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="px-1 py-1">
                  {chaptersLoading ? (
                    <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-slate-500">
                      <Loader2 className="h-8 w-8 animate-spin text-[#3B82F6]" />
                      <p className="text-sm font-medium text-slate-600">
                        Generating chapters…
                      </p>
                      <p className="text-xs text-slate-400">
                        AI is outlining topics from your transcript
                      </p>
                    </div>
                  ) : chaptersError ? (
                    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                      <p className="text-sm text-red-600">{chaptersError}</p>
                      <button
                        type="button"
                        className="rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                        onClick={() => {
                          setChapters(null);
                          setChaptersError("");
                          setLeftTab("transcript");
                          requestAnimationFrame(() => setLeftTab("chapter"));
                        }}
                      >
                        Try again
                      </button>
                    </div>
                  ) : chapters && chapters.length > 0 ? (
                    <div className="space-y-0.5">
                      {chapters.map((ch, i) => {
                        const key = String(i);
                        const expanded = openChapter === key;
                        return (
                          <div
                            key={`${ch.startSeconds}-${i}`}
                            className="rounded-2xl px-3 transition-colors hover:bg-gray-100"
                          >
                            <div className="flex items-start gap-1.5 py-3.5">
                              <button
                                type="button"
                                className="min-w-0 flex-1 text-left"
                                onClick={() =>
                                  setOpenChapter(expanded ? null : key)
                                }
                              >
                                <span className="flex flex-col gap-1">
                                  <span
                                    role="link"
                                    tabIndex={0}
                                    className="w-fit cursor-pointer text-sm font-medium text-[#2563EB] tabular-nums hover:underline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveSentence(`ch-${i}`);
                                      seekPlayback(ch.startSeconds);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setActiveSentence(`ch-${i}`);
                                        seekPlayback(ch.startSeconds);
                                      }
                                    }}
                                  >
                                    {formatTimestamp(ch.startSeconds)}
                                  </span>
                                  <span className="text-sm font-medium leading-snug text-slate-800">
                                    <HighlightedText
                                      text={ch.title}
                                      containerKey={`ch-title-${i}`}
                                      hits={searchHits}
                                      activeHitId={activeSearchHitId}
                                    />
                                  </span>
                                </span>
                              </button>
                              <button
                                type="button"
                                aria-label={expanded ? "Collapse" : "Expand"}
                                className="mt-0.5 shrink-0 p-0.5 text-slate-400 hover:text-slate-600"
                                onClick={() =>
                                  setOpenChapter(expanded ? null : key)
                                }
                              >
                                <ChevronDown
                                  className={`h-5 w-5 transition-transform ${
                                    expanded ? "rotate-180" : ""
                                  }`}
                                />
                              </button>
                            </div>
                            {expanded && ch.summary ? (
                              <div className="space-y-1 pb-3 text-sm text-slate-500">
                                <button
                                  type="button"
                                  className="mb-1 block w-fit cursor-pointer text-sm text-slate-500 hover:text-[#2563EB]"
                                  onClick={() => {
                                    setActiveSentence(`ch-${i}`);
                                    seekPlayback(ch.startSeconds);
                                  }}
                                >
                                  {formatTimestamp(ch.startSeconds)}
                                </button>
                                <p className="leading-relaxed">
                                  <HighlightedText
                                    text={ch.summary}
                                    containerKey={`ch-sum-${i}`}
                                    hits={searchHits}
                                    activeHitId={activeSearchHitId}
                                  />
                                </p>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="px-2 py-8 text-center text-sm text-slate-400">
                      No chapters yet.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right column — 50% */}
        <aside className="flex min-h-0 min-w-0 flex-col p-3 lg:p-4">
          <div className={`flex min-h-0 flex-1 flex-col rounded-2xl bg-white ${ring}`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5">
            {/* Left: segmented tabs — icons match i-hugeicons:* on videotranscriber.ai */}
            <div
              className="inline-flex max-w-full flex-wrap items-center gap-0.5 rounded-full p-1"
              style={{ backgroundColor: "#F1F5F9" }}
            >
              {(
                [
                  { id: "notes" as const, label: "AI Notes", body: HUGE.appleReminder },
                  { id: "ask" as const, label: "Ask AI", body: HUGE.aiChat02 },
                  { id: "infographic" as const, label: "Infographic", body: HUGE.image02, dot: true },
                  { id: "mindmap" as const, label: "MindMap", body: HUGE.hierarchySquare04 },
                ] as const
              ).map(({ id: tabId, label, body, ...rest }) => {
                const active = rightTab === tabId;
                const dot = "dot" in rest && rest.dot;
                return (
                  <button
                    key={tabId}
                    type="button"
                    onClick={() => setRightTab(tabId)}
                    className="relative inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors"
                    style={
                      active
                        ? {
                            backgroundColor: "#FFFFFF",
                            color: "#2563EB",
                            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.08)",
                          }
                        : { color: "#64748B" }
                    }
                  >
                    <HugeIcon body={body} className="h-5 w-5 shrink-0" />
                    <span className="whitespace-nowrap">{label}</span>
                    {dot ? (
                      <span className="absolute right-1.5 top-1 h-1.5 w-1.5 rounded-full bg-red-500" />
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* Right: Summarize (Notes) + translate + settings */}
            <div className="flex shrink-0 items-center gap-3">
              {rightTab === "notes" ? (
              <div ref={promptLibraryRef} className="relative">
                <div className="inline-flex h-8 overflow-hidden rounded-lg bg-[#3B82F6] shadow-sm">
                  <button
                    type="button"
                    disabled={notesLoading}
                    className="inline-flex h-full items-center gap-2 px-4 text-sm font-normal text-white hover:bg-blue-600 disabled:opacity-70"
                    onClick={() =>
                      void generateAiNotes(payload.noteMode || "smart_summary", {
                        force: true,
                      })
                    }
                  >
                    {notesLoading ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                    ) : (
                      <HugeIcon body={HUGE.appleReminder} className="h-5 w-5 shrink-0" />
                    )}
                    Summarize
                  </button>
                  <button
                    type="button"
                    disabled={notesLoading}
                    className="inline-flex h-full w-10 items-center justify-center border-l border-white/80 text-white hover:bg-blue-600 disabled:opacity-70"
                    aria-label="Summarize options"
                    aria-expanded={promptLibraryOpen}
                    onClick={() => setPromptLibraryOpen((o) => !o)}
                  >
                    <HugeIcon body={HUGE.arrowDown01} className="h-5 w-5" />
                  </button>
                </div>
                {promptLibraryOpen ? (
                  <div className="absolute right-0 top-full z-50 mt-2 max-h-[45vh] w-[22.5rem] overflow-auto rounded-md bg-white shadow-lg ring-1 ring-slate-200">
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-sm font-bold text-slate-900">
                        Prompt Library
                      </span>
                    </div>
                    <div className="pb-2">
                      {NOTE_MODE_PRESETS.map((preset, i) => {
                        const active =
                          (payload.noteMode || "smart_summary") === preset.value;
                        return (
                          <div key={preset.value}>
                            {i === 1 ? (
                              <div className="mx-2 mb-1 border-b border-slate-200" />
                            ) : null}
                            <button
                              type="button"
                              onClick={() =>
                                void generateAiNotes(preset.value, { force: true })
                              }
                              className={cn(
                                "mx-2 mb-1 w-[calc(100%-1rem)] rounded-lg px-3 py-2 text-left transition-colors hover:bg-gray-100",
                                active && "bg-[#3B82F6]/10",
                              )}
                            >
                              <div
                                className={cn(
                                  "flex items-center text-sm font-medium leading-tight",
                                  active ? "text-[#3B82F6]" : "text-slate-800",
                                )}
                              >
                                {i === 0 ? (
                                  <HugeIcon
                                    body={HUGE.aiChat02}
                                    className="mr-1 size-5 shrink-0 text-[#3B82F6]"
                                  />
                                ) : null}
                                <span className="flex-1 truncate">{preset.label}</span>
                              </div>
                              <div
                                className={cn(
                                  "mt-1 line-clamp-2 text-xs leading-tight text-slate-500",
                                  active && "text-[#3B82F6]",
                                )}
                              >
                                {preset.description}
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
              ) : null}
              {rightTab === "mindmap" ? (
                <button
                  type="button"
                  disabled={mindmapLoading}
                  className="inline-flex h-8 items-center gap-2 rounded-lg bg-[#3B82F6] px-4 text-sm font-normal text-white shadow-sm hover:bg-blue-600 disabled:opacity-70"
                  onClick={() => void generateMindMapForWorkspace({ force: true })}
                >
                  {mindmapLoading ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                  ) : (
                    <HugeIcon
                      body={HUGE.hierarchySquare04}
                      className="h-5 w-5 shrink-0"
                    />
                  )}
                  Generate
                </button>
              ) : null}
              <button
                type="button"
                className="inline-flex text-slate-500 hover:text-slate-800"
                onClick={() => toast.message("Translate coming soon")}
                aria-label="Translate"
              >
                <HugeIcon body={HUGE.translate} className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="inline-flex text-slate-500 hover:text-slate-800"
                onClick={() => toast.message("Settings coming soon")}
                aria-label="Settings"
              >
                <HugeIcon body={HUGE.settings03} className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {rightTab === "notes" ? (
              <>
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  {notesLoading && !aiNotes ? (
                    <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-slate-500">
                      <Loader2 className="h-8 w-8 animate-spin text-[#3B82F6]" />
                      <p className="text-sm font-medium text-slate-600">
                        Generating notes…
                      </p>
                      <p className="text-xs text-slate-400">
                        AI is summarizing your transcript
                      </p>
                    </div>
                  ) : notesError && !aiNotes ? (
                    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                      <p className="text-sm text-red-600">{notesError}</p>
                      <button
                        type="button"
                        className="rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                        onClick={() =>
                          void generateAiNotes(
                            payload.noteMode || "smart_summary",
                            { force: true },
                          )
                        }
                      >
                        Try again
                      </button>
                    </div>
                  ) : aiNotes ? (
                    <>
                      {notesLoading ? (
                        <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#3B82F6]" />
                          Refreshing notes…
                        </div>
                      ) : null}
                      <h1 className="text-lg font-bold leading-snug text-slate-900">
                        {aiNotes.headline}
                      </h1>
                      <div className="mt-4 space-y-5">
                        {aiNotes.sections.map((section, i) => (
                          <div key={`${section.startSeconds}-${i}`}>
                            <h2 className="text-sm font-semibold text-slate-900">
                              {section.title}{" "}
                              <span className="font-medium text-blue-600">
                                [
                                <button
                                  type="button"
                                  className="hover:underline"
                                  onClick={() =>
                                    seekPlayback(section.startSeconds)
                                  }
                                >
                                  {formatTimestamp(section.startSeconds)}
                                </button>
                                ~
                                <button
                                  type="button"
                                  className="hover:underline"
                                  onClick={() =>
                                    seekPlayback(section.endSeconds)
                                  }
                                >
                                  {formatTimestamp(section.endSeconds)}
                                </button>
                                ]
                              </span>
                            </h2>
                            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                              {section.body}
                            </p>
                          </div>
                        ))}
                        {aiNotes.bullets.length > 0 ? (
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              Key takeaways
                            </p>
                            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-600">
                              {aiNotes.bullets.map((b) => (
                                <li key={b}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
                      <p className="text-sm text-slate-500">
                        No notes yet. Click Summarize to generate.
                      </p>
                      <button
                        type="button"
                        className="rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                        onClick={() =>
                          void generateAiNotes(
                            payload.noteMode || "smart_summary",
                            { force: true },
                          )
                        }
                      >
                        Summarize
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-2.5">
                  <span
                    className="inline-flex h-8 items-center rounded-md px-2.5 text-xs font-medium"
                    style={{ backgroundColor: "#DBEAFE", color: "#2563EB" }}
                  >
                    {noteModeLabel(aiNotes?.mode || payload.noteMode)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 px-2 text-xs text-slate-600 hover:bg-slate-50"
                      onClick={() => setRightTab("infographic")}
                    >
                      Infographic
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
                      aria-label="Copy notes"
                      onClick={async () => {
                        if (!aiNotes) {
                          toast.message("Generate notes first");
                          return;
                        }
                        const lines = [
                          aiNotes.headline,
                          "",
                          ...aiNotes.sections.flatMap((s) => [
                            `${s.title} ${formatNoteRange(s.startSeconds, s.endSeconds)}`,
                            s.body,
                            "",
                          ]),
                          aiNotes.bullets.length
                            ? `Key takeaways\n${aiNotes.bullets.map((b) => `- ${b}`).join("\n")}`
                            : "",
                        ];
                        try {
                          await navigator.clipboard.writeText(
                            lines.filter(Boolean).join("\n"),
                          );
                          toast.success("Notes Copied Successfully.");
                        } catch {
                          toast.error("Could not copy");
                        }
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
                      aria-label="Download"
                      onClick={() => toast.message("Download coming soon")}
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
                      aria-label="More"
                      onClick={() => toast.message("More actions coming soon")}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : rightTab === "ask" ? (
              <AskAiPanel
                workspaceId={payload.id}
                title={payload.title}
                durationSeconds={payload.durationSeconds}
                transcript={payload.transcript}
                messages={askMessages}
                onSeek={seekPlayback}
                onMessagesChange={(next) => {
                  setAskMessages(next);
                  setPayload((prev) => {
                    if (!prev) return prev;
                    const updated = { ...prev, askMessages: next };
                    saveWorkspace(updated);
                    return updated;
                  });
                  queuePersistAskMessages(payload.id, next);
                }}
              />
            ) : rightTab === "mindmap" ? (
              <MindMapPanel
                mindmap={mindmap}
                loading={mindmapLoading}
                error={mindmapError}
                onGenerate={(force) =>
                  void generateMindMapForWorkspace({ force: Boolean(force) })
                }
              />
            ) : (
              <div className="flex flex-1 items-center justify-center px-6 py-16 text-center text-sm text-slate-400">
                {rightTab === "infographic" && "Infographic generation is not connected yet."}
              </div>
            )}
          </div>
          </div>
        </aside>
      </div>

      <ExportSettingsDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        title={payload.title}
        leftTab={leftTab}
        transcriptBlocks={transcriptBlocks}
        subtitleCues={subtitleCues}
        chapters={chapters}
      />
    </div>
  );
}
