/**
 * SEO copy for /ai-video-summarizer.
 * Primary: "ai video summarizer" in Title / H1 / H2 / H3 / FAQ.
 * Body rotates summary / key points / notes / recap so density stays under stuffing.
 * Do not clone upload / SRT / format-list blocks from sister pages.
 * Do not use homepage 2-gram "video transcriber".
 * Do not prefix the keyword with "a" / "an" / "this".
 */

export const AI_VIDEO_SUMMARIZER_HREF = "/ai-video-summarizer";

export const aiVideoSummarizerSeo = {
  meta: {
    title: "AI Video Summarizer for Notes | Video Transcriber",
    description:
      "AI video summarizer writes notes, chapters, and answers from speech. Skip a second full watch after the recording is in the workspace.",
  },
  hero: {
    h1: "AI Video Summarizer for Notes, Not Another Full Watch",
    subtitle:
      "The recap writes key points, chapter titles, and questions grounded in what was said. Speech is written first so the notes have a source. Word-for-word export lives on the home page if that is all you need.",
    chips: [
      { label: "Smart Summary", color: "#8882F5" },
      { label: "Meeting notes", color: "#14B8A6" },
      { label: "Chapter list", color: "#38BDF8" },
      { label: "Ask the recording", color: "#60A5FA" },
      { label: "Mind map", color: "#3B82F6" },
    ],
  },
  how: {
    title: "How AI video summarizer turns speech into notes",
    lead: "The job on this URL is the write-up, not a new edited clip. Put a recording in the workspace, wait until speech is on the page, then pick a note preset. The summary job does not join a live call and does not detect clicks on screen.",
    steps: [
      {
        n: "1",
        title: "Open the recording in the workspace",
        body: "Drop the file you already have, or paste a URL you can open while logged out. The recap cannot start until spoken audio is reachable. Closed meetings and login walls stay out.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/summarizer-step-1.webp",
      },
      {
        n: "2",
        title: "Pick a preset in AI video summarizer",
        body: "Presets are chosen after the words exist, not in the file picker. Smart Summary, Study Notes, Meeting Summary, Interview Notes, and Podcast Show Notes each shape the same speech differently.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/summarizer-step-2.webp",
      },
      {
        n: "3",
        title: "Read the recap, then ask or copy",
        body: "Scan the notes, jump by chapter, or ask a question that can only be answered from this recording. Copy the write-up into the doc you already use. A mind map is optional when you want topics as a tree.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/summarizer-step-3.webp",
      },
    ],
  },
  features: {
    title: "What AI video summarizer writes besides a recap",
    lead: "Use the presets for different rooms: class, call, interview, episode. The original speech stays next to the notes so you can check a line. This is not a highlight-reel cutter.",
    rows: [
      {
        title: "Note styles for the same speech",
        body: "Core Points is a short list. Chapter Summary follows the timeline. Study Notes keep headings you can review later. Meeting Summary hunts decisions and owners. Interview Notes pull quotes. Pick one after the notes have the spoken track.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/summarizer-feature-2-summary.webp",
        alt: "Note presets for a speech recap",
        imageRight: true,
      },
      {
        title: "Questions that stay on this recording",
        body: "Ask AI only sees the speech already in this workspace. It will not search the web, and it will not invent a scene that was never said. Run the recap job first so there is something to ask against.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/summarizer-feature-1-upload.webp",
        alt: "Ask questions against summarized speech",
        imageRight: false,
      },
      {
        title: "Chapters after AI video summarizer",
        body: "Chapters are timestamps you can click instead of dragging the playhead. A mind map groups themes from the same recap. Neither one replaces the notes; they are extra ways to move around after the write-up is done.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/summarizer-feature-3-export.webp",
        alt: "Chapters and mind map after a recap",
        imageRight: true,
      },
    ],
  },
  usecases: {
    title: "When AI video summarizer beats a second watch",
    lead: "Reach for notes and key points when the recording is already in hand and the pain is time, not capture. If you only need every word in order, use the home page instead.",
    items: [
      {
        title: "A lecture you already saved",
        body: "Study Notes and chapter outlines beat replaying a three-hour file. You still check the original speech when a formula or a name has to be exact.",
      },
      {
        title: "A call file after hang-up",
        body: "Meeting Summary is for decisions and follow-ups from a Zoom or Teams recording you exported. The product never sits in the live meeting as a bot.",
      },
      {
        title: "A public talk you will not rewatch",
        body: "Smart Summary or Core Points is enough for research. You are not here to download someone else’s caption file from a studio panel.",
      },
      {
        title: "Episode audio for show notes",
        body: "Podcast Show Notes draft the outline you still edit. The recap is a start, not the publish-ready description.",
      },
      {
        title: "An interview to quote later",
        body: "Interview Notes surface lines and follow-ups. Speaker labels help when host and guest stay on separate mics.",
      },
      {
        title: "A how-to you need as a checklist",
        body: "Timeline or Core Points lists spoken steps. Buttons and menus that only appear on screen are not read. That is not OCR.",
      },
    ],
  },
  faq: {
    title: "Frequently asked questions",
    items: [
      {
        q: "What does AI video summarizer actually return?",
        a: "A written recap from speech: notes, optional chapters, Ask AI, and a mind map. It is not a new short video and not a live meeting bot.",
      },
      {
        q: "Is the recap the same as the full transcript?",
        a: "No. The recap is the short write-up. The workspace still keeps the full speech next to it so you can verify a line. If you only want that full file, start on the home page.",
      },
      {
        q: "When do I choose the note style?",
        a: "After speech is on the page. A summary cannot shape notes from a file that has not been written out yet.",
      },
      {
        q: "Will Ask AI make up scenes?",
        a: "No. Answers are limited to this recording. If it was not said, it should not appear.",
      },
      {
        q: "Can it join Zoom or Teams live?",
        a: "No. Upload a recording you already have. There is no bot that sits in the call.",
      },
      {
        q: "Is AI video summarizer free to try?",
        a: "Yes, inside plan limits. Minutes, daily caps, and per-file size are on Pricing. This page does not reprint those numbers.",
      },
    ],
  },
  cta: {
    title: "Run AI video summarizer on the next file",
    body: "Drop a file or a public URL, then write a recap you can scan. Free use still follows Pricing.",
    button: "Start summarizing",
  },
} as const;
