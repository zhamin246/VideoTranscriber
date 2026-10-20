import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { AwsClient } from "aws4fetch";
import sharp from "sharp";

config({ path: ".env.development" });

function lastEnv(name) {
  const text = readFileSync(".env.development", "utf8");
  const matches = [...text.matchAll(new RegExp(`^${name}\\s*=\\s*(.*)$`, "gm"))].map((m) =>
    m[1].trim().replace(/^["']|["']$/g, "").trim(),
  );
  return matches.filter(Boolean).at(-1) || process.env[name] || "";
}

const endpoint = lastEnv("STORAGE_ENDPOINT");
const accessKeyId = lastEnv("STORAGE_ACCESS_KEY_ID");
const secretAccessKey = lastEnv("STORAGE_SECRET_ACCESS_KEY");
const bucket = lastEnv("STORAGE_BUCKET");
const domain = lastEnv("STORAGE_DOMAIN");

if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
  throw new Error("Missing STORAGE_* env");
}

const ASSETS =
  "C:/Users/Administrator/.cursor/projects/d-github-VideoTranscriber/assets";

const files = [
  {
    src: `${ASSETS}/c__Users_Administrator_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_f316f125-aad2-44cf-8022-e65411ce7a2e-a7715d4c-b323-49cf-a70d-2eba2a3d5ce5.png`,
    key: "videotranscriber/landing/features/x-feature-1.webp",
  },
  {
    src: `${ASSETS}/c__Users_Administrator_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_41fd1802-7084-4273-9153-08840e241240-e71dc942-b04b-4c4b-a6ee-21a5d0c29ba9.png`,
    key: "videotranscriber/landing/features/x-feature-2.webp",
  },
  {
    src: `${ASSETS}/c__Users_Administrator_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_6abdc5f0-aa0e-40b2-bb7e-d3402af066c5-e25ffe76-d63c-4485-aa7a-f71d929bbdc0.png`,
    key: "videotranscriber/landing/features/x-feature-3.webp",
  },
];

const client = new AwsClient({ accessKeyId, secretAccessKey });

for (const file of files) {
  const body = await sharp(readFileSync(file.src)).webp({ quality: 88 }).toBuffer();
  const url = `${endpoint}/${bucket}/${file.key}`;
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
    throw new Error(`${file.key}: ${res.status} ${await res.text()}`);
  }
  console.log(file.key, `${body.length} bytes`, `${domain}/${file.key}`);
}
