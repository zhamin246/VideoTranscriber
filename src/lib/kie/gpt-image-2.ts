/**
 * Kie GPT Image 2 helpers (text-to-image + image-to-image).
 * Image-to-image docs:
 * https://docs.kie.ai/market/gpt/gpt-image-2-image-to-image
 */

import { getUuid } from "@/lib/hash";
import { newStorage } from "@/lib/storage";
import {
  kieCreateTask,
  kieGetTask,
  kieWaitForTask,
  parseKieResultUrls,
  type KieTaskRecord,
} from "./client";

export const GPT_IMAGE_2_I2I_MODEL = "gpt-image-2-image-to-image";
export const GPT_IMAGE_2_T2I_MODEL = "gpt-image-2-text-to-image";

export type GptImage2AspectRatio =
  | "auto"
  | "1:1"
  | "3:2"
  | "2:3"
  | "4:3"
  | "3:4"
  | "5:4"
  | "4:5"
  | "16:9"
  | "9:16"
  | "2:1"
  | "1:2"
  | "3:1"
  | "1:3"
  | "21:9"
  | "9:21";

export type GptImage2Resolution = "1K" | "2K" | "4K";

export type CreateGptImage2I2IInput = {
  prompt: string;
  /** Public http(s) image URLs and/or data: URLs (data: will be uploaded to storage). */
  images: string[];
  aspect_ratio?: GptImage2AspectRatio;
  resolution?: GptImage2Resolution;
  callBackUrl?: string;
};

function sniffContentType(dataUrl: string): string {
  const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,/.exec(dataUrl);
  return m?.[1] || "image/jpeg";
}

function extForContentType(ct: string): string {
  if (ct.includes("png")) return "png";
  if (ct.includes("webp")) return "webp";
  if (ct.includes("gif")) return "gif";
  return "jpg";
}

/**
 * Ensure every image is a public URL Kie can fetch.
 * data: URLs are uploaded to configured object storage.
 */
export async function ensurePublicImageUrls(
  images: string[]
): Promise<string[]> {
  if (!images.length) {
    throw new Error("At least one input image is required");
  }
  if (images.length > 16) {
    throw new Error("GPT Image 2 accepts at most 16 input images");
  }

  const out: string[] = [];
  for (const src of images) {
    const trimmed = (src || "").trim();
    if (!trimmed) continue;

    if (/^https?:\/\//i.test(trimmed)) {
      out.push(trimmed);
      continue;
    }

    if (trimmed.startsWith("data:image/")) {
      const contentType = sniffContentType(trimmed);
      const base64 = trimmed.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
      const buffer = Buffer.from(base64, "base64");
      if (!buffer.length) {
        throw new Error("Empty data: image payload");
      }
      // Keep under ~8MB binary for practical uploads
      if (buffer.length > 8 * 1024 * 1024) {
        throw new Error("Input image is too large (max ~8MB). Compress first.");
      }

      const storage = newStorage();
      const ext = extForContentType(contentType);
      const key = `kie/gpt-image-2/inputs/${getUuid()}.${ext}`;
      const uploaded = await storage.uploadFile({
        body: buffer,
        key,
        contentType,
        disposition: "inline",
      });
      if (!uploaded?.url) {
        throw new Error("Failed to upload input image to storage");
      }
      out.push(uploaded.url);
      continue;
    }

    throw new Error(
      "Each image must be an https URL or a data:image/*;base64,... string"
    );
  }

  if (!out.length) {
    throw new Error("No valid input images");
  }
  return out;
}

/** Create an async image-to-image task. Returns taskId. */
export async function createGptImage2ImageToImage(
  input: CreateGptImage2I2IInput
): Promise<string> {
  const prompt = (input.prompt || "").trim();
  if (!prompt) throw new Error("prompt is required");
  if (prompt.length > 20_000) {
    throw new Error("prompt exceeds 20,000 characters");
  }

  const input_urls = await ensurePublicImageUrls(input.images);
  const resolution = input.resolution || "1K";
  const aspect_ratio = input.aspect_ratio || "auto";

  // Kie constraints from docs
  if (resolution !== "1K" && (aspect_ratio === "auto" || !input.aspect_ratio)) {
    throw new Error(
      'For 2K/4K you must set aspect_ratio explicitly (not "auto")'
    );
  }
  if (resolution === "4K" && aspect_ratio === "1:1") {
    throw new Error("4K does not support 1:1 aspect ratio");
  }
  if (
    (resolution === "2K" || resolution === "4K") &&
    ["5:4", "4:5", "3:1", "1:3", "9:21"].includes(aspect_ratio)
  ) {
    throw new Error(
      `aspect_ratio ${aspect_ratio} is not supported at ${resolution}`
    );
  }

  return kieCreateTask({
    model: GPT_IMAGE_2_I2I_MODEL,
    callBackUrl: input.callBackUrl,
    input: {
      prompt,
      input_urls,
      aspect_ratio,
      resolution,
    },
  });
}

export async function getGptImage2Task(taskId: string): Promise<{
  task: KieTaskRecord;
  resultUrls: string[];
}> {
  const task = await kieGetTask(taskId);
  return { task, resultUrls: parseKieResultUrls(task) };
}

/** Blocking helper for scripts / admin tools. Prefer async+callback in product. */
export async function runGptImage2ImageToImage(
  input: CreateGptImage2I2IInput,
  wait?: { timeoutMs?: number; intervalMs?: number }
): Promise<{ taskId: string; resultUrls: string[]; task: KieTaskRecord }> {
  const taskId = await createGptImage2ImageToImage(input);
  const task = await kieWaitForTask(taskId, wait);
  if (task.state === "fail") {
    throw new Error(task.failMsg || task.failCode || "GPT Image 2 task failed");
  }
  return {
    taskId,
    task,
    resultUrls: parseKieResultUrls(task),
  };
}
