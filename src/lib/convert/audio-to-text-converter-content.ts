/**
 * SEO copy for /audio-to-text-converter.
 * Primary keyword: "Audio to Text Converter"
 * Scope: audio files and browser recordings. Video files and YouTube links belong on other URLs.
 */

export const AUDIO_TO_TEXT_CONVERTER_HREF = "/audio-to-text-converter";

export const audioToTextConverterSeo = {
  meta: {
    title: "Audio to Text Converter — Transcribe MP3, WAV, M4A",
    description:
      "Use this Audio to Text Converter to transcribe MP3, WAV, or M4A, or record in the browser. Export TXT, DOCX, SRT, VTT, or CSV. For video files or YouTube links, use the dedicated converters.",
  },
  hero: {
    h1: "Audio to Text Converter",
    subtitle:
      "This Audio to Text Converter turns a recording into searchable text. Upload MP3, WAV, or M4A, or capture audio in the browser — then copy, download, or keep working in your workspace.",
    chips: [
      { label: "MP3 upload", color: "#3B82F6" },
      { label: "WAV & M4A", color: "#60A5FA" },
      { label: "Record in browser", color: "#14B8A6" },
      { label: "Speaker labels", color: "#38BDF8" },
      { label: "SRT & VTT export", color: "#8882F5" },
    ],
  },
  how: {
    title: "How this Audio to Text Converter works",
    lead: "Three steps take you from a recording to a readable transcript you can edit and export.",
    steps: [
      {
        n: "1",
        title: "Add your audio",
        body: "Upload MP3, WAV, or M4A, or record with your microphone on this page. This converter is for speech in audio files — not for MP4 video containers.",
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
    lead: "Built for recordings you already have — voice memos, calls, interviews, and podcasts.",
    items: [
      {
        title: "Upload MP3, WAV, and M4A",
        body: "Drop common audio files. Large local uploads are supported in the browser up to the client size limit. Video files such as MP4 belong on the Video to Text Converter.",
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
      {
        title: "Need a video file or a YouTube link instead?",
        body: "Upload MP4, MOV, WebM, or MKV on the Video to Text Converter. Paste a public YouTube URL on the YouTube Transcript Generator.",
      },
    ],
  },
  faq: {
    title: "Audio to Text Converter FAQ",
    items: [
      {
        q: "What is an Audio to Text Converter?",
        a: "An Audio to Text Converter turns speech from a recording into written text. This page is for MP3, WAV, M4A, and browser recordings.",
      },
      {
        q: "Which file types can I upload?",
        a: "Common audio formats such as MP3, WAV, and M4A. For MP4 and other video files, use the Video to Text Converter.",
      },
      {
        q: "Can I paste a YouTube or podcast link here?",
        a: "Use the YouTube Transcript Generator for a public YouTube URL. Other public links can start from the Video Transcriber homepage link tab.",
      },
      {
        q: "Can I record in the browser?",
        a: "Yes. Use the record tab on this page, then transcribe the clip the same way as an uploaded file.",
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
  related: [
    { label: "Video to Text Converter", href: "/video-to-text-converter" },
    { label: "YouTube Transcript Generator", href: "/youtube-transcript-generator" },
    { label: "AI Video Summarizer", href: "/ai-video-summarizer" },
  ],
  cta: {
    title: "Convert your next recording to text",
    body: "Upload MP3, WAV, or M4A, or record in the browser — then export the transcript in the format you need.",
    button: "Start converting",
  },
} as const;
