"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

type BeforeAfterProps = {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
  /** Optional first-paint hint; the box follows the loaded image. */
  aspect?: string;
};

export default function BeforeAfter({
  beforeSrc,
  afterSrc,
  beforeAlt,
  afterAlt,
  aspect,
}: BeforeAfterProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [pos, setPos] = useState(50);
  const [ratio, setRatio] = useState(aspect);

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setRatio(`${img.naturalWidth} / ${img.naturalHeight}`);
      }
    };
    img.src = beforeSrc;
  }, [beforeSrc]);

  const setFromClientX = useCallback((clientX: number) => {
    const el = boxRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    setPos(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)));
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      setFromClientX(e.clientX);
    };
    const onUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [setFromClientX]);

  return (
    <div
      ref={boxRef}
      role="slider"
      aria-label="Before and after comparison"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pos)}
      tabIndex={0}
      className="relative w-full cursor-ew-resize select-none touch-none overflow-hidden rounded-2xl bg-white"
      style={ratio ? { aspectRatio: ratio } : undefined}
      onPointerDown={(e) => {
        draggingRef.current = true;
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        setFromClientX(e.clientX);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          setPos((p) => Math.min(100, Math.max(0, p + (e.key === "ArrowRight" ? 3 : -3))));
        }
      }}
    >
      <Image
        src={beforeSrc}
        alt={beforeAlt}
        fill
        draggable={false}
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 60vw"
        onLoad={(e) => {
          const img = e.currentTarget;
          if (img.naturalWidth && img.naturalHeight) {
            setRatio(`${img.naturalWidth} / ${img.naturalHeight}`);
          }
        }}
      />
      <div className="absolute inset-0 bg-white" style={{ clipPath: `inset(-1px 0 -1px ${pos}%)` }}>
        <Image
          src={afterSrc}
          alt={afterAlt}
          fill
          draggable={false}
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 60vw"
        />
      </div>
      <div
        className="absolute top-0 bottom-0 z-20 w-12 -translate-x-1/2"
        style={{ left: `${pos}%` }}
      >
        <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white" aria-hidden />
        <span
          className="absolute left-1/2 top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0_10px_15px_-3px_rgba(0,0,0,0.12),0_4px_6px_-4px_rgba(0,0,0,0.1)]"
          aria-hidden
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M7 4 3 10l4 6M13 4l4 6-4 6"
              stroke="#525252"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </div>
  );
}
