/**
 * Face shape classification used by attractiveness scoring.
 * Uses length/width plus forehead · cheek · jaw width profile when landmarks exist.
 */

export type LandmarkLike = { x: number; y: number; z?: number };

export type FaceShapeName =
  | "Oval"
  | "Round"
  | "Square"
  | "Heart"
  | "Oblong"
  | "Diamond";

export type FaceShapeAnalysis = {
  primary: FaceShapeName;
  secondary: FaceShapeName | null;
  borderline: boolean;
  blurb: string;
  description: string;
  /** mesh height / width (visible upper-forehead to chin) */
  heightToWidth: number;
  /** Relative widths with cheekbones normalized to 100 */
  foreheadRel: number;
  cheekRel: number;
  jawRel: number;
  jawAngleDeg: number;
  /** Free teaser styles shown as pills */
  recommend: string[];
  /** Locked styles hinted in full report */
  recommendLocked: string[];
  avoid: string[];
  celebrity: string;
  celebrityMore: number;
  color: string;
};

const SHAPE_META: Record<
  FaceShapeName,
  {
    blurb: string;
    description: string;
    recommend: string[];
    recommendLocked: string[];
    avoid: string[];
    celebrity: string;
    celebrityMore: number;
    color: string;
  }
> = {
  Oval: {
    blurb: "Balanced length with a gently tapered jaw — a flexible base for most styles.",
    description:
      "Face length sits a bit above width, with soft transitions from forehead to chin. No single width band dominates the outline.",
    recommend: ["Soft layers at the cheek", "Center or side parts"],
    recommendLocked: ["Medium curtain fringe", "Chin-skimming lobs", "Face-framing highlights"],
    avoid: ["Heavy bulk at one width only", "Extreme boxy cuts", "Styles that over-elongate"],
    celebrity: "Zendaya",
    celebrityMore: 2,
    color: "#9F1239",
  },
  Round: {
    blurb: "Face width and length are nearly equal, with full cheeks and a rounded jawline. Soft, youthful appearance.",
    description:
      "Face width and length are nearly equal, with full cheeks and a rounded jawline. Soft, youthful appearance.",
    recommend: ["Long layers past the chin", "Side parts"],
    recommendLocked: ["Height at the crown", "Angular fringe", "Shoulder-length waves"],
    avoid: ["Chin-length bobs", "Heavy rounded bangs", "Styles that add width at the cheeks"],
    celebrity: "Chrissy Teigen",
    celebrityMore: 2,
    color: "#9F1239",
  },
  Square: {
    blurb: "Strong jaw angles with a shorter length-to-width outline.",
    description:
      "Forehead, cheeks, and jaw sit in a similar width band, with a more angular jawline. Soft texture balances the outline.",
    recommend: ["Soft waves past the jaw", "Side-swept fringe"],
    recommendLocked: ["Layered mid-length", "Rounder frame shapes", "Curtain bangs"],
    avoid: ["Blunt chin-length bobs", "Heavy top volume only", "Styles that square the jaw further"],
    celebrity: "Olivia Wilde",
    celebrityMore: 2,
    color: "#881337",
  },
  Heart: {
    blurb: "Wider upper face with a narrower chin — top-heavy silhouette in the photo crop.",
    description:
      "Forehead or cheek width reads wider than the jaw, with a tapered chin. Mid-volume styles often feel proportional.",
    recommend: ["Chin-skimming length", "Soft side volume"],
    recommendLocked: ["Wispy bangs", "Shoulder waves", "Low side parts"],
    avoid: ["Extra temple width", "Very short crops only", "Heavy top-heavy volume"],
    celebrity: "Reese Witherspoon",
    celebrityMore: 2,
    color: "#9F1239",
  },
  Oblong: {
    blurb: "Noticeably longer than wide — vertical emphasis dominates the crop.",
    description:
      "Face length clearly exceeds width. Side volume and shorter fringe can shorten the visual vertical line.",
    recommend: ["Side volume at cheeks", "Soft fringe or bangs"],
    recommendLocked: ["Horizontal waves", "Chin-to-shoulder length", "Layered bob with width"],
    avoid: ["Extra length only", "Center-part long straight", "Styles that stretch the face further"],
    celebrity: "Sarah Jessica Parker",
    celebrityMore: 2,
    color: "#881337",
  },
  Diamond: {
    blurb: "Cheekbones are the widest point, with a narrower forehead and jaw.",
    description:
      "Midface width leads the outline, with a more tapered forehead and jaw. Soft framing around the cheeks balances the read.",
    recommend: ["Chin-length softness", "Side-swept fringe"],
    recommendLocked: ["Collarbone layers", "Soft curtain bangs", "Medium waves"],
    avoid: ["Width only at the cheek", "Very short top", "Styles that emphasize midface width"],
    celebrity: "Rihanna",
    celebrityMore: 2,
    color: "#9F1239",
  },
};

