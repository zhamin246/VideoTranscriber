import fs from "fs";

const src = fs.readFileSync("src/lib/convert/audio-to-text-converter-content.ts", "utf8");

function words(t) {
  return t
    .replace(/<[^>]+>/g, " ")
    .replace(/[^A-Za-z0-9'-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function countPhrase(t, phrase) {
  const re = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  return (t.match(re) || []).length;
}

const tpls = [...src.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
const all = tpls.join(" ");
console.log("article-only below");
const text = all.replace(/<[^>]+>/g, " ");
const w = words(text);
const main = "audio to text converter";
const n = countPhrase(text, main);
console.log("words", w.length);
console.log("main", n, "density", ((n / w.length) * 100).toFixed(2) + "%");
console.log("audio to text", countPhrase(text, "audio to text"));
console.log("transcribe audio to text", countPhrase(text, "transcribe audio to text"));
console.log("transcribe audio to text free", countPhrase(text, "transcribe audio to text free"));

const freq1 = {};
const freq2 = {};
const freq3 = {};
const stop = new Set(["the","a","an","and","or","to","of","in","on","for","this","that","with","you","your","is","are","it","as","from","then","when","can","not","do","does","if"]);
for (let i = 0; i < w.length; i++) {
  const a = w[i].toLowerCase();
  freq1[a] = (freq1[a] || 0) + 1;
  if (i + 1 < w.length) {
    const b = a + " " + w[i + 1].toLowerCase();
    freq2[b] = (freq2[b] || 0) + 1;
  }
  if (i + 2 < w.length) {
    const c = a + " " + w[i + 1].toLowerCase() + " " + w[i + 2].toLowerCase();
    freq3[c] = (freq3[c] || 0) + 1;
  }
}
function top(obj, n, skipStop = false) {
  return Object.entries(obj)
    .filter(([k]) => (skipStop ? !k.split(" ").every((x) => stop.has(x)) : true))
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}
console.log("top1", top(freq1, 15, true));
console.log("top2", top(freq2, 8));
console.log("top3", top(freq3, 8));
