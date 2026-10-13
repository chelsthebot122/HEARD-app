import type { NoteAsk } from "../types";
import type { TopicId } from "../engine/topics";

const A = ["Quiet", "Steady", "Gentle", "Late", "Small", "Warm", "Patient", "Open", "Sunlit", "Honest", "Calm", "Brave"];
const B = ["Heron", "Maple", "Lantern", "Otter", "Harbor", "Finch", "Willow", "Comet", "Fern", "Pebble", "Moth", "Kite"];
export const newAlias = () => `${A[Math.floor(Math.random() * A.length)]} ${B[Math.floor(Math.random() * B.length)]}`;

export const ASKS: { id: NoteAsk; label: string; hint: string }[] = [
  { id: "listen", label: "Just listen", hint: "I want to be heard, not fixed." },
  { id: "perspective", label: "Perspective", hint: "Has anyone seen this from the other side?" },
  { id: "same", label: "Been there?", hint: "Anyone who has lived something like this." },
];

export interface SampleNote {
  id: string;
  alias: string;
  topic: TopicId;
  ask: NoteAsk;
  text: string;
}

// IMPORTANT: these are written by the HEARD team as examples so the screen isn't empty.
// They are not posts from real people and are not copied from any site. The UI says so.
// In a live version this list comes from a moderated service, not from this file.
export const SAMPLE_NOTES: SampleNote[] = [
  { id: "n1", alias: "Quiet Heron", topic: "isolation", ask: "same", text: "Third week at a new school and I've started timing my lunch so I can finish before anyone notices I'm alone. Does it get less loud in your head? How long did it take for you?" },
  { id: "n2", alias: "Late Lantern", topic: "family", ask: "perspective", text: "My dad says 'I'm only hard on you because I love you' and I believe him. I just still flinch when he says my name from the other room. Is that normal to feel both?" },
  { id: "n3", alias: "Small Otter", topic: "friendship", ask: "listen", text: "My best friend of six years answers me in one word now. I keep drafting a message asking what I did and deleting it. I don't need advice tonight, I just needed to say it somewhere." },
  { id: "n4", alias: "Patient Fern", topic: "burnout", ask: "same", text: "I got the thing I worked toward for two years and I feel nothing. Everybody congratulates me and I smile on cue. Has anybody felt flat right after the win?" },
  { id: "n5", alias: "Warm Harbor", topic: "grief", ask: "listen", text: "It's been five weeks since my grandmother died and people have stopped asking. I still set two mugs out in the morning. That's all. I just wanted one stranger to know." },
  { id: "n6", alias: "Open Finch", topic: "pressure", ask: "perspective", text: "Everyone around me has a plan for after graduation. I have a vague feeling and a spreadsheet I'm scared to open. How did you decide when you genuinely didn't know?" },
  { id: "n7", alias: "Calm Comet", topic: "unheard", ask: "same", text: "I told my manager I was overwhelmed and she said 'we're all busy'. I've been quiet at work ever since. Did anyone find a way to say it so it landed?" },
  { id: "n8", alias: "Brave Pebble", topic: "breakup", ask: "listen", text: "We split up two months ago and I still hear his key in the door at 6. I'm okay during the day. It's the 6 o'clock thing. That's it, that's the note." },
];

/** Cheerful-but-honest starter prompts for the write box. */
export const NOTE_PROMPTS = [
  "Something I haven't said out loud yet…",
  "What I wish someone would ask me is…",
  "The part I can't explain to the people around me is…",
];

export const REPLY_STARTERS = [
  "I've felt something like this. What helped me was…",
  "That sounds heavy. One thing I noticed in what you wrote is…",
  "You're not the only one who has felt this. For me…",
];

// Used only by the clearly-labelled "Show me a demo reply" button on a sent note.
export const DEMO_REPLIES: Partial<Record<TopicId, string[]>> & { _: string[] } = {
  isolation: ["Demo reply: I did the library lunch thing for a month at a new school. It stopped being loud when I said hi to one person in my one shared class. Only one. It still felt huge."],
  family: ["Demo reply: feeling both is really common. Love and flinching can sit in the same room. Naming both out loud to someone you trust helped me stop feeling like one cancelled the other."],
  friendship: ["Demo reply: I've been the one-word friend and the one waiting. A small, no-pressure message ('thinking of you, no need to reply') worked better than asking what went wrong."],
  grief: ["Demo reply: two mugs, I get that. For me it was a third coffee I kept ordering. It's okay that the world moved on faster than you did."],
  _: ["Demo reply: thank you for writing this down. A lot of people feel exactly this and never say it. I'm glad you put it somewhere.", "Demo reply: what you described makes sense to me. One small thing that helped me was telling a single person the same sentence you wrote here."],
};
