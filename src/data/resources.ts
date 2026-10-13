// A short, hand-checked list of national US services. Numbers were checked against each
// organization's own site while building this version. HEARD does not have a local directory;
// for "near me" it points to services that do (211, FindTreatment.gov) and to your school or insurer.
// Before real people rely on this, re-verify every entry and add a "last checked" date.

export type Want = "now" | "talk" | "care" | "cost" | "basics" | "group";
export type Method = "call" | "text" | "chat" | "online";

export interface Res {
  id: string;
  name: string;
  what: string;
  /** What to do, as a person would say it. */
  how: string;
  want: Want[];
  methods: Method[];
  free: boolean;
  hours: string;
  tel?: string;
  sms?: { to: string; body?: string };
  url?: string;
  /** Plain text to copy. */
  copy: string;
  /** Who it is for, when narrower than everyone. */
  forWho?: string;
  /** "teen-only" = shown only in 13 to 17 mode; "adult" = hidden there. */
  audience?: "teen" | "adult" | "teen-only";
}

export const WANTS: { id: Want | "all"; label: string; hint: string }[] = [
  { id: "all", label: "Everything", hint: "" },
  { id: "now", label: "Right now", hint: "Someone is in danger, or you can't wait." },
  { id: "talk", label: "Someone to talk to", hint: "A trained person, today, without an appointment." },
  { id: "care", label: "Find a therapist", hint: "Searching for ongoing care." },
  { id: "cost", label: "Lower cost", hint: "When money is the obstacle." },
  { id: "basics", label: "Food, housing, bills", hint: "Stress often starts here." },
  { id: "group", label: "For a specific group", hint: "Veterans, LGBTQ+, abuse, assault." },
];

