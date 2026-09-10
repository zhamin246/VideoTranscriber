/**
 * SEO copy for /youtube-subtitle-downloader.
 * Primary keyword: "YouTube Subtitle Downloader"
 * Claims limited to in-app capabilities. No long-form article block.
 * Honest boundary: AI speech-to-text → SRT/VTT export, not YouTube caption-track scraping.
 */

export const YOUTUBE_SUBTITLE_DOWNLOADER_HREF = "/youtube-subtitle-downloader";

export const youtubeSubtitleDownloaderSeo = {
  meta: {
    title: "YouTube Subtitle Downloader — SRT & VTT from a Link",
    description:
      "Use our YouTube Subtitle Downloader to paste a public YouTube link, transcribe speech with AI, and export SRT or VTT. Also download TXT, DOCX, or CSV.",
  },
  hero: {
    h1: "YouTube Subtitle Downloader",
    subtitle:
      "This YouTube Subtitle Downloader turns speech from a public YouTube video into SRT or VTT you can use in an editor. Paste a watch, Shorts, or youtu.be link. We transcribe the audio with AI — captions do not need to exist on the watch page. You can also export TXT, DOCX, or CSV from the same job.",
    chips: [
      { label: "Link paste", color: "#60A5FA" },
      { label: "SRT & VTT export", color: "#38BDF8" },
      { label: "AI transcription", color: "#8882F5" },
      { label: "Speaker labels", color: "#14B8A6" },
      { label: "TXT & DOCX", color: "#3B82F6" },
    ],
  },
  how: {
    title: "How this YouTube Subtitle Downloader works",
    lead: "Three steps take you from a public YouTube URL to SRT or VTT. Spoken audio is transcribed first, so you still get a file when there is no caption panel to copy. Review the cues in the workspace before you import them.",
    steps: [
      {
        n: "1",
        title: "Paste your YouTube link",
        body: "Copy a public watch, Shorts, or youtu.be URL into the link tab. Private, age-gated, or login-walled videos may not fetch. Playlists are not one job.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/subtitle-step-1.webp",
      },
      {
        n: "2",
        title: "Transcribe the spoken audio",
        body: "This YouTube Subtitle Downloader fetches reachable audio and transcribes speech with AI. It does not scrape every caption language track YouTube stores. Pick auto detect or a source language, and optionally separate speakers.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/subtitle-step-2.webp",
      },
      {
        n: "3",
        title: "Download SRT or VTT",
        body: "Review timed text in the workspace, then export SRT or VTT. TXT, DOCX, and CSV are also available. PDF, translation, and burning captions into a video are not in the current product.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/subtitle-step-3.webp",
      },
    ],
  },
  features: {
    title: "What you can do with this YouTube Subtitle Downloader",
    lead: "Paste a public link, transcribe speech with AI, then export SRT or VTT — or TXT, DOCX, and CSV from the same workspace.",
    rows: [
      {
        title: "Paste a public YouTube link",
        body: "This YouTube Subtitle Downloader accepts public watch URLs, Shorts, and youtu.be links when the video is reachable. No extension or desktop app. Add speaker labels and language before you start. Private or blocked media may fail.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/subtitle-feature-1-link.webp",
        alt: "Paste a YouTube link to download subtitles",
        imageRight: true,
      },
      {
        title: "AI captions even without a YouTube track",
        body: "Many tools only copy a track that already exists. Ours transcribes spoken audio, so a caption file is possible when the watch page has nothing to copy. We do not list every auto-translated language YouTube may show.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/subtitle-feature-2-transcribe.webp",
        alt: "Transcribe YouTube audio into timed subtitles",
        imageRight: false,
      },
      {
        title: "Export SRT, VTT, and documents",
        body: "Download SRT for editors and players, VTT for web players, plus TXT, DOCX, or CSV. We do not export PDF or JSON, and we do not download the video file.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/subtitle-feature-3-export.webp",
        alt: "Export SRT or VTT subtitle files",
        imageRight: true,
      },
    ],
  },
  usecases: {
    title: "Get SRT and VTT from public YouTube videos",
    lead: "Editors, students, and researchers use this YouTube Subtitle Downloader for a subtitle file or a searchable transcript from a public talk, tutorial, interview, or lecture.",
    items: [
      {
        title: "Video editors",
        body: "Export SRT beside your timeline for Premiere, Resolve, or CapCut. VTT is for HTML5 players. We do not download the YouTube video file for you.",
      },
      {
        title: "Lectures & courses",
        body: "Paste a public lecture and download SRT or VTT for study, plus TXT or DOCX for a readable script. Login-walled course sites will not fetch.",
      },
      {
        title: "Tutorials",
        body: "Turn how-to videos into caption files you can search. Jump with timestamps in the workspace instead of scrubbing the player.",
      },
      {
        title: "Interviews & podcasts",
        body: "Optional speaker labels help when two voices talk. Export SRT for a cut, or DOCX when you are quoting for an article.",
      },
      {
        title: "Accessibility captions",
        body: "If you have the right to caption the video, export SRT or VTT and review names and jargon before you publish.",
      },
      {
        title: "Research notes",
        body: "Use TXT or DOCX for the words, SRT when you still need timings, CSV when you want cue rows.",
      },
    ],
  },
  faq: {
    title: "Frequently asked questions",
    items: [
      {
        q: "What is a YouTube Subtitle Downloader?",
        a: "A YouTube Subtitle Downloader gives you a subtitle file from a YouTube video. Ours pastes a public link, transcribes audio with AI, then exports SRT or VTT — not every caption track YouTube stores.",
      },
      {
        q: "Does this copy YouTube’s existing captions?",
        a: "No. We transcribe the audio. Existing captions on the watch page are not required. We do not list uploader tracks the way yt-dlp does.",
      },
      {
        q: "Which YouTube links work?",
        a: "Public watch URLs, Shorts, and youtu.be links when the media is reachable. Private, age-gated, or geo-blocked videos may fail. Paste one URL per job — playlists are not batched.",
      },
      {
        q: "What formats can I download?",
        a: "SRT and VTT for subtitle files, plus TXT, DOCX, and CSV. ASS, LRC, PDF, JSON, and the video file itself are not available.",
      },
      {
        q: "Can I pick a YouTube caption language?",
        a: "You can pick auto detect or a source language for transcription. That is not selecting every official YouTube caption track from the player menu. Translation is not in this version.",
      },
      {
        q: "Is there a free plan?",
        a: "Yes. Sign-in is required so minutes and history stay on your account. Free accounts get monthly minutes with daily and per-file limits. See Pricing for current numbers.",
      },
    ],
  },
  cta: {
    title: "Download SRT or VTT from your next YouTube video",
    body: "Paste a public link into this YouTube Subtitle Downloader — then export SRT or VTT, or take TXT, DOCX, or CSV from the same workspace.",
    button: "Start converting",
  },
} as const;
