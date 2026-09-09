/**
 * SEO copy for /youtube-transcript-generator.
 * Primary keyword: "YouTube Transcript Generator"
 * Claims limited to in-app capabilities. No long-form article block.
 */

export const YOUTUBE_TRANSCRIPT_GENERATOR_HREF = "/youtube-transcript-generator";

export const youtubeTranscriptGeneratorSeo = {
  meta: {
    title: "YouTube Transcript Generator — Paste a Link, Get Text",
    description:
      "Use our YouTube Transcript Generator to turn a public YouTube video into a searchable transcript. Paste a link, then export TXT, DOCX, SRT, VTT, or CSV.",
  },
  hero: {
    h1: "YouTube Transcript Generator",
    subtitle:
      "This YouTube Transcript Generator turns speech from a public YouTube video into clear, searchable text. Paste a watch, Shorts, or youtu.be link — then copy, download, or keep working in your workspace.",
    chips: [
      { label: "Link paste", color: "#60A5FA" },
      { label: "Speaker labels", color: "#14B8A6" },
      { label: "SRT & VTT export", color: "#38BDF8" },
      { label: "AI notes & chapters", color: "#8882F5" },
      { label: "File upload", color: "#3B82F6" },
    ],
  },
  how: {
    title: "How this YouTube Transcript Generator works",
    lead: "Three steps take you from a public YouTube URL to a readable transcript you can edit and export.",
    steps: [
      {
        n: "1",
        title: "Paste your YouTube link",
        body: "Copy a public watch, Shorts, or youtu.be URL and paste it in the link tab. Private, age-gated, or login-walled videos may not fetch.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/youtube-step-1.webp",
      },
      {
        n: "2",
        title: "Run transcription",
        body: "This YouTube Transcript Generator transcribes spoken audio with AI — it does not only copy YouTube’s caption panel. Choose auto language detect or a source language, and optionally separate speakers.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/youtube-step-2.webp",
      },
      {
        n: "3",
        title: "Copy or export",
        body: "Review the transcript in your workspace, copy text, or download TXT, DOCX, SRT, VTT, or CSV. Generate AI notes, chapters, or a mind map when you need more structure.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/youtube-step-3.webp",
      },
    ],
  },
  features: {
    title: "What you can do with this YouTube Transcript Generator",
    lead: "Use this YouTube Transcript Generator to paste a public YouTube link, transcribe speech with AI, then export TXT, DOCX, SRT, VTT, or CSV.",
    items: [
      {
        title: "Paste public YouTube links",
        body: "Watch pages, Shorts, and youtu.be share links work when the video is publicly reachable. Other supported platforms can use the same link tab.",
      },
      {
        title: "AI speech-to-text, not caption scraping only",
        body: "The pipeline fetches reachable audio and transcribes speech. That helps when you want a full transcript you can edit, even if YouTube’s built-in panel is awkward to copy.",
      },
      {
        title: "Language detect and speaker labels",
        body: "Use auto detect or pick a source language. Turn on speaker separation when you want dialogue attributed to different speakers.",
      },
      {
        title: "Export for editors and notes",
        body: "Download TXT or DOCX for documents, SRT or VTT for captions workflows, and CSV when you need structured rows.",
      },
      {
        title: "Notes, chapters, Ask AI, mind map",
        body: "After transcription, generate summaries and note presets, chapter outlines, Ask AI answers grounded in your transcript, and a mind map you can export.",
      },
      {
        title: "Upload or record if you already have a file",
        body: "You can still upload MP4 or audio, or record in the browser, using the same workspace after the job finishes.",
      },
    ],
  },
  faq: {
    title: "Frequently asked questions",
    items: [
      {
        q: "What is a YouTube Transcript Generator?",
        a: "A YouTube Transcript Generator turns speech from a YouTube video into written text. Ours pastes a public link, transcribes the audio with AI, then opens a workspace with copy and export options.",
      },
      {
        q: "Which YouTube links work?",
        a: "Public watch URLs, Shorts, and youtu.be links when the media is reachable. Private, geo-blocked, or login-walled videos may fail — that is a platform constraint we cannot bypass.",
      },
      {
        q: "Do I need YouTube captions to already exist?",
        a: "No. We transcribe the spoken audio with AI. Existing captions on YouTube are not required, and we do not claim to import every caption language track YouTube stores.",
      },
      {
        q: "What can I export?",
        a: "TXT, DOCX, SRT, VTT, and CSV. PDF transcript export, JSON, and translation are not available in the current product.",
      },
      {
        q: "Do you support speaker labels?",
        a: "Yes. Enable speaker separation before you start so dialogue can be attributed to different speakers when the model can tell them apart.",
      },
      {
        q: "Is there a free plan?",
        a: "Yes. Sign-in is required so minutes and history stay on your account. Free accounts get monthly minutes with daily and per-file limits. See Pricing for current numbers.",
      },
    ],
  },
  cta: {
    title: "Generate a transcript from your next YouTube video",
    body: "Paste a public link into this YouTube Transcript Generator — then export the transcript in the format you need.",
    button: "Start converting",
  },
} as const;
