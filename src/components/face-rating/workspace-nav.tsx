"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "@/i18n/navigation";
import {
  ChevronDown,
  Clock3,
  FileText,
  FolderOpen,
  Gift,
  Globe,
  Home,
  LayoutGrid,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useSignedIn } from "@/hooks/useSignedIn";
import { useAppContext } from "@/contexts/app";
import { localeNames } from "@/i18n/locale";
import { CONVERT_HREF } from "./data";
import { NavRouteLink } from "./nav-route-link";
import { PlatformMark } from "./platform-mark";
import {
  AI_TOOLS_HREF,
  isAiToolsHubActive,
  isToolNavActive,
  WORKSPACE_MEDIA_TOOL_NAV,
  WORKSPACE_PLATFORM_TOOL_NAV,
  type WorkspaceToolNavItem,
} from "./workspace-tool-nav-items";
import type { PlanSummary } from "@/lib/plan/summary";
import UpgradePricingModal, {
  type UpgradePricingReason,
} from "./upgrade-pricing-modal";
import WorkspaceSidebarUpgradeStrip from "./workspace-sidebar-upgrade-strip";

const DASHBOARD_HREF = "/dashboard";

const NAV_ICON = "h-4 w-4 shrink-0";

function NavIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon className={NAV_ICON} strokeWidth={1.75} absoluteStrokeWidth />;
}

function ToolNavIcon({ item }: { item: WorkspaceToolNavItem }) {
  if ("platform" in item) {
    return (
      <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center overflow-hidden rounded-sm [&_span]:!h-[18px] [&_span]:!w-[18px] [&_svg]:!h-[18px] [&_svg]:!w-[18px]">
        <PlatformMark kind={item.platform} />
      </span>
    );
  }
  return <NavIcon icon={item.icon} />;
}

function toolLinkClass(active: boolean, collapsed: boolean) {
  return `flex min-h-[36px] items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-normal leading-snug transition-colors ${
    collapsed ? "justify-center px-2" : ""
  } ${
    active
      ? "bg-[#E8EEFC] text-[#5270FF]"
      : "text-[#334155] hover:bg-white hover:text-[#5270FF]"
  }`;
}

function navLabelClass(collapsed: boolean) {
  return collapsed
    ? "sr-only"
    : "min-w-0 flex-1 truncate whitespace-nowrap text-left";
}

function ToolNavListItem({
  item,
  pathname,
  collapsed,
  nested,
}: {
  item: WorkspaceToolNavItem;
  pathname: string;
  collapsed: boolean;
  nested?: boolean;
}) {
  const active = isToolNavActive(pathname, item.href);
  const className = `${toolLinkClass(active, collapsed)}${nested && !collapsed ? " ml-1 min-h-[34px]" : ""}`;

  return (
    <li>
      <NavRouteLink href={item.href} className={className} title={item.label}>
        <ToolNavIcon item={item} />
        <span className={navLabelClass(collapsed)}>{item.label}</span>
      </NavRouteLink>
    </li>
  );
}

export const SIDEBAR_COLLAPSED_KEY = "workspace-nav-collapsed";

/** Wide enough for full tool labels (e.g. Facebook Transcript Generator). */
export const WORKSPACE_NAV_EXPANDED_WIDTH_PX = 288;
export const WORKSPACE_NAV_COLLAPSED_WIDTH_PX = 56;

