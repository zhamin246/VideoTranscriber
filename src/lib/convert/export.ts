import type { CadGeometry, ConvertExportFormat } from "./geometry";
import { geometryToDxf } from "./export-dxf";
import { geometryToPdf } from "./export-pdf";
import { geometryToSvg } from "./export-svg";

export type { ConvertExportFormat };

export function isExportFormat(value: string): value is ConvertExportFormat {
  return value === "dxf" || value === "svg" || value === "pdf" || value === "geometry";
}

export function exportGeometry(
  geometry: CadGeometry,
  format: ConvertExportFormat
): { body: Uint8Array; contentType: string; ext: string } {
  if (format === "dxf") {
    return {
      body: Buffer.from(geometry.sourceDxf || geometryToDxf(geometry), "utf8"),
      contentType: "application/dxf",
      ext: "dxf",
    };
  }
  if (format === "svg") {
    return {
      body: Buffer.from(geometryToSvg(geometry), "utf8"),
      contentType: "image/svg+xml; charset=utf-8",
      ext: "svg",
    };
  }
  if (format === "pdf") {
    return {
      body: geometryToPdf(geometry),
      contentType: "application/pdf",
      ext: "pdf",
    };
  }
  return {
    body: Buffer.from(JSON.stringify(geometry), "utf8"),
    contentType: "application/json; charset=utf-8",
    ext: "json",
  };
}
