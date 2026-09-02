import FullAnalysisPage from "@/components/face-rating/full-analysis-page";
import { defaultLocale } from "@/i18n/locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const base = process.env.NEXT_PUBLIC_WEB_URL || "";
  const path = "/tools/full-analysis";
  const canonicalUrl =
    locale !== defaultLocale ? `${base}/${locale}${path}` : `${base}${path}`;

  const title = "AI Face Report — Measurements, Style Previews & Action Plan | Face Rating";
  const description =
    "Understand what suits your face with 40+ measurements, six hairstyle try-ons, a 12-season palette, an AI styling concept and a prioritized 4-week plan. $9.90 once.";

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: "Your Personal AI Face Report | Face Rating",
      description,
      url: canonicalUrl,
      siteName: "Face Rating",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Your Personal AI Face Report | Face Rating",
      description,
    },
  };
}

export default function FullAnalysisRoutePage() {
  return <FullAnalysisPage />;
}
