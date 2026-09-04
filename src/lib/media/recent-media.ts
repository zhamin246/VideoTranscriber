import type { MediaPreview } from "@/lib/media/preview-types";

export const RECENT_MEDIA_KEY = "videotranscriber:recent-media";
export const OPEN_MEDIA_EVENT = "vt:open-media";
export const TRANSCRIBE_JOBS_EVENT = "vt:transcribe-jobs-updated";
const MAX_RECENT = 12;

export type RecentMediaItem = MediaPreview & {
  savedAt: number;
  /** Required for My files — only transcribed workspaces are listed. */
  workspaceId: string;
};

/** In-flight Transcribe shown in My files (session only). */
export type TranscribeJob = {
  id: string;
  title: string;
  platform: string;
  thumbnailUrl?: string;
  percent: number;
  status: "running" | "done" | "error";
  startedAt: number;
};

function isTranscribedItem(item: unknown): item is RecentMediaItem {
  if (!item || typeof item !== "object") return false;
  const row = item as Partial<RecentMediaItem>;
  return Boolean(row.url && row.title && row.workspaceId && row.savedAt);
}

export function loadRecentMedia(): RecentMediaItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_MEDIA_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) return [];
    const transcribed = parsed.filter(isTranscribedItem).slice(0, MAX_RECENT);
    if (transcribed.length !== parsed.length) {
      localStorage.setItem(RECENT_MEDIA_KEY, JSON.stringify(transcribed));
    }
    return transcribed;
  } catch {
    return [];
  }
}

/** Only call after a successful Transcribe (must include workspaceId). */
export function saveRecentMedia(
  preview: MediaPreview & { workspaceId: string },
) {
  if (typeof window === "undefined") return;
  if (!preview.workspaceId) return;
  try {
    const next: RecentMediaItem = {
      ...preview,
      savedAt: Date.now(),
      workspaceId: preview.workspaceId,
    };
    const prev = loadRecentMedia().filter(
      (item) => item.workspaceId !== preview.workspaceId,
    );
    localStorage.setItem(
      RECENT_MEDIA_KEY,
      JSON.stringify([next, ...prev].slice(0, MAX_RECENT)),
    );
    window.dispatchEvent(new Event("vt:recent-media-updated"));
  } catch {
    /* quota / private mode */
  }
}

export function removeRecentMedia(workspaceId: string) {
  if (typeof window === "undefined" || !workspaceId) return;
  try {
    const next = loadRecentMedia().filter((item) => item.workspaceId !== workspaceId);
    localStorage.setItem(RECENT_MEDIA_KEY, JSON.stringify(next));
    try {
      sessionStorage.removeItem(`videotranscriber:workspace:${workspaceId}`);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event("vt:recent-media-updated"));
  } catch {
    /* quota / private mode */
  }
}

export function emitOpenMedia(preview: MediaPreview) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_MEDIA_EVENT, { detail: preview }));
}

function getJobStore(): Map<string, TranscribeJob> {
  if (typeof window === "undefined") return new Map();
  const w = window as Window & {
    __vtTranscribeJobs?: Map<string, TranscribeJob>;
  };
  if (!w.__vtTranscribeJobs) w.__vtTranscribeJobs = new Map();
  return w.__vtTranscribeJobs;
}

function emitJobs() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(TRANSCRIBE_JOBS_EVENT, {
      detail: listTranscribeJobs(),
    }),
  );
}

export function listTranscribeJobs(): TranscribeJob[] {
  return [...getJobStore().values()].sort((a, b) => b.startedAt - a.startedAt);
}

export function startTranscribeJob(input: {
  id: string;
  title: string;
  platform: string;
  thumbnailUrl?: string;
}): TranscribeJob {
  const job: TranscribeJob = {
    id: input.id,
    title: input.title,
    platform: input.platform,
    thumbnailUrl: input.thumbnailUrl,
    percent: 0,
    status: "running",
    startedAt: Date.now(),
  };
  getJobStore().set(job.id, job);
  emitJobs();
  return job;
}

export function updateTranscribeJob(
  id: string,
  patch: Partial<Pick<TranscribeJob, "percent" | "status" | "title">>,
) {
  const store = getJobStore();
  const cur = store.get(id);
  if (!cur) return;
  store.set(id, {
    ...cur,
    ...patch,
    percent:
      typeof patch.percent === "number"
        ? Math.max(0, Math.min(100, Math.round(patch.percent)))
        : cur.percent,
  });
  emitJobs();
}

export function finishTranscribeJob(id: string) {
  const store = getJobStore();
  if (!store.has(id)) return;
  store.delete(id);
  emitJobs();
}

/**
 * Simulated progress while the server works.
 * Approaches ~90% asymptotically so the last jump happens on real completion.
 */
export function simulatedTranscribePercent(elapsedMs: number) {
  const pct = 90 * (1 - Math.exp(-elapsedMs / 45000));
  return Math.max(0, Math.min(90, Math.floor(pct)));
}
