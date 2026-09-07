import type { Pricing, PricingItem } from "@/types/blocks/pricing";
import type { PricingPage } from "@/types/pages/landing";

const USD = "USD";

const COMMON_FEATURES = [
  "200+ languages",
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
  /** Pack validity in months (3 months for all one-time packs). */
  valid_months: 3 | 6 | 12;
  featured?: boolean;
  tip?: string;
  description?: string;
}): PricingItem {
  const validityLabel =
    input.valid_months === 3
      ? "3-month validity"
      : input.valid_months === 6
        ? "6-month validity"
        : "Use within 12 months";
  return {
    title: input.title,
    description:
      input.description ||
      `${input.minutes.toLocaleString()} transcription minutes. ${validityLabel}.`,
    features_title: "Includes",
    features: [
      `${input.minutes.toLocaleString()} minutes total transcription`,
      validityLabel,
      `${(input.amount / 100 / input.minutes).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 3,
      })} per minute`,
      "No daily file limit",
      "Premium transcription + AI insights",
      "Speaker identification",
      ...COMMON_FEATURES.slice(0, 2),
      "Priority email support",
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
    valid_months: input.valid_months,
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
  "Up to 1 file per day",
  "Each file up to 30 minutes",
  "Captions-first when available",
  "Basic AI summary",
  ...COMMON_FEATURES.slice(0, 2),
  "Email support",
];

/** Aligned to UniScribe: Basic 1,200 · Standard 3,000 · Pro 6,000 */
const BASIC_FEATURES = [
  "1,200 minutes / month",
  "$10 per 500 extra minutes",
  "No daily file limit",
  "Each file up to 5 hours",
  "Speaker identification",
  "AI Summary & Notes",
  ...COMMON_FEATURES,
  "Priority email support",
];

const STANDARD_FEATURES = [
  "3,000 minutes / month",
  "$15 per 1,000 extra minutes",
  "Everything in Basic",
  "Higher priority processing",
  "Bulk transcription",
  "Enhanced AI insights",
  ...COMMON_FEATURES,
  "Priority email support",
];

const PRO_FEATURES = [
  "6,000 minutes / month",
  "$20 per 3,000 extra minutes",
  "Everything in Standard",
  "Ideal for high-volume users and teams",
  "Bulk transcription",
  "Enhanced AI insights",
  ...COMMON_FEATURES,
  "Priority email support",
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
  // One-time packs — UniScribe Lite / Plus / Max
  packItem({
    title: "Lite",
    product_id: "minutes_300",
    minutes: 300,
    amount: 1290,
    price: "$12.90",
    valid_months: 3,
    tip: "Short-term projects",
    description: "Perfect for short-term projects.",
  }),
  packItem({
    title: "Plus",
    product_id: "minutes_600",
    minutes: 600,
    amount: 1990,
    price: "$19.90",
    valid_months: 3,
    tip: "Short-term projects",
    description: "Perfect for short-term projects.",
  }),
  packItem({
    title: "Max",
    product_id: "minutes_3000",
    minutes: 3000,
    amount: 4990,
    price: "$49.90",
    valid_months: 3,
    featured: true,
    tip: "Best value",
    description: "For professional needs.",
  }),
  subItem({
    title: "Basic",
    product_id: "basic_monthly",
    interval: "month",
    monthlyMinutes: 1200,
    amount: 1000,
    price: "$10",
    features: BASIC_FEATURES,
  }),
  subItem({
    title: "Basic",
    product_id: "basic_yearly",
    interval: "year",
    monthlyMinutes: 1200,
    amount: 7200,
    price: "$6",
    original_price: "$10",
    tip: "$72 billed yearly",
    features: BASIC_FEATURES,
  }),
  subItem({
    title: "Standard",
    product_id: "standard_monthly",
    interval: "month",
    monthlyMinutes: 3000,
    amount: 2000,
    price: "$20",
    featured: true,
    features: STANDARD_FEATURES,
  }),
  subItem({
    title: "Standard",
    product_id: "standard_yearly",
    interval: "year",
    monthlyMinutes: 3000,
    amount: 14400,
    price: "$12",
    original_price: "$20",
    featured: true,
    tip: "$144 billed yearly",
    features: STANDARD_FEATURES,
  }),
  subItem({
    title: "Pro",
    product_id: "pro_monthly",
    interval: "month",
    monthlyMinutes: 6000,
    amount: 3000,
    price: "$30",
    features: PRO_FEATURES,
  }),
  subItem({
    title: "Pro",
    product_id: "pro_yearly",
    interval: "year",
    monthlyMinutes: 6000,
    amount: 21600,
    price: "$18",
    original_price: "$30",
    tip: "$216 billed yearly",
    features: PRO_FEATURES,
  }),
];

export const convertPricing: Pricing = {
  name: "pricing",
  title: "Pricing",
  description:
    "Minute-based plans for video and audio transcription. Captions-first when available; Whisper minutes when you need them.",
  groups: [
    { name: "subscription", title: "Subscriptions", label: "Best value" },
    { name: "credits", title: "Minute packs", label: "One-time" },
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
    (p) => p.product_id === "minutes_300"
  );
  if (!starter || item.product_id === "minutes_300" || !item.credits) {
    return null;
  }
  const starterUnit = starter.amount / starter.credits;
  const unit = item.amount / item.credits;
  if (unit >= starterUnit) return null;
  return Math.round(((starterUnit - unit) / starterUnit) * 100);
}
