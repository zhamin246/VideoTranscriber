import YoutubeSubtitleDownloaderPage from "@/components/face-rating/youtube-subtitle-downloader-page";
import {
  YOUTUBE_SUBTITLE_DOWNLOADER_HREF,
  youtubeSubtitleDownloaderSeo,
} from "@/lib/convert/youtube-subtitle-downloader-content";
import { defaultLocale } from "@/i18n/locale";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const base = process.env.NEXT_PUBLIC_WEB_URL || "";
  let canonicalUrl = `${base}${YOUTUBE_SUBTITLE_DOWNLOADER_HREF}`;
  if (locale !== defaultLocale) {
    canonicalUrl = `${base}/${locale}${YOUTUBE_SUBTITLE_DOWNLOADER_HREF}`;
  }

  const { title, description } = youtubeSubtitleDownloaderSeo.meta;

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

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "YouTube Subtitle Downloader",
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
