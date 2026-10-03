export type TranscribeRequestMeta = {
  title: string;
  platform: string;
  thumbnailUrl: string;
  noteMode: string;
  youtubeId: string;
  /** Page / upload reference URL (not blob:). */
  pageUrl: string;
};

export function parseTranscribeMetaFromForm(form: FormData): TranscribeRequestMeta {
  return {
    title: String(form.get("title") || "").trim(),
    platform: String(form.get("platform") || "").trim(),
    thumbnailUrl: String(form.get("thumbnailUrl") || "").trim(),
    noteMode: String(form.get("noteMode") || "smart_summary").trim(),
    youtubeId: String(form.get("youtubeId") || "").trim(),
    pageUrl: String(form.get("pageUrl") || form.get("url") || "").trim(),
  };
}

export function parseTranscribeMetaFromJson(body: Record<string, unknown> | null): TranscribeRequestMeta {
  if (!body) {
    return {
      title: "",
      platform: "",
      thumbnailUrl: "",
      noteMode: "smart_summary",
      youtubeId: "",
      pageUrl: "",
    };
  }
  return {
    title: String(body.title || "").trim(),
    platform: String(body.platform || "").trim(),
    thumbnailUrl: String(body.thumbnailUrl || "").trim(),
    noteMode: String(body.noteMode || "smart_summary").trim(),
    youtubeId: String(body.youtubeId || "").trim(),
    pageUrl: String(
      body.pageUrl || body.sourceUrl || body.url || "",
    ).trim(),
  };
}

export function toWorkspaceMeta(
  meta: TranscribeRequestMeta,
  opts: {
    separateSpeaker: boolean;
    sourceLanguage: string;
    mediaKind?: string | null;
    playbackUrl?: string | null;
  },
) {
  return {
    url: meta.pageUrl,
    playbackUrl: opts.playbackUrl ?? null,
    thumbnailUrl: meta.thumbnailUrl,
    title: meta.title || "Untitled",
    platform: meta.platform || "Upload",
    youtubeId: meta.youtubeId || null,
    mediaKind: opts.mediaKind ?? null,
    sourceLanguage: opts.sourceLanguage,
    noteMode: meta.noteMode || "smart_summary",
    separateSpeaker: opts.separateSpeaker,
  };
}
