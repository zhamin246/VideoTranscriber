import fs from "fs";
import path from "path";
import { chromium } from "playwright";

// Prefer playwright if available; else expect LANDMARK_JSON env or chunk files.

const outSrc = path.resolve("src/components/face-rating/data/hero-landmarks.json");
const outPub = path.resolve("public/face-rating/hero-landmarks.json");

async function viaPlaywright() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("http://localhost:3001/face-rating/extract-landmarks.html", {
    waitUntil: "networkidle",
    timeout: 120000,
  });
  const result = await page.waitForFunction(
    () => window.__LANDMARK_RESULT__ && !window.__LANDMARK_RESULT__.error,
    { timeout: 120000 }
  );
  const data = await page.evaluate(() => window.__LANDMARK_RESULT__);
  await browser.close();
  return data;
}

async function main() {
  let data;
  try {
    data = await viaPlaywright();
  } catch (e) {
    console.error("playwright failed:", e.message);
    // fallback: read chunk files if present
    const c0 = path.resolve("scripts/.lm-chunk-0.txt");
    const c1 = path.resolve("scripts/.lm-chunk-1.txt");
    if (fs.existsSync(c0) && fs.existsSync(c1)) {
      data = JSON.parse(fs.readFileSync(c0, "utf8") + fs.readFileSync(c1, "utf8"));
    } else {
      throw e;
    }
  }
  if (!data?.points?.length) throw new Error("no points");
  const json = JSON.stringify(data);
  fs.writeFileSync(outSrc, json);
  fs.writeFileSync(outPub, json);
  console.log("OK", data.points.length, data.imageWidth, "x", data.imageHeight);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
