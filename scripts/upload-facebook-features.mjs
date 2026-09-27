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
  "C:/Users/Administrator/.grok/sessions/d%3A%5Cgithub%5CVideoTranscriber/01a0e329-24dc-7750-bc1c-15efd9add151/assets";

const files = [
  {
    src: `${ASSETS}/image-c08db330-9341-41b0-92ef-bbac0a5df26b.webp`,
    key: "videotranscriber/landing/features/facebook-feature-1-link.webp",
  },
  {
    src: `${ASSETS}/image-f16468ee-336f-4e6a-8a0d-401dd1e023b9.webp`,
    key: "videotranscriber/landing/features/facebook-feature-2-summary.webp",
  },
  {
    src: `${ASSETS}/image-1e7dabe9-ebf9-4fa3-9099-eb6bd4b94b54.webp`,
    key: "videotranscriber/landing/features/facebook-feature-3-export.webp",
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
