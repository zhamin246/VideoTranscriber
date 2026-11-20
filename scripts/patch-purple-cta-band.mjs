import fs from "fs";
import { execSync } from "child_process";

const files = execSync(
  "git ls-files src/components/face-rating",
  { encoding: "utf8" },
)
  .trim()
  .split(/\r?\n/)
  .filter((f) => f.endsWith(".tsx"));

const from =
  'className="overflow-hidden text-center" style={{ backgroundColor: "#8882F5" }}';
const to = 'className="ac-purple-cta-band overflow-hidden text-center"';

let n = 0;
for (const file of files) {
  let c = fs.readFileSync(file, "utf8");
  if (!c.includes(from)) continue;
  c = c.split(from).join(to);
  fs.writeFileSync(file, c);
  n++;
  console.log(file);
}
console.log("updated", n);