/**
 * SEO copy for /video-to-text.
 * Primary keyword: video to text converter (~3% phrase density in body).
 * Scope: local video files (MP4, MOV, WebM, MKV). Public links → homepage or platform tools.
 */

export const VIDEO_TO_TEXT_CONVERTER_HREF = "/video-to-text";

export const videoToTextConverterSeo = {
  meta: {
    title: "Video to Text Converter – Transcribe MP4, MOV, WebM Online",
    description:
      "Use a video to text converter to turn MP4, MOV, WebM, or MKV speech into editable text. Export TXT, DOCX, SRT, VTT, or CSV from one workspace.",
  },
  hero: {
    h1: "Video to Text Converter",
    subtitle:
      "A video to text converter turns speech in your file into searchable text.\nUpload MP4, MOV, WebM, or MKV—then copy, export, or add notes in the workspace.",
    chips: [
      { label: "MP4 & MOV Upload", color: "#3B82F6" },
      { label: "WebM & MKV", color: "#60A5FA" },
      { label: "Speaker Labels", color: "#14B8A6" },
      { label: "Export TXT & SRT", color: "#38BDF8" },
    ],
  },
  how: {
    title: "How a Video to Text Converter Works",
    lead: "Three steps take a local video from upload to transcript. This video to text converter reads the audio track inside your file—no separate demux step required.",
    steps: [
      {
        n: "1",
        title: "Upload Your Video File",
        body: "Drop MP4, MOV, WebM, or MKV from your computer. The video to text converter uses the soundtrack in the container. Silent clips may return little or no text.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/summarizer-step-1.webp",
      },
      {
        n: "2",
        title: "Transcribe with AI",
        body: "Choose auto language detect or a source language, and optionally separate speakers. The video to text converter processes speech, not on-screen text or OCR.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/summarizer-step-2.webp",
      },
      {
        n: "3",
        title: "Copy or Export Text",
        body: "Review timed lines in the workspace, then download TXT, DOCX, SRT, VTT, or CSV. Generate AI notes or chapters after the transcript is ready when those tools are available.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/summarizer-step-3.webp",
      },
    ],
  },
  features: {
    title: "What You Get from a Video to Text Converter",
    lead: "Built for files you already saved—screen recordings, camera exports, and meeting downloads—not for scraping player captions.",
    rows: [
      {
        title: "Common Video Formats in One Upload",
        body: "A video to text converter accepts MP4, MOV, WebM, and MKV when the file includes usable audio. You do not need to extract audio first. For MP3 or WAV only, use Audio to Text.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/summarizer-feature-1-upload.webp",
        alt: "Upload a video file to a video to text converter",
        imageRight: true,
      },
      {
        title: "Searchable Transcripts with Timestamps",
        body: "Speech becomes lines you can skim, search, and edit. Speaker labels help when multiple voices are present. Verify names and numbers against the recording before publishing.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/audio-feature-2-summary.webp",
        alt: "Searchable transcript from a video to text converter",
        imageRight: false,
      },
      {
        title: "Exports for Docs and Captions",
        body: "Download TXT or DOCX for documents, SRT or VTT for subtitle workflows, and CSV when you need rows. A video to text converter keeps export options in the workspace menu.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/summarizer-feature-3-export.webp",
        alt: "Export files from a video to text converter",
        imageRight: true,
      },
    ],
  },
  usecases: {
    title: "Who Uses a Video to Text Converter?",
    lead: "When the file is already on disk, converting speech to text beats replaying long recordings.",
    items: [
      {
        title: "Meetings and Screen Recordings",
        body: "Turn exported Zoom or Teams MP4s into text you can search. A video to text converter helps you find decisions and follow-ups without scrubbing the timeline.",
      },
      {
        title: "Courses and Lectures",
        body: "Convert recorded lessons into study notes. Pair the transcript with AI summaries when you need shorter recaps after the full text exists.",
      },
      {
        title: "Interviews and Podcast Video",
        body: "Pull quotes from video interviews saved as files. Jump by timestamp instead of listening end to end.",
      },
      {
        title: "Content and Social Clips",
        body: "Draft captions or blog outlines from camera or screen captures. Edit the transcript before you publish.",
      },
      {
        title: "Research and Documentation",
        body: "Archive spoken explanations as searchable text. Export DOCX or TXT for reports and wikis.",
      },
      {
        title: "Need a Public Link Instead?",
        body: "Paste a URL on the homepage or a platform tool such as YouTube Transcript Generator when you do not have a local file.",
      },
    ],
  },
  testimonials: {
    title: "What Our Users Say",
    lead: "Upload a file, review the transcript, and export when the wording looks right.",
  },
  faq: {
    title: "Video to Text Converter FAQ",
    items: [
      {
        q: "What is a video to text converter?",
        a: "A video to text converter turns spoken audio inside a video file into written text with timestamps. This page focuses on uploads such as MP4, MOV, WebM, and MKV.",
      },
      {
        q: "Which formats work with this video to text converter?",
        a: "Common containers include MP4, MOV, WebM, and MKV when they include a usable audio track. Extremely large files may hit plan or browser limits.",
      },
      {
        q: "Can I paste a YouTube link on this page?",
        a: "Use the homepage link tab or YouTube Transcript Generator for public URLs. This video to text converter is optimized for files on your device.",
      },
      {
        q: "Does the video to text converter read subtitles burned into the video?",
        a: "No. It transcribes speech from the audio track, not OCR of on-screen captions or slides.",
      },
      {
        q: "What can I export?",
        a: "TXT, DOCX, SRT, VTT, and CSV when available in your workspace. Open the export dialog to see which formats apply to your job.",
      },
      {
        q: "Are speaker labels supported?",
        a: "Yes, when you enable speaker separation before transcription and the audio allows the model to distinguish voices.",
      },
      {
        q: "Is there a free plan?",
        a: "Usage limits depend on your plan. See Pricing for current minutes, file caps, and features—this FAQ does not list changing quota numbers.",
      },
      {
        q: "How is this different from AI Video Summarizer?",
        a: "A video to text converter prioritizes the full verbatim transcript. Summaries and note presets come after speech is written—use AI Video Summarizer when a short recap is the main goal.",
      },
    ],
  },
  cta: {
    title: "Convert Your Next Video File to Text",
    body: "Run a video to text converter on MP4, MOV, WebM, or MKV—then copy or export the transcript you need.",
    button: "Start Converting",
  },
} as const;
