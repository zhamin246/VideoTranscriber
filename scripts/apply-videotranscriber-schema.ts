import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";

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
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DIRECT_URL or DATABASE_URL is required");
  }
  const sql = postgres(url, { prepare: false, max: 1 });
  const file = resolve(process.cwd(), "scripts/init-videotranscriber-schema.sql");
  await sql.unsafe(readFileSync(file, "utf8"));
  const tables = await sql`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'videotranscriber'
    ORDER BY tablename
  `;
  console.log(
    "videotranscriber tables:",
    tables.map((row) => row.tablename).join(", ") || "(none)",
  );
  await sql.end();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
