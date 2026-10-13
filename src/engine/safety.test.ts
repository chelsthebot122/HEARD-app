import { checkSafety } from "./safety";
import { SAFETY_CASES } from "../data/safetyCases";

let pass = 0;
const fails: string[] = [];
for (const c of SAFETY_CASES) {
  const r = checkSafety(c.text);
  if (r.level === c.expect) pass++;
  else fails.push(`${c.id} expected ${c.expect}, got ${r.level} (${r.kind}) :: ${c.text}`);
}
console.log(`${pass}/${SAFETY_CASES.length} passed`);
for (const f of fails) console.log("FAIL", f);
process.exit(fails.length ? 1 : 0);
