import VideoToTextConverterPage from "@/components/face-rating/video-to-text-converter-page";
import {
  VIDEO_TO_TEXT_CONVERTER_HREF,
  videoToTextConverterSeo,
} from "@/lib/convert/video-to-text-converter-content";
import { Metadata } from "next";
import { buildToolPageMetadata } from "@/lib/seo/build-tool-page-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { title, description } = videoToTextConverterSeo.meta;
  return buildToolPageMetadata({
    path: VIDEO_TO_TEXT_CONVERTER_HREF,
    locale,
    title,
    description,
  });
}

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: videoToTextConverterSeo.meta.title,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    description: videoToTextConverterSeo.meta.description,
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
    mainEntity: videoToTextConverterSeo.faq.items.map((item) => ({
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
      <VideoToTextConverterPage />
    </>
  );
}
