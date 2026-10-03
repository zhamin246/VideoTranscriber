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
      ) {
        value = value.slice(1, -1);
      }
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
if (!url) {
  console.log("NO_DATABASE_URL");
  process.exit(1);
}

const sql = postgres(url, {
  prepare: false,
  max: 1,
  connection: { search_path: "videotranscriber,public" },
});

const ws = await sql`
  select workspace_id, user_uuid, title, platform, status, created_at
  from workspaces
  order by created_at desc
  limit 15
`;
console.log("recent_workspaces", ws.length);
for (const r of ws) {
  console.log(
    JSON.stringify({
      id: r.workspace_id,
      user: String(r.user_uuid || "").slice(0, 12),
      title: String(r.title || "").slice(0, 50),
      platform: r.platform,
      status: r.status,
      at: r.created_at,
    }),
  );
}
const [{ n }] = await sql`select count(*)::int as n from transcripts`;
console.log("transcripts_total", n);
await sql.end();
