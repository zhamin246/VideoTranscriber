import FacebookTranscriptGeneratorPage from "@/components/face-rating/facebook-transcript-generator-page";
import {
  FACEBOOK_TRANSCRIPT_GENERATOR_HREF,
  facebookTranscriptGeneratorSeo,
} from "@/lib/convert/facebook-transcript-generator-content";
import { defaultLocale } from "@/i18n/locale";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const base = process.env.NEXT_PUBLIC_WEB_URL || "";
  let canonicalUrl = `${base}${FACEBOOK_TRANSCRIPT_GENERATOR_HREF}`;
  if (locale !== defaultLocale) {
    canonicalUrl = `${base}/${locale}${FACEBOOK_TRANSCRIPT_GENERATOR_HREF}`;
  }

  const { title, description } = facebookTranscriptGeneratorSeo.meta;

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
    name: "Facebook Transcript Generator",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    description: facebookTranscriptGeneratorSeo.meta.description,
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
    mainEntity: facebookTranscriptGeneratorSeo.faq.items.map((item) => ({
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
      <FacebookTranscriptGeneratorPage />
    </>
  );
}
