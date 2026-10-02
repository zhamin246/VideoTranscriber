import { config } from "dotenv";
import { readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { AwsClient } from "aws4fetch";

config({ path: ".env.development" });

function lastEnv(name) {
  const text = readFileSync(".env.development", "utf8");
  const matches = [...text.matchAll(new RegExp(`^${name}\\s*=\\s*(.*)$`, "gm"))].map((m) =>
    m[1].trim().replace(/^["']|["']$/g, "").trim()
  );
  return matches.filter(Boolean).at(-1) || process.env[name] || "";
}

const endpoint = lastEnv("STORAGE_ENDPOINT");
const accessKeyId = lastEnv("STORAGE_ACCESS_KEY_ID");
const secretAccessKey = lastEnv("STORAGE_SECRET_ACCESS_KEY");
const bucket = lastEnv("STORAGE_BUCKET");
const domain = (lastEnv("STORAGE_DOMAIN") || "").replace(/\/$/, "");

if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
  throw new Error("Missing STORAGE_* env");
}

const src =
  "C:/Users/Administrator/.cursor/projects/d-github-VideoTranscriber/assets/c__Users_Administrator_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_b4162ce3-ed32-4ed2-8e3e-81aa5ffb40ef-e9406920-01c0-4e3e-b361-09a7df62ea27.png";
const key = "videotranscriber/blog/turboscribe-review-ai-transcription-tool-cover.webp";

const client = new AwsClient({ accessKeyId, secretAccessKey });

const meta = await sharp(src).metadata();
const body = await sharp(src)
  .resize(1920, 1200, { fit: "cover", position: "centre" })
  .webp({ quality: 86 })
  .toBuffer();

const url = `${endpoint}/${bucket}/${key}`;
const res = await client.fetch(url, {
  method: "PUT",
  headers: {
    "Content-Type": "image/webp",
    "Content-Disposition": "inline",
    "Cache-Control": "public, max-age=31536000",
    "Content-Length": String(body.length),
  },
  body,
});

if (!res.ok) {
  throw new Error(`${key}: ${res.status} ${await res.text()}`);
}

const publicUrl = `${domain}/${key}`;
console.log({
  key,
  from: `${meta.width}x${meta.height}`,
  to: "1920x1200",
  bytes: body.length,
  publicUrl,
});
