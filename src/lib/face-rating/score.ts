import {
  FIFTHS_SENSITIVITY,
  GOLDEN_RATIO_SENSITIVITY,
  GOLDEN_RATIO_VISIBLE_TARGET,
  HARMONY_WEIGHTS,
  IDEAL_FIFTH,
  JAW,
  LEFT_EYE,
  LEFT_EYEBROW,
  MIDLINE,
  RIGHT_EYE,
  RIGHT_EYEBROW,
  SYMMETRY_DEVIATION_CURVES,
  SYMMETRY_PAIRS,
  SYMMETRY_WEIGHTS,
  THIRDS_SENSITIVITY,
  UPPER_THIRD_WEIGHT,
  VISIBLE_THIRDS_TARGET,
  type LandmarkSet,
  type SymmetryFeature,
} from "./indices";
import {
  average,
  clamp,
  distance,
  fitLine,
  getPoint,
  midpoint,
  perpendicularDistance,
  type Point2,
} from "./geometry";

export type SymmetryResult = {
  overallScore: number;
  eyeSymmetry: number;
  eyebrowSymmetry: number;
  noseSymmetry: number;
  mouthSymmetry: number;
  jawSymmetry: number;
  deviations: {
    feature: SymmetryFeature;
    leftPoint: Point2;
    rightPoint: Point2;
    deviationPercent: number;
  }[];
};

export type ProportionsResult = {
  goldenRatio: number;
  goldenRatioScore: number;
  facialThirds: {
    upper: number;
    middle: number;
    lower: number;
    balance: number;
  };
  facialFifths: {
    values: number[];
    balance: number;
  };
};

export type AttractivenessScore = {
  score: number;
  components: {
    symmetry: number;
    thirds: number;
    fifths: number;
    golden: number;
  };
  symmetry: SymmetryResult;
  proportions: ProportionsResult;
};

