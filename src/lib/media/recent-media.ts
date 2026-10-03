import type { MediaPreview } from "@/lib/media/preview-types";

export const RECENT_MEDIA_KEY = "videotranscriber:recent-media";
export const OPEN_MEDIA_EVENT = "vt:open-media";
export const TRANSCRIBE_JOBS_EVENT = "vt:transcribe-jobs-updated";
const MAX_RECENT = 12;
/** Home strip — full library lives on /my-assets */
export const MY_FILES_STRIP_VISIBLE = 4;
const WORKSPACE_SESSION_PREFIX = "videotranscriber:workspace:";

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

type ApiWorkspaceRow = {
  id?: string;
  url?: string;
  playbackUrl?: string | null;
  title?: string;
  thumbnailUrl?: string | null;
  durationSeconds?: number | null;
  platform?: string | null;
  createdAt?: number | null;
};

function mapWorkspaceRow(row: ApiWorkspaceRow): RecentMediaItem | null {
  const workspaceId = String(row.id || "").trim();
  if (!workspaceId) return null;
  const url = String(row.url || row.playbackUrl || "").trim() || `workspace:${workspaceId}`;
  return {
    url,
    title: String(row.title || "Untitled").trim() || "Untitled",
    thumbnailUrl: String(row.thumbnailUrl || ""),
    durationSeconds:
      typeof row.durationSeconds === "number" && Number.isFinite(row.durationSeconds)
        ? row.durationSeconds
        : null,
    platform: String(row.platform || "Upload"),
    workspaceId,
    savedAt: Number(row.createdAt) || Date.now(),
  };
}

/** After transcribe, list API can lag briefly — keep orphan local cards this long. */
const LOCAL_RACE_MS = 5 * 60 * 1000;

function mergeRecentMedia(
  fromApi: RecentMediaItem[],
  local: RecentMediaItem[],
): RecentMediaItem[] {
  const apiIds = new Set(fromApi.map((item) => item.workspaceId));
  const now = Date.now();
  const localPending = local.filter((item) => {
    if (apiIds.has(item.workspaceId)) return false;
    return now - item.savedAt < LOCAL_RACE_MS;
  });
  const merged = [...fromApi, ...localPending];
  merged.sort((a, b) => b.savedAt - a.savedAt);
  return merged;
}

function workspaceIdsFromSessionStorage(): string[] {
  if (typeof window === "undefined") return [];
  const ids: string[] = [];
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key?.startsWith(WORKSPACE_SESSION_PREFIX)) continue;
      const id = key.slice(WORKSPACE_SESSION_PREFIX.length).trim();
      if (/^[\w-]{8,64}$/.test(id)) ids.push(id);
    }
  } catch {
    /* private mode */
  }
  return ids;
}

async function claimLegacyWorkspaces(workspaceIds: string[]) {
  const ids = [...new Set(workspaceIds.filter(Boolean))];
  if (!ids.length) return;
  try {
    await fetch("/api/workspaces/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceIds: ids }),
    });
  } catch {
    /* best-effort */
  }
}

function syncLocalRecentCache(merged: RecentMediaItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      RECENT_MEDIA_KEY,
      JSON.stringify(merged.slice(0, MAX_RECENT)),
    );
  } catch {
    /* quota / private mode */
  }
}

/**
 * Load My files from the signed-in user's DB workspaces.
 * Falls back to localStorage when logged out / request fails.
 * DB rows win over stale localStorage (old bug showed ghost cards and hid real saves).
 */
export type UserRecentMediaResult = {
  items: RecentMediaItem[];
  /** Total ready workspaces for this account in Postgres */
  total: number;
};

export async function fetchUserRecentMediaWithMeta(
  limit = 48,
): Promise<UserRecentMediaResult> {
  if (typeof window === "undefined") return { items: [], total: 0 };
  try {
    const local = loadRecentMedia();
    const claimIds = [
      ...workspaceIdsFromSessionStorage(),
      ...local.map((item) => item.workspaceId),
    ];
    await claimLegacyWorkspaces(claimIds);

    const res = await fetch(`/api/workspaces?limit=${limit}`, {
      cache: "no-store",
    });
    const json = (await res.json().catch(() => null)) as {
      code?: number;
      data?: { workspaces?: ApiWorkspaceRow[]; total?: number };
    } | null;
    if (!res.ok || json?.code !== 0) {
      const fallback = loadRecentMedia().slice(0, limit);
      return { items: fallback, total: fallback.length };
    }
    const fromApi = (json?.data?.workspaces || [])
      .map(mapWorkspaceRow)
      .filter((row): row is RecentMediaItem => Boolean(row));
    const merged = mergeRecentMedia(fromApi, local).slice(0, limit);
    syncLocalRecentCache(merged);
    const total =
      typeof json?.data?.total === "number" && json.data.total >= 0
        ? json.data.total
        : fromApi.length;
    return { items: merged, total };
  } catch {
    const fallback = loadRecentMedia().slice(0, limit);
    return { items: fallback, total: fallback.length };
  }
}

export async function fetchUserRecentMedia(
  limit = 48,
): Promise<RecentMediaItem[]> {
  const { items } = await fetchUserRecentMediaWithMeta(limit);
  return items;
}

/** Soft-delete on server + clear local caches. */
export async function deleteUserWorkspace(workspaceId: string) {
  if (!workspaceId) return;
  removeRecentMedia(workspaceId);
  try {
    await fetch(`/api/workspaces?id=${encodeURIComponent(workspaceId)}`, {
      method: "DELETE",
    });
  } catch {
    /* best-effort */
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
