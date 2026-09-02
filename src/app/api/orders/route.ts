import {
  countPaidOrdersByPaidEmail,
  countPaidOrdersByUserUuid,
  getPaidOrdersPageByPaidEmail,
  getPaidOrdersPageByUserUuid,
  userHasPaidSubscription,
} from "@/models/order";
import { getUserEmail, getUserUuid } from "@/services/user";
import { respData, respErr } from "@/lib/resp";

function intervalLabel(interval: string | null | undefined) {
  if (interval === "month") return "Monthly";
  if (interval === "year") return "Yearly";
  return "One-off";
}

function amountLabel(amount: number, currency: string | null | undefined) {
  const code = (currency || "usd").toUpperCase();
  const value = (Number(amount) || 0) / 100;
  const symbol = code === "CNY" ? "¥" : "$";
  return `${symbol}${value.toFixed(value % 1 === 0 ? 0 : 2)}`;
}

function toIso(value: Date | string | null | undefined) {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toISOString();
}

function mapOrder(row: {
  order_no: string;
  product_name: string | null;
  amount: number;
  currency: string | null;
  interval: string | null;
  credits: number;
  paid_at: Date | string | null;
  sub_id: string | null;
}) {
  return {
    orderNo: row.order_no,
    productName: row.product_name || "Credits",
    amountLabel: amountLabel(row.amount, row.currency),
    interval: row.interval || "one-time",
    intervalLabel: intervalLabel(row.interval),
    credits: row.credits || 0,
    paidAt: toIso(row.paid_at),
    hasSubscription: Boolean(
      row.sub_id && (row.interval === "month" || row.interval === "year")
    ),
  };
}

export async function GET(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    const user_email = await getUserEmail();
    if (!user_uuid && !user_email) {
      return respErr("Sign in to view orders");
    }

    const url = new URL(req.url);
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || 10)));
    const page = Math.max(1, Number(url.searchParams.get("page") || 1) || 1);

    let total = user_uuid ? await countPaidOrdersByUserUuid(user_uuid) : 0;
    let rows =
      user_uuid && total > 0
        ? await getPaidOrdersPageByUserUuid(user_uuid, page, limit)
        : [];

    if (total === 0 && user_email) {
      total = await countPaidOrdersByPaidEmail(user_email);
      rows = total > 0 ? await getPaidOrdersPageByPaidEmail(user_email, page, limit) : [];
    }

    const hasSubscription = await userHasPaidSubscription(
      user_uuid || undefined,
      user_email || undefined
    );

    return respData({
      items: rows.map(mapOrder),
      total,
      page,
      limit,
      hasSubscription,
    });
  } catch (e) {
    console.error("list orders failed:", e);
    return respErr(e instanceof Error ? e.message : "Failed to load orders");
  }
}
