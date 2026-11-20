import AiToolsPage from "@/components/face-rating/ai-tools-page";
import type { Metadata } from "next";
import { buildToolPageMetadata } from "@/lib/seo/build-tool-page-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = "AI Transcript Tools — Video Transcriber";
  const description =
    "Video to text, audio transcription, YouTube and TikTok transcript generators, AI summarizer, and subtitle tools in one directory.";

  const meta = buildToolPageMetadata({
    path: "/ai-tools",
    locale,
    title,
    description,
  });

  return {
    ...meta,
    robots: {
      index: false,
      follow: true,
      googleBot: { index: false, follow: true },
    },
  };
}

export default function Page() {
  return <AiToolsPage />;
}
