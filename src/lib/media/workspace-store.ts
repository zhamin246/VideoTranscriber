import type { TranscriptSegment } from "@/lib/media/workspace-mock";
import type { ChapterItem } from "@/lib/media/chapters";
import type { AiNotes } from "@/lib/media/notes";
import type { AskMessage } from "@/lib/media/ask";
import type { AiMindMap } from "@/lib/media/mindmap";

export type WorkspacePayload = {
  id: string;
  /** Original page / upload URL (Instagram link, blob:, etc.) */
  url: string;
  /** Direct playable media URL when available (resolved MP4 / audio). */
  playbackUrl?: string | null;
  title: string;
  thumbnailUrl: string;
  durationSeconds: number | null;
  platform: string;
  youtubeId: string | null;
  /** Local upload / recording / resolved social video */
  mediaKind?: "audio" | "video" | null;
  sourceLanguage: string;
  noteMode: string;
  separateSpeaker: boolean;
  createdAt: number;
  /** Real Whisper output when available */
  transcript?: TranscriptSegment[];
  transcriptText?: string;
  detectedLanguage?: string | null;
  /** AI chapter outline (Gemini) */
  chapters?: ChapterItem[];
  /** AI Notes panel (Gemini) */
  aiNotes?: AiNotes;
  /** Ask AI chat history */
  askMessages?: AskMessage[];
  /** MindMap panel (Gemini + markmap) */
  mindmap?: AiMindMap;
};
const KEY_PREFIX = "videotranscriber:workspace:";

export function createWorkspaceId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function saveWorkspace(payload: WorkspacePayload) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(`${KEY_PREFIX}${payload.id}`, JSON.stringify(payload));
  } catch {
    /* private mode / quota */
  }
}

export function loadWorkspace(id: string): WorkspacePayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${KEY_PREFIX}${id}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WorkspacePayload;
    if (!parsed?.id || !parsed?.url) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Persist to Postgres (+ optional R2 upload for local files). Best-effort. */
export async function persistWorkspace(
  payload: WorkspacePayload,
  file?: File | null,
): Promise<{ playbackUrl?: string | null } | null> {
  try {
    if (file && file.size > 0) {
      const form = new FormData();
      form.append("id", payload.id);
      form.append("url", payload.url);
      if (payload.playbackUrl) form.append("playbackUrl", payload.playbackUrl);
      form.append("thumbnailUrl", payload.thumbnailUrl || "");
      form.append("title", payload.title || "");
      form.append("platform", payload.platform || "");
      if (payload.youtubeId) form.append("youtubeId", payload.youtubeId);
      if (payload.mediaKind) form.append("mediaKind", payload.mediaKind);
      if (payload.durationSeconds != null) {
        form.append("durationSeconds", String(payload.durationSeconds));
      }
      form.append("sourceLanguage", payload.sourceLanguage || "auto");
      form.append("noteMode", payload.noteMode || "smart_summary");
      form.append("separateSpeaker", payload.separateSpeaker ? "true" : "false");
      if (payload.detectedLanguage) {
        form.append("detectedLanguage", payload.detectedLanguage);
      }
      form.append("transcriptText", payload.transcriptText || "");
      form.append("transcript", JSON.stringify(payload.transcript || []));
      form.append("file", file, file.name);
      const res = await fetch("/api/workspaces", { method: "POST", body: form });
      const json = (await res.json()) as {
        code?: number;
        data?: { playbackUrl?: string | null };
      };
      if (res.ok && json.code === 0) return json.data || {};
      return null;
    }

    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await res.json()) as {
      code?: number;
      data?: { playbackUrl?: string | null };
    };
    if (res.ok && json.code === 0) return json.data || {};
    return null;
  } catch {
    return null;
  }
}

export async function fetchWorkspace(
  id: string,
): Promise<WorkspacePayload | null> {
  try {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(id)}`);
    const json = (await res.json()) as {
      code?: number;
      data?: WorkspacePayload;
    };
    if (!res.ok || json.code !== 0 || !json.data?.id) return null;
    return json.data;
  } catch {
    return null;
  }
}

/** Persist Ask AI history to DB (best-effort). */
export async function persistAskMessages(
  workspaceId: string,
  askMessages: AskMessage[],
): Promise<boolean> {
  try {
    const res = await fetch(
      `/api/workspaces/${encodeURIComponent(workspaceId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ askMessages }),
      },
    );
    const json = (await res.json()) as { code?: number };
    return res.ok && json.code === 0;
  } catch {
    return false;
  }
}
