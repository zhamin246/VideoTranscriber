import fs from "fs";
import path from "path";

const src =
  "C:/Users/Administrator/.grok/sessions/d%3A%5Cgithub%5Cface-rating/019ff1a0-157d-7c33-ae4f-ba23bf962524/assets/image-ec5a2bdc-06f0-4d80-9de4-e95cb1213706.png";
const destPng = "public/face-rating/hero-face-source.png";
const destJpg = "public/face-rating/hero-face.jpg";

if (!fs.existsSync(src)) {
  console.error("source missing", src);
  process.exit(1);
}

fs.mkdirSync(path.dirname(destPng), { recursive: true });
fs.copyFileSync(src, destPng);
// Also use PNG as jpg path temporarily — browser accepts; better convert
fs.copyFileSync(src, destJpg);
console.log("copied", fs.statSync(destPng).size, "bytes");
