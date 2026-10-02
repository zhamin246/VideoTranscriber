import BlogListPage from "@/components/face-rating/blog-list-page";
import { getPostsByLocale, PostStatus } from "@/models/post";
import { getTranslations } from "next-intl/server";
import type { Post } from "@/types/post";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/posts`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/posts`;
  }

  return {
    title: t("meta_title"),
    description: t("description"),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function PostsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });

  const rows = (await getPostsByLocale(locale)) || [];
  const posts = rows.filter((p) => p.status === PostStatus.Online) as Post[];

  return (
    <BlogListPage
      posts={posts}
      labels={{
        label: t("label"),
        title: t("title"),
        description: t("description"),
        minRead: t("min_read"),
        authorRole: t("author_role"),
        empty: t("empty"),
      }}
    />
  );
}
