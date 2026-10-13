import { checkSafety, type SafetyResult } from "./safety";
import { redact, type Mask } from "./redact";

// Fixed rules, no model. Every decision comes with a plain-language reason the writer can read.
// This is a first filter for a prototype. A live Notes service also needs human moderators,
// rate limits, blocking/reporting and an escalation path (see README).

export type Action = "allow" | "hold" | "block" | "crisis";

export interface Verdict {
  action: Action;
  /** Why it was held or blocked, in words the writer can act on. */
  reasons: string[];
  /** Soft suggestions that never stop a send. */
  nudges: string[];
  /** The text with personal details hidden. This is what would be shared. */
  text: string;
  masks: Mask[];
  safety: SafetyResult;
}

export const NOTE_MIN = 20;
export const NOTE_MAX = 900;
export const REPLY_MIN = 15;
export const REPLY_MAX = 700;

const ABUSE = /\b(kill yourself|kys|go die|you should die|nobody (cares|likes) you|you'?re (worthless|pathetic|disgusting)|shut up)\b/i;
// Not emergencies, but heavy enough that strangers shouldn't be the only ones to read it.
const HEAVY = /\b(hopeless|worthless|can'?t go on|no way out|nothing matters|hate myself|hurting myself|hurt myself|self[- ]harm|cutting myself|give up on (life|everything)|don'?t see the point)\b/i;
const SOLICIT = /\b(dm me|message me|text me|add me|follow me|my (snap|insta|discord|telegram|whatsapp)|check out my|link in bio|promo code|click here|subscribe)\b/i;
const DIAGNOSE = /\b(you (have|probably have|might have|likely have|sound like you have|clearly have) (depression|anxiety|adhd|bipolar|ptsd|ocd|an? (eating|personality) disorder|borderline)|i diagnose|diagnos(e|ing) you)\b/i;
const MEDS = /\b(stop taking|quit taking|come off|don'?t take|increase (your )?(dose|dosage)|skip (your )?(meds|medication)|take (more|double) of)\b/i;

const NUDGES: { re: RegExp; say: string }[] = [
  { re: /\byou should\b|\byou need to\b|\byou have to\b/i, say: "“You should” can feel like a push. Try “what helped me was…”." },
  { re: /\bat least\b/i, say: "“At least…” can make a hard thing feel smaller than it is. Try naming what they said first." },
  { re: /\bjust (relax|get over|cheer up|stop|ignore|be positive|move on|calm down)\b|\bcalm down\b|\bget over it\b/i, say: "Phrases like “just relax” tend to land badly. Try “that sounds really hard”." },
  { re: /\beveryone (feels|goes through)\b/i, say: "“Everyone feels this” can read as dismissive. Speaking from your own experience usually lands better." },
];

function base(text: string): Pick<Verdict, "text" | "masks" | "safety"> {
  const { text: masked, masks } = redact(text);
  return { text: masked, masks, safety: checkSafety(text) };
}

export function moderateNote(raw: string): Verdict {
  const t = raw.trim();
  const b = base(t);
  const reasons: string[] = [];
  const nudges: string[] = [];

  if (b.safety.level === "emergency") return { action: "crisis", reasons: ["What you wrote sounds serious, so it won't be shared with other people. The numbers are one tap away."], nudges, ...b };
  if (b.safety.level === "support") return { action: "hold", reasons: ["This sounds heavy. Notes are read by strangers who aren't trained to help, so this one is kept private. You can save it for yourself, and the numbers below are staffed by people who are trained."], nudges, ...b };

  if (HEAVY.test(t)) return { action: "hold", reasons: ["This sounds heavy. Notes are read by strangers who aren't trained to help, so this one is kept private. You can save it for yourself, and the numbers below are staffed by people who are trained."], nudges, ...b };

  if (t.length < NOTE_MIN) reasons.push(`Write a little more (at least ${NOTE_MIN} characters) so a reader has something to answer.`);
  if (t.length > NOTE_MAX) reasons.push(`Notes are short, up to ${NOTE_MAX} characters. Yours is ${t.length}.`);
  if (ABUSE.test(t)) reasons.push("Notes can't include language aimed at hurting someone.");
  if (SOLICIT.test(t)) reasons.push("Notes can't ask people to contact you elsewhere or promote anything.");
  if (b.masks.length) nudges.push(`Hid ${b.masks.length} personal detail${b.masks.length > 1 ? "s" : ""} (${[...new Set(b.masks.map((m) => m.kind))].join(", ")}) so you stay anonymous.`);

  return { action: reasons.length ? "block" : "allow", reasons, nudges, ...b };
}

export function moderateReply(raw: string): Verdict {
  const t = raw.trim();
  const b = base(t);
  const reasons: string[] = [];
  const nudges: string[] = [];

  if (t.length < REPLY_MIN) reasons.push(`Say a little more (at least ${REPLY_MIN} characters). Even “that sounds hard, I've been there” helps.`);
  if (t.length > REPLY_MAX) reasons.push(`Replies are up to ${REPLY_MAX} characters. Yours is ${t.length}.`);
  if (ABUSE.test(t)) reasons.push("Replies can't include language aimed at hurting someone.");
  if (SOLICIT.test(t)) reasons.push("Replies can't ask someone to contact you elsewhere or promote anything.");
  if (DIAGNOSE.test(t)) reasons.push("Please don't diagnose. You can say what you went through instead.");
  if (MEDS.test(t)) reasons.push("Please don't give medication advice. A doctor or pharmacist is the right person for that.");
  if (b.masks.length) nudges.push(`Hid ${b.masks.length} personal detail${b.masks.length > 1 ? "s" : ""} so you stay anonymous too.`);
  for (const n of NUDGES) if (n.re.test(t)) nudges.push(n.say);
  if (b.safety.level !== "none") nudges.push("If you're worried about this person's safety, a reply can't replace a call. Mention that 988 (call or text) is free and always open.");

  return { action: reasons.length ? "block" : "allow", reasons, nudges, ...b };
}
