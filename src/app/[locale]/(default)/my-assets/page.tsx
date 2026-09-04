import MyAssetsPage from "@/components/face-rating/my-assets-page";
import { defaultLocale } from "@/i18n/locale";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/my-assets`;
  if (locale !== defaultLocale) {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/my-assets`;
  }
  return {
    title: "My Assets | Video Transcriber",
    description: "Your transcriptions, translations, and recordings.",
    alternates: { canonical: canonicalUrl },
    robots: { index: false, follow: false },
  };
}

export default function MyAssetsRoute() {
  return <MyAssetsPage />;
}
