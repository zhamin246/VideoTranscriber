/**
 * SEO copy for /tiktok-transcript-generator.
 * Primary keyword: "tiktok transcript" (must be the top 2-word phrase).
 * Do not use homepage 2-gram "video transcriber" in title, H1, or body.
 * Scope: public TikTok video URLs (tiktok.com/.../video/{id}).
 */

export const TIKTOK_TRANSCRIPT_GENERATOR_HREF = "/tiktok-transcript-generator";

export const tiktokTranscriptGeneratorSeo = {
  meta: {
    title: "TikTok Transcript from a Public Link",
    description:
      "Get TikTok transcript from a public tiktok.com video URL. Copy or export TXT, DOCX, SRT, or VTT in the workspace. Private videos may not fetch.",
  },
  hero: {
    h1: "Paste a Public Link for TikTok Transcript",
    subtitle:
      "TikTok transcript on this page is spoken audio from a public TikTok video, written so you can search and export it. Paste a tiktok.com video URL, run transcription, then copy or download from the workspace.",
    chips: [
      { label: "Link paste", color: "#60A5FA" },
      { label: "Speaker labels", color: "#14B8A6" },
      { label: "SRT & VTT export", color: "#38BDF8" },
      { label: "AI notes & chapters", color: "#8882F5" },
      { label: "Public TikTok", color: "#3B82F6" },
    ],
  },
  how: {
    title: "How TikTok to transcript works",
    lead: "TikTok to transcript is a public video URL, spoken audio, then words in the workspace. Paste the link, run AI on speech, then copy, export, or generate notes. Private, region-blocked, or login-walled videos may not fetch. On-screen stickers are not TikTok transcript.",
    steps: [
      {
        n: "1",
        title: "Paste your TikTok link",
        body: "Copy a public tiktok.com video URL that includes /video/ and an id, then paste it in the link tab to start TikTok transcript. Profile pages and private posts are out of scope. Short share hosts without /video/{id} may fail.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/youtube-step-1.webp",
      },
      {
        n: "2",
        title: "Run transcription",
        body: "TikTok to transcript transcribes spoken audio with AI. Burned-in captions do not have to exist first. Choose auto language detect or a source language, and optionally separate speakers.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/youtube-step-2.webp",
      },
      {
        n: "3",
        title: "Copy or export",
        body: "Review TikTok transcript in your workspace. Copy it, or download TXT, DOCX, SRT, VTT, or CSV. Generate AI notes, chapters, Ask AI answers, or a mind map when you need more structure.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/youtube-step-3.webp",
      },
    ],
  },
  features: {
    title: "TikTok to text from a public video",
    lead: "Paste a public link and the spoken track becomes editable words — not a scrape of every on-screen caption. Music-only clips may return little or no speech.",
    rows: [
      {
        title: "Paste a public TikTok URL",
        body: "Use a public tiktok.com video page with /video/{id} and run TikTok transcript. Add speaker labels and language selection before you start. Private or blocked videos may not download.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/youtube-feature-1-link.webp",
        alt: "Paste a TikTok link to transcribe",
        imageRight: true,
      },
      {
        title: "Generate notes after transcription",
        body: "After TikTok transcript is ready, generate AI notes and key points from the same clip. Use chapters, Ask AI, and mind map when you want more structure without replaying the video.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/youtube-feature-2-summary.webp",
        alt: "Generate notes from the transcript",
        imageRight: false,
      },
      {
        title: "Export TikTok transcript",
        body: "TikTok transcript generator exports TXT, DOCX, SRT, VTT, or CSV. Copy it for caption drafts, or download subtitle files for an editor. PDF, JSON, and translation are not in the current export set.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/youtube-feature-3-export.webp",
        alt: "Export TikTok transcript",
        imageRight: true,
      },
    ],
  },
  usecases: {
    title: "TikTok video transcript for short-form clips",
    lead: "TikTok video transcript is useful when speech is the part you need to quote, search, or caption. This page does not pull private accounts, and soundtrack-only clips will not fill the output with lyrics we did not hear as speech.",
    items: [
      {
        title: "Hooks and talking-head clips",
        body: "Paste a public talking-head TikTok, then get TikTok transcript of what was said. Use those words in notes — we do not score virality.",
      },
      {
        title: "Tutorials",
        body: "Turn a public how-to into searchable words. Export SRT or VTT when you need a captions file. Steps that exist only as on-screen type will not appear.",
      },
      {
        title: "Interviews and duets",
        body: "Run TikTok transcript on a public interview-style clip. Optional speaker labels help when more than one person talks and the model can tell them apart.",
      },
      {
        title: "Show notes and blogs",
        body: "Draft a caption or blog line from TikTok transcript. Copy TXT or DOCX into the tool you already use. You still write the publish-ready post.",
      },
      {
        title: "Team research",
        body: "Share TikTok transcript so teammates can search a clip without watching it twice. Ask AI questions against that workspace only.",
      },
      {
        title: "Captions workflow",
        body: "Export SRT or VTT after TikTok transcript. Load those files in an editor. We do not import TikTok’s own auto-caption file.",
      },
    ],
  },
  faq: {
    title: "Frequently asked questions",
    items: [
      {
        q: "What is TikTok transcript?",
        a: "TikTok transcript is spoken audio from a TikTok video written as words you can copy. This page pastes a public tiktok.com video URL, transcribes speech with AI, then lets you export in the workspace.",
      },
      {
        q: "Which TikTok links work?",
        a: "Public tiktok.com URLs that include /video/ and a numeric id, when the media is reachable. Private, geo-blocked, or login-walled videos may fail. Short links without /video/{id} may fail.",
      },
      {
        q: "Do I need TikTok captions to already exist?",
        a: "No. TikTok transcript on this page transcribes spoken audio with AI. On-screen captions are not required, and we do not claim to import every sticker or auto-caption track.",
      },
      {
        q: "What can I export?",
        a: "TXT, DOCX, SRT, VTT, and CSV. PDF, JSON, and translation are not available. Copy from the workspace if you only need TikTok transcript on the clipboard.",
      },
      {
        q: "Do you support speaker labels?",
        a: "Yes. Enable speaker separation before you start TikTok transcript so dialogue can be attributed to different speakers when the model can tell them apart.",
      },
      {
        q: "Is there a free plan?",
        a: "Yes. You can run TikTok transcript generator within plan limits. Sign-in is required so minutes and history stay on your account. See Pricing for current monthly minutes, daily caps, and per-file limits.",
      },
    ],
  },
  cta: {
    title: "TikTok transcript generator for your next link",
    body: "Paste a public tiktok.com video URL for TikTok transcript, then export TXT, DOCX, SRT, VTT, or CSV. Free use follows monthly minutes, daily caps, and per-file limits on Pricing.",
    button: "Start converting",
  },
} as const;
