import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";

function loadEnv(path) {
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
      )
        value = value.slice(1, -1);
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    /* missing */
  }
}

for (const f of [".env.development", ".env.local", ".env"]) {
  loadEnv(resolve(process.cwd(), f));
}

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) process.exit(1);

const sql = postgres(url, {
  prepare: false,
  max: 1,
  connection: { search_path: "videotranscriber,public" },
});

const byStatus = await sql`
  select status, count(*)::int as n from workspaces group by status order by n desc
`;
console.log("by_status", byStatus);

const byUser = await sql`
  select coalesce(nullif(user_uuid,''),'(empty)') as u, count(*)::int as n
  from workspaces group by 1 order by n desc
`;
console.log("by_user", byUser);

const all = await sql`
  select workspace_id, user_uuid, title, platform, status, created_at
  from workspaces order by created_at desc
`;
console.log("total", all.length);

await sql.end();
