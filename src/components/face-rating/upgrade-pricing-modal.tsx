"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader, Lock, Shield, X } from "lucide-react";
import { toast } from "sonner";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useAppContext } from "@/contexts/app";
import {
  CONVERT_PRICING_ITEMS,
  savePercentVsStarter,
} from "@/lib/convert/pricing-catalog";
import type { PricingItem } from "@/types/blocks/pricing";
import { cn } from "@/lib/utils";
import { FeatureText } from "./feature-text";

type BillingTab = "month" | "year" | "onetime";

const ACCENT = "#2563EB";
const INK = "#111827";
const MUTED = "#6B7280";
const PANEL_INNER = "#F1F5F9";

const BILLING_TABS: {
  id: BillingTab;
  label: string;
  badge?: string;
}[] = [
  { id: "month", label: "Monthly" },
  { id: "year", label: "Yearly", badge: "−40%" },
  { id: "onetime", label: "One-Time" },
];

export type UpgradePricingReason =
  | "minutes"
  | "daily"
  | "file_limit"
  | "generic";

const COPY: Record<UpgradePricingReason, { defaultTab: BillingTab }> = {
  minutes: { defaultTab: "onetime" },
  daily: { defaultTab: "year" },
  file_limit: { defaultTab: "year" },
  generic: { defaultTab: "year" },
};

function sidebarTitleForPlan(item: PricingItem | undefined) {
  if (!item) return "Choose Your Plan";
  if (item.group === "credits") {
    return `${item.title} minute pack`;
  }
  return `Unlock ${item.title} Features`;
}

function PlanRadio({ selected }: { selected: boolean }) {
  return (
    <span
      className={cn(
        "mt-1 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors",
        selected ? "border-[#2563EB]" : "border-[#CBD5E1]",
      )}
      aria-hidden
    >
      {selected ? (
        <span className="h-2 w-2 rounded-full bg-[#2563EB]" />
      ) : null}
    </span>
  );
}

function formatDisplayPrice(price: string) {
  return price.replace(/^\$/, "$ ");
}

function SidebarCheck() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      className="mt-0.5 shrink-0"
      aria-hidden
      style={{ color: ACCENT }}
    >
      <path
        d="M3.2 8.2 6.4 11.2 12.8 4.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function defaultSelectedId(items: PricingItem[]) {
  const featured = items.find((i) => i.is_featured);
  if (featured) return featured.product_id;
  return items[0]?.product_id ?? "";
}

/** Map API / client error text → upgrade modal reason. */
export function upgradeReasonFromMessage(
  message: string,
): UpgradePricingReason | null {
  const m = message.toLowerCase();
  if (!m) return null;
  if (m.includes("file per day") || m.includes("daily")) return "daily";
  if (m.includes("30 minutes per file") || m.includes("per file")) {
    return "file_limit";
  }
  if (
    m.includes("not enough transcription minutes") ||
    m.includes("not enough minutes") ||
    m.includes("minute pack") ||
    m.includes("only have") ||
    m.includes("buy a pack") ||
    m.includes("upgrade your plan")
  ) {
    return "minutes";
  }
  return null;
}

