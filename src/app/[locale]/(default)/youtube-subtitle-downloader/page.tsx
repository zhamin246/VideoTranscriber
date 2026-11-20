import YoutubeSubtitleDownloaderPage from "@/components/face-rating/youtube-subtitle-downloader-page";
import {
  YOUTUBE_SUBTITLE_DOWNLOADER_HREF,
  youtubeSubtitleDownloaderSeo,
} from "@/lib/convert/youtube-subtitle-downloader-content";
import { Metadata } from "next";
import { buildToolPageMetadata } from "@/lib/seo/build-tool-page-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { title, description } = youtubeSubtitleDownloaderSeo.meta;
  return buildToolPageMetadata({
    path: YOUTUBE_SUBTITLE_DOWNLOADER_HREF,
    locale,
    title,
    description,
  });
}

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: youtubeSubtitleDownloaderSeo.meta.title,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    description: youtubeSubtitleDownloaderSeo.meta.description,
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
    mainEntity: youtubeSubtitleDownloaderSeo.faq.items.map((item) => ({
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
      <YoutubeSubtitleDownloaderPage />
    </>
  );
}
