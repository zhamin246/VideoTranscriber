import { credits } from "@/db/schema";
import { db } from "@/db";
import { asc, desc, eq, gte, and, or, isNull, count } from "drizzle-orm";

export async function insertCredit(
  data: typeof credits.$inferInsert
): Promise<typeof credits.$inferSelect | undefined> {
  if (data.created_at && typeof data.created_at === "string") {
    data.created_at = new Date(data.created_at);
  }
  if (data.expired_at && typeof data.expired_at === "string") {
    data.expired_at = new Date(data.expired_at);
  }

  const [credit] = await db().insert(credits).values(data).returning();

  return credit;
}

export async function findCreditByTransNo(
  trans_no: string
): Promise<typeof credits.$inferSelect | undefined> {
  const [credit] = await db()
    .select()
    .from(credits)
    .where(eq(credits.trans_no, trans_no))
    .limit(1);

  return credit;
}

export async function findCreditByOrderNo(
  order_no: string
): Promise<typeof credits.$inferSelect | undefined> {
  const [credit] = await db()
    .select()
    .from(credits)
    .where(eq(credits.order_no, order_no))
    .limit(1);

  return credit;
}

export async function getUserValidCredits(
  user_uuid: string
): Promise<(typeof credits.$inferSelect)[] | undefined> {
  const now = new Date().toISOString();
  const data = await db()
    .select()
    .from(credits)
    .where(
      and(
        or(
          gte(credits.expired_at, new Date(now)),  // 未过期的积分
          isNull(credits.expired_at)               // 永不过期的积分
        ),
        eq(credits.user_uuid, user_uuid)
      )
    )
    .orderBy(asc(credits.expired_at));

  return data;
}

export async function findCreditByUserAndType(
  user_uuid: string,
  trans_type: string
): Promise<typeof credits.$inferSelect | undefined> {
  const [credit] = await db()
    .select()
    .from(credits)
    .where(and(eq(credits.user_uuid, user_uuid), eq(credits.trans_type, trans_type)))
    .limit(1);

  return credit;
}

export async function getCreditsByUserUuid(
  user_uuid: string,
  page: number = 1,
  limit: number = 50
): Promise<(typeof credits.$inferSelect)[] | undefined> {
  const data = await db()
    .select()
    .from(credits)
    .where(eq(credits.user_uuid, user_uuid))
    .orderBy(desc(credits.created_at))
    .limit(limit)
    .offset((page - 1) * limit);

  return data;
}

export async function getCreditsCountByUserUuid(
  user_uuid: string
): Promise<number> {
  const result = await db()
    .select({ count: count() })
    .from(credits)
    .where(eq(credits.user_uuid, user_uuid));
  
  return result[0]?.count || 0;
}
