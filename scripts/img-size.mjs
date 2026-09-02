import fs from "fs";
import { execSync } from "child_process";

// Minimal JPEG SOF0 parser for dimensions
function jpegSize(buf) {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) break;
    const marker = buf[i + 1];
    if (marker === 0xc0 || marker === 0xc2) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    const len = buf.readUInt16BE(i + 2);
    i += 2 + len;
  }
  return null;
}

const p = "public/face-rating/hero-face.jpg";
const buf = fs.readFileSync(p);
console.log("file", p, "bytes", buf.length, "dims", jpegSize(buf));
