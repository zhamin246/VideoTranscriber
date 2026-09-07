"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader, X } from "lucide-react";
import { toast } from "sonner";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useAppContext } from "@/contexts/app";
import {
  CONVERT_PRICING_ITEMS,
  perCreditLabel,
  savePercentVsStarter,
} from "@/lib/convert/pricing-catalog";
import type { PricingItem } from "@/types/blocks/pricing";
import { cn } from "@/lib/utils";
import { FeatureText } from "./feature-text";

type View = "month" | "year" | "packs";

/** Match videotranscriber.ai upgrade modal accents (blue). */
const ACCENT = "#1C6CFB";
const ACCENT_SOFT = "#DFEEFF";
const ACCENT_BORDER = "#7AB1FF";
const CARD_BG = "#EFEFF1";
const INK = "#111827";
const MUTED = "#6B7280";

export type UpgradePricingReason =
  | "minutes"
  | "daily"
  | "file_limit"
  | "generic";

const COPY: Record<
  UpgradePricingReason,
  { title: string; description: string; defaultView: View }
> = {
  minutes: {
    title: "You're out of minutes",
    description:
      "Subscribe for a monthly pool, or buy a one-time pack to keep transcribing.",
    defaultView: "packs",
  },
  daily: {
    title: "Daily free limit reached",
    description:
      "Free plan allows 1 file per day. Upgrade for unlimited daily files.",
    defaultView: "year",
  },
  file_limit: {
    title: "File is too long for Free",
    description:
      "Free allows up to 30 minutes per file. Upgrade or buy a pack for longer audio.",
    defaultView: "year",
  },
  generic: {
    title: "Upgrade for more quotas",
    description:
      "Pick a plan or minute pack that fits how much you transcribe.",
    defaultView: "year",
  },
};

