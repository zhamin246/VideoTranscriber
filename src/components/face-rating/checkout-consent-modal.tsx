"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  loadScanResult,
  markScanUnlocked,
} from "@/lib/face-rating/result-store";
import {
  persistUnlockedReport,
  previewUrlForStorage,
  hardenScanPreviewInSession,
} from "@/lib/face-rating/persist-report";

const PRICE = "$9.90";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional prefilled email */
  defaultEmail?: string;
  /** Current scan id for unlock / Stripe metadata */
  scanId?: string;
  /**
   * When true, skip Stripe (dev only).
   * Default false — real Checkout with Stripe.
   */
  skipPayment?: boolean;
  /** Called after unlock when staying on the same page. */
  onUnlocked?: () => void;
};

function birthYears(): number[] {
  const y = new Date().getFullYear();
  // 18+ → max birth year = y - 18; go back ~100 years
  const max = y - 18;
  const min = y - 100;
  const years: number[] = [];
  for (let i = max; i >= min; i--) years.push(i);
  return years;
}

/**
 * Consent gate before full report, then Stripe Checkout ($9.90 once).
 * Set skipPayment for local unlock without charging.
 */
export default function CheckoutConsentModal({
  open,
  onOpenChange,
  defaultEmail = "",
  scanId,
  skipPayment = false,
  onUnlocked,
}: Props) {
  const router = useRouter();
  const years = useMemo(() => birthYears(), []);
  const [year, setYear] = useState("");
  const [consent, setConsent] = useState(false);
  const [email, setEmail] = useState(defaultEmail);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = year !== "" && consent;

  const reset = () => {
    setYear("");
    setConsent(false);
    setEmail(defaultEmail);
    setNoticeOpen(false);
    setError(null);
    setSubmitting(false);
  };

  const onAgree = async () => {
    if (!year) {
      setError("Please select your year of birth.");
      return;
    }
    if (!consent) {
      setError("Please confirm you are 18+ and consent to processing.");
      return;
    }
    const trimmedEmail = email.trim().toLowerCase();
    if (!skipPayment) {
      if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        setError("Enter a valid email for your receipt and report.");
        return;
      }
      if (!scanId) {
        setError("Missing scan. Run the face analysis again.");
        return;
      }
    }

    setError(null);
    setSubmitting(true);
    try {
      sessionStorage.setItem(
        "face-rating:checkout-consent",
        JSON.stringify({
          year: Number(year),
          email: trimmedEmail || null,
          at: Date.now(),
          skipPayment,
        })
      );
    } catch {
      /* ignore */
    }

    // ── Dev: skip Stripe ──
    if (skipPayment) {
      try {
        if (scanId) {
          markScanUnlocked(scanId, { email: trimmedEmail || null });
          const scan = loadScanResult(scanId);
          if (scan) {
            const saved = await persistUnlockedReport(scan, trimmedEmail || null);
            if (!saved.ok) console.warn("persist report:", saved.message);
          }
        }
        onOpenChange(false);
        onUnlocked?.();
        if (scanId) router.push(`/report/${scanId}`);
        else router.push("/tools/full-analysis");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // ── Stripe Checkout ──
    try {
      // Harden blob: → data: in session BEFORE Stripe redirect (blob dies on return)
      if (scanId) {
        await hardenScanPreviewInSession(scanId);
      }
      const scan = scanId ? loadScanResult(scanId) : null;
      let scanPayload = scan;
      if (scan) {
        const previewUrl =
          (await previewUrlForStorage(scan.previewUrl || "")) ||
          (scan.previewUrl?.startsWith("data:") ? scan.previewUrl : "");
        scanPayload = {
          ...scan,
          previewUrl,
          landmarks: undefined,
          unlockEmail: trimmedEmail,
        };
      }

      const res = await fetch("/api/face-rating/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scanId,
          email: trimmedEmail,
          scan: scanPayload,
          locale: "en",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.code !== 0 || !data?.data?.checkout_url) {
        throw new Error(data?.message || "Could not start checkout");
      }
      // Leave modal open briefly while browser navigates
      window.location.href = data.data.checkout_url as string;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent
        className="flex max-h-[min(92vh,820px)] w-[calc(100%-2rem)] max-w-[512px] flex-col gap-0 overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white p-0 text-[#0a0a0a] shadow-2xl sm:max-w-[512px] sm:rounded-2xl [color-scheme:light] [&>button]:hidden"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Header — competitor uses ~512px dialog, roomy title block */}
        <div className="relative shrink-0 border-b border-[#e5e5e5] px-6 pb-4 pt-5">
          <DialogTitle className="pr-10 text-lg font-bold tracking-tight text-[#0a0a0a] sm:text-xl">
            Create your report — {PRICE} once
          </DialogTitle>
          <p className="mt-1.5 text-sm leading-relaxed text-[#525252] sm:text-[15px]">
            {skipPayment
              ? "One quick permission — then open your full Face Report (payment skipped while we finish checkout)."
              : "Step 1 of 2 — one quick permission below, then secure checkout with Stripe."}
          </p>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-md text-[#525252] hover:bg-[#f5f5f5]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body — taller than before so email field is easier to reach */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {/* Provider notice box */}
          <div className="rounded-2xl border border-[#e5e5e5] bg-[#fafafa] p-4 text-[15px] leading-relaxed text-[#0a0a0a] sm:p-5">
            <p>
              <strong className="font-bold">On-device analysis + optional cloud providers</strong>{" "}
              — the full notice below names every provider and detail. Your photo is deleted
              within 2 hours (buyers: a private copy stays with your report until you delete it)
              and never sold or used to train AI.
            </p>

            <label className="mt-4 block text-sm font-semibold text-[#0a0a0a]" htmlFor="yob">
              Year of birth
            </label>
            <select
              id="yob"
              value={year}
              onChange={(e) => {
                setYear(e.target.value);
                setError(null);
              }}
              style={{
                colorScheme: "light",
                backgroundColor: "#ffffff",
                color: year ? "#0a0a0a" : "#a3a3a3",
              }}
              className={`mt-1.5 h-11 w-full rounded-xl border !bg-white px-3.5 text-sm outline-none focus:ring-2 focus:ring-[#9F1239]/40 ${
                year ? "border-[#e5e5e5] !text-[#0a0a0a]" : "border-[#9F1239]/50 !text-[#a3a3a3]"
              }`}
            >
              <option value="" className="bg-white text-[#0a0a0a]">
                Select year
              </option>
              {years.map((y) => (
                <option key={y} value={y} className="bg-white text-[#0a0a0a]">
                  {y}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-[#737373]">
              18+ only. We use the year to verify eligibility and do not store your birthday.
            </p>

            <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm leading-snug text-[#0a0a0a]">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  setError(null);
                }}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#d4d4d4] accent-[#9F1239]"
              />
              <span>
                I am 18 or older, this is my own face, and I consent to the processing described in
                the full notice below.
              </span>
            </label>

            <button
              type="button"
              onClick={() => setNoticeOpen((v) => !v)}
              className="mt-3 flex w-full items-center justify-between rounded-xl border border-[#e5e5e5] bg-white px-3.5 py-3 text-left text-sm font-medium text-[#0a0a0a] hover:bg-[#fafafa]"
              aria-expanded={noticeOpen}
            >
              Read the full biometric and AI notice
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-[#737373] transition-transform ${
                  noticeOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {noticeOpen ? (
              <div className="mt-2 space-y-2 rounded-lg border border-[#e5e5e5] bg-white p-3 text-xs leading-relaxed text-[#525252]">
                <p>
                  <strong className="text-[#0a0a0a]">What we process.</strong> Facial geometry
                  derived from a photo you provide (landmarks, proportions, and related scores). We
                  do not use this to uniquely identify you beyond delivering your report.
                </p>
                <p>
                  <strong className="text-[#0a0a0a]">Where it runs.</strong> Free scoring runs in
                  your browser when possible. Paid report features may use cloud AI providers to
                  generate styling concepts, write-ups, and previews. Provider names and purposes
                  are listed in our Privacy Policy.
                </p>
                <p>
                  <strong className="text-[#0a0a0a]">Retention.</strong> Free-scan photos are
                  auto-deleted within 2 hours. Purchased reports keep a private copy until you
                  delete them from your account or request deletion.
                </p>
                <p>
                  <strong className="text-[#0a0a0a]">Your rights.</strong> You can request access or
                  deletion anytime. We do not sell photos or use them to train public models. See{" "}
                  <a href="/privacy-policy" className="underline underline-offset-2">
                    Privacy Policy
                  </a>{" "}
                  and{" "}
                  <a href="/terms-of-service" className="underline underline-offset-2">
                    Terms
                  </a>
                  .
                </p>
              </div>
            ) : null}
          </div>

          {/* Optional email */}
          <div>
            <label className="text-sm font-semibold text-[#0a0a0a]" htmlFor="report-email">
              Email for receipt &amp; report{" "}
              {!skipPayment ? (
                <span className="font-normal text-[#9F1239]">(required)</span>
              ) : (
                <span className="font-normal text-[#737373]">(optional)</span>
              )}
            </label>
            <input
              id="report-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                colorScheme: "light",
                backgroundColor: "#ffffff",
                color: "#0a0a0a",
              }}
              className="mt-1.5 h-11 w-full rounded-xl border border-[#e5e5e5] !bg-white !text-[#0a0a0a] px-3.5 text-sm outline-none placeholder:text-[#a3a3a3] focus:ring-2 focus:ring-[#9F1239]/40"
            />
            <p className="mt-1.5 text-xs leading-relaxed text-[#737373]">
              We&apos;ll email a link back to your results and your report — no marketing emails.
              18+ only. You can delete your data at any time.
            </p>
          </div>

          {error ? (
            <p className="text-sm font-medium text-red-600" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-[#e5e5e5] bg-white px-6 py-4">
          <button
            type="button"
            disabled={!canSubmit || submitting}
            onClick={() => void onAgree()}
            className="flex h-12 w-full items-center justify-center rounded-full bg-[#9F1239] text-[15px] font-bold text-white transition-colors hover:bg-[#881337] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {submitting
              ? skipPayment
                ? "Opening report…"
                : "Redirecting to Stripe…"
              : skipPayment
                ? "Agree & open full report"
                : `Agree & pay ${PRICE}`}
          </button>
          <p className="mt-2.5 text-center text-xs text-[#737373]">
            {skipPayment
              ? "Dev mode — payment skipped"
              : "Secure checkout with Stripe · One-time · no subscription"}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useCheckoutConsent() {
  const [open, setOpen] = useState(false);
  return {
    open,
    setOpen,
    openCheckout: () => setOpen(true),
  };
}
