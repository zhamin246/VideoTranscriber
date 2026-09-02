export const USE_CASE_CDN = "https://cdn.imagetocad.app/use-cases";

export function useCaseAsset(file: string) {
  return `${USE_CASE_CDN}/${file}`;
}
