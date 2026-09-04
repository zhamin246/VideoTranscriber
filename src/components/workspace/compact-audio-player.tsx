"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";

export type MediaSeekRequest = {
  seconds: number;
  /** Bump to re-seek the same timestamp. */
  nonce: number;
};

function formatClock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function pickDuration(el: HTMLMediaElement, hint?: number | null) {
  const d = el.duration;
  if (Number.isFinite(d) && d > 0) return d;
  if (typeof hint === "number" && Number.isFinite(hint) && hint > 0) return hint;
  return 0;
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;

/**
 * Compact horizontal audio bar (videotranscriber.ai style).
 * Uses hex colors — theme `gray-*` utilities resolve transparent in this app.
 * MediaRecorder webm often lacks duration metadata → use durationHint.
 */
export default function CompactAudioPlayer({
  src,
  durationHint,
  className,
  seekRequest,
}: {
  src: string;
  durationHint?: number | null;
  className?: string;
  seekRequest?: MediaSeekRequest | null;
}) {
  const mediaRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(() =>
    typeof durationHint === "number" &&
    Number.isFinite(durationHint) &&
    durationHint > 0
      ? durationHint
      : 0,
  );
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const el = mediaRef.current;
    if (!el) return;
    setLoadError("");
    setCurrent(0);
    setPlaying(false);
    if (
      typeof durationHint === "number" &&
      Number.isFinite(durationHint) &&
      durationHint > 0
    ) {
      setDuration(durationHint);
    }

    const syncDuration = () => {
      const next = pickDuration(el, durationHint);
      if (next > 0) setDuration(next);
    };
    const onTime = () => setCurrent(el.currentTime || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);
    const onError = () => {
      // Ignore until user tries to play — webm metadata can be flaky
    };

    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", syncDuration);
    el.addEventListener("durationchange", syncDuration);
    el.addEventListener("canplay", syncDuration);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    el.addEventListener("error", onError);

    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", syncDuration);
      el.removeEventListener("durationchange", syncDuration);
      el.removeEventListener("canplay", syncDuration);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("error", onError);
    };
  }, [src, durationHint]);

  useEffect(() => {
    const el = mediaRef.current;
    if (!el || !seekRequest) return;
    const total = pickDuration(el, duration) || duration;
    const next = Math.max(0, seekRequest.seconds);
    el.currentTime = total > 0 ? Math.min(next, total) : next;
    void el.play().then(() => setPlaying(true)).catch(() => {
      /* autoplay may be blocked; seek still applied */
    });
  }, [seekRequest, duration]);

  const toggle = async () => {
    const el = mediaRef.current;
    if (!el) return;
    if (!el.paused) {
      el.pause();
      return;
    }
    try {
      await el.play();
      setLoadError("");
    } catch {
      setLoadError("Could not play this audio. Re-transcribe to refresh the file.");
    }
  };

  const seek = (ratio: number) => {
    const el = mediaRef.current;
    const total = pickDuration(el || ({} as HTMLMediaElement), duration) || duration;
    if (!el || !(total > 0)) return;
    el.currentTime = Math.min(1, Math.max(0, ratio)) * total;
  };

  const cycleSpeed = () => {
    const el = mediaRef.current;
    const idx = SPEEDS.indexOf(speed as (typeof SPEEDS)[number]);
    const next = SPEEDS[(idx + 1) % SPEEDS.length] ?? 1;
    setSpeed(next);
    if (el) el.playbackRate = next;
  };

  const progress = duration > 0 ? Math.min(1, current / duration) : 0;

  return (
    <div className={className}>
      <div
        className="flex h-20 w-full items-center gap-4 rounded-3xl px-5"
        style={{ backgroundColor: "#F3F4F6" }}
      >
        {/* video element plays audio/webm more reliably than <audio> for recordings */}
        <video
          ref={mediaRef}
          src={src}
          preload="metadata"
          playsInline
          className="pointer-events-none absolute h-0 w-0 opacity-0"
          controls={false}
        />
        <button
          type="button"
          onClick={() => void toggle()}
          aria-label={playing ? "Pause" : "Play"}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: "#6B7280" }}
        >
          {playing ? (
            <Pause className="size-4" fill="currentColor" strokeWidth={0} />
          ) : (
            <Play
              className="size-4 translate-x-px"
              fill="currentColor"
              strokeWidth={0}
            />
          )}
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            className="shrink-0 text-sm tabular-nums"
            style={{ color: "#4B5563" }}
          >
            {formatClock(current)}
          </span>
          <button
            type="button"
            className="relative h-1.5 w-full grow cursor-pointer rounded-full"
            style={{ backgroundColor: "#E5E7EB" }}
            aria-label="Seek"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              seek((e.clientX - rect.left) / rect.width);
            }}
          >
            <span
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${progress * 100}%`,
                backgroundColor: "#6B7280",
              }}
            />
            <span
              className="absolute top-1/2 size-3 -translate-y-1/2 rounded-full bg-white"
              style={{
                left: `calc(${progress * 100}% - 6px)`,
                boxShadow: "0 0 0 2px #D1D5DB",
              }}
            />
          </button>
          <span
            className="shrink-0 text-sm tabular-nums"
            style={{ color: "#4B5563" }}
          >
            {formatClock(duration)}
          </span>
          <button
            type="button"
            aria-label={muted ? "Unmute" : "Mute"}
            className="shrink-0"
            style={{ color: "#4B5563" }}
            onClick={() => {
              const el = mediaRef.current;
              const next = !muted;
              setMuted(next);
              if (el) el.muted = next;
            }}
          >
            {muted ? (
              <VolumeX className="size-[18px]" />
            ) : (
              <Volume2 className="size-[18px]" />
            )}
          </button>
          <button
            type="button"
            onClick={cycleSpeed}
            className="shrink-0 text-sm tabular-nums"
            style={{ color: "#374151" }}
            aria-label="Playback speed"
          >
            {speed.toFixed(1)}x
          </button>
        </div>
      </div>
      {loadError ? (
        <p className="mt-1.5 text-xs text-red-600">{loadError}</p>
      ) : null}
    </div>
  );
}
