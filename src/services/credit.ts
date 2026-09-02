import {
  findCreditByOrderNo,
  findCreditByTransNo,
  getCreditsByUserUuid,
  getCreditsCountByUserUuid,
  getUserValidCredits,
  insertCredit,
} from "@/models/credit";
import { credits as creditsTable } from "@/db/schema";
import {
  creditExpiresAt,
  getIsoTimestr,
  MONTHLY_CREDIT_EXPIRY_DAYS,
  YEARLY_GRANTS_PER_CYCLE,
} from "@/lib/time";
import { getSnowId } from "@/lib/hash";
import { Order } from "@/types/order";
import { CreditLot, CreditRecord, UserCredits } from "@/types/user";
import {
  findOrderByOrderNo,
  getActivePaidYearlyOrders,
  getFirstPaidOrderByUserUuid,
  getOrdersByUserUuid,
  getPaidYearlyOrdersByUserUuid,
} from "@/models/order";
import { monthlyCreditsForProduct } from "@/lib/convert/pricing-catalog";

export enum CreditsTransType {
  NewUser = "new_user",
  OrderPay = "order_pay",
  SystemAdd = "system_add",
  SystemRefund = "system_refund",
  Convert = "convert",
  Ping = "ping",
  VIDEO_GENERATION = "video_generation",
  IMAGE_GENERATION = "image_generation",
}

export enum CreditsAmount {
  NewUserGet = 3,
  ConvertCost = 1,
  PingCost = 1,
}

export class InsufficientCreditsError extends Error {
  constructor() {
    super("Not enough credits. Buy a pack or subscribe.");
    this.name = "InsufficientCreditsError";
  }
}

export function convertChargeTransNo(jobId: string) {
  return `cvt:${jobId}`;
}

export function convertRefundTransNo(jobId: string) {
  return `cvt-refund:${jobId}`;
}

function toIso(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
  }
  const trimmed = String(value).trim();
  return trimmed || undefined;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  for (let i = 0; i < 4 && current; i += 1) {
    const code = (current as { code?: string }).code;
    if (code === "23505") return true;
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}

function yearlyGrantTransNo(
  orderNo: string,
  periodStartUnix: number,
  monthIndex: number
) {
  return `yrgrant:${orderNo}:${periodStartUnix}:${monthIndex}`;
}

function monthlyAllotmentForOrder(order: {
  product_id?: string | null;
  credits?: number | null;
}): number {
  const fromCatalog = monthlyCreditsForProduct(order.product_id);
  if (fromCatalog && fromCatalog > 0) return fromCatalog;

  const credits = Number(order.credits || 0);
  if (credits >= 12 && credits % 12 === 0) {
    const maybeMonthly = credits / 12;
    if ([20, 60, 200].includes(maybeMonthly)) return maybeMonthly;
  }
  return credits;
}

function yearlyPeriodBounds(order: {
  sub_period_start?: number | null;
  sub_period_end?: number | null;
  paid_at?: Date | string | null;
  created_at?: Date | string | null;
}): { startMs: number; endMs: number; startUnix: number } | null {
  const startMs =
    (order.sub_period_start ? Number(order.sub_period_start) * 1000 : 0) ||
    (order.paid_at ? new Date(order.paid_at).getTime() : 0) ||
    (order.created_at ? new Date(order.created_at).getTime() : 0);
  if (!startMs) return null;

  const endMs = order.sub_period_end
    ? Number(order.sub_period_end) * 1000
    : startMs + 366 * DAY_MS;

  return {
    startMs,
    endMs,
    startUnix: Math.floor(startMs / 1000),
  };
}

