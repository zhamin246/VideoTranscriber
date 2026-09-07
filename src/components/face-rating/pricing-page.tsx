"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader } from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "@/contexts/app";
import FaceRatingSiteHeader from "./site-header";
import FaceRatingSiteFooter from "./site-footer";
import WorkspaceNav from "./workspace-nav";
import { V } from "./visual";
import {
  CONVERT_PRICING_ITEMS,
  perCreditLabel,
  savePercentVsStarter,
} from "@/lib/convert/pricing-catalog";
import type { PricingItem } from "@/types/blocks/pricing";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FeatureText } from "./feature-text";

type View = "month" | "year" | "packs";

function Check() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      className="mt-0.5 shrink-0"
      aria-hidden
      style={{ color: V.accent }}
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

const FAQS = [
  {
    q: "How do minutes work?",
    a: "Paid plans include a monthly pool of transcription minutes. Audio length counts 1:1 when we run Whisper. When a video already has captions, we prefer that path and may charge little or nothing against your pool.",
  },
  {
    q: "What is the Free plan?",
    a: "Free includes 90 minutes per month, up to 1 file per day, and 30 minutes per file. No card required. Upgrade anytime if you need more volume or AI features.",
  },
  {
    q: "Should I subscribe or buy a minute pack?",
    a: "Subscribe if you transcribe regularly — the per-minute rate is lower. Buy a one-time pack (Lite / Plus / Max) if you prefer not to subscribe. Pack minutes expire after 3 months.",
  },
  {
    q: "Do unused minutes roll over?",
    a: "Monthly plan minutes expire at the end of the billing month. Yearly plans are billed once a year; minutes refresh each month. One-time packs expire after 3 months.",
  },
  {
    q: "What happens if I run out of minutes?",
    a: "You can buy a one-time pack anytime ($12.90 / 300, $19.90 / 600, or $49.90 / 3,000), or use in-plan extras ($10 / 500 on Basic, $15 / 1,000 on Standard, $20 / 3,000 on Pro). We do not offer true unlimited Whisper — that keeps pricing sustainable.",
  },
  {
    q: "Can I cancel a subscription?",
    a: "Yes. Cancel anytime. You keep remaining minutes until the period ends. You can still buy a pack if you need more mid-cycle.",
  },
];

