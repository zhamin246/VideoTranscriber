"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import BlogShell from "./blog-shell";
import { estimateReadingMinutes } from "@/lib/blog/read-time";
import type { Post } from "@/types/post";

export type BlogListLabels = {
  label: string;
  title: string;
  description: string;
  minRead: string;
  authorRole: string;
  empty: string;
};

function formatPostDate(iso?: string | null) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function minReadLabel(template: string, minutes: number) {
  return template.replace("{minutes}", String(minutes));
}

function BlogCard({
  post,
  minReadTemplate,
  authorRole,
}: {
  post: Post;
  minReadTemplate: string;
  authorRole: string;
}) {
  const slug = post.slug || "";
  const href = slug ? `/posts/${slug}` : "/posts";
  const minutes = estimateReadingMinutes(post.content, post.description);
  const date = formatPostDate(post.created_at);
  const author = post.author_name?.trim() || "Video Transcriber";

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_4px_24px_rgba(15,23,42,0.04)] transition hover:border-[#C7D2FE] hover:shadow-[0_12px_40px_rgba(136,130,245,0.12)]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#F1F5F9]">
        {post.cover_url ? (
          <Image
            src={post.cover_url}
            alt={post.title || ""}
            fill
            unoptimized
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#EEEDFE] to-white">
            <img src="/favicon.svg" alt="" className="h-14 w-14 opacity-80" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {(date || minutes) && (
          <p className="mb-3 text-sm text-[#64748B]">
            {date}
            {date && minutes ? (
              <span className="mx-2 text-[#CBD5E1]">•</span>
            ) : null}
            {minutes ? minReadLabel(minReadTemplate, minutes) : null}
          </p>
        )}
        <h3 className="mb-3 line-clamp-2 text-lg font-semibold leading-snug text-[#0F172A] group-hover:text-[#635BFF] sm:text-xl">
          {post.title}
        </h3>
        {post.description ? (
          <p className="mb-5 line-clamp-3 flex-1 text-sm leading-6 text-[#64748B] sm:text-[15px]">
            {post.description}
          </p>
        ) : (
          <div className="flex-1" />
        )}
        <div className="mt-auto flex items-center gap-3 border-t border-[#F1F5F9] pt-4">
          {post.author_avatar_url ? (
            <Image
              src={post.author_avatar_url}
              alt=""
              width={40}
              height={40}
              unoptimized
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEEDFE] text-sm font-semibold text-[#635BFF]">
              {author.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#0F172A]">
              {author}
            </p>
            <p className="truncate text-xs text-[#64748B]">{authorRole}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function BlogListPage({
  posts,
  labels,
}: {
  posts: Post[];
  labels: BlogListLabels;
}) {
  return (
    <BlogShell>
      <main className="ac-section-wash min-h-[60vh] pb-16 pt-8 sm:pb-24 sm:pt-12">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-14">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#635BFF]">
              {labels.label}
            </p>
            <h1 className="text-[28px] font-bold leading-tight tracking-tight text-[#0F172A] sm:text-[40px] sm:leading-[1.15]">
              {labels.title}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#64748B] sm:text-lg">
              {labels.description}
            </p>
          </div>

          {posts.length === 0 ? (
            <p className="text-center text-[#64748B]">{labels.empty}</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
              {posts.map((post) => (
                <BlogCard
                  key={post.uuid || post.slug}
                  post={post}
                  minReadTemplate={labels.minRead}
                  authorRole={labels.authorRole}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </BlogShell>
  );
}
