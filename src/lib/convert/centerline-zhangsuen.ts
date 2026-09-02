import { geometryToDxf } from "./export-dxf";
import { loadGrayImage } from "./load-pixels";
import { vectorizeGrayImage } from "./vectorize";

export async function zhangSuenCenterlineDxf(image: string) {
  const gray = await loadGrayImage({ image });
  const geometry = vectorizeGrayImage(gray, { lineArt: true });
  if (!geometry.paths.length) {
    throw new Error("Zhang-Suen found no centerlines in this line drawing");
  }
  const dxf = geometryToDxf(geometry, { fitArcs: false });
  geometry.sourceDxf = dxf;
  return { geometry, dxf };
}