export default function FaceRatingPricingPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const { data: session, status: sessionStatus } = useSession();
  const { setShowSignModal } = useAppContext();
  const loggedIn = sessionStatus === "authenticated" && Boolean(session?.user?.email);

  const [view, setView] = useState<View>("year");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "packs") setView("packs");
    else if (tab === "month" || tab === "monthly") setView("month");
    else if (tab === "year" || tab === "yearly" || tab === "subscription") {
      setView("year");
    }
  }, []);

  const packs = useMemo(
    () => CONVERT_PRICING_ITEMS.filter((item) => item.group === "credits"),
    []
  );
  const freePlan = useMemo(
    () => CONVERT_PRICING_ITEMS.find((item) => item.product_id === "free"),
    []
  );
  const subs = useMemo(
    () =>
      CONVERT_PRICING_ITEMS.filter(
        (item) =>
          item.group === "subscription" &&
          item.product_id !== "free" &&
          item.interval === (view === "year" ? "year" : "month")
      ),
    [view]
  );

  async function checkout(item: PricingItem) {
    if (item.product_id === "free" || !item.amount) {
      window.location.href = "/";
      return;
    }
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

  const cards = view === "packs" ? packs : freePlan ? [freePlan, ...subs] : subs;

  return (
    <div
      className="flex min-h-screen font-sans antialiased"
      style={{ backgroundColor: V.bg, color: V.ink }}
    >
      <WorkspaceNav />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <FaceRatingSiteHeader hideBrandOnDesktop />

        <main className="flex-1">
        <section className="mx-auto max-w-[1152px] px-5 pb-4 pt-14 text-center sm:px-8 sm:pt-16">
          <p
            className="text-[28px] font-bold tracking-tight sm:text-[32px]"
            style={{ color: V.ink }}
          >
            Pricing Plans
          </p>

          <div className="mx-auto mt-8 inline-flex rounded-full p-1" style={{ backgroundColor: V.surfaceAlt }}>
            {(
              [
                ["month", "Month"],
                ["year", "Year"],
                ["packs", "Minute packs"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                className="rounded-full px-5 py-2 text-[14px] font-semibold transition-colors"
                style={
                  view === id
                    ? { backgroundColor: V.accent, color: "#fff" }
                    : { color: V.muted }
                }
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[13px]" style={{ color: V.muted }}>
            {view === "packs"
              ? "One-time packs · minutes expire after 3 months. Full features included."
              : view === "year"
                ? "Billed yearly · minute pools refresh monthly. Captions-first when available. Save ~40%."
                : "Minute pools refresh monthly. Captions-first when available."}
          </p>
        </section>

        <section className="mx-auto mt-8 max-w-[1152px] px-5 sm:px-8">
          <div
            className={`grid gap-4 ${
              cards.length >= 4
                ? "md:grid-cols-2 xl:grid-cols-4"
                : "md:grid-cols-3"
            }`}
          >
            {cards.map((item) => {
              const featured = item.is_featured;
              const isFree = item.product_id === "free";
              const save = item.group === "credits" ? savePercentVsStarter(item) : null;
              const busy = loadingId === item.product_id;
              return (
                <article
                  key={item.product_id}
                  className="relative flex h-full flex-col overflow-hidden rounded-[16px] border bg-white"
                  style={{
                    borderColor: featured ? V.accent : V.line,
                    borderWidth: featured ? 2 : 1,
                  }}
                >
                  {/* Same-height slot so CTAs stay aligned across cards */}
                  <div
                    className="flex h-8 shrink-0 items-center justify-center text-[11px] font-semibold uppercase tracking-[0.14em] text-white"
                    style={{
                      backgroundColor: featured ? V.accent : "transparent",
                    }}
                    aria-hidden={!featured}
                  >
                    {featured ? "Most popular" : "\u00A0"}
                  </div>
                  <div className="flex flex-1 flex-col px-5 pb-5 pt-5">
                    <div className="flex flex-col">
                      <h2 className="text-[18px] font-bold tracking-tight">
                        {item.title}
                      </h2>
                      <p
                        className="mt-1 min-h-[40px] text-[13px] leading-snug"
                        style={{ color: V.muted }}
                      >
                        {item.group === "credits"
                          ? `${item.credits.toLocaleString()} minutes · use within ${item.valid_months || 3} months`
                          : isFree
                            ? "90 minutes / month · no card"
                            : item.interval === "year"
                              ? `${item.credits.toLocaleString()} minutes / month · billed yearly`
                              : `${item.credits.toLocaleString()} minutes / month`}
                      </p>
                      <div className="mt-4 flex min-h-[40px] items-end gap-1.5">
                        {item.original_price ? (
                          <span
                            className="mb-1 text-[15px] font-medium line-through"
                            style={{ color: "#A1A1AA" }}
                          >
                            {item.original_price}
                          </span>
                        ) : null}
                        <p
                          className="font-black tabular-nums tracking-tight"
                          style={{
                            fontSize: "2rem",
                            lineHeight: 1,
                            color: V.ink,
                          }}
                        >
                          {item.price}
                        </p>
                        <span
                          className="mb-1 text-[13px]"
                          style={{ color: V.muted }}
                        >
                          {item.group === "credits" ? "one-off" : "/ month"}
                        </span>
                      </div>
                      <p
                        className="mt-1 min-h-[40px] text-[13px] leading-snug"
                        style={{ color: V.muted }}
                      >
                        {isFree
                          ? "Try before you upgrade"
                          : `${perCreditLabel(item)} per minute`}
                        {save ? ` · save ${save}%` : ""}
                        {item.interval === "year" && item.tip
                          ? ` · ${item.tip}`
                          : ""}
                      </p>
                    </div>

                    {isFree ? (
                      <Link
                        href="/"
                        className="mt-5 inline-flex h-11 w-full shrink-0 items-center justify-center rounded-full text-[14px] font-semibold transition-colors"
                        style={{
                          backgroundColor: V.surfaceAlt,
                          color: V.ink,
                        }}
                      >
                        Get started free
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled={busy || Boolean(loadingId)}
                        onClick={() => checkout(item)}
                        className="mt-5 inline-flex h-11 w-full shrink-0 items-center justify-center rounded-full text-[14px] font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-60"
                        style={{ backgroundColor: V.accent }}
                      >
                        {busy ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : item.group === "credits" ? (
                          "Buy now"
                        ) : (
                          "Subscribe now"
                        )}
                      </button>
                    )}

                    <ul className="mt-5 space-y-2.5">
                      {item.features.map((line) => (
                        <li
                          key={line}
                          className="flex items-start gap-2 text-[13px] leading-snug"
                          style={{ color: V.inkSoft }}
                        >
                          <Check />
                          <span>
                            <FeatureText text={line} accent={V.accent} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mx-auto mt-12 max-w-[1152px] px-5 sm:px-8">
          <div
            className="flex flex-col gap-6 rounded-[16px] border bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
            style={{ borderColor: V.line }}
          >
            <div>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: V.muted }}
              >
                Try it free
              </p>
              <h2 className="mt-2 text-[22px] font-black tracking-tight sm:text-[24px]">
                90 minutes free every month — no card
              </h2>
              <p className="mt-2 max-w-xl text-[14px] leading-relaxed" style={{ color: V.muted }}>
                Paste a link or upload a file. Captions-first when available;
                Whisper when you need a full transcript.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-full px-6 text-[14px] font-semibold text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: V.accent }}
            >
              Start transcribing
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-[1152px] px-5 sm:px-8">
          <div
            className="mx-auto grid max-w-[1152px] gap-12 py-16 lg:grid-cols-[0.35fr_0.65fr] lg:gap-16 lg:py-20"
          >
            <div>
              <p
                className="text-[12px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: V.accent }}
              >
                FAQ
              </p>
              <h2
                className="mt-3 font-semibold tracking-[-0.025em]"
                style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", lineHeight: 1.15 }}
              >
                Frequently{" "}
                <span className="font-serif font-normal italic" style={{ color: V.accentItalic }}>
                  asked
                </span>
              </h2>
            </div>
            <Accordion type="single" collapsible className="w-full">
              {FAQS.map((item, index) => (
                <AccordionItem
                  key={item.q}
                  value={`faq-${index}`}
                  className="border-b"
                  style={{ borderColor: V.line }}
                >
                  <AccordionTrigger
                    className="py-5 text-left text-[16px] font-medium hover:no-underline"
                    style={{ color: V.ink }}
                  >
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-[15px] leading-relaxed" style={{ color: V.muted }}>
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>

      <FaceRatingSiteFooter />
      </div>
    </div>
  );
}
