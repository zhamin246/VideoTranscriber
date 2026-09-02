"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import FaceRatingSiteHeader from "@/components/face-rating/site-header";
import FaceRatingSiteFooter from "@/components/face-rating/site-footer";

/**
 * Landing page for magic-link emails.
 * Completes Auth.js credentials sign-in with the one-time token.
 */
export default function MagicLinkVerifyPage() {
  const search = useSearchParams();
  const token = search.get("token") || "";
  const callbackUrl = search.get("callbackUrl") || "/";
  const [status, setStatus] = useState<"working" | "error">("working");
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("This login link is missing a token. Request a new one.");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await signIn("email-magic-link", {
          token,
          redirect: false,
          callbackUrl,
        });
        if (cancelled) return;
        if (res?.error) {
          setStatus("error");
          setMessage(
            res.error === "CredentialsSignin"
              ? "This login link is invalid or has expired. Request a new one."
              : res.error
          );
          return;
        }
        const next = callbackUrl.startsWith("/") ? callbackUrl : "/";
        const onboarding = next.startsWith("/auth/onboarding")
          ? next
          : `/auth/onboarding?next=${encodeURIComponent(next)}`;
        window.location.href = onboarding;
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("Something went wrong signing you in. Try again.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, callbackUrl]);

  return (
    <div
      className="flex min-h-svh flex-col"
      style={{ backgroundColor: "#ffffff", color: "#0a0a0a" }}
      data-theme="light"
    >
      <FaceRatingSiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm rounded-xl border border-[#e5e5e5] bg-white p-8 text-center shadow-sm">
          {status === "working" ? (
            <>
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#9f1239] border-t-transparent" />
              <p className="mt-4 text-sm font-medium text-[#0a0a0a]">{message}</p>
            </>
          ) : (
            <>
              <h1 className="text-lg font-bold text-[#0a0a0a]">
                Couldn&apos;t sign you in
              </h1>
              <p className="mt-2 text-sm text-[#525252]">{message}</p>
              <Link
                href="/auth/signin"
                className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-[#9f1239] px-5 text-sm font-bold text-white"
              >
                Request a new link
              </Link>
            </>
          )}
        </div>
      </main>
      <FaceRatingSiteFooter />
    </div>
  );
}