export default function UpgradePricingModal({
  open,
  onOpenChange,
  reason = "minutes",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: UpgradePricingReason;
}) {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const { data: session, status: sessionStatus } = useSession();
  const { setShowSignModal } = useAppContext();
  const loggedIn =
    sessionStatus === "authenticated" && Boolean(session?.user?.email);

  const copy = COPY[reason] || COPY.generic;
  const [billingTab, setBillingTab] = useState<BillingTab>(copy.defaultTab);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);

  const packs = useMemo(
    () => CONVERT_PRICING_ITEMS.filter((item) => item.group === "credits"),
    [],
  );

  const planOptions = useMemo(() => {
    if (billingTab === "onetime") return packs;
    return CONVERT_PRICING_ITEMS.filter(
      (item) =>
        item.group === "subscription" &&
        item.product_id !== "free" &&
        item.interval === billingTab,
    );
  }, [billingTab, packs]);

  const selectedItem = planOptions.find((p) => p.product_id === selectedId);
  const sidebarTitle = sidebarTitleForPlan(selectedItem);
  const sidebarFeatures = selectedItem?.features ?? [];

  useEffect(() => {
    if (!open) return;
    setBillingTab(copy.defaultTab);
  }, [open, copy.defaultTab]);

  useEffect(() => {
    setSelectedId(defaultSelectedId(planOptions));
  }, [planOptions, billingTab]);

  async function checkout(item: PricingItem) {
    if (!item.amount) return;
    if (!loggedIn) {
      setShowSignModal(true, "/pricing");
      return;
    }
    try {
      setLoading(true);
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: item.product_id,
          stripe_price_id: item.stripe_price_id,
          currency: item.currency,
          locale,
        }),
      });
      if (response.status === 401) {
        setShowSignModal(true, "/pricing");
        return;
      }
      const { code, message, data } = await response.json();
      if (code !== 0) {
        toast.error(message || "Checkout failed");
        return;
      }
      if (!data?.checkout_url) {
        toast.error("Checkout failed");
        return;
      }
      window.location.href = data.checkout_url;
    } catch {
      toast.error("Checkout failed");
    } finally {
      setLoading(false);
    }
  }

  function planSubtitle(item: PricingItem) {
    if (item.group === "credits") {
      return `${item.credits.toLocaleString()} minutes · ${item.valid_months || 3}-month validity`;
    }
    return `${item.credits.toLocaleString()} minutes / month`;
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-[8px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-[100] flex max-h-[min(92vh,620px)] w-[min(96vw,880px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.22)] outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          )}
          style={{ color: INK }}
        >
          <DialogPrimitive.Title className="sr-only">
            Choose Your Plan
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Select a subscription or minute pack and continue to checkout.
          </DialogPrimitive.Description>

          <DialogPrimitive.Close
            className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </DialogPrimitive.Close>

          <div className="flex min-h-0 flex-1 flex-col md:flex-row">
            <aside className="shrink-0 p-4 md:w-[42%] md:p-5 md:pr-2">
              <div
                className="h-full max-h-[240px] overflow-y-auto rounded-2xl p-6 md:max-h-none md:p-7"
                style={{ backgroundColor: PANEL_INNER }}
              >
                <h3
                  key={selectedId}
                  className="text-[16px] font-bold tracking-tight text-[#0F172A]"
                >
                  {sidebarTitle}
                </h3>
                <ul key={`${selectedId}-features`} className="mt-5 space-y-3">
                  {sidebarFeatures.map((line) => (
                    <li
                      key={line}
                      className="flex items-start gap-2.5 text-[13px] leading-[1.45] text-[#475569]"
                    >
                      <SidebarCheck />
                      <span>
                        <FeatureText text={line} accent={ACCENT} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            <div className="flex min-h-0 flex-1 flex-col px-5 pb-6 pt-7 md:px-7 md:pb-7 md:pt-8">
              <h2 className="text-center text-[20px] font-bold tracking-tight text-[#0F172A]">
                Choose Your Plan
              </h2>

              <div className="mx-auto mt-5 w-full max-w-[340px]">
                <div
                  className="flex rounded-full p-[3px]"
                  style={{ backgroundColor: PANEL_INNER }}
                  role="tablist"
                  aria-label="Billing period"
                >
                  {BILLING_TABS.map(({ id, label, badge }) => {
                    const active = billingTab === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setBillingTab(id)}
                        className={cn(
                          "inline-flex flex-1 items-center justify-center gap-1 rounded-2xl px-2 py-1.5 text-[13px] transition-all",
                          active
                            ? "bg-white font-bold text-[#111827] shadow-sm"
                            : "font-semibold text-[#64748B] hover:text-[#111827]",
                        )}
                      >
                        <span className="truncate">{label}</span>
                        {badge ? (
                          <span className="shrink-0 rounded bg-[#DCFCE7] px-1 py-0.5 text-[9px] font-bold leading-none text-[#15803D]">
                            {badge}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                className="mt-5 min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-0.5"
                role="radiogroup"
                aria-label="Plans"
              >
                {planOptions.map((item) => {
                  const selected = selectedId === item.product_id;
                  const featured =
                    Boolean(item.is_featured) && item.group === "subscription";
                  const showYearlyOff =
                    billingTab === "year" && Boolean(item.original_price);

                  return (
                    <label
                      key={item.product_id}
                      className={cn(
                        "relative block cursor-pointer rounded-xl border px-4 py-3 transition-colors",
                        selected
                          ? "border-[#2563EB] bg-white"
                          : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]",
                      )}
                    >
                      {featured ? (
                        <span className="absolute -top-2.5 left-5 rounded-sm bg-[#2563EB] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em] text-white">
                          Most Popular
                        </span>
                      ) : null}
                      <input
                        type="radio"
                        name="upgrade-plan"
                        className="sr-only"
                        checked={selected}
                        onChange={() => setSelectedId(item.product_id)}
                      />
                      <div className="flex items-start gap-3">
                        <PlanRadio selected={selected} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[15px] font-bold text-[#0F172A]">
                              {item.title}
                            </span>
                            {showYearlyOff ? (
                              <span className="rounded-sm bg-[#DCFCE7] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#15803D]">
                                40% OFF
                              </span>
                            ) : null}
                            {billingTab === "onetime" &&
                            savePercentVsStarter(item) ? (
                              <span className="rounded-sm bg-[#FEF3C7] px-1.5 py-0.5 text-[10px] font-bold text-[#B45309]">
                                Save {savePercentVsStarter(item)}%
                              </span>
                            ) : null}
                          </div>
                          <p
                            className="mt-0.5 text-[13px] leading-snug"
                            style={{ color: MUTED }}
                          >
                            {planSubtitle(item)}
                          </p>
                        </div>
                        <div className="shrink-0 pt-0.5 text-right tabular-nums">
                          <p className="text-[20px] font-bold leading-none text-[#0F172A]">
                            {formatDisplayPrice(item.price)}
                            <span
                              className="ml-0.5 text-[13px] font-medium"
                              style={{ color: MUTED }}
                            >
                              {item.group === "credits" ? "" : "/mo"}
                            </span>
                          </p>
                          {showYearlyOff && item.original_price ? (
                            <p
                              className="mt-1 text-[12px] font-medium line-through"
                              style={{ color: "#94A3B8" }}
                            >
                              {formatDisplayPrice(item.original_price)}
                              /mo
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="mt-5 shrink-0 space-y-3">
                <button
                  type="button"
                  disabled={loading || !selectedItem?.amount}
                  onClick={() => selectedItem && void checkout(selectedItem)}
                  className="flex h-11 w-full items-center justify-center rounded-lg text-[15px] font-bold text-white transition-opacity hover:opacity-95 disabled:opacity-50"
                  style={{ backgroundColor: ACCENT }}
                >
                  {loading ? (
                    <Loader className="h-5 w-5 animate-spin" />
                  ) : (
                    "Buy Now"
                  )}
                </button>
                <div
                  className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-[11px]"
                  style={{ color: "#94A3B8" }}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                    Payment 100% Secure
                  </span>
                  {billingTab !== "onetime" ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                      Cancel Anytime
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
