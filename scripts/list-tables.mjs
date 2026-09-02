import dotenv from "dotenv";
import postgres from "postgres";

dotenv.config({ path: ".env.development" });
dotenv.config({ path: ".env.local" });

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
const sql = postgres(url, { prepare: false, max: 1 });
const rows = await sql`
  select table_name
  from information_schema.tables
  where table_schema = 'public'
  order by table_name
`;
console.log(rows.map((r) => r.table_name).join("\n"));
await sql.end();
