"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import type { StoredScanResult } from "@/lib/face-rating/result-store";
import type { ActionPlanJson } from "@/lib/face-rating/action-plan";

const CACHE_PREFIX = "face-rating:action-plan:";

type Props = {
  scan: StoredScanResult;
  leverageLabel: string;
  leverageScore: number;
  faceShape: string;
};

type State =
  | { status: "loading" }
  | { status: "ready"; plan: ActionPlanJson }
  | { status: "error"; message: string };

function cacheKey(id: string) {
  return CACHE_PREFIX + id;
}

export default function ReportActionPlan({
  scan,
  leverageLabel,
  leverageScore,
  faceShape,
}: Props) {
  const [state, setState] = useState<State>({ status: "loading" });
  const started = useRef(false);

  const load = async (force = false) => {
    if (!force) {
      try {
        const raw = sessionStorage.getItem(cacheKey(scan.id));
        if (raw) {
          const parsed = JSON.parse(raw) as ActionPlanJson;
          if (parsed?.objective && parsed?.actions?.length) {
            setState({ status: "ready", plan: parsed });
            return;
          }
        }
      } catch {
        /* ignore */
      }
    }

    setState({ status: "loading" });
    try {
      // Strip heavy fields for the request
      const slim: StoredScanResult = {
        ...scan,
        landmarks: undefined,
        previewUrl: scan.previewUrl?.startsWith("data:")
          ? ""
          : scan.previewUrl || "",
      };
      const res = await fetch("/api/face-rating/action-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scan: slim }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.code !== 0 || !data?.data?.plan) {
        throw new Error(data?.message || "Failed to generate action plan");
      }
      const plan = data.data.plan as ActionPlanJson;
      try {
        sessionStorage.setItem(cacheKey(scan.id), JSON.stringify(plan));
      } catch {
        /* quota */
      }
      setState({ status: "ready", plan });
    } catch (e) {
      setState({
        status: "error",
        message: e instanceof Error ? e.message : "Failed to generate action plan",
      });
    }
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void load(false);
  }, [scan.id]);

  return (
    <section id="report-close" className="mt-14 scroll-mt-24">
      <div className="mb-4 border-b border-[#ececec] pb-2.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9ca3af]">
          09 · Action plan
        </p>
        <h2 className="font-heading mt-1 text-2xl tracking-tight text-[#0a0a0a] sm:text-3xl">
          What to <em className="font-serif font-normal italic text-[#9F1239]">do next.</em>
        </h2>
        <p className="mt-1.5 max-w-[60ch] text-sm leading-relaxed text-zinc-600">
          Daily habits, skincare, training, personal-care upgrades, and outfit choices — focused on
          your highest-ROI shortboard{" "}
          <strong className="text-[#0a0a0a]">
            {leverageLabel} ({leverageScore}/100)
          </strong>{" "}
          · face shape <strong className="text-[#0a0a0a]">{faceShape}</strong>.
        </p>
      </div>

      {state.status === "loading" ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-[#e5e5e5] bg-white px-6 py-16 text-center">
          <Loader2 className="h-7 w-7 animate-spin text-[#9F1239]" />
          <p className="text-sm font-semibold text-[#0a0a0a]">
            Building your action plan with AI…
          </p>
          <p className="max-w-sm text-xs text-zinc-500">
            Prioritizing habits and product upgrades around your lowest-scoring region.
          </p>
        </div>
      ) : state.status === "error" ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-[#e5e5e5] bg-white px-6 py-12 text-center">
          <p className="text-sm font-semibold text-[#0a0a0a]">Couldn’t build action plan</p>
          <p className="max-w-sm text-sm text-zinc-500">{state.message}</p>
          <button
            type="button"
            onClick={() => {
              started.current = false;
              void load(true);
            }}
            className="mt-1 inline-flex h-9 items-center gap-2 rounded-full bg-[#9F1239] px-4 text-sm font-bold text-white hover:bg-[#881337]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9f1239]">
              Objective
            </p>
            <p className="mt-2 text-[15px] leading-relaxed text-[#0a0a0a]">
              {state.plan.objective}
            </p>
          </div>

          <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9f1239]">
              Next 72 hours
            </p>
            <h3 className="mt-1 text-lg font-black text-[#0a0a0a]">Start here</h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-zinc-700">
              {state.plan.hours72.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ol>
          </div>

          <div>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h3 className="text-xl font-black text-[#0a0a0a]">Priority actions</h3>
                <p className="mt-1 text-sm text-zinc-500">
                  Energy goes to the shortboard first — skincare, training, products, outfits.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void load(true)}
                className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-[#9F1239] hover:underline"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerate
              </button>
            </div>
            <ol className="space-y-3">
              {state.plan.actions.map((p, i) => (
                <li
                  key={`${p.title}-${i}`}
                  className="rounded-xl border border-[#e5e5e5] bg-white p-4"
                >
                  <div className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200/60">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-[#0a0a0a]">{p.title}</p>
                      <p className="text-xs font-bold uppercase tracking-wide text-[#9f1239]">
                        {p.category} · {p.effort} · {p.cost}
                      </p>
                      <p className="mt-1 text-sm text-zinc-500">{p.why}</p>
                      <p className="mt-2 text-sm font-semibold text-[#0a0a0a]">{p.do}</p>
                      <p className="mt-2 text-[11px] font-medium text-zinc-400">
                        Verify · {p.verify_by}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9f1239]">
                AM skincare
              </p>
              <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-sm text-zinc-700">
                {state.plan.routines.am_skincare.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
            <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9f1239]">
                PM skincare
              </p>
              <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-sm text-zinc-700">
                {state.plan.routines.pm_skincare.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          </div>

          <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9f1239]">
              Training · weekly
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-zinc-700">
              {state.plan.routines.training_weekly.map((s, i) => (
                <li key={i}>· {s}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9f1239]">
              Product upgrades
            </p>
            <ul className="mt-3 space-y-3">
              {state.plan.product_upgrades.map((p, i) => (
                <li key={i}>
                  <p className="text-sm font-bold text-[#0a0a0a]">
                    <span className="uppercase text-[#9f1239]">{p.slot}</span> — {p.suggestion}
                  </p>
                  <p className="text-sm text-zinc-500">{p.why}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9f1239]">
              Outfit rules
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-zinc-700">
              {state.plan.outfit_rules.map((s, i) => (
                <li key={i}>· {s}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9f1239]">
              Timeline
            </p>
            <h3 className="mt-1 text-lg font-black text-[#0a0a0a]">4-week arc</h3>
            <div className="mt-4 space-y-4">
              {state.plan.schedule.map((w) => (
                <div key={w.phase}>
                  <p className="text-sm font-black text-[#0a0a0a]">
                    {w.phase}{" "}
                    <span className="font-semibold text-zinc-500">· {w.focus}</span>
                  </p>
                  <ul className="mt-1.5 space-y-1 pl-4 text-sm text-zinc-700">
                    {w.items.map((item, i) => (
                      <li key={i} className="list-disc">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-[11px] leading-relaxed text-zinc-500">
            Habit and product guidance for information only — not medical, dermatological, or
            professional advice.
          </p>
        </div>
      )}
    </section>
  );
}
