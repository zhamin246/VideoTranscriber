import type { Metadata } from "next";
import { Suspense } from "react";
import ReportPreviewPage from "@/components/face-rating/report-preview-page";

export const metadata: Metadata = {
  title: "Your Face Report Preview | Face Rating",
  description:
    "Free Face Report preview from your AI Attractiveness Test scan — metrics, harmony radar, and upgrade path.",
  robots: { index: false, follow: false },
};

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-[#737373]">
          Loading your report…
        </div>
      }
    >
      <ReportPreviewPage />
    </Suspense>
  );
}
