import fs from "fs";
import path from "path";

const session =
  "C:/Users/Administrator/.grok/sessions/d%3A%5Cgithub%5Cface-rating/019ff1a0-157d-7c33-ae4f-ba23bf962524/assets";

const pairs = [
  ["image-f6e5dde9-2534-4807-934b-73eb5f97db78.webp", "procedure-before.webp"],
  ["image-32d57843-1b0e-41ca-b891-5859dccab8a9.webp", "procedure-after.webp"],
];

const outDir = path.resolve("public/face-rating");
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
