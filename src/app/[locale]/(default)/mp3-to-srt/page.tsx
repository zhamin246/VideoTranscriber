import Mp3ToSrtPage from "@/components/face-rating/mp3-to-srt-page";
import {
  MP3_TO_SRT_HREF,
  mp3ToSrtSeo,
} from "@/lib/convert/mp3-to-srt-content";
import { Metadata } from "next";
import { buildToolPageMetadata } from "@/lib/seo/build-tool-page-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { title, description } = mp3ToSrtSeo.meta;
  return buildToolPageMetadata({
    path: MP3_TO_SRT_HREF,
    locale,
    title,
    description,
  });
}

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "MP3 to SRT",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    description: mp3ToSrtSeo.meta.description,
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
    mainEntity: mp3ToSrtSeo.faq.items.map((item) => ({
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
      <Mp3ToSrtPage />
    </>
  );
}
