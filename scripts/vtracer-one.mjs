import { readFileSync, writeFileSync } from "fs";
import { convertBuffer } from "@visioncortex/vtracer";

const input = process.argv[2];
const output = process.argv[3];
const buf = new Uint8Array(readFileSync(input));
const svg = convertBuffer(buf, {
  clustering: "bw",
  mode: "spline",
  filterSpeckle: 4,
  cornerThreshold: 60,
  lengthThreshold: 4,
  spliceThreshold: 45,
  pathPrecision: 8,
});
writeFileSync(output, svg);
console.log("wrote", output, "bytes", svg.length);
