import "dotenv/config";
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env" });
config({ path: ".env.development" });
config({ path: ".env.local" });
config({ path: ".env.production" });

export default defineConfig({
  out: "./src/db/migrations",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  schemaFilter: ["imagetocad"],
  migrations: {
    schema: "imagetocad",
    table: "__drizzle_migrations",
  },
  dbCredentials: {
    // Use DIRECT_URL for migrations (direct connection, port 5432)
    // Fallback to DATABASE_URL if DIRECT_URL is not set
    url: process.env.DIRECT_URL || process.env.DATABASE_URL!,
  },
});
