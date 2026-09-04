import { NextRequest } from "next/server";
import { respData, respErr } from "@/lib/resp";
import { getUuid } from "@/lib/hash";
import { hashPassword, validatePassword } from "@/lib/auth/password";
import {
  findUserByEmailAndProvider,
  insertUser,
} from "@/models/user";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");

    if (!email || !EMAIL_RE.test(email)) {
      return respErr("Enter a valid email address");
    }
    const pwdErr = validatePassword(password);
    if (pwdErr) return respErr(pwdErr);

    const existing = await findUserByEmailAndProvider(email, "credentials");
    if (existing) {
      return respErr("An account with this email already exists. Sign in instead.");
    }

    const password_hash = await hashPassword(password);
    const local = email.split("@")[0] || "user";
    const user = await insertUser({
      uuid: getUuid(),
      email,
      nickname: local,
      avatar_url: "",
      signin_type: "credentials",
      signin_provider: "credentials",
      signin_openid: email,
      password_hash,
      created_at: new Date(),
      updated_at: new Date(),
    });

    if (!user) {
      return respErr("Could not create account");
    }

    return respData({
      ok: true,
      email: user.email,
    });
  } catch (e) {
    console.error("register failed:", e);
    return respErr(e instanceof Error ? e.message : "Registration failed");
  }
}
