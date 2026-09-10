import { config } from "dotenv";
import { readFileSync } from "node:fs";
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
const domain = lastEnv("STORAGE_DOMAIN");

if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
  throw new Error("Missing STORAGE_* env");
}

const ASSETS =
  "C:/Users/Administrator/.grok/sessions/d%3A%5Cgithub%5CVideoTranscriber/01a089de-faa2-7c52-acff-8743305eb56a/assets";

const files = [
  {
    src: `${ASSETS}/image-92d617e9-9335-4104-9634-5b95bd6c5e4e.png`,
    key: "videotranscriber/landing/features/summarizer-feature-1-upload.webp",
  },
  {
    src: `${ASSETS}/image-e7f61446-3b08-4dd1-a4a0-97d8e361d574.png`,
    key: "videotranscriber/landing/features/summarizer-feature-2-summary.webp",
  },
  {
    src: `${ASSETS}/image-136ddff2-8c4d-4642-982d-b9dd7cfcde7d.png`,
    key: "videotranscriber/landing/features/summarizer-feature-3-export.webp",
  },
];

const client = new AwsClient({ accessKeyId, secretAccessKey });

for (const file of files) {
  const body = await sharp(file.src).webp({ quality: 86 }).toBuffer();
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
