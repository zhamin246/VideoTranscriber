import {
  affiliates,
  apikeys,
  convertJobs,
  credits,
  feedbacks,
  generationRecords,
  orders,
  users,
  workspaces,
} from "@/db/schema";
import { db } from "@/db";
import { desc, eq, gte, inArray, and, asc } from "drizzle-orm";

const GOOGLE_PROVIDERS = new Set(["google", "google-one-tap"]);

/** Google button and One Tap are the same Google account. */
export function canonicalAuthProvider(provider?: string | null): string {
  if (provider === "google-one-tap") return "google";
  return (provider || "").trim();
}

export function isGoogleAuthProvider(provider?: string | null): boolean {
  return GOOGLE_PROVIDERS.has(provider || "");
}

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

export async function findUsersByEmail(
  email: string
): Promise<(typeof users.$inferSelect)[]> {
  if (!email) return [];
  return db()
    .select()
    .from(users)
    .where(eq(users.email, email))
    .orderBy(asc(users.created_at));
}

/** Look up the existing row for this login, treating Google and One Tap as one identity. */
export async function findUserForSignIn(
  email: string,
  provider?: string | null
): Promise<typeof users.$inferSelect | undefined> {
  const canonical = canonicalAuthProvider(provider);
  if (!canonical) {
    return findUserByEmail(email);
  }

  const exact =
    (await findUserByEmailAndProvider(email, canonical)) ||
    (canonical !== provider
      ? await findUserByEmailAndProvider(email, provider || "")
      : undefined);
  if (exact) return exact;

  if (canonical === "google") {
    const oneTap = await findUserByEmailAndProvider(email, "google-one-tap");
    if (oneTap) return oneTap;
  }

  return undefined;
}

function pickCanonicalGoogleUuid(
  family: (typeof users.$inferSelect)[],
  paidUuids: Set<string>
): string {
  const paid = family.find((row) => paidUuids.has(row.uuid));
  if (paid) return paid.uuid;
  const google = family.find((row) => row.signin_provider === "google");
  return google?.uuid || family[0].uuid;
}

async function reassignOwnedRows(fromUuid: string, toUuid: string) {
  if (!fromUuid || !toUuid || fromUuid === toUuid) return;

  const destWelcome = await db()
    .select({ id: credits.id })
    .from(credits)
    .where(and(eq(credits.user_uuid, toUuid), eq(credits.trans_type, "new_user")))
    .limit(1);
  if (destWelcome[0]) {
    await db()
      .delete(credits)
      .where(
        and(eq(credits.user_uuid, fromUuid), eq(credits.trans_type, "new_user"))
      );
  }

  await Promise.all([
    db().update(orders).set({ user_uuid: toUuid }).where(eq(orders.user_uuid, fromUuid)),
    db().update(credits).set({ user_uuid: toUuid }).where(eq(credits.user_uuid, fromUuid)),
    db()
      .update(workspaces)
      .set({ user_uuid: toUuid })
      .where(eq(workspaces.user_uuid, fromUuid)),
    db()
      .update(convertJobs)
      .set({ user_uuid: toUuid })
      .where(eq(convertJobs.user_uuid, fromUuid)),
    db()
      .update(generationRecords)
      .set({ user_uuid: toUuid })
      .where(eq(generationRecords.user_uuid, fromUuid)),
    db()
      .update(apikeys)
      .set({ user_uuid: toUuid })
      .where(eq(apikeys.user_uuid, fromUuid)),
    db()
      .update(feedbacks)
      .set({ user_uuid: toUuid })
      .where(eq(feedbacks.user_uuid, fromUuid)),
    db()
      .update(affiliates)
      .set({ user_uuid: toUuid })
      .where(eq(affiliates.user_uuid, fromUuid)),
    db()
      .update(affiliates)
      .set({ invited_by: toUuid })
      .where(eq(affiliates.invited_by, fromUuid)),
  ]);
}

/**
 * Google OAuth and Google One Tap currently create two users for the same email.
 * Collapse them onto the account that already has a paid order (else the `google` row).
 */
export async function resolveCanonicalUserUuid(
  uuid: string,
  email?: string | null
): Promise<string> {
  if (!uuid) return "";

  const me = await findUserByUuid(uuid);
  const lookupEmail = (email || me?.email || "").trim();
  if (!lookupEmail || !isGoogleAuthProvider(me?.signin_provider)) {
    return uuid;
  }

  const family = (await findUsersByEmail(lookupEmail)).filter((row) =>
    isGoogleAuthProvider(row.signin_provider)
  );
  if (family.length <= 1) return uuid;

  const paidRows = await db()
    .select({ user_uuid: orders.user_uuid })
    .from(orders)
    .where(
      and(
        inArray(
          orders.user_uuid,
          family.map((row) => row.uuid)
        ),
        eq(orders.status, "paid")
      )
    );
  const canonical = pickCanonicalGoogleUuid(
    family,
    new Set(paidRows.map((row) => row.user_uuid))
  );

  for (const row of family) {
    if (row.uuid !== canonical) {
      await reassignOwnedRows(row.uuid, canonical);
    }
  }

  return canonical;
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
