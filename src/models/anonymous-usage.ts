import { anonymousUsageLogs } from "@/db/schema";
import { db } from "@/db";
import { eq, gte, and, count, sql } from "drizzle-orm";

export async function insertAnonymousUsageLog(
  data: typeof anonymousUsageLogs.$inferInsert
): Promise<typeof anonymousUsageLogs.$inferSelect | undefined> {
  if (data.created_at && typeof data.created_at === "string") {
    data.created_at = new Date(data.created_at);
  }

  const [log] = await db().insert(anonymousUsageLogs).values(data).returning();

  return log;
}

/**
 * 获取匿名用户今日使用次数
 */
export async function getTodayUsageCount(
  anonymous_uuid: string,
  api_type: string
): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await db()
    .select({ count: count() })
    .from(anonymousUsageLogs)
    .where(
      and(
        eq(anonymousUsageLogs.anonymous_uuid, anonymous_uuid),
        eq(anonymousUsageLogs.api_type, api_type),
        gte(anonymousUsageLogs.created_at, today)
      )
    );

  return result[0]?.count || 0;
}

/**
 * 获取匿名用户今日所有API的使用次数总和
 */
export async function getTodayTotalUsageCount(
  anonymous_uuid: string
): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await db()
    .select({ count: count() })
    .from(anonymousUsageLogs)
    .where(
      and(
        eq(anonymousUsageLogs.anonymous_uuid, anonymous_uuid),
        gte(anonymousUsageLogs.created_at, today)
      )
    );

  return result[0]?.count || 0;
}

