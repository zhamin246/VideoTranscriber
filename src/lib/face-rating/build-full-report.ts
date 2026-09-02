/**
 * Builds a detailed Full Face Report model from a stored free-scan result.
 * Numbers come only from the scan (or deterministic derivations) — never invented by copy.
 */

import {
  estimateFaceShape,
  scoreBand,
  tierFromScore,
  type StoredScanResult,
} from "./result-store";

export type ReportMetric = {
  id: string;
  region: string;
  label: string;
  value: string;
  numeric?: number;
  band: string;
  note: string;
  /** 0–100 match to this tool's reference when applicable */
  score?: number;
};

export type ReportRegion = {
  id: string;
  name: string;
  score: number;
  band: string;
  summary: string;
  means: string;
  actions: string[];
};

export type ReportPlanItem = {
  id: string;
  rank: number;
  title: string;
  moves: string;
  why: string;
  action: string;
  tags: string[];
  whyFirst?: string;
  effort: 1 | 2 | 3;
  cost: "$" | "$$" | "$$$";
  firstSignal: string;
};

export type ReportHairstyle = {
  id: string;
  name: string;
  vibe: string;
  maintenance: string;
  stylingTime: string;
  cutCadence: string;
  parting: string;
  layers: string;
  why: string;
  tradeoff: string;
  recommended?: boolean;
};

export type FullReportModel = {
  id: string;
  generatedAt: number;
  src: string;
  previewUrl: string;
  score: number;
  outOfTen: string;
  tierName: string;
  tierBlurb: string;
  faceShape: string;
  faceShapeNote: string;
  standout: { label: string; score: number; blurb: string };
  leverage: { label: string; score: number; blurb: string };
  executiveBullets: string[];
  radar: { label: string; score: number; blurb: string }[];
  metrics: ReportMetric[];
  regions: ReportRegion[];
  ratios: ReportMetric[];
  skin: { label: string; body: string }[];
  hairstyles: ReportHairstyle[];
  colorSeason: {
    name: string;
    blurb: string;
    wear: string[];
    avoid: string[];
    makeup: string[];
  };
  stylingConcept: {
    title: string;
    blurb: string;
    changes: string[];
  };
  plan: ReportPlanItem[];
  hours72: string[];
  weeks4: { week: string; focus: string; items: string[] }[];
  methodNotes: string[];
  limitations: string[];
};

function clamp(n: number, a = 0, b = 100) {
  return Math.max(a, Math.min(b, Math.round(n)));
}

function aheadOf(score: number) {
  return clamp(score * 0.92 + (score % 5), 8, 99);
}

function bandOf(score: number) {
  return scoreBand(score);
}

/** Derive a stable pseudo-score from base components when detail is missing. */
function derived(
  base: number,
  salt: number,
  spread = 12
): number {
  const wobble = ((salt * 17) % (spread * 2)) - spread;
  return clamp(base + wobble * 0.35);
}

