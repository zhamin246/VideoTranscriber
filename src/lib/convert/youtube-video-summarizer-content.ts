/**

 * SEO copy for /youtube-video-summarizer.

 * Primary keyword: YouTube video summarizer (~3% density target in page copy).

 * Scope: public YouTube links → transcript + AI notes, chapters, Ask AI.

 */



export const YOUTUBE_VIDEO_SUMMARIZER_HREF = "/youtube-video-summarizer";



export const youtubeVideoSummarizerSeo = {

  meta: {

    title: "YouTube Video Summarizer for Notes & Chapters | Video Transcriber",

    description:

      "Paste a public YouTube link. YouTube video summarizer writes key points, chapters, and Ask AI answers from speech—without rewatching the full runtime.",

  },

  hero: {

    h1: "YouTube Video Summarizer for Public Links",

    subtitle:

      "YouTube video summarizer on this page turns a watch, Shorts, or youtu.be URL into notes you can scan. Speech is written first in the workspace, then Smart Summary, chapters, and Ask AI build on that source. Private or blocked videos may not fetch.",

    chips: [

      { label: "Smart Summary", color: "#8882F5" },

      { label: "Chapter list", color: "#38BDF8" },

      { label: "Ask the video", color: "#60A5FA" },

      { label: "Mind map", color: "#14B8A6" },

      { label: "Public YouTube", color: "#3B82F6" },

    ],

  },

  how: {

    title: "How YouTube video summarizer works",

    lead: "Paste a public link, transcribe speech in the workspace, then pick a note preset. Need every word? Use the YouTube Transcript Generator; need a recap, run presets here after transcription.",

    steps: [

      {

        n: "1",

        title: "Paste your YouTube link",

        body: "Copy a public watch, Shorts, or youtu.be URL into the link tab. The server must reach the video without your Google login. Blocked or members-only links stop with a clear error instead of empty notes.",

        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/youtube-step-1.webp",

      },

      {

        n: "2",

        title: "Transcribe, then summarize",

        body: "Spoken audio is transcribed with AI so presets have text to shape. Player captions are not required. Choose auto language or a source language, optional speaker labels, then open Smart Summary or another style after the transcript appears on the page.",

        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/summarizer-step-2.webp",

      },

      {

        n: "3",

        title: "Read notes, chapters, Ask AI",

        body: "Scan key points, jump by chapter timestamps, or ask a question that must be answered from this recording. Copy the write-up into your doc tool. Export TXT or DOCX when you also want the full spoken track beside the recap.",

        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/summarizer-step-3.webp",

      },

    ],

  },

  features: {

    title: "What YouTube video summarizer writes in the workspace",

    lead: "Full speech stays beside the recap so you can check a quote. Presets reshape the same transcript—Core Points, Study Notes, Meeting Summary, and more.",

    rows: [

      {

        title: "YouTube video summarizer note presets",

        body: "Smart Summary, Study Notes, Interview Notes, and Podcast Show Notes run after speech exists. Presets cannot summarize silence—wait for transcription to finish, then pick the style that matches how you will reuse the upload. Speaker labels help when host and guest are easy to tell apart. Each preset is chosen in the workspace, not in the link field, so you can try a second style on the same transcript without re-uploading.",

        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/youtube-feature-2-summary.webp",

        alt: "Note presets after summarizing a YouTube link",

        imageRight: true,

      },

      {

        title: "Chapters and mind map from YouTube video summarizer",

        body: "Chapters are clickable timestamps instead of dragging the playhead through a long talk. A mind map groups themes from the recap. Neither replaces the notes; they are extra ways to navigate after the write-up is done. Embed playback stays on the YouTube player when the source is a public watch URL.",

        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/summarizer-feature-3-export.webp",

        alt: "Chapters after a YouTube recap",

        imageRight: false,

      },

      {

        title: "Ask AI grounded in this video only",

        body: "Ask AI reads the transcript already in this workspace. It does not search the web and should not invent scenes that were never said. Run transcription first so there is source text to question. Answers are for research and follow-ups, not legal testimony without checking the line.",

        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/summarizer-feature-1-upload.webp",

        alt: "Ask questions against summarized speech",

        imageRight: true,

      },

    ],

  },

  usecases: {

    title: "When YouTube video summarizer beats a full rewatch",

    lead: "Use it when the video is already public and you want time back—not a new capture. Skim notes first; export the full transcript from the same workspace when you need exact wording.",

    items: [

      {

        title: "Lectures & long tutorials",

        body: "Paste a public course or how-to URL, then generate chapter outlines and Study Notes from the recap. Search the spoken track when one formula matters. Jump to the chapter timestamp instead of scrubbing blindly through a three-hour upload.",

      },

      {

        title: "Conference talks & panels",

        body: "Smart Summary captures themes from a keynote you will cite in a deck. A written recap is faster than note-taking during playback when the session is already uploaded.",

      },

      {

        title: "Podcast episodes on YouTube",

        body: "Podcast Show Notes draft an outline for description fields. You still edit before publish—the recap is a start, not the final show page.",

      },

      {

        title: "Interviews & creator collabs",

        body: "Interview Notes pull quotes and follow-ups. Optional speaker separation helps when two voices share one public upload.",

      },

      {

        title: "Team research & briefings",

        body: "Share notes so colleagues skim a talk without watching an hour. Ask AI for one fact and jump to the chapter that supports it after the recap is ready.",

      },

      {

        title: "News & commentary clips",

        body: "Core Points lists what was argued in a public clip. The tools here target spoken content, not comment threads under the player.",

      },

    ],

  },

  faq: {

    title: "YouTube video summarizer FAQ",

    items: [

      {

        q: "What is a YouTube video summarizer?",

        a: "YouTube video summarizer is a recap from a public link: speech is transcribed, then AI writes notes, chapters, and optional Ask AI answers in the same workspace. It is not a new edited video file.",

      },

      {

        q: "How is this different from the YouTube Transcript Generator?",

        a: "The transcript page optimizes for every word and subtitle exports. YouTube video summarizer optimizes for key points and structure. Many teams transcribe once, then summarize in the workspace without pasting the link again.",

      },

      {

        q: "Which YouTube links work?",

        a: "Public watch URLs, Shorts, and youtu.be shares when media is reachable. Private, geo-blocked, or login-walled videos may fail—that is a platform limit, not a setting we can bypass.",

      },

      {

        q: "Do I need captions turned on in YouTube?",

        a: "No. Spoken audio is transcribed with AI. Existing player captions are not required, and we do not import every stored caption language.",

      },

      {

        q: "Can Ask AI hallucinate?",

        a: "Ask AI is limited to speech in this workspace. If it was not said, it should not appear. Notes are drafts—verify quotes before publishing.",

      },

      {

        q: "Is YouTube video summarizer free to try?",

        a: "Yes, within plan limits. Sign-in keeps minutes and history on your account. Monthly minutes, daily caps, and per-file limits are on Pricing; this FAQ does not duplicate those numbers.",

      },

      {

        q: "Does YouTube video summarizer replace watching the video?",

        a: "It replaces a second full watch for many research tasks, not the first watch when visuals on screen carry the meaning. On-screen slides, code, and diagrams are not read by the recap. Open the embedded player when a chart or demo must be seen.",

      },

    ],

  },

  cta: {

    title: "Run YouTube video summarizer on your next link",

    body: "Paste a public URL, transcribe once, then read notes and chapters without a second full watch. Free tier limits are listed on Pricing.",

    button: "Summarize a video",

  },

} as const;

