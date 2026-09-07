import type { MediaPreview } from "@/lib/media/preview-types";
import type { WorkspacePayload } from "@/lib/media/workspace-store";
import { saveWorkspace } from "@/lib/media/workspace-store";

import caseInterviews from "@/data/examples/example-case-interviews.json";
import hubermanStudy from "@/data/examples/example-huberman-study.json";
import tedJoyTiktok from "@/data/examples/example-ted-joy-tiktok.json";
import instagramAphantasia from "@/data/examples/example-instagram-aphantasia.json";

export type ExampleCard = MediaPreview & {
  workspaceId: string;
  icon: "youtube" | "tiktok" | "instagram" | "audio";
};

const EXAMPLE_PAYLOADS: Record<string, WorkspacePayload> = {
  "example-case-interviews": caseInterviews as WorkspacePayload,
  "example-huberman-study": hubermanStudy as WorkspacePayload,
  "example-ted-joy-tiktok": tedJoyTiktok as WorkspacePayload,
  "example-instagram-aphantasia":
    instagramAphantasia as WorkspacePayload,
};

/**
 * Fixed Examples strip — mirrored from videotranscriber.ai home cards.
 * Click → /workspace/{workspaceId} with prebuilt transcript payload.
 */
export const EXAMPLE_CARDS: ExampleCard[] = [
  {
    workspaceId: "example-case-interviews",
    url: EXAMPLE_PAYLOADS["example-case-interviews"]!.url,
    title: EXAMPLE_PAYLOADS["example-case-interviews"]!.title,
    thumbnailUrl: EXAMPLE_PAYLOADS["example-case-interviews"]!.thumbnailUrl,
    durationSeconds:
      EXAMPLE_PAYLOADS["example-case-interviews"]!.durationSeconds,
    platform: EXAMPLE_PAYLOADS["example-case-interviews"]!.platform,
    icon: "audio",
  },
  {
    workspaceId: "example-huberman-study",
    url: EXAMPLE_PAYLOADS["example-huberman-study"]!.url,
    title: EXAMPLE_PAYLOADS["example-huberman-study"]!.title,
    thumbnailUrl: EXAMPLE_PAYLOADS["example-huberman-study"]!.thumbnailUrl,
    durationSeconds:
      EXAMPLE_PAYLOADS["example-huberman-study"]!.durationSeconds,
    platform: EXAMPLE_PAYLOADS["example-huberman-study"]!.platform,
    icon: "youtube",
  },
  {
    workspaceId: "example-ted-joy-tiktok",
    url: EXAMPLE_PAYLOADS["example-ted-joy-tiktok"]!.url,
    title: EXAMPLE_PAYLOADS["example-ted-joy-tiktok"]!.title,
    thumbnailUrl: EXAMPLE_PAYLOADS["example-ted-joy-tiktok"]!.thumbnailUrl,
    durationSeconds:
      EXAMPLE_PAYLOADS["example-ted-joy-tiktok"]!.durationSeconds,
    platform: EXAMPLE_PAYLOADS["example-ted-joy-tiktok"]!.platform,
    icon: "tiktok",
  },
  {
    workspaceId: "example-instagram-aphantasia",
    url: EXAMPLE_PAYLOADS["example-instagram-aphantasia"]!.url,
    title: EXAMPLE_PAYLOADS["example-instagram-aphantasia"]!.title,
    thumbnailUrl:
      EXAMPLE_PAYLOADS["example-instagram-aphantasia"]!.thumbnailUrl,
    durationSeconds:
      EXAMPLE_PAYLOADS["example-instagram-aphantasia"]!.durationSeconds,
    platform: EXAMPLE_PAYLOADS["example-instagram-aphantasia"]!.platform,
    icon: "instagram",
  },
];

export function isExampleWorkspaceId(id: string) {
  return Boolean(EXAMPLE_PAYLOADS[id]);
}

/** Sync lookup — bundled example workspace payloads. */
export function getExampleWorkspace(id: string): WorkspacePayload | null {
  const payload = EXAMPLE_PAYLOADS[id];
  if (!payload?.id || !Array.isArray(payload.transcript)) return null;
  return payload;
}

/** Prefill session cache so workspace page opens immediately. */
export function openExampleWorkspace(id: string): WorkspacePayload | null {
  const payload = getExampleWorkspace(id);
  if (!payload) return null;
  saveWorkspace(payload);
  return payload;
}

/** @deprecated use getExampleWorkspace — kept for callers expecting async */
export async function fetchExampleWorkspace(
  id: string,
): Promise<WorkspacePayload | null> {
  return getExampleWorkspace(id);
}
