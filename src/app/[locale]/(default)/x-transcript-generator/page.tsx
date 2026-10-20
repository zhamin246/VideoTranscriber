import XTranscriptGeneratorPage from "@/components/face-rating/x-transcript-generator-page";
import {
  X_TRANSCRIPT_GENERATOR_HREF,
  xTranscriptGeneratorSeo,
} from "@/lib/convert/x-transcript-generator-content";
import { defaultLocale } from "@/i18n/locale";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const base = process.env.NEXT_PUBLIC_WEB_URL || "";
  let canonicalUrl = `${base}${X_TRANSCRIPT_GENERATOR_HREF}`;
  if (locale !== defaultLocale) {
    canonicalUrl = `${base}/${locale}${X_TRANSCRIPT_GENERATOR_HREF}`;
  }

  const { title, description } = xTranscriptGeneratorSeo.meta;

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
    name: xTranscriptGeneratorSeo.meta.title,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    description: xTranscriptGeneratorSeo.meta.description,
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
    mainEntity: xTranscriptGeneratorSeo.faq.items.map((item) => ({
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
      <XTranscriptGeneratorPage />
    </>
  );
}
