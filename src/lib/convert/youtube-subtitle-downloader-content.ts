/**
 * SEO copy for /youtube-subtitle-downloader.
 * Primary: "youtube subtitle downloader" ~3% (hits / words).
 * Distinct from /youtube-transcript-generator (full text) and homepage.
 * Honest: AI speech → timed SRT/VTT, not YouTube caption-track scraping, not an MP4 download.
 * Do not prefix the keyword with "a" / "this" / "our".
 * Do not use homepage 2-gram "video transcriber" in body.
 */

export const YOUTUBE_SUBTITLE_DOWNLOADER_HREF = "/youtube-subtitle-downloader";

export const youtubeSubtitleDownloaderSeo = {
  meta: {
    title: "YouTube Subtitle Downloader | Video Transcriber",
    description:
      "YouTube Subtitle Downloader writes timed SRT or VTT from public speech. It does not copy YouTube’s caption panel and does not save the video file.",
  },
  hero: {
    h1: "YouTube Subtitle Downloader for Timed SRT and VTT",
    subtitle:
      "YouTube Subtitle Downloader is for a caption file you can drop on a timeline. Speech is timed first. If you only want a readable script, use the YouTube transcript page instead.",
    chips: [
      { label: "SRT for editors", color: "#38BDF8" },
      { label: "VTT for players", color: "#60A5FA" },
      { label: "From speech", color: "#8882F5" },
      { label: "Public watch URL", color: "#14B8A6" },
      { label: "Not an MP4 grab", color: "#3B82F6" },
    ],
  },
  how: {
    title: "How YouTube Subtitle Downloader builds cues",
    lead: "It listens to reachable audio, then writes in- and out-times. Empty CC on the watch page is fine. Closed or age-gated videos will not fetch. Playlists are not one job.",
    steps: [
      {
        n: "1",
        title: "Give it one public watch URL",
        body: "Paste the video you can open while logged out. One URL per run. A channel page or a mix of many ids will not produce a single caption file.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/subtitle-step-1.webp",
      },
      {
        n: "2",
        title: "Let YouTube Subtitle Downloader time the speech",
        body: "Cues come from audio, not from YouTube Studio and not from a scraped language list. Pick a source language if you already know it. Two speakers can be split when the voices stay distinct.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/subtitle-step-2.webp",
      },
      {
        n: "3",
        title: "Take SRT or VTT off the workspace",
        body: "Check names and numbers, then export. SRT is the usual editor file. VTT is the usual web-player file. This page does not burn captions onto a picture and does not hand you the MP4.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/subtitle-step-3.webp",
      },
    ],
  },
  features: {
    title: "What YouTube Subtitle Downloader is for",
    lead: "The file has timestamps. That is the difference from a transcript you read top to bottom. Proof the cues before you publish anyone else’s video.",
    rows: [
      {
        title: "A caption file, not a studio dump",
        body: "It does not list every auto-translated track from the player menu. If the watch page has no CC, you can still get timed text from speech. That file is new. It is not YouTube’s official sidecar.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/subtitle-feature-2-transcribe.webp",
        alt: "Timed cues from speech, not a copied YouTube track",
        imageRight: true,
      },
      {
        title: "SRT in the cut, VTT on the web",
        body: "Premiere, Resolve, and CapCut expect SRT. HTML5 players expect VTT. Both files come from the same cue list. ASS, LRC, and burned-in captions are out of scope.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/subtitle-feature-3-export.webp",
        alt: "Export SRT or VTT subtitle files",
        imageRight: false,
      },
      {
        title: "Proof before you ship the captions",
        body: "Jargon, names, and overlapping talk still need a pass. You get a timed draft. You still fix lines that would embarrass a speaker on screen.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/subtitle-feature-1-link.webp",
        alt: "Review timed subtitle cues before export",
        imageRight: true,
      },
    ],
  },
  usecases: {
    title: "When YouTube Subtitle Downloader is the right export",
    lead: "Use this page when the next step is an editor or a player. Use the transcript URL when you only need to search the words.",
    items: [
      {
        title: "A cut already on a timeline",
        body: "Drop SRT next to the picture. You still download the video yourself. This page never fetches the MP4.",
      },
      {
        title: "A player that wants VTT",
        body: "Web players read VTT. Export that, not a novel-length script, when the job is on-screen captions.",
      },
      {
        title: "A talk with no CC button",
        body: "Empty caption panel is the usual reason people land here. Speech still has to be clear enough to time.",
      },
      {
        title: "Captions you are allowed to publish",
        body: "If you own the video or have permission, review the cues, then upload SRT. Borrowed talks still need a rights check.",
      },
      {
        title: "An interview you will subtitle, not quote",
        body: "Speaker labels help when two mics are clean. If you want a quote sheet, that is the transcript page.",
      },
      {
        title: "A how-to that must stay in sync",
        body: "Spoken steps get in-times. Menus that only appear as graphics are not read. That is not screen OCR.",
      },
    ],
  },
  faq: {
    title: "Frequently asked questions",
    items: [
      {
        q: "What is YouTube Subtitle Downloader?",
        a: "YouTube Subtitle Downloader returns timed SRT or VTT from public speech. It is not a copy of YouTube’s caption store and not a video downloader.",
      },
      {
        q: "Does YouTube Subtitle Downloader scrape existing CC?",
        a: "No. Cues are written from audio. A watch-page track is not required, and we do not expose yt-dlp-style language lists.",
      },
      {
        q: "SRT or VTT — which file should I take?",
        a: "SRT for most editors. VTT for most browsers. Both come from the same cue list after the job finishes.",
      },
      {
        q: "Is this the same as the YouTube transcript page?",
        a: "No. That page is for reading and searching the full text. This page is for a caption file with timestamps.",
      },
      {
        q: "Can YouTube Subtitle Downloader save the MP4?",
        a: "No. Only timed text. Fetching the picture is outside this product.",
      },
      {
        q: "Is YouTube Subtitle Downloader free to try?",
        a: "Yes, inside plan limits. Minutes and file caps are on Pricing. This page does not reprint the numbers.",
      },
    ],
  },
  cta: {
    title: "Run YouTube Subtitle Downloader on the next public URL",
    body: "Paste one watch link, then export SRT or VTT. This page stays on captions. Free use follows Pricing.",
    button: "Start converting",
  },
} as const;
