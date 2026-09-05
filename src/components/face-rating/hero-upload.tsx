"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AudioLines,
  CheckCircle2,
  Captions,
  FileText,
  Info,
  Link2,
  Loader2,
  Mic,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import {
  ACCEPT_UPLOAD,
  formatMaxUploadLabel,
  isAcceptedUpload,
  MAX_UPLOAD_BYTES,
  stashPendingFile,
} from "@/lib/convert/pending-upload";
import { formatDuration, formatFileSize, type MediaPreview } from "@/lib/media/preview-types";
import { NOTE_MODE_PRESETS } from "@/lib/media/notes";
import { OPEN_MEDIA_EVENT, saveRecentMedia, startTranscribeJob, updateTranscribeJob, finishTranscribeJob, simulatedTranscribePercent } from "@/lib/media/recent-media";
import {
  createWorkspaceId,
  persistWorkspace,
  saveWorkspace,
  type WorkspacePayload,
} from "@/lib/media/workspace-store";
import { extractYoutubeId } from "@/lib/media/youtube-id";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppContext } from "@/contexts/app";
import { isAuthEnabled } from "@/lib/auth";

type LocalFilePreview = {
  file: File;
  objectUrl: string;
  kind: "audio" | "video";
  durationSeconds: number | null;
  thumbnailUrl: string;
};

function mediaKindOf(file: File): "audio" | "video" {
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("video/")) return "video";
  // .webm / .ogg are used for both; prefer audio when MIME is missing
  if (/\.ogv$/i.test(file.name)) return "video";
  if (/\.(webm|ogg|oga)$/i.test(file.name)) return "audio";
  if (/\.(mp4|mov|mkv|avi|wmv|flv|m4v|mpeg|mpg|3gp|ts)$/i.test(file.name)) {
    return "video";
  }
  return "audio";
}

function probeLocalMedia(
  file: File,
  objectUrl: string,
): Promise<Pick<LocalFilePreview, "kind" | "durationSeconds" | "thumbnailUrl">> {
  const kind = mediaKindOf(file);
  return new Promise((resolve) => {
    const el = document.createElement(kind);
    el.preload = "metadata";
    el.muted = true;
    el.src = objectUrl;
    let settled = false;
    const finish = (durationSeconds: number | null, thumbnailUrl = "") => {
      if (settled) return;
      settled = true;
      el.removeAttribute("src");
      el.load();
      resolve({ kind, durationSeconds, thumbnailUrl });
    };
    el.onloadedmetadata = () => {
      const dur = Number.isFinite(el.duration) ? el.duration : null;
      if (kind === "video" && el instanceof HTMLVideoElement && el.videoWidth > 0) {
        const onSeeked = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = el.videoWidth;
            canvas.height = el.videoHeight;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(el, 0, 0);
              finish(dur, canvas.toDataURL("image/jpeg", 0.72));
              return;
            }
          } catch {
            /* ignore */
          }
          finish(dur);
        };
        el.addEventListener("seeked", onSeeked, { once: true });
        try {
          el.currentTime = Math.min(1, Math.max(0.1, (dur || 2) * 0.05));
        } catch {
          finish(dur);
        }
        window.setTimeout(() => finish(dur), 2000);
        return;
      }
      finish(dur);
    };
    el.onerror = () => finish(null);
    window.setTimeout(() => finish(null), 4000);
  });
}

function BrandIcon({ name, className }: { name: string; className?: string }) {
  const cls = className || "h-2.5 w-2.5";
  if (name === "YouTube") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-hidden>
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  }
  if (name === "TikTok") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-hidden>
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    );
  }
  if (name === "Instagram") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-hidden>
        <path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077" />
      </svg>
    );
  }
  if (name === "Facebook") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-hidden>
        <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
      </svg>
    );
  }
  if (name === "X") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-hidden>
        <path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z" />
      </svg>
    );
  }
  if (name === "Apple Podcasts") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-hidden>
        <path d="M5.34 0A5.328 5.328 0 000 5.34v13.32A5.328 5.328 0 005.34 24h13.32A5.328 5.328 0 0024 18.66V5.34A5.328 5.328 0 0018.66 0zm6.525 2.568c2.336 0 4.448.902 6.056 2.587 1.224 1.272 1.912 2.619 2.264 4.392.12.59.12 2.2.007 2.864a8.506 8.506 0 01-3.24 5.296c-.608.46-2.096 1.261-2.336 1.261-.088 0-.096-.091-.056-.46.072-.592.144-.715.48-.856.536-.224 1.448-.874 2.008-1.435a7.644 7.644 0 002.008-3.536c.208-.824.184-2.656-.048-3.504-.728-2.696-2.928-4.792-5.624-5.352-.784-.16-2.208-.16-3 0-2.728.56-4.984 2.76-5.672 5.528-.184.752-.184 2.584 0 3.336.456 1.832 1.64 3.512 3.192 4.512.304.2.672.408.824.472.336.144.408.264.472.856.04.36.03.464-.056.464-.056 0-.464-.176-.896-.384l-.04-.03c-2.472-1.216-4.056-3.274-4.632-6.012-.144-.706-.168-2.392-.03-3.04.36-1.74 1.048-3.1 2.192-4.304 1.648-1.737 3.768-2.656 6.128-2.656z" />
      </svg>
    );
  }
  return <Link2 className={cls} />;
}

