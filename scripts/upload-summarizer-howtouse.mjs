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
    src: `${ASSETS}/image-c48f3c58-160a-4524-bfdd-356904510732.webp`,
    key: "videotranscriber/landing/howtouse/summarizer-step-1.webp",
  },
  {
    src: `${ASSETS}/image-a262a09a-ac1e-4e6d-ada5-6e1d1ba8ba30.webp`,
    key: "videotranscriber/landing/howtouse/summarizer-step-2.webp",
  },
  {
    src: `${ASSETS}/image-212b9f68-5e74-43d8-b9c8-e9f7d1fb9af7.webp`,
    key: "videotranscriber/landing/howtouse/summarizer-step-3.webp",
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
