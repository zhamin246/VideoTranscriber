import fs from "fs";

const files = [
  "src/components/face-rating/ai-video-summarizer-page.tsx",
  "src/components/face-rating/audio-to-text-converter-page.tsx",
  "src/components/face-rating/facebook-transcript-generator-page.tsx",
  "src/components/face-rating/instagram-transcript-generator-page.tsx",
  "src/components/face-rating/landing-page.tsx",
  "src/components/face-rating/mp3-to-srt-page.tsx",
  "src/components/face-rating/tiktok-transcript-generator-page.tsx",
  "src/components/face-rating/video-to-text-converter-page.tsx",
  "src/components/face-rating/x-transcript-generator-page.tsx",
  "src/components/face-rating/youtube-subtitle-downloader-page.tsx",
  "src/components/face-rating/youtube-transcript-generator-page.tsx",
];

for (const f of files) {
  let c = fs.readFileSync(f, "utf8");
  if (!c.includes("ReviewMarquee")) continue;
  c = c.replace(/import ReviewMarquee from "\.\/review-marquee";\r?\n/, "");
  while (c.includes("<ReviewMarquee")) {
    const idx = c.indexOf("<ReviewMarquee");
    const before = c.slice(0, idx);
    const sectionStart = before.lastIndexOf("<section");
    if (sectionStart < 0) break;
    const after = c.slice(idx);
    const end = after.indexOf("</section>");
    if (end < 0) break;
    const removeEnd = idx + end + "</section>".length;
    c = c.slice(0, sectionStart) + c.slice(removeEnd);
  }
  fs.writeFileSync(f, c);
  console.log("ok", f);
}