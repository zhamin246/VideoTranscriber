"use client";

import { Clock3, Gift } from "lucide-react";
import { useAppContext } from "@/contexts/app";
import { useSignedIn } from "@/hooks/useSignedIn";

function sidebarMinutesLeft(
  user: ReturnType<typeof useAppContext>["user"],
): number {
  const fromPlan = user?.plan?.minutes.left;
  if (typeof fromPlan === "number") return Math.max(0, fromPlan);
  const fromCredits = user?.credits?.left_credits;
  if (typeof fromCredits === "number") return Math.max(0, fromCredits);
  return 90;
}

export default function WorkspaceSidebarUpgradeStrip({
  collapsed,
  onUpgrade,
}: {
  collapsed: boolean;
  onUpgrade: () => void;
}) {
  const { user, sessionLoading } = useSignedIn();
  const minutesLeft = sessionLoading ? null : sidebarMinutesLeft(user);

  const upgradeButtonExpanded = (
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
  );

  if (collapsed) {
    return (
      <div className="mb-2 flex w-full flex-col items-center gap-2">
        <div
          className="flex w-full flex-col items-center rounded-xl bg-[#E8EEFC] px-1 py-2"
          title={
            minutesLeft == null
              ? "Minutes remaining"
              : `${minutesLeft} min remaining`
          }
        >
          <Clock3
            className="h-4 w-4 text-[#5270FF]"
            strokeWidth={1.75}
            absoluteStrokeWidth
          />
          <span className="mt-1 text-center text-[11px] font-bold leading-tight tabular-nums text-[#0F172A]">
            {minutesLeft == null ? "—" : `${minutesLeft}`}
            {minutesLeft == null ? null : (
              <span className="block text-[10px] font-semibold text-[#64748B]">
                min
              </span>
            )}
          </span>
        </div>
        <button
          type="button"
          onClick={onUpgrade}
          title="Upgrade"
          aria-label="Upgrade"
          className="flex h-[42px] w-[42px] items-center justify-center rounded-lg bg-[#2563EB] text-white shadow-[0_8px_20px_-12px_rgba(37,99,235,0.9)]"
        >
          <Gift className="h-5 w-5" strokeWidth={1.75} style={{ color: "#FDBA74" }} />
        </button>
      </div>
    );
  }

  return (
    <div className="mb-2.5 flex w-full flex-col gap-2 rounded-2xl bg-[#E8EEFC] px-3 py-3">
      <div
        className="flex items-center justify-center gap-1.5"
        title={
          minutesLeft == null
            ? "Minutes remaining"
            : `${minutesLeft} min remaining`
        }
      >
        <Clock3
          className="h-[18px] w-[18px] shrink-0 text-[#5270FF]"
          strokeWidth={1.75}
          absoluteStrokeWidth
        />
        <span className="text-[22px] font-bold tabular-nums leading-none text-[#0F172A]">
          {minutesLeft ?? "—"}
        </span>
        {minutesLeft == null ? null : (
          <span className="self-end pb-0.5 text-[14px] font-semibold text-[#64748B]">
            min
          </span>
        )}
      </div>
      {upgradeButtonExpanded}
    </div>
  );
}
