import fs from "fs";
import https from "https";
import path from "path";

const get = (url) =>
  new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => resolve(d));
      })
      .on("error", reject);
  });

const outDir = path.resolve("public/face-rating");
fs.mkdirSync(outDir, { recursive: true });

const landmarksChunk =
  "https://thefacereport.com/_next/static/chunks/0bc087213a8a3ae8.js";
const drawChunk =
  "https://thefacereport.com/_next/static/chunks/df46a9de3b833168.js";

const t = await get(landmarksChunk);
const marker = '"landmarks":{"points":[';
const idx = t.indexOf(marker);
if (idx < 0) throw new Error("landmarks marker not found");
let start = t.indexOf("{", idx + '"landmarks":'.length);
let depth = 0;
let end = -1;
for (let j = start; j < t.length; j++) {
  if (t[j] === "{") depth++;
  else if (t[j] === "}") {
    depth--;
    if (depth === 0) {
      end = j + 1;
      break;
    }
  }
}
const landmarks = JSON.parse(t.slice(start, end));
const compact = {
  imageWidth: landmarks.imageWidth,
  imageHeight: landmarks.imageHeight,
  points: landmarks.points.map((p) => ({
    x: +p.x.toFixed(6),
    y: +p.y.toFixed(6),
    z: +p.z.toFixed(6),
  })),
};
fs.writeFileSync(
  path.join(outDir, "hero-landmarks.json"),
  JSON.stringify(compact)
);

const d = await get(drawChunk);
const re = /\[(\d{1,3},){100,}\d{1,3}\]/g;
let match;
let tess = null;
while ((match = re.exec(d))) {
  const nums = match[0]
    .slice(1, -1)
    .split(",")
    .map(Number);
  if (nums.length > 4000 && Math.max(...nums) < 500) {
    tess = nums;
    break;
  }
}
if (!tess) throw new Error("tessellation array not found");
const pairs = [];
for (let i = 0; i < tess.length; i += 2) pairs.push([tess[i], tess[i + 1]]);
fs.writeFileSync(
  path.join(outDir, "face-mesh-tesselation.json"),
  JSON.stringify(pairs)
);

console.log(
  "OK points=",
  compact.points.length,
  "tessPairs=",
  pairs.length,
  "img=",
  compact.imageWidth,
  "x",
  compact.imageHeight
);
