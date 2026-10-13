// Topic detection. Deliberately transparent: every topic comes with the words
// that triggered it, so the person can see why and correct it.

export type Need = "listening" | "practical" | "humor" | "perspective" | "company" | "professional";
export type TopicId =
  | "isolation"
  | "transition"
  | "family"
  | "friendship"
  | "overwhelm"
  | "pressure"
  | "burnout"
  | "grief"
  | "breakup"
  | "romance"
  | "bullying"
  | "unheard"
  | "selfdoubt";

export interface TopicDef {
  id: TopicId;
  label: string;
  /** Completes "I've been dealing with ..." in a draft message. */
  phrase: string;
  needs: Need[];
  starters: string[];
  lex: { re: RegExp; w: number }[];
}

export const TOPICS: TopicDef[] = [
  {
    id: "isolation",
    label: "Feeling alone",
    phrase: "feeling pretty alone lately",
    needs: ["company", "listening"],
    starters: [
      "I've been spending a lot of time by myself, and I think it's starting to weigh on me.",
      "I don't have anyone I check in with regularly, and I'd like that to change.",
      "I'm not looking for a big social life. I'd just like one or two people I can be real with.",
    ],
    lex: [
      { re: /\b(alone|lonely|loneliness|isolated|isolating)\b/i, w: 2 },
      { re: /\b(no one|nobody) (to talk|to sit|to eat|to hang|checks|texts|calls|invites)/i, w: 2.5 },
      { re: /\b(eat|eating|sit|sitting|spend|spending)[^.]{0,20}\b(alone|by myself)\b/i, w: 2.5 },
      { re: /\b(left out|leave me out|don't have (any )?friends|no friends|haven't made (any )?friends)\b/i, w: 2.5 },
      { re: /\beveryone (already )?has (their|a) (people|group|friends)\b/i, w: 2.5 },
      { re: /\b(break|breaking) in\b/i, w: 1 },
      { re: /\b(lonely|alone|isolated)\b[^.]{0,30}\b(even (though|when|if)|despite|while)\b[^.]{0,40}\b(surrounded|around (people|friends|everyone)|not alone|with (people|friends|family))\b/i, w: 3.5 },
      { re: /\b(surrounded by (people|friends)|around people (all day|all the time))\b[^.]{0,40}\b(lonely|alone|empty|unseen|invisible)\b/i, w: 3.5 },
    ],
  },
  {
    id: "transition",
    label: "A big change",
    phrase: "adjusting to a big change",
    needs: ["perspective", "practical"],
    starters: [
      "Since the move, nothing feels familiar yet, and I'm not sure how long that's supposed to take.",
      "I thought I'd feel settled by now, and I don't.",
      "I'm trying to figure out what 'normal' looks like in this new place.",
    ],
    lex: [
      { re: /\b(switched|switching|changed|changing|transferred|transferring) (schools?|colleges?|majors?|jobs?|teams?)\b/i, w: 3 },
      { re: /\b(moved|moving|relocated|relocating) (to|here|away|cities|states|abroad)\b/i, w: 2.5 },
      { re: /\b(new (school|city|town|job|campus|apartment|team|country)|first (year|semester|week|month)|freshman|transfer student)\b/i, w: 2 },
      { re: /\b(since (i|we) (moved|started|transferred|switched))\b/i, w: 2 },
      { re: /\b(adjust|adjusting|settle in|settling in|fit in|fitting in)\b/i, w: 1.5 },
    ],
  },
  {
    id: "family",
    label: "Tension at home",
    phrase: "some tension with my family",
    needs: ["perspective", "listening"],
    starters: [
      "Things at home have been tense, and I want to talk about it without it turning into an argument.",
      "I love my family and I'm struggling with them at the same time.",
      "I'd like to explain how I'm feeling without it sounding like I'm blaming anyone.",
    ],
    lex: [
      { re: /\b(my )?(parents?|mom|mum|dad|stepmom|stepdad|guardian|grandparents?|siblings?|sister|brother|family)\b/i, w: 1 },
      { re: /\b(keep|keeps) (comparing|yelling|fighting|arguing|nagging|criticizing)\b/i, w: 3 },
      { re: /\b(yell|yells|yelling|argu(e|es|ing|ment)|fight|fights|fighting)\b[^.]{0,30}\b(home|house|parents?|mom|dad|family)\b/i, w: 2.5 },
      { re: /\b(divorce|separated|custody|moving back (home|in)|living at home|curfew|strict)\b/i, w: 2 },
      { re: /\b(ungrateful|disappoint(ed|ing)?)\b[^.]{0,30}\b(parents?|mom|dad|family)\b|\b(parents?|mom|dad|family)\b[^.]{0,30}\b(ungrateful|disappoint(ed|ing)?)\b/i, w: 2.5 },
    ],
  },
  {
    id: "friendship",
    label: "Trouble with a friend",
    phrase: "something going wrong with a friendship",
    needs: ["perspective", "listening"],
    starters: [
      "Something changed between us, and I'd rather ask about it than guess.",
      "I miss how things used to be with us, and I don't want to let it fade without trying.",
      "I may have hurt you, or you may have hurt me. Either way, I'd like to talk.",
    ],
    lex: [
      { re: /\b(best friend|my friend|friend group|friends)\b/i, w: 1 },
      { re: /\b(ghosted|ghosting|left me on read|on read|stopped (texting|replying|talking)|drifted|drifting apart|grew apart)\b/i, w: 3 },
      { re: /\b(fell out|falling out|fight with|argument with|betrayed|talking behind my back|group chat)\b/i, w: 2.5 },
      { re: /\b(friend|friends)\b[^.]{0,40}\b(went quiet|goes quiet|gone quiet|distant|pulling away|pulled away|avoiding me|ignoring me|one[- ]word|doesn't (text|answer)|won't (talk|answer))\b/i, w: 3 },
      { re: /\b(don't|do not|dont) know what i (did|said)\b/i, w: 1.5 },
      { re: /\b(went from|used to (text|talk|hang))[^.]{0,40}\b(nothing|never|anymore)\b/i, w: 2.5 },
    ],
  },
  {
    id: "overwhelm",
    label: "Overwhelm and worry",
    phrase: "feeling overwhelmed and anxious",
    needs: ["listening", "practical"],
    starters: [
      "My head has been loud lately, and I'd like to get some of it out of my head and into words.",
      "There's too much on my plate and I can't tell what to tackle first.",
      "I get a tight feeling when I think about what's coming up.",
    ],
    lex: [
      { re: /\b(overwhelm(ed|ing)?|anxious|anxiety|panic(king|ked)?|spiral(ing)?|racing thoughts|can't stop thinking|overthinking)\b/i, w: 2.5 },
      { re: /\b(stress(ed|ful)?|worr(y|ied|ying)|on edge|tight chest|can't breathe|too much)\b/i, w: 1.5 },
      { re: /\b(so many things|everything at once|don't know where to start)\b/i, w: 2 },
    ],
  },
  {
    id: "pressure",
    label: "School or work pressure",
    phrase: "a lot of pressure with school and work",
    needs: ["practical", "perspective"],
    starters: [
      "I'm behind on a few things and I'd like help making a realistic plan.",
      "I'm putting a lot of pressure on myself and I'd like another view on whether it's reasonable.",
      "I'd like to figure out who I can ask for an extension or help.",
    ],
    lex: [
      { re: /\b(exam|exams|midterms?|finals?|gpa|grades?|deadline|deadlines|assignments?|essay|thesis|capstone|failing|behind on)\b/i, w: 1.5 },
      { re: /\b(never (feels|feel) like enough|not enough|pressure|perfect(ion|ionist)?)\b/i, w: 2 },
      { re: /\b(missing|missed) deadlines?\b/i, w: 2.5 },
      { re: /\b(comparing (my )?grades|compare(d)? (me )?to)\b/i, w: 2 },
    ],
  },
  {
    id: "burnout",
    label: "Running on empty",
    phrase: "feeling worn out and low on energy",
    needs: ["practical", "listening"],
    starters: [
      "I'm tired in a way that sleep doesn't fix, and I'd like to say that to someone.",
      "I used to be able to do this easily and now it takes everything I have.",
      "I want to figure out what's draining me and what I can set down.",
    ],
    lex: [
      { re: /\b(exhausted|burn(ed|t)? out|burnout|drained|worn out|running on empty|no energy|zero energy)\b/i, w: 3 },
      { re: /\b(still tired|tired all the time|moving through mud|unmotivated|no motivation|can't focus|can't concentrate)\b/i, w: 2.5 },
      { re: /\b(sleep enough|sleeping enough)[^.]{0,30}\b(still|but)\b/i, w: 2 },
    ],
  },
  {
    id: "grief",
    label: "Loss and grief",
    phrase: "grieving someone I lost",
    needs: ["listening", "company"],
    starters: [
      "I lost someone, and I'm still working out what that looks like day to day.",
      "People expect me to be okay by now, and I'm not sure I am.",
      "I'd like to talk about them, and I don't know who will let me.",
    ],
    lex: [
      { re: /\b(died|passed away|passed on|death of|funeral|memorial|lost my (mom|dad|grandma|grandmother|grandpa|grandfather|friend|dog|cat|brother|sister|uncle|aunt))\b/i, w: 3.5 },
      { re: /\b(grief|grieving|mourning|miss (him|her|them)|since (he|she|they) (died|passed))\b/i, w: 3 },
      { re: /\b(still reach for my phone|expect me to be fine)\b/i, w: 2 },
    ],
  },
  {
    id: "breakup",
    label: "Heartbreak",
    phrase: "getting over a breakup",
    needs: ["listening", "humor"],
    starters: [
      "The relationship ended and I'm still figuring out who I am without it.",
      "I keep checking whether they've posted, and I'd like to stop.",
      "I'm okay one hour and not the next, and that's confusing.",
    ],
    lex: [
      { re: /\b(break ?up|broke up|breaking up|my ex|heartbroken|heartbreak|dumped|got dumped|split up)\b/i, w: 3 },
      { re: /\b(boyfriend|girlfriend|partner|dating|situationship)\b[^.]{0,40}\b(ended|over|left|cheated|stopped)\b/i, w: 2.5 },
    ],
  },
  {
    id: "romance",
    label: "New love and dating",
    phrase: "something new with someone I like",
    needs: ["listening", "perspective", "humor"],
    starters: [
      "I've started to like someone and I don't know how to tell whether they feel the same.",
      "I'm excited and nervous at the same time, and I'd like to talk it through with someone.",
      "I want to take this slowly and I'm not sure how to say that.",
    ],
    lex: [
      { re: /\b(crush|crushing|falling for|fell for|developing feelings|catching feelings|have feelings for)\b/i, w: 3 },
      { re: /\b(first date|going on a date|asked me out|ask (him|her|them) out|situationship|talking stage|new relationship|dating app)\b/i, w: 3 },
      { re: /\b(like|likes|liked) (him|her|them|someone)\b[^.]{0,40}\b(back|too|same)\b/i, w: 2 },
      { re: /\b(in love|falling in love|love (him|her|them))\b/i, w: 2.5 },
    ],
  },
  {
    id: "bullying",
    label: "Being picked on",
    phrase: "being treated badly by other people",
    needs: ["practical", "professional"],
    starters: [
      "Some people have been treating me badly, and I want to know what my options are.",
      "I'd like to write down what happened so I can explain it clearly.",
      "I don't want to handle this alone, and I'm not sure who the right person is.",
    ],
    lex: [
      { re: /\b(bullied|bullying|bully|harass(ed|ing|ment)|mocked|made fun of|teased|teasing|picked on|humiliat(ed|ing))\b/i, w: 3.5 },
      { re: /\b(rumou?rs?|spread(ing)? (lies|rumou?rs?)|posted about me|screenshot(s|ed)?)\b/i, w: 2 },
      { re: /\b(group chat)[^.]{0,30}\b(about me|laughing)\b/i, w: 2 },
    ],
  },
  {
    id: "unheard",
    label: "Not feeling heard",
    phrase: "not feeling heard",
    needs: ["listening", "perspective"],
    starters: [
      "I've tried to explain this before and I don't think it landed, so I'm going to try a different way.",
      "I don't need you to agree. I'd like you to hear the whole thing first.",
      "I keep things to myself because I'm not sure how to say them without making it a big deal.",
    ],
    lex: [
      { re: /\b(no ?one|nobody) (listens|understands|gets it|hears me|cares)\b/i, w: 3 },
      { re: /\b(brush(es|ed)? (it )?off|dismiss(ed|es|ing)?|don't take me seriously|talk over me|can't explain|don't know how to (say|explain|tell))\b/i, w: 2.5 },
      { re: /\b(keep (it|things|everything) to myself|bottle (it )?up|sound(ing)? ungrateful|without sounding)\b/i, w: 2 },
      { re: /\b(wish (someone|somebody|anyone) would (listen|ask))\b/i, w: 2.5 },
    ],
  },
  {
    id: "selfdoubt",
    label: "Self-doubt",
    phrase: "doubting myself a lot",
    needs: ["perspective", "professional"],
    starters: [
      "I've been talking to myself in a way I wouldn't talk to a friend.",
      "I keep feeling like everyone else knows what they're doing and I don't.",
      "I'd like help seeing myself a little more fairly.",
    ],
    lex: [
      { re: /\b(not good enough|never good enough|imposter|impostor|fraud|don't belong|stupid|worthless|failure|useless)\b/i, w: 3 },
      { re: /\b(compare(d|s)? myself|everyone else (is|has|seems)|behind everyone|not smart enough)\b/i, w: 2.5 },
      { re: /\b(hate (how|that) i|feel like a burden)\b/i, w: 2 },
    ],
  },
];

export const TOPIC_BY_ID = Object.fromEntries(TOPICS.map((t) => [t.id, t])) as Record<TopicId, TopicDef>;

export type Strength = "Strong match" | "Likely" | "Possible";

export interface DetectedTopic {
  id: TopicId;
  label: string;
  score: number;
  strength: Strength;
  evidence: string[];
  /** true when the person added this topic themselves */
  manual?: boolean;
}

export interface Analysis {
  topics: DetectedTopic[];
  wordCount: number;
}

const strengthOf = (s: number): Strength => (s >= 4 ? "Strong match" : s >= 2.5 ? "Likely" : "Possible");

export function analyze(text: string): Analysis {
  const found: DetectedTopic[] = [];
  for (const t of TOPICS) {
    let score = 0;
    const evidence: string[] = [];
    for (const { re, w } of t.lex) {
      const m = re.exec(text);
      if (m) {
        score += w;
        const phrase = m[0].trim();
        if (phrase.length <= 60 && !evidence.some((e) => e.toLowerCase() === phrase.toLowerCase())) evidence.push(phrase);
      }
    }
    if (score >= 1.5) found.push({ id: t.id, label: t.label, score, strength: strengthOf(score), evidence });
  }
  found.sort((a, b) => b.score - a.score);
  const top = found[0]?.score ?? 0;
  const topics = found.filter((f, i) => i === 0 || (i < 3 && f.score >= top * 0.45));
  return { topics, wordCount: text.trim().split(/\s+/).filter(Boolean).length };
}

export function manualTopic(id: TopicId): DetectedTopic {
  const t = TOPIC_BY_ID[id];
  return { id, label: t.label, score: 3, strength: "Likely", evidence: [], manual: true };
}

export interface Segment {
  text: string;
  hit: boolean;
}

/** Splits text into plain and highlighted segments for the "what I heard" view. */
export function highlight(text: string, phrases: string[]): Segment[] {
  const ranges: [number, number][] = [];
  const lower = text.toLowerCase();
  for (const p of phrases) {
    const i = lower.indexOf(p.toLowerCase());
    if (i >= 0) ranges.push([i, i + p.length]);
  }
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([...r] as [number, number]);
  }
  const out: Segment[] = [];
  let cur = 0;
  for (const [a, b] of merged) {
    if (a > cur) out.push({ text: text.slice(cur, a), hit: false });
    out.push({ text: text.slice(a, b), hit: true });
    cur = b;
  }
  if (cur < text.length) out.push({ text: text.slice(cur), hit: false });
  return out.length ? out : [{ text, hit: false }];
}
