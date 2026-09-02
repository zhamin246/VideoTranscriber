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
const domain = lastEnv("STORAGE_DOMAIN");

if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
  throw new Error("Missing STORAGE_* env");
}

const ASSETS =
  "C:/Users/Administrator/.cursor/projects/d-github-imagetocad/assets";

const files = [
  [
    "people-before.webp",
    "c__Users_Administrator_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images____-_2026-08-22T052014.928-5b6155bd-bffb-49cc-ac80-8efbabf3cd10.png",
  ],
  [
    "people-after.webp",
    "c__Users_Administrator_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images______-2b3a6ad5-7c41-4278-9b26-fc49c7d5a0e0.png",
  ],
  [
    "artifacts-before.webp",
    "c__Users_Administrator_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images____-_2026-08-22T052009.855-908a66d2-02ed-4a4d-aa31-7c3092b21524.png",
  ],
  [
    "artifacts-after.webp",
    "c__Users_Administrator_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images________1_-b7b0d36d-c3c1-436c-aa4c-3c1fcf4bec36.png",
  ],
  [
    "plans-before.webp",
    "c__Users_Administrator_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images____-_2026-08-22T052003.589-189c5da0-7b49-452d-9d53-d336a392905a.png",
  ],
  [
    "plans-after.webp",
    "c__Users_Administrator_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images________2_-fb70ab6c-b4d2-4fcf-944d-c8c266712a48.png",
  ],
  [
    "fashion-before.webp",
    "c__Users_Administrator_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images____-_2026-08-22T051958.844-770511e3-1ea6-4b84-825c-d71ff04afef6.png",
  ],
  [
    "fashion-after.webp",
    "c__Users_Administrator_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images________3_-a0995f00-ba03-4381-8f24-0a825e13f462.png",
  ],
  [
    "patents-before.webp",
    "c__Users_Administrator_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images____-_2026-08-22T051952.865-74dc7ff4-27b6-4097-ad39-f1d13fbbdf0d.png",
  ],
  [
    "patents-after.webp",
    "c__Users_Administrator_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images________4_-6cb1921e-611f-4f05-a50d-ce496ca3e5df.png",
  ],
  [
    "product-before.webp",
    "c__Users_Administrator_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images____-_2026-08-22T051947.123-ed752c4a-e6a8-4e3d-8316-923a66b9de0a.png",
  ],
  [
    "product-after.webp",
    "c__Users_Administrator_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images________5_-50fade9f-8491-4933-82b6-5d45ec1434a0.png",
  ],
  [
    "architecture-before.webp",
    "c__Users_Administrator_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images____-_2026-08-22T051941.762-97b98c60-109d-4d78-981d-ab790af9390e.png",
  ],
  [
    "architecture-after.webp",
    "c__Users_Administrator_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images________6_-3082cc68-c16a-4b16-b793-70ba3bfffc2d.png",
  ],
];

const client = new AwsClient({ accessKeyId, secretAccessKey });

for (const [keyName, fileName] of files) {
  const src = path.join(ASSETS, fileName);
  const webp = await sharp(readFileSync(src))
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  const key = `use-cases/${keyName}`;
  const url = `${endpoint}/${bucket}/${key}`;
  const request = new Request(url, {
    method: "PUT",
    headers: {
      "Content-Type": "image/webp",
      "Content-Disposition": "inline",
      "Content-Length": String(webp.length),
    },
    body: webp,
  });
  const response = await client.fetch(request);
  if (!response.ok) {
    throw new Error(`${key}: ${response.status} ${await response.text()}`);
  }
  const publicUrl = domain ? `${domain}/${key}` : url;
  console.log(publicUrl, `${webp.length} bytes`);
}
