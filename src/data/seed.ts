import type { Person, Step, Reachout } from "../types";

export const SEED_PEOPLE: Person[] = [
  {
    id: "p-marisol",
    name: "Marisol Quintanilla",
    relation: "Roommate",
    kind: "person",
    goodFor: ["listening", "humor", "company"],
    reach: "text",
    note: "Night owl. Answers fast after 9 p.m., slow before noon.",
    phone: "(555) 010-0142",
    example: true,
  },
  {
    id: "p-teo",
    name: "Teo",
    relation: "Older brother",
    kind: "person",
    goodFor: ["practical", "perspective"],
    reach: "call",
    note: "Works nights at the cold-storage plant. Sunday mornings are best.",
    example: true,
  },
  {
    id: "p-renata",
    name: "Aunt Renata",
    relation: "Aunt",
    kind: "person",
    goodFor: ["listening", "perspective"],
    reach: "call",
    note: "Never rushes me. Usually picks up on the second try.",
    example: true,
  },
  {
    id: "p-imani",
    name: "Coach Imani Brooks",
    relation: "Former track coach",
    kind: "person",
    goodFor: ["perspective", "practical"],
    reach: "email",
    note: "Replies within a day and always asks one good question back.",
    example: true,
  },
  {
    id: "p-counseling",
    name: "Campus counseling center",
    relation: "Counseling",
    kind: "professional",
    goodFor: ["professional", "listening"],
    reach: "email",
    note: "Intake is an online form. First openings are usually about a week out.",
    email: "counseling@example.edu",
    other: "Intake form on the student portal",
    example: true,
  },
  {
    id: "p-advisor",
    name: "Dr. Haldane",
    relation: "Academic advisor",
    kind: "professional",
    goodFor: ["practical", "professional"],
    reach: "email",
    note: "Office hours Tuesdays 2 to 4. Fine with short, specific emails.",
    example: true,
  },
];

export const SEED_STEPS: Step[] = [
  { id: "s1", text: "Fill out the counseling intake form (about 10 minutes)", when: "today", personId: "p-counseling", done: false, example: true },
  { id: "s2", text: "Text Marisol about Thursday coffee after her lab", when: "week", personId: "p-marisol", done: false, example: true },
  { id: "s3", text: "Ask Teo how he got through his first year on nights", when: "later", personId: "p-teo", done: false, example: true },
  { id: "s4", text: "Reread 'How to start a hard conversation with someone you love'", when: "week", done: true, example: true },
];

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

export const SEED_REACHOUTS: Reachout[] = [
  { id: "r1", name: "Aunt Renata", how: "call", at: daysAgo(3), example: true },
  { id: "r2", name: "Marisol Quintanilla", how: "text", at: daysAgo(9), example: true },
];

export const STARTERS: { label: string; text: string }[] = [
  {
    label: "New school, eating alone",
    text: "I switched schools in January and I eat lunch in the library so nobody can see I'm alone. Everyone already has their people and I don't know how to break in.",
  },
  {
    label: "Parents and grades",
    text: "My parents keep comparing my grades to my cousin's. I do the work, but it never feels like enough, and I can't explain it without sounding ungrateful.",
  },
  {
    label: "Best friend went quiet",
    text: "My best friend and I went from daily texts to nothing. I think I said something at her birthday but she won't tell me what.",
  },
  {
    label: "Three weeks after a loss",
    text: "It's been three weeks since my grandmother died and everyone expects me to be fine because I went back to work.",
  },
  {
    label: "Tired after midterms",
    text: "I've been exhausted since midterms. I sleep enough and still feel like I'm moving through mud, and I keep missing deadlines I never used to miss.",
  },
];

// ---------- 13 to 17 mode: examples a teenager would recognise, with trusted adults first.

export const SEED_PEOPLE_TEEN: Person[] = [
  { id: "t-mom", name: "Mom", relation: "Parent", kind: "person", goodFor: ["listening", "perspective", "practical"], reach: "in person", note: "Easiest after dinner, when she's not doing three things at once.", adult: true, example: true },
  { id: "t-sam", name: "Sam", relation: "Best friend", kind: "person", goodFor: ["listening", "humor", "company"], reach: "text", note: "Answers fast. Doesn't try to fix everything.", example: true },
  { id: "t-aunt", name: "Aunt Dee", relation: "Aunt", kind: "person", goodFor: ["listening", "perspective"], reach: "call", note: "Never makes it a big deal. Calls back the same day.", adult: true, example: true },
  { id: "t-coach", name: "Coach Alvarez", relation: "Coach", kind: "person", goodFor: ["perspective", "practical"], reach: "in person", note: "Free after practice on Tuesdays and Thursdays.", adult: true, example: true },
  { id: "t-counselor", name: "Ms. Okafor, school counselor", relation: "School counselor", kind: "professional", goodFor: ["professional", "listening"], reach: "in person", note: "Her door is open at lunch. You can also ask the front office for a pass.", adult: true, other: "Counseling office, near the library", example: true },
  { id: "t-teacher", name: "Mr. Lindqvist", relation: "Teacher", kind: "person", goodFor: ["practical", "perspective"], reach: "in person", note: "Stays after the bell. Fine with short, specific questions.", adult: true, example: true },
];

export const SEED_STEPS_TEEN: Step[] = [
  { id: "ts1", text: "Ask Ms. Okafor for a pass to the counseling office", when: "week", personId: "t-counselor", done: false, example: true },
  { id: "ts2", text: "Text Sam about hanging out Friday", when: "week", personId: "t-sam", done: false, example: true },
  { id: "ts3", text: "Tell Mom something has been on my mind", when: "today", personId: "t-mom", done: false, example: true },
];

export const SEED_REACHOUTS_TEEN: Reachout[] = [
  { id: "tr1", name: "Aunt Dee", how: "call", at: daysAgo(3), example: true },
  { id: "tr2", name: "Sam", how: "text", at: daysAgo(9), example: true },
];

export const STARTERS_TEEN: { label: string; text: string }[] = [
  { label: "Eating alone at lunch", text: "I started at a new school and I eat lunch in the library so nobody sees I'm alone. Everyone already has their friend group and I don't know how to get in." },
  { label: "Parents and grades", text: "My parents keep comparing my grades to my cousin's. I do the work, but it never feels like enough, and I can't explain it without sounding ungrateful." },
  { label: "Friend went quiet", text: "My best friend and I went from texting every day to nothing. I think I said something at her party but she won't tell me what." },
  { label: "Group chat drama", text: "There's a group chat where people keep joking about me and then saying it's just a joke. I don't want to look dramatic but it's getting to me." },
  { label: "Breakup", text: "We broke up two weeks ago and I still see them every day at school. I feel like everyone is watching to see if I'm okay." },
  { label: "Stressed about everything", text: "Between tests, practice and everything at home I feel like I'm behind on everything and I can't catch up. I'm tired all the time." },
];
