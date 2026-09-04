"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  FolderOpen,
  Languages,
  Loader2,
  Mic,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import WorkspaceNav from "@/components/face-rating/workspace-nav";
import {
  loadRecentMedia,
  removeRecentMedia,
  type RecentMediaItem,
} from "@/lib/media/recent-media";
import { PlatformMark } from "@/components/face-rating/platform-mark";
import ExportSettingsDialog from "@/components/workspace/export-settings-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  buildTranscriptBlocks,
  mergeIntoSentences,
  type TranscriptBlock,
  type TranscriptSentence,
} from "@/lib/media/workspace-mock";
import {
  fetchWorkspace,
  loadWorkspace,
} from "@/lib/media/workspace-store";
import type { ChapterItem } from "@/lib/media/chapters";

type AssetTab = "transcription" | "translation" | "recordings";

type ExportTarget = {
  title: string;
  transcriptBlocks: TranscriptBlock[];
  subtitleCues: TranscriptSentence[];
  chapters: ChapterItem[] | null;
};

function formatUploaded(ts: number) {
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function formatDuration(seconds: number | null | undefined) {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return "—";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function isRecording(item: RecentMediaItem) {
  const p = (item.platform || "").toLowerCase();
  if (p === "upload" || p === "recording" || p === "audio" || p === "file") {
    return true;
  }
  return /^recording-/i.test(item.title || "");
}

const SIDE_TABS: {
  id: AssetTab;
  label: string;
  icon: typeof FolderOpen;
}[] = [
  { id: "transcription", label: "Transcription", icon: FolderOpen },
  { id: "translation", label: "Translation", icon: Languages },
  { id: "recordings", label: "Recordings", icon: Mic },
];

export default function MyAssetsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<AssetTab>("transcription");
  const [items, setItems] = useState<RecentMediaItem[]>([]);
  const [pendingDelete, setPendingDelete] = useState<RecentMediaItem | null>(
    null,
  );
  const [menuId, setMenuId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportLoadingId, setExportLoadingId] = useState<string | null>(null);
  const [exportTarget, setExportTarget] = useState<ExportTarget | null>(null);

  const refresh = () => setItems(loadRecentMedia());

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener("vt:recent-media-updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("vt:recent-media-updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  useEffect(() => {
    const close = () => setMenuId(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const filtered = useMemo(() => {
    if (tab === "translation") return [];
    if (tab === "recordings") return items.filter(isRecording);
    return items;
  }, [items, tab]);

  const title =
    tab === "transcription"
      ? "Transcription"
      : tab === "translation"
        ? "Translation"
        : "Recordings";

  const openWorkspace = (item: RecentMediaItem) => {
    if (!item.workspaceId) return;
    router.push(`/workspace/${item.workspaceId}`);
  };

  const openExport = async (item: RecentMediaItem) => {
    if (!item.workspaceId) {
      toast.error("Workspace not found");
      return;
    }
    setExportLoadingId(item.workspaceId);
    try {
      let payload = loadWorkspace(item.workspaceId);
      if (!payload?.transcript?.length) {
        const remote = await fetchWorkspace(item.workspaceId);
        if (remote) payload = remote;
      }
      const segments = payload?.transcript || [];
      if (!segments.length) {
        toast.error("No transcript to export yet");
        return;
      }
      setExportTarget({
        title: payload?.title || item.title || "Untitled",
        transcriptBlocks: buildTranscriptBlocks(segments),
        subtitleCues: mergeIntoSentences(segments),
        chapters: payload?.chapters || null,
      });
      setExportOpen(true);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to open export",
      );
    } finally {
      setExportLoadingId(null);
    }
  };

  const confirmDelete = () => {
    if (!pendingDelete?.workspaceId) return;
    removeRecentMedia(pendingDelete.workspaceId);
    void fetch(
      `/api/workspaces?id=${encodeURIComponent(pendingDelete.workspaceId)}`,
      { method: "DELETE" },
    ).catch(() => undefined);
    setPendingDelete(null);
    refresh();
  };

  return (
    <div className="flex min-h-svh bg-white text-slate-800">
      <WorkspaceNav />
      <div className="flex min-h-svh min-w-0 flex-1 overflow-hidden">
        {/* Secondary nav — competitor my-videos */}
        <aside className="hidden w-[280px] shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
          <h1 className="px-7 py-5 text-2xl font-bold text-slate-500">
            My Assets
          </h1>
          <nav className="flex flex-col gap-1 px-3">
            {SIDE_TABS.map((item) => {
              const active = tab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className="flex h-10 items-center gap-3 rounded-lg px-4 text-left text-sm transition-colors"
                  style={{
                    backgroundColor: active ? "#E2E8F0" : "transparent",
                    color: "#64748B",
                    fontWeight: active ? 600 : 500,
                  }}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pb-6">
          {/* Mobile tabs */}
          <div className="flex gap-1 border-b border-slate-200 px-4 pt-4 md:hidden">
            {SIDE_TABS.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className="relative px-3 pb-3 text-sm font-medium"
                  style={{ color: active ? "#1C6CFB" : "#64748B" }}
                >
                  {item.label}
                  {active ? (
                    <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#1C6CFB]" />
                  ) : null}
                </button>
              );
            })}
          </div>

          <h2 className="hidden h-16 items-center border-b border-slate-200 px-8 text-2xl font-bold text-slate-500 md:flex">
            {title}
          </h2>

          <div className="min-h-0 flex-1 overflow-auto px-4 pt-4 md:px-8">
            <div
              className="overflow-hidden rounded-2xl border border-slate-200"
              style={{ backgroundColor: "#F8FAFC" }}
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] table-fixed">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-sm text-slate-500">
                      <th className="w-[45%] px-4 py-3 font-medium xl:pl-10">
                        Name
                      </th>
                      <th className="w-[18%] px-4 py-3 font-medium">Uploaded</th>
                      <th className="w-[12%] px-4 py-3 font-medium">Duration</th>
                      <th className="w-[10%] px-4 py-3 font-medium">Status</th>
                      <th className="w-[15%] px-4 py-3 font-medium">
                        Operation
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tab === "translation" ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-16 text-center text-sm text-slate-400"
                        >
                          Translations will show up here once available.
                        </td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-16 text-center text-sm text-slate-400"
                        >
                          {tab === "recordings"
                            ? "No recordings yet. Record audio on the home page to get started."
                            : "No transcriptions yet. "}
                          {tab === "transcription" ? (
                            <Link
                              href="/"
                              className="font-medium text-[#1C6CFB] hover:underline"
                            >
                              New video
                            </Link>
                          ) : null}
                        </td>
                      </tr>
                    ) : (
                      filtered.map((item) => (
                        <tr
                          key={item.workspaceId}
                          role="button"
                          tabIndex={0}
                          onClick={() => openWorkspace(item)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              openWorkspace(item);
                            }
                          }}
                          className="border-b border-slate-100 last:border-0 hover:bg-white/80"
                        >
                          <td className="truncate px-4 py-4 text-sm text-slate-500 xl:pl-10">
                            <div className="inline-flex min-h-10 w-full min-w-0 items-center">
                              <span className="mr-3 shrink-0">
                                <PlatformMark kind={item.platform} />
                              </span>
                              <span className="truncate hover:text-[#1C6CFB] hover:underline">
                                {item.title || "Untitled"}
                              </span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500">
                            {formatUploaded(item.savedAt)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500">
                            {formatDuration(item.durationSeconds)}
                          </td>
                          <td className="px-4 py-4">
                            <CheckCircle2
                              className="h-6 w-6 text-green-500"
                              strokeWidth={1.75}
                              aria-label="Ready"
                            />
                          </td>
                          <td
                            className="px-4 py-4"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="relative inline-flex items-center gap-1">
                              <button
                                type="button"
                                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                                aria-label="Export"
                                disabled={exportLoadingId === item.workspaceId}
                                onClick={() => void openExport(item)}
                              >
                                {exportLoadingId === item.workspaceId ? (
                                  <Loader2
                                    className="h-5 w-5 animate-spin"
                                    strokeWidth={1.75}
                                  />
                                ) : (
                                  <Download
                                    className="h-5 w-5"
                                    strokeWidth={1.75}
                                  />
                                )}
                              </button>
                              <button
                                type="button"
                                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                aria-label="More"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuId((id) =>
                                    id === item.workspaceId
                                      ? null
                                      : item.workspaceId,
                                  );
                                }}
                              >
                                <MoreHorizontal
                                  className="h-5 w-5"
                                  strokeWidth={1.75}
                                />
                              </button>
                              {menuId === item.workspaceId ? (
                                <div
                                  className="absolute right-0 top-9 z-20 min-w-[140px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                    onClick={() => {
                                      setMenuId(null);
                                      setPendingDelete(item);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Dialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Permanent Delete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Delete{" "}
            <span className="font-medium text-slate-800">
              {pendingDelete?.title || "this file"}
            </span>
            ? This cannot be undone.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ExportSettingsDialog
        open={exportOpen && Boolean(exportTarget)}
        onOpenChange={(open) => {
          setExportOpen(open);
          if (!open) setExportTarget(null);
        }}
        title={exportTarget?.title || "Untitled"}
        leftTab="transcript"
        transcriptBlocks={exportTarget?.transcriptBlocks || []}
        subtitleCues={exportTarget?.subtitleCues || []}
        chapters={exportTarget?.chapters || null}
      />
    </div>
  );
}
