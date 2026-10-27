/**
 * SEO copy for /mp3-to-srt.
 * Primary keyword phrase: "mp3 to srt".
 * Body target ~1,200 words. Scope: MP3/WAV/M4A upload → SRT/VTT export.
 */

export const MP3_TO_SRT_HREF = "/mp3-to-srt";

export const mp3ToSrtSeo = {
  meta: {
    title: "MP3 to SRT Converter – Create Subtitles Online",
    description:
      "Convert MP3 to SRT with AI transcription. Upload audio, generate timed captions, and export SRT or VTT subtitles from your workspace.",
  },
  hero: {
    h1: "MP3 to SRT Converter",
    subtitle:
      "Upload an MP3, transcribe speech with AI, and export SRT or VTT from your workspace. Review the transcript before download so captions are ready for your editor.",
    chips: [
      { label: "MP3 upload", color: "#3B82F6" },
      { label: "SRT & VTT", color: "#38BDF8" },
      { label: "Speaker labels", color: "#14B8A6" },
      { label: "WAV & M4A", color: "#60A5FA" },
      { label: "Timed captions", color: "#8882F5" },
    ],
  },
  how: {
    title: "How to Convert MP3 to SRT",
    lead:
      "Mp3 to srt takes three steps: upload local audio, transcribe speech, export timed captions. Use files you already have—podcasts, interviews, or voice-over—not pasted video URLs. Sign in for history and minutes; see Pricing for limits.",
    steps: [
      {
        n: "1",
        title: "Upload Your MP3 File",
        body:
          "Add MP3, WAV, or M4A from your computer. Clear speech works best; heavy noise can reduce accuracy.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/audio-step-1-v2.webp",
      },
      {
        n: "2",
        title: "Transcribe and Review",
        body:
          "Run AI transcription, then fix names and hard-to-hear words in the workspace before you export mp3 to srt subtitles.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/audio-step-2-v2.webp",
      },
      {
        n: "3",
        title: "Export Your SRT Subtitles",
        body:
          "Download SRT or VTT for your NLE or host. TXT and DOCX are available if you only need plain text.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/audio-step-3.webp",
      },
    ],
  },
  features: {
    title: "A Practical Way to Create MP3 Subtitles",
    lead:
      "Choose mp3 to srt when you need timed captions, not just a text dump. One workspace handles transcription and export. For video files or YouTube links, use [[Video to Text|/video-to-text]] or [[YouTube Transcript Generator|/youtube-transcript-generator]].",
    rows: [
      {
        title: "Turn Spoken Audio into Editable Text",
        body:
          "AI drafts words from your MP3 so you can edit before mp3 to srt export. Works for podcasts, lessons, and narration; noisy or overlapping speech may need manual fixes.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/audio-feature-1-convert.webp",
        alt: "AI transcription turns spoken words in an MP3 recording into editable text",
        imageRight: true,
      },
      {
        title: "Export Timed Captions in SRT or VTT",
        body:
          "Subtitles need timecodes. Export SRT or VTT after transcription and import into your editor. Spot-check timing on fast dialogue or multiple speakers.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/audio-feature-2-summary.webp",
        alt: "SRT and VTT export options for timed subtitles generated from audio",
        imageRight: false,
      },
      {
        title: "Keep Your Transcript in One Workspace",
        body:
          "Same job can export TXT, DOCX, SRT, VTT, or CSV. Sign in for saved history; check Pricing before long mp3 to srt jobs.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/audio-feature-3-export.webp",
        alt: "Multiple transcript export formats available from one transcription workspace",
        imageRight: true,
      },
    ],
  },
  usecases: {
    title: "What Can You Use MP3 to SRT For?",
    lead:
      "Timed subtitles make speech easier to quote, search, and pair with video. Pick a use case, then review text and timing before you publish.",
    items: [
      {
        title: "Podcast Episodes",
        body:
          "Turn episode audio into SRT for video cuts or clips. Fix speaker names before publish.",
      },
      {
        title: "Online Courses and Lectures",
        body:
          "Add captions to lesson audio for accessibility. Verify technical terms in the transcript.",
      },
      {
        title: "Interviews and Conversations",
        body:
          "Export subtitles from interviews; compare important quotes to the recording.",
      },
      {
        title: "Voice-Overs and Narration",
        body:
          "Match narration MP3 to picture with timed SRT after you trim the edit.",
      },
      {
        title: "Legal and Research Recordings",
        body:
          "Searchable drafts help review—always verify sensitive audio against the source.",
      },
      {
        title: "Social Videos Made from Audio",
        body:
          "Export SRT for audiograms or short clips; adjust line breaks in your editor.",
      },
    ],
  },
  faq: {
    title: "Frequently asked questions",
    items: [
      {
        q: "What does MP3 to SRT mean?",
        a: "Mp3 to srt converts speech in an MP3 into a SubRip file with timestamps. This page transcribes upload audio, then exports SRT from your workspace.",
      },
      {
        q: "How do I convert MP3 to SRT online?",
        a: "Upload MP3, run transcription, review text, then export SRT. Sign in for minutes and history.",
      },
      {
        q: "Can I use this MP3 to SRT converter for free?",
        a: "Free tier exists with plan limits. Check Pricing before long files; sign-in is required.",
      },
      {
        q: "Does the SRT file include timestamps?",
        a: "Yes. SRT lines include start and end times for compatible players and editors. Review timing after export.",
      },
      {
        q: "Can I upload WAV or M4A instead of MP3?",
        a: "Yes—WAV and M4A upload the same way. Export SRT or VTT when transcription finishes.",
      },
      {
        q: "What other formats can I export?",
        a: "VTT, TXT, DOCX, and CSV are supported. PDF, JSON, and translation are not offered on this flow.",
      },
    ],
  },
  cta: {
    title: "Create SRT Subtitles from Your MP3",
    body:
      "Upload audio, run mp3 to srt in the workspace, and download SRT or VTT when captions look right. See Pricing for minute limits.",
    button: "Convert MP3 to SRT",
  },
} as const;