function BrandMark() {
  return (
    <span className="flex h-9 w-9 min-h-9 min-w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_1px_3px_rgba(15,23,42,0.08)] ring-1 ring-black/[0.04]">
      <img
        src="/favicon.svg"
        alt=""
        width={28}
        height={28}
        className="h-7 w-7 object-contain"
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

function SidebarGoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden className="shrink-0">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.8-6.6 7.3l6.2 5.2C37.3 38.3 44 33 44 24c0-1.3-.1-2.5-.4-3.5z"
      />
    </svg>
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

function GuestSidebarFooter({
  onSignIn,
  onUpgrade,
}: {
  onSignIn: () => void;
  onUpgrade: () => void;
}) {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const languageLabel = localeNames[locale] || localeNames.en;

  return (
    <div className="flex w-full flex-col gap-2">
      <button
        type="button"
        onClick={onUpgrade}
        className="flex h-[37px] w-full items-center gap-2 rounded-lg bg-[#2563EB] px-2.5 text-[13px] font-bold text-white shadow-[0_10px_28px_-10px_rgba(37,99,235,0.75)] transition-colors hover:bg-[#1D4ED8]"
      >
        <Gift
          className="h-[18px] w-[18px] shrink-0"
          strokeWidth={1.75}
          style={{ color: "#FDBA74" }}
          absoluteStrokeWidth
        />
        <span>Upgrade</span>
        <span className="ml-auto rounded bg-white px-2 py-0.5 text-[11px] font-bold text-[#2563EB]">
          Save 40%
        </span>
      </button>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSignIn}
          className="flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-4 text-[13px] font-bold text-[#334155] transition-colors hover:bg-[#F8FAFC]"
        >
          <SidebarGoogleMark />
          <span className="truncate">Sign in for free</span>
        </button>
        <button
          type="button"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#64748B] transition-colors hover:bg-[#F8FAFC]"
          title={languageLabel}
          aria-label={`Language: ${languageLabel}`}
        >
          <Globe className="h-[18px] w-[18px]" strokeWidth={1.75} absoluteStrokeWidth />
        </button>
      </div>
    </div>
  );
}

function sidebarAccountName(
  user: ReturnType<typeof useAppContext>["user"],
  session: ReturnType<typeof useSession>["data"],
): string {
  const raw =
    user?.nickname?.trim() ||
    session?.user?.name?.trim() ||
    user?.email?.split("@")[0] ||
    session?.user?.email?.split("@")[0] ||
    "Account";
  return raw;
}

function sidebarAccountEmail(
  user: ReturnType<typeof useAppContext>["user"],
  session: ReturnType<typeof useSession>["data"],
): string {
  return user?.email || session?.user?.email || "";
}

function SidebarUserAvatar({
  name,
  avatarUrl,
  size = "md",
}: {
  name: string;
  avatarUrl?: string | null;
  size?: "md" | "sm";
}) {
  const initial = (name.trim()[0] || "?").toUpperCase();
  const dim = size === "sm" ? "h-9 w-9 text-[13px]" : "h-10 w-10 text-sm";
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={`${dim} shrink-0 rounded-full object-cover ring-1 ring-black/[0.06]`}
      />
    );
  }
  return (
    <span
      className={`${dim} flex shrink-0 items-center justify-center rounded-full bg-[#E879F9] font-bold text-white ring-1 ring-black/[0.04]`}
      aria-hidden
    >
      {initial}
    </span>
  );
}

