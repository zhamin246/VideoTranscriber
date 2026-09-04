"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import FaceRatingSiteHeader from "@/components/face-rating/site-header";

function ResetForm() {
  const search = useSearchParams();
  const router = useRouter();
  const token = search.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (!token) {
      setError("Invalid reset link");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.code !== 0) {
        throw new Error(data?.message || "Failed to reset password");
      }
      const email = data?.data?.email as string | undefined;
      if (email) {
        const sign = await signIn("credentials", {
          email,
          password,
          redirect: false,
          callbackUrl: "/",
        });
        if (!sign?.error) {
          window.location.href = sign?.url || "/";
          return;
        }
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <p className="text-center text-sm text-[#525252]">
        This reset link is invalid.{" "}
        <button
          type="button"
          className="font-semibold text-[#4C6EF5] hover:underline"
          onClick={() => router.push("/")}
        >
          Go home
        </button>
      </p>
    );
  }

  if (done) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#111827]">Password updated</h1>
        <p className="mt-2 text-sm text-[#6B7280]">
          You can sign in with your new password.
        </p>
        <button
          type="button"
          className="mt-6 h-11 rounded-lg bg-[#4C6EF5] px-6 text-sm font-semibold text-white"
          onClick={() => router.push("/")}
        >
          Back to home
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-sm space-y-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#111827]">Set a new password</h1>
        <p className="mt-2 text-sm text-[#6B7280]">
          Choose a password with at least 8 characters.
        </p>
      </div>
      <input
        type="password"
        autoComplete="new-password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="h-11 w-full rounded-lg border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none [color-scheme:light]"
        style={{ WebkitTextFillColor: "#111827" }}
      />
      <input
        type="password"
        autoComplete="new-password"
        placeholder="Confirm password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
        className="h-11 w-full rounded-lg border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none [color-scheme:light]"
        style={{ WebkitTextFillColor: "#111827" }}
      />
      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="h-11 w-full rounded-lg bg-[#4C6EF5] text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-svh flex-col bg-white" style={{ colorScheme: "light" }}>
      <FaceRatingSiteHeader />
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <Suspense fallback={<p className="text-sm text-[#737373]">Loading…</p>}>
          <ResetForm />
        </Suspense>
      </main>
    </div>
  );
}
