import { NextRequest } from "next/server";
import { respData, respErr } from "@/lib/resp";
import { verifyPasswordResetToken } from "@/lib/auth/password-reset";
import { hashPassword, validatePassword } from "@/lib/auth/password";
import {
  findUserByEmailAndProvider,
  updateUserPasswordHash,
} from "@/models/user";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = String(body.token || "");
    const password = String(body.password || "");

    const pwdErr = validatePassword(password);
    if (pwdErr) return respErr(pwdErr);

    const result = verifyPasswordResetToken(token);
    if ("error" in result) {
      return respErr(
        result.error === "expired"
          ? "Reset link expired. Request a new one."
          : "Invalid reset link.",
      );
    }

    const user = await findUserByEmailAndProvider(result.email, "credentials");
    if (!user) {
      return respErr("Account not found");
    }

    const password_hash = await hashPassword(password);
    await updateUserPasswordHash(user.uuid, password_hash);

    return respData({ ok: true, email: user.email });
  } catch (e) {
    console.error("reset-password failed:", e);
    return respErr(e instanceof Error ? e.message : "Failed to reset password");
  }
}
