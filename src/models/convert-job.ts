import { and, desc, eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { convertJobs } from "@/db/schema";

export type ConvertJobRow = typeof convertJobs.$inferSelect;
export type ConvertJobInsert = typeof convertJobs.$inferInsert;

export async function insertConvertJob(data: ConvertJobInsert) {
  const [row] = await db().insert(convertJobs).values(data).returning();
  return row;
}

export async function findConvertJobByUuid(uuid: string) {
  const [row] = await db()
    .select()
    .from(convertJobs)
    .where(eq(convertJobs.uuid, uuid))
    .limit(1);
  return row;
}

export async function updateConvertJob(
  uuid: string,
  patch: Partial<ConvertJobInsert>
) {
  const [row] = await db()
    .update(convertJobs)
    .set({ ...patch, updated_at: new Date() })
    .where(eq(convertJobs.uuid, uuid))
    .returning();
  return row;
}

export async function listConvertJobsForUser(opts: {
  user_email?: string;
  user_uuid?: string;
  limit?: number;
  offset?: number;
}): Promise<ConvertJobRow[]> {
  const email = (opts.user_email || "").trim().toLowerCase();
  const uuid = (opts.user_uuid || "").trim();
  if (!email && !uuid) return [];

  const owner =
    email && uuid
      ? or(eq(convertJobs.user_email, email), eq(convertJobs.user_uuid, uuid))
      : email
        ? eq(convertJobs.user_email, email)
        : eq(convertJobs.user_uuid, uuid);

  return db()
    .select()
    .from(convertJobs)
    .where(and(eq(convertJobs.status, "complete"), owner))
    .orderBy(desc(convertJobs.created_at))
    .limit(opts.limit ?? 50)
    .offset(opts.offset ?? 0);
}

export async function countConvertJobsForUser(opts: {
  user_email?: string;
  user_uuid?: string;
}): Promise<number> {
  const email = (opts.user_email || "").trim().toLowerCase();
  const uuid = (opts.user_uuid || "").trim();
  if (!email && !uuid) return 0;

  const owner =
    email && uuid
      ? or(eq(convertJobs.user_email, email), eq(convertJobs.user_uuid, uuid))
      : email
        ? eq(convertJobs.user_email, email)
        : eq(convertJobs.user_uuid, uuid);

  const [row] = await db()
    .select({ n: sql<number>`count(*)::int` })
    .from(convertJobs)
    .where(and(eq(convertJobs.status, "complete"), owner));
  return row?.n || 0;
}
