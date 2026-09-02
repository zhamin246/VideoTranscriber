import { and, desc, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { faceReports } from "@/db/schema";

export type FaceReportRow = typeof faceReports.$inferSelect;
export type FaceReportInsert = typeof faceReports.$inferInsert;

export async function upsertFaceReport(data: FaceReportInsert) {
  const existing = await findFaceReportByReportId(data.report_id);
  const now = new Date();
  if (existing) {
    const [row] = await db()
      .update(faceReports)
      .set({
        user_uuid: data.user_uuid || existing.user_uuid || "",
        user_email: (data.user_email || existing.user_email || "").toLowerCase(),
        score: data.score ?? existing.score,
        out_of_ten: data.out_of_ten || existing.out_of_ten,
        tier_name: data.tier_name || existing.tier_name,
        face_shape: data.face_shape || existing.face_shape,
        src: data.src || existing.src,
        preview_url:
          data.preview_url && data.preview_url.length > 0
            ? data.preview_url
            : existing.preview_url,
        scan_json:
          data.scan_json && data.scan_json.length > 2
            ? data.scan_json
            : existing.scan_json,
        unlocked_at: data.unlocked_at || existing.unlocked_at || now,
        status: data.status || existing.status || "active",
        updated_at: now,
      })
      .where(eq(faceReports.report_id, data.report_id))
      .returning();
    return row;
  }
  const [row] = await db()
    .insert(faceReports)
    .values({
      ...data,
      user_email: (data.user_email || "").toLowerCase(),
      created_at: data.created_at || now,
      updated_at: now,
      unlocked_at: data.unlocked_at || now,
    })
    .returning();
  return row;
}

/** Activate all pending reports tied to a paid order email / scan. */
export async function activateFaceReport(report_id: string, email?: string) {
  const existing = await findFaceReportByReportId(report_id);
  if (!existing) return null;
  let scanJson = existing.scan_json;
  try {
    const parsed = JSON.parse(existing.scan_json);
    parsed.unlocked = true;
    parsed.unlockedAt = Date.now();
    if (email) parsed.unlockEmail = email;
    scanJson = JSON.stringify(parsed);
  } catch {
    /* keep */
  }
  return upsertFaceReport({
    report_id,
    user_uuid: existing.user_uuid,
    user_email: (email || existing.user_email || "").toLowerCase(),
    score: existing.score,
    out_of_ten: existing.out_of_ten,
    tier_name: existing.tier_name,
    face_shape: existing.face_shape,
    src: existing.src,
    preview_url: existing.preview_url,
    scan_json: scanJson,
    unlocked_at: new Date(),
    status: "active",
  });
}

/** Find by report_id regardless of pending/active (needed for payment activate). */
export async function findFaceReportByReportId(
  report_id: string
): Promise<FaceReportRow | undefined> {
  const [row] = await db()
    .select()
    .from(faceReports)
    .where(eq(faceReports.report_id, report_id))
    .limit(1);
  return row;
}

export async function listFaceReportsForUser(opts: {
  user_uuid?: string;
  user_email?: string;
}): Promise<FaceReportRow[]> {
  const email = (opts.user_email || "").trim().toLowerCase();
  const uuid = (opts.user_uuid || "").trim();

  if (!email && !uuid) return [];

  if (email && uuid) {
    return db()
      .select()
      .from(faceReports)
      .where(
        and(
          eq(faceReports.status, "active"),
          or(eq(faceReports.user_email, email), eq(faceReports.user_uuid, uuid))
        )
      )
      .orderBy(desc(faceReports.unlocked_at), desc(faceReports.created_at));
  }

  if (email) {
    return db()
      .select()
      .from(faceReports)
      .where(
        and(eq(faceReports.status, "active"), eq(faceReports.user_email, email))
      )
      .orderBy(desc(faceReports.unlocked_at), desc(faceReports.created_at));
  }

  return db()
    .select()
    .from(faceReports)
    .where(
      and(eq(faceReports.status, "active"), eq(faceReports.user_uuid, uuid))
    )
    .orderBy(desc(faceReports.unlocked_at), desc(faceReports.created_at));
}
