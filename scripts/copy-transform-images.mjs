import fs from "fs";
import path from "path";

const session =
  "C:/Users/Administrator/.grok/sessions/d%3A%5Cgithub%5Cface-rating/019ff1a0-157d-7c33-ae4f-ba23bf962524/assets";

const pairs = [
  ["image-e865b807-32af-4f62-b517-631261fb110a.webp", "glowup-before.webp"],
  ["image-cef5e375-f30a-45b1-a0ab-212810ffe2e9.webp", "glowup-after.webp"],
  ["image-28318f2b-5d0a-4553-9efd-78f7cfc4eef2.webp", "studio-before.webp"],
  ["image-90ea1bc5-e7cf-4225-a66e-5df37f56b05b.webp", "studio-after.webp"],
];

const outDir = path.resolve("public/face-rating");
fs.mkdirSync(outDir, { recursive: true });

for (const [srcName, destName] of pairs) {
  const src = path.join(session, srcName);
  const dest = path.join(outDir, destName);
  if (!fs.existsSync(src)) {
    console.error("missing", src);
    process.exit(1);
  }
  fs.copyFileSync(src, dest);
  console.log("ok", destName, fs.statSync(dest).size);
}
