"use client";

import { useEffect, useState, type ReactNode } from "react";
import { signIn } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAppContext } from "@/contexts/app";

const PRIMARY = "#4C6EF5";

function RememberCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-left"
    >
      <span
        className="flex size-[18px] shrink-0 items-center justify-center rounded-[4px] border transition-colors"
        style={{
          borderColor: checked ? PRIMARY : "#D1D5DB",
          backgroundColor: checked ? PRIMARY : "#ffffff",
        }}
      >
        {checked ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path
              d="M2.5 6.2 5 8.7 9.5 3.8"
              stroke="#ffffff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
      <span className="text-[13px] font-normal" style={{ color: "#374151" }}>
        {label}
      </span>
    </button>
  );
}

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

function BrandMark({ size = 28 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/favicon.svg"
      alt=""
      width={size}
      height={size}
      className="object-contain"
      style={{ width: size, height: size }}
    />
  );
}

function FeatureIcon({ kind }: { kind: "cc" | "speaker" | "lang" }) {
  if (kind === "cc") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3" y="6" width="18" height="12" rx="2" stroke="#4C6EF5" strokeWidth="1.6" />
        <path
          d="M8 12.2c.3-.9 1-1.4 1.9-1.4.9 0 1.5.5 1.5 1.3 0 .9-.7 1.4-1.6 1.4-.4 0-.8-.1-1.1-.3M14.2 12.2c.3-.9 1-1.4 1.9-1.4.9 0 1.5.5 1.5 1.3 0 .9-.7 1.4-1.6 1.4-.4 0-.8-.1-1.1-.3"
          stroke="#4C6EF5"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (kind === "speaker") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="10" cy="8" r="3" stroke="#4C6EF5" strokeWidth="1.6" />
        <path
          d="M4.5 18c1.2-2.4 3-3.6 5.5-3.6s4.3 1.2 5.5 3.6"
          stroke="#4C6EF5"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="17.5" cy="10.5" r="3.2" stroke="#4C6EF5" strokeWidth="1.4" />
        <path d="M16.2 10.5h2.6M17.5 9.2v2.6" stroke="#4C6EF5" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="4" width="6" height="6" rx="1.2" stroke="#4C6EF5" strokeWidth="1.5" />
      <rect x="14" y="4" width="6" height="6" rx="1.2" stroke="#4C6EF5" strokeWidth="1.5" />
      <rect x="4" y="14" width="6" height="6" rx="1.2" stroke="#4C6EF5" strokeWidth="1.5" />
      <rect x="14" y="14" width="6" height="6" rx="1.2" stroke="#4C6EF5" strokeWidth="1.5" />
    </svg>
  );
}

