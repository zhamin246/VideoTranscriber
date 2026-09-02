/**
 * One-shot: mark all face_reports with status=pending as active
 * when a matching paid face_report order exists for the same email.
 */
import dotenv from "dotenv";
import postgres from "postgres";

dotenv.config({ path: ".env.development" });
dotenv.config({ path: ".env.local" });

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
const sql = postgres(url, { prepare: false, max: 1 });

const pending = await sql`
  select report_id, user_email, status from face_reports where status = 'pending'
`;
console.log("pending before:", pending.length, pending);

const updated = await sql`
  update face_reports fr
  set
    status = 'active',
    unlocked_at = coalesce(fr.unlocked_at, now()),
    updated_at = now(),
    user_email = lower(fr.user_email)
  where fr.status = 'pending'
    and exists (
      select 1 from orders o
      where o.status = 'paid'
        and o.product_id = 'face_report'
        and (
          lower(o.user_email) = lower(fr.user_email)
          or lower(coalesce(o.paid_email, '')) = lower(fr.user_email)
        )
    )
  returning report_id, user_email, status
`;
console.log("activated:", updated);

// Also force-activate any remaining pending (paid flow always intends unlock)
const forced = await sql`
  update face_reports
  set status = 'active', unlocked_at = coalesce(unlocked_at, now()), updated_at = now()
  where status = 'pending'
  returning report_id, user_email, status
`;
console.log("force-activated remaining pending:", forced);

const all = await sql`
  select report_id, user_email, status, score from face_reports
`;
console.log("all reports:", all);

await sql.end();
