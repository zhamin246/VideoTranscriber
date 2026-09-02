import { sanitizeCadFilename, type CadGeometry, type ConvertExportFormat } from "./geometry";

function clickDownload(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(href);
}

/** Instant DXF/SVG from in-browser trace — avoids a huge POST that often fails. */
export function downloadCadLocally(
  geometry: CadGeometry,
  format: ConvertExportFormat,
  title: string
): boolean {
  if (format === "svg" && geometry.sourceSvg) {
    clickDownload(
      new Blob([geometry.sourceSvg], { type: "image/svg+xml;charset=utf-8" }),
      sanitizeCadFilename(title, "svg")
    );
    return true;
  }
  if (format === "dxf") {
    const dxf = geometry.sourceDxf;
    if (dxf) {
      clickDownload(
        new Blob([dxf], { type: "application/dxf;charset=utf-8" }),
        sanitizeCadFilename(title, "dxf")
      );
      return true;
    }
  }
  return false;
}

export function downloadDxfText(dxf: string, title: string, suffix: string) {
  clickDownload(
    new Blob([dxf], { type: "application/dxf;charset=utf-8" }),
    sanitizeCadFilename(`${title}-${suffix}`, "dxf")
  );
}

export function geometryForExportPost(geometry: CadGeometry): CadGeometry {
  return {
    ...geometry,
    sourceSvg: undefined,
    sourceDxf: undefined,
  };
}
