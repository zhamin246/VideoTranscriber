import type { CadGeometry, CadPath } from "./geometry";
import { CAD_LAYER, CAD_LONGEST_EDGE_MM, CAD_MARGIN_MM } from "./geometry";
import {
  mergeVectorLineParams,
  type VectorLineParams,
} from "./vectorline-params";

export type VectorLinePixels = {
  width: number;
  height: number;
  imageData: ImageData;
};

export type VectorLineResult = {
  geometry: CadGeometry;
  previewUrl: string;
  bitmap: ImageData;
  pathsSvgHtml: string;
  pathsCount: number;
  totalNodes: number;
  width: number;
  height: number;
};

const MAX_EDGE = 2800;

type WorkerPath = {
  pts: Array<[number, number]>;
  closed: boolean;
};

type WorkerResult = {
  type: "result";
  outBuffer: ArrayBuffer;
  pathsSvgHtml: string;
  pathsCount: number;
  totalNodes: number;
  width: number;
  height: number;
  paths: WorkerPath[];
};

const OPENCV_JS = "/vectorline/opencv.js";
const WORKER_JS = "/vectorline/processor.worker.js?v=centerline3";
const START_TIMEOUT_MS = 120_000;

let worker: Worker | null = null;
let workerReady: Promise<void> | null = null;
let workerQueue: Promise<unknown> = Promise.resolve();
let opencvWarm: Promise<void> | null = null;

function resetVectorLineWorker() {
  try {
    worker?.terminate();
  } catch {
    /* ignore */
  }
  worker = null;
  workerReady = null;
}

function warmOpenCvCache() {
  if (typeof window === "undefined") return Promise.resolve();
  if (!opencvWarm) {
    opencvWarm = fetch(OPENCV_JS, { cache: "force-cache", credentials: "same-origin" })
      .then((res) => {
        if (!res.ok) throw new Error("Could not download the CAD engine");
      })
      .catch((err) => {
        opencvWarm = null;
        throw err;
      });
  }
  return opencvWarm;
}

function startWorker(): Promise<void> {
  if (workerReady) return workerReady;
  const instance = new Worker(WORKER_JS);
  worker = instance;
  const ready = new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error("VectorLine is taking too long to start"));
    }, START_TIMEOUT_MS);
    const onReady = (event: MessageEvent) => {
      if (event.data?.type === "ready") {
        window.clearTimeout(timer);
        instance.removeEventListener("message", onReady);
        resolve();
      }
      if (event.data?.type === "error" && !event.data.outBuffer) {
        window.clearTimeout(timer);
        instance.removeEventListener("message", onReady);
        reject(new Error(event.data.message || "VectorLine failed to start"));
      }
    };
    instance.addEventListener("message", onReady);
  });
  workerReady = ready.then(
    () => undefined,
    (err) => {
      resetVectorLineWorker();
      throw err;
    }
  );
  return workerReady;
}

function getWorker(): { worker: Worker; ready: Promise<void> } {
  if (typeof window === "undefined") {
    throw new Error("VectorLine only runs in the browser");
  }
  if (!worker || !workerReady) {
    void startWorker();
  }
  return { worker: worker!, ready: workerReady! };
}

/** Download OpenCV (~11 MB) and boot the worker during the AI wait. */
export function preloadVectorLine(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  return warmOpenCvCache()
    .catch(() => undefined)
    .then(() => {
      if (!workerReady) return startWorker();
      return workerReady;
    })
    .then(
      () => undefined,
      () => undefined
    );
}

export function retryVectorLineEngine(): Promise<void> {
  resetVectorLineWorker();
  opencvWarm = null;
  return warmOpenCvCache().then(() => startWorker());
}

function isRemoteUrl(src: string) {
  return /^https?:\/\//i.test(src);
}

async function resolveReadableSrc(src: string): Promise<string> {
  if (!isRemoteUrl(src)) return src;
  const proxy = `/api/convert/image-proxy?url=${encodeURIComponent(src)}`;
  const res = await fetch(proxy, { cache: "no-store" });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json?.message || "Could not load the image for VectorLine");
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (isRemoteUrl(src)) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the image for VectorLine"));
    img.src = src;
  });
}

function imageToRgba(img: HTMLImageElement): VectorLinePixels {
  const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Could not read image pixels");
  ctx.imageSmoothingEnabled = scale >= 1;
  ctx.drawImage(img, 0, 0, width, height);
  return { width, height, imageData: ctx.getImageData(0, 0, width, height) };
}

export function cloneImageData(src: ImageData): ImageData {
  return new ImageData(new Uint8ClampedArray(src.data), src.width, src.height);
}

export function applyBackgroundMask(src: ImageData, mask: Uint8Array | null | undefined) {
  const copy = cloneImageData(src);
  if (!mask || mask.length !== src.width * src.height) return copy;
  const d = copy.data;
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) continue;
    const j = i * 4;
    d[j] = 255;
    d[j + 1] = 255;
    d[j + 2] = 255;
    d[j + 3] = 255;
  }
  return copy;
}

function imageDataToArrayBuffer(pixels: ImageData): ArrayBuffer {
  const source = pixels.data;
  const buffer = new ArrayBuffer(source.byteLength);
  new Uint8ClampedArray(buffer).set(source);
  return buffer;
}

