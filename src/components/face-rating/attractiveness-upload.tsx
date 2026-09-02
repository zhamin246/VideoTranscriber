"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type MouseEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Upload, X } from "lucide-react";
import AttractivenessResult, {
  type AttractivenessResultData,
} from "./attractiveness-result";
import AnalyzeAnimation from "./analyze-animation";
import { scoreAttractiveness } from "@/lib/face-rating/score";
import {
  estimateFaceShape,
  saveScanResult,
} from "@/lib/face-rating/result-store";

/** Keep analyzing UI on screen long enough for the scan animation to read. */
const MIN_ANALYZE_MS = 2800;

type Phase = "idle" | "camera" | "analyzing" | "done";

export type AttractivenessUploadProps = {
  /**
   * `inline` (default): show free result on this page.
   * `results`: save scan and navigate to `/results/[id]?src=…` (full-analysis flow).
   */
  completeMode?: "inline" | "results";
  /** Query param for the freemium results page. Default: attractiveness */
  resultsSrc?: string;
};

/** Persist preview across navigation — blob: URLs die on unmount. */
async function toStoredPreviewUrl(url: string): Promise<string> {
  if (url.startsWith("data:")) return url;
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    // Downscale large photos so sessionStorage can hold the report preview
    if (typeof createImageBitmap === "function") {
      const bmp = await createImageBitmap(blob);
      const maxSide = 1280;
      const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
      const w = Math.max(1, Math.round(bmp.width * scale));
      const h = Math.max(1, Math.round(bmp.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(bmp, 0, 0, w, h);
        bmp.close();
        return canvas.toDataURL("image/jpeg", 0.88);
      }
      bmp.close();
    }
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("read failed"));
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

/**
 * Upload + live camera capture for AI Attractiveness Test / Face Report.
 * MediaPipe is loaded only when scoring (dynamic import) so the upload UI
 * always mounts even if the model fails to load.
 */
export default function AttractivenessUpload({
  completeMode = "inline",
  resultsSrc = "attractiveness",
}: AttractivenessUploadProps = {}) {
  const router = useRouter();
  const fileInputId = "face-rating-attractiveness-photo";
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  /** Skip blob revoke when leaving for /results */
  const keepPreviewRef = useRef(false);

  const [phase, setPhase] = useState<Phase>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<AttractivenessResultData | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [analyzeStatus, setAnalyzeStatus] = useState("Loading face model…");

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  }, []);

  // Prefetch model in background (never blocks upload UI)
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { prefetchFaceLandmarker } = await import("@/lib/face-rating/landmarker");
        if (!cancelled) prefetchFaceLandmarker();
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [stopCamera]);

  // Revoke preview blob on change/unmount (unless navigating to /results)
  useEffect(() => {
    return () => {
      if (keepPreviewRef.current) return;
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const reset = () => {
    stopCamera();
    keepPreviewRef.current = false;
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPhase("idle");
    setPreview(null);
    setFileName("");
    setResult(null);
    setCameraError(null);
    setAnalyzeError(null);
    setAnalyzeStatus("Loading face model…");
    if (inputRef.current) inputRef.current.value = "";
  };

  const runAnalysis = useCallback(
    async (file: File) => {
      stopCamera();
      const url = URL.createObjectURL(file);
      setPreview((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return url;
      });
      setFileName(file.name);
      setResult(null);
      setAnalyzeError(null);
      setAnalyzeStatus("Loading face model…");
      setPhase("analyzing");
      const startedAt = performance.now();

      try {
        setAnalyzeStatus("Loading face model…");
        const { detectLandmarksFromUrl } = await import(
          "@/lib/face-rating/landmarker"
        );

        setAnalyzeStatus("Detecting 478 landmarks…");
        const landmarks = await detectLandmarksFromUrl(url);

        setAnalyzeStatus("Scoring symmetry · thirds · fifths · ratio…");
        // Brief pause so the score step is visible in the checklist
        await new Promise((r) => setTimeout(r, 400));
        const scored = scoreAttractiveness(landmarks);

        const elapsed = performance.now() - startedAt;
        if (elapsed < MIN_ANALYZE_MS) {
          await new Promise((r) => setTimeout(r, MIN_ANALYZE_MS - elapsed));
        }

        const payload: AttractivenessResultData = {
          score: scored.score,
          components: scored.components,
          previewUrl: url,
          landmarks: landmarks.points,
          imageWidth: landmarks.imageWidth,
          imageHeight: landmarks.imageHeight,
          deviations: scored.symmetry.deviations.map((d) => ({
            feature: d.feature,
            leftPoint: d.leftPoint,
            rightPoint: d.rightPoint,
            deviationPercent: d.deviationPercent,
          })),
          engine: "mediapipe",
          detail: {
            goldenRatio: scored.proportions.goldenRatio,
            thirds: {
              upper: scored.proportions.facialThirds.upper,
              middle: scored.proportions.facialThirds.middle,
              lower: scored.proportions.facialThirds.lower,
            },
            fifths: scored.proportions.facialFifths.values,
            featureSymmetry: {
              eye: scored.symmetry.eyeSymmetry,
              eyebrow: scored.symmetry.eyebrowSymmetry,
              nose: scored.symmetry.noseSymmetry,
              mouth: scored.symmetry.mouthSymmetry,
              jaw: scored.symmetry.jawSymmetry,
            },
          },
        };

        // Full-analysis (and similar): land on freemium /results/[id] preview
        if (completeMode === "results") {
          setAnalyzeStatus("Opening your report preview…");
          const previewStored = await toStoredPreviewUrl(url);
          const id = saveScanResult({
            src: resultsSrc,
            score: payload.score,
            components: payload.components,
            previewUrl: previewStored,
            landmarks: payload.landmarks,
            imageWidth: payload.imageWidth,
            imageHeight: payload.imageHeight,
            detail: payload.detail,
            faceShape: estimateFaceShape(
              payload.detail?.goldenRatio ?? 1.2
            ),
          });
          if (id) {
            keepPreviewRef.current = true;
            router.push(`/results/${id}?src=${encodeURIComponent(resultsSrc)}`);
            return;
          }
          // Fall through to inline if storage failed
        }

        setResult(payload);
        setPhase("done");
      } catch (err) {
        const message =
          err &&
          typeof err === "object" &&
          "name" in err &&
          (err as { name?: string }).name === "FaceDetectError"
            ? (err as Error).message
            : err instanceof Error
              ? err.message
              : "Analysis failed. Try another photo.";
        setAnalyzeError(message);
        setPhase("idle");
      }
    },
    [stopCamera, completeMode, resultsSrc, router]
  );

  const onFile = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAnalyzeError("Please choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setAnalyzeError("Please use an image under 10MB.");
      return;
    }
    void runAnalysis(file);
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    // Keep a reference before clearing so re-selecting the same path works next time
    if (file) onFile(file);
    // Defer clear — some browsers drop the File if value is cleared synchronously
    requestAnimationFrame(() => {
      if (inputRef.current) inputRef.current.value = "";
    });
  };

  const openCamera = async (e?: MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCameraError(null);
    setCameraReady(false);
    setAnalyzeError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        "Camera is not supported in this browser. Try Chrome or Edge, or upload a photo."
      );
      return;
    }

    if (typeof window !== "undefined" && !window.isSecureContext) {
      setCameraError("Camera needs HTTPS or localhost. Upload a photo instead.");
      return;
    }

    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
      });
      streamRef.current = stream;
      setPhase("camera");
    } catch (err) {
      stopCamera();
      setPhase("idle");
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setCameraError(
          "Camera permission denied. Allow access in browser settings, or upload a photo."
        );
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setCameraError("No camera found. Connect a webcam or upload a photo.");
      } else {
        setCameraError("Could not open the camera. Try again or upload a photo.");
      }
    }
  };

  useEffect(() => {
    if (phase !== "camera" || !streamRef.current) return;
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = streamRef.current;
    let cancelled = false;
    void video
      .play()
      .then(() => {
        if (!cancelled) setCameraReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setCameraError("Could not start video preview. Try again or upload a photo.");
          stopCamera();
          setPhase("idle");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [phase, stopCamera]);

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video || !cameraReady || video.videoWidth === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92)
    );
    if (!blob) {
      setCameraError("Failed to capture photo. Try again.");
      return;
    }

    const file = new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" });
    stopCamera();
    void runAnalysis(file);
  };

  if (phase === "camera") {
    return (
      <div className="mx-auto w-full max-w-lg">
        <div className="overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white">
          <div className="flex items-center justify-between border-b border-[#e5e5e5] px-4 py-3">
            <div>
              <p className="text-xs font-bold text-[#9F1239]">Camera</p>
              <p className="text-sm text-[#525252]">Center your face, then capture</p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-8 w-8 items-center justify-center border border-[#e5e5e5] text-[#0a0a0a] hover:bg-[#f5f5f5]"
              aria-label="Close camera"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="relative aspect-[4/3] bg-[#0a0a0a]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full scale-x-[-1] object-cover"
            />
            {!cameraReady ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white">
                <Loader2 className="h-7 w-7 animate-spin" />
                <p className="mt-2 text-sm font-bold">Starting camera…</p>
              </div>
            ) : null}
            {cameraReady ? (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
              >
                <div className="h-[72%] w-[48%] rounded-[50%] border-2 border-white/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]" />
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 p-4">
            <button
              type="button"
              onClick={() => void capturePhoto()}
              disabled={!cameraReady}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#9F1239] px-5 text-sm font-bold text-white transition-colors hover:bg-[#881337] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Camera className="h-4 w-4" />
              Capture photo
            </button>
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-10 items-center justify-center rounded-full border border-[#e5e5e5] px-4 text-sm font-bold text-[#0a0a0a] hover:bg-[#f5f5f5]"
            >
              Cancel
            </button>
          </div>
        </div>
        <p className="mt-4 text-center text-sm text-[#0a0a0a]">
          Video stays on your device — only a still frame is used for scoring
        </p>
      </div>
    );
  }

  if (phase === "done" && result) {
    return <AttractivenessResult data={result} onReset={reset} />;
  }

  if (phase === "analyzing" && preview) {
    return (
      <div className="mx-auto w-full max-w-lg">
        <AnalyzeAnimation
          previewUrl={preview}
          status={analyzeStatus}
          fileName={fileName}
          onCancel={reset}
        />
        <p className="mt-4 text-center text-sm text-[#0a0a0a]">
          Your photo never leaves your device · scoring runs in this browser
        </p>
      </div>
    );
  }

  // ── Idle: upload zone ──────────────────────────────────────────
  // File input only covers the top (choose-photo) region. Camera lives in the
  // same dashed card but below that overlay so it stays clickable.
  return (
    <div className="mx-auto w-full max-w-lg">
      <div
        onDragOver={(e: DragEvent) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(true);
        }}
        onDragLeave={(e: DragEvent) => {
          e.preventDefault();
          setDragOver(false);
        }}
        onDrop={(e: DragEvent) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
          onFile(e.dataTransfer.files?.[0]);
        }}
        className={`overflow-hidden rounded-2xl border-2 border-dashed transition-all ${
          dragOver
            ? "border-[#9F1239]/50 bg-[#9F1239]/5 shadow-[0_0_28px_-8px_rgba(159,18,57,0.35)]"
            : "border-[#e5e5e5] bg-[#f5f5f5]/50 hover:border-[#9F1239]/40 hover:shadow-[0_0_28px_-8px_rgba(159,18,57,0.2)]"
        }`}
      >
        {/* Top: choose photo — transparent file input covers only this block */}
        <div className="relative">
          <input
            id={fileInputId}
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp,image/*"
            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
            aria-label="Choose a photo to analyze"
            onChange={onInputChange}
            onClick={() => setAnalyzeError(null)}
          />
          <div className="flex flex-col items-center justify-center px-6 pb-2 pt-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF1F2] text-[#9F1239]">
              <Upload className="h-5 w-5" strokeWidth={2} />
            </div>
            <p className="mt-4 text-base font-bold text-[#0a0a0a]">Upload a photo</p>
            <p className="mt-1 text-sm text-[#525252]">Drag and drop or choose a file</p>
            <span className="mt-5 inline-flex h-9 items-center justify-center rounded-full bg-[#9F1239] px-4 text-sm font-bold text-white">
              Choose photo
            </span>
            <p className="mt-4 text-xs text-[#737373]">JPG, PNG, WebP up to 10MB</p>
          </div>
        </div>

        {/* Bottom: camera — same card, no file-input overlay */}
        <div className="relative z-20 flex flex-col items-center px-6 pb-12 pt-2">
          <div className="flex w-40 items-center gap-3 text-xs text-[#a3a3a3]">
            <span className="h-px flex-1 bg-[#e5e5e5]" />
            or
            <span className="h-px flex-1 bg-[#e5e5e5]" />
          </div>
          <button
            type="button"
            onClick={(e) => void openCamera(e)}
            className="mt-4 inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-[#e5e5e5] bg-white px-4 text-sm font-bold text-[#0a0a0a] transition-colors hover:bg-[#f5f5f5]"
          >
            <Camera className="h-3.5 w-3.5" strokeWidth={2} />
            Use camera
          </button>
        </div>
      </div>

      {cameraError ? (
        <p className="mt-3 text-center text-sm font-medium text-red-600" role="alert">
          {cameraError}
        </p>
      ) : null}

      {analyzeError ? (
        <p className="mt-3 text-center text-sm font-medium text-red-600" role="alert">
          {analyzeError}
        </p>
      ) : null}

      <p className="mt-4 text-center text-sm text-[#0a0a0a]">
        Your photo never leaves your device · scoring runs in this browser
      </p>
    </div>
  );
}
