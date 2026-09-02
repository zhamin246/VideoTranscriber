/**
 * Copy @mediapipe/tasks-vision runtime assets into public/mediapipe
 * so the browser can import /mediapipe/vision_bundle.mjs + wasm.
 * Downloads face_landmarker.task if missing.
 */
import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = path.join(root, "node_modules", "@mediapipe", "tasks-vision");
const dest = path.join(root, "public", "mediapipe");
const wasmDest = path.join(dest, "wasm");
const modelPath = path.join(dest, "face_landmarker.task");
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

function copyFile(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

function download(url, to) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(to);
    https
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          const loc = res.headers.location;
          res.resume();
          if (!loc) return reject(new Error("redirect without location"));
          return download(loc, to).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        res.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", reject);
  });
}

if (!fs.existsSync(src)) {
  console.warn("[copy-mediapipe] @mediapipe/tasks-vision not installed — skip");
  process.exit(0);
}

fs.mkdirSync(wasmDest, { recursive: true });
copyFile(path.join(src, "vision_bundle.mjs"), path.join(dest, "vision_bundle.mjs"));
const map = path.join(src, "vision_bundle.mjs.map");
if (fs.existsSync(map)) copyFile(map, path.join(dest, "vision_bundle.mjs.map"));

for (const name of fs.readdirSync(path.join(src, "wasm"))) {
  copyFile(path.join(src, "wasm", name), path.join(wasmDest, name));
}

if (!fs.existsSync(modelPath) || fs.statSync(modelPath).size < 1000) {
  console.log("[copy-mediapipe] downloading face_landmarker.task …");
  await download(MODEL_URL, modelPath);
}

console.log("[copy-mediapipe] ready → public/mediapipe");
