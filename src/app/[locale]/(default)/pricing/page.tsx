import FaceRatingPricingPage from "@/components/face-rating/pricing-page";
import { Metadata } from "next";
import {
  buildToolPageMetadata,
  siteOrigin,
  SOCIAL_OG_IMAGE_PATH,
  SOCIAL_OG_IMAGE_SIZE,
} from "@/lib/seo/build-tool-page-metadata";
import { SEO_SITE_NAME } from "@/lib/seo/page-title";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const title = "Pricing — Video Transcriber";
  const description =
    "Free 90 minutes/month. Basic from $6/mo (yearly) for 1,200 minutes. Standard 3,000 and Pro 6,000. One-time packs from $12.90.";

  const meta = buildToolPageMetadata({
    path: "/pricing",
    locale,
    title,
    description,
  });

  const imageUrl = `${siteOrigin()}${SOCIAL_OG_IMAGE_PATH}`;

  return {
    ...meta,
    openGraph: {
      ...meta.openGraph,
      images: [
        {
          url: imageUrl,
          width: SOCIAL_OG_IMAGE_SIZE.width,
          height: SOCIAL_OG_IMAGE_SIZE.height,
          alt: SEO_SITE_NAME,
        },
      ],
    },
    twitter: {
      ...meta.twitter,
      card: "summary_large_image",
      images: [imageUrl],
    },
  };
}

export default function PricingPage() {
  return <FaceRatingPricingPage />;
}
