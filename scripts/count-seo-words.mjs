import fs from "fs";
const file = process.argv[2];
const m = fs.readFileSync(file, "utf8");
const texts = [...m.matchAll(/:\s*["']([^"']+)["']/g)].map((x) => x[1]);
const t = texts.join(" ");
const w = t.split(/\s+/).filter(Boolean);
console.log({ file, words: w.length });
