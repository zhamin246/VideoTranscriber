/**
 * Landing Page COPY — source of truth.
 * UI must not invent claims. No fabricated scores or user counts.
 */

import { useCaseAsset } from "@/lib/convert/use-case-assets";

export const FREE_TEST_HREF = "/tools/ai-attractiveness-test";
export const FULL_REPORT_HREF = "/tools/full-analysis";
export const CONVERT_HREF = "/";
export const PRICE = "$9.90";
export const PRICE_NOTE = "One-time · web report + emailed PDF";

export const content = {
  brand: {
    name: "video transcriber",
    mark: "video",
    rest: "transcriber",
  },

  nav: {
    menus: [
      {
        label: "Transcribe",
        items: [
          { label: "File upload", href: CONVERT_HREF },
          { label: "Paste a link", href: CONVERT_HREF },
          { label: "Record audio", href: CONVERT_HREF },
        ],
      },
      {
        label: "Outputs",
        items: [
          { label: "Copy transcript", href: CONVERT_HREF },
          { label: "Download file", href: CONVERT_HREF },
          { label: "Share text", href: CONVERT_HREF },
        ],
      },
      {
        label: "Examples",
        items: [
          { label: "Meetings", href: "/#usecases" },
          { label: "Interviews", href: "/#usecases" },
          { label: "Podcasts", href: "/#usecases" },
          { label: "YouTube", href: "/#usecases" },
        ],
      },
      {
        label: "Tools",
        items: [
          { label: "My Assets", href: "/my-assets" },
          { label: "Transcribe", href: CONVERT_HREF },
        ],
      },
      {
        label: "Guides",
        items: [
          { label: "How it works", href: "/#how-it-works" },
          { label: "FAQ", href: "/#faq" },
        ],
      },
    ],
    tools: {
      label: "Tools",
      items: [
        { label: "My Assets", href: "/my-assets" },
        { label: "Transcribe", href: CONVERT_HREF },
      ],
    },
    items: [
      { label: "Pricing", href: "/pricing" },
    ],
    login: { label: "Log in", href: "/auth/signin" },
    cta: { label: "Start transcribing", href: CONVERT_HREF },
  },

  hero: {
    kicker: "AUDIO + VIDEO → TEXT",
    title: "Convert audio and video to text.",
    titleItalic: "audio and video to text",
    subtitle: "",
    description:
      "Video Transcriber turns speech into a searchable transcript. Upload a file, paste a media link, or record audio in the browser — then copy, download, or share the text.",
    primaryCta: { label: "Start transcribing", href: CONVERT_HREF },
    secondaryCta: { label: "See examples", href: "/#usecases" },
    volume: "Semantic linework — not a pixel tracing.",
    volumeHighlight: "Semantic linework",
    proofs: [
      "Any photo or drawing",
      "DXF + SVG + PDF",
      "Opens in AutoCAD, LightBurn, Illustrator",
    ],
  },

  why: {
    kicker: "Why us",
    title: "Why this converter, not a tracer",
    titleItalic: "not a tracer",
    lead: "Built for semantic linework you can edit — not a pixel tracing you have to clean.",
    capability: "Capability",
    traditional: { kicker: "Traditional", title: "Manual CAD tracing" },
    typical: { kicker: "Typical", title: "Online auto-trace tools" },
    ours: { kicker: "Video Transcriber", title: "Speech to text", badge: "Best" },
    rows: [
      {
        capability: "Method",
        traditional: "Redraw the photo by hand in CAD, one edge at a time",
        typical: "Draw paths along pixel contrast boundaries",
        ours: "AI reads the subject, then draws the geometry that matters",
      },
      {
        capability: "Photos",
        traditional: "Works, if you have hours",
        typical: "Fails on fur, brick, shadow, and JPEG noise",
        ours: "Photographs are the main case — people, objects, and plans",
      },
      {
        capability: "Noise",
        traditional: "You decide what to keep",
        typical: "Every texture and artifact becomes a path",
        ours: "Shadows, texture, and compression are interpreted away",
      },
      {
        capability: "Output",
        traditional: "Native DWG if you have time to draft it",
        typical: "A messy SVG or PDF outline, one path soup",
        ours: "One drawing, three files: DXF / SVG / PDF",
      },
      {
        capability: "Units",
        traditional: "You set units and measure after the fact",
        typical: "Pixel-space vectors with no real-world units",
        ours: "Millimetres. Default longest edge about 300 mm — rescale as needed",
      },
      {
        capability: "Cleanup",
        traditional: "Full control, full hours",
        typical: "Hours of node-editing after a cheap auto-trace",
        ours: "Clean editable paths instead of a silhouette dump",
      },
    ],
    footer: "One drawing, three files: DXF / SVG / PDF.",
    cta: { label: "Convert a photo", href: CONVERT_HREF },
  },

  how: {
    kicker: "HOW IT WORKS",
    title: "How the converter works in three steps",
    titleItalic: "three steps",
    lead: "You do not draft the scene by hand. Upload one file. The AI reads the subject and returns a DXF, an SVG, and a PDF you can open in CAD, laser, or design tools.",
    steps: [
      {
        n: "1",
        title: "Upload a photo or sketch",
        body: "Drop a JPEG, PNG, WebP, HEIC, AVIF, or PDF. People, products, facades, and plans all start the same path.",
      },
      {
        n: "2",
        title: "AI draws the CAD linework",
        body: "The model understands what the photo shows and draws clean linework — not paths chasing shadow, brick, or fur. About a minute.",
      },
      {
        n: "3",
        title: "Download the CAD files",
        body: "The same geometry in three formats. Units are millimetres. Longest edge defaults to about 300 mm — rescale when you know a real length.",
      },
    ],
    trust: "One photo in. CAD files out. Three free conversions to start.",
    bridge: "A number without a limiter is entertainment. A limiter without a plan is a cliff.",
    cta: { label: "Try it free", href: CONVERT_HREF },
  },

  useCases: {
    kicker: "Use cases",
    title: "Create CAD drawings of anything, in a minute",
    titleItalic: "anything",
    lead: "From patent drawings to portraits. From facades to fridge magnets.",
    more: { label: "See more examples", href: CONVERT_HREF },
    items: [
      {
        copy: "From a meeting recording to searchable notes — speakers, decisions, and action items.",
        link: "for Architecture",
        href: "/convert?sample=facade",
        before: useCaseAsset("architecture-before.webp"),
        after: useCaseAsset("architecture-after.webp"),
        beforeAlt: "Office atrium photograph",
        afterAlt: "CAD line drawing of the atrium",
        aspect: "4 / 3",
        imageLeft: true,
      },
      {
        copy: "Turn product shots into clean vectors for spec sheets, packaging, and CAD reference.",
        link: "for Industrial Design",
        href: "/convert?sample=product",
        before: useCaseAsset("product-before.webp"),
        after: useCaseAsset("product-after.webp"),
        beforeAlt: "Camera product photograph",
        afterAlt: "CAD line drawing of the camera",
        aspect: "1 / 1",
        imageLeft: false,
      },
      {
        copy: "Exploded views, cutaways, and figured drawings for patent filings — clean linework, no fills.",
        link: "for Patents and Design Rights",
        href: "/convert?sample=patents",
        before: useCaseAsset("patents-before.webp"),
        after: useCaseAsset("patents-after.webp"),
        beforeAlt: "Exploded product photograph",
        afterAlt: "CAD line drawing of the exploded view",
        aspect: "1 / 1",
        imageLeft: true,
      },
      {
        copy: "Runway and product photos become flat sketches for tech packs and decks.",
        link: "for Fashion Design",
        href: "/convert?sample=fashion",
        before: useCaseAsset("fashion-before.webp"),
        after: useCaseAsset("fashion-after.webp"),
        beforeAlt: "Fashion photograph",
        afterAlt: "CAD line drawing of the garment",
        aspect: "1 / 1",
        imageLeft: false,
      },
      {
        copy: "From a project photo to a vector — ready for laser cutting, CNC, or CAM.",
        link: "for Digital Fabrication",
        href: "/convert?sample=plans",
        before: useCaseAsset("plans-before.webp"),
        after: useCaseAsset("plans-after.webp"),
        beforeAlt: "Wooden puzzle photograph",
        afterAlt: "CAD line drawing of the puzzle",
        aspect: "3 / 4",
        imageLeft: true,
      },
      {
        copy: "Publication-ready linework of artifacts, reliefs, and decorative arts.",
        link: "for Cultural Artifacts",
        href: "/convert?sample=artifacts",
        before: useCaseAsset("artifacts-before.webp"),
        after: useCaseAsset("artifacts-after.webp"),
        beforeAlt: "Ceramic figure photograph",
        afterAlt: "CAD line drawing of the artifact",
        aspect: "3 / 4",
        imageLeft: false,
      },
      {
        copy: "Portraits, scenes, and crowds — every photo as clean vector line art.",
        link: "for Illustration",
        href: "/convert?sample=portrait",
        before: useCaseAsset("people-before.webp"),
        after: useCaseAsset("people-after.webp"),
        beforeAlt: "Portrait photograph",
        afterAlt: "CAD line drawing of the portrait",
        aspect: "3 / 4",
        imageLeft: true,
      },
    ],
  },

  three: {
    title: "Three outputs. That is the product.",
    cards: [
      {
        label: "Face rating",
        value: "0–100",
        body: "A single score from symmetry and proportion signals — the thing you can screenshot and come back to after a haircut.",
      },
      {
        label: "Strongest feature",
        value: "Named",
        body: "The region already carrying the face. Useful because it tells you what not to “fix.”",
      },
      {
        label: "Highest-leverage limiter",
        value: "Named · locked why",
        body: "The area where a small change would move the rating more than anywhere else. Free: the name. Full report: why it ranked first.",
      },
    ],
    footer: "This is face rating as diagnosis, not a leaderboard of strangers.",
  },

  /** User quotes — anonymized; stars + quote + author. Six cards, two rows. */
  usersSay: {
    kicker: "Testimonials",
    title: "What Our Users Say",
    titleItalic: "Our Users",
    lead: "Notes from people who used the tool on meetings, interviews, and videos.",
    footer: "Anonymized notes after transcripts — not lab demos.",
    items: [
      {
        rating: 5,
        title: "Meeting notes I can search.",
        quote:
          "I drop Zoom recordings into Video Transcriber and get speaker labels. Action items stay in the text instead of the audio.",
        name: "Alex R",
        role: "Product manager",
        avatar: "/users/1.webp",
      },
      {
        rating: 5,
        title: "Interviews with timestamps.",
        quote:
          "Interview audio becomes text I can quote. I jump back to the moment instead of scrubbing the file.",
        name: "Sofia T",
        role: "Journalist",
        avatar: "/users/4.webp",
      },
      {
        rating: 5,
        title: "Show notes without a second listen.",
        quote:
          "Podcast episodes become show notes and snippets. The transcript is searchable for the audience too.",
        name: "Lina R",
        role: "Podcaster",
        avatar: "/users/5.webp",
      },
      {
        rating: 5,
        title: "Voice memos become notes.",
        quote:
          "I record on a walk, then I get the text. I can search, edit, and share it.",
        name: "Jordan K",
        role: "Writer",
        avatar: "/users/7.webp",
      },
      {
        rating: 5,
        title: "Lectures I can review.",
        quote:
          "Course videos become a summary and a transcript. I can study without replaying hours.",
        name: "Chris N",
        role: "Student",
        avatar: "/users/8.webp",
      },
      {
        rating: 5,
        title: "YouTube without a download.",
        quote:
          "I paste a YouTube link. Video Transcriber transcribes the audio so I can research and caption from the text.",
        name: "Maya P",
        role: "Creator",
        avatar: "/users/9.webp",
      },
      {
        rating: 5,
        title: "Translation on the same run.",
        quote:
          "I needed English notes from a source file. It transcribed and translated without a second tool.",
        name: "Quinn H",
        role: "Researcher",
        avatar: "/users/1.webp",
      },
      {
        rating: 5,
        title: "Record, then text.",
        quote:
          "The Record audio tab is enough for a quick clip. The transcript lands in the same flow.",
        name: "Sam W",
        role: "Founder",
        avatar: "/users/4.webp",
      },
      {
        rating: 5,
        title: "Copy, download, share.",
        quote:
          "When Video Transcriber finishes, I copy the text or download a file. That is all I needed.",
        name: "Riley B",
        role: "Educator",
        avatar: "/users/5.webp",
      },
    ],
  },

  plan: {
    title: "A face rating should tell you what to do on Tuesday.",
    lead: "If the limiter is brow framing, the first move is not a generic glow-up list. The full report ranks actions by the same geometry that produced your face rating.",
    items: [
      { n: "1", title: "Your limiter", body: "Action hidden until checkout", locked: true, first: true },
      { n: "2", title: "Skin evenness", body: "Locked", locked: true, first: false },
      { n: "3", title: "Hair frame", body: "Locked", locked: true, first: false },
      { n: "4", title: "Contrast / color", body: "Locked", locked: true, first: false },
    ],
    caption: "Ranked for your scan. Not a shared template.",
  },

  pricing: {
    title: "Free answers “what’s my face rating?” Full answers “what now?”",
    freeTitle: "Free rating",
    freeItems: [
      { title: "On-device scan", body: "Landmarks and ratios stay in the browser." },
      { title: "Face rating 0–100", body: "The number you came for." },
      { title: "Strongest feature", body: "Named." },
      { title: "Limiter", body: "Named — not explained." },
    ],
    freeCta: { label: "Rate my face — free", href: FREE_TEST_HREF },
    paidTitle: "Full Face Report",
    price: PRICE,
    priceNote: PRICE_NOTE,
    paidItems: [
      { title: "What drove the score", body: "Written explanation of each region." },
      { title: "Region scores and ratios", body: "Unlocked readings, not a silhouette." },
      { title: "Limiter mechanism + first move", body: "Why it ranked first this week." },
      { title: "Styling + six hair try-ons", body: "On your photo." },
      { title: "72-hour + four-week plan", body: "Ranked, with effort and first-signal timing." },
      { title: "Web report + emailed PDF", body: "Yours to keep." },
    ],
    paidCta: { label: `Create my full report — ${PRICE} once`, href: FULL_REPORT_HREF },
    freeAnswers: "What did I get?",
    fullAnswers: "Why did I get it, and what should I do next?",
    freeAnswersLead: "The free face rating answers:",
    fullAnswersLead: "The full report answers:",
    guarantee: "7-day money-back · checkout email is for the PDF and saved report",
  },

  trust: {
    title: "The free face rating never needs a cloud.",
    body: "Free scans run in the browser. Your rating photo is not uploaded to get a number. Buying the report is an explicit permission to send the photo so the written analysis and previews can be built.",
    items: [
      {
        title: "On-device free scan",
        body: "The free face rating is computed locally. No account.",
      },
      {
        title: "Short timer on paid originals",
        body: "The upload used for the report is deleted on a short timer. We do not sell photos or use them to train models.",
      },
      {
        title: "7-day refund",
        body: "If the report is not useful, ask for the purchase back.",
      },
    ],
  },

  faq: {
    kicker: "FAQ",
    title: "Frequently Asked Questions",
    titleItalic: "Asked Questions",
    items: [
      {
        q: "What can I upload?",
        a: "Video Transcriber accepts 20+ audio and video formats, including MP3, WAV, M4A, MP4, and MOV. You can also paste a media link from YouTube, TikTok, Instagram, Facebook, X, Apple Podcasts, and other supported platforms, or record audio in the browser.",
      },
      {
        q: "What happens after speech is converted?",
        a: "You get a transcript you can copy, download, or share. Speaker recognition can label who said what. Translation and an AI summary are available on the same run when you need them.",
      },
      {
        q: "How many languages does it support?",
        a: "Video Transcriber supports 63 languages. Pick a language when you start, or let the system work from the audio you provide.",
      },
      {
        q: "Do I need to install software?",
        a: "No. It runs in the browser. File upload, paste link, and record audio all start on this page.",
      },
      {
        q: "Can it handle meetings with several people?",
        a: "Yes. Speaker recognition is built for meetings, interviews, and calls so you can see who spoke, not only what was said.",
      },
      {
        q: "What can I export?",
        a: "6 export formats so you can take the transcript into notes, captions, or a document. You can also copy the text directly.",
      },
      {
        q: "Does it work on a YouTube link?",
        a: "Yes. Paste the link in Paste link. Video Transcriber transcribes the audio without asking you to download the video first.",
      },
      {
        q: "Is this a live captioning studio?",
        a: "No. This page is for files, links, and a recorded clip you capture here. It is not a live-stream captioning desk.",
      },
    ],
  },

  cta: {
    kicker: "Get started",
    title: "Ready to transcribe?",
    titleItalic: "transcribe",
    body: "Upload a file, paste a link, or record audio. Video Transcriber writes the transcript so you can copy, download, or share it.",
    price: PRICE,
    primary: "Start transcribing",
    primaryHref: CONVERT_HREF,
    secondary: "See use cases",
    secondaryHref: "/#usecases",
    micro: "20+ formats · 63 languages · speaker labels · translation · AI summary.",
  },

  // Legacy keys still imported by product-mocks
  moreThan: {
    title: "",
    lead: "",
    lead2: "",
    body: "",
    scoreLabel: "Your Face Rating",
    score: "—",
    max: "100",
    strongestLabel: "Strongest Feature",
    strongest: "Unlocks on your photo",
    limiterLabel: "Main Limiter",
    limiter: "Unlocks on your photo",
    breakdownLabel: "Feature Breakdown",
    metrics: [
      { label: "Symmetry", score: "—" },
      { label: "Eyes", score: "—" },
      { label: "Proportions", score: "—" },
      { label: "Jawline", score: "—" },
    ],
    footer: "",
    cta: { label: "Rate my face — free", href: FREE_TEST_HREF },
  },
  reason: {
    title: "",
    body: "",
    steps: [
      { n: "1", title: "Detect", body: "A visible face and usable photo." },
      { n: "2", title: "Analyze", body: "Proportions become a face rating." },
      { n: "3", title: "Explain", body: "Strongest feature and limiter." },
    ],
    footer1: "",
    footer2: "",
  },
  wholeStory: {
    title: "",
    body: "",
    body2: "",
    body3: "",
    body4: "",
    body5: "",
    questions: ["What is my strongest feature?"],
    footer: "",
    examples: [
      {
        score: "—",
        strongest: "—",
        strongestScore: "—",
        limiter: "—",
        limiterScore: "—",
      },
    ],
  },
  limiter: {
    title: "",
    lead: "",
    lead2: "",
    badge: "LIMITER",
    name: "Named after your scan",
    score: "—",
    body: "The limiter is named on the free result. Why it ranked first unlocks in the report.",
    prompt: "",
    prompt2: "",
    points: [
      { title: "Why it matters", body: "Unlocks in the full report." },
      { title: "How it compares", body: "Unlocks in the full report." },
      { title: "What to focus on", body: "Unlocks in the full report." },
    ],
    footer: "",
    cta: { label: "Unlock the full report", href: FULL_REPORT_HREF },
  },
  priorities: {
    title: "",
    body: "",
    body2: "",
    body3: "",
    items: [
      { n: "1", title: "Framing", body: "Locked until analysis." },
      { n: "2", title: "Grooming", body: "Locked until analysis." },
      { n: "3", title: "Presentation", body: "Locked until analysis." },
    ],
    footer1: "",
    footer2: "",
    footer3: "",
  },
  action: {
    title: "",
    body: "",
    body2: "",
    quote: "",
    body3: "",
    body4: "",
    sequence: [
      { title: "Find the issue", body: "See which area deserves attention." },
      { title: "Understand the impact", body: "Learn why it moves the rating." },
      { title: "Know what to do next", body: "Practical first steps." },
    ],
    footer: "",
    cta: { label: "", href: FULL_REPORT_HREF },
  },
  result: {
    score: "—",
    max: "100",
    band: "",
    strongestLabel: "Strongest Feature",
    strongest: "—",
    strongestScore: "—",
    limiterLabel: "Main Limiter",
    limiter: "—",
    limiterScore: "—",
    metrics: [
      { label: "Symmetry", score: "—" },
      { label: "Eyes", score: "—" },
      { label: "Proportions", score: "—" },
      { label: "Jawline", score: "—" },
    ],
    viewFull: { label: "View full report", href: FULL_REPORT_HREF },
  },
  report: {
    kicker: "Face Report",
    title: "Full analysis",
    body: "",
    pillars: [
      { n: "1", title: "Decode", body: "See what drives your score." },
      { n: "2", title: "Prioritize", body: "Know what to focus on." },
      { n: "3", title: "Act", body: "Practical next steps." },
    ],
    price: PRICE,
    priceNote: PRICE_NOTE,
    cta: "Unlock the full report",
    guarantee: "7-day refund",
    harmonyTitle: "Harmony profile",
    harmonyHint: "Instrument — not a user result",
    harmony: [
      { label: "Symmetry", score: 0 },
      { label: "Golden", score: 0 },
      { label: "Thirds", score: 0 },
      { label: "Fifths", score: 0 },
      { label: "Eyes", score: 0 },
      { label: "Jaw", score: 0 },
    ],
  },
  freeTests: {
    kicker: "FREE TOOLS",
    title: "Access all free CAD conversion tools now.",
    titleItalic: "CAD conversion tools",
    lead: "Every conversion starts with 3 free runs. Upload a photo, sketch, logo, or scan and download DXF, SVG, and PDF.",
    moreLabel: "More vector tools",
    featured: [
      {
        title: "File upload",
        body: "The core path: any audio or video file into a searchable transcript you can copy or download.",
        cta: "Convert a photo",
        href: CONVERT_HREF,
      },
    ],
    more: [] as {
      title: string;
      body: string;
      cta: string;
      href: string;
    }[],
  },
  sample: { eyebrow: "", title: "", titleAccent: "", body: "" },
  transforms: {
    eyebrow: "AI Transformations",
    title: "Transform your look with AI",
    titleItalic: "with AI",
    body: "Optional AI image add-ons — preview a new hairstyle, a full glow-up, or a younger you, all generated on your own photo.",
    featured: {
      title: "Glow-Up Pack",
      tag: "Most complete",
      body: "Your fully polished self, plus four isolated upgrades — hairstyle, grooming, skin, and style — each generated on your own photo so you can see exactly what moves the needle.",
      cta: "Try Glow-Up",
      href: FULL_REPORT_HREF,
      before: "/face-rating/glow-up-pack-before.webp?v=5",
      after: "/face-rating/glow-up-pack-after.webp?v=5",
    },
    items: [
      {
        title: "Custom Studio",
        body: "Stack any combination — hair, color, facial hair, makeup, outfit, skin, age — and tweak as many times as you want.",
        cta: "Try it",
        href: FULL_REPORT_HREF,
        before: "/face-rating/custom-studio-before.webp?v=5",
        after: "/face-rating/custom-studio-after.webp?v=5",
      },
      {
        title: "Procedure Preview",
        body: "See yourself with a non-surgical treatment — lip filler, jaw filler, brow lift, rhinoplasty, more.",
        cta: "Try it",
        href: FULL_REPORT_HREF,
        before: "/face-rating/procedure-preview-before.webp?v=5",
        after: "/face-rating/procedure-preview-after.webp?v=5",
      },
      {
        title: "Hairstyle Pack",
        body: "6 hairstyles tailored to your structure — see the cut on your photo before you commit.",
        cta: "Try it",
        href: FULL_REPORT_HREF,
        before: "/face-rating/hairstyle-pack-before.webp?v=5",
        after: "/face-rating/hairstyle-pack-after.webp?v=5",
      },
      {
        title: "Time Machine",
        body: "See yourself 10 years younger and 10 years older from a single photo. Same identity, different age.",
        cta: "Try it",
        href: FULL_REPORT_HREF,
        before: "/face-rating/time-machine-before.webp?v=5",
        after: "/face-rating/time-machine-after.webp?v=5",
      },
    ],
  },

  guides: {
    kicker: "Learn more",
    title: "Evidence-based guides",
    titleItalic: "based guides",
    lead: "Beyond the numbers, here's what the research actually says — peer-reviewed sources, realistic timelines, and what doesn't work.",
    items: [
      {
        category: "Hairstyle",
        title: "Best hairstyles by facial structure",
        body: "A hairstyle guide covering oval, round, square, heart, diamond, and oblong — with men's and women's styles for each.",
        href: "/posts",
      },
      {
        category: "Glow up",
        title: "Science-backed glow up tips",
        body: "The complete guide: skincare routines, body composition targets, posture, hairstyle, and facial exercises — with specific timelines and percentages.",
        href: "/posts",
      },
      {
        category: "Eyewear",
        title: "Best glasses by facial structure",
        body: "Frames that flatter each structure type — round, square, heart, oval, diamond, and oblong, with picks for women and men.",
        href: "/posts",
      },
    ],
  },
} as const;
