import { and, desc, eq, gte, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { mediaAssets, transcripts, workspaces } from "@/db/schema";

export type WorkspaceRow = typeof workspaces.$inferSelect;
export type WorkspaceInsert = typeof workspaces.$inferInsert;
export type MediaAssetInsert = typeof mediaAssets.$inferInsert;
export type TranscriptInsert = typeof transcripts.$inferInsert;

export async function upsertWorkspace(data: WorkspaceInsert) {
  const existing = await getWorkspaceByPublicId(data.workspace_id);
  if (existing) {
    const [row] = await db()
      .update(workspaces)
      .set({ ...data, updated_at: new Date() })
      .where(eq(workspaces.workspace_id, data.workspace_id))
      .returning();
    return row;
  }
  const [row] = await db().insert(workspaces).values(data).returning();
  return row;
}

export async function getWorkspaceByPublicId(workspaceId: string) {
  const [row] = await db()
    .select()
    .from(workspaces)
    .where(eq(workspaces.workspace_id, workspaceId))
    .limit(1);
  return row || null;
}

export async function listWorkspacesByUser(userUuid: string, limit = 24) {
  if (!userUuid) return [];
  return db()
    .select()
    .from(workspaces)
    .where(
      and(eq(workspaces.user_uuid, userUuid), eq(workspaces.status, "ready")),
    )
    .orderBy(desc(workspaces.updated_at), desc(workspaces.created_at))
    .limit(limit);
}

export async function countWorkspacesByUser(userUuid: string) {
  if (!userUuid) return 0;
  const [row] = await db()
    .select({ n: sql<number>`count(*)::int` })
    .from(workspaces)
    .where(
      and(eq(workspaces.user_uuid, userUuid), eq(workspaces.status, "ready")),
    );
  return Number(row?.n || 0);
}

/** Legacy saves with no user — attach to signed-in account when id is known. */
export async function claimOrphanWorkspaces(
  userUuid: string,
  workspaceIds: string[],
) {
  if (!userUuid || !workspaceIds.length) return 0;
  const ids = [
    ...new Set(
      workspaceIds
        .map((id) => id.trim())
        .filter((id) => /^[\w-]{8,64}$/.test(id)),
    ),
  ].slice(0, 32);
  if (!ids.length) return 0;

  const rows = await db()
    .update(workspaces)
    .set({ user_uuid: userUuid, updated_at: new Date() })
    .where(
      and(
        eq(workspaces.status, "ready"),
        eq(workspaces.user_uuid, ""),
        inArray(workspaces.workspace_id, ids),
      ),
    )
    .returning({ workspace_id: workspaces.workspace_id });

  return rows.length;
}

/** Files started today (UTC calendar day) — used for free daily limit UI/enforcement. */
export async function countWorkspacesCreatedToday(userUuid: string) {
  if (!userUuid) return 0;
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const [row] = await db()
    .select({ n: sql<number>`count(*)::int` })
    .from(workspaces)
    .where(
      and(
        eq(workspaces.user_uuid, userUuid),
        ne(workspaces.status, "deleted"),
        gte(workspaces.created_at, start),
      ),
    );
  return Number(row?.n || 0);
}

export async function softDeleteWorkspace(workspaceId: string) {
  const [row] = await db()
    .update(workspaces)
    .set({ status: "deleted", updated_at: new Date() })
    .where(eq(workspaces.workspace_id, workspaceId))
    .returning();
  return row || null;
}

export async function insertMediaAsset(data: MediaAssetInsert) {
  const [row] = await db().insert(mediaAssets).values(data).returning();
  return row;
}

export async function upsertTranscript(data: TranscriptInsert) {
  const existing = await db()
    .select()
    .from(transcripts)
    .where(eq(transcripts.workspace_id, data.workspace_id))
    .limit(1);
  if (existing[0]) {
    const [row] = await db()
      .update(transcripts)
      .set({ ...data, updated_at: new Date() })
      .where(eq(transcripts.workspace_id, data.workspace_id))
      .returning();
    return row;
  }
  const [row] = await db().insert(transcripts).values(data).returning();
  return row;
}

export async function getTranscriptByWorkspaceId(workspaceId: string) {
  const [row] = await db()
    .select()
    .from(transcripts)
    .where(eq(transcripts.workspace_id, workspaceId))
    .limit(1);
  return row || null;
}

export async function updateWorkspaceAskMessages(
  workspaceId: string,
  askMessagesJson: string,
) {
  const [row] = await db()
    .update(workspaces)
    .set({
      ask_messages_json: askMessagesJson,
      updated_at: new Date(),
    })
    .where(eq(workspaces.workspace_id, workspaceId))
    .returning();
  return row || null;
}