function dist(
  a: LandmarkLike,
  b: LandmarkLike,
  imageWidth: number,
  imageHeight: number
): number {
  const dx = (a.x - b.x) * imageWidth;
  const dy = (a.y - b.y) * imageHeight;
  return Math.sqrt(dx * dx + dy * dy);
}

function angleDeg(
  a: LandmarkLike,
  vertex: LandmarkLike,
  c: LandmarkLike,
  imageWidth: number,
  imageHeight: number
): number {
  const v1x = (a.x - vertex.x) * imageWidth;
  const v1y = (a.y - vertex.y) * imageHeight;
  const v2x = (c.x - vertex.x) * imageWidth;
  const v2y = (c.y - vertex.y) * imageHeight;
  const n1 = Math.hypot(v1x, v1y) || 1;
  const n2 = Math.hypot(v2x, v2y) || 1;
  const cos = Math.max(-1, Math.min(1, (v1x * v2x + v1y * v2y) / (n1 * n2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/**
 * MediaPipe landmark 10 sits below the true hairline, so raw mesh H/W runs
 * ~5–8% short vs a salon “hairline-to-chin” oval read. Classification uses
 * this compensated ratio; the UI still reports the raw mesh ratio.
 */
export const MESH_HW_HAIRLINE_FACTOR = 1.07;

export function effectiveHeightToWidth(meshHw: number): number {
  return Math.round(meshHw * MESH_HW_HAIRLINE_FACTOR * 100) / 100;
}

/**
 * Score face-shape classes from mesh metrics.
 *
 * - Jaw points often sit inward → mild jawRel ~80–90 is common on Oval/Round.
 * - Soft jaw alone must not force Round when length clearly exceeds width (Oval).
 * - Heart needs a strong upper→jaw taper, not mild MediaPipe jaw narrowing.
 */
function pickPrimaryFromProfile(
  /** Hairline-compensated H/W for classification */
  heightToWidth: number,
  foreheadRel: number,
  jawRel: number,
  jawAngleDeg: number
): { primary: FaceShapeName; secondary: FaceShapeName | null; borderline: boolean } {
  const scores: Record<FaceShapeName, number> = {
    Oval: 0,
    Round: 0,
    Square: 0,
    Heart: 0,
    Oblong: 0,
    Diamond: 0,
  };

  const foreVsJaw = foreheadRel - jawRel;
  const cheekVsJaw = 100 - jawRel;
  const softJaw = jawAngleDeg >= 130;
  const sharpJaw = jawAngleDeg <= 125;
  /** Truly short after hairline compensation */
  const compactFace = heightToWidth < 1.16;
  /** Classic oval length band */
  const ovalLength =
    heightToWidth >= 1.18 && heightToWidth < 1.38;
  /** Gentle chin taper (egg shape), not a pointed heart chin */
  const gentleTaper = jawRel >= 82 && jawRel <= 96 && foreVsJaw >= 4 && foreVsJaw < 22;
  const fullJaw = jawRel >= 92;

  // —— Length / width (primary silhouette) ——
  if (heightToWidth >= 1.42) {
    scores.Oblong += 3.5;
  } else if (heightToWidth >= 1.32) {
    scores.Oval += 3.2;
    scores.Oblong += 0.8;
  } else if (heightToWidth >= 1.22) {
    scores.Oval += 3.0;
    scores.Round += 0.6;
  } else if (heightToWidth >= 1.16) {
    // Contested Oval / Round zone after compensation (raw ~1.08–1.14)
    scores.Oval += 2.4;
    scores.Round += 1.6;
  } else if (heightToWidth >= 1.1) {
    scores.Round += 2.8;
    scores.Square += 1.4;
    scores.Oval += 0.8;
  } else {
    scores.Square += 2.8;
    scores.Round += 2.0;
  }

  // —— Soft vs angular jaw (context-dependent) ——
  if (sharpJaw) {
    scores.Square += 2.4;
  } else if (softJaw) {
    // Soft jaw on a longer/oval silhouette → Oval; on a compact face → Round
    if (ovalLength || (heightToWidth >= 1.16 && gentleTaper)) {
      scores.Oval += 1.8;
      scores.Round += 0.4;
    } else if (compactFace && fullJaw) {
      scores.Round += 2.0;
    } else if (compactFace) {
      scores.Round += 1.2;
    } else {
      scores.Oval += 1.0;
      scores.Round += 0.8;
    }
  }
  if (jawAngleDeg >= 145 && compactFace && fullJaw) {
    scores.Round += 0.8;
  }

  // —— Width bands (cheek = 100) ——
  if (Math.abs(foreheadRel - 100) <= 10 && jawRel >= 78 && jawRel <= 108) {
    if (sharpJaw) {
      scores.Square += 2;
    } else if (gentleTaper && heightToWidth >= 1.16) {
      scores.Oval += 2.2;
    } else if (compactFace && fullJaw) {
      scores.Round += 1.8;
    } else if (ovalLength) {
      scores.Oval += 1.6;
    } else {
      scores.Round += 1.0;
    }
  }

  // Balanced egg: forehead ≈ cheeks, jaw slightly narrower, enough length
  if (
    Math.abs(foreheadRel - 100) <= 8 &&
    jawRel >= 84 &&
    jawRel <= 97 &&
    heightToWidth >= 1.17
  ) {
    scores.Oval += 2.0;
  }

  // Diamond: cheeks widest, forehead + jaw both clearly narrower
  if (foreheadRel <= 90 && jawRel <= 88 && cheekVsJaw >= 12) {
    scores.Diamond += 2.5;
  }

  // Heart: strong upper→jaw taper only
  const strongHeartTaper =
    (foreVsJaw >= 24 && jawRel <= 78) ||
    (foreVsJaw >= 20 && jawRel <= 72) ||
    (foreheadRel >= 105 && jawRel <= 75);
  if (strongHeartTaper) {
    scores.Heart += 4.5;
    scores.Round -= 1.2;
    scores.Oval -= 0.6;
  } else if (foreVsJaw >= 18 && jawRel <= 80 && heightToWidth >= 1.2) {
    scores.Heart += 1.0;
  }

  // Compact faces: suppress Heart; only boost Round when jaw is truly full
  if (compactFace) {
    if (!strongHeartTaper) scores.Heart -= 2.5;
    if (fullJaw && softJaw) scores.Round += 1.2;
  }

  // Oblong
  if (heightToWidth >= 1.38 && cheekVsJaw < 18) {
    scores.Oblong += 1.2;
  }

  const ranked = (Object.keys(scores) as FaceShapeName[]).sort(
    (a, b) => scores[b] - scores[a]
  );
  let primary = ranked[0];
  let secondary = ranked[1];

  // Safety: compact + soft must not land on Heart without strong taper
  if (primary === "Heart" && compactFace && softJaw && !strongHeartTaper) {
    primary = scores.Oval >= scores.Round ? "Oval" : "Round";
    secondary = "Heart";
  }

  // Prefer Oval over Round when length+gentle taper say egg, not circle
  if (
    primary === "Round" &&
    heightToWidth >= 1.17 &&
    gentleTaper &&
    !sharpJaw &&
    scores.Oval + 0.35 >= scores.Round
  ) {
    secondary = "Round";
    primary = "Oval";
  }

  if (secondary === primary) {
    secondary = ranked.find((k) => k !== primary) || ranked[1];
  }
  const gap = scores[primary] - scores[secondary];
  const borderline =
    gap < 1.25 ||
    secondary === "Heart" ||
    (primary === "Oval" && secondary === "Round") ||
    (primary === "Round" && secondary === "Oval");

  return {
    primary,
    secondary: borderline ? secondary : null,
    borderline,
  };
}

/** Fallback when landmarks missing — ratio only (Heart is never ratio-only). */
export function estimateFaceShapeFromRatio(heightToWidth: number): FaceShapeName {
  const hw = effectiveHeightToWidth(heightToWidth);
  if (hw >= 1.45) return "Oblong";
  if (hw >= 1.2) return "Oval";
  if (hw >= 1.12) return "Round";
  return "Square";
}

/**
 * Analyze face shape from MediaPipe landmarks (normalized 0–1) + optional ratio fallback.
 * Landmark indices: forehead 10, chin 152, temples 127/356, cheeks 234/454, jaw 172/397.
 */
export function analyzeFaceShape(opts: {
  landmarks?: LandmarkLike[];
  imageWidth?: number;
  imageHeight?: number;
  /** Precomputed height/width when landmarks incomplete */
  heightToWidthFallback?: number;
}): FaceShapeAnalysis {
  const w = opts.imageWidth && opts.imageWidth > 0 ? opts.imageWidth : 1;
  const h = opts.imageHeight && opts.imageHeight > 0 ? opts.imageHeight : 1;
  const lm = opts.landmarks;

  let heightToWidth = opts.heightToWidthFallback ?? 1.2;
  let foreheadRel = 92;
  let cheekRel = 100;
  let jawRel = 90;
  let jawAngleDeg = 135;

  if (lm && lm.length >= 400) {
    const forehead = lm[10];
    const chin = lm[152];
    const lTemple = lm[127];
    const rTemple = lm[356];
    const lCheek = lm[234];
    const rCheek = lm[454];
    const lJaw = lm[172];
    const rJaw = lm[397];

    if (forehead && chin && lCheek && rCheek) {
      const faceH = dist(forehead, chin, w, h);
      const faceW = dist(lCheek, rCheek, w, h) || 1;
      heightToWidth = Math.round((faceH / faceW) * 100) / 100;
    }

    if (lTemple && rTemple && lCheek && rCheek && lJaw && rJaw) {
      const cheekW = dist(lCheek, rCheek, w, h) || 1;
      const foreW = dist(lTemple, rTemple, w, h);
      const jawW = dist(lJaw, rJaw, w, h);
      cheekRel = 100;
      foreheadRel = Math.round((foreW / cheekW) * 100);
      jawRel = Math.round((jawW / cheekW) * 100);
      foreheadRel = clamp(foreheadRel, 60, 130);
      jawRel = clamp(jawRel, 60, 130);
    }

    if (lCheek && lJaw && chin && rCheek && rJaw) {
      const leftA = angleDeg(lCheek, lJaw, chin, w, h);
      const rightA = angleDeg(rCheek, rJaw, chin, w, h);
      jawAngleDeg = Math.round((leftA + rightA) / 2);
      jawAngleDeg = clamp(jawAngleDeg, 90, 170);
    }
  }

  let primary: FaceShapeName;
  let secondary: FaceShapeName | null = null;
  let borderline = false;

  // Classify with hairline-compensated H/W; keep raw mesh ratio for UI copy
  const classHw = effectiveHeightToWidth(heightToWidth);

  if (lm && lm.length >= 400) {
    const picked = pickPrimaryFromProfile(
      classHw,
      foreheadRel,
      jawRel,
      jawAngleDeg
    );
    primary = picked.primary;
    secondary = picked.secondary;
    borderline = picked.borderline;
  } else {
    primary = estimateFaceShapeFromRatio(heightToWidth);
    // Heuristic relatives when no mesh
    if (primary === "Round") {
      foreheadRel = 96;
      jawRel = 94;
      jawAngleDeg = 142;
    } else if (primary === "Square") {
      foreheadRel = 98;
      jawRel = 100;
      jawAngleDeg = 118;
    } else if (primary === "Heart") {
      foreheadRel = 108;
      jawRel = 78;
      jawAngleDeg = 132;
    } else if (primary === "Oblong") {
      foreheadRel = 94;
      jawRel = 90;
      jawAngleDeg = 130;
    } else if (primary === "Diamond") {
      foreheadRel = 82;
      jawRel = 80;
      jawAngleDeg = 128;
    } else {
      foreheadRel = 94;
      jawRel = 88;
      jawAngleDeg = 134;
    }
  }

  const meta = SHAPE_META[primary];
  let blurb = meta.blurb;
  let description = meta.description;

  if (borderline && secondary) {
    blurb = `Borderline result — your measurements sit between ${primary} and ${secondary}, so styling advice for both shapes applies.`;
    description = `${meta.description} Neighbor class: ${secondary}.`;
  }

  return {
    primary,
    secondary,
    borderline,
    blurb,
    description,
    heightToWidth,
    foreheadRel,
    cheekRel: 100,
    jawRel,
    jawAngleDeg,
    recommend: meta.recommend,
    recommendLocked: meta.recommendLocked,
    avoid: meta.avoid,
    celebrity: meta.celebrity,
    celebrityMore: meta.celebrityMore,
    color: meta.color,
  };
}
