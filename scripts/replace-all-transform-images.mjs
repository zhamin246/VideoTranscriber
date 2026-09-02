import fs from "fs";
import path from "path";

const session =
  "C:/Users/Administrator/.grok/sessions/d%3A%5Cgithub%5Cface-rating/019ff1a0-157d-7c33-ae4f-ba23bf962524/assets";

const outDir = path.resolve("public/face-rating");
fs.mkdirSync(outDir, { recursive: true });

// Map by known asset filenames from this chat (user uploads)
const map = {
  // glowup
  "image-e865b807-32af-4f62-b517-631261fb110a.webp": "glowup-before.webp",
  "image-cef5e375-f30a-45b1-a0ab-212810ffe2e9.webp": "glowup-after.webp",
  // studio
  "image-28318f2b-5d0a-4553-9efd-78f7cfc4eef2.webp": "studio-before.webp",
  "image-90ea1bc5-e7cf-4225-a66e-5df37f56b05b.webp": "studio-after.webp",
  // procedure
  "image-f6e5dde9-2534-4807-934b-73eb5f97db78.webp": "procedure-before.webp",
  "image-32d57843-1b0e-41ca-b891-5859dccab8a9.webp": "procedure-after.webp",
  // hairstyle
  "image-0b30bfe4-0eec-4909-8d15-3398f5e385e0.webp": "hairstyle-before.webp",
  "image-5e7af5a8-bd89-487c-8b6e-30bffc915b7a.webp": "hairstyle-after.webp",
  // timemachine (latest upload)
  "image-791a3a7b-0c7e-4443-842e-d7709e0e7f3c.webp": "timemachine-before.webp",
  "image-a1f6f8da-78a4-47f1-a4cc-a7fb61ffb0b6.webp": "timemachine-after.webp",
};

const files = fs.readdirSync(session);
console.log("session assets:", files.filter((f) => f.startsWith("image-")).join("\n"));

let ok = 0;
for (const [srcName, destName] of Object.entries(map)) {
  const src = path.join(session, srcName);
  const dest = path.join(outDir, destName);
  if (!fs.existsSync(src)) {
    console.error("MISSING", srcName);
    continue;
  }
  fs.copyFileSync(src, dest);
  // also write a cache-busted copy name used by code
  console.log("ok", destName, fs.statSync(dest).size);
  ok++;
}
console.log("replaced", ok, "/", Object.keys(map).length);

// list final sizes
for (const name of [
  "glowup-before.webp",
  "glowup-after.webp",
  "studio-before.webp",
  "studio-after.webp",
  "procedure-before.webp",
  "procedure-after.webp",
  "hairstyle-before.webp",
  "hairstyle-after.webp",
  "timemachine-before.webp",
  "timemachine-after.webp",
]) {
  const p = path.join(outDir, name);
  console.log(name, fs.existsSync(p) ? fs.statSync(p).size : "ABSENT");
}