export async function grantDueYearlyCreditsForOrder(order: {
  order_no: string;
  user_uuid?: string | null;
  interval?: string | null;
  product_id?: string | null;
  credits?: number | null;
  sub_period_start?: number | null;
  sub_period_end?: number | null;
  paid_at?: Date | string | null;
  created_at?: Date | string | null;
}): Promise<number> {
  if (order.interval && order.interval !== "year") return 0;

  const fresh = (await findOrderByOrderNo(order.order_no)) || order;
  if (fresh.interval && fresh.interval !== "year") return 0;

  const user_uuid = fresh.user_uuid || order.user_uuid;
  if (!user_uuid) return 0;

  const monthly = monthlyAllotmentForOrder(fresh);
  if (monthly <= 0) return 0;

  const bounds = yearlyPeriodBounds(fresh);
  if (!bounds) return 0;

  const now = Date.now();
  if (now > bounds.endMs) return 0;

  const firstLot = await findCreditByOrderNo(fresh.order_no);
  const firstCreated = firstLot?.created_at
    ? new Date(firstLot.created_at).getTime()
    : 0;
  const firstLotInPeriod =
    Boolean(firstLot) &&
    firstCreated >= bounds.startMs - DAY_MS &&
    firstCreated <= bounds.endMs;

  // Legacy yearly: the whole year was granted in one lot.
  if (
    firstLotInPeriod &&
    firstLot &&
    firstLot.credits >= monthly * YEARLY_GRANTS_PER_CYCLE
  ) {
    return 0;
  }

  const monthZeroAlreadyGranted =
    Boolean(firstLotInPeriod && firstLot && firstLot.credits === monthly);

  let granted = 0;
  for (let i = 0; i < YEARLY_GRANTS_PER_CYCLE; i += 1) {
    const dueAt = bounds.startMs + i * MONTHLY_CREDIT_EXPIRY_DAYS * DAY_MS;
    if (dueAt > now) break;
    if (dueAt > bounds.endMs) break;
    if (i === 0 && monthZeroAlreadyGranted) continue;

    const transNo = yearlyGrantTransNo(fresh.order_no, bounds.startUnix, i);
    if (await findCreditByTransNo(transNo)) continue;

    try {
      await increaseCredits({
        user_uuid,
        trans_type: CreditsTransType.OrderPay,
        credits: monthly,
        expired_at: creditExpiresAt(12),
        order_no: transNo,
        trans_no: transNo,
      });
      granted += 1;
    } catch (e) {
      if (isUniqueViolation(e)) continue;
      throw e;
    }
  }

  return granted;
}

export async function grantDueYearlyCreditsForUser(user_uuid: string): Promise<number> {
  const rows = await getPaidYearlyOrdersByUserUuid(user_uuid);
  let granted = 0;
  for (const row of rows) {
    granted += await grantDueYearlyCreditsForOrder(row);
  }
  return granted;
}

export async function grantDueYearlyCreditsAll(): Promise<number> {
  const rows = await getActivePaidYearlyOrders();
  let granted = 0;
  for (const row of rows) {
    granted += await grantDueYearlyCreditsForOrder(row);
  }
  return granted;
}

function creditExpiredAtIso(value: Date | string | null | undefined): string | null {
  return toIso(value) || null;
}

function rootOrderNo(orderNo: string): string {
  if (!orderNo) return "";
  if (orderNo.startsWith("yrgrant:")) {
    return orderNo.split(":")[1] || orderNo;
  }
  const inv = orderNo.indexOf("_inv_");
  if (inv > 0) return orderNo.slice(0, inv);
  const renew = orderNo.match(/^(\d+)_(\d+)$/);
  if (renew) return renew[1];
  return orderNo;
}

function lotSourceLabel(
  transType: string,
  productName?: string | null,
  interval?: string | null
): string {
  if (transType === CreditsTransType.NewUser) return "Welcome credits";
  if (transType === CreditsTransType.SystemRefund) return "Refunded conversion";
  if (transType === CreditsTransType.SystemAdd) return "Bonus credits";
  if (productName) {
    if (interval === "year") return `${productName} · monthly grant`;
    return productName;
  }
  if (interval === "month") return "Monthly plan";
  if (interval === "year") return "Yearly plan";
  if (interval === "one-time") return "Credit pack";
  return "Credits";
}

function daysLeftUntil(expiresAt: string | null, now = Date.now()): number | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - now;
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.ceil(ms / DAY_MS));
}