function SignedInSidebarAccount({
  collapsed,
  onUpgrade,
}: {
  collapsed: boolean;
  onUpgrade: (reason?: UpgradePricingReason) => void;
}) {
  const { user } = useSignedIn();
  const { data: session } = useSession();
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const languageLabel = localeNames[locale] || localeNames.en;
  const [panelOpen, setPanelOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const name = sidebarAccountName(user, session);
  const email = sidebarAccountEmail(user, session);
  const avatarUrl = user?.avatar_url || session?.user?.image;

  useEffect(() => {
    if (!panelOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanelOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [panelOpen]);

  const handleUpgrade = (reason?: UpgradePricingReason) => {
    setPanelOpen(false);
    onUpgrade(reason);
  };

  const globeButton = (
    <button
      type="button"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#64748B] transition-colors hover:bg-[#F8FAFC]"
      title={languageLabel}
      aria-label={`Language: ${languageLabel}`}
    >
      <Globe className="h-[18px] w-[18px]" strokeWidth={1.75} absoluteStrokeWidth />
    </button>
  );

  const planPopover = panelOpen ? (
    <div
      className={
        collapsed
          ? "absolute bottom-0 left-full z-[70] ml-2 w-[min(288px,calc(100vw-4rem))]"
          : "absolute bottom-full left-0 right-0 z-[70] mb-2"
      }
      role="dialog"
      aria-label="Current plan"
    >
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_28px_rgba(15,23,42,0.14)] ring-1 ring-black/[0.06]">
        <CurrentPlanCard embedded onUpgrade={handleUpgrade} />
        <div className="border-t border-[#EEF0F5] px-2 py-1.5">
          <Link
            href={DASHBOARD_HREF}
            className="block rounded-lg px-2.5 py-2.5 text-[14px] font-medium text-[#334155] transition-colors hover:bg-[#F8FAFC]"
            onClick={() => setPanelOpen(false)}
          >
            My Dashboard
          </Link>
          <button
            type="button"
            className="block w-full rounded-lg px-2.5 py-2.5 text-left text-[14px] font-medium text-[#334155] transition-colors hover:bg-[#F8FAFC]"
            onClick={() => {
              setPanelOpen(false);
              void signOut({ callbackUrl: "/" });
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  ) : null;

  if (collapsed) {
    return (
      <div ref={rootRef} className="relative flex flex-col items-center gap-2">
        {planPopover}
        <button
          type="button"
          onClick={() => setPanelOpen((v) => !v)}
          className="rounded-full"
          title={name}
          aria-label="Account and plan"
          aria-expanded={panelOpen}
        >
          <SidebarUserAvatar name={name} avatarUrl={avatarUrl} size="sm" />
        </button>
        {globeButton}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative w-full">
      {planPopover}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setPanelOpen((v) => !v)}
          aria-expanded={panelOpen}
          aria-label="Account and plan"
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg py-1 pl-0.5 pr-1 text-left transition-colors hover:bg-white"
        >
          <SidebarUserAvatar name={name} avatarUrl={avatarUrl} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-semibold leading-tight text-[#0F172A]">
              {name}
            </span>
            {email ? (
              <span className="mt-0.5 block truncate text-[12px] leading-tight text-[#94A3B8]">
                {email}
              </span>
            ) : null}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-[#94A3B8] transition-transform duration-200 ${
              panelOpen ? "rotate-180" : ""
            }`}
            strokeWidth={1.75}
            aria-hidden
          />
        </button>
        {globeButton}
      </div>
    </div>
  );
}

function CurrentPlanCard({
  onUpgrade,
  embedded = false,
}: {
  onUpgrade: (reason?: UpgradePricingReason) => void;
  embedded?: boolean;
}) {
  const { user, signedIn, sessionLoading } = useSignedIn();
  if (!signedIn) return null;

  const plan = user?.plan || (sessionLoading ? null : guestPlan());
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
    <div
      className={`flex w-full flex-col bg-white p-3.5 ${
        embedded
          ? "border-0 shadow-none"
          : "rounded-2xl border border-[#EEF0F5] shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
      }`}
    >
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
  const { signedIn } = useSignedIn();
  const { setShowSignModal } = useAppContext();
  const onHome = pathname === "/" || pathname === "";
  const onAssets = pathname.includes("/my-assets");
  const onPricing = pathname.includes("/pricing");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] =
    useState<UpgradePricingReason>("generic");
  const [collapsed, setCollapsed] = useState(false);
  const onAiTools = isAiToolsHubActive(pathname);

  const guestSignIn = () => {
    setShowSignModal(true, pathname || "/");
  };

  useEffect(() => {
    try {
      if (localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1") {
        setCollapsed(true);
      }
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event("workspace-nav-collapse"));
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new Event("workspace-nav-collapse"));
      return next;
    });
  };

  const openUpgrade = (reason: UpgradePricingReason = "generic") => {
    setUpgradeReason(reason);
    setUpgradeOpen(true);
  };

  const mobileToolLinks = [
    { href: CONVERT_HREF, label: "Home" },
    ...WORKSPACE_MEDIA_TOOL_NAV.map((item) => ({
      href: item.href,
      label: item.label.replace(/\s+to\s+Text$/i, "").replace(/\s+Converter$/i, ""),
    })),
    { href: AI_TOOLS_HREF, label: "AI Tools" },
    { href: "/pricing", label: "Pricing" },
    ...(signedIn ? [{ href: "/my-assets", label: "Assets" }] : []),
  ];

  return (
    <>
      <nav
        aria-label="Tool pages"
        className="fixed bottom-0 left-0 right-0 z-[58] border-t border-[#E8EAF0] bg-[#F9F9FC] md:hidden"
      >
        <ul className="flex gap-1.5 overflow-x-auto overscroll-x-contain px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {mobileToolLinks.map((item) => {
            const active =
              item.href === CONVERT_HREF
                ? onHome
                : item.href === "/my-assets"
                  ? onAssets
                  : item.href === AI_TOOLS_HREF
                    ? onAiTools
                    : isToolNavActive(pathname, item.href);
            return (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  className={`inline-flex min-h-[40px] items-center whitespace-nowrap rounded-xl px-3 py-2 text-[13px] font-semibold leading-none transition-colors ${
                    active
                      ? "bg-[#E8EEFC] text-[#5270FF]"
                      : "bg-white text-[#334155] shadow-sm ring-1 ring-[#E8EAF0] hover:text-[#5270FF]"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
          {!signedIn ? (
            <li className="shrink-0">
              <button
                type="button"
                onClick={() => setShowSignModal(true)}
                className="inline-flex min-h-[40px] items-center whitespace-nowrap rounded-xl border-2 border-[#5270FF] bg-white px-3 py-2 text-[13px] font-semibold leading-none text-[#5270FF]"
              >
                Sign In
              </button>
            </li>
          ) : null}
        </ul>
      </nav>
      <aside
        className={`group/nav sticky top-0 z-[60] hidden h-svh shrink-0 flex-col self-start border-r border-[#EAEAEA] bg-[#F9F9FC] transition-[width] duration-300 ease-in-out md:flex ${
          collapsed ? "w-14" : "w-[288px]"
        }`}
      >
        <div
          className={`flex shrink-0 items-center ${
            collapsed
              ? "mb-2 h-[72px] flex-col justify-center gap-0.5 px-1"
              : "mb-4 min-h-14 gap-1.5 px-3 pb-1 pt-2.5"
          }`}
        >
          <Link
            href="/"
            className={`flex min-w-0 items-center ${
              collapsed ? "justify-center" : "min-w-0 flex-1 gap-2.5"
            }`}
            aria-label="video transcriber — home"
          >
            <BrandMark />
            {collapsed ? null : (
              <span
                className="block min-w-0 whitespace-nowrap text-[20px] font-bold leading-7 tracking-[-0.02em]"
              >
                <span className="text-[#000000]">video </span>
                <span className="text-[#5270FF]">transcriber</span>
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

        <nav className="flex min-h-0 flex-1 flex-col px-2.5 pb-2">
          <div className="mb-5 shrink-0">
            <Link
              href={CONVERT_HREF}
              className={`flex h-[35px] items-center justify-center gap-1.5 rounded-md bg-[#0F172A] text-sm font-normal text-white transition-colors hover:bg-[#1E293B] ${
                collapsed ? "px-2" : "px-3.5"
              }`}
              title={collapsed ? "New Video" : undefined}
            >
              <Plus className="h-4 w-4 shrink-0" strokeWidth={2} />
              <span className={collapsed ? "sr-only" : "truncate"}>New Video</span>
            </Link>
          </div>
          <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain">
            <li>
              <Link
                href={CONVERT_HREF}
                className={toolLinkClass(onHome, collapsed)}
                title={collapsed ? "Home" : undefined}
              >
                <NavIcon icon={Home} />
                <span className={navLabelClass(collapsed)}>Home</span>
              </Link>
            </li>
            {WORKSPACE_MEDIA_TOOL_NAV.map((item) => (
              <ToolNavListItem
                key={item.href}
                item={item}
                pathname={pathname}
                collapsed={collapsed}
              />
            ))}
            {WORKSPACE_PLATFORM_TOOL_NAV.map((item) => (
              <ToolNavListItem
                key={item.href}
                item={item}
                pathname={pathname}
                collapsed={collapsed}
              />
            ))}
            <li>
              <NavRouteLink
                href={AI_TOOLS_HREF}
                className={toolLinkClass(onAiTools, collapsed)}
                title={collapsed ? "AI Tools" : undefined}
              >
                <LayoutGrid className={NAV_ICON} strokeWidth={1.75} absoluteStrokeWidth />
                <span className={navLabelClass(collapsed)}>AI Tools</span>
              </NavRouteLink>
            </li>
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
                  className="h-4 w-4 shrink-0"
                  strokeWidth={1.75}
                  style={{ color: "#F97316" }}
                  absoluteStrokeWidth
                />
                <span className={navLabelClass(collapsed)}>Pricing</span>
                {collapsed ? null : (
                  <span
                    className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold text-black"
                    style={{ backgroundColor: "#FFCB65" }}
                  >
                    40% Off
                  </span>
                )}
              </button>
            </li>
          </ul>

          <div className="relative z-[65] mt-2 shrink-0 overflow-visible pb-2 pt-1">
            {signedIn ? (
              <div className="flex w-full flex-col">
                <WorkspaceSidebarUpgradeStrip
                  collapsed={collapsed}
                  onUpgrade={() => openUpgrade("generic")}
                />
                <SignedInSidebarAccount
                  collapsed={collapsed}
                  onUpgrade={openUpgrade}
                />
              </div>
            ) : collapsed ? (
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => openUpgrade("generic")}
                  title="Upgrade"
                  aria-label="Upgrade"
                  className="flex h-[42px] w-[42px] items-center justify-center rounded-lg bg-[#2563EB] text-white shadow-[0_8px_20px_-12px_rgba(37,99,235,0.9)]"
                >
                  <Gift className="h-5 w-5" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  onClick={guestSignIn}
                  title="Sign in for free"
                  aria-label="Sign in for free"
                  className="flex h-[42px] w-[42px] items-center justify-center rounded-lg border border-[#E5E7EB] bg-white"
                >
                  <SidebarGoogleMark />
                </button>
              </div>
            ) : (
              <GuestSidebarFooter
                onSignIn={guestSignIn}
                onUpgrade={() => openUpgrade("generic")}
              />
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
