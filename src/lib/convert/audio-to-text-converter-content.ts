/**
 * SEO copy for /audio-to-text-converter.
 * Primary keyword: "Audio to Text Converter"
 * Claims limited to in-app capabilities.
 */

export const AUDIO_TO_TEXT_CONVERTER_HREF = "/audio-to-text-converter";

export const audioToTextConverterSeo = {
  meta: {
    title: "Audio to Text Converter — Transcribe MP3, WAV, M4A Online",
    description:
      "Use our Audio to Text Converter to turn MP3, WAV, M4A, and other recordings into searchable transcripts. Upload a file, paste a link, or record, then export TXT, DOCX, SRT, VTT, or CSV.",
  },
  hero: {
    h1: "Audio to Text Converter",
    subtitle:
      "This Audio to Text Converter turns speech in your recordings into clear, searchable text. Upload MP3, WAV, or M4A, paste a public media link, or capture audio in the browser — then copy, download, or keep working in your workspace.",
    chips: [
      { label: "File upload", color: "#3B82F6" },
      { label: "Link paste", color: "#60A5FA" },
      { label: "Speaker labels", color: "#14B8A6" },
      { label: "SRT & VTT export", color: "#38BDF8" },
      { label: "AI notes & chapters", color: "#8882F5" },
    ],
  },
  how: {
    title: "How this Audio to Text Converter works",
    lead: "Three steps take you from a recording or link to a readable transcript you can edit and export.",
    steps: [
      {
        n: "1",
        title: "Add your audio",
        body: "Upload common formats such as MP3, WAV, or M4A, or paste a public link from supported platforms. You can also record in the browser when you need a quick capture.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/audio-step-1-v2.webp",
      },
      {
        n: "2",
        title: "Run transcription",
        body: "AI extracts speech from your recording. Choose auto language detect or a specific source language, and optionally separate speakers for clearer dialogue.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/audio-step-2-v2.webp",
      },
      {
        n: "3",
        title: "Copy or export",
        body: "Review the transcript in your workspace, copy text, or download TXT, DOCX, SRT, VTT, or CSV. Generate AI notes, chapters, or a mind map when you need more structure.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/audio-step-3.webp",
      },
    ],
  },
  features: {
    title: "What you can do with this Audio to Text Converter",
    lead: "Built for real transcription workflows — not claims we cannot deliver.",
    items: [
      {
        title: "Upload audio and video files",
        body: "Drop MP3, WAV, M4A, and other common audio files, or video such as MP4, MOV, and WebM. Large local uploads are supported in the browser up to the client size limit.",
      },
      {
        title: "Paste public media links",
        body: "Paste links from platforms such as YouTube, TikTok, Instagram, Facebook, X, Apple Podcasts, and Bilibili when the media is publicly reachable.",
      },
      {
        title: "Record audio in the browser",
        body: "Capture a short recording with your microphone, then send it through the same transcription pipeline as an uploaded file.",
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
    title: "Frequently asked questions",
    items: [
      {
        q: "What is an Audio to Text Converter?",
        a: "An Audio to Text Converter turns speech from a recording or other media source into written text. Ours accepts file uploads, supported public links, and browser recordings, then opens a workspace with copy and export options.",
      },
      {
        q: "Which file types can I upload?",
        a: "Common audio formats such as MP3, WAV, and M4A, plus common video formats such as MP4, MOV, WebM, and MKV. If the file includes a usable soundtrack, transcription can process it.",
      },
      {
        q: "Can I paste a YouTube, podcast, or TikTok link?",
        a: "Yes, when the media is publicly reachable. Paste the link in the link tab. Private or blocked media may not download.",
      },
      {
        q: "What can I export?",
        a: "TXT, DOCX, SRT, VTT, and CSV. PDF transcript export and translation are not available in the current export set.",
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
    title: "Convert your next audio file to text",
    body: "Upload a file, paste a link, or record with this Audio to Text Converter — then export the transcript in the format you need.",
    button: "Start converting",
  },
} as const;
