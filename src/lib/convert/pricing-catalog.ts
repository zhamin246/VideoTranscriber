import type { Pricing, PricingItem } from "@/types/blocks/pricing";
import type { PricingPage } from "@/types/pages/landing";

const USD = "USD";

const PACK_FEATURES = [
  "Use within 12 months · unused credits expire",
  "DXF, SVG and PDF on every convert",
  "Commercial use",
  "No plan to cancel",
];

function packItem(input: {
  title: string;
  product_id: string;
  credits: number;
  amount: number;
  price: string;
  featured?: boolean;
  tip?: string;
}): PricingItem {
  return {
    title: input.title,
    description: `${input.credits} conversion credits. Use within 12 months.`,
    features_title: "Includes",
    features: [
      `${(input.amount / 100 / input.credits).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      })} per conversion`,
      ...PACK_FEATURES,
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
    product_name: `${input.title} · ${input.credits} credits`,
    credits: input.credits,
    valid_months: 12,
    group: "credits",
    stripe_price_id: `\${process.env.STRIPE_${input.product_id.toUpperCase()}_PRICE_ID}`,
  };
}

function subItem(input: {
  title: string;
  product_id: string;
  interval: "month" | "year";
  monthlyCredits: number;
  amount: number;
  price: string;
  original_price?: string;
  featured?: boolean;
  tip?: string;
  extraFeatures?: string[];
}): PricingItem {
  const credits = input.monthlyCredits;
  const period = input.interval === "year" ? "12 months" : "month";
  return {
    title: input.title,
    description:
      input.interval === "year"
        ? `${credits} credits each month. Each month’s credits expire after 12 months.`
        : `${credits} credits each month. Unused credits expire after 30 days.`,
    features_title: "Includes",
    features: [
      input.interval === "year"
        ? `${credits} credits / month · expire after 12 months`
        : `${credits} credits / month · unused expire after 30 days`,
      "DXF, SVG and PDF on every convert",
      "Conversion history",
      "Commercial use",
      "Cancel anytime",
      ...(input.extraFeatures || []),
    ],
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
    credits,
    valid_months: input.interval === "year" ? 12 : 1,
    group: "subscription",
    stripe_price_id: `\${process.env.STRIPE_${input.product_id.toUpperCase()}_PRICE_ID}`,
  };
}

export const CONVERT_PRICING_ITEMS: PricingItem[] = [
  packItem({
    title: "Starter",
    product_id: "starter_pack",
    credits: 5,
    amount: 999,
    price: "$9.99",
    tip: "Occasional use",
  }),
  packItem({
    title: "Popular",
    product_id: "popular_pack",
    credits: 20,
    amount: 2499,
    price: "$24.99",
    featured: true,
    tip: "Most popular",
  }),
  packItem({
    title: "Plus",
    product_id: "plus_pack",
    credits: 50,
    amount: 4999,
    price: "$49.99",
  }),
  packItem({
    title: "Bulk",
    product_id: "bulk_pack",
    credits: 100,
    amount: 8999,
    price: "$89.99",
  }),
  subItem({
    title: "Hobby",
    product_id: "hobby_monthly",
    interval: "month",
    monthlyCredits: 20,
    amount: 1500,
    price: "$15",
  }),
  subItem({
    title: "Hobby",
    product_id: "hobby_yearly",
    interval: "year",
    monthlyCredits: 20,
    amount: 15000,
    price: "$12.50",
    original_price: "$15",
    tip: "$150 billed yearly",
  }),
  subItem({
    title: "Pro",
    product_id: "pro_monthly",
    interval: "month",
    monthlyCredits: 60,
    amount: 2900,
    price: "$29",
    featured: true,
    extraFeatures: ["Priority processing", "Email support"],
  }),
  subItem({
    title: "Pro",
    product_id: "pro_yearly",
    interval: "year",
    monthlyCredits: 60,
    amount: 29000,
    price: "$24.17",
    original_price: "$29",
    featured: true,
    tip: "$290 billed yearly",
    extraFeatures: ["Priority processing", "Email support"],
  }),
  subItem({
    title: "Studio",
    product_id: "studio_monthly",
    interval: "month",
    monthlyCredits: 200,
    amount: 7900,
    price: "$79",
    extraFeatures: ["Priority processing", "Email support", "Priority support"],
  }),
  subItem({
    title: "Studio",
    product_id: "studio_yearly",
    interval: "year",
    monthlyCredits: 200,
    amount: 79000,
    price: "$65.83",
    original_price: "$79",
    tip: "$790 billed yearly",
    extraFeatures: ["Priority processing", "Email support", "Priority support"],
  }),
];

export const convertPricing: Pricing = {
  name: "pricing",
  title: "Pricing",
  description:
    "One credit, one conversion. Subscribe for a lower rate, or buy a pack that expires in 12 months.",
  groups: [
    { name: "subscription", title: "Subscriptions", label: "Best value" },
    { name: "credits", title: "Credit packs", label: "No subscription" },
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

/** Credits billed in the paid period. Yearly is granted monthly but priced for 12 months. */
export function billedCreditCount(item: PricingItem): number {
  if (item.interval === "year") return item.credits * 12;
  return item.credits;
}

export function perCreditLabel(item: PricingItem): string {
  const dollars = item.amount / 100 / billedCreditCount(item);
  return dollars.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
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
  const starter = CONVERT_PRICING_ITEMS.find((p) => p.product_id === "starter_pack");
  if (!starter || item.product_id === "starter_pack") return null;
  const starterUnit = starter.amount / starter.credits;
  const unit = item.amount / item.credits;
  if (unit >= starterUnit) return null;
  return Math.round(((starterUnit - unit) / starterUnit) * 100);
}