function processWithWorker(
  width: number,
  height: number,
  buffer: ArrayBuffer,
  params: VectorLineParams
): Promise<WorkerResult> {
  const { worker: w, ready } = getWorker();
  const run = () =>
    ready.then(
      () =>
        new Promise<WorkerResult>((resolve, reject) => {
          const timer = window.setTimeout(() => {
            w.removeEventListener("message", onMessage);
            reject(new Error("VectorLine timed out while tracing"));
          }, 90000);
          const onMessage = (event: MessageEvent) => {
            if (event.data?.type === "ready") return;
            window.clearTimeout(timer);
            w.removeEventListener("message", onMessage);
            if (event.data?.type === "error") {
              reject(new Error(event.data.message || "VectorLine failed"));
              return;
            }
            if (event.data?.type === "result") {
              resolve(event.data as WorkerResult);
              return;
            }
            reject(new Error("Unexpected VectorLine response"));
          };
          w.addEventListener("message", onMessage);
          w.postMessage(
            {
              type: "process",
              width,
              height,
              imageDataBuffer: buffer,
              params,
            },
            [buffer]
          );
        })
    );
  const next = workerQueue.then(run, run);
  workerQueue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

function wrapSvg(pathsSvgHtml: string, width: number, height: number, widthMm: number, heightMm: number) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${widthMm}mm" height="${heightMm}mm">
${pathsSvgHtml}
</svg>
`;
}

function pathsToDxf(paths: WorkerPath[], width: number, height: number, scale: number, margin: number) {
  const entities: string[] = [];
  for (const path of paths) {
    if (path.pts.length < 2) continue;
    const verts = path.pts.map(([x, y]) => [
      Number((x * scale + margin).toFixed(4)),
      Number(((height - y) * scale + margin).toFixed(4)),
    ]);
    let e =
      "0\nLWPOLYLINE\n100\nAcDbEntity\n8\nENGRAVE\n62\n7\n100\nAcDbPolyline\n90\n" +
      verts.length +
      "\n70\n" +
      (path.closed ? 1 : 0) +
      "\n";
    for (const [x, y] of verts) {
      e += "10\n" + x + "\n20\n" + y + "\n";
    }
    entities.push(e);
  }
  return (
    "0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1015\n9\n$INSUNITS\n70\n4\n0\nENDSEC\n" +
    "0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER\n70\n1\n" +
    "0\nLAYER\n2\nENGRAVE\n70\n0\n62\n7\n6\nCONTINUOUS\n" +
    "0\nENDTAB\n0\nENDSEC\n" +
    "0\nSECTION\n2\nENTITIES\n" +
    entities.join("") +
    "0\nENDSEC\n0\nEOF\n"
  );
}

function toGeometry(
  paths: WorkerPath[],
  width: number,
  height: number,
  pathsSvgHtml: string,
  params: VectorLineParams
): CadGeometry {
  const scale = params.enableSize
    ? params.physWidthMm / Math.max(width, 1)
    : CAD_LONGEST_EDGE_MM / Math.max(width, height);
  const margin = CAD_MARGIN_MM;
  const contentWidth = width * scale;
  const contentHeight = height * scale;
  const cadPaths: CadPath[] = paths
    .filter((path) => path.pts.length >= 2)
    .map((path) => ({
      closed: path.closed,
      kind: "straight" as const,
      points: path.pts.map(([x, y]) => ({
        x: x * scale + margin,
        y: (height - y) * scale + margin,
      })),
      filled: params.renderMode === "fill",
    }));
  return {
    version: 1,
    units: "mm",
    width: contentWidth + margin * 2,
    height: contentHeight + margin * 2,
    margin,
    contentWidth,
    contentHeight,
    layer: CAD_LAYER,
    paths: cadPaths,
    sourceSvg: wrapSvg(
      pathsSvgHtml,
      width,
      height,
      contentWidth + margin * 2,
      contentHeight + margin * 2
    ),
    sourceDxf: pathsToDxf(paths, width, height, scale, margin),
  };
}

export async function loadVectorLinePixels(imageSrc: string): Promise<VectorLinePixels> {
  const readable = await resolveReadableSrc(imageSrc);
  const img = await loadImage(readable);
  if (readable.startsWith("blob:") && readable !== imageSrc) {
    URL.revokeObjectURL(readable);
  }
  return imageToRgba(img);
}

export async function runVectorLineFromPixels(
  pixels: VectorLinePixels,
  params?: Partial<VectorLineParams>,
  mask?: Uint8Array | null
): Promise<VectorLineResult> {
  const resolved = mergeVectorLineParams(params);
  const prepared = applyBackgroundMask(pixels.imageData, mask);
  const result = await processWithWorker(
    pixels.width,
    pixels.height,
    imageDataToArrayBuffer(prepared),
    resolved
  );
  if (!result.paths?.length) {
    throw new Error("VectorLine found no linework");
  }
  const width = result.width || pixels.width;
  const height = result.height || pixels.height;
  const raw = new Uint8ClampedArray(result.outBuffer);
  const expected = width * height * 4;
  const pixelsRgba = raw.length === expected ? raw : raw.slice(0, expected);
  const bitmap = new ImageData(pixelsRgba, width, height);
  const geometry = toGeometry(result.paths, width, height, result.pathsSvgHtml || "", resolved);
  const preview = URL.createObjectURL(
    new Blob(
      [
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n${result.pathsSvgHtml || ""}\n</svg>`,
      ],
      { type: "image/svg+xml;charset=utf-8" }
    )
  );
  return {
    geometry,
    previewUrl: preview,
    bitmap,
    pathsSvgHtml: result.pathsSvgHtml || "",
    pathsCount: result.pathsCount || result.paths.length,
    totalNodes: result.totalNodes || 0,
    width,
    height,
  };
}

export async function runVectorLine(
  imageSrc: string,
  params?: Partial<VectorLineParams>,
  mask?: Uint8Array | null
): Promise<VectorLineResult> {
  const pixels = await loadVectorLinePixels(imageSrc);
  return runVectorLineFromPixels(pixels, params, mask);
}
