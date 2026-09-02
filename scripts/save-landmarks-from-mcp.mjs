import fs from "fs";
import path from "path";

const mcpFile =
  process.argv[2] ||
  "C:/Users/Administrator/.grok/sessions/d%3A%5Cgithub%5Cface-rating/019ff1a0-157d-7c33-ae4f-ba23bf962524/mcp/call-dc582e31-dc4c-4cab-bfc1-30d339a536e8-323.txt";

const outPath = path.resolve(
  "src/components/face-rating/data/hero-landmarks.json"
);

const raw = fs.readFileSync(mcpFile, "utf8");
// The tool output may be a quoted JSON string, possibly truncated with a note.
// Prefer the #json content if we re-fetch from browser export.

// Find the longest {...} that parses with points
let best = null;
for (const m of raw.matchAll(/\{[^{]*"imageWidth"[\s\S]*?"points"\s*:\s*\[[\s\S]*?\]\s*\}/g)) {
  try {
    // This regex may fail on nested - use simpler approach
  } catch {}
}

// Approach: if line starts with quote and contains imageWidth, JSON.parse the string
const lines = raw.split(/\r?\n/);
for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed.includes("imageWidth") || !trimmed.includes("points")) continue;
  try {
    let v = trimmed;
    // strip leading markdown noise
    const qi = v.indexOf('"');
    if (qi === 0) {
      // fully quoted JSON string
      v = JSON.parse(v);
    } else if (v.startsWith("{")) {
      v = JSON.parse(v);
    } else {
      const start = v.indexOf("{");
      // find matching - if truncated, skip
      v = JSON.parse(v.slice(start));
    }
    if (typeof v === "string") v = JSON.parse(v);
    if (v.points?.length >= 400) {
      best = v;
      break;
    }
  } catch (e) {
    // continue
  }
}

if (!best) {
  // Try whole file as quoted string
  try {
    let v = raw.trim();
    if (v.startsWith('"')) v = JSON.parse(v);
    if (typeof v === "string") v = JSON.parse(v);
    if (v.points?.length) best = v;
  } catch {}
}

if (!best) {
  console.error("Could not parse landmarks from", mcpFile);
  console.error("file length", raw.length, "head", raw.slice(0, 200));
  process.exit(1);
}

fs.writeFileSync(outPath, JSON.stringify(best));
// also public copy
fs.writeFileSync(
  path.resolve("public/face-rating/hero-landmarks.json"),
  JSON.stringify(best)
);
console.log("OK", best.points.length, best.imageWidth, "x", best.imageHeight, "->", outPath);
