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

const faqStart =
  /            <section\r?\n              id="faq"[\s\S]*?            <\/section>\r?\n\r?\n            <MoreTools \/>/;

const replacement = `            <LandingFaqSection title={seo.faq.title} items={seo.faq.items} />

            <MoreTools />`;

for (const f of files) {
  let s = fs.readFileSync(f, "utf8");
  if (!faqStart.test(s)) {
    console.log("skip faq block", f);
    continue;
  }
  s = s.replace(faqStart, replacement);
  s = s.replace(
    /  const \[faqOpen, setFaqOpen\] = useState<number \| null>\(null\);\r?\n\r?\n/,
    "",
  );
  if (!s.includes("./landing-faq-section")) {
    s = s.replace(
      /import \{ V \} from "\.\/visual";/,
      'import { LandingFaqSection } from "./landing-faq-section";\nimport { V } from "./visual";',
    );
  }
  s = s.replace(/,\n  ChevronDown,/g, ",");
  s = s.replace(/  ChevronDown,\n/g, "");
  fs.writeFileSync(f, s);
  console.log("ok", f);
}
