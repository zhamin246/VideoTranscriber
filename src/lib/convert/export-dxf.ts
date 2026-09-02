import type { CadCubic, CadGeometry } from "./geometry";
import { CAD_LAYER } from "./geometry";
import { fitBulgePolyline, sampleCubics } from "./fit-curve";

function pair(code: number, value: string | number) {
  const c = String(code).padStart(3, " ");
  return `${c}\n${value}\n`;
}

function hexHandle(n: number) {
  return n.toString(16).toUpperCase();
}

/** AutoCAD R2000 (AC1015) millimetre DXF, hairline LWPOLYLINE. */
export function geometryToDxf(
  geometry: CadGeometry,
  options: { fitArcs?: boolean } = {}
): string {
  let handle = 0x20;
  const nextHandle = () => hexHandle(++handle);

  const ltypeCont = nextHandle();
  const ltypeBylayer = nextHandle();
  const layerHandle = nextHandle();
  const layer0Handle = nextHandle();
  const styleHandle = nextHandle();
  const appidHandle = nextHandle();

  let out = "";
  out += pair(0, "SECTION");
  out += pair(2, "HEADER");
  out += pair(9, "$ACADVER");
  out += pair(1, "AC1015");
  out += pair(9, "$DWGCODEPAGE");
  out += pair(3, "ANSI_1252");
  out += pair(9, "$INSUNITS");
  out += pair(70, 4);
  out += pair(9, "$MEASUREMENT");
  out += pair(70, 1);
  out += pair(9, "$HANDSEED");
  out += pair(5, "FFFF");
  out += pair(9, "$EXTMIN");
  out += pair(10, 0);
  out += pair(20, 0);
  out += pair(30, 0);
  out += pair(9, "$EXTMAX");
  out += pair(10, geometry.width);
  out += pair(20, geometry.height);
  out += pair(30, 0);
  out += pair(0, "ENDSEC");

  out += pair(0, "SECTION");
  out += pair(2, "TABLES");

  out += pair(0, "TABLE");
  out += pair(2, "LTYPE");
  out += pair(5, nextHandle());
  out += pair(100, "AcDbSymbolTable");
  out += pair(70, 2);
  out += pair(0, "LTYPE");
  out += pair(5, ltypeBylayer);
  out += pair(100, "AcDbSymbolTableRecord");
  out += pair(100, "AcDbLinetypeTableRecord");
  out += pair(2, "BYLAYER");
  out += pair(70, 0);
  out += pair(3, "");
  out += pair(72, 65);
  out += pair(73, 0);
  out += pair(40, 0);
  out += pair(0, "LTYPE");
  out += pair(5, ltypeCont);
  out += pair(100, "AcDbSymbolTableRecord");
  out += pair(100, "AcDbLinetypeTableRecord");
  out += pair(2, "CONTINUOUS");
  out += pair(70, 0);
  out += pair(3, "Solid line");
  out += pair(72, 65);
  out += pair(73, 0);
  out += pair(40, 0);
  out += pair(0, "ENDTAB");

  out += pair(0, "TABLE");
  out += pair(2, "LAYER");
  out += pair(5, nextHandle());
  out += pair(100, "AcDbSymbolTable");
  out += pair(70, 2);
  out += pair(0, "LAYER");
  out += pair(5, layer0Handle);
  out += pair(100, "AcDbSymbolTableRecord");
  out += pair(100, "AcDbLayerTableRecord");
  out += pair(2, "0");
  out += pair(70, 0);
  out += pair(62, 7);
  out += pair(6, "CONTINUOUS");
  out += pair(0, "LAYER");
  out += pair(5, layerHandle);
  out += pair(100, "AcDbSymbolTableRecord");
  out += pair(100, "AcDbLayerTableRecord");
  out += pair(2, CAD_LAYER);
  out += pair(70, 0);
  out += pair(62, 7);
  out += pair(6, "CONTINUOUS");
  out += pair(370, -3);
  out += pair(0, "ENDTAB");

  out += pair(0, "TABLE");
  out += pair(2, "STYLE");
  out += pair(5, nextHandle());
  out += pair(100, "AcDbSymbolTable");
  out += pair(70, 1);
  out += pair(0, "STYLE");
  out += pair(5, styleHandle);
  out += pair(100, "AcDbSymbolTableRecord");
  out += pair(100, "AcDbTextStyleTableRecord");
  out += pair(2, "STANDARD");
  out += pair(70, 0);
  out += pair(40, 0);
  out += pair(41, 1);
  out += pair(50, 0);
  out += pair(71, 0);
  out += pair(42, 2.5);
  out += pair(3, "txt");
  out += pair(4, "");
  out += pair(0, "ENDTAB");

  out += pair(0, "TABLE");
  out += pair(2, "APPID");
  out += pair(5, nextHandle());
  out += pair(100, "AcDbSymbolTable");
  out += pair(70, 1);
  out += pair(0, "APPID");
  out += pair(5, appidHandle);
  out += pair(100, "AcDbSymbolTableRecord");
  out += pair(100, "AcDbRegAppTableRecord");
  out += pair(2, "ACAD");
  out += pair(70, 0);
  out += pair(0, "ENDTAB");

  out += pair(0, "ENDSEC");

  out += pair(0, "SECTION");
  out += pair(2, "BLOCKS");
  out += pair(0, "ENDSEC");

  out += pair(0, "SECTION");
  out += pair(2, "ENTITIES");
  const fitArcs = options.fitArcs !== false;
  const contourVerts = (
    points: { x: number; y: number }[],
    cubics: CadCubic[] | undefined,
    closed: boolean
  ) => {
    const samples =
      cubics?.length && points[0] ? sampleCubics(points[0], cubics, 12) : points;
    if (!fitArcs) return samples.map((p) => ({ x: p.x, y: p.y, bulge: 0 }));
    return fitBulgePolyline(samples, closed, 0.42);
  };
  const writePolyline = (
    points: { x: number; y: number }[],
    cubics: CadCubic[] | undefined,
    closed: boolean
  ) => {
    const verts = contourVerts(points, cubics, closed);
    if (verts.length < 2) return;
    out += pair(0, "LWPOLYLINE");
    out += pair(5, nextHandle());
    out += pair(100, "AcDbEntity");
    out += pair(8, geometry.layer || CAD_LAYER);
    out += pair(6, "CONTINUOUS");
    out += pair(62, 7);
    out += pair(370, -3);
    out += pair(100, "AcDbPolyline");
    out += pair(90, verts.length);
    out += pair(70, closed ? 1 : 0);
    out += pair(43, 0);
    for (const v of verts) {
      out += pair(10, round2(v.x));
      out += pair(20, round2(v.y));
      if (Math.abs(v.bulge) > 1e-4) out += pair(42, round4(v.bulge));
    }
  };
  for (const path of geometry.paths) {
    writePolyline(path.points, path.cubics, path.closed || Boolean(path.filled));
    for (const hole of path.holes || []) {
      writePolyline(hole.points, hole.cubics, hole.closed || true);
    }
  }
  out += pair(0, "ENDSEC");
  out += pair(0, "EOF");
  return out;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function round4(n: number) {
  return Math.round(n * 10000) / 10000;
}
