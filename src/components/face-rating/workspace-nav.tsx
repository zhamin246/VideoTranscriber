"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "@/i18n/navigation";
import {
  AudioLines,
  Clock3,
  FileText,
  FolderOpen,
  Gift,
  type LucideIcon,
} from "lucide-react";
import { useAppContext } from "@/contexts/app";
import { CONVERT_HREF } from "./data";
import type { PlanSummary } from "@/lib/plan/summary";
import UpgradePricingModal, {
  type UpgradePricingReason,
} from "./upgrade-pricing-modal";

const NAV_ICON = "h-[18px] w-[18px] shrink-0";

function NavIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon className={NAV_ICON} strokeWidth={1.5} absoluteStrokeWidth />;
}

function BrandMark() {
  return (
    <span className="flex h-10 w-10 min-h-10 min-w-10 shrink-0 items-center justify-center bg-transparent">
      <img
        src="/favicon.svg"
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 object-contain"
      />
    </span>
  );
}

function badgeStyles(badge: PlanSummary["badge"]) {
  switch (badge) {
    case "BASIC":
      return "bg-[#DBEAFE] text-[#1D4ED8] hover:bg-[#BFDBFE]";
    case "STANDARD":
      return "bg-[#EDE9FE] text-[#6D28D9] hover:bg-[#DDD6FE]";
    case "PRO":
      return "bg-[#FEF3C7] text-[#B45309] hover:bg-[#FDE68A]";
    case "PACK":
      return "bg-[#FFEDD5] text-[#C2410C] hover:bg-[#FED7AA]";
    default:
      return "bg-[#DCFCE7] text-[#15803D] hover:bg-[#BBF7D0]";
  }
}

