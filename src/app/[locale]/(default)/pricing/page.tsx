import FaceRatingPricingPage from "@/components/face-rating/pricing-page";
import { Metadata } from "next";
import { buildToolPageMetadata } from "@/lib/seo/build-tool-page-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const title = "Pricing — Video Transcriber";
  const description =
    "Free 90 minutes/month. Basic from $6/mo (yearly) for 1,200 minutes. Standard 3,000 and Pro 6,000. One-time packs from $12.90.";

  return buildToolPageMetadata({
    path: "/pricing",
    locale,
    title,
    description,
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  });
}

export default function PricingPage() {
  return <FaceRatingPricingPage />;
}
