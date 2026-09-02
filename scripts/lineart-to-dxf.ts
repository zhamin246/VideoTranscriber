import { readFileSync, writeFileSync } from "fs";
import { vectorizeWithVtracerBuffer } from "../src/lib/convert/trace-vtracer";
import { geometryToDxf } from "../src/lib/convert/export-dxf";

const input = process.argv[2];
const output = process.argv[3];
const buf = readFileSync(input);
const geo = vectorizeWithVtracerBuffer(buf, 1086, 1448);
const dxf = geometryToDxf(geo);
writeFileSync(output, dxf);
console.log("paths", geo.paths.length, "wrote", output, "bytes", dxf.length);