function UsageRow({
  icon: Icon,
  label,
  used,
  total,
  suffix = "",
  unlimited = false,
}: {
  icon: LucideIcon;
  label: string;
  used: number;
  total: number;
  suffix?: string;
  unlimited?: boolean;
}) {
  const pct = unlimited
    ? 0
    : total > 0
      ? Math.min(100, Math.round((used / total) * 100))
      : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 shrink-0 text-[#94A3B8]" strokeWidth={1.75} />
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#94A3B8]">
          {label}
        </span>
        <span className="ml-auto text-[12px] tabular-nums">
          {unlimited ? (
            <span className="font-semibold text-[#334155]">Unlimited</span>
          ) : (
            <>
              <span className="font-bold text-[#0F172A]">{used}</span>
              <span className="text-[#94A3B8]">
                /{total}
                {suffix ? ` ${suffix}` : ""}
              </span>
            </>
          )}
        </span>
      </div>
      <div className="h-[3px] w-full overflow-hidden rounded-full bg-[#E8EAF0]">
        <div
          className="h-full rounded-full bg-[#8882F5] transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function guestPlan(): PlanSummary {
  return {
    tier: "FREE",
    badge: "FREE",
    productId: "free",
    productName: "Free",
    interval: "month",
    isPackOnly: false,
    isRecharged: false,
    dailyFiles: { used: 0, limit: 1 },
    minutes: { used: 0, total: 90, left: 90 },
  };
}

function CurrentPlanCard({
  onUpgrade,
}: {
  onUpgrade: (reason?: UpgradePricingReason) => void;
}) {
  const { user } = useAppContext();
  const plan = user?.plan || guestPlan();
  const dailyUnlimited = plan.dailyFiles.limit == null;
  const badgeLabel =
    plan.badge === "PACK"
      ? plan.productName?.replace(/\s*·.*$/, "") || "PACK"
      : plan.badge;
  const upgradeReason: UpgradePricingReason =
    plan.badge === "PACK" ? "minutes" : "generic";

  return (
    <div className="hidden w-full flex-col rounded-2xl border border-[#EEF0F5] bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] group-hover/nav:flex">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">
          Current Plan
        </span>
        <button
          type="button"
          onClick={() => onUpgrade(upgradeReason)}
          className={`inline-flex max-w-[7.5rem] items-center gap-0.5 truncate rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.04em] transition-colors ${badgeStyles(plan.badge)}`}
          title={plan.productName || plan.badge}
        >
          <span className="truncate">{badgeLabel}</span>
          <span aria-hidden className="shrink-0 text-[10px]">
            ›
          </span>
        </button>
      </div>

      <div className="space-y-3">
        <UsageRow
          icon={FileText}
          label="Daily"
          used={plan.dailyFiles.used}
          total={plan.dailyFiles.limit || 1}
          unlimited={dailyUnlimited}
        />
        <UsageRow
          icon={Clock3}
          label="Minutes"
          used={plan.minutes.used}
          total={Math.max(plan.minutes.total, 1)}
          suffix="min"
        />
      </div>

      {plan.productName && plan.badge !== "FREE" ? (
        <p className="mt-2 truncate text-[11px] text-[#94A3B8]" title={plan.productName}>
          {plan.productName}
          {plan.interval === "year"
            ? " · yearly"
            : plan.interval === "month"
              ? " · monthly"
              : plan.interval === "one-time"
                ? " · one-time"
                : ""}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => onUpgrade(upgradeReason)}
        className="mt-3.5 flex h-10 w-full items-center justify-center rounded-xl bg-[#635BFF] text-[13px] font-semibold text-white transition-colors hover:bg-[#5249E8]"
      >
        {plan.badge === "FREE"
          ? "Upgrade Plan"
          : plan.badge === "PACK"
            ? "Buy more minutes"
            : "Manage Plan"}
      </button>
    </div>
  );
}

export default function WorkspaceNav() {
  const pathname = usePathname() || "";
  const onHome = pathname === "/" || pathname === "";
  const onAssets = pathname.includes("/my-assets");
  const onPricing = pathname.includes("/pricing");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] =
    useState<UpgradePricingReason>("generic");

  const openUpgrade = (reason: UpgradePricingReason = "generic") => {
    setUpgradeReason(reason);
    setUpgradeOpen(true);
  };

  return (
    <>
      <aside className="group/nav sticky top-0 z-[60] hidden h-svh w-14 shrink-0 flex-col self-start overflow-hidden border-r border-[#EAEAEA] bg-[#F9F9FC] transition-[width] duration-300 ease-in-out hover:w-[260px] hover:shadow-[8px_0_24px_-16px_rgba(91,84,200,0.35)] md:flex">
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

        <nav className="flex min-h-0 flex-1 flex-col px-2 pb-2 pt-1">
          <ul className="flex flex-col gap-1">
            <li>
              <Link
                href={CONVERT_HREF}
                title="Transcribe"
                className={`flex h-11 items-center gap-2 overflow-hidden rounded-xl px-2.5 text-[14px] font-medium ${
                  onHome
                    ? "bg-white text-[#635BFF]"
                    : "text-[#7F7F7F] hover:bg-white hover:text-[#635BFF]"
                }`}
              >
                <NavIcon icon={AudioLines} />
                <span className="min-w-0 flex-1 truncate opacity-0 transition-opacity duration-200 group-hover/nav:opacity-100">
                  Transcribe
                </span>
              </Link>
            </li>
            <li>
              <Link
                href="/my-assets"
                title="My Assets"
                className={`flex h-11 items-center gap-2 overflow-hidden rounded-xl px-2.5 text-[14px] font-medium ${
                  onAssets
                    ? "bg-white text-[#635BFF]"
                    : "text-[#7F7F7F] hover:bg-white hover:text-[#635BFF]"
                }`}
              >
                <NavIcon icon={FolderOpen} />
                <span className="truncate opacity-0 group-hover/nav:opacity-100">
                  My Assets
                </span>
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={() => openUpgrade("generic")}
                title="Pricing"
                className={`flex h-11 w-full items-center gap-2 overflow-hidden rounded-xl px-2.5 text-left text-[14px] font-medium ${
                  onPricing || upgradeOpen
                    ? "bg-white text-[#635BFF]"
                    : "text-[#64748B] hover:bg-white hover:text-[#635BFF]"
                }`}
              >
                <Gift
                  className="h-5 w-5 shrink-0"
                  strokeWidth={1.75}
                  style={{ color: "#F97316" }}
                  absoluteStrokeWidth
                />
                <span className="min-w-0 truncate opacity-0 group-hover/nav:opacity-100">
                  Pricing
                </span>
                <span
                  className="ml-auto hidden shrink-0 items-center justify-center rounded-lg px-2 py-0.5 text-xs font-bold text-black group-hover/nav:inline-flex"
                  style={{ backgroundColor: "#FFCB65" }}
                >
                  50% Off
                </span>
              </button>
            </li>
          </ul>

          <div className="-mx-2 mt-auto flex justify-center px-[7px] pb-3 pt-3 group-hover/nav:px-2">
            <button
              type="button"
              onClick={() => openUpgrade("generic")}
              title="Upgrade Plan"
              aria-label="Upgrade Plan"
              className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-[#635BFF] text-white shadow-[0_8px_20px_-12px_rgba(99,91,255,0.9)] group-hover/nav:hidden"
            >
              <Gift className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <CurrentPlanCard onUpgrade={openUpgrade} />
          </div>
        </nav>
      </aside>
      <UpgradePricingModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        reason={upgradeReason}
      />
    </>
  );
}
