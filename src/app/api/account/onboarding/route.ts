import { NextRequest } from "next/server";
import { respData, respErr } from "@/lib/resp";
import { getUserUuid, completeOnboarding } from "@/services/user";
import { WORK_ROLES, TEAM_SIZES } from "@/lib/auth/onboarding";

export async function POST(req: NextRequest) {
  try {
    const uuid = await getUserUuid();
    if (!uuid) return respErr("Please sign in first");

    const body = await req.json().catch(() => ({}));
    const nickname = String(body.nickname || "").trim();
    const work_role = String(body.work_role || "").trim();
    const team_size = String(body.team_size || "").trim();

    if (nickname.length < 1 || nickname.length > 80) {
      return respErr("Enter a name we can call you");
    }
    if (!WORK_ROLES.some((r) => r.id === work_role)) {
      return respErr("Select what best describes your work");
    }
    if (!TEAM_SIZES.some((t) => t.id === team_size)) {
      return respErr("Select whether you work solo or with a team");
    }

    await completeOnboarding({
      user_uuid: uuid,
      nickname,
      work_role,
      team_size,
    });

    return respData({ ok: true, credits: 3 });
  } catch (e) {
    console.error("onboarding failed:", e);
    return respErr(e instanceof Error ? e.message : "Could not save profile");
  }
}
