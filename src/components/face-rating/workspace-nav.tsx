"use client";

import Link from "next/link";
import { usePathname } from "@/i18n/navigation";
import { useState } from "react";
import {
  AudioLines,
  Box,
  ChevronRight,
  Clock,
  FileType,
  FolderOpen,
  Image as ImageIcon,
  LayoutGrid,
  Pencil,
  PenLine,
  Star,
  type LucideIcon,
} from "lucide-react";

const NAV_ICON = "h-[18px] w-[18px] shrink-0";

function NavIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon className={NAV_ICON} strokeWidth={1.5} absoluteStrokeWidth />;
}
import { CONVERT_HREF } from "./data";

const TOOLS = [
  { href: CONVERT_HREF, label: "File upload", icon: AudioLines, activeMatch: "home" },
  { href: CONVERT_HREF, label: "Paste link", icon: Box },
  { href: CONVERT_HREF, label: "Record audio", icon: Pencil },
  { href: "/#usecases", label: "Meetings", icon: PenLine, badge: "New" },
  { href: "/#usecases", label: "Podcasts", icon: LayoutGrid },
  { href: "/#usecases", label: "YouTube", icon: ImageIcon },
];

const CAD_GROUP = [
  { href: CONVERT_HREF, label: "Start transcribing" },
  { href: "/#usecases", label: "Use cases" },
  { href: "/#how-it-works", label: "How it works" },
];

const GUIDE_GROUP = [
  { href: "/#faq", label: "FAQ" },
  { href: "/pricing", label: "Pricing" },
  { href: "/privacy-policy", label: "Privacy" },
];

function BrandMark() {
  return (
    <span className="flex h-10 w-10 min-h-10 min-w-10 shrink-0 items-center justify-center bg-transparent">
      <img src="/favicon.svg" alt="" width={40} height={40} className="h-10 w-10 object-contain" />
    </span>
  );
}

