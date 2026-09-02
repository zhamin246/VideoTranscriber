/**
 * Pull landmarks from the extract page via a simple approach:
 * read the #json pre content that chrome left? We can't access chrome from node.
 *
 * Instead: re-run detection using a tiny HTML fetch won't work offline.
 * Use puppeteer? Not installed.
 *
 * Fallback: write a node script that uses dynamic import of tasks-vision in node.
 * MediaPipe tasks-vision may work in Node 18+ with experimental flags.
 */

import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { createCanvas, loadImage } from "@napi-rs/canvas";

// If canvas not available, fall back to reading browser-exported file path arg
const outPath = path.resolve(
  "src/components/face-rating/data/hero-landmarks.json"
);

const exported = process.argv[2];
if (exported && fs.existsSync(exported)) {
  const raw = fs.readFileSync(exported, "utf8");
  // may be wrapped in quotes / markdown
  let json = raw.trim();
  if (json.startsWith('"') && json.endsWith('"')) {
    json = JSON.parse(json);
  } else {
    // try extract first JSON object
    const i = json.indexOf("{");
    const j = json.lastIndexOf("}");
    json = JSON.parse(json.slice(i, j + 1));
  }
  if (typeof json === "string") json = JSON.parse(json);
  fs.writeFileSync(outPath, JSON.stringify(json));
  console.log("saved from export", json.points?.length, outPath);
  process.exit(0);
}

console.error("Usage: node scripts/save-landmarks-from-browser.mjs <exported.json>");
process.exit(1);
