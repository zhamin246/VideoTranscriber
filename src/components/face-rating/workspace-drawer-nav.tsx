"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FolderOpen,
  Gift,
  Home,
  LayoutGrid,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { usePathname } from "@/i18n/navigation";
import { useAppContext } from "@/contexts/app";
import { useSignedIn } from "@/hooks/useSignedIn";
import { CONVERT_HREF } from "./data";
import { NavRouteLink } from "./nav-route-link";
import { PlatformMark } from "./platform-mark";
import UpgradePricingModal, {
  type UpgradePricingReason,
} from "./upgrade-pricing-modal";
import WorkspaceSidebarUpgradeStrip from "./workspace-sidebar-upgrade-strip";
import {
  AI_TOOLS_HREF,
  isAiToolsHubActive,
  isToolNavActive,
  WORKSPACE_MEDIA_TOOL_NAV,
  WORKSPACE_PLATFORM_TOOL_NAV,
  type WorkspaceToolNavItem,
} from "./workspace-tool-nav-items";

const NAV_ICON = "h-[18px] w-[18px] shrink-0";

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

function drawerLinkClass(active: boolean) {
  return `flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2 text-[15px] font-medium leading-snug transition-colors ${
    active
      ? "bg-[#E8EEFC] text-[#5270FF]"
      : "text-[#334155] hover:bg-[#F4F6FA] hover:text-[#5270FF]"
  }`;
}

function DrawerToolLink({
  item,
  pathname,
  onNavigate,
}: {
  item: WorkspaceToolNavItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const active = isToolNavActive(pathname, item.href);
  return (
    <NavRouteLink
      href={item.href}
      onClick={onNavigate}
      className={drawerLinkClass(active)}
    >
      <ToolNavIcon item={item} />
      <span className="min-w-0 flex-1 text-left">{item.label}</span>
    </NavRouteLink>
  );
}

export default function WorkspaceDrawerNav({
  onNavigate,
}: {
  onNavigate: () => void;
}) {
  const pathname = usePathname() || "";
  const { signedIn } = useSignedIn();
  const { setShowSignModal } = useAppContext();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] =
    useState<UpgradePricingReason>("generic");

  const openUpgrade = (reason: UpgradePricingReason = "generic") => {
    setUpgradeReason(reason);
    setUpgradeOpen(true);
  };

  const onHome = pathname === "/" || pathname === "";
  const onAssets = pathname.includes("/my-assets");
  const onPricing = pathname.includes("/pricing");
  const onAiTools = isAiToolsHubActive(pathname);

  const guestSignIn = () => {
    onNavigate();
    setShowSignModal(true, pathname || "/");
  };

  return (
    <div className="flex flex-col gap-1">
      <Link
        href={CONVERT_HREF}
        onClick={onNavigate}
        className="mb-2 flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#0F172A] px-4 text-[15px] font-medium text-white transition-colors hover:bg-[#1E293B]"
      >
        <Plus className="h-4 w-4 shrink-0" strokeWidth={2} />
        New Video
      </Link>

      <Link
        href={CONVERT_HREF}
        onClick={onNavigate}
        className={drawerLinkClass(onHome)}
      >
        <NavIcon icon={Home} />
        <span>Home</span>
      </Link>

      {WORKSPACE_MEDIA_TOOL_NAV.map((item) => (
        <DrawerToolLink
          key={item.href}
          item={item}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      ))}

      {WORKSPACE_PLATFORM_TOOL_NAV.map((item) => (
        <DrawerToolLink
          key={item.href}
          item={item}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      ))}

      <NavRouteLink
        href={AI_TOOLS_HREF}
        onClick={onNavigate}
        className={drawerLinkClass(onAiTools)}
      >
        <LayoutGrid className={NAV_ICON} strokeWidth={1.75} absoluteStrokeWidth />
        <span>AI Tools</span>
      </NavRouteLink>

      <div className="my-2 border-t border-[#E8EAF0]" />

      <Link
        href="/my-assets"
        onClick={onNavigate}
        className={drawerLinkClass(onAssets)}
      >
        <NavIcon icon={FolderOpen} />
        <span>My Assets</span>
      </Link>

      <Link
        href="/pricing"
        onClick={onNavigate}
        className={drawerLinkClass(onPricing)}
      >
        <Gift
          className="h-[18px] w-[18px] shrink-0"
          strokeWidth={1.75}
          style={{ color: "#F97316" }}
          absoluteStrokeWidth
        />
        <span className="min-w-0 flex-1 text-left">Pricing</span>
        <span
          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold text-black"
          style={{ backgroundColor: "#FFCB65" }}
        >
          40% Off
        </span>
      </Link>

      {signedIn ? (
        <div className="mt-3">
          <WorkspaceSidebarUpgradeStrip
            collapsed={false}
            onUpgrade={() => openUpgrade("generic")}
          />
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => openUpgrade("generic")}
            className="mt-3 flex h-[37px] w-full items-center gap-2 rounded-lg bg-[#2563EB] px-2.5 text-[13px] font-bold text-white shadow-[0_10px_28px_-10px_rgba(37,99,235,0.75)]"
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
          <button
            type="button"
            onClick={guestSignIn}
            className="mt-2 flex min-h-[44px] w-full items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[15px] font-semibold text-[#334155]"
          >
            Sign in for free
          </button>
        </>
      )}

      <UpgradePricingModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        reason={upgradeReason}
      />
    </div>
  );
}