async function summarizeCreditLots(
  user_uuid: string,
  rows: Awaited<ReturnType<typeof getUserValidCredits>>
): Promise<CreditLot[]> {
  const paidOrders = (await getOrdersByUserUuid(user_uuid)) || [];
  const orderByNo = new Map(paidOrders.map((order) => [order.order_no, order]));
  const now = Date.now();

  const lots = (rows || [])
    .filter((row) => (row.credits || 0) > 0)
    .map((row) => {
      const order =
        orderByNo.get(row.order_no || "") ||
        orderByNo.get(rootOrderNo(row.order_no || ""));
      return {
        source: lotSourceLabel(row.trans_type, order?.product_name, order?.interval),
        remaining: row.credits || 0,
        expires_at: creditExpiredAtIso(row.expired_at),
        days_left: daysLeftUntil(creditExpiredAtIso(row.expired_at), now),
        orderNo: row.order_no || "",
      };
    })
    .sort((a, b) => {
      if (!a.expires_at && !b.expires_at) return 0;
      if (!a.expires_at) return 1;
      if (!b.expires_at) return -1;
      return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime();
    });

  // Spends and leftover negatives are applied FIFO (same as convert: earliest expiry first).
  let used = 0;
  for (const row of rows || []) {
    if ((row.credits || 0) < 0) used += Math.abs(row.credits || 0);
  }
  for (const lot of lots) {
    if (used <= 0) break;
    const take = Math.min(lot.remaining, used);
    lot.remaining -= take;
    used -= take;
  }

  return lots.filter((lot) => lot.remaining > 0);
}

function recordTypeLabel(transType: string, credits: number): string {
  if (transType === CreditsTransType.Convert) return "Conversion";
  if (transType === CreditsTransType.SystemRefund) return "Refund";
  if (transType === CreditsTransType.NewUser) return "Welcome";
  if (transType === CreditsTransType.OrderPay) return "Purchase";
  if (transType === CreditsTransType.SystemAdd) return "Bonus";
  if (transType === CreditsTransType.Ping) return "Ping";
  if (transType === CreditsTransType.VIDEO_GENERATION) return "Video";
  if (transType === CreditsTransType.IMAGE_GENERATION) return "Image";
  return credits < 0 ? "Used" : "Credit";
}

export async function listCreditRecords(
  user_uuid: string,
  page = 1,
  limit = 50
): Promise<{ items: CreditRecord[]; total: number }> {
  const [rows, total] = await Promise.all([
    getCreditsByUserUuid(user_uuid, page, limit),
    getCreditsCountByUserUuid(user_uuid),
  ]);

  const paidOrders = (await getOrdersByUserUuid(user_uuid)) || [];
  const orderByNo = new Map(paidOrders.map((order) => [order.order_no, order]));

  const items: CreditRecord[] = (rows || []).map((row) => {
    const order =
      orderByNo.get(row.order_no || "") ||
      orderByNo.get(rootOrderNo(row.order_no || ""));
    return {
      trans_no: row.trans_no,
      type: recordTypeLabel(row.trans_type, row.credits || 0),
      source: lotSourceLabel(row.trans_type, order?.product_name, order?.interval),
      credits: row.credits || 0,
      created_at: creditExpiredAtIso(row.created_at),
      expires_at: creditExpiredAtIso(row.expired_at),
    };
  });

  return { items, total };
}

export async function getUserCredits(user_uuid: string): Promise<UserCredits> {
  let user_credits: UserCredits = {
    left_credits: 0,
    lots: [],
  };

  try {
    const first_paid_order = await getFirstPaidOrderByUserUuid(user_uuid);
    if (first_paid_order) {
      user_credits.is_recharged = true;
    }

    try {
      await grantDueYearlyCreditsForUser(user_uuid);
    } catch (e) {
      console.log("grant yearly credits failed: ", e);
    }

    const credits = await getUserValidCredits(user_uuid);
    if (credits) {
      credits.forEach((v) => {
        user_credits.left_credits += v.credits || 0;
      });
      user_credits.lots = await summarizeCreditLots(user_uuid, credits);
    }

    if (user_credits.left_credits < 0) {
      user_credits.left_credits = 0;
    }

    if (user_credits.left_credits > 0) {
      user_credits.is_pro = true;
    }

    return user_credits;
  } catch (e) {
    console.log("get user credits failed: ", e);
    return user_credits;
  }
}

