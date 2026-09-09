/**
 * SEO copy for /video-to-text-converter.
 * Primary keyword: "Video to Text Converter"
 * Claims are limited to product capabilities that exist in-app.
 */

export const VIDEO_TO_TEXT_CONVERTER_HREF = "/video-to-text-converter";

export const videoToTextConverterSeo = {
  meta: {
    title: "Video to Text Converter — Transcribe Video Files Online",
    description:
      "Use our Video to Text Converter to turn MP4 and other video files into searchable transcripts. Upload a file, paste a link, or record audio, then export TXT, DOCX, SRT, VTT, or CSV.",
  },
  hero: {
    h1: "Video to Text Converter",
    subtitle:
      "This Video to Text Converter turns spoken words in your videos into clear, searchable text. Upload a recording, paste a public media link, or capture audio in the browser — then copy, download, or keep working in your workspace.",
    chips: [
      { label: "File upload", color: "#3B82F6" },
      { label: "Link paste", color: "#60A5FA" },
      { label: "Speaker labels", color: "#14B8A6" },
      { label: "SRT & VTT export", color: "#38BDF8" },
      { label: "AI notes & chapters", color: "#8882F5" },
    ],
  },
  how: {
    title: "How this Video to Text Converter works",
    lead: "Three steps take you from a video file or link to a readable transcript you can edit and export.",
    steps: [
      {
        n: "1",
        title: "Add your video",
        body: "Upload common formats such as MP4, MOV, WebM, or MKV, or paste a public link from supported platforms. You can also record audio when you need a quick capture.",
        src: "/howtouse/step-1-upload.webp",
      },
      {
        n: "2",
        title: "Run transcription",
        body: "Our Video to Text Converter extracts speech with AI. Choose auto language detect or a specific source language, and optionally separate speakers for clearer dialogue.",
        src: "/howtouse/step-2-transcribe.webp",
      },
      {
        n: "3",
        title: "Copy or export",
        body: "Review the transcript in your workspace, copy text, or download TXT, DOCX, SRT, VTT, or CSV. Generate AI notes, chapters, or a mind map when you need more structure.",
        src: "/howtouse/step-3-export.webp",
      },
    ],
  },
  features: {
    title: "What you can do with this Video to Text Converter",
    lead: "Built for real transcription workflows — not claims we cannot deliver.",
    items: [
      {
        title: "Upload video and audio files",
        body: "Drop MP4, MOV, WebM, MKV, and other common video files, or audio such as MP3, WAV, and M4A. Large local uploads are supported in the browser up to the client size limit.",
      },
      {
        title: "Paste public media links",
        body: "Paste links from platforms such as YouTube, TikTok, Instagram, Facebook, X, Apple Podcasts, and Bilibili when the media is publicly reachable.",
      },
      {
        title: "Record audio in the browser",
        body: "Capture a short recording with your microphone, then send it through the same Video to Text Converter pipeline as an uploaded file.",
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
    ],
  },
  faq: {
    title: "Video to Text Converter FAQ",
    items: [
      {
        q: "What is a Video to Text Converter?",
        a: "A Video to Text Converter turns speech from a video or audio source into written text. Ours accepts file uploads, supported public links, and browser recordings, then opens a workspace with copy and export options.",
      },
      {
        q: "Which file types can I upload?",
        a: "Common video formats such as MP4, MOV, WebM, and MKV, plus common audio formats such as MP3, WAV, and M4A. If the file includes a usable audio track, the Video to Text Converter can process it.",
      },
      {
        q: "Can I paste a YouTube or TikTok link?",
        a: "Yes, when the media is publicly reachable. Paste the link in the link tab. Private or blocked media may not download.",
      },
      {
        q: "What can I export?",
        a: "TXT, DOCX, SRT, VTT, and CSV. PDF transcript export and translation are not available in the current Video to Text Converter.",
      },
      {
        q: "Do you support speaker labels?",
        a: "Yes. Enable speaker separation before you start so dialogue can be attributed to different speakers when the model can tell them apart.",
      },
      {
        q: "Is there a free plan?",
        a: "Yes. Free accounts get monthly minutes with daily and per-file limits. See Pricing for current numbers and paid minute pools.",
      },
    ],
  },
  cta: {
    title: "Convert your next video to text",
    body: "Upload a file, paste a link, or record audio with this Video to Text Converter — then export the transcript in the format you need.",
    button: "Start converting",
  },
} as const;