function scoreFromDeviationCurve(
  feature: SymmetryFeature,
  deviationPercent: number
): number {
  const curve = SYMMETRY_DEVIATION_CURVES[feature];
  if (!curve || !Number.isFinite(deviationPercent) || deviationPercent <= 0) {
    return 100;
  }
  for (let i = 1; i < curve.length; i++) {
    if (deviationPercent <= curve[i][0]) {
      const [x0, y0] = curve[i - 1];
      const [x1, y1] = curve[i];
      return y0 + ((deviationPercent - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  const [x0, y0] = curve[curve.length - 2];
  const [x1, y1] = curve[curve.length - 1];
  return Math.max(0, y1 + ((deviationPercent - x1) / (x1 - x0)) * (y1 - y0));
}

/**
 * Bilateral symmetry vs a fitted facial midline (forehead → chin landmarks).
 * Mirrors the production free-test approach used by leading browser face tools.
 */
export function calculateSymmetry(set: LandmarkSet): SymmetryResult {
  const midline = fitLine([
    getPoint(set, MIDLINE.foreheadTop),
    getPoint(set, MIDLINE.foreheadCenter),
    getPoint(set, MIDLINE.noseBridge),
    getPoint(set, MIDLINE.noseBase),
    getPoint(set, MIDLINE.chinBottom),
  ]);

  const deviations: SymmetryResult["deviations"] = [];
  const byFeature: Record<SymmetryFeature, number[]> = {
    eye: [],
    eyebrow: [],
    nose: [],
    mouth: [],
    jaw: [],
  };

  for (const pair of SYMMETRY_PAIRS) {
    const left = getPoint(set, pair.left);
    const right = getPoint(set, pair.right);
    const dLeft = perpendicularDistance(left, midline);
    // Reflect left across midline, then distance to right
    const reflected: Point2 = {
      x: left.x - 2 * dLeft * midline.direction.y,
      y: left.y + 2 * dLeft * midline.direction.x,
    };
    const mismatch = distance(reflected, right);
    const meanAbsDist =
      (Math.abs(dLeft) + Math.abs(perpendicularDistance(right, midline))) / 2;
    const deviationPercent =
      meanAbsDist > 0 ? (mismatch / meanAbsDist) * 100 : mismatch > 0 ? 100 : 0;

    deviations.push({
      feature: pair.feature,
      leftPoint: left,
      rightPoint: right,
      deviationPercent,
    });
    byFeature[pair.feature].push(
      scoreFromDeviationCurve(pair.feature, deviationPercent)
    );
  }

  const eye = average(byFeature.eye.length ? byFeature.eye : [100]);
  const eyebrow = average(byFeature.eyebrow.length ? byFeature.eyebrow : [100]);
  const nose = average(byFeature.nose.length ? byFeature.nose : [100]);
  const mouth = average(byFeature.mouth.length ? byFeature.mouth : [100]);
  const jaw = average(byFeature.jaw.length ? byFeature.jaw : [100]);

  const overallScore = clamp(
    Math.round(
      eye * SYMMETRY_WEIGHTS.eye +
        eyebrow * SYMMETRY_WEIGHTS.eyebrow +
        nose * SYMMETRY_WEIGHTS.nose +
        mouth * SYMMETRY_WEIGHTS.mouth +
        jaw * SYMMETRY_WEIGHTS.jaw
    ),
    0,
    100
  );

  return {
    overallScore,
    eyeSymmetry: Math.round(clamp(eye, 0, 100)),
    eyebrowSymmetry: Math.round(clamp(eyebrow, 0, 100)),
    noseSymmetry: Math.round(clamp(nose, 0, 100)),
    mouthSymmetry: Math.round(clamp(mouth, 0, 100)),
    jawSymmetry: Math.round(clamp(jaw, 0, 100)),
    deviations,
  };
}

/** Vertical thirds + horizontal fifths + visible length/width golden target. */
export function calculateProportions(set: LandmarkSet): ProportionsResult {
  const forehead = getPoint(set, MIDLINE.foreheadTop);
  const browMid = midpoint(
    getPoint(set, LEFT_EYEBROW.peak),
    getPoint(set, RIGHT_EYEBROW.peak)
  );
  const noseBase = getPoint(set, MIDLINE.noseBase);
  const chin = getPoint(set, MIDLINE.chinBottom);

  const upperH = distance(forehead, browMid);
  const midH = distance(browMid, noseBase);
  const lowerH = distance(noseBase, chin);
  const totalH = upperH + midH + lowerH || 1;

  const upperPct = (upperH / totalH) * 100;
  const middlePct = (midH / totalH) * 100;
  const lowerPct = (lowerH / totalH) * 100;

  const thirdsBalance = clamp(
    100 -
      (Math.abs(upperPct - VISIBLE_THIRDS_TARGET.upper) * UPPER_THIRD_WEIGHT +
        Math.abs(middlePct - VISIBLE_THIRDS_TARGET.middle) +
        Math.abs(lowerPct - VISIBLE_THIRDS_TARGET.lower)) *
        THIRDS_SENSITIVITY,
    0,
    100
  );

  const leftCheek = getPoint(set, JAW.leftCheekbone);
  const rightCheek = getPoint(set, JAW.rightCheekbone);
  const faceWidth = distance(leftCheek, rightCheek) || 1;
  const faceHeight = distance(forehead, chin);
  const goldenRatio = faceHeight / faceWidth;
  const goldenRatioScore = clamp(
    100 -
      (Math.abs(goldenRatio - GOLDEN_RATIO_VISIBLE_TARGET) /
        GOLDEN_RATIO_VISIBLE_TARGET) *
        GOLDEN_RATIO_SENSITIVITY,
    0,
    100
  );

  // Horizontal fifths: temple → outer eye → inner eye → inner eye → outer eye → temple
  const leftTemple = getPoint(set, 234); // cheekbone/temple proxy used by free tools
  const rightTemple = getPoint(set, 454);
  const segments = [
    distance(leftTemple, getPoint(set, LEFT_EYE.outerCorner)),
    distance(getPoint(set, LEFT_EYE.outerCorner), getPoint(set, LEFT_EYE.innerCorner)),
    distance(getPoint(set, LEFT_EYE.innerCorner), getPoint(set, RIGHT_EYE.innerCorner)),
    distance(getPoint(set, RIGHT_EYE.innerCorner), getPoint(set, RIGHT_EYE.outerCorner)),
    distance(getPoint(set, RIGHT_EYE.outerCorner), rightTemple),
  ];
  const fifthsTotal = segments.reduce((a, b) => a + b, 0) || 1;
  const fifthsFrac = segments.map((s) => s / fifthsTotal);
  const fifthsBalance = clamp(
    100 -
      fifthsFrac.reduce((sum, f) => sum + Math.abs(f - IDEAL_FIFTH), 0) *
        FIFTHS_SENSITIVITY,
    0,
    100
  );

  return {
    goldenRatio: Math.round(goldenRatio * 100) / 100,
    goldenRatioScore: Math.round(goldenRatioScore),
    facialThirds: {
      // Keep one decimal (e.g. 28.4) — UI shows percent shares, not whole integers
      upper: Math.round(upperPct * 10) / 10,
      middle: Math.round(middlePct * 10) / 10,
      lower: Math.round(lowerPct * 10) / 10,
      balance: Math.round(thirdsBalance),
    },
    facialFifths: {
      // Fractions of face width (sum ≈ 1), one more digit for display
      values: fifthsFrac.map((f) => Math.round(f * 1000) / 1000),
      balance: Math.round(fifthsBalance),
    },
  };
}

export function computeHarmonyScore(
  symmetry: SymmetryResult,
  proportions: ProportionsResult
): number {
  return Math.round(
    symmetry.overallScore * HARMONY_WEIGHTS.symmetry +
      proportions.goldenRatioScore * HARMONY_WEIGHTS.goldenRatio +
      proportions.facialThirds.balance * HARMONY_WEIGHTS.thirds +
      proportions.facialFifths.balance * HARMONY_WEIGHTS.fifths
  );
}

/** Full free attractiveness score from 478 landmarks. */
export function scoreAttractiveness(set: LandmarkSet): AttractivenessScore {
  if (!set.points?.length || set.points.length < 468) {
    throw new Error("Need at least 468 facial landmarks");
  }
  if (!set.imageWidth || !set.imageHeight) {
    throw new Error("imageWidth and imageHeight are required");
  }

  const symmetry = calculateSymmetry(set);
  const proportions = calculateProportions(set);
  const score = clamp(computeHarmonyScore(symmetry, proportions), 0, 100);

  return {
    score,
    components: {
      symmetry: symmetry.overallScore,
      thirds: proportions.facialThirds.balance,
      fifths: proportions.facialFifths.balance,
      golden: proportions.goldenRatioScore,
    },
    symmetry,
    proportions,
  };
}
