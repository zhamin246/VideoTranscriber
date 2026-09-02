"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { WORK_ROLES, TEAM_SIZES } from "@/lib/auth/onboarding";

export default function OnboardingForm({
  defaultName = "",
}: {
  defaultName?: string;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const { update } = useSession();
  const next = search.get("next") || "/";

  const [name, setName] = useState(defaultName);
  const [role, setRole] = useState("");
  const [team, setTeam] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = Boolean(name.trim() && role && team);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const nickname = name.trim();
    if (!nickname) {
      setError("Enter a name we can call you");
      return;
    }
    if (!role) {
      setError("Select what best describes your work");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/account/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          work_role: role,
          team_size: team,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.code !== 0) {
        throw new Error(data?.message || "Could not save profile");
      }
      await update({
        user: { nickname, onboarded: true },
      });
      const target = next.startsWith("/") ? next : "/";
      router.replace(target);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-[640px]">
      <div
        className="overflow-hidden rounded-[24px] p-[2px] shadow-sm"
        style={{
          background:
            "linear-gradient(90deg,#34d399 0%,#fbbf24 40%,#fb923c 70%,#fb7185 100%)",
        }}
      >
        <div className="rounded-[22px] bg-white px-6 py-7 sm:px-8">
          <label className="block text-[15px] font-semibold text-[#0a0a0a]">
            What should we call you?
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 h-12 w-full rounded-xl border px-4 text-[15px] outline-none placeholder:text-[#a3a3a3]"
            autoComplete="name"
            style={{
              borderColor: "#e5e5e5",
              backgroundColor: "#ffffff",
              color: "#0a0a0a",
              colorScheme: "light",
              caretColor: "#0a0a0a",
            }}
          />

          <p className="mt-6 text-[15px] font-semibold text-[#0a0a0a]">
            What best describes your work?
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {WORK_ROLES.map((item) => {
              const selected = role === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRole(item.id)}
                  className="rounded-xl border-2 px-4 py-3 text-left text-[14px] leading-snug"
                  style={
                    selected
                      ? {
                          borderColor: "#9F1239",
                          backgroundColor: "#FCE7EF",
                          color: "#9F1239",
                          fontWeight: 600,
                        }
                      : {
                          borderColor: "#e5e5e5",
                          backgroundColor: "#ffffff",
                          color: "#0a0a0a",
                        }
                  }
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <p className="mt-6 text-[15px] font-semibold text-[#0a0a0a]">
            Are you working solo or with a team?
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {TEAM_SIZES.map((item) => {
              const selected = team === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTeam(item.id)}
                  className="rounded-xl border-2 px-3 py-3 text-center text-[14px] leading-snug"
                  style={
                    selected
                      ? {
                          borderColor: "#9F1239",
                          backgroundColor: "#FCE7EF",
                          color: "#9F1239",
                          fontWeight: 600,
                        }
                      : {
                          borderColor: "#e5e5e5",
                          backgroundColor: "#ffffff",
                          color: "#0a0a0a",
                        }
                  }
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {error ? (
            <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={!ready || loading}
            className="mt-6 h-12 w-full rounded-full text-[16px] font-semibold"
            style={{
              backgroundColor: ready ? "#9F1239" : "#E5E5E5",
              color: ready ? "#ffffff" : "#A3A3A3",
              cursor: ready && !loading ? "pointer" : "not-allowed",
            }}
          >
            {loading ? "Saving…" : "Get started"}
          </button>
          <p className="mt-3 text-center text-[13px] text-[#a3a3a3]">
            Your 3 free conversions are ready inside.
          </p>
        </div>
      </div>
    </form>
  );
}
