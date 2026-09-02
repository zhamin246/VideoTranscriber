import { useCaseAsset } from "./use-case-assets";

export type ConvertSample = {
  id: string;
  title: string;
  originalUrl: string;
  vectorUrl: string;
  thumbUrl: string;
};

export const CONVERT_SAMPLES: ConvertSample[] = [
  {
    id: "portrait",
    title: "Portrait",
    originalUrl: useCaseAsset("people-before.webp"),
    vectorUrl: useCaseAsset("people-after.webp"),
    thumbUrl: useCaseAsset("people-before.webp"),
  },
  {
    id: "facade",
    title: "Urban atrium facade",
    originalUrl: useCaseAsset("architecture-before.webp"),
    vectorUrl: useCaseAsset("architecture-after.webp"),
    thumbUrl: useCaseAsset("architecture-before.webp"),
  },
  {
    id: "product",
    title: "Camera product shot",
    originalUrl: useCaseAsset("product-before.webp"),
    vectorUrl: useCaseAsset("product-after.webp"),
    thumbUrl: useCaseAsset("product-before.webp"),
  },
  {
    id: "patents",
    title: "Exploded product view",
    originalUrl: useCaseAsset("patents-before.webp"),
    vectorUrl: useCaseAsset("patents-after.webp"),
    thumbUrl: useCaseAsset("patents-before.webp"),
  },
  {
    id: "fashion",
    title: "Fashion look",
    originalUrl: useCaseAsset("fashion-before.webp"),
    vectorUrl: useCaseAsset("fashion-after.webp"),
    thumbUrl: useCaseAsset("fashion-before.webp"),
  },
  {
    id: "plans",
    title: "Wooden puzzle",
    originalUrl: useCaseAsset("plans-before.webp"),
    vectorUrl: useCaseAsset("plans-after.webp"),
    thumbUrl: useCaseAsset("plans-before.webp"),
  },
  {
    id: "artifacts",
    title: "Ceramic artifact",
    originalUrl: useCaseAsset("artifacts-before.webp"),
    vectorUrl: useCaseAsset("artifacts-after.webp"),
    thumbUrl: useCaseAsset("artifacts-before.webp"),
  },
];

/** Hero / convert empty-state thumbs — keep the row to three. */
export const CONVERT_SAMPLE_PICKS = CONVERT_SAMPLES.slice(0, 3);

export function getConvertSample(id: string | null | undefined) {
  if (!id) return null;
  return CONVERT_SAMPLES.find((s) => s.id === id) ?? null;
}
