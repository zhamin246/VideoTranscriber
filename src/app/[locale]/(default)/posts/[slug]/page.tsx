import BlogArticlePage from "@/components/face-rating/blog-article-page";
import Empty from "@/components/blocks/empty";
import { PostStatus, findPostBySlug, postRowToPost } from "@/models/post";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  const post = await findPostBySlug(slug, locale);

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/posts/${slug}`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/posts/${slug}`;
  }

  return {
    title: post?.title,
    description: post?.description,
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  const post = await findPostBySlug(slug, locale);

  if (!post || post.status !== PostStatus.Online) {
    return <Empty message="Post not found" />;
  }

  return (
    <BlogArticlePage
      post={postRowToPost(post)}
      labels={{
        backToBlog: t("back_to_blog"),
        onThisPage: t("on_this_page"),
        minRead: t("min_read"),
        authorRole: t("author_role"),
      }}
    />
  );
}
