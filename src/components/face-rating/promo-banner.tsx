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
        fontFamily: lex,
        backgroundImage:
          "linear-gradient(90deg, rgb(99, 91, 255) 0px, rgb(141, 122, 237) 50%, rgb(136, 130, 245) 100%)",
      }}
    >
      <div className="mx-auto flex min-h-11 max-w-[1760px] items-center gap-2 py-2 pl-3 pr-11 sm:min-h-[44px] sm:gap-3 sm:py-0 sm:pl-6 sm:pr-14 md:justify-center md:gap-3 md:px-14">
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center text-white sm:h-7 sm:w-7"
          style={{
            borderRadius: 6,
            backgroundImage: "linear-gradient(135deg, #FF8A4C 0%, #FF5CA8 100%)",
          }}
        >
          <InfinityIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.6} />
        </span>

        <p className="min-w-0 flex-1 truncate text-[12px] font-semibold leading-4 sm:text-[14px] sm:leading-[21px] md:flex-none md:overflow-visible md:whitespace-normal">
          <span className="text-[#FFD166] sm:hidden">Transcribe free · 200+ languages</span>
          <span className="hidden text-[#FFD166] sm:inline md:hidden">
            Transcribe audio &amp; video — 200+ languages
          </span>
          <span className="hidden md:inline">
            <span className="text-[#FFD166]">
              Transcribe audio and video — file, link, or record
            </span>
            <span className="mx-2 text-white">+</span>
            <span className="font-bold text-white">200+ languages</span>
          </span>
        </p>

        <span
          className="hidden shrink-0 items-center rounded-full px-2.5 text-[11px] font-semibold text-[#FFF7F0] sm:inline-flex sm:h-7 sm:text-xs"
          style={{
            backgroundImage: "linear-gradient(90deg, #FF8A4C 0%, #FF5CA8 100%)",
          }}
        >
          No card
        </span>

        <Link
          href={CONVERT_HREF}
          className="inline-flex h-7 shrink-0 items-center rounded-full bg-white px-2.5 text-[11px] font-semibold text-[#4F46CF] sm:h-[30px] sm:px-3 sm:text-xs"
        >
          <span className="sm:hidden">Start</span>
          <span className="hidden sm:inline">Start converting</span>
        </Link>
      </div>

      <button
        type="button"
        aria-label="Dismiss"
        className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-white/80 hover:bg-white/15 hover:text-white sm:right-3"
        onClick={() => {
          setHidden(true);
          try {
            sessionStorage.setItem(KEY, "1");
          } catch {
            /* ignore */
          }
        }}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
