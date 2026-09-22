import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { AwsClient } from "aws4fetch";

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
  "C:/Users/Administrator/.grok/sessions/d%3A%5Cgithub%5CVideoTranscriber/01a0c649-b237-70b3-a49a-80e77887909d/assets";

const files = [
  {
    src: `${ASSETS}/image-aafbf9c7-59c3-4ed9-9108-bd12ae7321ad.webp`,
    key: "videotranscriber/landing/howtouse/instagram-step-1.webp",
  },
  {
    src: `${ASSETS}/image-4d2b2956-2777-427a-8da2-20bafc901f47.webp`,
    key: "videotranscriber/landing/howtouse/instagram-step-2.webp",
  },
  {
    src: `${ASSETS}/image-803a4110-7253-4cfd-b9f6-de82eafb79b2.webp`,
    key: "videotranscriber/landing/howtouse/instagram-step-3.webp",
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
