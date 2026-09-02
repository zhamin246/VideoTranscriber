/**
 * Browser-only MediaPipe Face Landmarker (IMAGE mode).
 * Loads the public ESM bundle + local wasm/model so Next never bundles
 * @mediapipe/tasks-vision into the page (that can break client hydration).
 */

import type { LandmarkSet } from "./indices";

type FaceLandmarkerInstance = {
  detect: (image: HTMLImageElement | HTMLCanvasElement | ImageBitmap) => {
    faceLandmarks?: { x: number; y: number; z: number }[][];
  };
  close?: () => void;
};

type VisionModule = {
  FaceLandmarker: {
    createFromOptions: (
      fileset: unknown,
      options: Record<string, unknown>
    ) => Promise<FaceLandmarkerInstance>;
  };
  FilesetResolver: {
    forVisionTasks: (path: string) => Promise<unknown>;
  };
};

let landmarkerPromise: Promise<FaceLandmarkerInstance> | null = null;

/** Absolute public URLs — relative `/mediapipe/...` fails under Next dynamic import. */
function mediapipeBase(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/mediapipe`;
}

async function loadVisionModule(): Promise<VisionModule> {
  const localUrl = `${mediapipeBase()}/vision_bundle.mjs`;
  const cdnUrl =
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";

  // webpackIgnore / turbopackIgnore: runtime URL only — never bundle into Next
  try {
    const mod = await import(
      /* webpackIgnore: true */
      /* @vite-ignore */
      localUrl
    );
    return mod as VisionModule;
  } catch (localErr) {
    console.warn("[face-rating] local MediaPipe bundle failed, trying CDN", localErr);
    const mod = await import(
      /* webpackIgnore: true */
      /* @vite-ignore */
      cdnUrl
    );
    return mod as VisionModule;
  }
}

async function createLandmarker(): Promise<FaceLandmarkerInstance> {
  const { FaceLandmarker, FilesetResolver } = await loadVisionModule();
  const base = mediapipeBase();
  const wasmPath = `${base}/wasm`;
  const modelPath = `${base}/face_landmarker.task`;

  let fileset: unknown;
  try {
    fileset = await FilesetResolver.forVisionTasks(wasmPath);
  } catch {
    fileset = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm",
    );
  }

  const optionsBase = {
    baseOptions: {
      modelAssetPath: modelPath,
    },
    runningMode: "IMAGE" as const,
    numFaces: 1,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
  };

  try {
    return await FaceLandmarker.createFromOptions(fileset, {
      ...optionsBase,
      baseOptions: { ...optionsBase.baseOptions, delegate: "GPU" },
    });
  } catch {
    return await FaceLandmarker.createFromOptions(fileset, {
      ...optionsBase,
      baseOptions: { ...optionsBase.baseOptions, delegate: "CPU" },
    });
  }
}

export function getFaceLandmarker(): Promise<FaceLandmarkerInstance> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Face landmarker is browser-only"));
  }
  if (!landmarkerPromise) {
    landmarkerPromise = createLandmarker().catch((err) => {
      landmarkerPromise = null;
      throw err;
    });
  }
  return landmarkerPromise;
}

/** Prefetch model while user is on the tool page (optional, never throws to UI). */
export function prefetchFaceLandmarker(): void {
  if (typeof window === "undefined") return;
  void getFaceLandmarker().catch(() => {
    /* ignore prefetch errors */
  });
}

export type DetectErrorCode = "no_face" | "load_failed" | "detect_failed";

export class FaceDetectError extends Error {
  code: DetectErrorCode;
  constructor(code: DetectErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "FaceDetectError";
  }
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // blob: / same-origin — no CORS issues for canvas/detect
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to decode image"));
    img.src = src;
  });
}

/**
 * Detect 478 landmarks from an image URL (blob: or same-origin).
 * Photo stays on-device; nothing is uploaded.
 */
export async function detectLandmarksFromUrl(
  imageUrl: string
): Promise<LandmarkSet> {
  let landmarker: FaceLandmarkerInstance;
  try {
    landmarker = await getFaceLandmarker();
  } catch (e) {
    throw new FaceDetectError(
      "load_failed",
      e instanceof Error
        ? e.message
        : "Could not load the face model. Refresh and try again."
    );
  }

  let img: HTMLImageElement;
  try {
    img = await loadImageElement(imageUrl);
  } catch {
    throw new FaceDetectError("detect_failed", "Could not read that image.");
  }

  let result: { faceLandmarks?: { x: number; y: number; z: number }[][] };
  try {
    result = landmarker.detect(img);
  } catch (e) {
    throw new FaceDetectError(
      "detect_failed",
      e instanceof Error ? e.message : "Face detection failed."
    );
  }

  const face = result.faceLandmarks?.[0];
  if (!face?.length) {
    throw new FaceDetectError(
      "no_face",
      "No face detected. Use one clear, front-facing photo with good light — no sunglasses."
    );
  }

  return {
    imageWidth: img.naturalWidth || img.width,
    imageHeight: img.naturalHeight || img.height,
    points: face.map((p) => ({
      x: p.x,
      y: p.y,
      z: p.z,
    })),
  };
}
