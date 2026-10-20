/**
 * SEO copy for /youtube-transcript-generator.
 * Primary keyword: "youtube to transcript"
 * Scope: public YouTube links (watch, Shorts, youtu.be). Not a file-upload page.
 */

export const YOUTUBE_TRANSCRIPT_GENERATOR_HREF = "/youtube-transcript-generator";

export const youtubeTranscriptGeneratorSeo = {
  meta: {
    title: "YouTube to Transcript from a Link | Video Transcriber",
    description:
      "Paste a public link and use YouTube to transcript. Export TXT, DOCX, SRT, or VTT from the workspace. Private or blocked videos may not fetch.",
  },
  hero: {
    h1: "Paste a Public Link for YouTube to Transcript",
    subtitle:
      "YouTube to transcript on this page means a public watch, Shorts, or youtu.be URL becomes text you can search and export. Paste the link, run transcription, then copy or download from the workspace.",
    chips: [
      { label: "Link paste", color: "#60A5FA" },
      { label: "Speaker labels", color: "#14B8A6" },
      { label: "SRT & VTT export", color: "#38BDF8" },
      { label: "AI notes & chapters", color: "#8882F5" },
      { label: "Public YouTube", color: "#3B82F6" },
    ],
  },
  how: {
    title: "How YouTube to transcript works",
    lead: "YouTube to transcript is for a public URL, not for a file you already downloaded. Paste the link, transcribe the spoken audio with AI, then stay in the workspace to copy, export, or generate notes. Private, age-gated, or login-walled videos may not fetch — that is a platform limit, not a setting we can flip. YouTube to transcript on this page does not install a browser extension or open YouTube Studio.",
    steps: [
      {
        n: "1",
        title: "Paste your YouTube link",
        body: "Copy a public watch, Shorts, or youtu.be URL and paste it in the link tab. This is YouTube to transcript from a reachable video. Private or blocked media may fail.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/youtube-step-1.webp",
      },
      {
        n: "2",
        title: "Run transcription",
        body: "YouTube to transcript here transcribes spoken audio with AI. YouTube captions do not have to exist first. Choose auto language detect or a source language, and optionally separate speakers.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/youtube-step-2.webp",
      },
      {
        n: "3",
        title: "Copy or export",
        body: "Review the YouTube transcript in your workspace. Copy text, or download TXT, DOCX, SRT, VTT, or CSV. Generate AI notes, chapters, Ask AI answers, or a mind map when you need more structure.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/youtube-step-3.webp",
      },
    ],
  },
  features: {
    title: "YouTube video to text from a public link",
    lead: "YouTube video to transcript on this URL starts with a public link. YouTube video to text is the same job: speech becomes written text you can edit. It is not a scrape of every caption language track YouTube stores.",
    rows: [
      {
        title: "Paste a public YouTube link",
        body: "Use a public watch page, Shorts link, or youtu.be share URL. Add speaker labels and language selection before you start. Private or blocked videos may not download. Other public platforms can use the same link tab when you are not on a YouTube URL.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/youtube-feature-1-link.webp",
        alt: "Paste a YouTube link to transcribe",
        imageRight: true,
      },
      {
        title: "Generate summary and key points",
        body: "After YouTube to transcript finishes, generate AI notes and key points from the same video. Use chapters, Ask AI, and mind map when you want more structure without replaying the full runtime.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/youtube-feature-2-summary.webp",
        alt: "Generate an AI summary from a YouTube transcript",
        imageRight: false,
      },
      {
        title: "Export your transcript",
        body: "Export as TXT, DOCX, SRT, VTT, or CSV. Copy the YouTube transcript for notes and drafts, or download subtitle files for an editor. PDF, JSON, and translation are not in the current export set.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/youtube-feature-3-export.webp",
        alt: "Export a YouTube transcript",
        imageRight: true,
      },
    ],
  },
  usecases: {
    title: "YouTube video transcription for lectures and talks",
    lead: "YouTube video to transcript is the right path when the source is already on YouTube and public. YouTube video transcription on this page does not download a private class or a members-only talk.",
    items: [
      {
        title: "Lectures & courses",
        body: "Paste a public lecture or course URL, then YouTube to transcript so you can search the spoken track. Generate notes and chapters in the workspace instead of rewatching every minute. Members-only class videos are out of scope if the link is not public.",
      },
      {
        title: "Tutorials",
        body: "Turn a public how-to into YouTube video to text you can search. Export SRT or VTT when you need a captions file for an editor. This is speech-to-text, not a dump of every YouTube caption track.",
      },
      {
        title: "Interviews",
        body: "Run YouTube video transcription on a public interview. Optional speaker labels help separate host and guest when the model can tell them apart.",
      },
      {
        title: "Show notes & blogs",
        body: "Draft show notes and posts from the YouTube transcript. Copy TXT or DOCX into the doc tool you already use. YouTube to transcript gives you the spoken words; you still write the publish-ready post.",
      },
      {
        title: "Team research",
        body: "Share the YouTube transcript so teammates can search a talk without watching it twice. Ask AI questions against the same workspace. Answers stay grounded in that transcript.",
      },
      {
        title: "Captions workflow",
        body: "Export SRT or VTT after YouTube to transcript. Use those files in an editor. We do not import every caption language YouTube stores.",
      },
    ],
  },
  faq: {
    title: "Frequently asked questions",
    items: [
      {
        q: "What is a YouTube Transcript Generator?",
        a: "It is YouTube to transcript from a public link: speech becomes written text. Paste a reachable YouTube URL, transcribe the audio with AI, then copy or export in the workspace.",
      },
      {
        q: "Which YouTube links work?",
        a: "Public watch URLs, Shorts, and youtu.be links when the media is reachable. Private, geo-blocked, or login-walled videos may fail — that is a platform constraint we cannot bypass.",
      },
      {
        q: "Do I need YouTube captions to already exist?",
        a: "No. YouTube to transcript on this page transcribes spoken audio with AI. Existing captions are not required, and we do not claim to import every caption language track YouTube stores.",
      },
      {
        q: "What can I export?",
        a: "TXT, DOCX, SRT, VTT, and CSV. PDF transcript export, JSON, and translation are not available in the current product. Copy from the workspace if you only need the YouTube transcript on the clipboard.",
      },
      {
        q: "Do you support speaker labels?",
        a: "Yes. Enable speaker separation before you start so dialogue can be attributed to different speakers when the model can tell them apart. You do not assign names in advance on YouTube to transcript.",
      },
      {
        q: "Is there a free plan?",
        a: "Yes. You can use YouTube transcript generator free within plan limits. Sign-in is required so minutes and history stay on your account. Free accounts get monthly minutes with daily and per-file limits. See Pricing for current numbers.",
      },
    ],
  },
  cta: {
    title: "YouTube transcript generator free on your next link",
    body: "Paste a public URL for YouTube to transcript, then export TXT, DOCX, SRT, VTT, or CSV. YouTube transcript generator free still follows monthly minutes, daily caps, and per-file limits on Pricing.",
    button: "Start converting",
  },
} as const;
