import type { Metadata } from "next";
import { Suspense } from "react";
import FullReportPage from "@/components/face-rating/full-report-page";

export const metadata: Metadata = {
  title: "Your Full Face Report | Face Rating",
  description:
    "Detailed Face Rating report — measurements, styling direction, and ranked action plan from your scan.",
  robots: { index: false, follow: false },
};

export default function FullReportRoutePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-[#737373]">
          Building your full report…
        </div>
      }
    >
      <FullReportPage />
    </Suspense>
  );
}
