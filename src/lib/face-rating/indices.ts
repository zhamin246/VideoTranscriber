/**
 * MediaPipe Face Landmarker (478) named indices + symmetry pairs.
 * Geometry constants calibrated for the free attractiveness formula:
 * symmetry 35% · thirds 25% · fifths 25% · golden 15%.
 */

export type Point3 = { x: number; y: number; z?: number };

export type LandmarkSet = {
  imageWidth: number;
  imageHeight: number;
  points: Point3[];
};

export const LEFT_EYE = {
  innerCorner: 133,
  outerCorner: 33,
  top: 159,
  bottom: 145,
  center: 468,
} as const;

export const RIGHT_EYE = {
  innerCorner: 362,
  outerCorner: 263,
  top: 386,
  bottom: 374,
  center: 473,
} as const;

export const LEFT_EYEBROW = {
  inner: 107,
  peak: 105,
  outer: 70,
} as const;

export const RIGHT_EYEBROW = {
  inner: 336,
  peak: 334,
  outer: 300,
} as const;

export const NOSE = {
  bridge: 6,
  tip: 1,
  leftAla: 129,
  rightAla: 358,
  base: 2,
} as const;

export const MOUTH = {
  leftCorner: 61,
  rightCorner: 291,
  upperLipTop: 0,
  lowerLipBottom: 17,
  upperLipCenter: 13,
  lowerLipCenter: 14,
} as const;

export const JAW = {
  leftTemple: 127,
  leftCheekbone: 234,
  leftJaw: 172,
  chin: 152,
  rightJaw: 397,
  rightCheekbone: 454,
  rightTemple: 356,
} as const;

export const MIDLINE = {
  foreheadTop: 10,
  foreheadCenter: 151,
  noseBridge: 6,
  noseTip: 1,
  noseBase: 2,
  upperLipCenter: 0,
  lowerLipCenter: 17,
  chinBottom: 152,
} as const;

/** Face oval contour (for mesh overlay). */
export const FACE_OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379,
  378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162,
  21, 54, 103, 67, 109, 10,
] as const;

export type SymmetryFeature = "eye" | "eyebrow" | "nose" | "mouth" | "jaw";

export type SymmetryPair = {
  left: number;
  right: number;
  feature: SymmetryFeature;
};

export const SYMMETRY_PAIRS: SymmetryPair[] = [
  { left: LEFT_EYE.outerCorner, right: RIGHT_EYE.outerCorner, feature: "eye" },
  { left: LEFT_EYE.innerCorner, right: RIGHT_EYE.innerCorner, feature: "eye" },
  { left: LEFT_EYE.top, right: RIGHT_EYE.top, feature: "eye" },
  { left: LEFT_EYE.bottom, right: RIGHT_EYE.bottom, feature: "eye" },
  { left: LEFT_EYEBROW.inner, right: RIGHT_EYEBROW.inner, feature: "eyebrow" },
  { left: LEFT_EYEBROW.peak, right: RIGHT_EYEBROW.peak, feature: "eyebrow" },
  { left: LEFT_EYEBROW.outer, right: RIGHT_EYEBROW.outer, feature: "eyebrow" },
  { left: NOSE.leftAla, right: NOSE.rightAla, feature: "nose" },
  { left: MOUTH.leftCorner, right: MOUTH.rightCorner, feature: "mouth" },
  { left: JAW.leftTemple, right: JAW.rightTemple, feature: "jaw" },
  { left: JAW.leftCheekbone, right: JAW.rightCheekbone, feature: "jaw" },
  { left: JAW.leftJaw, right: JAW.rightJaw, feature: "jaw" },
];

/** Piecewise-linear deviation% → score curves per feature. */
export const SYMMETRY_DEVIATION_CURVES: Record<
  SymmetryFeature,
  [number, number][]
> = {
  eye: [
    [0, 100],
    [3.7, 88],
    [6.9, 72],
    [14.6, 55],
    [35.2, 35],
    [71.3, 12],
  ],
  eyebrow: [
    [0, 100],
    [3.2, 88],
    [5.6, 72],
    [10.1, 55],
    [21.3, 35],
    [45.5, 12],
  ],
  jaw: [
    [0, 100],
    [4.2, 88],
    [8.7, 72],
    [20.6, 55],
    [55, 35],
    [112.3, 12],
  ],
  mouth: [
    [0, 100],
    [4.1, 88],
    [6.8, 72],
    [12, 55],
    [26.3, 35],
    [49.7, 12],
  ],
  nose: [
    [0, 100],
    [2.7, 88],
    [4.5, 72],
    [7.7, 55],
    [14.6, 35],
    [27.6, 12],
  ],
};

export const SYMMETRY_WEIGHTS = {
  eye: 0.25,
  eyebrow: 0.15,
  nose: 0.1,
  mouth: 0.15,
  jaw: 0.35,
} as const;

export const HARMONY_WEIGHTS = {
  symmetry: 0.35,
  goldenRatio: 0.15,
  thirds: 0.25,
  fifths: 0.25,
} as const;

/** Visible landmark window length/width target (≈ phi adjusted for mesh forehead). */
export const GOLDEN_RATIO_VISIBLE_TARGET = 1.38;
export const GOLDEN_RATIO_SENSITIVITY = 200;

export const IDEAL_FIFTH = 0.2;
export const FIFTHS_SENSITIVITY = 200;

/**
 * MediaPipe forehead is below true hairline, so upper third of the *visible*
 * mesh window is smaller than classical 33/33/33.
 */
export const VISIBLE_THIRDS_TARGET = {
  upper: 18,
  middle: 41,
  lower: 41,
} as const;
export const THIRDS_SENSITIVITY = 4;
export const UPPER_THIRD_WEIGHT = 0.5;
