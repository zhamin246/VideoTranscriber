/**
 * SEO copy for /video-to-text.
 * Primary keyword: "Video to Text" — target ~2.5% density.
 * Scope: local video files (MP4 and similar). Links and audio belong on other URLs.
 */

export const VIDEO_TO_TEXT_CONVERTER_HREF = "/video-to-text";

export const videoToTextConverterSeo = {
  meta: {
    title: "Video to Text — Transcribe MP4, MOV, WebM Online",
    description:
      "Use Video to Text to transcribe MP4, MOV, WebM, or MKV. Export TXT, DOCX, SRT, VTT, or CSV. For YouTube links or audio-only files, use the dedicated tools.",
  },
  hero: {
    h1: "Video to Text",
    subtitle:
      "Video to Text turns a file on your computer into searchable text. Drop an MP4, MOV, WebM, or MKV — then copy, download, or keep working in your workspace.",
    chips: [
      { label: "MP4 upload", color: "#3B82F6" },
      { label: "MOV & WebM", color: "#60A5FA" },
      { label: "Speaker labels", color: "#14B8A6" },
      { label: "SRT & VTT export", color: "#38BDF8" },
      { label: "AI notes & chapters", color: "#8882F5" },
    ],
  },
  how: {
    title: "How Video to Text works",
    lead: "Three steps take you from a local video file to a readable transcript. Video to Text is built for speech inside video containers you can edit and export.",
    steps: [
      {
        n: "1",
        title: "Upload your video file",
        body: "Drop a common video container such as MP4, MOV, WebM, or MKV. The tool reads the soundtrack from the file. It does not need you to extract audio first.",
        src: "/howtouse/step-1-upload.webp",
      },
      {
        n: "2",
        title: "Run transcription",
        body: "AI extracts speech from the uploaded video. Choose auto language detect or a specific source language, and optionally separate speakers for clearer dialogue.",
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
    title: "What you can do with Video to Text",
    lead: "Built for video files you already have — screen recordings, camera clips, and exported meetings.",
    items: [
      {
        title: "Upload MP4 and other video files",
        body: "Drop MP4, MOV, WebM, and MKV. Large local uploads are supported in the browser up to the client size limit. Audio-only files belong on Audio to Text.",
      },
      {
        title: "Keep the soundtrack in the container",
        body: "You do not need a separate demux step. If the video includes a usable audio track, transcription can process it.",
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
        body: "After transcription finishes, generate summaries and note presets, chapter outlines, Ask AI answers grounded in your transcript, and a mind map you can export.",
      },
      {
        title: "Need a link or an audio file instead?",
        body: "Paste a YouTube URL on the YouTube Transcript Generator. Upload MP3, WAV, or M4A on Audio to Text.",
      },
    ],
  },
  faq: {
    title: "Frequently asked questions",
    items: [
      {
        q: "What is Video to Text?",
        a: "Video to Text turns speech from a video file into written text. This page is for uploads such as MP4, MOV, WebM, and MKV. After transcription you can copy or export the result.",
      },
      {
        q: "Which file types can I upload?",
        a: "Common video formats such as MP4, MOV, WebM, and MKV. If the file includes a usable audio track, the tool can process it.",
      },
      {
        q: "Can I paste a YouTube or TikTok link here?",
        a: "Use the YouTube Transcript Generator for a public YouTube URL. Other public links can start from the Video Transcriber homepage link tab.",
      },
      {
        q: "What if I only have an MP3 or WAV?",
        a: "Use Audio to Text. That page is for recordings and audio files, not video containers.",
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
    { label: "Audio to Text", href: "/audio-to-text-converter" },
    { label: "YouTube Transcript Generator", href: "/youtube-transcript-generator" },
    { label: "AI Video Summarizer", href: "/ai-video-summarizer" },
  ],
  cta: {
    title: "Convert your next video file to text",
    body: "Start Video to Text with an MP4, MOV, WebM, or MKV upload — then export the transcript in the format you need.",
    button: "Start converting",
  },
} as const;
