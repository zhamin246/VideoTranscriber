"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Box,
  Building2,
  Camera,
  Clock,
  FileType,
  Grid2x2,
  HelpCircle,
  Image as ImageIcon,
  LayoutTemplate,
  PenLine,
  Pencil,
  ScanLine,
  Shirt,
  Sparkles,
  PenTool,
} from "lucide-react";
import { CONVERT_HREF } from "./data";

const TONES = ["purple", "blue", "green", "orange", "cyan", "pink"] as const;

const MORE_TOOLS: {
  label: string;
  href: string;
  icon: typeof Box;
  tone: (typeof TONES)[number];
}[] = [
  { label: "File upload", href: CONVERT_HREF, icon: PenTool, tone: "purple" },
  { label: "Paste link", href: CONVERT_HREF, icon: Box, tone: "blue" },
  { label: "Record audio", href: CONVERT_HREF, icon: PenLine, tone: "green" },
  { label: "YouTube to text", href: CONVERT_HREF, icon: FileType, tone: "orange" },
  { label: "Meetings", href: "/#usecases", icon: Pencil, tone: "cyan" },
  { label: "Interviews", href: "/#usecases", icon: Camera, tone: "pink" },
  { label: "Podcasts", href: "/#usecases", icon: Sparkles, tone: "purple" },
  { label: "Voice memos", href: "/#usecases", icon: Grid2x2, tone: "blue" },
  { label: "Lectures", href: "/#usecases", icon: Building2, tone: "orange" },
  { label: "Translation", href: CONVERT_HREF, icon: Box, tone: "green" },
  { label: "AI summary", href: CONVERT_HREF, icon: Shirt, tone: "pink" },
  { label: "Speaker labels", href: CONVERT_HREF, icon: ImageIcon, tone: "cyan" },
  { label: "63 languages", href: CONVERT_HREF, icon: LayoutTemplate, tone: "purple" },
  { label: "Export transcript", href: CONVERT_HREF, icon: ScanLine, tone: "blue" },
  { label: "How it works", href: "/#how-it-works", icon: Sparkles, tone: "green" },
  { label: "FAQ", href: "/#faq", icon: HelpCircle, tone: "orange" },
  { label: "History", href: "/dashboard", icon: Clock, tone: "cyan" },
  { label: "Pricing", href: "/pricing", icon: FileType, tone: "pink" },
];

function ToolRow({
  tools,
  reverse,
  pxPerSec,
}: {
  tools: typeof MORE_TOOLS;
  reverse?: boolean;
  pxPerSec: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState("95s");

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => {
      const travel = el.offsetWidth / 2;
      if (travel > 0) setDuration(`${Math.round(travel / pxPerSec)}s`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pxPerSec]);

  const loop = [...tools, ...tools];
  return (
    <div className="home-more-tools__row-shell">
      <div className="home-more-tools__scroller">
        <div
          ref={trackRef}
          className={`home-more-tools__track${reverse ? " home-more-tools__track--rev" : ""}`}
          style={{
            ["--more-tools-duration" as string]: duration,
            animationDuration: duration,
          }}
        >
          {loop.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <Link
                key={`${tool.label}-${i}`}
                href={tool.href}
                className={`home-more-tools__card home-more-tools__card--${tool.tone}`}
                aria-hidden={i >= tools.length || undefined}
                tabIndex={i >= tools.length ? -1 : undefined}
              >
                <span className="home-more-tools__icon-chip" aria-hidden>
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                </span>
                <span className="home-more-tools__label">{tool.label}</span>
                <ArrowRight className="home-more-tools__chevron" aria-hidden />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function MoreTools() {
  return (
    <section className="home-more-tools" aria-labelledby="home-more-tools-title">
      <div className="home-more-tools__inner">
        <h2 id="home-more-tools-title" className="home-more-tools__title">
          Explore more transcription tools
        </h2>
        <nav className="home-more-tools__rows" aria-label="Transcription tools">
          <ToolRow tools={MORE_TOOLS.slice(0, 9)} pxPerSec={28} />
          <ToolRow tools={MORE_TOOLS.slice(9)} reverse pxPerSec={24} />
        </nav>
      </div>
    </section>
  );
}
