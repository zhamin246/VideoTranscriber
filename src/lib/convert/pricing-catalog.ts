import type { Pricing, PricingItem } from "@/types/blocks/pricing";
import type { PricingPage } from "@/types/pages/landing";

const USD = "USD";

const COMMON_FEATURES = [
  "63+ languages",
  "TXT, SRT, VTT, PDF export",
  "YouTube / TikTok / link transcription",
  "Cancel anytime",
];

function packItem(input: {
  title: string;
  product_id: string;
  minutes: number;
  amount: number;
  price: string;
  featured?: boolean;
  tip?: string;
}): PricingItem {
  return {
    title: input.title,
    description: `${input.minutes.toLocaleString()} transcription minutes. Use within 12 months.`,
    features_title: "Includes",
    features: [
      `${(input.amount / 100 / input.minutes).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 3,
      })} per minute`,
      "Add-on minutes for any paid plan",
      "Use within 12 months · unused minutes expire",
      "No plan to cancel",
    ],
    interval: "one-time",
    amount: input.amount,
    currency: USD,
    price: input.price,
    unit: "one-off",
    is_featured: Boolean(input.featured),
    tip: input.tip,
    button: { title: "Buy now", url: "/pricing", icon: "" },
    product_id: input.product_id,
    product_name: `${input.title} · ${input.minutes} minutes`,
    credits: input.minutes,
    valid_months: 12,
    group: "credits",
    stripe_price_id: `\${process.env.STRIPE_${input.product_id.toUpperCase()}_PRICE_ID}`,
  };
}

function subItem(input: {
  title: string;
  product_id: string;
  interval: "month" | "year";
  monthlyMinutes: number;
  amount: number;
  price: string;
  original_price?: string;
  featured?: boolean;
  tip?: string;
  description?: string;
  features: string[];
}): PricingItem {
  const minutes = input.monthlyMinutes;
  const period = input.interval === "year" ? "12 months" : "month";
  return {
    title: input.title,
    description:
      input.description ||
      (input.interval === "year"
        ? `${minutes.toLocaleString()} minutes each month. Billed yearly.`
        : `${minutes.toLocaleString()} minutes each month.`),
    features_title: "Includes",
    features: input.features,
    interval: input.interval,
    amount: input.amount,
    currency: USD,
    price: input.price,
    original_price: input.original_price,
    unit: input.interval === "year" ? "/ year" : "/ month",
    is_featured: Boolean(input.featured),
    tip: input.tip,
    button: { title: "Subscribe", url: "/pricing", icon: "" },
    product_id: input.product_id,
    product_name: `${input.title} ${period}`,
    credits: minutes,
    valid_months: input.interval === "year" ? 12 : 1,
    group: "subscription",
    stripe_price_id: `\${process.env.STRIPE_${input.product_id.toUpperCase()}_PRICE_ID}`,
  };
}

const FREE_FEATURES = [
  "90 minutes / month",
  "Up to 3 files per day",
  "Each file up to 30 minutes",
  "Captions-first when available",
  "Basic AI summary",
  ...COMMON_FEATURES.slice(0, 2),
  "Email support",
];

const BASIC_FEATURES = [
  "1,200 minutes / month",
  "$5 per 500 extra minutes",
  "No daily file limit",
  "Each file up to 5 hours",
  "Speaker identification",
  "AI Summary & Notes",
  ...COMMON_FEATURES,
  "Priority email support",
];

const PRO_FEATURES = [
  "4,000 minutes / month",
  "$10 per 1,000 extra minutes",
  "Everything in Basic",
  "Higher priority processing",
  "Bulk transcription",
  "Enhanced AI insights",
  ...COMMON_FEATURES,
  "Priority email support",
];

const STUDIO_FEATURES = [
  "10,000 minutes / month",
  "Everything in Pro",
  "3–5 team seats",
  "Shared workspace for teams",
  "Priority support",
  ...COMMON_FEATURES,
];

