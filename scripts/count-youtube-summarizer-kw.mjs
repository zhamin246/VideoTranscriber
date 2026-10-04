import fs from "fs";

const s = fs.readFileSync(
  "src/lib/convert/youtube-video-summarizer-content.ts",
  "utf8");

function stats(label, text) {
  const words = text.split(/\s+/).filter(Boolean);
  const matches = text.match(/YouTube video summarizer/gi) || [];
  const density = +((matches.length * 3) / words.length * 100).toFixed(2);
  console.log(label, {
    words: words.length,
    phrase: matches.length,
    density,
  });
}

const bodyOnly = s.replace(/meta:\s*\{[\s\S]*?\},/, "");
const chunks = [...bodyOnly.matchAll(/"([^"]+)"/g)]
  .map((m) => m[1])
  .filter(
    (c) =>
      !c.startsWith("#") &&
      !c.startsWith("/") &&
      !c.endsWith(".webp") &&
      c !== "1" &&
      c !== "2" &&
      c !== "3",
  );
stats("body strings (excl. meta)", chunks.join(" "));

const withMeta = [...s.matchAll(/"([^"]+)"/g)]
  .map((m) => m[1])
  .filter(
    (c) =>
      !c.startsWith("#") &&
      !c.startsWith("/") &&
      !c.endsWith(".webp") &&
      c !== "1" &&
      c !== "2" &&
      c !== "3" &&
      !c.includes("| Video Transcriber"),
  );
stats("body + meta description", withMeta.join(" "));
