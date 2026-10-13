import { LIBRARY, type Source, type SourceType } from "../data/library";
import { TOPIC_BY_ID, type DetectedTopic, type Need } from "./topics";
import type { Age, Person, Reach } from "../types";
import { forAge, isTeen } from "../age";

// ---------- retrieval

export interface Ranked {
  source: Source;
  score: number;
  because: string[];
}

export function retrieve(topics: DetectedTopic[], dismissed: string[], extra: Source[] = [], age?: Age): Ranked[] {
  const out: Ranked[] = [];
  for (const s of forAge([...LIBRARY, ...extra], age)) {
    if (dismissed.includes(s.id)) continue;
    let score = 0;
    const because: string[] = [];
    for (const t of topics) {
      const idx = s.topics.indexOf(t.id);
      if (idx < 0) continue;
      score += t.score * (idx === 0 ? 1 : 0.6);
      because.push(t.label);
    }
    if (score > 0) out.push({ source: s, score: isTeen(age) && s.audience === "teen" ? score * 1.25 : score, because });
  }
  return out.sort((a, b) => b.score - a.score || b.source.added.localeCompare(a.source.added));
}

export function countByType(r: Ranked[]): Record<SourceType, number> {
  const c: Record<SourceType, number> = { experience: 0, general: 0, professional: 0 };
  for (const x of r) c[x.source.type]++;
  return c;
}

// ---------- reflection

const join = (xs: string[]) =>
  xs.length <= 1 ? xs[0] ?? "" : xs.length === 2 ? `${xs[0]} and ${xs[1]}` : `${xs.slice(0, -1).join(", ")}, and ${xs[xs.length - 1]}`;

export function reflection(topics: DetectedTopic[]): { lead: string; caveat: string } {
  if (!topics.length) {
    return {
      lead: "I couldn't pin down a main topic from that. Add a few more words, or pick a topic yourself below.",
      caveat: "I match your words against topics. I'm not a person, so I can miss things.",
    };
  }
  const names = topics.map((t) => t.label.toLowerCase());
  return {
    lead: `From what you wrote, the main thing${topics.length > 1 ? "s seem" : " seems"} to be ${join(names)}.`,
    caveat: "I match your words against topics, so check this against how it actually feels. You can remove or add topics, and the reading below updates.",
  };
}

// ---------- people

export interface PersonMatch {
  person: Person;
  score: number;
  why: string;
}

export function shortName(name: string): string {
  const w = name.trim().split(/\s+/);
  return /^(Dr\.|Coach|Aunt|Uncle|Professor|Prof\.|Ms\.|Mr\.|Mrs\.)$/.test(w[0]) && w[1] ? `${w[0]} ${w[1]}` : w[0];
}

const NEED_WORD: Record<Need, string> = {
  listening: "a good listener",
  practical: "good with practical next steps",
  humor: "good at lightening things",
  perspective: "good at perspective",
  company: "easy company",
  professional: "trained to help with this",
};

export function matchPeople(topics: DetectedTopic[], people: Person[], age?: Age): PersonMatch[] {
  const wanted = new Map<Need, number>();
  topics.forEach((t, i) => {
    for (const n of TOPIC_BY_ID[t.id].needs) wanted.set(n, (wanted.get(n) ?? 0) + (3 - Math.min(i, 2)));
  });
  return people
    .map((person) => {
      let score = 0;
      let best: Need | null = null;
      let bestW = 0;
      for (const n of person.goodFor) {
        const w = wanted.get(n) ?? 0;
        score += w;
        if (w > bestW) {
          best = n;
          bestW = w;
        }
      }
      // In 13 to 17 mode a trusted adult is always worth more than the same match without one.
      if (isTeen(age) && person.adult) score += 4;
      const why = best ? `${shortName(person.name)} is ${NEED_WORD[best]}.` : "No strong match, but they're in your circle.";
      return { person, score, why };
    })
    .sort((a, b) => b.score - a.score);
}

// ---------- draft messages

export type Tone = "warm" | "direct" | "lowkey";
export type Ask = "listen" | "advice" | "company";
export type Channel = "text" | "inperson" | "email";
export type Timing = "tonight" | "this week" | "whenever works";

export interface DraftOpts {
  person: Person;
  topics: DetectedTopic[];
  tone: Tone;
  ask: Ask;
  channel: Channel;
  timing: Timing;
}

const askLine: Record<Ask, string> = {
  listen: "I'm not looking for a fix. I'd just like someone to listen for a bit.",
  advice: "I'd really value your take on it.",
  company: "Honestly, I'd just like to spend some time with you.",
};

export function defaultChannel(r: Reach): Channel {
  return r === "email" ? "email" : r === "in person" ? "inperson" : "text";
}

export function draftMessage(o: DraftOpts): { subject?: string; body: string } {
  const first = shortName(o.person.name);
  const phrase = o.topics[0] ? TOPIC_BY_ID[o.topics[0].id].phrase : "something that's been on my mind";
  const when =
    o.timing === "tonight" ? "Are you free tonight?" : o.timing === "this week" ? "Do you have time this week?" : "Whenever works for you.";

  if (o.person.kind === "professional") {
    const body =
      `Hello,\n\nI'd like to book a first appointment. I've been dealing with ${phrase} and I'd like to talk with someone about it.\n\n` +
      `Could you let me know what times are available in the next two weeks, and what I should bring or fill out beforehand?\n\nThank you,`;
    return o.channel === "email" || o.channel === "text"
      ? { subject: "Request for a first appointment", body }
      : { body: `What to say:\n"I'd like to book a first appointment. I've been dealing with ${phrase} and I'd like to talk with someone about it. What's the next step?"` };
  }

  const open: Record<Tone, string> = {
    warm: `Hi ${first}, I've been carrying something around and I'd feel better saying it out loud to you.`,
    direct: `Hi ${first}, I'd like to talk with you about something that's been on my mind: ${phrase}.`,
    lowkey: `Hey ${first}, got a few minutes sometime? Nothing urgent, there's just something I want to talk through.`,
  };
  const detail = o.tone === "lowkey" ? "" : o.tone === "warm" ? ` It's about ${phrase}.` : "";

  if (o.channel === "inperson") {
    return {
      body:
        `Starting line:\n"${open[o.tone].replace(`Hi ${first}, `, "").replace(`Hey ${first}, `, "")}${detail}"\n\n` +
        `If the words get stuck:\n"I'm not sure how to say this, so I'll start with the part I do know."\n\n` +
        `What to ask for:\n"${askLine[o.ask]}"`,
    };
  }
  if (o.channel === "email") {
    return {
      subject: o.tone === "lowkey" ? "Got a few minutes?" : "Something I'd like to talk through",
      body: `${open[o.tone]}${detail}\n\n${askLine[o.ask]}\n\n${when}\n\nThanks for reading this,`,
    };
  }
  return { body: `${open[o.tone]}${detail} ${askLine[o.ask]} ${when}` };
}

export function topicStarters(topics: DetectedTopic[]): { topic: string; lines: string[] }[] {
  return topics.map((t) => ({ topic: TOPIC_BY_ID[t.id].label, lines: TOPIC_BY_ID[t.id].starters }));
}

export const GENERIC_CLOSERS = [
  "What would help most right now is someone to listen.",
  "I'm not sure what I need yet. Can we figure it out together?",
  "I'd like to tell you the whole thing before you respond.",
  "Thank you for making time for this.",
];