export const CONVERT_PRICING_ITEMS: PricingItem[] = [
  {
    title: "Free",
    description: "Try Video Transcriber — no card required.",
    features_title: "Includes",
    features: FREE_FEATURES,
    interval: "month",
    amount: 0,
    currency: USD,
    price: "$0",
    unit: "/ month",
    is_featured: false,
    tip: "No card needed",
    button: { title: "Get started", url: "/", icon: "" },
    product_id: "free",
    product_name: "Free",
    credits: 90,
    valid_months: 1,
    group: "subscription",
  },
  packItem({
    title: "500 minutes",
    product_id: "minutes_500",
    minutes: 500,
    amount: 500,
    price: "$5",
    tip: "Top-up pack",
  }),
  packItem({
    title: "1,000 minutes",
    product_id: "minutes_1000",
    minutes: 1000,
    amount: 1000,
    price: "$10",
    featured: true,
    tip: "Best top-up",
  }),
  packItem({
    title: "3,000 minutes",
    product_id: "minutes_3000",
    minutes: 3000,
    amount: 2500,
    price: "$25",
    tip: "Heavy users",
  }),
  subItem({
    title: "Basic",
    product_id: "basic_monthly",
    interval: "month",
    monthlyMinutes: 1200,
    amount: 900,
    price: "$9",
    features: BASIC_FEATURES,
  }),
  subItem({
    title: "Basic",
    product_id: "basic_yearly",
    interval: "year",
    monthlyMinutes: 1200,
    amount: 7200,
    price: "$6",
    original_price: "$9",
    tip: "$72 billed yearly",
    features: BASIC_FEATURES,
  }),
  subItem({
    title: "Pro",
    product_id: "pro_monthly",
    interval: "month",
    monthlyMinutes: 4000,
    amount: 1900,
    price: "$19",
    featured: true,
    features: PRO_FEATURES,
  }),
  subItem({
    title: "Pro",
    product_id: "pro_yearly",
    interval: "year",
    monthlyMinutes: 4000,
    amount: 14400,
    price: "$12",
    original_price: "$19",
    featured: true,
    tip: "$144 billed yearly",
    features: PRO_FEATURES,
  }),
  subItem({
    title: "Studio",
    product_id: "studio_monthly",
    interval: "month",
    monthlyMinutes: 10000,
    amount: 3900,
    price: "$39",
    features: STUDIO_FEATURES,
  }),
  subItem({
    title: "Studio",
    product_id: "studio_yearly",
    interval: "year",
    monthlyMinutes: 10000,
    amount: 28800,
    price: "$24",
    original_price: "$39",
    tip: "$288 billed yearly",
    features: STUDIO_FEATURES,
  }),
];

export const convertPricing: Pricing = {
  name: "pricing",
  title: "Pricing",
  description:
    "Minute-based plans for video and audio transcription. Captions-first when available; Whisper minutes when you need them.",
  groups: [
    { name: "subscription", title: "Subscriptions", label: "Best value" },
    { name: "credits", title: "Minute packs", label: "Top-ups" },
  ],
  items: CONVERT_PRICING_ITEMS,
};

export function getConvertPricingPage(): PricingPage {
  return {
    title: "Pricing",
    description: convertPricing.description,
    pricing: convertPricing,
  };
}

/** Minutes billed in the paid period. Yearly is granted monthly but priced for 12 months. */
export function billedCreditCount(item: PricingItem): number {
  if (item.interval === "year") return item.credits * 12;
  return item.credits;
}

export function perCreditLabel(item: PricingItem): string {
  if (!item.amount || !item.credits) return "$0";
  const dollars = item.amount / 100 / billedCreditCount(item);
  return dollars.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 3,
  });
}

export function monthlyCreditsForProduct(
  productId: string | null | undefined
): number | null {
  if (!productId) return null;
  const item = CONVERT_PRICING_ITEMS.find((p) => p.product_id === productId);
  if (!item || item.group !== "subscription") return null;
  return item.credits;
}

export function savePercentVsStarter(item: PricingItem): number | null {
  const starter = CONVERT_PRICING_ITEMS.find(
    (p) => p.product_id === "minutes_500"
  );
  if (!starter || item.product_id === "minutes_500" || !item.credits) {
    return null;
  }
  const starterUnit = starter.amount / starter.credits;
  const unit = item.amount / item.credits;
  if (unit >= starterUnit) return null;
  return Math.round(((starterUnit - unit) / starterUnit) * 100);
}
