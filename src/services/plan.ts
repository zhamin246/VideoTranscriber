import {
  allotmentForProductId,
  FREE_DAILY_FILE_LIMIT,
  FREE_MAX_FILE_MINUTES,
  freePlanMinutes,
  isMinutePackProductId,
  planTierFromProductId,
  type PlanSummary,
  type PlanTier,
} from "@/lib/plan/summary";
import {
  getActiveSubscriptionOrder,
  getFirstPaidOrderByUserUuid,
  getLatestPaidPackOrder,
} from "@/models/order";
import { countWorkspacesCreatedToday } from "@/models/workspace";
import { getUserCredits } from "@/services/credit";

export class PlanLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanLimitError";
  }
}

/** Minutes billed for a job: ceil(audio seconds / 60), min 1. */
export function billableMinutes(
  durationSeconds?: number | null,
  segments?: { startSeconds: number }[] | null,
): number {
  let secs =
    typeof durationSeconds === "number" && Number.isFinite(durationSeconds)
      ? Math.max(0, durationSeconds)
      : 0;
  if (segments?.length) {
    const maxStart = Math.max(
      ...segments.map((s) => Number(s.startSeconds) || 0),
    );
    secs = Math.max(secs, maxStart + 3);
  }
  if (secs <= 0) return 1;
  return Math.max(1, Math.ceil(secs / 60));
}

/** Gate before starting Whisper: daily file cap + remaining minutes. */
export async function assertCanStartTranscription(
  user_uuid: string,
  opts?: { durationSeconds?: number | null },
): Promise<PlanSummary> {
  const plan = await getPlanSummary(user_uuid);

  if (
    plan.dailyFiles.limit != null &&
    plan.dailyFiles.used >= plan.dailyFiles.limit
  ) {
    throw new PlanLimitError(
      `Free plan allows ${plan.dailyFiles.limit} file per day. Upgrade or try again tomorrow.`,
    );
  }

  if (plan.minutes.left < 1) {
    throw new PlanLimitError(
      "Not enough transcription minutes. Upgrade your plan or buy a minute pack.",
    );
  }

  const isFreePool =
    plan.badge === "FREE" && !plan.isPackOnly && plan.tier === "FREE";
  const dur = opts?.durationSeconds;
  if (
    isFreePool &&
    typeof dur === "number" &&
    dur > FREE_MAX_FILE_MINUTES * 60
  ) {
    throw new PlanLimitError(
      `Free plan allows up to ${FREE_MAX_FILE_MINUTES} minutes per file. Trim the clip or upgrade.`,
    );
  }

  if (typeof dur === "number" && dur > 0) {
    const need = billableMinutes(dur);
    if (plan.minutes.left < need) {
      throw new PlanLimitError(
        `This file needs about ${need} minutes, but you only have ${plan.minutes.left} left. Upgrade or buy a pack.`,
      );
    }
  }

  return plan;
}

export async function getPlanSummary(user_uuid: string): Promise<PlanSummary> {
  const [credits, dailyUsed, subOrder, packOrder, firstPaid] =
    await Promise.all([
      getUserCredits(user_uuid),
      countWorkspacesCreatedToday(user_uuid),
      getActiveSubscriptionOrder(user_uuid),
      getLatestPaidPackOrder(user_uuid),
      getFirstPaidOrderByUserUuid(user_uuid),
    ]);

  const left = Math.max(0, credits.left_credits || 0);
  const isRecharged = Boolean(firstPaid || credits.is_recharged);

  if (subOrder) {
    const tier: PlanTier =
      planTierFromProductId(subOrder.product_id) || "BASIC";
    const total =
      allotmentForProductId(subOrder.product_id) ||
      Number(subOrder.credits || 0) ||
      freePlanMinutes();
    const used = Math.min(total, Math.max(0, total - Math.min(left, total)));
    return {
      tier,
      badge: tier,
      productId: subOrder.product_id || null,
      productName: subOrder.product_name || null,
      interval:
        subOrder.interval === "year"
          ? "year"
          : subOrder.interval === "month"
            ? "month"
            : null,
      isPackOnly: false,
      isRecharged: true,
      dailyFiles: { used: dailyUsed, limit: null },
      minutes: { used, total, left },
    };
  }

  if (packOrder && isMinutePackProductId(packOrder.product_id)) {
    const packTotal =
      allotmentForProductId(packOrder.product_id) ||
      Number(packOrder.credits || 0) ||
      left;
    const total = Math.max(packTotal, left, 1);
    const used = Math.min(total, Math.max(0, total - left));
    return {
      tier: "FREE",
      badge: "PACK",
      productId: packOrder.product_id || null,
      productName: packOrder.product_name || null,
      interval: "one-time",
      isPackOnly: true,
      isRecharged: true,
      dailyFiles: { used: dailyUsed, limit: null },
      minutes: { used, total, left },
    };
  }

  const total = freePlanMinutes();
  const used = Math.min(total, Math.max(0, total - Math.min(left, total)));
  return {
    tier: "FREE",
    badge: "FREE",
    productId: "free",
    productName: "Free",
    interval: "month",
    isPackOnly: false,
    isRecharged,
    dailyFiles: {
      used: dailyUsed,
      limit: FREE_DAILY_FILE_LIMIT,
    },
    minutes: { used, total, left },
  };
}
