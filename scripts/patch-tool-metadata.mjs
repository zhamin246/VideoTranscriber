import fs from "fs";

const patches = [
  ["src/app/[locale]/(default)/audio-to-text-converter/page.tsx", "AUDIO_TO_TEXT_CONVERTER_HREF", "audioToTextConverterSeo"],
  ["src/app/[locale]/(default)/tiktok-transcript-generator/page.tsx", "TIKTOK_TRANSCRIPT_GENERATOR_HREF", "tiktokTranscriptGeneratorSeo"],
  ["src/app/[locale]/(default)/instagram-transcript-generator/page.tsx", "INSTAGRAM_TRANSCRIPT_GENERATOR_HREF", "instagramTranscriptGeneratorSeo"],
  ["src/app/[locale]/(default)/video-to-text/page.tsx", "VIDEO_TO_TEXT_CONVERTER_HREF", "videoToTextConverterSeo"],
  ["src/app/[locale]/(default)/mp3-to-srt/page.tsx", "MP3_TO_SRT_HREF", "mp3ToSrtSeo"],
  ["src/app/[locale]/(default)/ai-video-summarizer/page.tsx", "AI_VIDEO_SUMMARIZER_HREF", "aiVideoSummarizerSeo"],
  ["src/app/[locale]/(default)/youtube-subtitle-downloader/page.tsx", "YOUTUBE_SUBTITLE_DOWNLOADER_HREF", "youtubeSubtitleDownloaderSeo"],
  ["src/app/[locale]/(default)/facebook-transcript-generator/page.tsx", "FACEBOOK_TRANSCRIPT_GENERATOR_HREF", "facebookTranscriptGeneratorSeo"],
  ["src/app/[locale]/(default)/x-transcript-generator/page.tsx", "X_TRANSCRIPT_GENERATOR_HREF", "xTranscriptGeneratorSeo"],
];

function replaceGenerateMetadata(c) {
  const re =
    /export async function generateMetadata\([\s\S]*?\n\}\n\nexport default function Page/;
  const m = c.match(re);
  if (!m || m.index == null) return null;
  return { start: m.index, end: m.index + m[0].length - "export default function Page".length };
}

for (const [file, hrefConst, seoConst] of patches) {
  let c = fs.readFileSync(file, "utf8");
  if (c.includes("buildToolPageMetadata")) {
    console.log("skip", file);
    continue;
  }
  const span = replaceGenerateMetadata(c);
  if (!span) {
    console.log("no meta", file);
    continue;
  }
  const block = `export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { title, description } = ${seoConst}.meta;
  return buildToolPageMetadata({
    path: ${hrefConst},
    locale,
    title,
    description,
  });
}

`;
  c = c.slice(0, span.start) + block + c.slice(span.end);
  c = c.replace(/import \{ defaultLocale \} from "@\/i18n\/locale";\r?\n/, "");
  if (!c.includes('import { buildToolPageMetadata }')) {
    c = c.replace(
      /import \{ Metadata \} from "next";/,
      'import { Metadata } from "next";\nimport { buildToolPageMetadata } from "@/lib/seo/build-tool-page-metadata";',
    );
  }
  fs.writeFileSync(file, c);
  console.log("patched", file);
}