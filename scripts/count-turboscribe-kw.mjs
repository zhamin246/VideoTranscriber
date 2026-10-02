import fs from "fs";
const m = fs.readFileSync(
  "src/lib/blog/posts/turboscribe-review-ai-transcription-tool.ts",
  "utf8"
);
const marker = "content: `";
const i = m.indexOf(marker) + marker.length;
const j = m.lastIndexOf("`,");
const t = m.slice(i, j);
const words = t.split(/\s+/).filter(Boolean);
const c = (t.match(/turboscribe review ai transcription tool/gi) || []).length;
console.log({
  words: words.length,
  phraseCount: c,
  densityPercent: Number(((c * 5) / words.length * 100).toFixed(2)),
});
