import AiToolsPage from "@/components/face-rating/ai-tools-page";
import { defaultLocale } from "@/i18n/locale";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/ai-tools`;
  if (locale !== defaultLocale) {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/ai-tools`;
  }

  const title = "AI Transcript Tools — Video Transcriber";
  const description =
    "Video to text, audio transcription, YouTube and TikTok transcript generators, AI summarizer, and subtitle tools in one directory.";

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Video Transcriber",
      type: "website",
    },
  };
}

export default function Page() {
  return <AiToolsPage />;
}
