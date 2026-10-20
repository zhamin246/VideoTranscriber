/**
 * SEO copy for /x-transcript-generator.
 * Primary keyword: X Transcript Generator (~3% phrase density in visible body copy).
 * Scope: supported public x.com / twitter.com video posts — not DMs or login-walled media.
 */

export const X_TRANSCRIPT_GENERATOR_HREF = "/x-transcript-generator";

export type XLinkPanelCopy = {
  title: string;
  description: string;
  placeholder: string;
  button: string;
  helper: string;
};

export const xTranscriptGeneratorSeo = {
  meta: {
    title: "X Transcript Generator – Transcribe X and Twitter Videos",
    description:
      "Use an X Transcript Generator on supported public posts from x.com or twitter.com. Turn spoken audio into searchable text, add notes, and export TXT, DOCX, SRT, or VTT.",
  },
  hero: {
    h1: "X Transcript Generator",
    subtitle:
      "X Transcript Generator: searchable text from supported public video posts.\nPaste an x.com or twitter.com link—review or export in the workspace.",
    chips: [
      { label: "X Video Transcription", color: "#000000" },
      { label: "Searchable Transcripts", color: "#60A5FA" },
      { label: "AI Notes and Summaries", color: "#8882F5" },
      { label: "Text and Subtitle Export", color: "#38BDF8" },
    ],
  },
  linkPanel: {
    title: "Transcribe an X Video Post",
    description:
      "Paste a public x.com or twitter.com video link. Protected or login-only posts may not work.",
    placeholder: "Paste an X or Twitter video URL",
    button: "Generate Transcript",
    helper:
      "Works with supported public links. Whether an X Transcript Generator run succeeds depends on access to the post and its audio.",
  } satisfies XLinkPanelCopy,
  how: {
    title: "How the X Transcript Generator Works",
    lead: "Move from a shared X clip to editable words in three steps. After the X Transcript Generator finishes, use the same workspace tools you would for any other supported link.",
    steps: [
      {
        n: "1",
        title: "Copy a Public X Video URL",
        body: "Open the post on x.com or twitter.com and copy the link to a video that plays while logged out. The X Transcript Generator cannot read DMs or posts that require sign-in.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/x-step-1.webp",
      },
      {
        n: "2",
        title: "Run the X Transcript Generator",
        body: "Paste the URL and start transcription. The X Transcript Generator processes spoken audio; on-screen text in the frame is not OCR. Length, language, and audio quality affect results.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/x-step-2.webp",
      },
      {
        n: "3",
        title: "Review, Notes, and Export",
        body: "Search the transcript, generate notes when available, and export TXT, DOCX, SRT, VTT, or CSV. Verify quotes and names against the clip before you publish.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/x-step-3.webp",
      },
    ],
  },
  features: {
    title: "What You Get from an X Transcript Generator",
    lead: "Posts on X are easy to scroll past. An X Transcript Generator keeps the spoken message in text you can skim, quote, and file beside your other research.",
    rows: [
      {
        title: "Searchable Text from X Video Audio",
        body: "The X Transcript Generator turns the spoken track into lines you can search. Jump to a statement without replaying the whole post, and use speaker labels when the system separates voices.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/x-feature-1.webp",
        alt: "Searchable transcript from an X video post",
        imageRight: true,
      },
      {
        title: "Summaries and Notes on Top of the Transcript",
        body: "After the X Transcript Generator delivers text, use available AI modes for key points, study notes, or meeting-style summaries. Ask AI can answer from the transcript; check answers against the source.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/x-feature-2.webp",
        alt: "AI notes from an X transcript",
        imageRight: false,
      },
      {
        title: "Export for Captions and Documentation",
        body: "Download the X Transcript Generator output as TXT or DOCX for drafts, or SRT and VTT when subtitle export is enabled. CSV may be available for spreadsheet workflows.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/x-feature-3.webp",
        alt: "Export X transcript files",
        imageRight: true,
      },
    ],
  },
  usecases: {
    title: "Who Uses an X Transcript Generator?",
    lead: "Clips on X carry news, commentary, and explainers. Text makes them easier to cite, compare, and archive.",
    items: [
      {
        title: "Journalists and News Desks",
        body: "Pull quotes from on-record statements in public video posts. The X Transcript Generator gives you searchable lines instead of manual rewinds during a breaking story.",
      },
      {
        title: "Social and Community Teams",
        body: "Review what was said in a clip before you respond or repost. Search the transcript for product names, claims, or timestamps you need to verify.",
      },
      {
        title: "Researchers and Analysts",
        body: "Track talking points across creators or officials. Export text from the X Transcript Generator into notes or spreadsheets for side-by-side comparison.",
      },
      {
        title: "Creators and Editors",
        body: "Draft captions, threads, or show notes from your own uploaded clips. Start from the transcript, then edit wording to match your voice.",
      },
      {
        title: "Accessibility and Inclusion",
        body: "Offer a readable version of spoken content from a public post. Pair the transcript with exports your audience can read or subtitle in compatible tools.",
      },
      {
        title: "Compliance and Record Keeping",
        body: "Keep a text record of what was said in a public video statement. Store exports when you need an auditable reference alongside the original link.",
      },
    ],
  },
  testimonials: {
    title: "What Our Users Say",
    lead: "People paste public links, review transcripts, and spend less time scrubbing short clips on repeat.",
  },
  faq: {
    title: "X Transcript Generator FAQ",
    items: [
      {
        q: "What is an X Transcript Generator?",
        a: "An X Transcript Generator converts spoken audio from a supported public video post on x.com or twitter.com into text. You can search the transcript, create notes, and export supported file formats from the workspace.",
      },
      {
        q: "Which X links work with the X Transcript Generator?",
        a: "Supported public video URLs from x.com or twitter.com may work when the post is reachable and contains speech the system can access. Protected accounts, deleted posts, and media that requires login may fail.",
      },
      {
        q: "Does the X Transcript Generator read the tweet text?",
        a: "No. The X Transcript Generator transcribes audio from the video attachment, not the written caption alone. If the clip has little or no speech, the transcript may be empty or very short.",
      },
      {
        q: "Can I transcribe X Spaces with this tool?",
        a: "This page is for video posts with a playable clip, not live Spaces recordings unless you have a supported public video URL that the service can fetch. Availability depends on the link you paste.",
      },
      {
        q: "Why did my X Transcript Generator job fail?",
        a: "Common causes include private or removed posts, regional blocks, rate limits on the source, or a link that is not a video. Confirm the clip plays in a logged-out browser window, then try again.",
      },
      {
        q: "Can I download the transcript from the X Transcript Generator?",
        a: "Yes, when export is available for your job. Formats may include TXT, DOCX, SRT, VTT, and CSV. Open the export dialog in the workspace to see which options apply.",
      },
      {
        q: "Can AI summarize my X transcript?",
        a: "Where AI notes are enabled, you can generate summaries or key points from the transcript produced by the X Transcript Generator. Verify facts against the video before publishing.",
      },
      {
        q: "Is the X Transcript Generator free?",
        a: "Usage limits depend on your plan. See the Pricing page for current minutes, file caps, and feature access. This FAQ does not list changing quota numbers.",
      },
      {
        q: "How accurate is an X Transcript Generator transcript?",
        a: "Accuracy varies with audio quality, accents, cross-talk, and language support. Review names, numbers, and quotations before you rely on the text for publication or legal use.",
      },
      {
        q: "Do twitter.com links still work?",
        a: "Many legacy twitter.com URLs redirect to x.com. Paste either form if the post is public; the X Transcript Generator treats them as the same platform when the media is accessible.",
      },
    ],
  },
  cta: {
    title: "Ready to Run the X Transcript Generator?",
    body: "Paste a supported public video link from X, generate a transcript you can search, and export or summarize when those tools are available in your workspace.",
    button: "Transcribe X Video",
  },
} as const;
