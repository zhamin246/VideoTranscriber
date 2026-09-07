import FaceRatingPricingPage from "@/components/face-rating/pricing-page";
import { defaultLocale } from "@/i18n/locale";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/pricing`;
  if (locale !== defaultLocale) {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/pricing`;
  }

  const title = "Pricing — Video Transcriber";
  const description =
    "Free 90 minutes/month. Basic from $6/mo (yearly) for 1,200 minutes. Standard 3,000 and Pro 6,000. One-time packs from $12.90.";

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Video Transcriber",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}

export default function PricingPage() {
  return <FaceRatingPricingPage />;
}
