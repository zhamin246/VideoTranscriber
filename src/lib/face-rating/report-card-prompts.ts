/**
 * Prompts for GPT Image 2 analysis-card generations (Kie image-to-image).
 * Always pair with the user's original photo as input_urls identity reference.
 */

export const SKIN_ANALYSIS_CARD_PROMPT = `Use my uploaded photo as the exact identity reference.

Keep my real face, skin tone, hair, beard, expression, facial structure, and overall appearance consistent. Do not change my face or make me look like another person.

Create a detailed Korean clinic-style skin analysis report using my photo.

Design style:
Calm beige aesthetic, premium editorial report, warm paper texture, rounded cards, soft shadows, thin connector lines, subtle botanical doodles, clean typography, minimal icons, visual-first layout.

Main layout:
Use one large centered portrait of me. Add subtle face-zone markers and thin connector lines.

Analyze these zones:
- Forehead
- Under eyes
- Cheeks
- Nose / T-zone
- Beard area or jaw area

For each zone, give 2-3 short visual observations based on my actual photo.

Also include:
- Skin type result
- Texture score
- Tone score
- Pores score
- Hydration score
- Glow score
- AM routine
- PM routine

Routine should be general and non-medical.

Make it look like a premium AI skin report, detailed but easy to read.`;

export const FEATURES_ANALYSIS_CARD_PROMPT = `Use my uploaded photo as the exact identity reference.

Keep my real face, skin tone, hair, beard, expression, facial structure, and overall appearance consistent. Do not change my face or make me look like another person.

Create a premium face features analysis report using my photo.

Design style:
Calm beige aesthetic, Korean clinic-style report, warm paper texture, rounded info cards, soft shadows, thin arrows, subtle botanical doodles, clean typography, minimal icons, visual-first layout.

Main layout:
Place one large centered portrait of me. Add thin arrows or connector lines pointing to each facial feature.

Analyze and label:
- Face shape
- Eyes
- Eyebrows
- Nose
- Cheeks
- Lips
- Jawline

For each feature:
- Add a short label
- Add 2-3 short observations based on my actual face

Also include:
An "Overall Impression" card summarizing my facial structure, proportions, and strongest features.

Make it detailed, premium, clean, and easy to read.`;

export const COLOR_ANALYSIS_CARD_PROMPT = `Use my uploaded photo as the exact identity reference.

Keep my real face, skin tone, hair, beard, expression, facial structure, and overall appearance consistent. Do not change my face or make me look like another person.

Create a personal color analysis report using my photo.

Analyze my visible skin tone, hair color, beard color, contrast level, and overall appearance.

Design style:
Calm beige aesthetic, premium editorial report, warm paper texture, rounded cards, soft shadows, color swatches, clean typography, minimal icons, visual-first layout.

Include:
- My color season or palette result
- Best colors for me
- Colors to avoid
- Outfit color suggestions
- Why these colors suit me
- Color swatches with clear labels

Also show:
- One "Best" outfit color example using my same face
- One "Avoid" outfit color example using my same face

Keep the face consistent in every image. Make the report visual, premium, and easy to understand.`;

export const GLASSES_GUIDE_CARD_PROMPT = `Use my uploaded photo as the exact identity reference.

Keep my real face, skin tone, hair, beard, expression, facial structure, and overall appearance consistent. Do not change my face or make me look like another person.

Create a premium spectacles guide using my photo.

Analyze my face shape, facial width, brow strength, nose bridge, jawline, and overall proportions.

Design style:
Calm beige aesthetic, premium editorial report, warm paper texture, rounded cards, soft shadows, thin dividers, subtle botanical doodles, clean typography, minimal icons, visual-first layout.

Include:
- Face shape result
- Best frame shapes
- Frames to avoid
- Best frame width
- Best bridge style
- Best frame colors
- Why each frame works or does not work

Show visual try-on examples using my same face:

Best frames:
- Square acetate
- Browline classic
- Rectangle thin
- Round metal

Frames to avoid:
- Tiny oval
- Oversized square
- Heavy wrap
- Small round

Add a "Best specs formula" card with practical buying tips.

Keep my face consistent in every try-on card.`;

export const HAIR_ANALYSIS_CARD_PROMPT = `Use my uploaded photo as the exact identity reference.

Keep my real face, skin tone, eye shape, nose, lips, facial structure, expression, and overall likeness consistent in every panel. Do not turn me into another person.

CRITICAL — hair MUST change in the style examples:
- Keep my face identity locked.
- Do NOT keep the same hairstyle across cards.
- In every Best / Avoid try-on panel, change the hairstyle clearly and obviously.
- Each labeled style must be visually distinct from the others: different length and/or layers and/or fringe and/or volume and/or parting.
- Do NOT output eight nearly identical long wavy hairstyles with only tiny differences.
- Match recommendations to what the photo already suggests (gender presentation, current length range, texture). If the photo shows long/medium-long hair, do not recommend men's barber fades, buzz cuts, quiffs, or undercuts.

Create a premium hairstyle analysis report using my photo.

Design style:
Calm beige aesthetic, Korean salon-style report, warm paper texture, rounded cards, soft shadows, subtle botanical doodles, clean typography, minimal icons, visual-first layout.

Include:
- Hair type result
- Hair texture
- Hair density
- Face shape compatibility
- Best hairstyles
- Hairstyles to avoid
- Salon / stylist instructions
- Product suggestions suited to the detected texture

Main portrait:
One large centered portrait of me with my current hair (or lightly refined current hair).

Then show a clear try-on grid using my same face:

Best styles — must look different from each other:
- Soft face-framing layers (longer length kept)
- Curtain bangs with mid-length waves
- Long layers with more crown volume / movement
- Side-part sleek blowout

Avoid styles — must look different from Best and from each other:
- Tight slick bun that exposes too much forehead
- Chin-length blunt bob
- Severe center part with flat, lifeless hair
- Heavy straight bangs covering the brows

Add a "Salon Instructions" card with:
- How much length to keep or cut
- Layering guidance
- Fringe / parting suggestion
- Styling product suggestion

Make every Best/Avoid thumbnail a real hairstyle change on my face, premium, clean, readable, and easy to tell apart at a glance.
If two panels look similar, regenerate with stronger contrast in cut, fringe, and silhouette until each label is unmistakable.`;

