import dotenv from "dotenv";
import postgres from "postgres";

dotenv.config({ path: ".env.development" });
dotenv.config({ path: ".env.local" });

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
const sql = postgres(url, { prepare: false, max: 1 });

const n = await sql`select count(*)::int as c from face_reports`;
const o = await sql`select count(*)::int as c from orders`;
const u = await sql`select email, uuid, signin_provider from users order by created_at desc nulls last limit 10`;

console.log("face_reports count:", n[0].c);
console.log("orders count:", o[0].c);
console.log("users:", u);

const reports = await sql`
  select report_id, user_email, user_uuid, score, status, unlocked_at, created_at
  from face_reports
  order by created_at desc nulls last
  limit 20
`;
console.log("reports:", reports);

const orders = await sql`
  select order_no, user_email, paid_email, product_id, status, amount, created_at, paid_at
  from orders
  order by created_at desc nulls last
  limit 20
`;
console.log("orders:", orders);

await sql.end();
