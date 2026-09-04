import { NextRequest } from "next/server";
import { respData, respErr } from "@/lib/resp";
import { createPasswordResetToken } from "@/lib/auth/password-reset";
import { findUserByEmailAndProvider } from "@/models/user";
import { buildPasswordResetEmail, sendEmail } from "@/lib/email/send";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    if (!email || !EMAIL_RE.test(email)) {
      return respErr("Enter a valid email address");
    }

    // Always return success to avoid email enumeration
    const generic = {
      ok: true,
      message: "If an account exists, a reset link is on the way.",
    };

    const user = await findUserByEmailAndProvider(email, "credentials");
    if (!user?.password_hash) {
      return respData(generic);
    }

    const token = createPasswordResetToken(email);
    const webUrl = (process.env.NEXT_PUBLIC_WEB_URL || req.nextUrl.origin).replace(
      /\/$/,
      "",
    );
    const resetUrl = `${webUrl}/auth/reset-password?token=${encodeURIComponent(token)}`;
    const mail = buildPasswordResetEmail({ resetUrl, email });

    if (process.env.NODE_ENV === "development") {
      console.log("[password-reset] DEV reset URL for", email, "→", resetUrl);
    }

    await sendEmail({
      to: email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });

    return respData(generic);
  } catch (e) {
    console.error("forgot-password failed:", e);
    return respErr(e instanceof Error ? e.message : "Failed to send reset email");
  }
}
