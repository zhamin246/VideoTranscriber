import { config } from "dotenv";
import { readFileSync } from "node:fs";
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
const domain = lastEnv("STORAGE_DOMAIN");

if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
  throw new Error("Missing STORAGE_* env");
}

const ASSETS =
  "C:/Users/Administrator/.grok/sessions/d%3A%5Cgithub%5CVideoTranscriber/01a089de-faa2-7c52-acff-8743305eb56a/assets";

const files = [
  {
    src: `${ASSETS}/image-edba0d95-77f0-4f53-9985-fe14148808f7.webp`,
    key: "videotranscriber/landing/howtouse/subtitle-step-1.webp",
  },
  {
    src: `${ASSETS}/image-878a4ebc-8540-4f7c-aa6f-95cfb9e5bcf0.webp`,
    key: "videotranscriber/landing/howtouse/subtitle-step-2.webp",
  },
  {
    src: `${ASSETS}/image-18efa2f1-51d9-494c-b545-7cce162da73f.webp`,
    key: "videotranscriber/landing/howtouse/subtitle-step-3.webp",
  },
];

const client = new AwsClient({ accessKeyId, secretAccessKey });

for (const file of files) {
  const body = readFileSync(file.src);
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
