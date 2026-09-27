/**
 * SEO copy for /facebook-transcript-generator.
 * Primary keyword: "facebook transcript"
 * Secondary: facebook video transcript, facebook transcript generator, facebook reel transcript.
 * Scope: public Facebook links (facebook.com, fb.watch). Not a file-upload page.
 * Do not use the homepage 2-gram "video transcriber".
 */

export const FACEBOOK_TRANSCRIPT_GENERATOR_HREF = "/facebook-transcript-generator";

export const facebookTranscriptGeneratorSeo = {
  meta: {
    title: "Public Facebook Transcript Generator | Video Transcriber",
    description:
      "Paste a public link and get a facebook transcript you can copy or export as TXT, DOCX, SRT, or VTT. Private or login-walled videos may not fetch.",
  },
  hero: {
    h1: "Paste a Public Link for Facebook Transcript",
    subtitle:
      "Facebook Transcript here is spoken audio from a public Facebook video or Reel, ready to search and export. Paste a facebook.com or fb.watch link, run transcription, then copy or download from the workspace.",
    chips: [
      { label: "Link paste", color: "#60A5FA" },
      { label: "Speaker labels", color: "#14B8A6" },
      { label: "SRT & VTT export", color: "#38BDF8" },
      { label: "AI notes & chapters", color: "#8882F5" },
      { label: "Public Facebook", color: "#3B82F6" },
    ],
  },
  how: {
    title: "How a facebook transcript generator works",
    lead: "A facebook transcript generator on this URL starts from a link you can open without signing in to Facebook. Paste it, transcribe the spoken audio with AI, then stay in the workspace to copy, export, or generate notes. Private, friends-only, or login-walled videos may not fetch. That is a platform limit. On-screen stickers and the text under the post are not a facebook transcript.",
    steps: [
      {
        n: "1",
        title: "Paste your Facebook link",
        body: "Copy a public video or Reel link from Share, or from the address bar while the video is open. On a phone, use Copy link in the post menu. Paste that URL in the link tab. Private posts may not fetch.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/facebook-step-1.webp",
      },
      {
        n: "2",
        title: "Run transcription",
        body: "The facebook transcript generator transcribes spoken audio with AI. Captions do not have to exist first. Choose auto language detect or a source language, and turn on speaker separation when more than one person talks.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/facebook-step-2.webp",
      },
      {
        n: "3",
        title: "Copy or export",
        body: "Review the facebook transcript in your workspace. Copy the words, or download TXT, DOCX, SRT, VTT, or CSV. Generate AI notes, chapters, Ask AI answers, or a mind map from the same spoken track.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/facebook-step-3.webp",
      },
    ],
  },
  features: {
    title: "Facebook video transcript from a public link",
    lead: "A facebook video transcript on this page is speech from a public video, Watch link, page video, or fb.watch short link. It is not a download of every caption language Facebook may store. A clip with music and no speech can leave the facebook transcript thin.",
    rows: [
      {
        title: "Paste a public Facebook link",
        body: "Open the video until you have a URL for that video, then paste it here for a facebook transcript. facebook.com links and fb.watch share links are the formats this page accepts when the media is public. Add speaker labels and language selection before you start. Friends-only and login-walled videos may not download. A file already on your computer starts from the home page, not from this link tab.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/facebook-feature-1-link.webp",
        alt: "Paste a Facebook link to transcribe",
        imageRight: true,
      },
      {
        title: "Notes after the spoken track is ready",
        body: "After the facebook transcript finishes, generate AI notes and key points from that same video. Chapters, Ask AI, and a mind map sit on the workspace so you can look up a line without scrubbing the player. Ask AI answers stay on this transcript. They are not a search of Facebook.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/facebook-feature-2-summary.webp",
        alt: "Generate notes from a Facebook transcript",
        imageRight: false,
      },
      {
        title: "Export the transcript",
        body: "Export the facebook transcript as TXT, DOCX, SRT, VTT, or CSV. TXT and DOCX are for notes and drafts. SRT and VTT carry timestamps for an editor. CSV is the spreadsheet form of the same lines. Copy is enough when you only need the words on the clipboard. PDF, JSON, and translation are not available.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/facebook-feature-3-export.webp",
        alt: "Export a Facebook transcript",
        imageRight: true,
      },
    ],
  },
  usecases: {
    title: "Facebook reel transcript and longer posts",
    lead: "A facebook reel transcript is the short spoken clip: a talking-head Reel, a product line said out loud, or a quote you would otherwise replay. Longer public videos use the same paste box. Soundtrack-only Reels will not fill the page with lyrics the model did not hear as speech.",
    items: [
      {
        title: "Talking-head Reels",
        body: "Paste a public Reel and read the facebook transcript of what was said. The line under the Reel is a caption you or the creator typed. That line is not the transcript. It is a different field. Words that appear only as stickers on the video are not pulled in.",
      },
      {
        title: "Watch and page videos",
        body: "A facebook video transcript from a longer public post is the same job with more audio. Search the facebook transcript for a name, a price, or a step instead of dragging the playhead. Members-only or group-only videos stay out of reach when the link is not public.",
      },
      {
        title: "Interviews and co-hosts",
        body: "Run a facebook transcript on a public interview. Optional speaker labels split lines when the model can tell voices apart. You do not type guest names in before the job starts. Overlapping talk can still drop or mix lines in the transcript.",
      },
      {
        title: "Post drafts",
        body: "Use the facebook transcript as the raw spoken words for a follow-up post or a description. Copy TXT or DOCX into the doc you already use. Those words are speech as text. You still edit the publish-ready post.",
      },
      {
        title: "Team handoff",
        body: "Share the facebook transcript so someone else can search a public video without watching it twice. Ask AI questions in that workspace. The answers are limited to this transcript, not to other videos on the Page.",
      },
      {
        title: "Caption files",
        body: "Export SRT or VTT after the facebook transcript is ready and load those files in an editor. This facebook transcript is speech-to-text. It is not a dump of the caption track Facebook shows in a Page video editor, and there is no button here that downloads Facebook's own SRT.",
      },
    ],
  },
  faq: {
    title: "Frequently asked questions",
    items: [
      {
        q: "How do I get a transcript of a Facebook video?",
        a: "Copy the public video or Reel link, paste it in the link tab on this page, and run transcription. A facebook transcript is the spoken audio written out in the workspace. Facebook captions do not have to be turned on first. Private or login-walled videos may not fetch.",
      },
      {
        q: "Does it work with Facebook Reels?",
        a: "Yes, when the Reel link is public. Paste the Reel URL the same way you paste a longer video link. A facebook reel transcript still comes from speech, so a music-only Reel can return little or no text. Stickers on the Reel are not transcribed.",
      },
      {
        q: "Do I need Facebook captions to already exist?",
        a: "No. This page transcribes spoken audio with AI, so the facebook transcript does not depend on auto-captions. We also do not import the caption file from Facebook's editor. Clear speech with little background noise is easier to read back than a noisy room or two people talking at once.",
      },
      {
        q: "What can I export?",
        a: "TXT, DOCX, SRT, VTT, and CSV. Copy from the workspace when you only need the facebook transcript on the clipboard. PDF, JSON, and translation are not in the current export set.",
      },
      {
        q: "Can I transcribe private Facebook videos?",
        a: "No. A facebook transcript on this page needs a video the server can fetch without your Facebook login. Friends-only, private, and login-walled links may fail. Making a video public on Facebook is a step you take in Facebook, not a switch on this page.",
      },
      {
        q: "Is the Facebook transcript generator free?",
        a: "Yes, within plan limits. Sign-in is required so each facebook transcript and its history stay on your account. Free use follows monthly minutes, daily caps, and per-file limits. See Pricing for the current numbers before you run another video. This page does not publish those figures.",
      },
    ],
  },
  cta: {
    title: "Facebook transcript on your next public link",
    body: "Paste a public video or Reel URL, get a facebook transcript, then export TXT, DOCX, SRT, VTT, or CSV. Free use still follows the monthly minutes, daily caps, and per-file limits listed on Pricing.",
    button: "Start converting",
  },
} as const;
