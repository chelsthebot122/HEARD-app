import { canUseOpenNotes, crisisLines, forAge, isTeen, teenFirst } from "./age";
import { LIBRARY } from "./data/library";
import { RESOURCES } from "./data/resources";
import { ALWAYS_AVAILABLE } from "./engine/safety";
import { analyze } from "./engine/topics";
import { matchPeople, retrieve } from "./engine/compose";
import { SEED_PEOPLE_TEEN, SEED_PEOPLE, STARTERS_TEEN } from "./data/seed";
import { withAge } from "./store.logic";

let bad = 0;
const t = (n: string, ok: boolean) => { if (!ok) bad++; console.log(`${ok ? "ok  " : "FAIL"} ${n}`); };

t("teen is teen, adult and unset are not", isTeen("teen") && !isTeen("adult") && !isTeen(undefined));
t("teens cannot use open Notes; adults can", !canUseOpenNotes("teen") && canUseOpenNotes("adult") && canUseOpenNotes(undefined));

const teenLib = forAge(LIBRARY, "teen");
t("teen library hides every adult-tagged source", teenLib.every((s) => s.audience !== "adult") && teenLib.length < LIBRARY.length && teenLib.length >= 8);
t("adult library keeps teen-friendly sources", forAge(LIBRARY, "adult").length === LIBRARY.length);
t("teen-first puts teen-suited sources ahead", teenFirst(teenLib, "teen")[0].audience === "teen");

const tr = forAge(RESOURCES, "teen");
t("teens get Teen Line, adults do not", tr.some((r) => r.id === "teenline") && !forAge(RESOURCES, "adult").some((r) => r.id === "teenline"));
t("teens don't see the paid adult therapist directory", !tr.some((r) => r.id === "openpath"));
t("teens still see 988, Crisis Text Line and 911", ["988", "ctl", "911"].every((id) => tr.some((r) => r.id === id)));
t("Teen Line has a number and text keyword", RESOURCES.find((r) => r.id === "teenline")!.tel === "18008528336" && RESOURCES.find((r) => r.id === "teenline")!.sms!.to === "839863");

const lines = crisisLines(ALWAYS_AVAILABLE, "teen");
t("crisis sheet adds Teen Line for teens only, after the 24/7 lines", lines.some((r) => r.name === "Teen Line") && !crisisLines(ALWAYS_AVAILABLE, "adult").some((r) => r.name === "Teen Line") && lines.findIndex((r) => r.name === "Teen Line") === lines.findIndex((r) => /Crisis Text/.test(r.name)) + 1);
t("crisis lines not duplicated on repeat", crisisLines(lines, "teen").filter((r) => r.name === "Teen Line").length === 1);
t("988 is still first for teens", lines[0].copy === "988");

const topics = analyze("I'm so lonely even though I'm surrounded by people at school").topics;
t("retrieve for teens never returns an adult-only source", retrieve(topics, [], [], "teen").every((r) => r.source.audience !== "adult"));
t("retrieve for adults can return those sources", retrieve(analyze("how to manage loneliness during college").topics, [], [], "adult").some((r) => r.source.audience === "adult"));

const m = matchPeople(analyze("my friend went quiet and I feel awful").topics, SEED_PEOPLE_TEEN, "teen");
t("teen matches put a trusted adult first", !!m[0].person.adult);
t("seed teen people include trusted adults and a school counselor", SEED_PEOPLE_TEEN.some((x) => x.adult) && SEED_PEOPLE_TEEN.some((x) => /counselor/i.test(x.relation)));
t("teen starters are written for school life", STARTERS_TEEN.length >= 5 && STARTERS_TEEN.some((s) => /school|lunch|group chat/i.test(s.text)));

const base = { v: 1 as const, onboarded: false, settings: {} as never, people: SEED_PEOPLE, steps: [], saved: [], dismissed: [], reachouts: [], history: [], notes: {} as never, myResources: [], links: [] };
const picked = withAge({ ...base, steps: [{ id: "x", text: "mine", when: "today", done: false }] }, "teen");
t("picking an age marks onboarded and stores only the band", picked.onboarded && picked.age === "teen" && !("birth" in picked));
t("customised data is not replaced by teen examples", picked.people === SEED_PEOPLE);
const untouched = withAge({ ...base, steps: [], reachouts: [] }, "teen");
t("untouched sample data swaps to the teen examples", untouched.people === SEED_PEOPLE_TEEN);

if (bad) { console.log(`${bad} FAILED`); process.exit(1); }
console.log("all passed");
