import AttractivenessToolPage from "@/components/face-rating/attractiveness-page";
import { defaultLocale } from "@/i18n/locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const base = process.env.NEXT_PUBLIC_WEB_URL || "";
  const path = "/tools/ai-attractiveness-test";
  const canonicalUrl =
    locale !== defaultLocale ? `${base}/${locale}${path}` : `${base}${path}`;

  const title = "AI Attractiveness Test — Free Face Score | Face Rating";
  const description =
    "Try Face Rating’s AI Attractiveness Test: free 0–100 face balance from one selfie, with published weights, private browser-first scanning, and clear limits.";

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Face Rating",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function AiAttractivenessTestPage() {
  return <AttractivenessToolPage />;
}