export async function decreaseCredits({
  user_uuid,
  trans_type,
  credits,
  trans_no,
}: {
  user_uuid: string;
  trans_type: CreditsTransType;
  credits: number;
  trans_no?: string;
}) {
  let order_no = "";
  let expiredAt: Date | null = null;
  let left_credits = 0;

  const userCredits = await getUserValidCredits(user_uuid);
  if (userCredits) {
    for (let i = 0, l = userCredits.length; i < l; i++) {
      const credit = userCredits[i];
      left_credits += credit.credits || 0;

      if (left_credits >= credits) {
        order_no = credit.order_no || "";
        expiredAt = credit.expired_at ?? null;
        break;
      }
    }
  }

  if (left_credits < credits) {
    throw new InsufficientCreditsError();
  }

  const new_credit: typeof creditsTable.$inferInsert = {
    trans_no: trans_no || getSnowId(),
    created_at: new Date(getIsoTimestr()),
    expired_at: expiredAt,
    user_uuid: user_uuid,
    trans_type: trans_type,
    credits: 0 - credits,
    order_no: order_no,
  };
  await insertCredit(new_credit);
}

export async function consumeConvertCredit(jobId: string, user_uuid: string) {
  const trans_no = convertChargeTransNo(jobId);
  const existing = await findCreditByTransNo(trans_no);
  if (existing) return;

  try {
    await grantDueYearlyCreditsForUser(user_uuid);
  } catch (e) {
    console.log("grant yearly credits before convert failed: ", e);
  }

  await decreaseCredits({
    user_uuid,
    trans_type: CreditsTransType.Convert,
    credits: CreditsAmount.ConvertCost,
    trans_no,
  });
}

export async function refundConvertCredit(jobId: string, user_uuid: string) {
  const refundNo = convertRefundTransNo(jobId);
  if (await findCreditByTransNo(refundNo)) return;

  const charge = await findCreditByTransNo(convertChargeTransNo(jobId));
  if (!charge) return;

  await increaseCredits({
    user_uuid,
    trans_type: CreditsTransType.SystemRefund,
    credits: CreditsAmount.ConvertCost,
    expired_at: toIso(charge.expired_at) || creditExpiresAt(12),
    order_no: refundNo,
    trans_no: refundNo,
  });
}

export async function increaseCredits({
  user_uuid,
  trans_type,
  credits,
  expired_at,
  order_no,
  trans_no,
}: {
  user_uuid: string;
  trans_type: string;
  credits: number;
  expired_at?: string;
  order_no?: string;
  trans_no?: string;
}) {
  const new_credit: typeof creditsTable.$inferInsert = {
    trans_no: trans_no || getSnowId(),
    created_at: new Date(getIsoTimestr()),
    user_uuid: user_uuid,
    trans_type: trans_type,
    credits: credits,
    order_no: order_no || "",
    expired_at: expired_at ? new Date(expired_at) : null,
  };
  await insertCredit(new_credit);
}

export async function updateCreditForOrder(order: Order) {
  try {
    if (order.interval === "year") {
      await grantDueYearlyCreditsForOrder(order);
      return;
    }

    const credit = await findCreditByOrderNo(order.order_no);
    if (credit) {
      return;
    }

    await increaseCredits({
      user_uuid: order.user_uuid,
      trans_type: CreditsTransType.OrderPay,
      credits: order.credits,
      expired_at: toIso(order.expired_at as string | Date | null | undefined),
      order_no: order.order_no,
    });
  } catch (e) {
    console.log("update credit for order failed: ", e);
    throw e;
  }
}
