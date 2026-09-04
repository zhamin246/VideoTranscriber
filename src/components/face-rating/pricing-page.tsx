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

type Tab = "packs" | "subscription";
type SubInterval = "month" | "year";

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
    a: "Free includes 90 minutes per month, up to 3 files per day, and 30 minutes per file. No card required. Upgrade anytime if you need more volume or AI features.",
  },
  {
    q: "Should I subscribe or buy a minute pack?",
    a: "Subscribe if you transcribe regularly — the per-minute rate is lower. Buy a pack to top up any paid plan or if you prefer not to subscribe. Pack minutes expire 12 months after purchase.",
  },
  {
    q: "Do unused minutes roll over?",
    a: "Monthly plan minutes expire at the end of the billing month. Yearly plans are billed once a year; minutes refresh each month. Pack minutes expire 12 months after purchase.",
  },
  {
    q: "What happens if I run out of minutes?",
    a: "You can buy a minute pack anytime ($5 / 500 min, $10 / 1,000 min, or $25 / 3,000 min). We do not offer true unlimited Whisper — that keeps pricing sustainable.",
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

  const [tab, setTab] = useState<Tab>("subscription");
  const [subInterval, setSubInterval] = useState<SubInterval>("year");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "packs") setTab("packs");
    if (params.get("tab") === "subscription") setTab("subscription");
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
          item.interval === subInterval
      ),
    [subInterval]
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

  const cards = tab === "packs" ? packs : freePlan ? [freePlan, ...subs] : subs;

  return (
    <div
      className="flex min-h-screen flex-col font-sans antialiased"
      style={{ backgroundColor: V.bg, color: V.ink }}
    >
      <FaceRatingSiteHeader />

      <main className="flex-1">
        <section className="mx-auto max-w-[1152px] px-5 pb-4 pt-14 text-center sm:px-8 sm:pt-16">
          <p
            className="text-[12px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: V.accent }}
          >
            Pricing
          </p>
          <h1
            className="mt-4 font-black tracking-tight"
            style={{
              fontSize: "clamp(2rem, 4.2vw, 3.25rem)",
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
            }}
          >
            Simple plans by the{" "}
            <span className="font-serif font-normal italic" style={{ color: V.accentItalic }}>
              minute
            </span>
            .
          </h1>
          <p
            className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed sm:text-[17px]"
            style={{ color: V.muted }}
          >
            Start free with 90 minutes. Upgrade for more volume, speaker labels,
            and AI notes. Yearly billing saves about a third.
          </p>

          <div
            className="mx-auto mt-10 grid max-w-3xl grid-cols-3 overflow-hidden rounded-[16px]"
            style={{ backgroundColor: V.accentTint }}
          >
            {[
              { value: "90 free", label: "minutes every month" },
              { value: "1 min", label: "≈ 1 Whisper minute" },
              { value: "Yearly", label: "save ~33%" },
            ].map((s, i) => (
              <div
                key={s.label}
                className="px-3 py-5 sm:px-6 sm:py-6"
                style={{
                  borderLeft: i === 0 ? undefined : "1px solid rgba(136,130,245,0.18)",
                }}
              >
                <p
                  className="font-black tracking-tight"
                  style={{ fontSize: "clamp(1.1rem, 2.2vw, 1.5rem)", color: V.accent }}
                >
                  {s.value}
                </p>
                <p className="mt-1 text-[11px] sm:text-[12px]" style={{ color: V.muted }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-10 inline-flex rounded-full p-1" style={{ backgroundColor: V.surfaceAlt }}>
            {(
              [
                ["subscription", "Plans"],
                ["packs", "Minute packs"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className="rounded-full px-5 py-2 text-[14px] font-semibold transition-colors"
                style={
                  tab === id
                    ? { backgroundColor: V.accent, color: "#fff" }
                    : { color: V.muted }
                }
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[13px]" style={{ color: V.muted }}>
            {tab === "packs"
              ? "Top up any paid plan. Pack minutes expire after 12 months."
              : "Minute pools refresh monthly. Captions-first when available."}
          </p>

          {tab === "subscription" ? (
            <div className="mt-6 inline-flex rounded-full border p-1" style={{ borderColor: V.line }}>
              <button
                type="button"
                onClick={() => setSubInterval("month")}
                className="rounded-full px-4 py-1.5 text-[13px] font-semibold"
                style={
                  subInterval === "month"
                    ? { backgroundColor: V.ink, color: "#fff" }
                    : { color: V.muted }
                }
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setSubInterval("year")}
                className="rounded-full px-4 py-1.5 text-[13px] font-semibold"
                style={
                  subInterval === "year"
                    ? { backgroundColor: V.ink, color: "#fff" }
                    : { color: V.muted }
                }
              >
                Yearly
                <span
                  className="ml-1.5 text-[11px] font-medium"
                  style={{ color: subInterval === "year" ? "#C4B5FD" : V.accent }}
                >
                  Save ~33%
                </span>
              </button>
            </div>
          ) : null}
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
                  className="relative flex flex-col overflow-hidden rounded-[16px] border bg-white"
                  style={{
                    borderColor: featured ? V.accent : V.line,
                    borderWidth: featured ? 2 : 1,
                  }}
                >
                  {featured ? (
                    <div
                      className="px-5 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-white"
                      style={{ backgroundColor: V.accent }}
                    >
                      Most popular
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col px-5 pb-5 pt-6">
                    <h2 className="text-[18px] font-bold tracking-tight">{item.title}</h2>
                    <p className="mt-1 text-[13px]" style={{ color: V.muted }}>
                      {item.group === "credits"
                        ? `${item.credits.toLocaleString()} minutes · use within 12 months`
                        : isFree
                          ? "90 minutes / month · no card"
                          : item.interval === "year"
                            ? `${item.credits.toLocaleString()} minutes / month · billed yearly`
                            : `${item.credits.toLocaleString()} minutes / month`}
                    </p>
                    <div className="mt-4 flex items-end gap-1.5">
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
                        style={{ fontSize: "2rem", lineHeight: 1, color: V.ink }}
                      >
                        {item.price}
                      </p>
                      <span className="mb-1 text-[13px]" style={{ color: V.muted }}>
                        {item.group === "credits" ? "one-off" : "/ month"}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px]" style={{ color: V.muted }}>
                      {isFree
                        ? "Try before you upgrade"
                        : `${perCreditLabel(item)} per minute`}
                      {save ? ` · save ${save}%` : ""}
                      {item.interval === "year" && item.tip ? ` · ${item.tip}` : ""}
                    </p>

                    {isFree ? (
                      <Link
                        href="/"
                        className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full text-[14px] font-semibold transition-colors"
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
                        className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full text-[14px] font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-60"
                        style={{ backgroundColor: V.accent }}
                      >
                        {busy ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : item.group === "credits" ? (
                          `Buy now · ${item.price}`
                        ) : (
                          `Subscribe · ${item.price}`
                        )}
                      </button>
                    )}

                    <ul className="mt-5 space-y-2.5">
                      {item.features.map((line) => (
                        <li key={line} className="flex items-start gap-2 text-[13px] leading-snug">
                          <Check />
                          <span>{line}</span>
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
  );
}