const PLATFORMS = ["YouTube", "TikTok", "Instagram", "Facebook", "X", "Apple Podcasts", "Many other links"];

const SOURCE_LANGUAGES = [
  { value: "auto", label: "Auto Detect" },
  { value: "en", label: "English" },
  { value: "zh", label: "中文" },
  { value: "hi", label: "हिन्दी" },
  { value: "es", label: "Español" },
  { value: "ar", label: "العربية" },
  { value: "bn", label: "বাংলা" },
  { value: "pt", label: "Português" },
  { value: "ru", label: "Русский" },
  { value: "ur", label: "اردو" },
  { value: "id", label: "Bahasa Indonesia" },
  { value: "fr", label: "Français" },
  { value: "pa", label: "ਪੰਜਾਬੀ" },
  { value: "de", label: "Deutsch" },
  { value: "ja", label: "日本語" },
  { value: "sw", label: "Kiswahili" },
  { value: "mr", label: "मराठी" },
  { value: "te", label: "తెలుగు" },
  { value: "tr", label: "Türkçe" },
  { value: "ta", label: "தமிழ்" },
  { value: "vi", label: "Tiếng Việt" },
  { value: "ko", label: "한국어" },
  { value: "fa", label: "فارسی" },
  { value: "it", label: "Italiano" },
  { value: "th", label: "ไทย" },
  { value: "gu", label: "ગુજરાતી" },
  { value: "pl", label: "Polski" },
  { value: "uk", label: "Українська" },
  { value: "ml", label: "മലയാളം" },
  { value: "ro", label: "Română" },
  { value: "nl", label: "Nederlands" },
  { value: "ha", label: "Hausa" },
  { value: "yo", label: "Yorùbá" },
  { value: "am", label: "አማርኛ" },
  { value: "az", label: "Azərbaycan" },
  { value: "my", label: "မြန်မာ" },
  { value: "ne", label: "नेपाली" },
  { value: "kk", label: "Қазақ" },
  { value: "sr", label: "Српски" },
  { value: "hu", label: "Magyar" },
  { value: "el", label: "Ελληνικά" },
  { value: "cs", label: "Čeština" },
  { value: "sv", label: "Svenska" },
  { value: "sk", label: "Slovenčina" },
  { value: "fi", label: "Suomi" },
  { value: "da", label: "Dansk" },
  { value: "he", label: "עברית" },
  { value: "lt", label: "Lietuvių" },
  { value: "sl", label: "Slovenščina" },
  { value: "lv", label: "Latviešu" },
  { value: "et", label: "Eesti" },
  { value: "is", label: "Íslenska" },
  { value: "mt", label: "Malti" },
  { value: "cy", label: "Cymraeg" },
  { value: "yue", label: "粵語" },
  { value: "bo", label: "བོད་སྐད་" },
  { value: "jw", label: "Basa Jawa" },
  { value: "su", label: "Basa Sunda" },
  { value: "ps", label: "پښتو" },
  { value: "sd", label: "سنڌي" },
  { value: "sn", label: "ChiShona" },
  { value: "so", label: "Soomaali" },
  { value: "si", label: "සිංහල" },
  { value: "tt", label: "Татарча" },
  { value: "mn", label: "Монгол" },
  { value: "ka", label: "ქართული" },
  { value: "tg", label: "Тоҷикӣ" },
  { value: "tk", label: "Türkmen" },
  { value: "br", label: "Brezhoneg" },
  { value: "ba", label: "Башҡорт" },
  { value: "be", label: "Беларуская" },
  { value: "as", label: "অসমীয়া" },
  { value: "fo", label: "Føroyskt" },
  { value: "gl", label: "Galego" },
  { value: "ht", label: "Kreyòl Ayisyen" },
  { value: "haw", label: "ʻŌlelo Hawaiʻi" },
  { value: "yi", label: "ייִדיש" },
] as const;

const NOTE_MODES = NOTE_MODE_PRESETS.map((m) => ({
  value: m.value,
  label: m.label,
}));


