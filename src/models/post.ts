import { posts } from "@/db/schema";
import { db } from "@/db";
import { and, desc, eq } from "drizzle-orm";
import type { Post } from "@/types/post";

export function postRowToPost(row: typeof posts.$inferSelect): Post {
  return {
    uuid: row.uuid,
    slug: row.slug ?? undefined,
    title: row.title ?? undefined,
    description: row.description ?? undefined,
    content: row.content ?? undefined,
    created_at: row.created_at?.toISOString(),
    updated_at: row.updated_at?.toISOString(),
    status: row.status ?? undefined,
    cover_url: row.cover_url ?? undefined,
    author_name: row.author_name ?? undefined,
    author_avatar_url: row.author_avatar_url ?? undefined,
    locale: row.locale ?? undefined,
  };
}

export enum PostStatus {
  Created = "created",
  Deleted = "deleted",
  Online = "online",
  Offline = "offline",
}

export async function insertPost(
  data: typeof posts.$inferInsert
): Promise<typeof posts.$inferSelect | undefined> {
  const [post] = await db().insert(posts).values(data).returning();

  return post;
}

export async function updatePost(
  uuid: string,
  data: Partial<typeof posts.$inferInsert>
): Promise<typeof posts.$inferSelect | undefined> {
  const [post] = await db()
    .update(posts)
    .set(data)
    .where(eq(posts.uuid, uuid))
    .returning();

  return post;
}

export async function findPostByUuid(
  uuid: string
): Promise<typeof posts.$inferSelect | undefined> {
  const [post] = await db()
    .select()
    .from(posts)
    .where(eq(posts.uuid, uuid))
    .limit(1);

  return post;
}

export async function findPostBySlug(
  slug: string,
  locale: string
): Promise<typeof posts.$inferSelect | undefined> {
  const [post] = await db()
    .select()
    .from(posts)
    .where(and(eq(posts.slug, slug), eq(posts.locale, locale)))
    .limit(1);

  return post;
}

export async function getAllPosts(
  page: number = 1,
  limit: number = 50
): Promise<(typeof posts.$inferSelect)[] | undefined> {
  const offset = (page - 1) * limit;

  const data = await db()
    .select()
    .from(posts)
    .orderBy(desc(posts.created_at))
    .limit(limit)
    .offset(offset);

  return data;
}

export async function getPostsByLocale(
  locale: string,
  page: number = 1,
  limit: number = 50
): Promise<(typeof posts.$inferSelect)[] | undefined> {
  const offset = (page - 1) * limit;

  const data = await db()
    .select()
    .from(posts)
    .where(and(eq(posts.locale, locale), eq(posts.status, PostStatus.Online)))
    .orderBy(desc(posts.created_at))
    .limit(limit)
    .offset(offset);

  return data;
}

export async function getPostsTotal(): Promise<number> {
  const total = await db().$count(posts);

  return total;
}
