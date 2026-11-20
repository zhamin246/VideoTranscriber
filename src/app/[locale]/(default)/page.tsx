import { FaceRatingLandingPage } from "@/components/face-rating";
import { buildToolPageMetadata } from "@/lib/seo/build-tool-page-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const title = "Video Transcriber — Transcribe Videos to Text Free";
  const description =
    "Use this free video transcriber to turn video files and public links into searchable text. Generate transcripts, add speaker labels, and export TXT, DOCX, SRT, VTT, or CSV.";

  return buildToolPageMetadata({
    path: "/",
    locale,
    title,
    description,
  });
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
