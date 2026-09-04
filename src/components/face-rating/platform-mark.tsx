"use client";

import { useId, type ReactNode } from "react";

function normalizePlatform(kind: string) {
  const k = kind.trim().toLowerCase();
  if (k === "youtube" || k.includes("youtu")) return "youtube";
  if (k === "tiktok") return "tiktok";
  if (k === "instagram") return "instagram";
  if (k === "facebook" || k === "fb") return "facebook";
  if (k === "x" || k === "twitter") return "x";
  if (
    k === "upload" ||
    k === "audio" ||
    k === "video" ||
    k === "file" ||
    k === "recording"
  ) {
    return "file";
  }
  return "link";
}

export function PlatformMark({ kind }: { kind: string }) {
  const platform = normalizePlatform(kind);
  const igGradId = useId().replace(/:/g, "");
  const wrap = (child: ReactNode, className = "") => (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md ${className}`}
    >
      {child}
    </span>
  );

  if (platform === "youtube") {
    return wrap(
      <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden>
        <path
          fill="#FF0000"
          d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.56A3.02 3.02 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3.02 3.02 0 0 0 2.12 2.14C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.56a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8z"
        />
        <path fill="#fff" d="M9.75 15.5v-7L15.5 12l-5.75 3.5z" />
      </svg>,
    );
  }

  if (platform === "tiktok") {
    return wrap(
      <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden>
        <rect width="24" height="24" rx="5" fill="#111111" />
        <path
          fill="#25F4EE"
          d="M16.2 8.1a4.3 4.3 0 0 1-2.45-1.55V14a3.65 3.65 0 1 1-3.65-3.65c.2 0 .4.02.58.05v1.9a1.8 1.8 0 1 0 1.27 1.72V4.5h1.8c.14 1.35.9 2.55 2.05 3.25.52.32 1.1.52 1.7.6v1.85c-.37-.05-.74-.14-1.1-.25-.4-.14-.78-.34-1.15-.55z"
        />
        <path
          fill="#FE2C55"
          d="M15.55 9.95c-.37-.21-.75-.41-1.15-.55-.36-.11-.73-.2-1.1-.25v5.55a3.65 3.65 0 1 1-3.65-3.65c.2 0 .4.02.58.05v1.9a1.8 1.8 0 1 0 1.27 1.72V7.05c.14 1.35.9 2.55 2.05 3.25.52.32 1.1.52 1.7.6v1.55c-.1 0-.2-.02-.3-.05-.14-.03-.27-.08-.4-.15z"
          opacity=".95"
        />
        <path
          fill="#fff"
          d="M13 8.55a4.3 4.3 0 0 1-1.3-.55V14a1.8 1.8 0 1 1-1.27-1.72v-1.9A3.65 3.65 0 1 0 14.1 14V8.7c-.37.05-.74.14-1.1.25z"
        />
      </svg>,
    );
  }

  if (platform === "instagram") {
    return wrap(
      <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden>
        <defs>
          <radialGradient id={igGradId} cx="30%" cy="107%" r="150%">
            <stop offset="0%" stopColor="#fdf497" />
            <stop offset="5%" stopColor="#fdf497" />
            <stop offset="45%" stopColor="#fd5949" />
            <stop offset="60%" stopColor="#d6249f" />
            <stop offset="90%" stopColor="#285AEB" />
          </radialGradient>
        </defs>
        <rect width="24" height="24" rx="6" fill={`url(#${igGradId})`} />
        <rect
          x="5.5"
          y="5.5"
          width="13"
          height="13"
          rx="4"
          fill="none"
          stroke="#fff"
          strokeWidth="1.8"
        />
        <circle cx="12" cy="12" r="3.2" fill="none" stroke="#fff" strokeWidth="1.8" />
        <circle cx="16.6" cy="7.4" r="1.1" fill="#fff" />
      </svg>,
    );
  }

  if (platform === "facebook") {
    return wrap(
      <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden>
        <rect width="24" height="24" rx="5" fill="#1877F2" />
        <path
          fill="#fff"
          d="M16.5 12.4h-2.1v7.1h-2.9v-7.1H9.6V10h1.9V8.6c0-1.6.8-2.6 2.7-2.6h1.7v2.4h-1.1c-.8 0-.9.3-.9.9V10h2.1l-.5 2.4z"
        />
      </svg>,
    );
  }

  if (platform === "x") {
    return wrap(
      <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden>
        <rect width="24" height="24" rx="5" fill="#111" />
        <path
          fill="#fff"
          d="M6.5 6.5h2.7l2.7 3.7 3.1-3.7H17l-4.1 4.9L17.5 17.5h-2.7l-3-4.1-3.4 4.1H6l4.4-5.3L6.5 6.5z"
        />
      </svg>,
    );
  }

  if (platform === "file") {
    return wrap(
      <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden>
        <path
          fill="#22C55E"
          d="M6 2.5h7.2L18.5 8v13.5A1.5 1.5 0 0 1 17 23H6a1.5 1.5 0 0 1-1.5-1.5V4A1.5 1.5 0 0 1 6 2.5z"
        />
        <path fill="#86EFAC" d="M13.2 2.5V8H18.5L13.2 2.5z" />
        <path
          fill="#fff"
          d="M8.2 14.2v2.2h1.4l1.8 1.5V12.7l-1.8 1.5H8.2zm4.1-1.1v4.4c.7-.4 1.2-1.1 1.2-2.2s-.5-1.8-1.2-2.2zm1.7-1.5v7.4c1.2-.7 2-1.9 2-3.7s-.8-3-2-3.7z"
        />
      </svg>,
    );
  }

  return wrap(
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-500" aria-hidden>
      <path
        fill="currentColor"
        d="M10.6 13.4a1 1 0 0 1 0-1.4l2.1-2.1a1 1 0 1 1 1.4 1.4l-2.1 2.1a1 1 0 0 1-1.4 0zm-1.5 1.5a3.5 3.5 0 0 1 0-5l.7-.7a1 1 0 1 1 1.4 1.4l-.7.7a1.5 1.5 0 0 0 0 2.1l.7.7a1 1 0 1 1-1.4 1.4l-.7-.7zm5.7-5.7a3.5 3.5 0 0 1 0 5l-.7.7a1 1 0 1 1-1.4-1.4l.7-.7a1.5 1.5 0 0 0 0-2.1l-.7-.7a1 1 0 1 1 1.4-1.4l.7.7z"
      />
    </svg>,
    "bg-slate-100",
  );
}
