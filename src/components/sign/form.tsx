"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.8-6.6 7.3l6.2 5.2C37.3 38.3 44 33 44 24c0-1.3-.1-2.5-.4-3.5z"
      />
    </svg>
  );
}

export default function SignForm() {
  const search = useSearchParams();
  const callbackUrl = search.get("callbackUrl") || "/";
  const googleEnabled = process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextUrl = `/auth/onboarding?next=${encodeURIComponent(
    callbackUrl.startsWith("/") ? callbackUrl : "/"
  )}`;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, callbackUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.code !== 0) {
        throw new Error(data?.message || "Failed to send login email");
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send login email");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="w-full max-w-md text-center" style={{ color: "#0a0a0a" }}>
        <h1 className="text-[40px] font-bold tracking-tight">Success!</h1>
        <p className="mt-2 text-[17px] text-[#525252]">
          Check your email for the link to sign in
        </p>
        <div
          className="mt-8 overflow-hidden rounded-[24px] bg-white p-[2px] shadow-sm"
          style={{
            background:
              "linear-gradient(90deg,#34d399 0%,#fbbf24 40%,#fb923c 70%,#fb7185 100%)",
          }}
        >
          <div className="rounded-[22px] bg-white px-8 py-12">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#FFF1F2]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="#9F1239" strokeWidth="1.8" />
                <path d="M4 7l8 6 8-6" stroke="#9F1239" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="mt-5 text-[15px] leading-relaxed text-[#525252]">
              No email? Check your spam folder or{" "}
              <button
                type="button"
                className="font-medium hover:underline"
                style={{ color: "#9F1239" }}
                onClick={() => {
                  setSent(false);
                  setError(null);
                }}
              >
                try again
              </button>
              .
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-[640px]"
      style={{ color: "#0a0a0a", colorScheme: "light" }}
    >
      <h1 className="whitespace-nowrap text-center text-[28px] font-bold leading-tight tracking-tight sm:text-[32px]">
        Create an account or sign in
      </h1>
      <p
        className="mt-3 text-center text-[16px] leading-relaxed"
        style={{ color: "#525252" }}
      >
        Continue with Google or your email
        <br />
        No password required
      </p>
      <div
        className="mx-auto mt-8 max-w-[440px] overflow-hidden rounded-[24px] p-[2px] shadow-sm"
        style={{
          background:
            "linear-gradient(90deg,#34d399 0%,#fbbf24 40%,#fb923c 70%,#fb7185 100%)",
        }}
      >
        <div
          className="rounded-[22px] px-7 py-8 sm:px-8"
          style={{ backgroundColor: "#ffffff" }}
        >
          {googleEnabled ? (
            <button
              type="button"
              disabled={googleLoading || loading}
              onClick={() => {
                setGoogleLoading(true);
                void signIn("google", { callbackUrl: nextUrl });
              }}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-full border text-[15px] font-medium hover:bg-[#fafafa] disabled:opacity-60"
              style={{
                borderColor: "#e5e5e5",
                backgroundColor: "#ffffff",
                color: "#0a0a0a",
              }}
            >
              <GoogleMark />
              Continue with Google
            </button>
          ) : null}

          {googleEnabled ? (
            <div
              className="my-5 flex items-center gap-3 text-[13px]"
              style={{ color: "#a3a3a3" }}
            >
              <span className="h-px flex-1" style={{ backgroundColor: "#ececec" }} />
              OR
              <span className="h-px flex-1" style={{ backgroundColor: "#ececec" }} />
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <label
                htmlFor="email"
                className="text-[15px] font-medium"
                style={{ color: "#0a0a0a" }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 w-full rounded-xl border px-4 text-[15px] outline-none placeholder:text-[#a3a3a3]"
                style={{
                  borderColor: "#e5e5e5",
                  backgroundColor: "#ffffff",
                  color: "#0a0a0a",
                  colorScheme: "light",
                  caretColor: "#0a0a0a",
                }}
              />
            </div>

            {error ? (
              <p className="text-sm font-medium" style={{ color: "#dc2626" }}>
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="h-12 w-full rounded-full text-[16px] font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: "#9F1239" }}
            >
              {loading ? "Sending…" : "Continue"}
            </button>
          </form>
        </div>
      </div>

      <p
        className="mt-5 text-balance text-center text-xs leading-relaxed"
        style={{ color: "#737373" }}
      >
        There&apos;s no separate sign-up — your account is created when you
        first sign in. No password needed.
      </p>
      <p
        className="mt-2 text-balance text-center text-xs"
        style={{ color: "#737373" }}
      >
        By continuing, you agree to our{" "}
        <a
          href="/terms-of-service"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-4"
          style={{ color: "#525252" }}
        >
          Terms of Service
        </a>{" "}
        and{" "}
        <a
          href="/privacy-policy"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-4"
          style={{ color: "#525252" }}
        >
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
}
