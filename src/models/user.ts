import { users } from "@/db/schema";
import { db } from "@/db";
import { desc, eq, gte, inArray, and } from "drizzle-orm";

export async function insertUser(
  data: typeof users.$inferInsert
): Promise<typeof users.$inferSelect | undefined> {
  const [user] = await db().insert(users).values(data).returning();

  return user;
}

export async function findUserByEmail(
  email: string
): Promise<typeof users.$inferSelect | undefined> {
  const [user] = await db()
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user;
}

export async function findUserByEmailAndProvider(
  email: string,
  provider: string
): Promise<typeof users.$inferSelect | undefined> {
  const [user] = await db()
    .select()
    .from(users)
    .where(and(eq(users.email, email), eq(users.signin_provider, provider)))
    .limit(1);

  return user;
}

export async function findUserByUuid(
  uuid: string
): Promise<typeof users.$inferSelect | undefined> {
  const [user] = await db()
    .select()
    .from(users)
    .where(eq(users.uuid, uuid))
    .limit(1);

  return user;
}

export async function getUsers(
  page: number = 1,
  limit: number = 50
): Promise<(typeof users.$inferSelect)[] | undefined> {
  const offset = (page - 1) * limit;

  const data = await db()
    .select()
    .from(users)
    .orderBy(desc(users.created_at))
    .limit(limit)
    .offset(offset);

  return data;
}

export async function updateUserInviteCode(
  user_uuid: string,
  invite_code: string
): Promise<typeof users.$inferSelect | undefined> {
  const [user] = await db()
    .update(users)
    .set({ invite_code, updated_at: new Date() })
    .where(eq(users.uuid, user_uuid))
    .returning();

  return user;
}

export async function updateUserInvitedBy(
  user_uuid: string,
  invited_by: string
): Promise<typeof users.$inferSelect | undefined> {
  const [user] = await db()
    .update(users)
    .set({ invited_by, updated_at: new Date() })
    .where(eq(users.uuid, user_uuid))
    .returning();

  return user;
}

export async function updateUserOnboarding(
  user_uuid: string,
  data: {
    nickname: string;
    work_role: string;
    team_size: string;
  }
): Promise<typeof users.$inferSelect | undefined> {
  const [user] = await db()
    .update(users)
    .set({
      nickname: data.nickname,
      work_role: data.work_role,
      team_size: data.team_size,
      onboarded_at: new Date(),
      updated_at: new Date(),
    })
    .where(eq(users.uuid, user_uuid))
    .returning();

  return user;
}

export async function updateUserPasswordHash(
  user_uuid: string,
  password_hash: string,
): Promise<typeof users.$inferSelect | undefined> {
  const [user] = await db()
    .update(users)
    .set({ password_hash, updated_at: new Date() })
    .where(eq(users.uuid, user_uuid))
    .returning();

  return user;
}

export async function getUsersByUuids(
  user_uuids: string[]
): Promise<(typeof users.$inferSelect)[] | undefined> {
  const data = await db()
    .select()
    .from(users)
    .where(inArray(users.uuid, user_uuids));

  return data;
}

export async function findUserByInviteCode(
  invite_code: string
): Promise<typeof users.$inferSelect | undefined> {
  const [user] = await db()
    .select()
    .from(users)
    .where(eq(users.invite_code, invite_code))
    .limit(1);

  return user;
}

export async function getUserUuidsByEmail(
  email: string
): Promise<string[] | undefined> {
  const data = await db()
    .select({ uuid: users.uuid })
    .from(users)
    .where(eq(users.email, email));

  return data.map((user) => user.uuid);
}

export async function getUsersTotal(): Promise<number> {
  const total = await db().$count(users);

  return total;
}

export async function getUserCountByDate(
  startTime: string
): Promise<Map<string, number> | undefined> {
  const data = await db()
    .select({ created_at: users.created_at })
    .from(users)
    .where(gte(users.created_at, new Date(startTime)));

  data.sort((a, b) => a.created_at!.getTime() - b.created_at!.getTime());

  const dateCountMap = new Map<string, number>();
  data.forEach((item) => {
    const date = item.created_at!.toISOString().split("T")[0];
    dateCountMap.set(date, (dateCountMap.get(date) || 0) + 1);
  });

  return dateCountMap;
}
