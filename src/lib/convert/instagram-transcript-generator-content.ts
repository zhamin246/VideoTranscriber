/**
 * SEO copy for /instagram-transcript-generator.
 * Primary keyword: "instagram transcript" (must be the top 2-word phrase).
 * Do not use homepage 2-gram "video transcriber" in title, H1, or body.
 * Scope: public Instagram Reels and video posts (instagram.com/reel/, instagram.com/p/).
 * Tone: match /tiktok-transcript-generator — short, concrete, no keyword stuffing.
 */

export const INSTAGRAM_TRANSCRIPT_GENERATOR_HREF = "/instagram-transcript-generator";

export const instagramTranscriptGeneratorSeo = {
  meta: {
    title: "Instagram Transcript from a Public Reel and Video Posts",
    description:
      "Get Instagram transcript from a public Reel or video URL. Copy or export TXT, DOCX, SRT, or VTT in the workspace. Private posts may not fetch.",
  },
  hero: {
    h1: "Paste a Public Link for Instagram Transcript",
    subtitle:
      "Instagram transcript on this page is spoken audio from a public Reel or video post, written so you can search and export it. Paste an instagram.com Reel or post URL, run transcription, then copy or download from the workspace.",
    chips: [
      { label: "Link paste", color: "#60A5FA" },
      { label: "Speaker labels", color: "#14B8A6" },
      { label: "SRT & VTT export", color: "#38BDF8" },
      { label: "AI notes & chapters", color: "#8882F5" },
      { label: "Public Instagram", color: "#3B82F6" },
    ],
  },
  how: {
    title: "How Instagram transcript generator works",
    lead: "Instagram transcript generator is a public Reel or video URL, spoken audio, then words in the workspace. Paste the link, run AI on speech, then copy, export, or generate notes. Private, region-blocked, or login-walled posts may not fetch. On-screen stickers and the caption under the post are not Instagram transcript.",
    steps: [
      {
        n: "1",
        title: "Paste your Instagram link",
        body: "Copy a public Reel or video post link and paste it in the link tab. Private posts may not fetch.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/instagram-step-1.webp",
      },
      {
        n: "2",
        title: "Run transcription",
        body: "Instagram transcript generator transcribes spoken audio with AI. Captions do not have to exist first. Choose auto language detect or a source language, and optionally separate speakers.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/instagram-step-2.webp",
      },
      {
        n: "3",
        title: "Copy or export",
        body: "Review Instagram transcript in your workspace. Copy it, or download TXT, DOCX, SRT, VTT, or CSV. Generate AI notes, chapters, Ask AI answers, or a mind map when you need more structure.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/instagram-step-3.webp",
      },
    ],
  },
  features: {
    title: "Instagram video transcript from a public URL",
    lead: "Paste a public link and the spoken track becomes editable words — not a scrape of every on-screen caption. Music-only clips may return little or no speech.",
    rows: [
      {
        title: "Paste a public Instagram URL",
        body: "Use a public instagram.com Reel or video post and run Instagram transcript. Add speaker labels and language selection before you start. Private or blocked posts may not download.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/instagram-feature-1-link.webp",
        alt: "Paste an Instagram link to transcribe",
        imageRight: true,
      },
      {
        title: "Generate notes after transcription",
        body: "After Instagram transcript is ready, generate AI notes and key points from the same clip. Use chapters, Ask AI, and mind map when you want more structure without replaying the Reel.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/instagram-feature-2-summary.webp",
        alt: "Generate notes from the transcript",
        imageRight: false,
      },
      {
        title: "Export Instagram transcript",
        body: "Instagram transcript generator exports TXT, DOCX, SRT, VTT, or CSV. Copy it for caption drafts, or download subtitle files for an editor. PDF, JSON, and translation are not in the current export set.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/instagram-feature-3-export.webp",
        alt: "Export Instagram transcript",
        imageRight: true,
      },
    ],
  },
  usecases: {
    title: "Instagram reel transcript for short-form clips",
    lead: "Instagram reel transcript is useful when speech is the part you need to quote, search, or caption. This page does not pull private accounts, and soundtrack-only clips will not fill the output with lyrics we did not hear as speech.",
    items: [
      {
        title: "Hooks and talking-head Reels",
        body: "Paste a public talking-head Reel, then get Instagram transcript of what was said. Use those words in notes — we do not score virality.",
      },
      {
        title: "Tutorials",
        body: "Turn a public how-to into searchable words. Export SRT or VTT when you need a captions file. Steps that exist only as on-screen type will not appear.",
      },
      {
        title: "Interviews and collabs",
        body: "Run Instagram transcript on a public interview-style Reel. Optional speaker labels help when more than one person talks and the model can tell them apart.",
      },
      {
        title: "Show notes and blogs",
        body: "Draft a caption or blog line from Instagram transcript. Copy TXT or DOCX into the tool you already use. You still write the publish-ready post.",
      },
      {
        title: "Team research",
        body: "Share Instagram transcript so teammates can search a Reel without watching it twice. Ask AI questions against that workspace only.",
      },
      {
        title: "Captions workflow",
        body: "Export SRT or VTT after Instagram transcript. Load those files in an editor. We do not import Instagram’s own auto-caption file.",
      },
    ],
  },
  faq: {
    title: "Frequently asked questions",
    items: [
      {
        q: "What is Instagram transcript?",
        a: "Instagram transcript is spoken audio from a Reel or video post written as words you can copy. This page pastes a public instagram.com URL, transcribes speech with AI, then lets you export in the workspace. It is not the caption typed under the post.",
      },
      {
        q: "Which Instagram links work?",
        a: "Public instagram.com/reel/ or video instagram.com/p/ URLs, when the media is reachable. Private, geo-blocked, or login-walled posts may fail. Profile pages and Stories are out of scope.",
      },
      {
        q: "Do I need Instagram captions to already exist?",
        a: "No. Instagram transcript on this page transcribes spoken audio with AI. On-screen captions are not required, and we do not claim to import every sticker or auto-caption track.",
      },
      {
        q: "What can I export?",
        a: "TXT, DOCX, SRT, VTT, and CSV. PDF, JSON, and translation are not available. Copy from the workspace if you only need Instagram transcript on the clipboard.",
      },
      {
        q: "Do you support speaker labels?",
        a: "Yes. Enable speaker separation before you start Instagram transcript so dialogue can be attributed to different speakers when the model can tell them apart.",
      },
      {
        q: "Is there a free plan?",
        a: "Yes. You can run Instagram transcript generator within plan limits. Sign-in is required so minutes and history stay on your account. See Pricing for current monthly minutes, daily caps, and per-file limits.",
      },
    ],
  },
  cta: {
    title: "Instagram transcript generator for your next link",
    body: "Paste a public instagram.com Reel or video URL for Instagram transcript, then export TXT, DOCX, SRT, VTT, or CSV. Free use follows monthly minutes, daily caps, and per-file limits on Pricing.",
    button: "Start converting",
  },
} as const;
