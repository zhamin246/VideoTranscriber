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

  const title = "Pricing — Credits & plans | image to cad";
  const description =
    "One credit, one conversion. 3 free credits to start. Subscribe from $12.50/month, or buy a pack from $9.99. DXF, SVG and PDF.";

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
      siteName: "image to cad",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default function PricingPage() {
  return <FaceRatingPricingPage />;
}
