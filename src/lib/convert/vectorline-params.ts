export type VectorLineCutMode = "outline" | "centerline" | "canny";
export type VectorLineRenderMode = "stroke" | "fill";
export type VectorLineLayerMode = "single" | "auto-layer";

export type VectorLineParams = {
  denoise: number;
  blocksize: number;
  cConstant: number;
  simplify: number;
  minArea: number;
  morphClean: number;
  brightness: number;
  contrast: number;
  whiteCutoff: number;
  invert: boolean;
  smooth: boolean;
  svgColor: "#000000" | "#ff0000";
  renderMode: VectorLineRenderMode;
  cutMode: VectorLineCutMode;
  layerMode: VectorLineLayerMode;
  enableSize: boolean;
  physWidthMm: number;
};

export const DEFAULT_VECTORLINE_PARAMS: VectorLineParams = {
  denoise: 0,
  blocksize: 11,
  cConstant: 2,
  simplify: 0.2,
  minArea: 1,
  morphClean: 0,
  brightness: 0,
  contrast: 0,
  whiteCutoff: 255,
  invert: false,
  smooth: true,
  svgColor: "#000000",
  renderMode: "fill",
  cutMode: "outline",
  layerMode: "single",
  enableSize: true,
  physWidthMm: 300,
};

export type VectorLookId = "clean" | "detailed" | "cut";

export const VECTOR_LOOKS: Record<
  VectorLookId,
  { label: string; hint: string; params: Partial<VectorLineParams> }
> = {
  clean: {
    label: "Clean",
    hint: "Closed outlines with fewer tiny islands. Start here.",
    params: {
      denoise: 0,
      simplify: 0.8,
      minArea: 8,
      invert: false,
      smooth: true,
      cutMode: "outline",
      renderMode: "fill",
    },
  },
  detailed: {
    label: "Detailed",
    hint: "Official VTracer look. Keeps small holes and corners.",
    params: {
      denoise: 0,
      simplify: 0.4,
      minArea: 4,
      invert: false,
      smooth: true,
      cutMode: "outline",
      renderMode: "fill",
    },
  },
  cut: {
    label: "Cut-ready",
    hint: "Drops specks. Closed paths for laser and vinyl.",
    params: {
      denoise: 0,
      simplify: 1.6,
      minArea: 16,
      invert: false,
      smooth: true,
      cutMode: "outline",
      renderMode: "fill",
    },
  },
};

export function lookIdFromParams(params: VectorLineParams): VectorLookId | null {
  for (const id of Object.keys(VECTOR_LOOKS) as VectorLookId[]) {
    const p = VECTOR_LOOKS[id].params;
    if (
      params.cutMode === (p.cutMode ?? "outline") &&
      params.denoise === p.denoise &&
      params.minArea === p.minArea &&
      params.simplify === p.simplify
    ) {
      return id;
    }
  }
  return null;
}

/** Matches VectorLine "hand-drawn photo" preset. */
export const PHOTO_VECTORLINE_PRESET: Partial<VectorLineParams> =
  VECTOR_LOOKS.clean.params;

/** Matches VectorLine "digital drawing" preset. */
export const DIGITAL_VECTORLINE_PRESET: Partial<VectorLineParams> =
  VECTOR_LOOKS.detailed.params;

export function mergeVectorLineParams(
  overrides?: Partial<VectorLineParams>
): VectorLineParams {
  return { ...DEFAULT_VECTORLINE_PARAMS, ...overrides };
}
