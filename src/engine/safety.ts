// Crisis detection is fixed, readable logic. It never calls a model and it never
// improvises. A model-based classifier can be added later as a second net, but
// this layer stays in front of it and always wins.

export type SafetyLevel = "none" | "support" | "emergency";
export type SafetyKind =
  | "self-harm"
  | "harm-others"
  | "overdose"
  | "abuse"
  | "someone-else"
  | "none";

export interface SafetyResult {
  level: SafetyLevel;
  kind: SafetyKind;
  matched: string[];
}

interface Rule {
  re: RegExp;
  level: SafetyLevel;
  kind: SafetyKind;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z0-9' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Everyday exaggeration that should not trigger anything.
const IDIOMS: RegExp[] = [
  /\b(want|wanted|wanna|could|could just) (to )?die (of|from|inside) (embarrassment|shame|laughing|laughter|cringe)\b/g,
  /\bdie of (embarrassment|shame|laughing|laughter|cringe)\b/g,
  /\b(i'm|im|i am) (literally )?(dead|dying) (lol|haha|lmao)\b/g,
  /\b(is|are|was|were) (literally )?killing me\b/g,
  /\b(is|are) (going to|gonna) kill me\b/g,
  /\b(kill|die) for (a |an |some )?\w+\b/g,
  /\bto die for\b/g,
  /\bdead tired\b/g,
  /\bkilled it\b/g,
  /\bkill (the )?time\b/g,
  /\bkill (the )?(lights|engine|process|switch)\b/g,
];

const NEGATORS = /\b(not|never|no longer|don't|dont|do not|wouldn't|wouldnt|won't|wont|isn't|isnt|n't)\b/;

const RULES: Rule[] = [
  // Intent, plan, means, or timing for suicide or self-harm.
  { re: /\b(i'm|im|i am) (going to|gonna|about to) (kill myself|end my life|end it all|take my own life|hurt myself)\b/, level: "emergency", kind: "self-harm" },
  { re: /\b(i )?(have|got|made) (a )?(plan|means) (to|for) (kill|end|die|suicide|hurt)/, level: "emergency", kind: "self-harm" },
  { re: /\b(planning|decided|deciding|ready) (to )?(kill myself|end my life|take my own life|end it)\b/, level: "emergency", kind: "self-harm" },
  { re: /\b(written|wrote|writing|leaving) (a )?(suicide|goodbye) (note|letter)\b/, level: "emergency", kind: "self-harm" },
  { re: /\bsuicide note\b/, level: "emergency", kind: "self-harm" },
  { re: /\b(tonight|right now|today) (i'm|im|i am) (going to )?(kill myself|end it|end my life)\b/, level: "emergency", kind: "self-harm" },
  // Explicit first-person statements.
  { re: /\bi (want|wanna|need) to (kill myself|end my life|take my own life|commit suicide)\b/, level: "emergency", kind: "self-harm" },
  { re: /\bi('m| am| feel) suicidal\b/, level: "emergency", kind: "self-harm" },
  { re: /\bi (will|would|might|am gonna|'m gonna) kill myself\b/, level: "emergency", kind: "self-harm" },
  { re: /\bthinking (about|of) (killing myself|suicide|ending my life|ending it)\b/, level: "emergency", kind: "self-harm" },
  // Quieter signals: still get resources up front, conversation can continue.
  { re: /\bi (want|wanna|wish) (to )?die\b/, level: "support", kind: "self-harm" },
  { re: /\bi wish i (was|were) dead\b/, level: "support", kind: "self-harm" },
  { re: /\bi (just |really |sometimes )?wish i (could )?(just )?(disappear|not wake up|never woke up|wasn't here|weren't here)\b/, level: "support", kind: "self-harm" },
  { re: /\b(better off without me|no one would (notice|miss me)|nobody would (notice|miss me))\b/, level: "support", kind: "self-harm" },
  { re: /\b(don't|dont|do not) want to be (here|alive) (anymore|any more)\b/, level: "support", kind: "self-harm" },
  { re: /\b(no reason to (live|go on)|can't go on|cant go on|cannot go on)\b/, level: "support", kind: "self-harm" },
  { re: /\b(i )?(can't|cant|cannot) (do this|take this|keep going) anymore\b/, level: "support", kind: "self-harm" },
  { re: /\b(i've|ive|i have|i keep|i been|i've been) (been )?(hurting|cutting|harming) myself\b/, level: "support", kind: "self-harm" },
  { re: /\bi (want|wanna|need|keep wanting) to (hurt|cut|harm) myself\b/, level: "support", kind: "self-harm" },
  { re: /\bself harm(ing)?\b/, level: "support", kind: "self-harm" },
  // Medical emergency.
  { re: /\b(took|taken|swallowed) (way )?too many (pills|tablets|meds)\b/, level: "emergency", kind: "overdose" },
  { re: /\b(overdosed|overdosing|od'd|odd)\b/, level: "emergency", kind: "overdose" },
  // Harm to others.
  { re: /\b(i'm|im|i am) (going to|gonna) (kill|hurt|shoot|stab|beat up) (him|her|them|someone|people|everyone)\b/, level: "emergency", kind: "harm-others" },
  { re: /\bi (want|wanna) to (kill|shoot|stab) (him|her|them|someone|people|everyone)\b/, level: "emergency", kind: "harm-others" },
  // Safety at home or in a relationship.
  { re: /\b(he|she|they|my \w+|someone) (is|are|keeps|keep) (hitting|beating|choking|hurting) me\b/, level: "support", kind: "abuse" },
  { re: /\b(i'm|im|i am) (scared|afraid) (to go|of going) home\b/, level: "support", kind: "abuse" },
  { re: /\b(not|isn't|isnt) safe (at home|with him|with her|with them)\b/, level: "support", kind: "abuse" },
  { re: /\b(forced|made) me to (have sex|do things)\b/, level: "support", kind: "abuse" },
  // Worry about someone else.
  { re: /\bmy (friend|brother|sister|roommate|classmate|mom|dad|partner|boyfriend|girlfriend|cousin) (said|says|wants|want|is thinking|talked about|texted|told me)[^.]{0,40}(kill (himself|herself|themself|themselves)|suicide|end (his|her|their) life|wants to die|want to die)/, level: "support", kind: "someone-else" },
];

export function checkSafety(text: string): SafetyResult {
  let t = norm(text);
  for (const idiom of IDIOMS) t = t.replace(idiom, " ");
  t = t.replace(/\s+/g, " ");

  let best: SafetyResult = { level: "none", kind: "none", matched: [] };
  const rank = { none: 0, support: 1, emergency: 2 } as const;

  for (const rule of RULES) {
    const m = rule.re.exec(t);
    if (!m) continue;
    // Skip a match when a negation sits in the three words just before it.
    const before = t.slice(0, m.index).split(" ").slice(-3).join(" ");
    const phrase = m[0];
    if (NEGATORS.test(before) || /^(not|never)\b/.test(phrase)) continue;
    if (rank[rule.level] > rank[best.level]) {
      best = { level: rule.level, kind: rule.kind, matched: [phrase] };
    } else if (rank[rule.level] === rank[best.level] && rule.level !== "none") {
      best.matched.push(phrase);
    }
  }
  return best;
}

export interface Resource {
  name: string;
  how: string;
  detail?: string;
  copy: string;
  primary?: boolean;
}

const LIFELINE: Resource = {
  name: "988 Suicide & Crisis Lifeline",
  how: "Call or text 988",
  detail: "Free, 24/7, in the US. Chat is at 988lifeline.org.",
  copy: "988",
  primary: true,
};
const CRISIS_TEXT: Resource = {
  name: "Crisis Text Line",
  how: "Text HOME to 741741",
  detail: "Free, 24/7, in the US. You text with a trained crisis counselor.",
  copy: "741741",
};
const EMERGENCY: Resource = {
  name: "Emergency services",
  how: "Call 911",
  detail: "If you or someone near you is in immediate danger.",
  copy: "911",
  primary: true,
};
const POISON: Resource = {
  name: "Poison Control",
  how: "Call 1-800-222-1222",
  detail: "Free, 24/7, in the US. Call 911 first if someone is unresponsive or struggling to breathe.",
  copy: "1-800-222-1222",
};
const DV: Resource = {
  name: "National Domestic Violence Hotline",
  how: "Call 1-800-799-7233 or text START to 88788",
  detail: "Free, 24/7, confidential. Chat is at thehotline.org.",
  copy: "1-800-799-7233",
  primary: true,
};
/** Shown to 13 to 17 users after the 24/7 lines. Evenings only, so never the first thing listed. */
export const TEEN_LINE: Resource = {
  name: "Teen Line",
  how: "Call 1-800-852-8336, or text TEEN to 839863",
  detail: "Trained teen volunteers. Evenings only (6 to 10 p.m. Pacific by phone).",
  copy: "1-800-852-8336",
};
const TREVOR: Resource = {
  name: "The Trevor Project",
  how: "Call 1-866-488-7386 or text START to 678-678",
  detail: "For LGBTQ+ young people. Free, 24/7.",
  copy: "1-866-488-7386",
};
const RAINN: Resource = {
  name: "RAINN National Sexual Assault Hotline",
  how: "Call 1-800-656-4673",
  detail: "Free, 24/7, confidential.",
  copy: "1-800-656-4673",
};
const OUTSIDE_US: Resource = {
  name: "Outside the United States",
  how: "Search findahelpline.com",
  detail: "It lists free crisis lines by country. For immediate danger, call your local emergency number.",
  copy: "findahelpline.com",
};

export interface CrisisCopy {
  heading: string;
  body: string;
  resources: Resource[];
  canContinue: boolean;
}

// Hard-coded wording. Not generated.
export function crisisCopy(result: SafetyResult): CrisisCopy {
  switch (result.kind) {
    case "overdose":
      return {
        heading: "This needs medical help right now.",
        body: "Please call 911 or Poison Control now. If someone is with you, tell them what happened. HEARD can't help with this part, but these people can.",
        resources: [EMERGENCY, POISON, LIFELINE, OUTSIDE_US],
        canContinue: false,
      };
    case "harm-others":
      return {
        heading: "Let's slow this down and get another person involved.",
        body: "What you wrote sounds like it could end with someone getting hurt. Please step away from the situation and talk to a trained person right now. If anyone is in immediate danger, call 911.",
        resources: [EMERGENCY, LIFELINE, CRISIS_TEXT, OUTSIDE_US],
        canContinue: false,
      };
    case "abuse":
      return {
        heading: "Your safety comes first.",
        body: "What you described isn't okay, and you don't have to sort it out alone. These lines are free and confidential, and you can contact them without telling anyone else. If you're in danger right now, call 911.",
        resources: [DV, EMERGENCY, RAINN, OUTSIDE_US],
        canContinue: true,
      };
    case "someone-else":
      return {
        heading: "It's good that you're taking this seriously.",
        body: "If your friend is in immediate danger, call 911. Otherwise, you can call or text 988 yourself to ask how to help them. You don't have to be the only one supporting them.",
        resources: [LIFELINE, CRISIS_TEXT, EMERGENCY, OUTSIDE_US],
        canContinue: true,
      };
    default:
      return result.level === "emergency"
        ? {
            heading: "You deserve a real person right now.",
            body: "What you wrote is serious, and a trained counselor can talk with you right now. Please call or text 988. If you might act on these thoughts soon, call 911 or go to the nearest emergency room. If someone is nearby, tell them you need them with you.",
            resources: [LIFELINE, EMERGENCY, CRISIS_TEXT, TREVOR, OUTSIDE_US],
            canContinue: false,
          }
        : {
            heading: "Before anything else, there are people who can talk with you now.",
            body: "Some of what you wrote sounds painful. You can keep going here, and it's also okay to reach out to someone today. These lines are free and open all day and night.",
            resources: [LIFELINE, CRISIS_TEXT, TREVOR, OUTSIDE_US],
            canContinue: true,
          };
  }
}

export const ALWAYS_AVAILABLE: Resource[] = [LIFELINE, CRISIS_TEXT, EMERGENCY, TREVOR, DV, RAINN, OUTSIDE_US];
