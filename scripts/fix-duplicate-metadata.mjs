import fs from "fs";

const files = [
  "src/app/[locale]/(default)/tiktok-transcript-generator/page.tsx",
  "src/app/[locale]/(default)/instagram-transcript-generator/page.tsx",
  "src/app/[locale]/(default)/video-to-text/page.tsx",
  "src/app/[locale]/(default)/mp3-to-srt/page.tsx",
  "src/app/[locale]/(default)/ai-video-summarizer/page.tsx",
  "src/app/[locale]/(default)/youtube-subtitle-downloader/page.tsx",
  "src/app/[locale]/(default)/facebook-transcript-generator/page.tsx",
  "src/app/[locale]/(default)/x-transcript-generator/page.tsx",
];

const dup = /\}\);\r?\n\}: \{[\s\S]*?\r?\n\}\r?\n\r?\nexport default function Page/;

for (const file of files) {
  let c = fs.readFileSync(file, "utf8");
  if (!dup.test(c)) {
    console.log("no dup", file);
    continue;
  }
  c = c.replace(dup, "});\n}\n\nexport default function Page");
  fs.writeFileSync(file, c);
  console.log("fixed", file);
}