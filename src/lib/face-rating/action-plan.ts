/**
 * Action Plan via Kie GPT-5.6 Luna — habits / skincare / training / products / outfits
 * driven by the scan's highest-ROI shortboards (leverage region).
 */

import type { StoredScanResult } from "./result-store";
import { estimateFaceShape, tierFromScore } from "./result-store";
import { gpt56Respond, parseJsonFromModelText } from "@/lib/kie/gpt-5-6";

export type ActionPlanJson = {
  objective: string;
  hours72: string[];
  actions: {
    title: string;
    why: string;
    do: string;
    effort: "low" | "med" | "high";
    cost: "free" | "$" | "$$";
    verify_by: string;
    category: "skincare" | "training" | "personal_care" | "outfit" | "habit";
  }[];
  routines: {
    am_skincare: string[];
    pm_skincare: string[];
    training_weekly: string[];
  };
  product_upgrades: {
    slot: string;
    suggestion: string;
    why: string;
  }[];
  outfit_rules: string[];
  schedule: {
    phase: string;
    focus: string;
    items: string[];
  }[];
};

export const ACTION_PLAN_SYSTEM_PROMPT = `You write the Action Plan for a paid Face Rating report.

What this chapter IS:
A practical plan to upgrade daily habits, outfit choices, skincare routine, training/posture habits, and personal-care products — based on front-photo face measurements.

What this chapter is NOT:
- Not a photography tutorial
- Not a hairstyle/glasses/makeup try-on guide (those live in Style Studio cards)
- Not medical advice, surgery, or guaranteed score increases

PRIMARY INPUT is the leverage/lowest score region (shortboard). Put energy where ROI is highest.
- ≥3 of 4 actions must directly compensate that limiter.
- Do NOT output generic wellness advice that would fit any user with any scores.
- Strength regions must not receive Week-1 upgrade actions.
- Secondary gaps may get at most one supporting action.

Use the scan only to prioritize:
- If lower face / jaw is weaker → posture, neck, jaw tension habits, sleep
- If skin-related presentation matters / composite mid → skincare + SPF consistency targeting the weak read
- If midface/nose reads as limiter on front photo → outfit contrast & neckline choices that balance the face (no nose exercises / no projection drills)
- If overall harmony is mid → simple product upgrades tied to the limiter + weekly routine adherence

Style studio visual cards may already exist — treat them as optional visual reference; do NOT rewrite those cards in prose. At most one light mention is allowed.

OUTPUT a prioritized habit-and-product plan in JSON only (no markdown outside JSON):

{
  "objective": "1 sentence: what daily system we upgrade and why (cite limiter score/region)",
  "hours72": ["3 immediate habit/product steps aimed at the limiter"],
  "actions": [
    {
      "title": "verb-led habit or product upgrade",
      "why": "tied to the limiter or one secondary gap",
      "do": "concrete routine or shopping swap with a clear done-state",
      "effort": "low"|"med"|"high",
      "cost": "free"|"$"|"$$",
      "verify_by": "when + how user knows it helped",
      "category": "skincare"|"training"|"personal_care"|"outfit"|"habit"
    }
  ],
  "routines": {
    "am_skincare": ["3–5 steps, general non-medical, still relevant to limiter"],
    "pm_skincare": ["3–5 steps"],
    "training_weekly": ["4–6 realistic items"]
  },
  "product_upgrades": [
    { "slot": "cleanser|spf|moisturizer|lip|other", "suggestion": "product TYPE not hard-sell brand", "why": "links to limiter" }
  ],
  "outfit_rules": [
    "3–5 rules tied to face shape and/or limiter presentation"
  ],
  "schedule": [
    { "phase": "Week 1", "focus": "...", "items": ["...", "..."] },
    { "phase": "Week 2–3", "focus": "...", "items": ["...", "..."] },
    { "phase": "Week 4", "focus": "...", "items": ["...", "..."] }
  ]
}

Rules:
- actions: exactly 4; ideally one each of skincare, training/habit, personal_care, outfit when possible
- At most ONE mention of progress photos / re-scan in the whole plan
- English, direct, premium, non-judgmental
- No generic filler like "stay hydrated" unless it clearly serves the limiter`;

export type ScanPlanSummary = {
  composite: number;
  tierName: string;
  faceShape: string;
  components: StoredScanResult["components"];
  featureSymmetry?: StoredScanResult["detail"] extends infer D
    ? D extends { featureSymmetry?: infer F }
      ? F
      : undefined
    : undefined;
  goldenRatio?: number;
  thirds?: { upper: number; middle: number; lower: number };
  standout: { label: string; score: number };
  leverage: { label: string; score: number };
  rankedFeatures: { label: string; score: number }[];
};

