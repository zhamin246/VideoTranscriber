"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Infinity as InfinityIcon, X } from "lucide-react";
import { CONVERT_HREF } from "./data";

const KEY = "imagetocad:promo-dismissed";

const lex = "var(--font-lexend), Lexend, ui-sans-serif, system-ui, sans-serif";

export default function PromoBanner() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    try {
      setHidden(sessionStorage.getItem(KEY) === "1");
    } catch {
      setHidden(false);
    }
  }, []);

  if (hidden) return null;

  return (
    <div
      className="relative z-[40] w-full overflow-hidden text-white"
      style={{
        height: 44,
        fontFamily: lex,
        backgroundImage:
          "linear-gradient(90deg, rgb(99, 91, 255) 0px, rgb(141, 122, 237) 50%, rgb(136, 130, 245) 100%)",
      }}
    >
      <div
        className="mx-auto flex h-full max-w-[1760px] items-center justify-center"
        style={{ gap: 12, padding: "0 56px" }}
      >
        <span
          className="flex shrink-0 items-center justify-center text-white"
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            backgroundImage: "linear-gradient(135deg, #FF8A4C 0%, #FF5CA8 100%)",
          }}
        >
          <InfinityIcon style={{ width: 16, height: 16 }} strokeWidth={2.6} />
        </span>
        <span
          className="hidden sm:inline"
          style={{ fontSize: 14, fontWeight: 600, lineHeight: "21px", color: "rgb(255, 209, 102)" }}
        >
          Transcribe audio and video — file, link, or record
        </span>
        <span style={{ fontSize: 14, fontWeight: 700, lineHeight: "21px", color: "#fff" }}>
          + 63 languages
        </span>
        <span
          className="inline-flex items-center"
          style={{
            height: 28,
            padding: "0 10px",
            borderRadius: 9999,
            fontSize: 12,
            fontWeight: 600,
            lineHeight: "12px",
            color: "rgb(255, 247, 240)",
            backgroundImage: "linear-gradient(90deg, #FF8A4C 0%, #FF5CA8 100%)",
          }}
        >
          No card
        </span>
        <Link
          href={CONVERT_HREF}
          className="inline-flex items-center"
          style={{
            height: 30,
            padding: "6px 12px",
            borderRadius: 9999,
            fontSize: 12,
            fontWeight: 600,
            lineHeight: "18px",
            color: "rgb(79, 70, 207)",
            backgroundColor: "#fff",
          }}
        >
          Start converting
        </Link>
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full text-white/80 hover:bg-white/15 hover:text-white"
        style={{ width: 32, height: 32 }}
        onClick={() => {
          setHidden(true);
          try {
            sessionStorage.setItem(KEY, "1");
          } catch {
            /* ignore */
          }
        }}
      >
        <X style={{ width: 16, height: 16 }} />
      </button>
    </div>
  );
}
