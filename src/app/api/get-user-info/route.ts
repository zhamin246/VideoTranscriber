import { respData, respErr, respJson } from "@/lib/resp";

import { findUserByUuid } from "@/models/user";
import { getUserUuid } from "@/services/user";
import { getUserCredits } from "@/services/credit";
import { getPlanSummary } from "@/services/plan";
import { User } from "@/types/user";

export async function POST(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respJson(-2, "no auth");
    }

    const dbUser = await findUserByUuid(user_uuid);
    if (!dbUser) {
      return respErr("user not exist");
    }

    const [userCredits, plan] = await Promise.all([
      getUserCredits(user_uuid),
      getPlanSummary(user_uuid),
    ]);

    const user: User = {
      ...(dbUser as unknown as User),
      credits: {
        ...userCredits,
        monthly_credits: plan.minutes.total,
        used_credits: plan.minutes.used,
        free_credits: plan.tier === "FREE" ? plan.minutes.left : undefined,
      },
      plan,
    };

    return respData(user);
  } catch (e) {
    console.log("get user info failed: ", e);
    return respErr("get user info failed");
  }
}
