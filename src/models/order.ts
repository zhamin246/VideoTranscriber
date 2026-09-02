import { orders } from "@/db/schema";
import { db } from "@/db";
import { and, asc, desc, eq, gte, isNull, or, count } from "drizzle-orm";

export enum OrderStatus {
  Created = "created",
  Paid = "paid",
  Deleted = "deleted",
}

export async function insertOrder(data: typeof orders.$inferInsert) {
  if (data.created_at && typeof data.created_at === "string") {
    data.created_at = new Date(data.created_at);
  }
  if (data.expired_at && typeof data.expired_at === "string") {
    data.expired_at = new Date(data.expired_at);
  }
  if (data.paid_at && typeof data.paid_at === "string") {
    data.paid_at = new Date(data.paid_at);
  }

  const [order] = await db().insert(orders).values(data).returning();

  return order;
}

export async function findOrderByOrderNo(
  order_no: string
): Promise<typeof orders.$inferSelect | undefined> {
  const [order] = await db()
    .select()
    .from(orders)
    .where(eq(orders.order_no, order_no))
    .limit(1);

  return order;
}

export async function getFirstPaidOrderByUserUuid(
  user_uuid: string
): Promise<typeof orders.$inferSelect | undefined> {
  const [order] = await db()
    .select()
    .from(orders)
    .where(
      and(eq(orders.user_uuid, user_uuid), eq(orders.status, OrderStatus.Paid))
    )
    .orderBy(asc(orders.created_at))
    .limit(1);

  return order;
}

export async function getFirstPaidOrderByUserEmail(
  user_email: string
): Promise<typeof orders.$inferSelect | undefined> {
  const [order] = await db()
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.user_email, user_email),
        eq(orders.status, OrderStatus.Paid)
      )
    )
    .orderBy(desc(orders.created_at))
    .limit(1);

  return order;
}

export async function updateOrderStatus(
  order_no: string,
  status: string,
  paid_at: string,
  paid_email: string,
  paid_detail: string
) {
  const [order] = await db()
    .update(orders)
    .set({ status, paid_at: new Date(paid_at), paid_detail, paid_email })
    .where(eq(orders.order_no, order_no))
    .returning();

  return order;
}

export async function updateOrderSession(
  order_no: string,
  stripe_session_id: string,
  order_detail: string
) {
  const [order] = await db()
    .update(orders)
    .set({ stripe_session_id, order_detail })
    .where(eq(orders.order_no, order_no))
    .returning();

  return order;
}

export async function updateOrderSubscription(
  order_no: string,
  sub_id: string,
  sub_interval_count: number,
  sub_cycle_anchor: number,
  sub_period_end: number,
  sub_period_start: number,
  status: string,
  paid_at: string,
  sub_times: number,
  paid_email: string,
  paid_detail: string
) {
  const [order] = await db()
    .update(orders)
    .set({
      sub_id,
      sub_interval_count,
      sub_cycle_anchor,
      sub_period_end,
      sub_period_start,
      status,
      paid_at: new Date(paid_at),
      sub_times,
      paid_email,
      paid_detail,
    })
    .where(eq(orders.order_no, order_no))
    .returning();

  return order;
}

function isRootYearlyOrder(orderNo: string) {
  return !orderNo.includes("_");
}

export async function getPaidYearlyOrdersByUserUuid(
  user_uuid: string
): Promise<(typeof orders.$inferSelect)[]> {
  const nowUnix = Math.floor(Date.now() / 1000);
  const data = await db()
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.user_uuid, user_uuid),
        eq(orders.status, OrderStatus.Paid),
        eq(orders.interval, "year"),
        or(isNull(orders.sub_period_end), gte(orders.sub_period_end, nowUnix))
      )
    )
    .orderBy(desc(orders.created_at));

  return data.filter((row) => isRootYearlyOrder(row.order_no));
}

export async function getActivePaidYearlyOrders(): Promise<
  (typeof orders.$inferSelect)[]
> {
  const nowUnix = Math.floor(Date.now() / 1000);
  const data = await db()
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.status, OrderStatus.Paid),
        eq(orders.interval, "year"),
        or(isNull(orders.sub_period_end), gte(orders.sub_period_end, nowUnix))
      )
    )
    .orderBy(desc(orders.created_at));

  return data.filter((row) => isRootYearlyOrder(row.order_no));
}

export async function updateOrderSubscriptionPeriod(
  order_no: string,
  sub_period_start: number,
  sub_period_end: number
) {
  const [order] = await db()
    .update(orders)
    .set({ sub_period_start, sub_period_end })
    .where(eq(orders.order_no, order_no))
    .returning();

  return order;
}

