import type { Metadata } from "next";
import { Suspense } from "react";
import TranscriptWorkspace from "@/components/workspace/transcript-workspace";

export const metadata: Metadata = {
  title: "Workspace | Video Transcriber",
  description: "Transcript workspace for your media link.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-[#F7F8FA] text-sm text-slate-500">
          Loading workspace…
        </div>
      }
    >
      <TranscriptWorkspace id={id} />
    </Suspense>
  );
}
