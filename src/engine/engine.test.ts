import { analyze } from "./topics";
import { redact } from "./redact";
import { retrieve, matchPeople, draftMessage, countByType } from "./compose";
import { STARTERS, SEED_PEOPLE } from "../data/seed";
import { checkSafety } from "./safety";

let bad = 0;
const expectFirst: Record<string, string> = {
  "New school, eating alone": "isolation|transition",
  "Parents and grades": "family|pressure",
  "Best friend went quiet": "friendship",
  "Three weeks after a loss": "grief",
  "Tired after midterms": "burnout|pressure",
};
for (const s of STARTERS) {
  const a = analyze(s.text);
  const ids = a.topics.map((t) => t.id);
  const ok = expectFirst[s.label].split("|").includes(ids[0]);
  if (!ok) bad++;
  const r = retrieve(a.topics, []);
  console.log(ok ? "ok  " : "FAIL", s.label, "->", ids.join(", "), "| sources:", JSON.stringify(countByType(r)));
  if (checkSafety(s.text).level !== "none") { bad++; console.log("FAIL safety flagged a starter:", s.label); }
}

const r = redact("Hi I'm at 4412 Larkspur Lane, my name is Dara Okoye, email dara.okoye@example.edu or call (215) 555-0143. I go to Westmere University. @dara_o");
console.log(r.text, r.masks.map((m) => m.kind).join(","));
if (r.masks.length < 6) bad++;

for (const [t, gone] of [["My name is Dara Okoye and I moved here.", ["Dara", "Okoye"]], ["Hi, I'm Dara Okoye.", ["Dara", "Okoye"]], ["Call me Dara.", ["Dara"]], ["I'm Tired of it all", []]] as [string, string[]][]) {
  const o = redact(t).text;
  if (gone.some((g) => o.includes(g))) { bad++; console.log("FAIL name not hidden:", o); }
}
if (redact("I'm Tired of it all").masks.length) { bad++; console.log("FAIL over-masked an adjective"); }

const a = analyze(STARTERS[0].text);
const m = matchPeople(a.topics, SEED_PEOPLE);
console.log(m.map((x) => `${x.person.name}:${x.score}`).join(" | "));
console.log(draftMessage({ person: SEED_PEOPLE[3], topics: a.topics, tone: "warm", ask: "advice", channel: "email", timing: "this week" }));
console.log(draftMessage({ person: SEED_PEOPLE[4], topics: a.topics, tone: "warm", ask: "advice", channel: "email", timing: "this week" }));
console.log(analyze("Not sure what is wrong, I just feel off.").topics.length, "topics for vague text");
for (const [text, want] of [
  ["I feel lonely even though I'm surrounded by people all day.", "isolation"],
  ["I have a crush on someone in my class and I don't know if they like me back.", "romance"],
  ["I think I'm falling in love and it scares me.", "romance"],
  ["My ex and I broke up in August and I'm heartbroken.", "breakup"],
  ["My best friend went quiet and I don't know what I did.", "friendship"],
] as [string, string][]) {
  const got = analyze(text).topics.map((t) => t.id);
  const ok = got.includes(want as never);
  if (!ok) { bad++; console.log("FAIL topic", want, "not in", got.join(","), "for:", text); } else console.log("ok   topic", want);
}
process.exit(bad ? 1 : 0);
