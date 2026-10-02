import fs from "fs";
const m = fs.readFileSync("src/lib/convert/video-transcript-generator-content.ts", "utf8");
const texts = [...m.matchAll(/:\s*["']([^"']+)["']/g)].map((x) => x[1]);
const t = texts.join(" ");
const w = t.split(/\s+/).filter(Boolean);
const c = (t.match(/video transcript generator/gi) || []).length;
console.log({ words: w.length, phraseCount: c, densityPercent: Number(((c * 4) / w.length * 100).toFixed(2)) });
