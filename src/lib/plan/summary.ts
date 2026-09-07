import {
  CONVERT_PRICING_ITEMS,
  monthlyCreditsForProduct,
} from "@/lib/convert/pricing-catalog";

export type PlanTier = "FREE" | "BASIC" | "STANDARD" | "PRO";

export const FREE_DAILY_FILE_LIMIT = 1;
export const FREE_MONTHLY_MINUTES = 90;
/** Free plan: max length per file (matches pricing FAQ). */
export const FREE_MAX_FILE_MINUTES = 30;

export function planTierFromProductId(
  productId: string | null | undefined,
): PlanTier | null {
  const id = (productId || "").toLowerCase();
  if (!id) return null;
  if (id.startsWith("basic_")) return "BASIC";
  if (id.startsWith("standard_")) return "STANDARD";
  if (id.startsWith("pro_")) return "PRO";
  return null;
}

export function isMinutePackProductId(productId: string | null | undefined) {
  return String(productId || "")
    .toLowerCase()
    .startsWith("minutes_");
}

export function freePlanMinutes() {
  return (
    CONVERT_PRICING_ITEMS.find((p) => p.product_id === "free")?.credits ||
    FREE_MONTHLY_MINUTES
  );
}

export function allotmentForProductId(productId: string | null | undefined) {
  const fromHelper = monthlyCreditsForProduct(productId);
  if (fromHelper) return fromHelper;
  const hit = CONVERT_PRICING_ITEMS.find((p) => p.product_id === productId);
  return hit?.credits || 0;
}

export type PlanSummary = {
  tier: PlanTier;
  /** Display badge: FREE / BASIC / STANDARD / PRO / PACK */
  badge: "FREE" | "BASIC" | "STANDARD" | "PRO" | "PACK";
  productId: string | null;
  productName: string | null;
  interval: "month" | "year" | "one-time" | null;
  isPackOnly: boolean;
  isRecharged: boolean;
  dailyFiles: {
    used: number;
    limit: number | null;
  };
  minutes: {
    used: number;
    total: number;
    left: number;
  };
};
