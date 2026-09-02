import fs from "fs";
import path from "path";

const session =
  "C:/Users/Administrator/.grok/sessions/d%3A%5Cgithub%5Cface-rating/019ff1a0-157d-7c33-ae4f-ba23bf962524/assets";

const pairs = [
  ["image-0b30bfe4-0eec-4909-8d15-3398f5e385e0.webp", "hairstyle-before.webp"],
  ["image-5e7af5a8-bd89-487c-8b6e-30bffc915b7a.webp", "hairstyle-after.webp"],
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
