/**
 * SEO copy for /audio-to-text-converter.
 * Primary keyword: "audio to text converter"
 * Scope: audio file upload (MP3, WAV, M4A). Video files and YouTube links belong on other URLs.
 */

export const AUDIO_TO_TEXT_CONVERTER_HREF = "/audio-to-text-converter";

export const audioToTextConverterSeo = {
  meta: {
    title: "Audio to Text Converter to Transcribe | Video Transcriber",
    description:
      "Use this audio to text converter to upload MP3, WAV, or M4A and get text. Export TXT, DOCX, SRT, or VTT. Video files go to a different page.",
  },
  hero: {
    h1: "Turn Audio Files into Text with an Audio to Text Converter",
    subtitle:
      "This audio to text converter turns an uploaded MP3, WAV, or M4A file into text you can copy and export. Drop the file on this page, then keep working in your workspace.",
    chips: [
      { label: "MP3 upload", color: "#3B82F6" },
      { label: "WAV & M4A", color: "#60A5FA" },
      { label: "Local audio files", color: "#14B8A6" },
      { label: "Speaker labels", color: "#38BDF8" },
      { label: "SRT & VTT export", color: "#8882F5" },
    ],
  },
  how: {
    title: "How this audio to text converter works",
    lead: "An audio to text converter turns spoken words in a file into text you can search, copy, and save. On this page that means an MP3, WAV, or M4A upload — not a video file and not a pasted URL. Work in the browser: upload the audio file, choose language and speaker options if you need them, run transcription, then stay in the workspace.",
    steps: [
      {
        n: "1",
        title: "Upload your audio file",
        body: "Upload MP3, WAV, or M4A. This audio to text converter is for speech in audio files — not for MP4 video containers.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/audio-step-1-v2.webp",
      },
      {
        n: "2",
        title: "Run transcription",
        body: "Choose auto language detect or a specific source language, and optionally separate speakers. Then start the job on this audio to text converter.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/audio-step-2-v2.webp",
      },
      {
        n: "3",
        title: "Review, copy, or export",
        body: "Open the transcript in your workspace. Copy text, or download TXT, DOCX, SRT, VTT, or CSV. Generate notes, chapters, Ask AI, or a mind map when you need more structure.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/audio-step-3.webp",
      },
    ],
  },
  features: {
    title: "Transcribe audio to text from MP3, WAV, or M4A",
    lead: "Transcribe audio to text on this URL when you already have an audio file. Meetings, interviews, podcasts, voice memos, and course audio belong here if they are MP3, WAV, or M4A. A camera file or a YouTube link does not.",
    rows: [
      {
        title: "Convert MP3, WAV, and M4A to text",
        body: "Drop the audio file on this audio to text converter. Add speaker labels and language selection when you need them. For MP4 video, start from the homepage upload. For a YouTube URL, use the YouTube Transcript Generator.",
        href: AUDIO_TO_TEXT_CONVERTER_HREF,
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/audio-feature-1-convert.webp",
        alt: "Upload an audio file to transcribe",
        imageRight: true,
      },
      {
        title: "Generate summary and key points",
        body: "After this audio to text converter finishes, generate AI notes and key points from the same file. Use chapters, Ask AI, and mind map when you want more structure without replaying the full audio.",
        href: AUDIO_TO_TEXT_CONVERTER_HREF,
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/audio-feature-2-summary.webp",
        alt: "Generate an AI summary from audio",
        imageRight: false,
      },
      {
        title: "Export your transcript",
        body: "Export as TXT, DOCX, SRT, VTT, or CSV. Copy the text for notes and drafts, or download subtitle files for your editor. PDF transcript export and translation are not in this export set.",
        href: AUDIO_TO_TEXT_CONVERTER_HREF,
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/audio-feature-3-export.webp",
        alt: "Export a transcript",
        imageRight: true,
      },
    ],
  },
  usecases: {
    title: "Transcribe audio to text free: what you get on the free plan",
    lead: "Transcribe audio to text free on a free account means monthly minutes, plus daily and per-file limits. This audio to text converter is not unlimited. See Pricing for current numbers — this page does not invent a minute count.",
    items: [
      {
        title: "Monthly minutes",
        body: "A free account includes a monthly minute pool you can spend on this audio to text converter. When the pool is used up, wait for the reset or use a paid minute pool. See Pricing for the live figure.",
        icon: "AudioLines",
      },
      {
        title: "Daily and per-file limits",
        body: "Free use also has daily caps and per-file limits. If a job will not start, check those limits before assuming the audio to text converter failed.",
        icon: "ShieldCheck",
      },
      {
        title: "Same audio types",
        body: "You can transcribe audio to text free with the same MP3, WAV, and M4A uploads as a paid run. Video containers belong on the homepage upload, not this audio page.",
        icon: "FileUp",
      },
      {
        title: "Same exports",
        body: "Free versus paid changes how many minutes you can use, not whether TXT, DOCX, SRT, VTT, or CSV exist. Speaker labels are the same option on either plan.",
        icon: "Subtitles",
      },
      {
        title: "Browser upload size",
        body: "Large local uploads are supported in the browser up to the client size limit. This audio to text converter does not batch a folder of files.",
        icon: "Mic",
      },
      {
        title: "Check Pricing for numbers",
        body: "Minute pools and paid upgrades live on Pricing so this page does not go stale. Then come back here to transcribe audio to text free within the current free-plan limits.",
        icon: "GraduationCap",
      },
    ],
  },
  faq: {
    title: "Frequently asked questions",
    items: [
      {
        q: "What is Audio to Text?",
        a: "It is this audio to text converter: you upload an audio file and speech becomes written text. This page is for MP3, WAV, and M4A uploads. After transcription you can copy or export the result in the workspace.",
      },
      {
        q: "Which file types can I upload?",
        a: "Common audio formats such as MP3, WAV, and M4A. For MP4 and other video files, start from the homepage upload. This audio to text converter does not treat video containers as audio uploads.",
      },
      {
        q: "Can I paste a YouTube or podcast link here?",
        a: "No. Use the YouTube Transcript Generator for a public YouTube URL. Other public links can start from the Video Transcriber homepage link tab. This page is audio file upload only.",
      },
      {
        q: "What can I export?",
        a: "TXT, DOCX, SRT, VTT, and CSV. PDF transcript export and translation are not available in the current export set. Copy from the workspace if you only need the text on the clipboard.",
      },
      {
        q: "Do you support speaker labels?",
        a: "Yes. Enable speaker separation before you start so dialogue can be attributed to different speakers when the model can tell them apart. You do not assign names in advance on this audio to text converter.",
      },
      {
        q: "Is there a free plan?",
        a: "Yes. Free accounts get monthly minutes with daily and per-file limits. See Pricing for current numbers and paid minute pools. You can transcribe audio to text free within those limits on this page.",
      },
    ],
  },
  cta: {
    title: "Run this audio to text converter on your next file",
    body: "Start the audio to text converter with an MP3, WAV, or M4A upload — then export the transcript in the format you need.",
    button: "Start converting",
  },
} as const;
