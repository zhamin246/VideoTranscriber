"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "@/i18n/navigation";
import {
  Clock3,
  FileText,
  FolderOpen,
  Gift,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react";
import { useSignedIn } from "@/hooks/useSignedIn";
import { CONVERT_HREF } from "./data";
import { isToTextSensitivePath } from "./nav-labels";
import { NavRouteLink } from "./nav-route-link";
import { PlatformMark } from "./platform-mark";
import {
  isToolNavActive,
  WORKSPACE_TOOL_NAV,
  type WorkspaceToolNavItem,
} from "./workspace-tool-nav-items";
import type { PlanSummary } from "@/lib/plan/summary";
import UpgradePricingModal, {
  type UpgradePricingReason,
} from "./upgrade-pricing-modal";

const NAV_ICON = "h-[18px] w-[18px] shrink-0";

function NavIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon className={NAV_ICON} strokeWidth={1.75} absoluteStrokeWidth />;
}

function ToolNavIcon({ item }: { item: WorkspaceToolNavItem }) {
  if ("platform" in item) {
    return (
      <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center overflow-hidden rounded-md [&_span]:!h-[22px] [&_span]:!w-[22px] [&_svg]:!h-[22px] [&_svg]:!w-[22px]">
        <PlatformMark kind={item.platform} />
      </span>
    );
  }
  return <NavIcon icon={item.icon} />;
}

function toolLinkClass(active: boolean, collapsed: boolean) {
  return `flex min-h-[44px] items-center gap-2.5 whitespace-nowrap rounded-xl py-2 text-[13px] font-semibold leading-none transition-colors ${
    collapsed ? "justify-center px-2" : "px-2.5"
  } ${
    active
      ? "bg-[#E8EEFC] text-[#5270FF]"
      : "text-[#334155] hover:bg-white hover:text-[#5270FF]"
  }`;
}

function navLabelClass(collapsed: boolean) {
  return collapsed ? "sr-only" : "min-w-0 flex-1 truncate text-left";
}

const SIDEBAR_COLLAPSED_KEY = "workspace-nav-collapsed";

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
  const { user, signedIn, sessionLoading } = useSignedIn();
  const plan =
    user?.plan || (signedIn && sessionLoading ? null : guestPlan());
  if (!plan) {
    return (
      <div className="flex w-full flex-col rounded-2xl border border-[#EEF0F5] bg-white p-3.5 text-sm text-[#94A3B8]">
        Loading plan…
      </div>
    );
  }

  const dailyUnlimited = plan.dailyFiles.limit == null;
  const badgeLabel =
    plan.badge === "PACK"
      ? plan.productName?.replace(/\s*·.*$/, "") || "PACK"
      : plan.badge;
  const upgradeReason: UpgradePricingReason =
    plan.badge === "PACK" ? "minutes" : "generic";

  return (
    <div className="flex w-full flex-col rounded-2xl border border-[#EEF0F5] bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
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
  const hideHomeKeyword = isToTextSensitivePath(pathname);
  const onHome = pathname === "/" || pathname === "";
  const onAssets = pathname.includes("/my-assets");
  const onPricing = pathname.includes("/pricing");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] =
    useState<UpgradePricingReason>("generic");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1") {
        setCollapsed(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const openUpgrade = (reason: UpgradePricingReason = "generic") => {
    setUpgradeReason(reason);
    setUpgradeOpen(true);
  };

  return (
    <>
      <aside
        className={`group/nav sticky top-0 z-[60] hidden h-svh shrink-0 flex-col self-start border-r border-[#EAEAEA] bg-[#F9F9FC] transition-[width] duration-300 ease-in-out md:flex ${
          collapsed ? "w-14" : "w-[min(100vw,320px)]"
        }`}
      >
        <div
          className={`flex shrink-0 items-center ${
            collapsed
              ? "h-[72px] flex-col justify-center gap-0.5 px-1"
              : "h-14 gap-1 px-2"
          }`}
        >
          <Link
            href="/"
            className={`flex min-w-0 items-center rounded-xl py-1 ${
              collapsed ? "justify-center" : "min-w-0 flex-1 gap-2"
            }`}
            aria-label={hideHomeKeyword ? "Home" : "video transcriber — home"}
          >
            <BrandMark />
            {hideHomeKeyword || collapsed ? null : (
              <span
                className="truncate whitespace-nowrap"
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  lineHeight: "24px",
                  letterSpacing: "-0.02em",
                }}
              >
                <span style={{ color: "#000000" }}>video </span>
                <span style={{ color: "#5270FF" }}>transcriber</span>
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={toggleCollapsed}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#64748B] transition-colors hover:bg-white hover:text-[#5270FF]"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-[18px] w-[18px]" strokeWidth={1.75} />
            ) : (
              <PanelLeftClose className="h-[18px] w-[18px]" strokeWidth={1.75} />
            )}
          </button>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col px-2 pb-2">
          <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain pr-0.5">
            <li>
              <Link
                href={CONVERT_HREF}
                className={toolLinkClass(onHome, collapsed)}
                title={collapsed ? "Transcribe home" : undefined}
              >
                <NavIcon icon={Home} />
                <span className={navLabelClass(collapsed)}>Transcribe home</span>
              </Link>
            </li>
            {WORKSPACE_TOOL_NAV.map((item) => {
              const active = isToolNavActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <NavRouteLink
                    href={item.href}
                    className={toolLinkClass(active, collapsed)}
                    title={item.label}
                  >
                    <ToolNavIcon item={item} />
                    <span className={navLabelClass(collapsed)}>{item.label}</span>
                  </NavRouteLink>
                </li>
              );
            })}
          </ul>

          <ul className="mt-2 shrink-0 space-y-0.5 border-t border-[#E8EAF0] pt-2">
            <li>
              <Link
                href="/my-assets"
                className={toolLinkClass(onAssets, collapsed)}
                title={collapsed ? "My Assets" : undefined}
              >
                <NavIcon icon={FolderOpen} />
                <span className={navLabelClass(collapsed)}>My Assets</span>
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={() => openUpgrade("generic")}
                className={`${toolLinkClass(onPricing || upgradeOpen, collapsed)} w-full`}
                title={collapsed ? "Pricing" : undefined}
              >
                <Gift
                  className="h-[18px] w-[18px] shrink-0"
                  strokeWidth={1.75}
                  style={{ color: "#F97316" }}
                  absoluteStrokeWidth
                />
                <span className={navLabelClass(collapsed)}>Pricing</span>
                {collapsed ? null : (
                  <span
                    className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-black"
                    style={{ backgroundColor: "#FFCB65" }}
                  >
                    40% Off
                  </span>
                )}
              </button>
            </li>
          </ul>

          <div className="mt-2 shrink-0 pb-2 pt-1">
            {collapsed ? (
              <button
                type="button"
                onClick={() => openUpgrade("generic")}
                title="Upgrade Plan"
                aria-label="Upgrade Plan"
                className="mx-auto flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-[#635BFF] text-white shadow-[0_8px_20px_-12px_rgba(99,91,255,0.9)]"
              >
                <Gift className="h-5 w-5" strokeWidth={1.75} />
              </button>
            ) : (
              <CurrentPlanCard onUpgrade={openUpgrade} />
            )}
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
