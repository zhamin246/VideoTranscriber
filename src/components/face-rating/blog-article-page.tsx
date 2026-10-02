"use client";



import Image from "next/image";

import BlogShell from "./blog-shell";

import BlogMarkdown from "./blog-markdown";

import BlogToc from "./blog-toc";

import { estimateReadingMinutes } from "@/lib/blog/read-time";

import { extractHeadingsFromMarkdown } from "@/lib/blog/toc";

import type { Post } from "@/types/post";

import "./blog-article.css";



export type BlogArticleLabels = {

  backToBlog: string;

  onThisPage: string;

  minRead: string;

  authorRole: string;

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



export default function BlogArticlePage({

  post,

  labels,

}: {

  post: Post;

  labels: BlogArticleLabels;

}) {

  const toc = extractHeadingsFromMarkdown(post.content);

  const minutes = estimateReadingMinutes(post.content, post.description);

  const date = formatPostDate(post.created_at);

  const author = post.author_name?.trim() || "Video Transcriber";

  const minRead =

    minutes > 0

      ? labels.minRead.replace("{minutes}", String(minutes))

      : "";



  return (

    <BlogShell>

      <main className="blog-article-page ac-section-wash min-h-[60vh] pb-16 pt-6 sm:pb-24 sm:pt-10">

        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">

          <BlogToc

            items={toc}

            backToBlog={labels.backToBlog}

            onThisPage={labels.onThisPage}

          >

            <article className="blog-article-body">

              <header className="mb-8">

                <h1 className="text-balance text-[28px] font-semibold leading-tight tracking-tight text-[#111827] sm:text-[36px] sm:leading-[1.2]">

                  {post.title}

                </h1>

                {(date || minRead) && (

                  <p className="mt-4 text-sm text-[#6b7280]">

                    {date}

                    {date && minRead ? (

                      <span className="mx-2 text-[#d1d5db]">•</span>

                    ) : null}

                    {minRead}

                  </p>

                )}

                <div className="mt-5 flex items-center gap-3">

                  {post.author_avatar_url ? (

                    <Image

                      src={post.author_avatar_url}

                      alt=""

                      width={44}

                      height={44}

                      unoptimized

                      className="h-11 w-11 rounded-full object-cover"

                    />

                  ) : (

                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EEEDFE] text-sm font-semibold text-[#635BFF]">

                      {author.charAt(0).toUpperCase()}

                    </span>

                  )}

                  <div>

                    <p className="text-sm font-semibold text-[#111827]">

                      {author}

                    </p>

                    <p className="text-xs text-[#6b7280]">{labels.authorRole}</p>

                  </div>

                </div>

              </header>



              {post.cover_url ? (

                <div className="relative mb-8 aspect-[16/10] w-full overflow-hidden rounded-xl border border-[#e5e7eb] bg-[#f9fafb]">

                  <Image

                    src={post.cover_url}

                    alt={post.title || ""}

                    fill

                    unoptimized

                    className="object-cover"

                    sizes="(max-width: 1024px) 100vw, 840px"

                    priority

                  />

                </div>

              ) : null}



              {post.content ? <BlogMarkdown content={post.content} /> : null}

            </article>

          </BlogToc>

        </div>

      </main>

    </BlogShell>

  );

}