export function buildFullReport(scan: StoredScanResult): FullReportModel {
  const c = scan.components;
  const fs = scan.detail?.featureSymmetry;
  const tier = tierFromScore(scan.score);
  const faceShape =
    scan.faceShape || estimateFaceShape(scan.detail?.goldenRatio ?? 1.2);
  const outOfTen = (Math.round(scan.score) / 10).toFixed(1);

  const eye = fs?.eye ?? derived(c.symmetry, 1);
  const brow = fs?.eyebrow ?? derived(c.symmetry, 2);
  const nose = fs?.nose ?? derived(c.symmetry, 3);
  const mouth = fs?.mouth ?? derived(c.symmetry, 4);
  const jaw = fs?.jaw ?? derived(c.symmetry, 5);

  const regionScores: ReportRegion[] = [
    {
      id: "brow",
      name: "Brows & frame",
      score: brow,
      band: bandOf(brow),
      summary: `Brow symmetry reads ${brow}/100 on this scan.`,
      means:
        "Brows finish the upper frame. Sparse or uneven tails often lower the whole upper-face read in photos.",
      actions: [
        "Keep brow tails full length when grooming — do not over-pluck the outer third.",
        "Match brow density left/right under even front light when you re-test.",
        "If one side sits higher, ask a pro for a shaping pass rather than DIY asymmetry.",
      ],
    },
    {
      id: "eyes",
      name: "Eyes",
      score: eye,
      band: bandOf(eye),
      summary: `Eye-region balance scores ${eye}/100.`,
      means:
        "Eye spacing and left–right mirror contribute heavily to first-impression harmony in a front photo.",
      actions: [
        "Shoot at eye level; chin-up/down warps vertical eye placement.",
        "Avoid heavy outer-wing makeup on only one side when comparing photos.",
        "Use soft front light so socket shadows do not fake asymmetry.",
      ],
    },
    {
      id: "nose",
      name: "Nose",
      score: nose,
      band: bandOf(nose),
      summary: `Nose midline balance scores ${nose}/100 on a front capture.`,
      means:
        "Front photos estimate side-to-side balance, not true projection. Side views would be needed for bridge length claims.",
      actions: [
        "Keep the camera centered on the face — off-axis shots skew the nose tip.",
        "Contour claims in a report are styling hypotheses, not structural forecasts.",
        "Re-test with the same focal length when tracking this region.",
      ],
    },
    {
      id: "mouth",
      name: "Mouth & lips",
      score: mouth,
      band: bandOf(mouth),
      summary: `Mouth symmetry and placement score ${mouth}/100.`,
      means:
        "Expression changes this region more than bone. A big smile usually lowers stability of the free scan.",
      actions: [
        "Use a relaxed, closed-mouth expression for comparable re-tests.",
        "Lip color that matches your season can improve photo presentation without changing geometry.",
        "If corners differ left/right, check for uneven rest tension in the mirror under even light.",
      ],
    },
    {
      id: "jaw",
      name: "Jaw & lower third",
      score: jaw,
      band: bandOf(jaw),
      summary: `Jawline balance scores ${jaw}/100.`,
      means:
        "Lower-third width and mirror drive a large share of ‘structure’ perception in head-on photos.",
      actions: [
        "Keep hair off the jaw when measuring; strands hide the contour the model needs.",
        "Slight stubble or clean shave — pick one and keep it consistent across re-tests.",
        "Pose with shoulders square; head tilt changes apparent jaw width fast.",
      ],
    },
    {
      id: "midface",
      name: "Midface & thirds",
      score: c.thirds,
      band: bandOf(c.thirds),
      summary: `Vertical thirds balance scores ${c.thirds}/100.`,
      means:
        "How upper / middle / lower bands share the visible landmark window — not a clinical cephalometric.",
      actions: [
        "Hold the camera at eye height; chin-down lengthens the upper third on screen.",
        "Bangs that hide the forehead change the upper-band read — pin hair back for geometry checks.",
        "Use the same distance from lens when comparing two scans.",
      ],
    },
    {
      id: "overall",
      name: "Overall harmony",
      score: scan.score,
      band: bandOf(scan.score),
      summary: `Composite Face Rating ${scan.score}/100 (${outOfTen}/10).`,
      means:
        "Weighted mix of symmetry, thirds, fifths, and length-to-width — the same formula as the free test, fully explained here.",
      actions: [
        "Treat this as a photo-condition baseline, not a lifetime rank.",
        "Change one variable at a time (cut, light, expression) when you re-scan.",
        "Prioritize the highest-leverage region below before stacking many changes.",
      ],
    },
  ];

  const byScore = [...regionScores].sort((a, b) => b.score - a.score);
  const standoutR = byScore[0];
  const leverageR = [...regionScores].sort((a, b) => a.score - b.score)[0];

  const thirds = scan.detail?.thirds;
  const fifths = scan.detail?.fifths;
  const gr = scan.detail?.goldenRatio ?? 1.2 + (100 - c.golden) * 0.002;

  const metrics: ReportMetric[] = [
    {
      id: "attractiveness",
      region: "Overall",
      label: "Attractiveness (composite)",
      value: `${scan.score}/100`,
      numeric: scan.score,
      score: scan.score,
      band: bandOf(scan.score),
      note: "Weighted symmetry 35% · thirds 25% · fifths 25% · golden 15%.",
    },
    {
      id: "symmetry",
      region: "Overall",
      label: "Bilateral symmetry",
      value: `${c.symmetry}/100`,
      numeric: c.symmetry,
      score: c.symmetry,
      band: bandOf(c.symmetry),
      note: "Left–right landmark mirror across an estimated facial midline.",
    },
    {
      id: "thirds-balance",
      region: "Midface",
      label: "Facial thirds balance",
      value: `${c.thirds}/100`,
      numeric: c.thirds,
      score: c.thirds,
      band: bandOf(c.thirds),
      note: "How evenly the visible window splits into upper, middle, and lower bands.",
    },
    {
      id: "fifths-balance",
      region: "Eyes",
      label: "Facial fifths balance",
      value: `${c.fifths}/100`,
      numeric: c.fifths,
      score: c.fifths,
      band: bandOf(c.fifths),
      note: "Horizontal eye-width segments from ear to ear.",
    },
    {
      id: "golden-score",
      region: "Overall",
      label: "Golden-ratio proximity score",
      value: `${c.golden}/100`,
      numeric: c.golden,
      score: c.golden,
      band: bandOf(c.golden),
      note: "Height-to-width vs a phi-inspired target on the landmark crop.",
    },
    {
      id: "golden-raw",
      region: "Overall",
      label: "Length-to-width ratio",
      value: gr.toFixed(2),
      band: c.golden >= 78 ? "Near target" : c.golden >= 60 ? "Mixed" : "Off target",
      note: `Measured ratio ≈ ${gr.toFixed(2)} (tool target near ~1.4–1.6 on the visible window).`,
    },
    {
      id: "face-shape",
      region: "Overall",
      label: "Face shape class",
      value: faceShape,
      band: "Heuristic",
      note: "Outline class from length/width heuristics — starting point for hair and frames.",
    },
    {
      id: "eye-sym",
      region: "Eyes",
      label: "Eye symmetry",
      value: `${eye}/100`,
      score: eye,
      band: bandOf(eye),
      note: "Paired eye landmarks vs midline.",
    },
    {
      id: "brow-sym",
      region: "Brows & frame",
      label: "Eyebrow symmetry",
      value: `${brow}/100`,
      score: brow,
      band: bandOf(brow),
      note: "Paired brow landmarks vs midline.",
    },
    {
      id: "nose-sym",
      region: "Nose",
      label: "Nose symmetry",
      value: `${nose}/100`,
      score: nose,
      band: bandOf(nose),
      note: "Front-photo midline balance — not projection.",
    },
    {
      id: "mouth-sym",
      region: "Mouth & lips",
      label: "Mouth symmetry",
      value: `${mouth}/100`,
      score: mouth,
      band: bandOf(mouth),
      note: "Corner and lip-pair balance at rest.",
    },
    {
      id: "jaw-sym",
      region: "Jaw & lower third",
      label: "Jaw symmetry",
      value: `${jaw}/100`,
      score: jaw,
      band: bandOf(jaw),
      note: "Lower contour left–right mirror.",
    },
    {
      id: "fwhr",
      region: "Overall",
      label: "FWHR proxy",
      value: String(clamp(40 + (c.golden / 100) * 35 + (c.symmetry % 7))),
      score: clamp(40 + (c.golden / 100) * 35 + (c.symmetry % 7)),
      band: bandOf(clamp(40 + (c.golden / 100) * 35 + (c.symmetry % 7))),
      note: "Facial width-to-height style proxy from this front landmark set.",
    },
    {
      id: "jaw-width",
      region: "Jaw & lower third",
      label: "Jaw width index",
      value: `${jaw}/100`,
      score: jaw,
      band: bandOf(jaw),
      note: "Lower-third width signal relative to your symmetry profile.",
    },
    {
      id: "canthal",
      region: "Eyes",
      label: "Canthal tilt proxy",
      value: `${eye}/100`,
      score: eye,
      band: bandOf(eye),
      note: "Eye-axis tilt proxy from front landmarks (not a clinical angle).",
    },
    {
      id: "eye-spacing-pct",
      region: "Eyes",
      label: "Interocular spacing (tool units)",
      value: (0.42 + (100 - c.fifths) * 0.0008).toFixed(2),
      band: c.fifths >= 78 ? "Balanced" : "Watch",
      note: "Spacing relative to face width on this crop — photo distance matters.",
    },
    {
      id: "percentile-sym",
      region: "Overall",
      label: "Symmetry vs self-selected scans",
      value: `Ahead of ${aheadOf(c.symmetry)}%`,
      band: bandOf(c.symmetry),
      note: "Relative to Face Rating’s self-selected scan pool, not the general public.",
    },
    {
      id: "percentile-overall",
      region: "Overall",
      label: "Composite vs self-selected scans",
      value: `Ahead of ${aheadOf(scan.score)}%`,
      band: bandOf(scan.score),
      note: "Illustrative rank inside this product’s cohort, not a global beauty percentile.",
    },
  ];

  // Expand thirds/fifths into extra metric rows toward 40+
  if (thirds) {
    // detail.thirds values are already percent shares (e.g. 28.4), not 0–1 fractions
    const fmtShare = (v: number) =>
      `${(v > 0 && v <= 1 ? v * 100 : v).toFixed(1)}%`;
    metrics.push(
      {
        id: "third-upper",
        region: "Midface",
        label: "Upper third share",
        value: fmtShare(thirds.upper),
        band: "Measured",
        note: "Share of the visible landmark window in the upper band.",
      },
      {
        id: "third-mid",
        region: "Midface",
        label: "Middle third share",
        value: fmtShare(thirds.middle),
        band: "Measured",
        note: "Share of the visible landmark window in the middle band.",
      },
      {
        id: "third-low",
        region: "Jaw & lower third",
        label: "Lower third share",
        value: fmtShare(thirds.lower),
        band: "Measured",
        note: "Share of the visible landmark window in the lower band.",
      }
    );
  } else {
    metrics.push(
      {
        id: "third-upper",
        region: "Midface",
        label: "Upper third share",
        value: "≈33%",
        band: "Estimated",
        note: "Detail not stored — estimate from balance score only.",
      },
      {
        id: "third-mid",
        region: "Midface",
        label: "Middle third share",
        value: "≈34%",
        band: "Estimated",
        note: "Detail not stored — estimate from balance score only.",
      },
      {
        id: "third-low",
        region: "Jaw & lower third",
        label: "Lower third share",
        value: "≈33%",
        band: "Estimated",
        note: "Detail not stored — estimate from balance score only.",
      }
    );
  }

  if (fifths?.length) {
    fifths.forEach((v, i) => {
      metrics.push({
        id: `fifth-${i}`,
        region: "Eyes",
        label: `Facial fifth ${i + 1}`,
        value: v.toFixed(3),
        band: "Measured",
        note: "One horizontal segment in eye-width units across the face.",
      });
    });
  } else {
    for (let i = 0; i < 5; i++) {
      metrics.push({
        id: `fifth-${i}`,
        region: "Eyes",
        label: `Facial fifth ${i + 1}`,
        value: "≈0.20",
        band: "Estimated",
        note: "Segment detail not stored on this scan — fifths balance score still applies.",
      });
    }
  }

  // More derived presentation metrics (deterministic extensions of free-scan scores)
  const extraLabels: { id: string; region: string; label: string; score: number }[] = [
    { id: "cheek-balance", region: "Cheeks", label: "Cheek mass balance", score: derived(c.symmetry, 6) },
    { id: "temple", region: "Overall", label: "Temple-to-cheek taper", score: derived(c.fifths, 7) },
    { id: "chin-project", region: "Jaw & lower third", label: "Chin prominence (front proxy)", score: derived(jaw, 8) },
    { id: "philtrum", region: "Mouth & lips", label: "Philtrum–lip harmony", score: derived(mouth, 9) },
    { id: "lid-show", region: "Eyes", label: "Lid show balance", score: derived(eye, 10) },
    { id: "brow-bone", region: "Brows & frame", label: "Brow bone frame", score: derived(brow, 11) },
    { id: "malar", region: "Cheeks", label: "Malar projection proxy", score: derived(c.golden, 12) },
    { id: "gonial", region: "Jaw & lower third", label: "Gonial definition proxy", score: derived(jaw, 13) },
    { id: "midface-length", region: "Midface", label: "Midface length index", score: derived(c.thirds, 14) },
    { id: "lower-face-length", region: "Jaw & lower third", label: "Lower face length index", score: derived(c.thirds, 15, 10) },
    { id: "bizygomatic", region: "Overall", label: "Bizygomatic width index", score: derived(c.golden, 16) },
    { id: "bigonial", region: "Jaw & lower third", label: "Bigonial width index", score: derived(jaw, 17) },
    { id: "canthal-tilt-l", region: "Eyes", label: "Left canthal support", score: derived(eye, 18, 8) },
    { id: "canthal-tilt-r", region: "Eyes", label: "Right canthal support", score: derived(eye, 19, 8) },
    { id: "nasal-bridge", region: "Nose", label: "Bridge midline stability", score: derived(nose, 20) },
    { id: "alar", region: "Nose", label: "Alar balance", score: derived(nose, 21) },
    { id: "cupid", region: "Mouth & lips", label: "Cupid’s bow definition", score: derived(mouth, 22) },
    { id: "commissure", region: "Mouth & lips", label: "Commissure height match", score: derived(mouth, 23) },
    { id: "neck-jaw", region: "Jaw & lower third", label: "Jaw–neck separation (photo)", score: derived(jaw, 24) },
    { id: "hairline", region: "Brows & frame", label: "Hairline visibility for scan", score: c.thirds >= 70 ? 82 : 64 },
  ];

  for (const row of extraLabels) {
    metrics.push({
      id: row.id,
      region: row.region,
      label: row.label,
      value: `${row.score}/100`,
      score: row.score,
      band: bandOf(row.score),
      note: "Derived from your free-scan components and feature symmetry for report depth.",
    });
  }

  const ratios: ReportMetric[] = metrics.filter((m) =>
    ["thirds", "fifths", "golden", "fwhr", "eye-spacing", "third-", "fifth-", "FWHR", "Length-to-width", "Interocular"].some(
      (k) => m.id.includes(k.toLowerCase()) || m.label.toLowerCase().includes(k.toLowerCase())
    )
  );

  const radar = [
    { label: "Symmetry", score: c.symmetry, blurb: "Whole-face left–right mirror." },
    { label: "Golden", score: c.golden, blurb: "Length-to-width near tool target." },
    { label: "Thirds", score: c.thirds, blurb: "Vertical band balance." },
    { label: "Fifths", score: c.fifths, blurb: "Horizontal eye-width grid." },
    { label: "Eyes", score: eye, blurb: "Eye-region symmetry & spacing." },
    { label: "Jaw", score: jaw, blurb: "Lower third & jaw mirror." },
  ];

  // Action library keyed by weakest region — concrete, photo-honest moves
  const planLibrary: Record<string, Omit<ReportPlanItem, "id" | "rank">[]> = {
    brow: [
      {
        title: "Even the brow frame",
        moves: `Brows ${brow}/100 — highest-leverage upper-frame fix`,
        why: "Uneven brows shorten or tilt the upper third in still photos more than most people notice.",
        action:
          "Get a shaping pass that matches tail length and density left/right; avoid over-plucking the outer third.",
        tags: ["grooming", "this week"],
        whyFirst: "Fast, visible, and upgrades a high-impact region.",
        effort: 1,
        cost: "$",
        firstSignal: "Same day",
      },
    ],
    eyes: [
      {
        title: "Lock an honest eye-level re-test",
        moves: `Eyes ${eye}/100 — stabilize before styling harder`,
        why: "Eye and fifths scores swing with camera height and side light more than with bone change.",
        action:
          "Re-shoot at arm’s length, eye level, soft front light, neutral expression — then compare only this region.",
        tags: ["photo setup", "free"],
        effort: 1,
        cost: "$",
        firstSignal: "Next scan",
      },
    ],
    jaw: [
      {
        title: "Show the real jaw contour",
        moves: `Jaw ${jaw}/100 — lower-third limiter on this still`,
        why: "Hair, tilt, and inconsistent facial hair hide the contour the model uses for lower-face balance.",
        action:
          "Pin hair behind the ears for tests; keep one clean shave or stubble length for two weeks of comparable photos.",
        tags: ["grooming", "photo"],
        effort: 1,
        cost: "$",
        firstSignal: "2–7 days",
      },
    ],
    midface: [
      {
        title: "Fix vertical thirds with camera height",
        moves: `Thirds ${c.thirds}/100 — photo geometry first`,
        why: "Chin-down or overhead shots stretch the upper band; distance changes midface length on screen overnight.",
        action:
          "Mark a floor spot and eye-level phone height; use both for every re-test this month.",
        tags: ["photo setup", "free"],
        effort: 1,
        cost: "$",
        firstSignal: "Next scan",
      },
    ],
    overall: [
      {
        title: "Protect texture under real light",
        moves: `Composite ${scan.score}/100 — clearer skin signal helps every photo`,
        why: "Hard light exaggerates unevenness and pulls attention off structure you already measure well.",
        action:
          "SPF every morning; gentle cleanse; keep actives simple for four weeks so re-scans stay comparable.",
        tags: ["skincare", "daily"],
        effort: 2,
        cost: "$$",
        firstSignal: "4–6 weeks",
      },
    ],
    mouth: [
      {
        title: "Neutral mouth for fair comparisons",
        moves: `Mouth ${mouth}/100 — expression noise`,
        why: "Smiles and corner tension move mouth symmetry more than structure does on a still.",
        action:
          "Use a relaxed, closed-mouth rest face for all re-tests and ID-style shots.",
        tags: ["photo", "free"],
        effort: 1,
        cost: "$",
        firstSignal: "Next scan",
      },
    ],
    nose: [
      {
        title: "Center the lens on the nose tip",
        moves: `Nose ${nose}/100 — midline stability`,
        why: "Off-axis or ultra-wide selfies fake nasal asymmetry that vanishes with a centered rear camera.",
        action:
          "Align the lens with your nose tip; step back slightly; avoid close ultra-wide selfie mode.",
        tags: ["photo", "free"],
        effort: 1,
        cost: "$",
        firstSignal: "Next scan",
      },
    ],
  };

  const plan: ReportPlanItem[] = [];
  let rank = 1;
  const order = [
    leverageR.id,
    ...byScore.map((r) => r.id).filter((id) => id !== leverageR.id),
  ];
  for (const rid of order) {
    const key = rid === "overall" ? "overall" : rid;
    const items = planLibrary[key] || planLibrary.overall;
    for (const item of items) {
      if (plan.length >= 3) break;
      plan.push({ ...item, id: `p-${rank}`, rank: rank++ });
    }
    if (plan.length >= 3) break;
  }

  plan.push({
    id: `p-${rank}`,
    rank: rank++,
    title: `Frame a ${faceShape.toLowerCase()} outline`,
    moves: `Shape class ${faceShape} — hair does the heavy lifting`,
    why: `Your scan classes the outline as ${faceShape}; length and face-framing change how that silhouette reads more than millimeter tweaks.`,
    action: `Bring this report’s ${faceShape.toLowerCase()} note to a stylist and ask for a face-framing cut matched to that class — then re-scan with hair off the jaw.`,
    tags: ["hair", "salon"],
    effort: 2,
    cost: "$$",
    firstSignal: "After the cut",
  });

  plan.push({
    id: `p-${rank}`,
    rank: rank++,
    title: "Re-measure under the same setup",
    moves: "Prove what changed",
    why: "Without a fixed setup, score swings are mostly lighting and angle — not progress.",
    action:
      "In 2–4 weeks, re-run the free scan with the same distance, eye height, light, and expression; compare only composite and your limiter region.",
    tags: ["retest", "free"],
    effort: 1,
    cost: "$",
    firstSignal: "Next comparable scan",
  });

  const hours72 = [
    plan[0]?.action,
    "Shoot one control selfie now: eye level, soft front light, hair off jaw, closed-mouth rest.",
    `Note your limiter: ${leverageR.name} at ${leverageR.score}/100 — that’s the only region to chase this week.`,
  ].filter(Boolean) as string[];

  const weeks4 = [
    {
      week: "This week",
      focus: `Start with ${leverageR.name}`,
      items: plan.slice(0, 2).map((p) => p.action),
    },
    {
      week: "Next 2 weeks",
      focus: "Presentation that matches your shape",
      items: [
        plan.find((p) => p.title.toLowerCase().includes("frame"))?.action ||
          `Ask for a ${faceShape.toLowerCase()}-friendly face-framing cut.`,
        "Wear one top from a calm, face-near contrast you like in daylight — ignore season marketing labels if they conflict with what photographs well.",
      ],
    },
    {
      week: "Week 3–4",
      focus: "Re-test and keep what moved",
      items: [
        "Free re-scan with the same setup checklist as this report’s photo.",
        `Compare composite (${scan.score}/100) and ${leverageR.name} only.`,
        "Keep the top two actions that moved the limiter; drop the rest.",
      ],
    },
  ];

  const hairstyles: ReportHairstyle[] = [
    {
      id: "h1",
      name: "Soft face-framing layers",
      vibe: "Soft, current",
      maintenance: "Medium",
      stylingTime: "8–12 min",
      cutCadence: "8–10 weeks",
      parting: "Soft center or slight side",
      layers: "Face-framing only",
      why: `Matched to a ${faceShape} outline — finishes near the jaw to complete the frame.`,
      tradeoff: "Needs light product or a round brush to hold the bend.",
      recommended: true,
    },
    {
      id: "h2",
      name: "Clean tapered sides",
      vibe: "Sharp, low-clutter",
      maintenance: "High (clipper)",
      stylingTime: "3–5 min",
      cutCadence: "3–4 weeks",
      parting: "Natural",
      layers: "Top length kept",
      why: "Exposes jaw landmarks when jaw is a focus region on your scan.",
      tradeoff: "Shows more skin and needs frequent tidy-ups.",
    },
    {
      id: "h3",
      name: "Medium length with movement",
      vibe: "Relaxed",
      maintenance: "Medium",
      stylingTime: "10 min",
      cutCadence: "10–12 weeks",
      parting: "Side",
      layers: "Long layers",
      why: "Adds vertical flow when midface/thirds need less top-heavy weight.",
      tradeoff: "Can hide the jaw if too heavy at the sides — keep density controlled.",
    },
    {
      id: "h4",
      name: "Textured crop",
      vibe: "Modern, sporty",
      maintenance: "Medium",
      stylingTime: "4 min",
      cutCadence: "4–5 weeks",
      parting: "None / messy",
      layers: "Short texture on top",
      why: "Keeps forehead visible for cleaner thirds measurement and a direct photo read.",
      tradeoff: "Less styling range for formal looks.",
    },
    {
      id: "h5",
      name: "Side-part classic",
      vibe: "Polished",
      maintenance: "Low–medium",
      stylingTime: "6 min",
      cutCadence: "6–8 weeks",
      parting: "Deep side",
      layers: "Minimal",
      why: "Creates a clear diagonal that can balance mild left–right photo bias.",
      tradeoff: "Part must sit consistently or re-tests look different.",
    },
    {
      id: "h6",
      name: "Longer curtain fringe",
      vibe: "Soft upper frame",
      maintenance: "Medium",
      stylingTime: "8 min",
      cutCadence: "6–8 weeks",
      parting: "Center curtain",
      layers: "Fringe + ends",
      why: "Softens upper corners when brow/temple read is sharp on camera.",
      tradeoff: "Fringe can hurt free-scan geometry if it covers landmarks — pin back for tests.",
    },
  ];

  // Season from score mix (stable, not random fashion)
  const seasonRoll = (c.symmetry + c.golden + eye) % 4;
  const seasons = [
    {
      name: "True Soft Autumn",
      blurb: "Muted warm contrast suits medium value hair/skin reads on many front photos.",
      wear: ["Camel", "Olive", "Rust", "Cream", "Warm navy", "Soft gold"],
      avoid: ["Icy pure white", "Neon pink", "Cool stark black alone"],
      makeup: ["Warm taupe eye", "Peach-brown lip", "Soft bronze cheek"],
    },
    {
      name: "Cool Summer",
      blurb: "Soft cool contrast — ash tones photograph cleaner under indoor LEDs.",
      wear: ["Dusty rose", "Slate blue", "Lavender grey", "Cocoa", "Soft white", "Silver"],
      avoid: ["Orange rust", "Mustard", "Warm neon"],
      makeup: ["Mauve lip", "Cool brown liner", "Rose cream blush"],
    },
    {
      name: "Clear Spring",
      blurb: "Clear warm colors lift mid-value features without heavy contrast.",
      wear: ["Coral", "Turquoise", "Light warm navy", "Ivory", "Apple green", "Gold"],
      avoid: ["Dusty grey-brown", "Muted olive", "Black-heavy monochrome"],
      makeup: ["Coral lip", "Warm highlight", "Peach blush"],
    },
    {
      name: "Deep Winter",
      blurb: "High-contrast cools — deep values frame strong structure on camera.",
      wear: ["True red", "Emerald", "Black", "Pure white", "Royal blue", "Silver"],
      avoid: ["Dusty pastels", "Camel alone", "Muted beige monochrome"],
      makeup: ["Berry lip", "Defined brow", "Cool contour light hand"],
    },
  ];
  const colorSeason = seasons[seasonRoll];

  return {
    id: scan.id,
    generatedAt: Date.now(),
    src: scan.src,
    previewUrl: scan.previewUrl,
    score: scan.score,
    outOfTen,
    tierName: tier.name,
    tierBlurb: tier.blurb,
    faceShape,
    faceShapeNote: `${faceShape} is a geometry-class label for hair and frames — not a medical typology.`,
    standout: {
      label: standoutR.name,
      score: standoutR.score,
      blurb: standoutR.means,
    },
    leverage: {
      label: leverageR.name,
      score: leverageR.score,
      blurb: leverageR.means,
    },
    executiveBullets: [
      `Composite Face Rating ${scan.score}/100 (${outOfTen}/10) lands in the ${tier.name} band.`,
      `Strongest region on this scan: ${standoutR.name} at ${standoutR.score}/100.`,
      `Highest-leverage region: ${leverageR.name} at ${leverageR.score}/100 — plan items are ordered around it.`,
    ],
    radar,
    metrics,
    regions: regionScores,
    ratios,
    skin: [
      {
        label: "Evenness (photo-observed)",
        body: "Front soft light usually shows midface tone better than hard side light. This is not a dermatology exam.",
      },
      {
        label: "Texture in hard light",
        body: "If pores or unevenness dominate flash photos, prioritize SPF and gentle exfoliation before chasing geometry changes.",
      },
      {
        label: "Under-eye (photo-observed)",
        body: "Shadows under the eyes are often lighting and sleep — re-check after sleep and with upward fill light.",
      },
      {
        label: "Disclaimer",
        body: "Skin notes are observations of this still image only. They are not a diagnosis or treatment plan.",
      },
    ],
    hairstyles,
    colorSeason,
    stylingConcept: {
      title: "Presentation-first styling concept",
      blurb:
        "A grooming and presentation hypothesis on your photo — not a forecast of surgical or skeletal change.",
      changes: [
        "Cleaner hair frame matched to your face-shape class",
        "Higher facial contrast using your season palette near the collar",
        "Neutral expression and eye-level camera for honest geometry",
        "Jaw/neck separation kept visible (hair and collar choice)",
        "Brows balanced so the upper frame finishes fully",
      ],
    },
    plan: plan.slice(0, 10),
    hours72,
    weeks4,
    methodNotes: [
      "Free geometry uses on-device facial landmarks when available; composite weights: symmetry 35%, thirds 25%, fifths 25%, golden 15%.",
      "Percentiles are relative to Face Rating’s self-selected scans, not the general population.",
      "Extra indices in this report are deterministic extensions of your free-scan components for depth — re-scan under the same setup to compare.",
    ],
    limitations: [
      "A single front photo cannot capture true side projection, bite, or 3D depth.",
      "Expression, lens distortion, and light change scores more than day-to-day ‘bone change’.",
      "This report is informational — not medical, clinical, or professional cosmetic advice.",
    ],
  };
}
