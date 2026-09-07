"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { formatDuration, type MediaPreview } from "@/lib/media/preview-types";
import { EXAMPLE_CARDS, openExampleWorkspace } from "@/lib/media/examples";
import {
  deleteUserWorkspace,
  fetchUserRecentMedia,
  finishTranscribeJob,
  listTranscribeJobs,
  TRANSCRIBE_JOBS_EVENT,
  type RecentMediaItem,
  type TranscribeJob,
} from "@/lib/media/recent-media";
import { PlatformMark } from "@/components/face-rating/platform-mark";
import { useAppContext } from "@/contexts/app";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function formatCardDuration(seconds: number | null | undefined) {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return "";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const cardShell =
  "group relative flex h-[95px] w-[calc(50%-8px)] shrink-0 flex-col rounded-lg bg-white p-3 shadow-[inset_0_0_0_1px_rgb(203,213,225)] transition-all duration-200 hover:bg-slate-50 hover:shadow-[inset_0_0_0_1px_rgb(148,163,184),0_4px_14px_rgba(15,23,42,0.08)] md:w-[calc(25%-12px)]";

function MediaCard({
  item,
  mark,
  onOpen,
  onRequestDelete,
}: {
  item: MediaPreview;
  mark: string;
  onOpen: () => void;
  onRequestDelete?: () => void;
}) {
  const duration =
    formatCardDuration(item.durationSeconds) ||
    formatDuration(item.durationSeconds) ||
    "";
  return (
    <div className={cardShell}>
      <button
        type="button"
        onClick={onOpen}
        className="flex min-h-0 flex-1 items-start gap-2 text-left"
      >
        <PlatformMark kind={mark} />
        <p className="line-clamp-2 flex-1 text-sm leading-[22px] text-slate-500 group-hover:text-slate-800">
          {item.title}
        </p>
      </button>
      <div className="mt-2 flex h-5 items-center justify-between gap-2">
        <p className="truncate text-xs text-slate-400">
          {duration || item.platform}
        </p>
        {onRequestDelete ? (
          <button
            type="button"
            aria-label="Delete"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRequestDelete();
            }}
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-slate-400 opacity-0 transition-opacity hover:text-slate-600 group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ProgressCard({ job }: { job: TranscribeJob }) {
  return (
    <div
      className={`${cardShell} history-card-enter cursor-not-allowed`}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex min-h-0 flex-1 items-start gap-2">
        <PlatformMark kind={job.platform} />
        <p className="line-clamp-2 flex-1 text-sm leading-[22px] text-slate-500">
          {job.title}
        </p>
      </div>
      <div className="mt-2 flex h-5 items-center gap-1.5">
        <Loader2
          className="h-4 w-4 shrink-0 animate-spin text-[#5270FF]"
          aria-hidden
        />
        <p className="truncate text-sm font-medium text-[#5270FF]">
          Transcribing ({job.percent}%)
        </p>
      </div>
    </div>
  );
}

export default function MediaFilesStrip() {
  const router = useRouter();
  const { user } = useAppContext();
  const signedIn = Boolean(user?.uuid);
  const [tab, setTab] = useState<"mine" | "examples">("examples");
  const [recent, setRecent] = useState<RecentMediaItem[]>([]);
  const [jobs, setJobs] = useState<TranscribeJob[]>([]);
  const [pendingDelete, setPendingDelete] = useState<RecentMediaItem | null>(
    null,
  );
  const [loadingMine, setLoadingMine] = useState(false);

  useEffect(() => {
    setTab(signedIn ? "mine" : "examples");
  }, [signedIn]);

  useEffect(() => {
    if (!signedIn) {
      setRecent([]);
      setLoadingMine(false);
      return;
    }
    let cancelled = false;
    const refreshRecent = async () => {
      setLoadingMine(true);
      try {
        const items = await fetchUserRecentMedia(24);
        if (!cancelled) setRecent(items);
      } finally {
        if (!cancelled) setLoadingMine(false);
      }
    };
    const onRecentUpdated = () => {
      void refreshRecent();
    };
    void refreshRecent();
    window.addEventListener("vt:recent-media-updated", onRecentUpdated);
    window.addEventListener("storage", onRecentUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener("vt:recent-media-updated", onRecentUpdated);
      window.removeEventListener("storage", onRecentUpdated);
    };
  }, [signedIn, user?.uuid]);

  useEffect(() => {
    const refreshJobs = (event?: Event) => {
      const detail =
        event instanceof CustomEvent
          ? (event.detail as TranscribeJob[] | undefined)
          : undefined;
      const next = Array.isArray(detail) ? detail : listTranscribeJobs();
      setJobs(next);
      if (signedIn && next.some((j) => j.status === "running")) setTab("mine");
    };
    refreshJobs();
    window.addEventListener(TRANSCRIBE_JOBS_EVENT, refreshJobs as EventListener);
    return () => {
      window.removeEventListener(
        TRANSCRIBE_JOBS_EVENT,
        refreshJobs as EventListener,
      );
    };
  }, [signedIn]);

  const openMine = (item: RecentMediaItem) => {
    if (item.workspaceId) {
      router.push(`/workspace/${item.workspaceId}`);
    }
  };

  const openExample = (workspaceId: string) => {
    if (!openExampleWorkspace(workspaceId)) return;
    router.push(`/workspace/${workspaceId}`);
  };

  const confirmDelete = async () => {
    if (!pendingDelete?.workspaceId) return;
    const id = pendingDelete.workspaceId;
    setPendingDelete(null);
    finishTranscribeJob(id);
    await deleteUserWorkspace(id);
    setRecent(await fetchUserRecentMedia(24));
  };

  const runningJobs = signedIn
    ? jobs.filter((j) => j.status === "running")
    : [];
  const recentSlots = Math.max(0, 4 - runningJobs.length);
  const recentVisible = recent.slice(0, recentSlots);
  const hasMine = runningJobs.length > 0 || recent.length > 0;
  const activeTab = signedIn ? tab : "examples";

  const tabs = signedIn
    ? ([
        { id: "mine" as const, label: "My files" },
        { id: "examples" as const, label: "Examples" },
      ] as const)
    : ([{ id: "examples" as const, label: "Examples" }] as const);

  return (
    <div className="mx-auto mt-5 w-full max-w-[1152px]" id="my-files-strip">
      <style>{`
        @keyframes history-card-enter {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .history-card-enter {
          animation: history-card-enter 280ms ease-out;
        }
      `}</style>
      <div className="flex items-center justify-between gap-3">
        <div
          className="flex items-center gap-5"
          role="tablist"
          aria-label="Media library"
        >
          {tabs.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(item.id)}
                className="relative pb-2 text-sm font-medium transition-colors"
                style={{ color: active ? "#2563EB" : "#64748B" }}
              >
                {item.label}
                {active ? (
                  <span
                    className="absolute inset-x-0 bottom-0 h-0.5 rounded-full"
                    style={{ backgroundColor: "#2563EB" }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
        {signedIn ? (
          <Link
            href="/my-assets"
            className="text-sm font-medium"
            style={{ color: "#2563EB" }}
          >
            All files &gt;
          </Link>
        ) : null}
      </div>

      <div className="relative mt-4 flex w-full gap-3 overflow-hidden">
        {activeTab === "mine" && signedIn ? (
          loadingMine && !hasMine ? (
            <p className="flex items-center gap-2 py-6 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading your files…
            </p>
          ) : hasMine ? (
            <>
              {runningJobs.slice(0, 4).map((job) => (
                <ProgressCard key={job.id} job={job} />
              ))}
              {recentVisible.map((item) => (
                <MediaCard
                  key={`${item.workspaceId || item.url}-${item.savedAt}`}
                  item={item}
                  mark={item.platform}
                  onOpen={() => openMine(item)}
                  onRequestDelete={() => setPendingDelete(item)}
                />
              ))}
            </>
          ) : (
            <p className="py-6 text-sm text-slate-400">
              Transcribe a file or link — it will show up here.
            </p>
          )
        ) : (
          EXAMPLE_CARDS.map((item) => (
            <MediaCard
              key={item.workspaceId}
              item={item}
              mark={item.icon}
              onOpen={() => openExample(item.workspaceId)}
            />
          ))
        )}
      </div>

      <Dialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <DialogContent className="max-w-md gap-5 rounded-xl border-slate-200 bg-white p-6 shadow-xl sm:rounded-xl">
          <DialogHeader className="space-y-3 text-left">
            <DialogTitle className="text-base font-semibold text-slate-900">
              Permanent Delete
            </DialogTitle>
            <p className="text-sm leading-6 text-slate-600">
              This record cannot be recovered after deletion. Are you sure you
              want to permanently delete it?
            </p>
          </DialogHeader>
          <DialogFooter className="flex-row justify-end gap-2 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              className="border-slate-200 bg-white text-slate-800"
              onClick={() => setPendingDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-red-500 text-white hover:bg-red-600"
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
