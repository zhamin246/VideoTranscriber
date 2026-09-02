import fs from "fs";

const files = [
  "src/components/face-rating/attractiveness-page.tsx",
  "src/components/face-rating/attractiveness-upload.tsx",
];
let s = "";
for (const f of files) s += fs.readFileSync(f, "utf8");

const chunks = [];
for (const m of s.matchAll(
  /(?:title|body|name|q|a|cite|rest|label|note|range):\s*["']([^"']+)["']/g
)) {
  chunks.push(m[1]);
}
for (const m of s.matchAll(/>([^<>{]+)</g)) {
  const t = m[1].replace(/&apos;/g, "'").trim();
  if (t.length > 2) chunks.push(t);
}
// JSX text lines that use {" "}
const text = chunks.join(" ");
const words = text.split(/\s+/).filter(Boolean);
const matches = text.match(/AI Attractiveness Test/g) || [];
const density = ((matches.length * 3) / words.length) * 100;

console.log({
  approxVisibleWords: words.length,
  phraseCount: matches.length,
  densityPercent: Number(density.toFixed(2)),
  formula: "(phraseCount * 3 / totalWords) * 100",
});
