"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader } from "lucide-react";
import { toast } from "sonner";
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
    q: "What does one credit buy?",
    a: "One credit converts one photo into DXF, SVG, and PDF. Retries use another credit. Failed jobs are refunded automatically.",
  },
  {
    q: "Should I subscribe or buy a pack?",
    a: "Subscribe if you convert regularly — the unit price is lower than any pack, and yearly billing saves two months. Buy a pack if you do not want a recurring plan. Pack credits cost more per conversion and expire after 12 months.",
  },
  {
    q: "Do unused credits roll over?",
    a: "Monthly credits expire 30 days after they arrive. Yearly plans are billed once a year; credits arrive each month and expire 12 months after they arrive. Pack credits expire 12 months after purchase.",
  },
  {
    q: "Can I use the drawings commercially?",
    a: "Yes. You own the files you download — CAD, laser, vinyl, or print.",
  },
  {
    q: "Do I need a card to try it?",
    a: "No. New accounts get 3 free conversions. Sign in with email or Google.",
  },
  {
    q: "Can I cancel a subscription?",
    a: "Yes. Cancel anytime. You keep the remaining allowance until the period ends. You can still buy a pack if you run out mid-cycle.",
  },
];

export default function FaceRatingPricingPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const { data: session, status: sessionStatus } = useSession();
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
  const subs = useMemo(
    () =>
      CONVERT_PRICING_ITEMS.filter(
        (item) => item.group === "subscription" && item.interval === subInterval
      ),
    [subInterval]
  );

  async function checkout(item: PricingItem) {
    if (!loggedIn) {
      window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent("/pricing")}`;
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
        window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent("/pricing")}`;
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

  const cards = tab === "packs" ? packs : subs;

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
            One credit, one{" "}
            <span className="font-serif font-normal italic" style={{ color: V.accentItalic }}>
              conversion
            </span>
            .
          </h1>
          <p
            className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed sm:text-[17px]"
            style={{ color: V.muted }}
          >
            New accounts start with 3 free credits, no card needed. Subscribe
            for a lower rate per conversion, or buy a pack if you only convert
            now and then.
          </p>

          <div
            className="mx-auto mt-10 grid max-w-3xl grid-cols-3 overflow-hidden rounded-[16px]"
            style={{ backgroundColor: V.accentTint }}
          >
            {[
              { value: "3 free", label: "conversions to start" },
              { value: "1 credit", label: "per convert · DXF, SVG, PDF" },
              { value: "Yearly", label: "two months free" },
            ].map((s, i) => (
              <div
                key={s.label}
                className="px-3 py-5 sm:px-6 sm:py-6"
                style={{
                  borderLeft: i === 0 ? undefined : "1px solid rgba(159,18,57,0.12)",
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
                ["subscription", "Subscription"],
                ["packs", "Credit packs"],
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
              ? "No subscription. Credits expire after 12 months."
              : "Lower price per conversion than packs. Monthly credits expire after 30 days; yearly credits arrive each month."}
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
                <span className="ml-1.5 text-[11px] font-medium" style={{ color: subInterval === "year" ? "#FECACA" : V.accent }}>
                  2 months free
                </span>
              </button>
            </div>
          ) : null}
        </section>

        <section className="mx-auto mt-8 max-w-[1152px] px-5 sm:px-8">
          <div
            className={`grid gap-4 ${
              cards.length === 4
                ? "md:grid-cols-2 xl:grid-cols-4"
                : "md:grid-cols-3"
            }`}
          >
            {cards.map((item) => {
              const featured = item.is_featured;
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
                        ? `${item.credits} credits · use within 12 months`
                        : item.interval === "year"
                          ? `${item.credits} credits / month · expire after 12 months`
                          : `${item.credits} credits / month · expire after 30 days`}
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
                      {perCreditLabel(item)} per conversion
                      {save ? ` · save ${save}%` : ""}
                      {item.interval === "year" && item.tip ? ` · ${item.tip}` : ""}
                    </p>

                    <button
                      type="button"
                      disabled={busy || Boolean(loadingId)}
                      onClick={() => checkout(item)}
                      className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full text-[14px] font-semibold text-white transition-colors hover:bg-[#881337] disabled:opacity-60"
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
                Convert 3 photos free — no card
              </h2>
              <p className="mt-2 max-w-xl text-[14px] leading-relaxed" style={{ color: V.muted }}>
                Sign in with email or Google. Each conversion uses 1 credit and
                returns DXF, SVG, and PDF.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-full px-6 text-[14px] font-semibold text-white transition-colors hover:bg-[#881337]"
              style={{ backgroundColor: V.accent }}
            >
              Upload a photo
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