function Check() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      className="mt-0.5 shrink-0"
      aria-hidden
      style={{ color: "#8882F5" }}
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
  const [view, setView] = useState<View>(copy.defaultView);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (open) setView(copy.defaultView);
  }, [open, copy.defaultView]);

  const packs = useMemo(
    () => CONVERT_PRICING_ITEMS.filter((item) => item.group === "credits"),
    [],
  );
  const freePlan = useMemo(
    () => CONVERT_PRICING_ITEMS.find((item) => item.product_id === "free"),
    [],
  );
  const subs = useMemo(
    () =>
      CONVERT_PRICING_ITEMS.filter(
        (item) =>
          item.group === "subscription" &&
          item.product_id !== "free" &&
          item.interval === (view === "year" ? "year" : "month"),
      ),
    [view],
  );

  const cards =
    view === "packs" ? packs : freePlan ? [freePlan, ...subs] : subs;

  async function checkout(item: PricingItem) {
    if (item.product_id === "free" || !item.amount) return;
    if (!loggedIn) {
      setShowSignModal(true, "/pricing");
      return;
    }
    try {
      setLoadingId(item.product_id);
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
      setLoadingId(null);
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Frosted gray backdrop — match videotranscriber.ai: black/30 + blur(8px) */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-[8px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-[100] flex max-h-[min(94vh,900px)] w-[min(96vw,1152px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          )}
          style={{ color: INK }}
        >
          <DialogPrimitive.Close
            className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </DialogPrimitive.Close>

          <div className="shrink-0 px-5 pb-3 pt-6 text-center sm:px-8">
            <DialogPrimitive.Title className="text-[22px] font-bold tracking-tight sm:text-[24px]">
              {copy.title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description
              className="mx-auto mt-1.5 max-w-xl text-[14px] leading-relaxed"
              style={{ color: MUTED }}
            >
              {copy.description}
            </DialogPrimitive.Description>

            <div className="mt-5 inline-flex items-center rounded-full bg-[#F3F4F6] p-1">
              {(
                [
                  ["month", "Month"],
                  ["year", "Year"],
                  ["packs", "Minute packs"],
                ] as const
              ).map(([id, label]) => {
                const active = view === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setView(id)}
                    className={cn(
                      "relative rounded-full px-5 py-2 text-[13px] font-semibold transition-colors",
                      active ? "text-white" : "text-gray-600 hover:text-gray-900",
                    )}
                    style={active ? { backgroundColor: ACCENT } : undefined}
                  >
                    {label}
                    {id === "year" ? (
                      <span
                        className="absolute -right-1 -top-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-[#1F2937]"
                        style={{ backgroundColor: "#FACC15" }}
                      >
                        −40%
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <p className="mt-2.5 text-[12px]" style={{ color: MUTED }}>
              {view === "packs"
                ? "One-time · minutes expire after 3 months"
                : view === "year"
                  ? "Billed yearly · pools refresh monthly · save ~40%"
                  : "Pools refresh monthly"}
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-2 sm:px-6">
            <div
              className={cn(
                "mx-auto grid items-stretch gap-3",
                cards.length >= 4
                  ? "sm:grid-cols-2 xl:grid-cols-4"
                  : "sm:grid-cols-2 lg:grid-cols-3",
              )}
            >
              {cards.map((item) => {
                const featured = Boolean(item.is_featured);
                const isFree = item.product_id === "free";
                const save =
                  item.group === "credits" ? savePercentVsStarter(item) : null;
                const busy = loadingId === item.product_id;
                const features = item.features || [];

                const ctaLabel = (() => {
                  if (isFree) return "Free Plan";
                  if (item.group === "credits") return "Buy now";
                  return "Subscribe now";
                })();

                return (
                  <article
                    key={item.product_id}
                    className="flex h-full flex-col overflow-hidden rounded-3xl"
                    style={{
                      backgroundColor: featured ? ACCENT_SOFT : CARD_BG,
                      boxShadow: featured
                        ? `inset 0 0 0 1px ${ACCENT_BORDER}`
                        : undefined,
                    }}
                  >
                    <div
                      className="flex h-8 shrink-0 items-center justify-center text-[12px] font-semibold text-white"
                      style={{
                        backgroundColor: featured ? ACCENT : "transparent",
                      }}
                      aria-hidden={!featured}
                    >
                      {featured ? "Best Value" : "\u00A0"}
                    </div>

                    {/*
                      Fixed-height header + mt-auto CTA — same pattern as
                      videotranscriber.ai (all buttons share one baseline).
                    */}
                    <div className="flex min-h-[248px] flex-col px-4 pt-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[18px] font-bold tracking-tight">
                          {item.title}
                        </h3>
                        {view === "year" && !isFree && item.original_price ? (
                          <span
                            className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                            style={{
                              backgroundColor: "#FACC15",
                              color: "#1F2937",
                            }}
                          >
                            Save ~40%
                          </span>
                        ) : null}
                      </div>

                      <p
                        className="mt-1 min-h-[36px] text-[12px] leading-snug"
                        style={{ color: MUTED }}
                      >
                        {item.group === "credits"
                          ? `${item.credits.toLocaleString()} minutes · ${item.valid_months || 3}-mo validity`
                          : isFree
                            ? "90 minutes / month · no card"
                            : item.interval === "year"
                              ? `${item.credits.toLocaleString()} min / mo · yearly`
                              : `${item.credits.toLocaleString()} min / month`}
                      </p>

                      <div className="mt-3 flex min-h-[40px] items-end gap-1.5">
                        {item.original_price && view === "year" ? (
                          <span
                            className="mb-0.5 text-[14px] font-medium line-through"
                            style={{ color: "#9CA3AF" }}
                          >
                            {item.original_price}
                          </span>
                        ) : null}
                        <p
                          className="font-black tabular-nums tracking-tight"
                          style={{
                            fontSize: "2rem",
                            lineHeight: 1,
                            color: INK,
                          }}
                        >
                          {item.price}
                        </p>
                        <span
                          className="mb-0.5 text-[13px]"
                          style={{ color: MUTED }}
                        >
                          {item.group === "credits" ? "one-off" : "/ month"}
                        </span>
                      </div>

                      <div className="mt-1 flex min-h-[40px] flex-col justify-start gap-0.5 text-[12px] leading-snug">
                        <span
                          className="min-h-[16px] font-medium"
                          style={{ color: ACCENT }}
                        >
                          {item.interval === "year" && item.tip
                            ? item.tip
                            : "\u00A0"}
                        </span>
                        <span style={{ color: MUTED }}>
                          {isFree
                            ? "Try before you upgrade"
                            : `${perCreditLabel(item)} per minute`}
                          {save ? ` · save ${save}%` : ""}
                        </span>
                      </div>

                      <div className="mt-auto pt-4">
                        {isFree ? (
                          <button
                            type="button"
                            disabled
                            className="inline-flex h-11 w-full cursor-not-allowed items-center justify-center rounded-lg text-[15px] font-medium text-black"
                            style={{ backgroundColor: "#D7D7DB" }}
                          >
                            {ctaLabel}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={busy || Boolean(loadingId)}
                            onClick={() => void checkout(item)}
                            className="inline-flex h-11 w-full items-center justify-center rounded-lg text-[15px] font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
                            style={
                              featured
                                ? {
                                    backgroundColor: ACCENT,
                                    color: "#fff",
                                    border: `1px solid ${ACCENT}`,
                                  }
                                : {
                                    backgroundColor: "#fff",
                                    color: "#475569",
                                    border: "1px solid #D2D6DC",
                                  }
                            }
                          >
                            {busy ? (
                              <Loader className="h-4 w-4 animate-spin" />
                            ) : (
                              ctaLabel
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <ul className="mt-1 space-y-2.5 px-4 pb-5 pt-4">
                      {features.map((line) => (
                        <li
                          key={line}
                          className="flex items-start gap-2 text-[13px] leading-snug"
                          style={{ color: "#374151" }}
                        >
                          <Check />
                          <span>
                            <FeatureText text={line} accent={ACCENT} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
