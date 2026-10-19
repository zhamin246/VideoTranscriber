/**
 * SEO copy for /facebook-transcript-generator.
 * Primary keyword: Facebook Transcript Generator (natural use, no density target).
 * Scope: supported public facebook.com / fb.watch links — not private or login-walled video.
 */

export const FACEBOOK_TRANSCRIPT_GENERATOR_HREF = "/facebook-transcript-generator";

export type FacebookLinkPanelCopy = {
  title: string;
  description: string;
  placeholder: string;
  button: string;
  helper: string;
};

export const facebookTranscriptGeneratorSeo = {
  meta: {
    title: "Facebook Transcript Generator – Transcribe Facebook Videos",
    description:
      "Use our Facebook Transcript Generator to turn supported public Facebook videos into searchable text. Review transcripts, create AI notes, and export text or subtitle files.",
  },
  hero: {
    h1: "Facebook Transcript Generator",
    subtitle:
      "Our Facebook Transcript Generator turns supported public videos into searchable text.\nPaste a link, review the speech, then export or add notes in the workspace.",
    chips: [
      { label: "Facebook Video Transcription", color: "#1877F2" },
      { label: "Searchable Transcripts", color: "#60A5FA" },
      { label: "AI Notes and Summaries", color: "#8882F5" },
      { label: "Text and Subtitle Export", color: "#38BDF8" },
    ],
  },
  linkPanel: {
    title: "Transcribe a Facebook Video",
    description:
      "Paste a supported public Facebook video link to generate a transcript. Some videos may not be accessible because of privacy settings, login requirements, regional restrictions, or unavailable content.",
    placeholder: "Paste a Facebook video URL",
    button: "Generate Transcript",
    helper:
      "Works with supported public links. Availability depends on whether the video can be accessed and processed.",
  } satisfies FacebookLinkPanelCopy,
  how: {
    title: "How to Transcribe a Facebook Video",
    lead: "Create a text version of a supported Facebook video in a few simple steps. Once your transcript is ready, review the content and use the workspace tools to organize or export it.",
    steps: [
      {
        n: "1",
        title: "Copy a Public Facebook Video Link",
        body: "Find the Facebook video you want to transcribe and copy its link. The video must be publicly accessible and supported by the service. Private posts and links requiring additional access may not work.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/facebook-step-1.webp",
      },
      {
        n: "2",
        title: "Generate the Video Transcript",
        body: "Submit the supported link and let the transcription system process the available speech. Processing time and quality depend on video accessibility, audio clarity, language support, and recording length.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/facebook-step-2.webp",
      },
      {
        n: "3",
        title: "Review and Use Your Transcript",
        body: "Read and search the generated text, review important details, and use available AI tools to create notes or organize ideas. Export the transcript in a supported format when you are ready to use it elsewhere.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/howtouse/facebook-step-3.webp",
      },
    ],
  },
  features: {
    title: "What You Can Do with Your Facebook Transcript",
    lead: "A transcript is more than a written copy of a video. Use the workspace to find information, organize ideas, and turn spoken content into material you can study, reference, or reuse.",
    rows: [
      {
        title: "Search and Review Video Transcripts",
        body: "Turn spoken content into searchable text that is easier to review than a full video. Find relevant information, check important passages, and use speaker labels where available to follow conversations more easily.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/facebook-feature-1-link.webp",
        alt: "Search and review a Facebook video transcript",
        imageRight: true,
      },
      {
        title: "Create AI Notes and Key Points",
        body: "Use available AI tools to summarize long discussions, identify key takeaways, create study notes, and organize content into chapters. Ask AI questions about your transcript or create a mind map when these features are available in your workspace.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/facebook-feature-2-summary.webp",
        alt: "AI notes and summaries from a Facebook transcript",
        imageRight: false,
      },
      {
        title: "Export Text and Subtitle Files",
        body: "Save your transcript in supported formats such as TXT, DOCX, SRT, VTT, or CSV. Use text files for research and documentation, or use subtitle files in compatible editing workflows.",
        src: "https://cdn.videotranscriber.pro/videotranscriber/landing/features/facebook-feature-3-export.webp",
        alt: "Export Facebook transcript as TXT, DOCX, SRT, VTT, or CSV",
        imageRight: true,
      },
    ],
  },
  usecases: {
    title: "Who Can Benefit from Facebook Transcripts?",
    lead: "From educational videos to interviews and social discussions, a transcript makes spoken information easier to revisit.",
    items: [
      {
        title: "Study and Learning",
        body: "Turn educational videos and tutorials into searchable study material. Review explanations, collect key points, and create notes that help you revisit important concepts.",
      },
      {
        title: "Research and Interviews",
        body: "Review interviews, public discussions, and recorded conversations more efficiently. Search the transcript for relevant statements and organize information for research or reference.",
      },
      {
        title: "Social Media Content",
        body: "Review spoken content from supported public Facebook videos and Reels. Use transcripts to understand a video's message, collect ideas, or prepare notes for your own content.",
      },
      {
        title: "Content Repurposing",
        body: "Reuse spoken ideas as a starting point for outlines, summaries, captions, or written content. Review the original transcript before publishing to preserve context and meaning.",
      },
      {
        title: "Marketing and Competitor Research",
        body: "Analyze accessible public videos to understand messaging, recurring topics, and audience-facing explanations. Organize useful observations without repeatedly watching the same material.",
      },
      {
        title: "Personal Reference",
        body: "Keep a searchable text record of useful public video content. Find information faster when you need to revisit a particular explanation or remember a specific point.",
      },
    ],
  },
  testimonials: {
    title: "What Our Users Say",
    lead: "Use searchable transcripts to review spoken content, organize information, and spend less time searching through long videos.",
  },
  faq: {
    title: "Facebook Transcript Generator FAQ",
    items: [
      {
        q: "What is a Facebook Transcript Generator?",
        a: "A Facebook Transcript Generator converts speech from a supported Facebook video into text. You can use the transcript to review discussions, search for information, create notes, or export text for later reference.",
      },
      {
        q: "How do I transcribe a Facebook video?",
        a: "Copy the link to a supported public Facebook video, paste it into the tool, and start transcription. When processing is complete, review the generated transcript and use the available workspace features to organize or export the text.",
      },
      {
        q: "Can I transcribe Facebook Reels?",
        a: "Supported public Facebook Reels may be transcribed when the link and video are accessible to the service. Some Reels may fail because of privacy settings, access restrictions, regional availability, or changes to the original video.",
      },
      {
        q: "Can I transcribe a private Facebook video?",
        a: "Private videos and content that requires permissions or a logged-in account may not be accessible. The tool works with supported links that it can retrieve and process; having a Facebook URL does not guarantee that the video can be transcribed.",
      },
      {
        q: "Why is my Facebook video link not working?",
        a: "A link may fail if the video is private, removed, restricted by region, unavailable without login, or unsupported. Check that the video is publicly accessible and that you copied the correct URL, then try again if the content is available.",
      },
      {
        q: "Can I download a Facebook transcript?",
        a: "You can export a transcript in the formats supported by the workspace. Available options may include TXT, DOCX, SRT, VTT, or CSV. Check the export options displayed for your transcript to confirm which formats are available.",
      },
      {
        q: "Can I use a transcript to create subtitles?",
        a: "If subtitle export is available for your transcript, you can download a supported format such as SRT or VTT and use it in compatible video editing or subtitle tools. Review timing and text before publishing, as corrections may be needed.",
      },
      {
        q: "Can AI summarize a Facebook video transcript?",
        a: "Where AI tools are available, you can use the transcript to generate summaries, key points, study notes, or chapters. Ask AI can help you explore the transcript, but you should verify important details against the original content.",
      },
      {
        q: "Is the Facebook Transcript Generator free?",
        a: "Available usage and limits depend on the current plan. Check the Pricing page for the latest information about free usage, processing limits, and paid features.",
      },
      {
        q: "Is the transcript always accurate?",
        a: "No automated transcript is guaranteed to be perfect. Audio quality, background noise, accents, overlapping speech, and language support can affect the result. Review names, numbers, quotations, and other important details before relying on the transcript.",
      },
    ],
  },
  cta: {
    title: "Ready to Transcribe a Facebook Video?",
    body: "Turn a supported public Facebook video into searchable text you can review, organize, and reuse. Generate your transcript, explore available AI tools, and export the result for your next project.",
    button: "Transcribe Facebook Video",
  },
} as const;
