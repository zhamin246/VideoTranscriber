import TiktokTranscriptGeneratorPage from "@/components/face-rating/tiktok-transcript-generator-page";
import {
  TIKTOK_TRANSCRIPT_GENERATOR_HREF,
  tiktokTranscriptGeneratorSeo,
} from "@/lib/convert/tiktok-transcript-generator-content";
import { Metadata } from "next";
import { buildToolPageMetadata } from "@/lib/seo/build-tool-page-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { title, description } = tiktokTranscriptGeneratorSeo.meta;
  return buildToolPageMetadata({
    path: TIKTOK_TRANSCRIPT_GENERATOR_HREF,
    locale,
    title,
    description,
  });
}

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "TikTok Transcript Generator",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    description: tiktokTranscriptGeneratorSeo.meta.description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free plan with monthly transcription minutes",
    },
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: tiktokTranscriptGeneratorSeo.faq.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <TiktokTranscriptGeneratorPage />
    </>
  );
}