export const MAKEUP_ANALYSIS_CARD_PROMPT = `Use my uploaded photo as the exact identity reference.

Keep my real face, skin tone, hair, expression, facial structure, and overall appearance consistent. Do not change my face or make me look like another person.

Create a visual makeup analysis graphic using this portrait. Feature side-by-side comparisons to determine which makeup best suits the subject, and showcase their skin undertone. The graphic should be visual-first, using only short labels with no paragraphs.

Design style:
Calm beige aesthetic, premium editorial report, warm paper texture, rounded cards, soft shadows, clean typography, minimal icons, visual-first layout.`;

export type ReportCardKind =
  | "skin"
  | "features"
  | "color"
  | "glasses"
  | "hair"
  | "makeup";

export const REPORT_CARD_KINDS: ReportCardKind[] = [
  "skin",
  "features",
  "color",
  "glasses",
  "hair",
  "makeup",
];

export const REPORT_CARD_META: Record<
  ReportCardKind,
  {
    navLabel: string;
    sectionId: string;
    kicker: string;
    titleBefore: string;
    titleEm: string;
    blurb: string;
    alt: string;
    loading: string;
    aspect_ratio: "4:5" | "3:4" | "1:1";
  }
> = {
  skin: {
    navLabel: "Skin",
    sectionId: "report-skin",
    kicker: "Style studio · Skin",
    titleBefore: "Skincare",
    titleEm: "analysis",
    blurb:
      "A clinic-style report card generated from your photo — visual observations only, not a medical diagnosis.",
    alt: "AI skincare analysis report card based on your photo",
    loading: "Building your skincare analysis card…",
    aspect_ratio: "4:5",
  },
  features: {
    navLabel: "Features",
    sectionId: "report-features",
    kicker: "Style studio · Features",
    titleBefore: "Face features",
    titleEm: "analysis",
    blurb:
      "Feature-by-feature observations from your portrait — a visual map of shape, eyes, brows, nose, cheeks, lips, and jaw.",
    alt: "AI face features analysis report card based on your photo",
    loading: "Mapping your facial features…",
    aspect_ratio: "4:5",
  },
  color: {
    navLabel: "Color",
    sectionId: "report-color",
    kicker: "Style studio · Color",
    titleBefore: "Personal color",
    titleEm: "analysis",
    blurb:
      "Season and palette suggestions from your visible skin, hair, and contrast — with best / avoid outfit color examples.",
    alt: "AI personal color analysis report card based on your photo",
    loading: "Building your color palette card…",
    aspect_ratio: "4:5",
  },
  glasses: {
    navLabel: "Glasses",
    sectionId: "report-glasses",
    kicker: "Style studio · Glasses",
    titleBefore: "Spectacles",
    titleEm: "guide",
    blurb:
      "Frame shapes to try and avoid, with try-on style cards that keep your face consistent.",
    alt: "AI spectacles guide report card based on your photo",
    loading: "Fitting frame recommendations…",
    aspect_ratio: "4:5",
  },
  hair: {
    navLabel: "Hair",
    sectionId: "report-hair",
    kicker: "Style studio · Hair",
    titleBefore: "Hairstyle",
    titleEm: "analysis",
    blurb:
      "Hair type, best / avoid styles, and barber-ready notes generated from your portrait.",
    alt: "AI hairstyle analysis report card based on your photo",
    loading: "Building your hairstyle analysis card…",
    aspect_ratio: "4:5",
  },
  makeup: {
    navLabel: "Makeup",
    sectionId: "report-makeup",
    kicker: "Style studio · Makeup",
    titleBefore: "Makeup",
    titleEm: "analysis",
    blurb:
      "Visual-first makeup comparisons and undertone cues — short labels only, not a full tutorial essay.",
    alt: "AI makeup analysis graphic based on your photo",
    loading: "Composing your makeup analysis graphic…",
    aspect_ratio: "4:5",
  },
};

export function isReportCardKind(v: string): v is ReportCardKind {
  return (REPORT_CARD_KINDS as string[]).includes(v);
}

export function promptForReportCard(kind: ReportCardKind): string {
  switch (kind) {
    case "skin":
      return SKIN_ANALYSIS_CARD_PROMPT;
    case "features":
      return FEATURES_ANALYSIS_CARD_PROMPT;
    case "color":
      return COLOR_ANALYSIS_CARD_PROMPT;
    case "glasses":
      return GLASSES_GUIDE_CARD_PROMPT;
    case "hair":
      return HAIR_ANALYSIS_CARD_PROMPT;
    case "makeup":
      return MAKEUP_ANALYSIS_CARD_PROMPT;
    default:
      return SKIN_ANALYSIS_CARD_PROMPT;
  }
}
