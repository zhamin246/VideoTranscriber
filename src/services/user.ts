import { CreditsAmount, CreditsTransType } from "./credit";
import {
  findUserByEmail,
  findUserByEmailAndProvider,
  findUserByUuid,
  insertUser,
  updateUserOnboarding,
} from "@/models/user";
import { findCreditByUserAndType } from "@/models/credit";

import { User } from "@/types/user";
import { auth } from "@/auth";
import { getOneYearLaterTimestr } from "@/lib/time";
import { getUserUuidByApiKey } from "@/models/apikey";
import { headers } from "next/headers";
import { increaseCredits } from "./credit";
import { users } from "@/db/schema";
import { getUuid } from "@/lib/hash";
import { creditEvents } from "@/lib/events";

// save user to database, if user not exist, create a new user
export async function saveUser(user: User) {
  try {
    if (!user.email) {
      throw new Error("invalid user email");
    }

    // Find user by email and provider (since we have unique index on email + provider)
    const existUser = user.signin_provider
      ? await findUserByEmailAndProvider(user.email, user.signin_provider)
      : await findUserByEmail(user.email);

    if (!existUser) {
      // user not exist, create a new user
      if (!user.uuid) {
        user.uuid = getUuid();
      }

      console.log("user to be inserted:", user);

      const dbUser = await insertUser(user as typeof users.$inferInsert);
      
      if (!dbUser) {
        throw new Error("Failed to insert user: no user returned");
      }

      user = {
        ...(dbUser as unknown as User),
      };
    } else {
      // user exist, return user info in db
      user = {
        ...(existUser as unknown as User),
      };
    }

    return user;
  } catch (e) {
    console.error("save user failed: ", e);
    if (e instanceof Error) {
      console.error("Error message:", e.message);
      console.error("Error stack:", e.stack);
    }
    throw e;
  }
}

export async function completeOnboarding(input: {
  user_uuid: string;
  nickname: string;
  work_role: string;
  team_size: string;
}) {
  const updated = await updateUserOnboarding(input.user_uuid, {
    nickname: input.nickname,
    work_role: input.work_role,
    team_size: input.team_size,
  });
  if (!updated) throw new Error("Could not save profile");

  const already = await findCreditByUserAndType(
    input.user_uuid,
    CreditsTransType.NewUser
  );
  if (!already) {
    await increaseCredits({
      user_uuid: input.user_uuid,
      trans_type: CreditsTransType.NewUser,
      credits: CreditsAmount.NewUserGet,
      expired_at: getOneYearLaterTimestr(),
    });
    creditEvents.emit("creditsUpdated");
  }

  return updated;
}

export async function getUserUuid() {
  let user_uuid = "";

  const token = await getBearerToken();

  if (token) {
    // api key
    if (token.startsWith("sk-")) {
      const user_uuid = await getUserUuidByApiKey(token);

      return user_uuid || "";
    }
  }

  const session = await auth();
  if (session && session.user && session.user.uuid) {
    user_uuid = session.user.uuid;
  }

  return user_uuid;
}

export async function getBearerToken() {
  const h = await headers();
  const auth = h.get("Authorization");
  if (!auth) {
    return "";
  }

  return auth.replace("Bearer ", "");
}

export async function getUserEmail() {
  let user_email = "";

  const session = await auth();
  if (session && session.user && session.user.email) {
    user_email = session.user.email;
  }

  return user_email;
}

export async function getUserInfo() {
  let user_uuid = await getUserUuid();

  if (!user_uuid) {
    return;
  }

  const user = await findUserByUuid(user_uuid);

  return user;
}
