/**
 * SEO copy for /video-transcript-generator.
 * Primary keyword: "video transcript generator" in title, H1, H2/H3, FAQ.
 * ~1200 words visible body; rotate transcript / speech / export wording.
 * Scope: video file upload + public link on this URL (same hero as workspace).
 */

export const VIDEO_TRANSCRIPT_GENERATOR_HREF = "/video-transcript-generator";

export const videoTranscriptGeneratorSeo = {
  meta: {
    title: "Video Transcript Generator — File & Link | Video Transcriber",
    description:
      "Video transcript generator turns MP4, MOV, or a public video URL into editable text. Export TXT, DOCX, SRT, or VTT from one workspace.",
  },
  hero: {
    h1: "Video Transcript Generator for Files and Public Links",
    subtitle:
      "Upload a file or paste a public link—speech becomes editable text you can copy or export. Player captions are not used; only the audio track is transcribed.",
    chips: [
      { label: "MP4 & MOV upload", color: "#3B82F6" },
      { label: "Paste public link", color: "#60A5FA" },
      { label: "Speaker labels", color: "#14B8A6" },
      { label: "SRT & VTT export", color: "#38BDF8" },
      { label: "Ask AI on speech", color: "#8882F5" },
    ],
  },
  how: {
    title: "How video transcript generator works",
    lead: "Video transcript generator on this page is three steps: add video, transcribe speech, use the text. Upload a file or paste a reachable public link—same workspace either way. Private meetings and login walls may fail before transcription starts. Long files queue like any other job; you can leave the tab and return from history when processing finishes.",
    steps: [
      {
        n: "1",
        title: "Add video by file or link",
        body: "Upload MP4, MOV, WebM, or MKV—or paste a public YouTube, TikTok, Instagram, or Facebook URL. The track needs audible speech. Silent B-roll alone will not produce dialogue. If a link fails, confirm it plays in a private window without signing in, then retry or export the file and upload instead.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/summarizer-step-1.webp",
      },
      {
        n: "2",
        title: "Transcribe spoken audio",
        body: "AI returns timed lines you can skim in the built-in player. Pick auto language detect, set a source language, or enable speaker labels when multiple people talk. This is speech-to-text, not on-screen OCR—slides and lower-thirds are not extracted as text.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/summarizer-step-2.webp",
      },
      {
        n: "3",
        title: "Copy, export, or add structure",
        body: "Copy from the workspace or download TXT, DOCX, SRT, VTT, or CSV. Add AI notes or chapters after the verbatim text exists if you need more structure.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/youtube-step-3.webp",
      },
    ],
  },
  features: {
    title: "Video transcript generator exports and workspace tools",
    lead: "Video transcript generator keeps the full spoken track in one workspace so you can edit, search, and ship files editors expect. The focus is verbatim speech—not a highlight reel or auto-cut montage. If you only ever paste one social network, that platform’s dedicated landing page may be faster; this URL is for mixed uploads and public links in the same job list.",
    rows: [
      {
        title: "One workspace for upload and links",
        body: "Local interviews and public talks as URLs share speaker labels, language detection, and the same player. Signed-in users reopen finished jobs from history instead of re-uploading large MP4s. Paste a reachable link when the file never landed on your disk; drop a file when the host blocks downloads. YouTube-heavy teams can still start from the YouTube transcript page—the engine matches, but this route keeps file and link tabs together for producers who switch sources every day.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/summarizer-feature-1-upload.webp",
        alt: "Upload or link a video to generate a transcript",
        imageRight: true,
      },
      {
        title: "Exports editors actually use",
        body: "Download TXT for quick paste into docs, DOCX for editorial markup, SRT and VTT for caption pipelines, or CSV when spreadsheets need timed rows. Copy a single paragraph from the editor without exporting the whole job. PDF and JSON are not offered today—plan on text-first formats. Subtitle exports reflect speech timing from AI, so you may nudge cues in Premiere, DaVinci, or your caption tool before publish.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/youtube-feature-3-export.webp",
        alt: "Export a generated video transcript",
        imageRight: false,
      },
      {
        title: "After the verbatim file exists",
        body: "Summaries, chapters, and Ask AI are optional layers on top of the transcript you already generated. Need a three-bullet recap first? Run AI Video Summarizer after speech is on the page. Need captions pulled from YouTube’s player instead of re-transcribing audio? Use the subtitle downloader. Video transcript generator is the right choice when every word in order matters more than a short write-up.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/youtube-feature-2-summary.webp",
        alt: "Notes and chapters from a video transcript",
        imageRight: true,
      },
    ],
  },
  usecases: {
    title: "When video transcript generator beats a recap",
    lead: "Reach for video transcript generator when quotes, compliance, captions, or in-document search matter more than a skim. Summaries save time after the verbatim lines exist; they do not replace testimony, pull quotes, or legal wording. Post teams often upload camera rushes here, export SRT, and hand timed text to social editors without rewatching hour-long cuts.",
    items: [
      {
        title: "Meeting exports",
        body: "Upload the MP4 your calendar tool emailed after the call and search for decisions, numbers, and names without dragging a timeline. There is no bot that joins live Zoom or Teams—only files you already own.",
      },
      {
        title: "Course and webinar replays",
        body: "Paste a public lecture URL or upload a module recording students can download. Members-only LMS links that require login usually fail on the link tab; export the file and use upload instead.",
      },
      {
        title: "Podcast video feeds",
        body: "Video podcast feeds carry the same spoken episode as audio-only shows. One upload yields searchable text for show notes, chapter markers, and pull quotes you still fact-check against the waveform.",
      },
      {
        title: "Screen recordings",
        body: "MOV or WebM walkthroughs transcribe narration and spoken steps. Silent cursor moves, on-screen buttons, and UI text are not read—that is not OCR. Pair the transcript with the recording when visuals carry the tutorial.",
      },
      {
        title: "Interviews for articles",
        body: "Speaker labels separate host and guest when mics differ. Export DOCX for track changes, highlight exact quotes, and leave the video player for tone checks only when needed.",
      },
      {
        title: "Caption drafts for social clips",
        body: "Export SRT from speech timing, trim lines in your caption editor, and burn or upload to each platform’s spec. Short-form clips still benefit from verbatim speech when auto-captions mishear brand names.",
      },
    ],
  },
  faq: {
    title: "Video transcript generator FAQ",
    items: [
      {
        q: "What does video transcript generator output?",
        a: "Video transcript generator returns editable text from spoken audio plus exports such as TXT, DOCX, SRT, VTT, and CSV. It does not render a new video, cut highlights automatically, or join a live meeting as a bot.",
      },
      {
        q: "Can I use both upload and link tabs?",
        a: "Yes. Upload when the file is on your machine; paste a public URL when the video opens in a logged-out browser. Private or paywalled pages may error before transcription starts.",
      },
      {
        q: "Does it read existing YouTube captions?",
        a: "No. The pipeline transcribes the audio track with AI. Wording and timing can differ from captions the creator uploaded or YouTube auto-generated in the player.",
      },
      {
        q: "Which formats can I upload?",
        a: "Common containers such as MP4, MOV, WebM, and MKV with an audible speech track. Pure audio files fit better on Audio to Text; this landing page is scoped to video upload and public video links.",
      },
      {
        q: "Are speaker labels and languages supported?",
        a: "Yes. Enable speaker diarization when multiple voices matter, pick a source language, or rely on auto detect when the clip mixes languages rarely. Accuracy still depends on mic quality and background noise.",
      },
      {
        q: "Is video transcript generator free to try?",
        a: "Yes—video transcript generator is free to try within your plan. Minutes, daily caps, and maximum file size live on Pricing—this FAQ does not duplicate those numbers because they change with billing tiers.",
      },
      {
        q: "How is this different from AI Video Summarizer?",
        a: "Video transcript generator prioritizes every spoken line in order. AI Video Summarizer writes recap-style notes, chapters, and Ask AI answers after speech exists. Many users transcribe here first, then summarize in the other tool.",
      },
      {
        q: "Can I edit the text before export?",
        a: "Yes. Fix names, split paragraphs, and copy sections in the workspace, then download or export. Exports reflect your last saved edits on that job, so run a quick read-through before you send SRT to a client.",
      },
    ],
  },
  cta: {
    title: "Run video transcript generator on your next clip",
    body: "Upload or paste a link, then export editable text. Free use still follows the limits on Pricing.",
    button: "Start transcribing",
  },
} as const;