export async function getOrdersByUserUuid(
  user_uuid: string
): Promise<(typeof orders.$inferSelect)[] | undefined> {
  const data = await db()
    .select()
    .from(orders)
    .where(
      and(eq(orders.user_uuid, user_uuid), eq(orders.status, OrderStatus.Paid))
    )
    .orderBy(desc(orders.created_at));

  return data;
}

export async function getPaidOrdersPageByUserUuid(
  user_uuid: string,
  page: number,
  limit: number
): Promise<(typeof orders.$inferSelect)[]> {
  return db()
    .select()
    .from(orders)
    .where(
      and(eq(orders.user_uuid, user_uuid), eq(orders.status, OrderStatus.Paid))
    )
    .orderBy(desc(orders.created_at))
    .limit(limit)
    .offset((page - 1) * limit);
}

export async function countPaidOrdersByUserUuid(user_uuid: string): Promise<number> {
  const [row] = await db()
    .select({ n: count() })
    .from(orders)
    .where(
      and(eq(orders.user_uuid, user_uuid), eq(orders.status, OrderStatus.Paid))
    );
  return row?.n || 0;
}

export async function getPaidOrdersPageByPaidEmail(
  paid_email: string,
  page: number,
  limit: number
): Promise<(typeof orders.$inferSelect)[]> {
  return db()
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.paid_email, paid_email),
        eq(orders.status, OrderStatus.Paid)
      )
    )
    .orderBy(desc(orders.created_at))
    .limit(limit)
    .offset((page - 1) * limit);
}

export async function countPaidOrdersByPaidEmail(paid_email: string): Promise<number> {
  const [row] = await db()
    .select({ n: count() })
    .from(orders)
    .where(
      and(
        eq(orders.paid_email, paid_email),
        eq(orders.status, OrderStatus.Paid)
      )
    );
  return row?.n || 0;
}

export async function userHasPaidSubscription(
  user_uuid?: string,
  paid_email?: string
): Promise<boolean> {
  const byUuid = user_uuid
    ? await db()
        .select({ id: orders.id })
        .from(orders)
        .where(
          and(
            eq(orders.user_uuid, user_uuid),
            eq(orders.status, OrderStatus.Paid),
            or(eq(orders.interval, "month"), eq(orders.interval, "year"))
          )
        )
        .limit(1)
    : [];
  if (byUuid.length > 0) return true;
  if (!paid_email) return false;
  const byEmail = await db()
    .select({ id: orders.id })
    .from(orders)
    .where(
      and(
        eq(orders.paid_email, paid_email),
        eq(orders.status, OrderStatus.Paid),
        or(eq(orders.interval, "month"), eq(orders.interval, "year"))
      )
    )
    .limit(1);
  return byEmail.length > 0;
}

export async function getOrdersByUserEmail(
  user_email: string
): Promise<(typeof orders.$inferSelect)[] | undefined> {
  const data = await db()
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.user_email, user_email),
        eq(orders.status, OrderStatus.Paid)
      )
    )
    .orderBy(desc(orders.created_at));

  return data;
}

export async function getOrdersByPaidEmail(
  paid_email: string
): Promise<(typeof orders.$inferSelect)[] | undefined> {
  const data = await db()
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.paid_email, paid_email),
        eq(orders.status, OrderStatus.Paid)
      )
    )
    .orderBy(desc(orders.created_at));

  return data;
}

export async function getPaiedOrders(
  page: number,
  limit: number
): Promise<(typeof orders.$inferSelect)[] | undefined> {
  const data = await db()
    .select()
    .from(orders)
    .where(eq(orders.status, OrderStatus.Paid))
    .orderBy(desc(orders.created_at))
    .limit(limit)
    .offset((page - 1) * limit);

  return data;
}

export async function getPaidOrdersTotal(): Promise<number | undefined> {
  const total = await db().$count(orders);

  return total;
}

export async function getOrderCountByDate(
  startTime: string,
  status?: string
): Promise<Map<string, number> | undefined> {
  const data = await db()
    .select({ created_at: orders.created_at })
    .from(orders)
    .where(gte(orders.created_at, new Date(startTime)));

  data.sort((a, b) => a.created_at!.getTime() - b.created_at!.getTime());

  const dateCountMap = new Map<string, number>();
  data.forEach((item) => {
    const date = item.created_at!.toISOString().split("T")[0];
    dateCountMap.set(date, (dateCountMap.get(date) || 0) + 1);
  });

  return dateCountMap;
}
