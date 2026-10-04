import fs from "fs";

const files = [
  "src/components/face-rating/youtube-video-summarizer-page.tsx",
  "src/components/face-rating/youtube-transcript-generator-page.tsx",
  "src/components/face-rating/tiktok-transcript-generator-page.tsx",
  "src/components/face-rating/instagram-transcript-generator-page.tsx",
  "src/components/face-rating/facebook-transcript-generator-page.tsx",
  "src/components/face-rating/ai-video-summarizer-page.tsx",
  "src/components/face-rating/youtube-subtitle-downloader-page.tsx",
  "src/components/face-rating/video-transcript-generator-page.tsx",
  "src/components/face-rating/audio-to-text-converter-page.tsx",
  "src/components/face-rating/video-to-text-converter-page.tsx",
];

for (const f of files) {
  let s = fs.readFileSync(f, "utf8");
  if (!s.includes("useState(")) {
    s = s.replace(/import \{ useState \} from "react";\r?\n/, "");
  }
  if (!s.includes("ChevronDown")) {
    s = s.replace(/,\r?\n  ChevronDown,/g, ",");
    s = s.replace(/  ChevronDown,\r?\n/g, "");
  }
  fs.writeFileSync(f, s);
  console.log("cleaned", f);
}
