/**
 * SEO copy for /facebook-transcript-generator.
 * Primary: "facebook transcript" ~3% density (case-insensitive 2-gram).
 * Secondary in H2 / H3 / FAQ: facebook video transcript, facebook transcript generator,
 * facebook reel transcript.
 * Scope: public Facebook links (facebook.com, fb.watch). Not a file-upload page.
 * Do not use the homepage 2-gram "video transcriber".
 * No article "a" before the keyword phrases.
 */

export const FACEBOOK_TRANSCRIPT_GENERATOR_HREF = "/facebook-transcript-generator";

export const facebookTranscriptGeneratorSeo = {
  meta: {
    title: "Facebook Transcript Generator – Public Video & Reel to Text",
    description:
      "Facebook Transcript Generator turns a public facebook.com or fb.watch URL into text. Copy or export TXT, DOCX, SRT, or VTT. Friends-only and login-walled posts will not fetch.",
  },
  hero: {
    h1: "Facebook Transcript Generator – Public Video & Reel to Text",
    subtitle:
      "Facebook transcript is spoken audio from a public Facebook video or Reel. Paste a facebook.com or fb.watch link, run transcription, then copy or export. The caption under the post is not included.",
    chips: [
      { label: "facebook.com & fb.watch", color: "#60A5FA" },
      { label: "Reels and Watch", color: "#14B8A6" },
      { label: "SRT & VTT export", color: "#38BDF8" },
      { label: "Notes from speech", color: "#8882F5" },
      { label: "Public posts only", color: "#3B82F6" },
    ],
  },
  how: {
    title: "How facebook transcript generator works",
    lead: "Facebook transcript generator uses a public link the server can fetch without your Facebook login. Paste it, transcribe speech, then copy or export. Friends-only, closed-group, and login-walled videos will not fetch. Stickers and the caption box are not included.",
    steps: [
      {
        n: "1",
        title: "Paste a public Facebook link",
        body: "Copy the address bar, or use Share → Copy link. On a phone, copy the link from the post menu. Public facebook.com and fb.watch URLs work. Profile pages and closed groups do not.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/facebook-step-1.webp",
      },
      {
        n: "2",
        title: "Run the facebook transcript generator",
        body: "The facebook transcript generator writes what was said. Auto-captions do not have to be on. Choose a language, and turn on speaker labels when more than one person talks. Music-only Reels may return little text.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/facebook-step-2.webp",
      },
      {
        n: "3",
        title: "Copy or export the facebook transcript",
        body: "Review the result in the workspace. Copy it, or download TXT, DOCX, SRT, VTT, or CSV. Notes, chapters, and Ask AI use the same spoken track.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/facebook-step-3.webp",
      },
    ],
  },
  features: {
    title: "Facebook video transcript from a public Watch or Page link",
    lead: "Facebook video transcript is speech from a public Watch clip, Page video, Reel, or fb.watch link. It is not a video downloader, and it does not dump Facebook’s own caption files.",
    rows: [
      {
        title: "Paste a link for facebook video transcript",
        body: "Paste a public facebook.com or fb.watch URL in the link tab. Add speaker labels and language before you start. Friends-only posts and login walls will not download. Files on your computer start from the home page.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/facebook-feature-1-link.webp",
        alt: "Paste a Facebook link to transcribe",
        imageRight: true,
      },
      {
        title: "Notes after the facebook transcript is ready",
        body: "After it finishes, generate notes and key points from that clip. Chapters, Ask AI, and a mind map stay on this workspace. They do not search the rest of the Page.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/facebook-feature-2-summary.webp",
        alt: "Generate notes from Facebook transcript",
        imageRight: false,
      },
      {
        title: "Export the facebook transcript",
        body: "Export as TXT, DOCX, SRT, VTT, or CSV. TXT and DOCX are for drafts. SRT and VTT carry timestamps. PDF, JSON, and translation are not in the current set.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/facebook-feature-3-export.webp",
        alt: "Export Facebook transcript",
        imageRight: true,
      },
    ],
  },
  usecases: {
    title: "Facebook reel transcript and longer Watch posts",
    lead: "Facebook reel transcript covers short spoken Reels. Longer Watch and Page videos use the same paste box. Music-only Reels will not fill facebook reel transcript with lyrics that were never spoken.",
    items: [
      {
        title: "Talking-head facebook reel transcript",
        body: "Paste a public Reel and read facebook reel transcript of what was said. The caption under the Reel and overlay stickers are not included.",
      },
      {
        title: "Watch facebook video transcript",
        body: "Facebook video transcript from a longer Watch or Page post is the same job with more audio. Search facebook transcript instead of dragging the playhead. Closed-group videos stay out of reach.",
      },
      {
        title: "Public Live replays",
        body: "If a Live stayed public, paste the replay URL and run facebook transcript. Overlapping voices and room noise can still mix lines.",
      },
      {
        title: "Follow-up posts",
        body: "Use facebook transcript as raw copy for a description or a later post. Export TXT or DOCX, then edit before you publish.",
      },
      {
        title: "Team handoff",
        body: "Share facebook transcript so someone else can search the clip without watching it twice. Ask AI stays on this recording.",
      },
      {
        title: "Caption files from facebook transcript",
        body: "Export SRT or VTT when it is ready. That file is speech-to-text, not the caption track inside Facebook’s editor.",
      },
    ],
  },
  faq: {
    title: "Frequently asked questions",
    items: [
      {
        q: "What is facebook transcript generator?",
        a: "Facebook transcript generator pastes a public facebook.com or fb.watch URL, transcribes speech, and writes facebook transcript you can copy or export. It is not the caption under the post.",
      },
      {
        q: "How do I get facebook video transcript?",
        a: "Copy a public Watch, Page, or video link, paste it, and run transcription. Facebook video transcript is the spoken audio in the workspace. Private or login-walled videos may not fetch.",
      },
      {
        q: "Does facebook reel transcript work on Reels?",
        a: "Yes, when the Reel is public. Facebook reel transcript still comes from speech, so a music-only Reel can return little text. Stickers are not transcribed.",
      },
      {
        q: "Do Facebook auto-captions have to be on first?",
        a: "No. Facebook transcript generator transcribes speech and does not depend on auto-captions or Facebook’s editor file.",
      },
      {
        q: "What can I export from facebook transcript?",
        a: "TXT, DOCX, SRT, VTT, and CSV. Copy from the workspace if you only need the clipboard. PDF, JSON, and translation are not available.",
      },
      {
        q: "Can I run facebook transcript on a private video?",
        a: "No. Facebook transcript needs a video the server can fetch without your Facebook login. Friends-only and login-walled links will fail.",
      },
    ],
  },
  cta: {
    title: "Facebook transcript on your next public link",
    body: "Paste a public video or Reel URL, get facebook transcript, then export TXT, DOCX, SRT, or VTT. Free use follows the minutes and caps on Pricing.",
    button: "Start converting",
  },
} as const;
