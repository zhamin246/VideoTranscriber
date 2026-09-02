import path from "node:path";
import { config } from "dotenv";
import sharp from "sharp";
import { AwsClient } from "aws4fetch";

config({ path: ".env.development" });

const assets = path.join(
  process.env.USERPROFILE || "",
  ".cursor/projects/d-github-imagetocad/assets"
);

const files = [
  {
    src: path.join(
      assets,
      "c__Users_Administrator_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_Pedestrians_walking_past_tenemen__2K_202608220558-0105e90e-9db4-4cb2-b7ac-3a16fdafe2fd.png"
    ),
    key: "landing/hero-street-photo.webp",
  },
  {
    src: path.join(
      assets,
      "c__Users_Administrator_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images________9_-ec981678-e72c-4691-acb7-2cffe4631e11.png"
    ),
    key: "landing/hero-street-lineart.webp",
  },
];

const endpoint = process.env.STORAGE_ENDPOINT;
const bucket = process.env.STORAGE_BUCKET;
const domain = process.env.STORAGE_DOMAIN;
const client = new AwsClient({
  accessKeyId: process.env.STORAGE_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY || "",
});

const WIDTH = 1024;
const HEIGHT = 768;

for (const file of files) {
  const meta = await sharp(file.src).metadata();
  const body = await sharp(file.src)
    .resize(WIDTH, HEIGHT, { fit: "cover", position: "centre" })
    .webp({ quality: 84 })
    .toBuffer();

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
  console.log(
    file.key,
    `${meta.width}x${meta.height} -> ${WIDTH}x${HEIGHT}`,
    `${body.length} bytes`,
    `${domain}/${file.key}`
  );
}
