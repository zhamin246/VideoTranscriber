import { CreditsAmount, CreditsTransType } from "./credit";
import {
  canonicalAuthProvider,
  findUserByUuid,
  findUserForSignIn,
  insertUser,
  resolveCanonicalUserUuid,
  updateUserOnboarding,
} from "@/models/user";
import { findCreditByUserAndType } from "@/models/credit";

import { User } from "@/types/user";
import { auth } from "@/auth";
import { creditExpiresAtDays } from "@/lib/time";
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

    if (user.signin_provider) {
      user.signin_provider = canonicalAuthProvider(user.signin_provider);
    }

    // Google button and One Tap share one identity; unique index is still email+provider.
    const existUser = await findUserForSignIn(
      user.email,
      user.signin_provider
    );

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

      // Free-tier welcome minutes (90 / 30 days). Onboarding path is idempotent.
      try {
        await increaseCredits({
          user_uuid: user.uuid!,
          trans_type: CreditsTransType.NewUser,
          credits: CreditsAmount.NewUserGet,
          expired_at: creditExpiresAtDays(30),
        });
        creditEvents.emit("creditsUpdated");
      } catch (creditErr) {
        console.error("new user credit grant failed:", creditErr);
      }
    } else {
      const canonicalUuid = await resolveCanonicalUserUuid(
        existUser.uuid!,
        user.email
      );
      const canonicalUser =
        canonicalUuid !== existUser.uuid
          ? await findUserByUuid(canonicalUuid)
          : existUser;
      user = {
        ...((canonicalUser || existUser) as unknown as User),
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
      expired_at: creditExpiresAtDays(30),
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
    user_uuid = await resolveCanonicalUserUuid(
      session.user.uuid,
      session.user.email
    );
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
