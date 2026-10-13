import { moderateNote, moderateReply } from "./moderation";
import { SAMPLE_NOTES, DEMO_REPLIES } from "../data/notes";
import { checkSafety } from "./safety";

let bad = 0;
const t = (name: string, ok: boolean) => {
  if (!ok) bad++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}`);
};

const note = (s: string) => moderateNote(s).action;
const reply = (s: string) => moderateReply(s).action;

// Notes
t("ordinary note is allowed", note("I eat lunch in the library so nobody sees I'm alone, and I don't know how to change it.") === "allow");
t("too short is blocked", note("sad") === "block");
t("too long is blocked", note("a".repeat(901)) === "block");
t("abuse is blocked", note("Nobody cares about you, honestly you should just shut up about it already.") === "block");
t("promo is blocked", note("Feeling low lately, anyone want to talk? dm me on my insta, link in bio.") === "block");
t("serious note goes to crisis, never shared", note("I want to kill myself tonight and I have a plan.") === "crisis");
t("heavy note is held private", ["hold", "crisis"].includes(note("I don't see the point in anything anymore and I've been hurting myself.")));
t("details are masked", moderateNote("My name is Dara Okoye, email me at dara@example.edu, I feel invisible at school lately.").text.includes("dara@example.edu") === false);
t("masked note still allowed and says so", moderateNote("Text me at (215) 555-0143 if you've felt invisible at school, I could really use someone.").nudges.length > 0);

t("hopeless note is held private, not shared", note("I have been feeling really low and hopeless for weeks and can't tell anyone about it.") === "hold");

// Replies
t("kind reply is allowed", reply("I felt the same my first semester. What helped me was joining one small club.") === "allow");
t("diagnosis is blocked", reply("It sounds like you have depression, you should get checked for it.") === "block");
t("medication advice is blocked", reply("I would stop taking your meds, they never worked for me either.") === "block");
t("solicitation is blocked", reply("Really get it. Add me on discord and we can talk more, it's easier there.") === "block");
t("abuse is blocked", reply("Honestly you should die, everyone would be better off without this.") === "block");
t("too short is blocked", reply("ok") === "block");
t("'you should' gets a nudge, not a block", (() => { const v = moderateReply("You should talk to someone about this, it really does help over time."); return v.action === "allow" && v.nudges.length > 0; })());
t("'just relax' gets a nudge", moderateReply("Honestly just relax, it will pass and you will be fine soon enough.").nudges.length > 0);
t("serious topic in a reply nudges toward 988", moderateReply("I want to die sometimes too, and what helped me was calling someone that night.").nudges.some((n) => n.includes("988")));

// The sample content has to pass its own rules, and none of it may be serious enough to trip the safety check.
for (const n of SAMPLE_NOTES) t(`sample ${n.id} passes moderation`, note(n.text) === "allow" && checkSafety(n.text).level === "none");
for (const [k, list] of Object.entries(DEMO_REPLIES)) for (const r of list ?? []) t(`demo reply (${k}) passes moderation`, reply(r) === "allow");

console.log(bad ? `\n${bad} FAILED` : "\nall passed");
process.exit(bad ? 1 : 0);