function MarketingPanel() {
  return (
    <div
      className="hidden h-full flex-col rounded-[20px] p-6 lg:flex"
      style={{ backgroundColor: "#F4F5F7" }}
    >
      <div className="flex items-center gap-2.5">
        <BrandMark size={26} />
        <span className="text-[15px] font-semibold tracking-tight text-[#111827]">
          Video Transcriber
        </span>
      </div>

      <div className="relative mx-auto my-8 flex w-full max-w-[340px] flex-1 items-center justify-center">
        <div className="relative w-full">
          {/* Input card */}
          <div className="absolute left-0 top-6 z-10 w-[118px] overflow-hidden rounded-xl border border-white bg-white shadow-md">
            <div
              className="h-[72px] bg-cover bg-center"
              style={{
                backgroundImage:
                  "linear-gradient(135deg,#c7d2fe 0%,#a5b4fc 40%,#818cf8 100%)",
              }}
            />
            <div className="flex items-end gap-0.5 px-2.5 py-2">
              {[4, 8, 5, 11, 7, 9, 4, 6, 10, 5].map((h, i) => (
                <span
                  key={i}
                  className="w-1.5 rounded-sm bg-[#4C6EF5]/30"
                  style={{ height: h }}
                />
              ))}
            </div>
          </div>

          {/* AI hub */}
          <div className="absolute left-1/2 top-[78px] z-20 flex size-12 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-br from-[#60a5fa] via-[#4C6EF5] to-[#7c3aed] text-[11px] font-bold text-white shadow-lg">
            AI
          </div>

          {/* Transcript card */}
          <div className="absolute right-0 top-0 z-10 w-[168px] rounded-xl border border-[#E5E7EB] bg-white p-2.5 shadow-md">
            <p className="mb-1.5 text-[10px] font-semibold text-[#6B7280]">
              Transcript
            </p>
            <div className="space-y-1.5 text-[10px] leading-snug">
              <p>
                <span className="font-semibold text-[#4C6EF5]">00:00</span>{" "}
                <span className="font-semibold text-[#111827]">David</span>
                <span className="text-[#6B7280]"> Let’s kick off…</span>
              </p>
              <p>
                <span className="font-semibold text-[#4C6EF5]">00:31</span>{" "}
                <span className="font-semibold text-[#111827]">Lisa</span>
                <span className="text-[#6B7280]"> Sounds good.</span>
              </p>
            </div>
          </div>

          {/* Translate card */}
          <div className="absolute bottom-0 right-2 z-10 w-[176px] rounded-xl border border-[#E5E7EB] bg-white p-2.5 shadow-md">
            <p className="mb-1.5 text-[10px] font-semibold text-[#6B7280]">
              Translate
            </p>
            <div className="mb-2 flex items-center justify-between rounded-md bg-[#F3F4F6] px-2 py-1 text-[10px] font-medium text-[#374151]">
              <span>English</span>
              <span className="text-[#9CA3AF]">→</span>
              <span>Spanish</span>
            </div>
            <div className="flex gap-1">
              {["🇺🇸", "🇩🇪", "🇫🇷", "🇯🇵", "🇧🇷"].map((f) => (
                <span
                  key={f}
                  className="flex size-5 items-center justify-center rounded-full bg-[#F9FAFB] text-[11px]"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Connector lines (decorative) */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 340 220"
            fill="none"
            aria-hidden
          >
            <path
              d="M118 90 C150 90, 150 100, 170 100"
              stroke="#C7D2FE"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
            <path
              d="M194 100 C230 100, 240 50, 250 42"
              stroke="#C7D2FE"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
            <path
              d="M194 108 C230 108, 240 170, 250 178"
              stroke="#C7D2FE"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
          </svg>

          <div className="h-[220px]" />
        </div>
      </div>

      <div className="mt-auto grid grid-cols-3 gap-3">
        {(
          [
            {
              kind: "cc" as const,
              title: "Fast & online",
              body: "Get transcripts from video in seconds",
            },
            {
              kind: "speaker" as const,
              title: "Speaker recognition",
              body: "Easily see who said what with speaker labeling",
            },
            {
              kind: "lang" as const,
              title: "200+ Languages",
              body: "Transcribe video to text in 200+ languages",
            },
          ] as const
        ).map((f) => (
          <div key={f.title} className="min-w-0">
            <FeatureIcon kind={f.kind} />
            <p className="mt-2 text-[12px] font-semibold leading-tight text-[#111827]">
              {f.title}
            </p>
            <p className="mt-1 text-[11px] leading-snug text-[#6B7280]">
              {f.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LightInput({
  id,
  type,
  placeholder,
  value,
  onChange,
  autoComplete,
  rightSlot,
  leftIcon,
}: {
  id: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  rightSlot?: ReactNode;
  leftIcon?: ReactNode;
}) {
  return (
    <div className="relative">
      {leftIcon ? (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
          {leftIcon}
        </span>
      ) : null}
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className={`h-11 w-full rounded-lg border text-[14px] outline-none focus:border-[#4C6EF5] focus:ring-2 focus:ring-[#4C6EF5]/15 ${
          leftIcon ? "pl-10" : "pl-3.5"
        } ${rightSlot ? "pr-10" : "pr-3.5"}`}
        style={{
          borderColor: "#E5E7EB",
          backgroundColor: "#ffffff",
          color: "#111827",
          colorScheme: "light",
          caretColor: "#111827",
          WebkitTextFillColor: "#111827",
        }}
      />
      {rightSlot ? (
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
          {rightSlot}
        </span>
      ) : null}
    </div>
  );
}

function AuthPanel({
  callbackUrl,
  resetKey,
}: {
  callbackUrl: string;
  resetKey: number;
}) {
  const googleEnabled = process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true";
  const [mode, setMode] = useState<"signup" | "signin" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState(false);

  useEffect(() => {
    setMode("signin");
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setRememberMe(true);
    setError(null);
    setForgotSent(false);
    setLoading(false);
    setGoogleLoading(false);
  }, [resetKey]);

  const nextUrl = callbackUrl.startsWith("/") ? callbackUrl : "/";

  async function finishCredentialsSignIn(remember = rememberMe) {
    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      rememberMe: remember ? "true" : "false",
      redirect: false,
      callbackUrl: nextUrl,
    });
    if (res?.error) {
      throw new Error(
        mode === "signin"
          ? "Invalid email or password"
          : "Could not sign in. Try again.",
      );
    }
    window.location.href = res?.url || nextUrl;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid email address");
      return;
    }

    if (mode === "forgot") {
      setLoading(true);
      try {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmed }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.code !== 0) {
          throw new Error(data?.message || "Failed to send reset email");
        }
        setForgotSent(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send reset email");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmed, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.code !== 0) {
          throw new Error(data?.message || "Registration failed");
        }
      }
      await finishCredentialsSignIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  if (forgotSent) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center sm:px-10">
        <h3 className="text-[22px] font-bold text-[#111827]">Check your email</h3>
        <p className="mt-2 max-w-[280px] text-[14px] leading-relaxed text-[#6B7280]">
          If an account exists for that address, we sent a password reset link.
        </p>
        <button
          type="button"
          className="mt-6 text-[14px] font-medium hover:underline"
          style={{ color: PRIMARY }}
          onClick={() => {
            setForgotSent(false);
            setMode("signin");
            setError(null);
          }}
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col px-6 py-8 sm:px-10 sm:py-9">
      <div className="mx-auto flex w-full max-w-[360px] flex-1 flex-col justify-center">
        <div className="flex flex-col items-center text-center">
          <BrandMark size={40} />
          <h2 className="mt-4 text-[22px] font-bold leading-tight tracking-tight text-[#111827] sm:text-[26px]">
            Welcome to Video Transcriber AI
          </h2>
          <p className="mt-3 text-[14px] text-[#6B7280]">
            <span aria-hidden>🎁</span> Sign in to unlock
          </p>
          <p
            className="mt-1 rounded-md px-2 py-0.5 text-[14px] font-medium"
            style={{ backgroundColor: "#EEF2FF", color: "#1E3A8A" }}
          >
            <span style={{ color: PRIMARY, fontWeight: 700 }}>90</span> free
            minutes / month ·{" "}
            <span style={{ color: PRIMARY, fontWeight: 700 }}>3</span> files /
            day
          </p>
        </div>

        <div className="mt-7 space-y-3">
          {googleEnabled && mode !== "forgot" ? (
            <>
              <button
                type="button"
                disabled={googleLoading || loading}
                onClick={() => {
                  setGoogleLoading(true);
                  void signIn("google", { callbackUrl: nextUrl });
                }}
                className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg text-[15px] font-semibold text-white shadow-sm disabled:opacity-60"
                style={{ backgroundColor: PRIMARY }}
              >
                <span className="flex size-6 items-center justify-center rounded-full bg-white">
                  <GoogleMark />
                </span>
                Continue with Google
              </button>
              <div className="flex items-center gap-3 py-0.5 text-[12px] font-medium text-[#9CA3AF]">
                <span className="h-px flex-1 bg-[#E5E7EB]" />
                OR
                <span className="h-px flex-1 bg-[#E5E7EB]" />
              </div>
            </>
          ) : null}

          <form onSubmit={onSubmit} className="grid gap-3">
            <LightInput
              id="sign-modal-email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={email}
              onChange={setEmail}
              leftIcon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                </svg>
              }
            />

            {mode !== "forgot" ? (
              <LightInput
                id="sign-modal-password"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                placeholder="Enter your password"
                value={password}
                onChange={setPassword}
                leftIcon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.7" />
                    <path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                }
                rightSlot={
                  <button
                    type="button"
                    tabIndex={-1}
                    className="rounded p-1 text-[#9CA3AF] hover:text-[#6B7280]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="1.7" />
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M3 3l18 18M10.5 10.6a2 2 0 002.9 2.9M9.9 5.1A9.8 9.8 0 0112 5c5 0 9 4 10 7-.4 1.2-1.2 2.6-2.4 3.8M6.1 6.2C4.4 7.5 3.3 9.1 3 12c1 3 5 7 9 7 1.4 0 2.7-.3 3.9-.9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                      </svg>
                    )}
                  </button>
                }
              />
            ) : null}

            {mode !== "forgot" ? (
              <div
                className={`flex items-center gap-3 ${
                  mode === "signin" ? "justify-between" : "justify-start"
                }`}
              >
                <RememberCheckbox
                  checked={rememberMe}
                  onChange={setRememberMe}
                  label="Remember me"
                />
                {mode === "signin" ? (
                  <button
                    type="button"
                    className="shrink-0 text-[12px] font-medium hover:underline"
                    style={{ color: PRIMARY }}
                    onClick={() => {
                      setMode("forgot");
                      setError(null);
                      setForgotSent(false);
                    }}
                  >
                    Forgot password?
                  </button>
                ) : null}
              </div>
            ) : null}

            {error ? (
              <p className="text-sm font-medium text-red-600">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="h-11 w-full rounded-lg text-[15px] font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: PRIMARY }}
            >
              {loading
                ? mode === "forgot"
                  ? "Sending…"
                  : mode === "signup"
                    ? "Creating…"
                    : "Signing in…"
                : mode === "forgot"
                  ? "Send reset link"
                  : mode === "signup"
                    ? "Sign up"
                    : "Sign in"}
            </button>
          </form>

          {mode === "forgot" ? (
            <p className="pt-1 text-center text-[13px] text-[#6B7280]">
              Remembered it?{" "}
              <button
                type="button"
                className="font-semibold hover:underline"
                style={{ color: PRIMARY }}
                onClick={() => setMode("signin")}
              >
                Sign in
              </button>
            </p>
          ) : mode === "signup" ? (
            <p className="pt-1 text-center text-[13px] text-[#6B7280]">
              Already have an account?{" "}
              <button
                type="button"
                className="font-semibold hover:underline"
                style={{ color: PRIMARY }}
                onClick={() => {
                  setMode("signin");
                  setError(null);
                }}
              >
                Sign in
              </button>
            </p>
          ) : (
            <p className="pt-1 text-center text-[13px] text-[#6B7280]">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="font-semibold hover:underline"
                style={{ color: PRIMARY }}
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
              >
                Sign up
              </button>
            </p>
          )}
        </div>

        <div className="mt-7 space-y-3">
          <div className="flex items-center justify-center gap-4 text-[11px] font-medium text-[#6B7280]">
            <span className="inline-flex items-center gap-1">
              <span style={{ color: "#22C55E" }}>🛡</span> Secure
            </span>
            <span className="inline-flex items-center gap-1">
              <span style={{ color: PRIMARY }}>🔒</span> Private
            </span>
            <span className="inline-flex items-center gap-1">
              <span style={{ color: "#8B5CF6" }}>✓</span> Trust
            </span>
          </div>
          <p className="text-balance text-center text-[11px] leading-relaxed text-[#9CA3AF]">
            By continuing, you agree to our{" "}
            <a
              href="/terms-of-service"
              target="_blank"
              rel="noreferrer"
              className="font-medium hover:underline"
              style={{ color: PRIMARY }}
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy-policy"
              target="_blank"
              rel="noreferrer"
              className="font-medium hover:underline"
              style={{ color: PRIMARY }}
            >
              Privacy Policy
            </a>
            .
            <br />
            We&apos;ll never share your data without permission.
          </p>
        </div>
      </div>
      <style>{`
        #sign-modal-email::placeholder,
        #sign-modal-password::placeholder {
          color: #9ca3af;
          -webkit-text-fill-color: #9ca3af;
          opacity: 1;
        }
        #sign-modal-email:-webkit-autofill,
        #sign-modal-email:-webkit-autofill:hover,
        #sign-modal-email:-webkit-autofill:focus,
        #sign-modal-password:-webkit-autofill,
        #sign-modal-password:-webkit-autofill:hover,
        #sign-modal-password:-webkit-autofill:focus {
          -webkit-text-fill-color: #111827 !important;
          box-shadow: 0 0 0 1000px #ffffff inset !important;
          transition: background-color 99999s ease-in-out 0s;
        }
      `}</style>
    </div>
  );
}

export default function SignModal() {
  const { showSignModal, setShowSignModal, signInCallbackUrl } =
    useAppContext();
  const [mounted, setMounted] = useState(false);
  const [panelKey, setPanelKey] = useState(0);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (showSignModal) setPanelKey((k) => k + 1);
  }, [showSignModal]);
  if (!mounted) return null;

  return (
    <Dialog
      open={showSignModal}
      onOpenChange={(open) => setShowSignModal(open)}
    >
      <DialogContent
        className="max-h-[92vh] gap-0 overflow-hidden border-0 bg-white p-0 shadow-2xl sm:max-w-[920px] sm:rounded-[24px] [color-scheme:light]"
        style={{ colorScheme: "light", backgroundColor: "#ffffff" }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Sign in</DialogTitle>
          <DialogDescription>
            Sign in to Video Transcriber with Google or email and password
          </DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[92vh] overflow-y-auto lg:grid-cols-[1.05fr_0.95fr] lg:overflow-hidden">
          <div className="p-3 lg:p-4">
            <MarketingPanel />
          </div>
          <AuthPanel
            key={panelKey}
            resetKey={panelKey}
            callbackUrl={signInCallbackUrl || "/"}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