export function buildScanPlanSummary(scan: StoredScanResult): ScanPlanSummary {
  const c = scan.components;
  const fs = scan.detail?.featureSymmetry;
  const tier = tierFromScore(scan.score);
  const faceShape =
    scan.faceShape || estimateFaceShape(scan.detail?.goldenRatio ?? 1.2);

  const rankedFeatures = [
    { label: "Nose symmetry", score: fs?.nose ?? Math.round(c.symmetry * 0.9) },
    { label: "Eyebrow symmetry", score: fs?.eyebrow ?? Math.round(c.symmetry * 0.88) },
    { label: "Eye symmetry", score: fs?.eye ?? Math.round(c.symmetry * 0.95) },
    { label: "Mouth symmetry", score: fs?.mouth ?? Math.round(c.symmetry * 0.88) },
    { label: "Jaw symmetry", score: fs?.jaw ?? Math.round(c.symmetry * 0.9) },
    { label: "Facial fifths", score: c.fifths },
    { label: "Facial thirds", score: c.thirds },
    { label: "Golden ratio", score: c.golden },
    { label: "Overall symmetry", score: c.symmetry },
  ].sort((a, b) => b.score - a.score);

  const standout = rankedFeatures[0];
  const leverage = [...rankedFeatures].sort((a, b) => a.score - b.score)[0];

  return {
    composite: scan.score,
    tierName: tier.name,
    faceShape,
    components: c,
    featureSymmetry: fs,
    goldenRatio: scan.detail?.goldenRatio,
    thirds: scan.detail?.thirds,
    standout,
    leverage,
    rankedFeatures,
  };
}

export function buildActionPlanUserPrompt(summary: ScanPlanSummary): string {
  const fs = summary.featureSymmetry;
  return `Scan summary (front photo only):
PRIMARY LIMITER (highest ROI — plan must focus here):
- ${summary.leverage.label}: ${summary.leverage.score}/100

SECONDARY GAPS (at most one supporting action):
${summary.rankedFeatures
  .filter((f) => f.label !== summary.leverage.label && f.score <= summary.leverage.score + 12)
  .slice(0, 3)
  .map((f) => `- ${f.label}: ${f.score}/100`)
  .join("\n") || "- (none close)"}

STRENGTHS (do NOT spend Week-1 upgrade energy here):
${summary.rankedFeatures
  .filter((f) => f.score >= 78)
  .slice(0, 4)
  .map((f) => `- ${f.label}: ${f.score}/100`)
  .join("\n") || "- (none above 78)"}

CONTEXT:
- composite: ${summary.composite}/100 (${summary.tierName})
- faceShape: ${summary.faceShape}
- components: symmetry ${summary.components.symmetry}, thirds ${summary.components.thirds}, fifths ${summary.components.fifths}, golden ${summary.components.golden}
- featureSymmetry: eye ${fs?.eye ?? "n/a"}, brow ${fs?.eyebrow ?? "n/a"}, nose ${fs?.nose ?? "n/a"}, mouth ${fs?.mouth ?? "n/a"}, jaw ${fs?.jaw ?? "n/a"}
- goldenRatio: ${summary.goldenRatio ?? "n/a"}
- Style studio cards may exist for skin/features/color/glasses/hair/makeup (visual only)

Write the Action Plan JSON now. Put energy on the limiter.`;
}

export async function generateActionPlanWithGpt56(
  scan: StoredScanResult
): Promise<ActionPlanJson> {
  const summary = buildScanPlanSummary(scan);
  // Kie /codex input examples use user messages; fold system rules into one user turn
  const { text } = await gpt56Respond({
    model: "gpt-5-6-luna",
    reasoningEffort: "low",
    input: [
      {
        role: "user",
        content: `${ACTION_PLAN_SYSTEM_PROMPT}\n\n---\n\n${buildActionPlanUserPrompt(summary)}`,
      },
    ],
  });

  const plan = parseJsonFromModelText<ActionPlanJson>(text);
  validateActionPlan(plan);
  return plan;
}

function validateActionPlan(plan: ActionPlanJson) {
  if (!plan?.objective || !Array.isArray(plan.actions) || plan.actions.length < 3) {
    throw new Error("Invalid action plan shape from model");
  }
  if (!Array.isArray(plan.hours72) || plan.hours72.length < 2) {
    throw new Error("Action plan missing hours72");
  }
  if (!plan.routines?.am_skincare?.length || !plan.schedule?.length) {
    throw new Error("Action plan missing routines/schedule");
  }
}