export default function WorkspaceNav() {
  const pathname = usePathname() || "";
  const onHome = pathname === "/" || pathname === "";
  const onConvert = false;
  const [cadOpen, setCadOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <aside
      className="group/nav sticky top-0 z-40 hidden h-svh w-14 shrink-0 flex-col self-start overflow-hidden border-r border-[#EAEAEA] bg-[#F9F9FC] transition-[width] duration-300 ease-in-out hover:w-[260px] hover:shadow-[8px_0_24px_-16px_rgba(91,84,200,0.35)] md:flex"
    >
      <div className="mb-0 flex h-14 shrink-0 items-center justify-center overflow-hidden px-[6px] group-hover/nav:justify-start">
        <Link
          href="/"
          className="flex h-full min-h-0 w-full items-center justify-center rounded-xl group-hover/nav:justify-start"
          aria-label="video transcriber — home"
        >
          <span className="flex max-w-full items-center overflow-hidden group-hover/nav:ml-[5px]">
            <BrandMark />
            <span
              className="ml-2 hidden whitespace-nowrap group-hover/nav:inline"
              style={{
                fontSize: 18,
                fontWeight: 700,
                lineHeight: "40px",
                letterSpacing: "-0.02em",
              }}
            >
              <span style={{ color: "#000000" }}>video </span>
              <span style={{ color: "#5270FF" }}>transcriber</span>
            </span>
          </span>
        </Link>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-2 pb-6">
        <ul className="space-y-0.5">
          {TOOLS.map((item, i) => {
            const Icon = item.icon;
            const active = i === 0 && (onHome || onConvert);
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  title={item.label}
                  className={`relative flex h-11 items-center gap-2 overflow-hidden rounded-xl px-2.5 text-[14px] font-medium transition-colors ${
                    active
                      ? "bg-[#8882F5] text-white shadow-[0_17px_20px_-8px_rgba(136,130,245,0.35)]"
                      : "text-[#7F7F7F] hover:bg-white hover:text-[#635BFF]"
                  }`}
                >
                  <NavIcon icon={Icon} />
                  <span className="min-w-0 flex-1 truncate opacity-0 transition-opacity duration-200 group-hover/nav:opacity-100">
                    {item.label}
                  </span>
                  {item.badge ? (
                    <span className="absolute right-1.5 top-1 hidden rounded-full bg-gradient-to-r from-violet-500 to-pink-500 px-1.5 py-px text-[9px] font-bold text-white group-hover/nav:inline">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="my-3 h-px bg-[#EAEAEA]" />

        <div>
          <button
            type="button"
            onClick={() => setCadOpen((v) => !v)}
            className="flex h-11 w-full items-center gap-2 overflow-hidden rounded-xl px-2.5 text-[14px] font-medium text-[#7F7F7F] hover:bg-white hover:text-[#635BFF]"
          >
            <NavIcon icon={FolderOpen} />
            <span className="min-w-0 flex-1 truncate text-left opacity-0 group-hover/nav:opacity-100">
              Transcript tools
            </span>
            <ChevronRight
              className={`h-4 w-4 shrink-0 opacity-0 group-hover/nav:opacity-100 ${cadOpen ? "rotate-90" : ""}`}
            />
          </button>
          {cadOpen ? (
            <ul className="mb-1 ml-8 hidden space-y-0.5 group-hover/nav:block">
              {CAD_GROUP.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="block truncate rounded-lg px-2 py-1.5 text-[13px] text-[#7F7F7F] hover:bg-white hover:text-[#635BFF]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div>
          <button
            type="button"
            onClick={() => setGuideOpen((v) => !v)}
            className="flex h-11 w-full items-center gap-2 overflow-hidden rounded-xl px-2.5 text-[14px] font-medium text-[#7F7F7F] hover:bg-white hover:text-[#635BFF]"
          >
            <NavIcon icon={FileType} />
            <span className="min-w-0 flex-1 truncate text-left opacity-0 group-hover/nav:opacity-100">
              Guides
            </span>
            <ChevronRight
              className={`h-4 w-4 shrink-0 opacity-0 group-hover/nav:opacity-100 ${guideOpen ? "rotate-90" : ""}`}
            />
          </button>
          {guideOpen ? (
            <ul className="mb-1 ml-8 hidden space-y-0.5 group-hover/nav:block">
              {GUIDE_GROUP.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="block truncate rounded-lg px-2 py-1.5 text-[13px] text-[#7F7F7F] hover:bg-white hover:text-[#635BFF]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="my-3 h-px bg-[#EAEAEA]" />

        <Link
          href="/dashboard"
          title="History"
          className="flex h-11 items-center gap-2 overflow-hidden rounded-xl px-2.5 text-[14px] font-medium text-[#7F7F7F] hover:bg-white hover:text-[#635BFF]"
        >
          <NavIcon icon={Clock} />
          <span className="truncate opacity-0 group-hover/nav:opacity-100">History</span>
        </Link>

        <div className="-mx-2 mt-auto flex justify-center px-[7px] pb-3 pt-3 group-hover/nav:px-2">
          <Link
            href="/pricing"
            aria-label="Unlock more"
            className="relative flex h-[42px] w-[42px] flex-none items-center justify-center overflow-hidden rounded-lg text-white shadow-[0_10px_24px_-18px_rgba(168,85,247,0.9)] transition-[filter] hover:brightness-[1.04] group-hover/nav:h-auto group-hover/nav:min-h-[112px] group-hover/nav:w-full group-hover/nav:flex-col group-hover/nav:items-stretch group-hover/nav:overflow-visible group-hover/nav:px-2.5 group-hover/nav:pb-2.5 group-hover/nav:pt-4"
            style={{ background: "linear-gradient(90deg, #A855F7 0%, #EC4899 100%)" }}
          >
            <span className="flex h-5 w-5 items-center justify-center group-hover/nav:hidden">
              <Star className="h-5 w-5 fill-white" />
            </span>
            <span className="hidden min-w-0 group-hover/nav:block">
              <span className="flex items-start gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/15">
                  <Star className="h-5 w-5 fill-white" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[12px] font-bold leading-tight">Unlock more</span>
                  <span className="block text-[11px] text-white/85">More credits, more conversions</span>
                </span>
              </span>
              <span className="mt-2 block rounded-lg bg-white py-1.5 text-center text-[12px] font-semibold text-[#7C3AED]">
                Upgrade
              </span>
            </span>
          </Link>
        </div>
      </nav>
    </aside>
  );
}
