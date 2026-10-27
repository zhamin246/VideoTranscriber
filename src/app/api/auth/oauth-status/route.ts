import { NextResponse } from "next/server";

/** Whether Google OAuth can run (server env complete). Used to hide broken sign-in buttons. */
export function GET() {
  const hasAuthSecret = Boolean(
    process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim(),
  );
  const google =
    process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true" &&
    Boolean(process.env.AUTH_GOOGLE_ID?.trim()) &&
    Boolean(process.env.AUTH_GOOGLE_SECRET?.trim()) &&
    hasAuthSecret;

  return NextResponse.json({ google });
}
