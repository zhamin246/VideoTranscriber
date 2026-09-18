import { FaceRatingLandingPage } from "@/components/face-rating";
import { defaultLocale } from "@/i18n/locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}`;

  if (locale !== defaultLocale) {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}`;
  }

  const title = "Video to Text for MP4 Files and Links | Video Transcriber";
  const description =
    "Use video to text on an MP4, MOV, WebM, or a public link. Copy or export TXT, DOCX, SRT, or VTT in the workspace. Private videos may fail.";

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

export default async function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Video Transcriber",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    description:
      "Use video to text on an MP4, MOV, WebM, or a public link. Copy or export TXT, DOCX, SRT, or VTT in the workspace.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Start transcribing in the browser",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FaceRatingLandingPage />
    </>
  );
}
