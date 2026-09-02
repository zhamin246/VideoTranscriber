import { NextRequest } from "next/server";
import { respData, respErr } from "@/lib/resp";
import {
  createMagicLinkToken,
  isMagicLinkAuthEnabled,
} from "@/lib/auth/magic-link";
import { buildMagicLinkEmail, sendEmail } from "@/lib/email/send";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    if (!isMagicLinkAuthEnabled()) {
      return respErr("Email login is not enabled");
    }

    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const callbackUrl = String(body.callbackUrl || "/").trim() || "/";

    if (!email || !EMAIL_RE.test(email)) {
      return respErr("Enter a valid email address");
    }

    // Basic anti-abuse: reject extremely long callbacks
    if (callbackUrl.length > 500) {
      return respErr("Invalid callback URL");
    }

    const token = createMagicLinkToken(email);
    const webUrl = (process.env.NEXT_PUBLIC_WEB_URL || req.nextUrl.origin).replace(
      /\/$/,
      ""
    );
    const params = new URLSearchParams({
      token,
      callbackUrl: callbackUrl.startsWith("/") ? callbackUrl : "/",
    });
    const loginUrl = `${webUrl}/auth/verify?${params.toString()}`;

    const mail = buildMagicLinkEmail({ loginUrl, email });

    // Dev aid: always log link so you can test without SMTP
    if (process.env.NODE_ENV === "development") {
      console.log("[magic-link] DEV login URL for", email, "→", loginUrl);
    }

    await sendEmail({
      to: email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });

    return respData({
      ok: true,
      message: "If that email can receive mail, a login link is on the way.",
    });
  } catch (e) {
    console.error("magic-link send failed:", e);
    const msg = e instanceof Error ? e.message : "Failed to send login email";
    return respErr(msg);
  }
}