export const RESOURCES: Res[] = [
  { id: "988", name: "988 Suicide & Crisis Lifeline", what: "Free, confidential support from a trained counselor for suicidal thoughts, emotional distress, or worry about someone else. You don't have to be in crisis.", how: "Call or text 988, or chat at 988lifeline.org", want: ["now", "talk"], methods: ["call", "text", "chat"], free: true, hours: "24/7", tel: "988", sms: { to: "988" }, url: "https://988lifeline.org", copy: "988" },
  { id: "ctl", name: "Crisis Text Line", what: "Text with a trained crisis counselor. Good when you can't or don't want to talk out loud.", how: "Text HOME to 741741", want: ["now", "talk"], methods: ["text"], free: true, hours: "24/7", sms: { to: "741741", body: "HOME" }, url: "https://www.crisistextline.org", copy: "741741" },
  { id: "911", name: "Emergency services", what: "If you or someone near you is in immediate danger.", how: "Call 911", want: ["now"], methods: ["call"], free: true, hours: "24/7", tel: "911", copy: "911" },
  { id: "samhsa", name: "SAMHSA National Helpline", what: "Free, confidential treatment referral and information service for mental health and substance use, in English and Spanish.", how: "Call 1-800-662-4357 (1-800-662-HELP)", want: ["talk", "care", "cost"], methods: ["call"], free: true, hours: "24/7, every day", tel: "18006624357", url: "https://www.samhsa.gov/find-help/helplines/national-helpline", copy: "1-800-662-4357" },
  { id: "nami", name: "NAMI HelpLine", what: "Information, referrals and support from trained volunteers and staff of the National Alliance on Mental Illness. Also local support groups.", how: "Call 1-800-950-6264 or visit nami.org/help", want: ["talk", "care"], methods: ["call", "online"], free: true, hours: "Weekday hours (check nami.org/help)", tel: "18009506264", url: "https://www.nami.org/help", copy: "1-800-950-6264" },
  { id: "findtx", name: "FindTreatment.gov", what: "The U.S. government's locator for mental health and substance use treatment near you. Filter by payment type, including sliding scale and no insurance.", how: "Search by your ZIP code online", want: ["care", "cost"], methods: ["online"], free: true, hours: "Always on", url: "https://findtreatment.gov", copy: "findtreatment.gov" },
  { id: "openpath", name: "Open Path Collective", what: "A directory of therapists who offer lower-cost sessions to people without insurance or whose insurance doesn't cover enough. There is a one-time membership fee.", how: "Search by state at openpathcollective.org", want: ["care", "cost"], methods: ["online"], free: false, hours: "Always on", url: "https://openpathcollective.org", copy: "openpathcollective.org", audience: "adult" },
  { id: "211", name: "211", what: "A free, confidential line that connects you to local help with food, housing, utilities, and also mental health and substance use services.", how: "Dial 211, or search at 211.org", want: ["basics", "cost", "talk"], methods: ["call", "online"], free: true, hours: "Varies by area", tel: "211", url: "https://www.211.org", copy: "211" },
  { id: "teenline", name: "Teen Line", what: "Talk or text with trained teen volunteers (called Listeners) who work under adult mental health professionals. Run by Didi Hirsch.", how: "Call 1-800-852-8336, or text TEEN to 839863", want: ["talk", "group"], methods: ["call", "text"], free: true, hours: "Evenings only: calls 6 to 10 p.m. Pacific, texts 6 to 9 p.m. Pacific", tel: "18008528336", sms: { to: "839863", body: "TEEN" }, url: "https://didihirsch.org/teenline/", copy: "1-800-852-8336", forWho: "Teens", audience: "teen-only" },
  { id: "vcl", name: "Veterans Crisis Line", what: "Support for veterans, service members, and the people who care about them, from responders who understand military life.", how: "Dial 988 then press 1, text 838255, or chat online", want: ["now", "group"], methods: ["call", "text", "chat"], free: true, hours: "24/7", tel: "988", sms: { to: "838255" }, url: "https://www.veteranscrisisline.net", copy: "988, then press 1", forWho: "Veterans and service members" },
  { id: "trevor", name: "The Trevor Project", what: "Crisis support for LGBTQ+ young people.", how: "Call 1-866-488-7386 or text START to 678-678", want: ["now", "talk", "group"], methods: ["call", "text", "chat"], free: true, hours: "24/7", tel: "18664887386", sms: { to: "678678", body: "START" }, url: "https://www.thetrevorproject.org", copy: "1-866-488-7386", forWho: "LGBTQ+ young people (24 and under)" },
  { id: "dv", name: "National Domestic Violence Hotline", what: "Confidential support if you're being hurt or controlled by a partner or family member, or worried about someone who is.", how: "Call 1-800-799-7233 or text START to 88788", want: ["now", "group"], methods: ["call", "text", "chat"], free: true, hours: "24/7", tel: "18007997233", sms: { to: "88788", body: "START" }, url: "https://www.thehotline.org", copy: "1-800-799-7233", forWho: "Anyone experiencing abuse" },
  { id: "rainn", name: "RAINN National Sexual Assault Hotline", what: "Confidential support after sexual assault, and help finding local services.", how: "Call 1-800-656-4673", want: ["now", "group"], methods: ["call", "online"], free: true, hours: "24/7", tel: "18006564673", url: "https://www.rainn.org", copy: "1-800-656-4673", forWho: "Survivors of sexual assault" },
  { id: "intl", name: "Outside the United States", what: "A directory of free crisis lines by country. For immediate danger, call your local emergency number.", how: "Search findahelpline.com", want: ["now", "talk"], methods: ["online"], free: true, hours: "Always on", url: "https://findahelpline.com", copy: "findahelpline.com" },
];

export const CALL_SCRIPT =
  "Hi, I'd like to set up a first appointment. I'm looking for help with [what's going on, in a few words]. Do you have openings in the next few weeks? Do you take [my insurance], or offer sliding-scale fees? Do you do video or in-person?";

export const QUESTIONS_FOR_FIRST_VISIT = [
  "How do you usually work with someone who's feeling this?",
  "What does a typical session look like, and how often do people come?",
  "What happens if I'm not sure it's a good fit after a few sessions?",
  "How do you handle cost, and what happens if I can't make a session?",
  "What stays private, and are there times you'd have to tell someone?",
];
