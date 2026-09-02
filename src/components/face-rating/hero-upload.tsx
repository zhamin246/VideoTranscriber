"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import {
  AudioLines,
  FileText,
  Info,
  Link2,
  Mic,
  Upload,
  Video,
} from "lucide-react";
import {
  ACCEPT_UPLOAD,
  isAcceptedUpload,
  stashPendingFile,
} from "@/lib/convert/pending-upload";
import { CONVERT_HREF } from "./data";

function BrandIcon({ name }: { name: string }) {
  const cls = "h-2.5 w-2.5";
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

export default function HeroUpload() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"upload" | "link" | "record">("upload");
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkOk, setLinkOk] = useState("");
  const [recording, setRecording] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const go = useCallback(
    (file: File) => {
      if (!isAcceptedUpload(file)) {
        setError("Use JPEG, PNG, WebP, HEIC, AVIF, or PDF under 10 MB.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("File is over 10 MB.");
        return;
      }
      setError("");
      stashPendingFile(file);
      router.push(CONVERT_HREF);
    },
    [router],
  );

  const submitUrl = async () => {
    const next = url.trim();
    if (!/^https:\/\//i.test(next)) {
      setError("Paste a full https URL.");
      return;
    }
    setError("");
    setLinkOk("");
    setLinkBusy(true);
    try {
      const res = await fetch("/api/media/from-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: next }),
      });
      const type = res.headers.get("content-type") || "";
      if (type.includes("application/json")) {
        const json = (await res.json()) as { message?: string };
        setError(json.message || "Could not fetch audio from that link.");
        return;
      }
      if (!res.ok) {
        setError("Could not fetch audio from that link.");
        return;
      }
      const blob = await res.blob();
      const filename = res.headers.get("X-Media-Filename") || "audio.mp3";
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(href);
      setLinkOk(`Audio ready: ${filename}`);
    } catch {
      setError("Could not fetch audio from that link.");
    } finally {
      setLinkBusy(false);
    }
  };

  const toggleRecord = async () => {
    if (recording) {
      mediaRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      mediaRef.current = null;
      streamRef.current = null;
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      rec.start();
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
          if (f) go(f);
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
                  setTab(id);
                  setError("");
                  setDrag(false);
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
              if (f) go(f);
            }}
            className="flex w-full flex-1 flex-col items-center justify-center text-center"
            style={wellStyle}
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
            {error ? (
              <p className="mt-4 text-sm" style={{ color: "#FECACA" }}>
                {error}
              </p>
            ) : null}
          </button>
        ) : tab === "link" ? (
          <div className="flex w-full flex-1 flex-col items-center justify-center text-center" style={wellStyle}>
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
                {linkBusy ? "Fetching…" : "Search"}
              </button>
            </div>
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
            <span
              className="inline-flex h-16 w-16 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: "#8882F5" }}
            >
              <Mic className="h-8 w-8" />
            </span>
            <p className="mt-6 text-base md:text-lg" style={{ color: "rgba(255,255,255,0.82)" }}>
              Click &apos;Start recording&apos; to capture your voice instantly.
            </p>
            <p className="mt-2 text-base md:text-lg" style={{ color: "rgba(255,255,255,0.82)" }}>
              Record your audio directly and convert audio to text for free.
            </p>
            <button
              type="button"
              onClick={toggleRecord}
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl px-10 text-base font-semibold text-white"
              style={{ backgroundColor: recording ? "#EF4444" : "#8882F5" }}
            >
              <Mic className="h-5 w-5" />
              {recording ? "Stop recording" : "Start recording"}
            </button>
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
