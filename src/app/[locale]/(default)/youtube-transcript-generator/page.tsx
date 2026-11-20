import YoutubeTranscriptGeneratorPage from "@/components/face-rating/youtube-transcript-generator-page";
import {
  YOUTUBE_TRANSCRIPT_GENERATOR_HREF,
  youtubeTranscriptGeneratorSeo,
} from "@/lib/convert/youtube-transcript-generator-content";
import { Metadata } from "next";
import { buildToolPageMetadata } from "@/lib/seo/build-tool-page-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { title, description } = youtubeTranscriptGeneratorSeo.meta;
  return buildToolPageMetadata({
    path: YOUTUBE_TRANSCRIPT_GENERATOR_HREF,
    locale,
    title,
    description,
  });
}

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "YouTube Transcript Generator",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    description: youtubeTranscriptGeneratorSeo.meta.description,
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
    mainEntity: youtubeTranscriptGeneratorSeo.faq.items.map((item) => ({
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
      <YoutubeTranscriptGeneratorPage />
    </>
  );
}
