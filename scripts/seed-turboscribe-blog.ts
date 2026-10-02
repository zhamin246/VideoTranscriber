import { resolve } from "node:path";
import { readFileSync } from "node:fs";

import { findPostBySlug, insertPost, PostStatus, updatePost } from "@/models/post";
import { getUuid } from "@/lib/hash";
import { turboscribeReviewPost } from "@/lib/blog/posts/turboscribe-review-ai-transcription-tool";

function loadEnv(path: string) {
  try {
    const text = readFileSync(path, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    /* missing env file */
  }
}

loadEnv(resolve(process.cwd(), ".env.development"));
loadEnv(resolve(process.cwd(), ".env.local"));
loadEnv(resolve(process.cwd(), ".env"));

async function main() {
  const { slug, locale, title, description, cover_url, author_name, author_avatar_url, content } =
    turboscribeReviewPost;

  const existing = await findPostBySlug(slug, locale);
  if (existing) {
    const updated = await updatePost(existing.uuid, {
      title,
      description,
      cover_url,
      author_name,
      author_avatar_url: author_avatar_url || null,
      content,
      status: PostStatus.Online,
      updated_at: new Date(),
    });
    console.log(updated ? `Updated post: /posts/${slug}` : "Update failed");
    return;
  }

  const now = new Date();
  const post = await insertPost({
    uuid: getUuid(),
    slug,
    locale,
    title,
    description,
    cover_url,
    author_name,
    author_avatar_url: author_avatar_url || null,
    content,
    status: PostStatus.Online,
    created_at: now,
    updated_at: now,
  });

  console.log(post ? `Created post: /posts/${slug}` : "Insert returned no row");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
