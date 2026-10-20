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
    src: `${ASSETS}/c__Users_Administrator_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_847b20aa-f5e3-4a24-a37c-0411d7264794-7e203799-6b40-4e7b-a260-6109e1d3d3fd.png`,
    key: "videotranscriber/landing/howtouse/x-step-1.webp",
  },
  {
    src: `${ASSETS}/c__Users_Administrator_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_66493c7d-e096-4818-99ef-86bd3905c67f-13559da5-025c-4bc5-9374-ed3b609007a4.png`,
    key: "videotranscriber/landing/howtouse/x-step-2.webp",
  },
  {
    src: `${ASSETS}/c__Users_Administrator_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_fa09769f-57e8-4bd7-82d2-8bdd6d9f7326-712408df-9af8-4f30-b439-058c7173810b.png`,
    key: "videotranscriber/landing/howtouse/x-step-3.webp",
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