export default function HeroUpload() {
  const { user, setShowSignModal } = useAppContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"upload" | "link" | "record">("upload");
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");
  const [linkBusy, setLinkBusy] = useState(false);
  const [transcribeBusy, setTranscribeBusy] = useState(false);
  const [linkOk, setLinkOk] = useState("");
  const [preview, setPreview] = useState<MediaPreview | null>(null);
  const [filePreview, setFilePreview] = useState<LocalFilePreview | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState("auto");
  const [separateSpeaker, setSeparateSpeaker] = useState(false);
  const [noteMode, setNoteMode] = useState("smart_summary");
  const [recording, setRecording] = useState(false);
  const [recordElapsed, setRecordElapsed] = useState(0);
  const [convertingRecording, setConvertingRecording] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const filePreviewUrlRef = useRef<string | null>(null);
  const recordStartedAtRef = useRef<number>(0);
  const progressStopRef = useRef<(() => void) | null>(null);

  const requireSignIn = () => {
    if (!isAuthEnabled()) return false;
    if (user) return false;
    setShowSignModal(true);
    return true;
  };

  const revokeFilePreview = useCallback(() => {
    if (filePreviewUrlRef.current) {
      URL.revokeObjectURL(filePreviewUrlRef.current);
      filePreviewUrlRef.current = null;
    }
    setFilePreview(null);
  }, []);

  useEffect(() => {
    return () => {
      if (filePreviewUrlRef.current) {
        URL.revokeObjectURL(filePreviewUrlRef.current);
      }
      progressStopRef.current?.();
      progressStopRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<MediaPreview>).detail;
      if (!detail?.url) return;
      revokeFilePreview();
      setTab("link");
      setUrl(detail.url);
      setPreview(detail);
      setError("");
      setLinkOk("");
    };
    window.addEventListener(OPEN_MEDIA_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_MEDIA_EVENT, onOpen);
  }, [revokeFilePreview]);

  useEffect(() => {
    if (!recording) {
      setRecordElapsed(0);
      return;
    }
    const tick = () => {
      setRecordElapsed(Math.max(0, (Date.now() - recordStartedAtRef.current) / 1000));
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [recording]);

  const adoptLocalFile = useCallback(async (file: File) => {
    setError("");
    setLinkOk("");
    setPreview(null);
    if (filePreviewUrlRef.current) {
      URL.revokeObjectURL(filePreviewUrlRef.current);
    }
    const objectUrl = URL.createObjectURL(file);
    filePreviewUrlRef.current = objectUrl;
    stashPendingFile(file);
    const meta = await probeLocalMedia(file, objectUrl);
    setFilePreview({
      file,
      objectUrl,
      kind: meta.kind,
      durationSeconds: meta.durationSeconds,
      thumbnailUrl: meta.thumbnailUrl,
    });
  }, []);

  const go = useCallback(
    async (file: File) => {
      if (!isAcceptedUpload(file)) {
        setError(
          "Upload an audio or video file (MP3, WAV, M4A, MP4, MOV, WebM, and 20+ other formats).",
        );
        return;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        setError(`File is over ${formatMaxUploadLabel()}.`);
        return;
      }
      await adoptLocalFile(file);
    },
    [adoptLocalFile],
  );

  const clearPreview = () => {
    setPreview(null);
    setLinkOk("");
    setError("");
    revokeFilePreview();
    if (inputRef.current) inputRef.current.value = "";
  };

  const submitUrl = async () => {
    const next = url.trim();
    if (!/^https:\/\//i.test(next)) {
      setError("Paste a full https URL.");
      return;
    }
    setError("");
    setLinkOk("");
    setPreview(null);
    revokeFilePreview();
    setLinkBusy(true);
    try {
      const res = await fetch("/api/media/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: next }),
      });
      const json = (await res.json()) as {
        code?: number;
        message?: string;
        data?: MediaPreview;
      };
      if (!res.ok || json.code !== 0 || !json.data?.title) {
        setError(json.message || "Could not load that link preview.");
        return;
      }
      setPreview(json.data);
    } catch {
      setError("Could not load that link preview.");
    } finally {
      setLinkBusy(false);
    }
  };

  const finishTranscription = async (payload: {
    url: string;
    playbackUrl?: string | null;
    title: string;
    thumbnailUrl: string;
    durationSeconds: number | null;
    platform: string;
    youtubeId: string | null;
    mediaKind?: "audio" | "video" | null;
    transcript?: { startSeconds: number; text: string }[];
    transcriptText?: string;
    detectedLanguage?: string | null;
    /** When set, upload this file to R2 via /api/workspaces */
    file?: File | null;
    /** Prefer this id (e.g. already used for R2 resolve key) */
    workspaceId?: string;
  }) => {
    setError("");
    try {
      const id = payload.workspaceId || createWorkspaceId();
      const stored: WorkspacePayload = {
        id,
        url: payload.url,
        playbackUrl: payload.playbackUrl ?? null,
        title: payload.title,
        thumbnailUrl: payload.thumbnailUrl,
        durationSeconds: payload.durationSeconds,
        platform: payload.platform,
        youtubeId: payload.youtubeId,
        mediaKind: payload.mediaKind ?? null,
        sourceLanguage,
        noteMode,
        separateSpeaker,
        createdAt: Date.now(),
        transcript: payload.transcript,
        transcriptText: payload.transcriptText,
        detectedLanguage: payload.detectedLanguage ?? null,
      };
      saveWorkspace(stored);
      updateTranscribeJob(id, { percent: 100, status: "done" });
      saveRecentMedia({
        url: payload.url,
        title: payload.title,
        thumbnailUrl: payload.thumbnailUrl,
        durationSeconds: payload.durationSeconds,
        platform: payload.platform,
        workspaceId: id,
      });
      finishTranscribeJob(id);

      const persisted = await persistWorkspace(stored, payload.file);
      if (persisted?.playbackUrl && persisted.playbackUrl !== stored.playbackUrl) {
        saveWorkspace({ ...stored, playbackUrl: persisted.playbackUrl });
      }

      // Clear upload UI; keep blob URL alive for workspace in this session
      setPreview(null);
      setFilePreview(null);
      setUrl("");
      setLinkOk("");
      filePreviewUrlRef.current = null;
      if (inputRef.current) inputRef.current.value = "";
      setTranscribeBusy(false);
    } catch {
      if (payload.workspaceId) finishTranscribeJob(payload.workspaceId);
      setError("Could not save transcription.");
      setTranscribeBusy(false);
    }
  };

  const beginProgressJob = (input: {
    id: string;
    title: string;
    platform: string;
    thumbnailUrl?: string;
  }) => {
    progressStopRef.current?.();
    startTranscribeJob(input);
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      updateTranscribeJob(input.id, {
        percent: simulatedTranscribePercent(Date.now() - startedAt),
      });
    }, 400);
    const stop = () => {
      window.clearInterval(timer);
      if (progressStopRef.current === stop) progressStopRef.current = null;
    };
    progressStopRef.current = stop;
    return stop;
  };

  /** Competitor timing: keep faded Transcribe UI ~3s, then show My files card + reset composer. */
  const revealProgressCard = (
    input: {
      id: string;
      title: string;
      platform: string;
      thumbnailUrl?: string;
    },
    delayMs = 2800,
  ) => {
    let stopProgress: (() => void) | null = null;
    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      stopProgress = beginProgressJob(input);
      resetComposerAfterStart();
      // Ensure My files strip is in view
      window.setTimeout(() => {
        document
          .getElementById("my-files-strip")
          ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 50);
    };
    const timer = window.setTimeout(reveal, delayMs);
    return {
      revealNow: () => {
        window.clearTimeout(timer);
        reveal();
      },
      cancelReveal: () => {
        window.clearTimeout(timer);
      },
      stopProgress: () => stopProgress?.(),
      wasRevealed: () => revealed,
    };
  };

  const resetComposerAfterStart = () => {
    setPreview(null);
    setFilePreview(null);
    setUrl("");
    setLinkOk("");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const transcribeLink = async () => {
    if (!preview?.url) return;
    setError("");
    setLinkOk("");
    setTranscribeBusy(true);
    const workspaceId = createWorkspaceId();
    const title = preview.title;
    const platform = preview.platform;
    const thumbnailUrl = preview.thumbnailUrl;
    const durationSeconds = preview.durationSeconds;
    const sourceUrl = preview.url;
    const progress = revealProgressCard({
      id: workspaceId,
      title,
      platform,
      thumbnailUrl,
    });
    try {
      const res = await fetch("/api/media/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl,
          workspaceId,
          language: sourceLanguage,
          separateSpeaker,
        }),
      });
      const json = (await res.json()) as {
        code?: number;
        message?: string;
        data?: {
          text?: string;
          segments?: { startSeconds: number; text: string }[];
          language?: string | null;
          playbackUrl?: string | null;
          audioUrl?: string | null;
          mediaKind?: "audio" | "video" | null;
          workspaceId?: string;
        };
      };
      // Ensure card is visible before completing / failing
      progress.revealNow();
      progress.stopProgress();
      if (!res.ok || json.code !== 0 || !json.data) {
        finishTranscribeJob(workspaceId);
        setError(json.message || "Transcription failed");
        setTranscribeBusy(false);
        return;
      }

      await finishTranscription({
        url: sourceUrl,
        playbackUrl: json.data.playbackUrl ?? null,
        title,
        thumbnailUrl,
        durationSeconds,
        platform,
        youtubeId: extractYoutubeId(sourceUrl),
        mediaKind: json.data.mediaKind ?? null,
        transcript: json.data.segments,
        transcriptText: json.data.text,
        detectedLanguage: json.data.language,
        workspaceId: json.data.workspaceId || workspaceId,
      });
    } catch {
      progress.revealNow();
      progress.stopProgress();
      finishTranscribeJob(workspaceId);
      setError("Could not transcribe that link.");
      setTranscribeBusy(false);
    }
  };

  const transcribeFile = async () => {
    if (!filePreview) return;
    setError("");
    setLinkOk("");
    setTranscribeBusy(true);
    const file = filePreview.file;
    const title = file.name;
    const durationSeconds = filePreview.durationSeconds;
    const thumbnailUrl = filePreview.thumbnailUrl;
    const mediaKind = filePreview.kind;
    const objectUrl = filePreview.objectUrl;
    stashPendingFile(file);
    const workspaceId = createWorkspaceId();
    const progress = revealProgressCard({
      id: workspaceId,
      title,
      platform: "Upload",
      thumbnailUrl,
    });
    try {
      const form = new FormData();
      form.append("file", file, file.name);
      form.append("workspaceId", workspaceId);
      form.append("language", sourceLanguage);
      form.append("separateSpeaker", separateSpeaker ? "true" : "false");

      const res = await fetch("/api/media/transcribe", {
        method: "POST",
        body: form,
      });
      const json = (await res.json()) as {
        code?: number;
        message?: string;
        data?: {
          text?: string;
          segments?: { startSeconds: number; text: string }[];
          language?: string | null;
          playbackUrl?: string | null;
          audioUrl?: string | null;
          mediaKind?: "audio" | "video" | null;
          workspaceId?: string;
        };
      };
      progress.revealNow();
      progress.stopProgress();
      if (!res.ok || json.code !== 0 || !json.data) {
        finishTranscribeJob(workspaceId);
        setError(json.message || "Transcription failed");
        setTranscribeBusy(false);
        return;
      }

      await finishTranscription({
        url: json.data.playbackUrl || objectUrl,
        playbackUrl: json.data.playbackUrl ?? null,
        title,
        thumbnailUrl,
        durationSeconds,
        platform: "Upload",
        youtubeId: null,
        mediaKind: json.data.mediaKind || mediaKind,
        transcript: json.data.segments,
        transcriptText: json.data.text,
        detectedLanguage: json.data.language,
        workspaceId: json.data.workspaceId || workspaceId,
        file: null,
      });
      if (filePreviewUrlRef.current === objectUrl) {
        filePreviewUrlRef.current = null;
      }
    } catch {
      progress.revealNow();
      progress.stopProgress();
      finishTranscribeJob(workspaceId);
      setError("Could not transcribe that file.");
      setTranscribeBusy(false);
    }
  };

  const convertBlobToMp3 = async (blob: Blob, rawName: string) => {
    const form = new FormData();
    form.append("file", blob, rawName);
    const res = await fetch("/api/media/to-mp3", { method: "POST", body: form });
    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as {
        message?: string;
      } | null;
      throw new Error(json?.message || "Could not convert recording to mp3");
    }
    const buf = await res.arrayBuffer();
    const outName =
      res.headers.get("X-Filename") ||
      rawName.replace(/\.[^.]+$/i, "") + ".mp3";
    return new File([buf], outName, { type: "audio/mpeg" });
  };

  const toggleRecord = async () => {
    if (recording) {
      const rec = mediaRef.current;
      if (!rec) {
        setRecording(false);
        return;
      }
      rec.onstop = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        mediaRef.current = null;
        setRecording(false);
        const elapsed = Math.max(0, (Date.now() - recordStartedAtRef.current) / 1000);
        const mime = rec.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mime });
        chunksRef.current = [];
        if (!blob.size) {
          setError("Recording was empty. Try again.");
          return;
        }
        const ext = mime.includes("mp4")
          ? "m4a"
          : mime.includes("ogg")
            ? "ogg"
            : "webm";
        const rawName = `recording-${Date.now()}.${ext}`;

        void (async () => {
          setConvertingRecording(true);
          setError("");
          try {
            // Browsers can only MediaRecorder → webm/ogg/mp4; convert to mp3 for Whisper.
            const file = await convertBlobToMp3(blob, rawName);
            await adoptLocalFile(file);
            setFilePreview((prev) =>
              prev && (prev.durationSeconds == null || prev.durationSeconds <= 0)
                ? { ...prev, durationSeconds: elapsed }
                : prev,
            );
          } catch (e) {
            setError(
              e instanceof Error
                ? e.message
                : "Could not convert recording to mp3.",
            );
          } finally {
            setConvertingRecording(false);
          }
        })();
      };
      try {
        rec.stop();
      } catch {
        setRecording(false);
        setError("Could not stop recording.");
      }
      return;
    }
    try {
      revokeFilePreview();
      if (inputRef.current) inputRef.current.value = "";
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeCandidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg",
      ];
      const mimeType = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m));
      const rec = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recordStartedAtRef.current = Date.now();
      rec.start(250);
      mediaRef.current = rec;
      setRecording(true);
      setError("");
    } catch {
      setError("Microphone access is needed to record.");
    }
  };

  const wellStyle = {
    minHeight: 280,
    borderRadius: 16,
    padding: "28px 32px",
    border: drag ? "1.6px dashed rgba(255,255,255,0.85)" : "1.6px dashed rgb(107, 103, 167)",
    backgroundColor: drag ? "rgba(136, 130, 245, 0.16)" : "rgba(136, 130, 245, 0.08)",
  } as const;

  const optionsAndTranscribe = (onTranscribe: () => void) => (
    <>
      <div
        className="mt-6 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-3"
        style={{ borderColor: "rgba(255,255,255,0.12)" }}
      >
        <label
          className="inline-flex items-center gap-2 text-sm"
          style={{ color: "rgba(255,255,255,0.82)" }}
        >
          <span className="whitespace-nowrap">Source Language:</span>
          <Select
            value={sourceLanguage}
            onValueChange={setSourceLanguage}
            disabled={transcribeBusy}
          >
            <SelectTrigger
              size="sm"
              className="h-9 min-w-[9rem] border-slate-300 bg-white text-slate-900 shadow-none dark:bg-white dark:text-slate-900"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60 border-slate-200 bg-white text-slate-900 shadow-lg dark:bg-white dark:text-slate-900">
              {SOURCE_LANGUAGES.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="text-slate-900 focus:bg-slate-100 focus:text-slate-900 data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-900"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label
          className="inline-flex items-center gap-2 text-sm"
          style={{ color: "rgba(255,255,255,0.82)" }}
        >
          <span>Separate Speaker</span>
          <button
            type="button"
            role="switch"
            aria-checked={separateSpeaker}
            disabled={transcribeBusy}
            onClick={() => setSeparateSpeaker((v) => !v)}
            className="relative h-5 w-9 rounded-full transition-colors disabled:opacity-50"
            style={{ backgroundColor: separateSpeaker ? "#8882F5" : "rgba(255,255,255,0.28)" }}
          >
            <span
              className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
              style={{ left: separateSpeaker ? "1.125rem" : "0.125rem" }}
            />
          </button>
        </label>

        <label
          className="inline-flex items-center gap-2 text-sm"
          style={{ color: "rgba(255,255,255,0.82)" }}
        >
          <span className="whitespace-nowrap">Note Mode:</span>
          <Select value={noteMode} onValueChange={setNoteMode} disabled={transcribeBusy}>
            <SelectTrigger
              size="sm"
              className="h-9 min-w-[10rem] border-slate-300 bg-white text-slate-900 shadow-none dark:bg-white dark:text-slate-900"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-80 border-slate-200 bg-white text-slate-900 shadow-lg dark:bg-white dark:text-slate-900">
              {NOTE_MODES.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="text-slate-900 focus:bg-slate-100 focus:text-slate-900 data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-900"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>

      <button
        type="button"
        onClick={() => {
          if (requireSignIn()) return;
          void Promise.resolve(onTranscribe());
        }}
        disabled={transcribeBusy}
        className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-75"
        style={{ backgroundColor: "#8882F5" }}
      >
        <Captions className="h-4 w-4" />
        Transcribe
      </button>
    </>
  );

  const filePreviewCard = filePreview ? (
    <div className="w-full text-left">
      <div className="flex items-start gap-3">
        {filePreview.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={filePreview.thumbnailUrl}
            alt=""
            className="h-16 w-28 shrink-0 rounded-md object-cover"
          />
        ) : (
          <div
            className="flex h-16 w-28 shrink-0 items-center justify-center rounded-md"
            style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
          >
            {filePreview.kind === "audio" ? (
              <AudioLines className="h-6 w-6" style={{ color: "rgba(255,255,255,0.55)" }} />
            ) : (
              <Video className="h-6 w-6" style={{ color: "rgba(255,255,255,0.55)" }} />
            )}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p
            className="line-clamp-2 text-sm font-semibold leading-snug md:text-base"
            style={{ color: "#93C5FD" }}
            title={filePreview.file.name}
          >
            {filePreview.file.name}
          </p>
          <p className="mt-1 text-xs md:text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
            {[
              formatDuration(filePreview.durationSeconds),
              formatFileSize(filePreview.file.size),
              filePreview.kind === "audio" ? "Audio" : "Video",
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
          <CheckCircle2 className="h-5 w-5" style={{ color: "#22C55E" }} aria-hidden />
          <button
            type="button"
            onClick={clearPreview}
            disabled={transcribeBusy}
            className="rounded-md p-1 disabled:opacity-50"
            style={{ color: "rgba(255,255,255,0.55)" }}
            aria-label="Clear file"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {optionsAndTranscribe(transcribeFile)}
    </div>
  ) : null;

  return (
    <div
      className="relative mx-auto w-full max-w-[1200px] overflow-hidden"
      style={{
        borderRadius: 32,
        padding: 6,
        background: "color-mix(in srgb, #8882F5 4%, #fff)",
        boxShadow: "0 3px 10px rgba(99,91,255,0.16), 0 1px 4px rgba(15,23,42,0.1)",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_UPLOAD}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void go(f);
        }}
      />
      <div
        className="flex min-h-[450px] flex-col"
        style={{
          borderRadius: 24,
          padding: "40px",
          border: "0.8px solid rgb(86, 82, 141)",
          backgroundImage:
            "linear-gradient(165deg, rgb(68, 65, 115) 0%, rgb(55, 53, 91) 52%, rgb(43, 41, 70) 100%)",
        }}
      >
        <div
          role="tablist"
          aria-label="Upload method"
          className="mx-auto mb-4 grid h-12 w-full max-w-[38rem] grid-cols-3 rounded-xl p-1"
          style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
        >
          {(
            [
              { id: "upload" as const, label: "File upload", Icon: FileText },
              { id: "link" as const, label: "Paste link", Icon: Link2 },
              { id: "record" as const, label: "Record audio", Icon: Mic },
            ] as const
          ).map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  if (recording && id !== "record") {
                    void toggleRecord();
                  }
                  setTab(id);
                  setError("");
                  setDrag(false);
                  if (id !== "link") {
                    setPreview(null);
                    setLinkOk("");
                  }
                  if (id !== "upload" && id !== "record") {
                    revokeFilePreview();
                    if (inputRef.current) inputRef.current.value = "";
                  }
                }}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-semibold transition-colors sm:gap-2 sm:px-4"
                style={
                  active
                    ? {
                        backgroundColor: "#fff",
                        color: "#8882F5",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      }
                    : { backgroundColor: "transparent", color: "rgba(255,255,255,0.72)" }
                }
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                {label}
              </button>
            );
          })}
        </div>

        {tab === "upload" ? (
          <div className="flex w-full flex-1 flex-col items-center justify-center text-center" style={wellStyle}>
            {!filePreview ? (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDrag(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) void go(f);
                }}
                className="flex w-full flex-1 flex-col items-center justify-center text-center"
              >
                <div className="mb-3 flex items-center justify-center gap-2" style={{ color: "#8882F5" }}>
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: "rgba(136,130,245,0.18)", transform: "rotate(-10deg)" }}
                  >
                    <Mic className="h-5 w-5" />
                  </span>
                  <span
                    className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white"
                    style={{ boxShadow: "0 1px 2px rgba(136,130,245,0.12)" }}
                  >
                    <AudioLines className="h-7 w-7" />
                  </span>
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: "rgba(136,130,245,0.18)", transform: "rotate(10deg)" }}
                  >
                    <Video className="h-5 w-5" />
                  </span>
                </div>
                <h2
                  className="text-base font-semibold md:text-lg"
                  style={{ color: "rgba(255,255,255,0.94)" }}
                >
                  Click or drag & drop to upload your file
                </h2>
                <span
                  className="mt-3 inline-flex h-11 items-center gap-2 rounded-lg px-8 text-base font-semibold text-white"
                  style={{ backgroundColor: "#8882F5", boxShadow: "0 4px 12px rgba(136,130,245,0.28)" }}
                >
                  <Upload className="h-4 w-4" />
                  Upload a file
                </span>
                <p
                  className="mt-4 inline-flex items-center gap-1.5 text-sm"
                  style={{ color: "rgba(255,255,255,0.62)" }}
                >
                  Supports 20+ audio and video formats
                  <Info className="h-3.5 w-3.5" />
                </p>
              </button>
            ) : (
              filePreviewCard
            )}
            {error ? (
              <p className="mt-4 text-sm" style={{ color: "#FECACA" }}>
                {error}
              </p>
            ) : null}
          </div>
        ) : tab === "link" ? (
          <div className="flex w-full flex-1 flex-col items-center justify-center text-center" style={wellStyle}>
            {!preview ? (
              <>
                <p className="my-4 text-sm md:text-base" style={{ color: "rgba(255,255,255,0.72)" }}>
                  Paste a media link to transcribe video or audio content.
                </p>
                <div className="mb-4 flex flex-col items-center gap-2">
                  <div
                    className="inline-flex items-center gap-1.5 text-xs md:text-sm"
                    style={{ color: "rgba(255,255,255,0.7)" }}
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    Supported platforms
                  </div>
                  <div className="flex max-w-2xl flex-wrap justify-center gap-2">
                    {PLATFORMS.map((name) => (
                      <span
                        key={name}
                        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
                        style={{
                          border: "1px solid rgba(136,130,245,0.35)",
                          backgroundColor: "rgba(255,255,255,0.92)",
                          color: "#334155",
                        }}
                      >
                        <span
                          className="inline-flex h-4 w-4 items-center justify-center rounded-full"
                          style={{ backgroundColor: "rgba(136,130,245,0.12)", color: "#8882F5" }}
                        >
                          <BrandIcon name={name} />
                        </span>
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mx-auto flex w-full max-w-3xl gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !linkBusy) void submitUrl();
                    }}
                    placeholder="Paste a media link"
                    disabled={linkBusy}
                    className="h-10 min-w-0 flex-1 rounded-md border px-3 text-sm outline-none"
                    style={{
                      backgroundColor: "#fff",
                      color: "#111827",
                      borderColor: "rgba(136,130,245,0.35)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => void submitUrl()}
                    disabled={!url.trim() || linkBusy}
                    className="h-10 shrink-0 whitespace-nowrap rounded-md px-4 text-sm font-medium text-white disabled:opacity-50"
                    style={{ backgroundColor: "#8882F5" }}
                  >
                    {linkBusy ? "Loading…" : "Search"}
                  </button>
                </div>
              </>
            ) : (
              <div className="w-full text-left">
                <div className="flex items-start gap-3">
                  {preview.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview.thumbnailUrl}
                      alt=""
                      className="h-16 w-28 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-16 w-28 shrink-0 items-center justify-center rounded-md"
                      style={{
                        backgroundColor:
                          preview.platform === "Facebook"
                            ? "#1877F2"
                            : preview.platform === "Instagram"
                              ? undefined
                              : preview.platform === "TikTok"
                                ? "#111111"
                                : preview.platform === "YouTube"
                                  ? "#FF0000"
                                  : "rgba(255,255,255,0.12)",
                        backgroundImage:
                          preview.platform === "Instagram"
                            ? "radial-gradient(circle at 30% 107%, #fdf497 0%, #fd5949 45%, #d6249f 60%, #285AEB 90%)"
                            : undefined,
                      }}
                    >
                      {preview.platform === "Facebook" ||
                      preview.platform === "Instagram" ||
                      preview.platform === "TikTok" ||
                      preview.platform === "YouTube" ||
                      preview.platform === "X" ? (
                        <BrandIcon name={preview.platform} className="h-7 w-7 text-white" />
                      ) : (
                        <Video className="h-6 w-6" style={{ color: "rgba(255,255,255,0.55)" }} />
                      )}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className="line-clamp-2 text-sm font-semibold leading-snug md:text-base"
                      style={{ color: "#93C5FD" }}
                      title={preview.title}
                    >
                      {preview.title}
                    </p>
                    <p className="mt-1 text-xs md:text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                      {[formatDuration(preview.durationSeconds), preview.platform]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
                    <CheckCircle2 className="h-5 w-5" style={{ color: "#22C55E" }} aria-hidden />
                    <button
                      type="button"
                      onClick={clearPreview}
                      disabled={transcribeBusy}
                      className="rounded-md p-1 disabled:opacity-50"
                      style={{ color: "rgba(255,255,255,0.55)" }}
                      aria-label="Clear preview"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {optionsAndTranscribe(() => void transcribeLink())}
              </div>
            )}

            {error ? (
              <p className="mt-4 text-sm" style={{ color: "#FECACA" }}>
                {error}
              </p>
            ) : null}
            {linkOk ? (
              <p className="mt-4 text-sm" style={{ color: "#BBF7D0" }}>
                {linkOk}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="flex w-full flex-1 flex-col items-center justify-center text-center" style={wellStyle}>
            {filePreview ? (
              filePreviewCard
            ) : convertingRecording ? (
              <>
                <span
                  className="inline-flex h-16 w-16 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: "#8882F5" }}
                >
                  <Loader2 className="h-8 w-8 animate-spin" />
                </span>
                <p
                  className="mt-6 text-base md:text-lg"
                  style={{ color: "rgba(255,255,255,0.82)" }}
                >
                  Converting to MP3…
                </p>
                <p
                  className="mt-2 text-base md:text-lg"
                  style={{ color: "rgba(255,255,255,0.82)" }}
                >
                  Preparing your recording for transcription
                </p>
              </>
            ) : (
              <>
                <span
                  className="inline-flex h-16 w-16 items-center justify-center rounded-full text-white"
                  style={{
                    backgroundColor: recording ? "#EF4444" : "#8882F5",
                    boxShadow: recording ? "0 0 0 8px rgba(239,68,68,0.18)" : undefined,
                  }}
                >
                  <Mic className="h-8 w-8" />
                </span>
                <p className="mt-6 text-base md:text-lg" style={{ color: "rgba(255,255,255,0.82)" }}>
                  {recording
                    ? `Recording… ${formatDuration(recordElapsed)}`
                    : "Click 'Start recording' to capture your voice instantly."}
                </p>
                {!recording ? (
                  <p className="mt-2 text-base md:text-lg" style={{ color: "rgba(255,255,255,0.82)" }}>
                    Record your audio directly and convert audio to text for free.
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => void toggleRecord()}
                  disabled={convertingRecording}
                  className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl px-10 text-base font-semibold text-white disabled:opacity-60"
                  style={{ backgroundColor: recording ? "#EF4444" : "#8882F5" }}
                >
                  <Mic className="h-5 w-5" />
                  {recording ? "Stop recording" : "Start recording"}
                </button>
              </>
            )}
            {error ? (
              <p className="mt-4 text-sm" style={{ color: "#FECACA" }}>
                {error}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
