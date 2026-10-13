import type { TopicId } from "../engine/topics";

export type SourceType = "experience" | "general" | "professional";

export interface Source {
  id: string;
  type: SourceType;
  title: string;
  by: string;
  topics: TopicId[];
  minutes: number;
  added: string;
  excerpt: string;
  /** HEARD's own summary, in plain words. The full text lives at `url`. */
  body: string[];
  /** Where the full piece lives. Everything in the library links out; HEARD does not copy other people's writing. */
  url?: string;
  publisher?: string;
  /** What the publisher says about reuse, so nobody has to guess. */
  terms?: string;
  /** True for links the person saved themselves. */
  mine?: boolean;
  /** "teen" = written for or suited to 13 to 17 (listed first for them); "adult" = about adults or college life, hidden in 13 to 17 mode. */
  audience?: "teen" | "adult";
}

export const TYPE_LABEL: Record<SourceType, string> = {
  experience: "Personal experience",
  general: "General information",
  professional: "Professional guidance",
};

export const TYPE_HELP: Record<SourceType, string> = {
  experience: "One person's story. It may not match yours.",
  general: "Plain-language background, not advice for your situation.",
  professional: "What trained people commonly suggest. Not a diagnosis.",
};

// REAL SOURCES. Each entry links to the original. The summaries are HEARD's own words, written from
// the page itself, and each one names the publisher. Checked on 2026-10-11; re-check before launch.
// Topics with no entry yet (family, and some of self-doubt) are deliberately left empty
// rather than filled with invented material: they are what the "save your own link" feature and the
// consented-stories pipeline are for.
const NIMH = "NIMH says its text is public domain and may be reused without permission (images may not). Cite: National Institute of Mental Health.";

const NOSTATED = "No reuse terms are stated on the page, so HEARD links to it and summarizes in its own words.";

export const LIBRARY: Source[] = [
  {
    id: "hhs-connection",
    type: "general",
    title: "Social Connection",
    by: "Office of the U.S. Surgeon General (HHS)",
    publisher: "U.S. Surgeon General",
    url: "https://www.hhs.gov/surgeongeneral/reports-and-publications/connection/index.html",
    terms: NOSTATED,
    topics: ["isolation", "friendship"],
    minutes: 4,
    added: "2026-10-12",
    excerpt: "Why connection matters for health, and why feeling isolated counts even when you're around people.",
    body: [
      "The Surgeon General's page describes links between weak social relationships and loneliness on one side and worse health on the other, including higher rates of depression among adults who often feel lonely.",
      "It says support from friends and family is associated with better management of conditions like high blood pressure and diabetes.",
      "It points out that the perception of being isolated matters, even without being physically alone. That is why feeling lonely in a crowded room is real and not a flaw in you.",
    ],
  },
  {
    id: "hhs-5for5",
    type: "general",
    title: "The Surgeon General's 5-for-5 Connection Challenge",
    by: "Office of the U.S. Surgeon General (HHS)",
    publisher: "U.S. Surgeon General",
    url: "https://www.hhs.gov/surgeongeneral/priorities/connection/challenge/index.html",
    terms: NOSTATED,
    topics: ["isolation", "friendship", "unheard"],
    minutes: 2,
    added: "2026-10-12",
    excerpt: "A small plan: pick five ways to connect, do one a day for five days. Gratitude, support, or asking for help all count.",
    body: [
      "You choose five actions and do one on each of five days in a row, connecting with people in your life.",
      "Each day's action is simple: express gratitude, offer support, or ask for help.",
      "Afterward, you're encouraged to reflect on how it felt and tell the people you connected with.",
      "It pairs well with a step on your HEARD plan.",
    ],
  },
  {
    id: "cdc-loneliness",
    audience: "adult",
    type: "general",
    title: "Loneliness, Lack of Social and Emotional Support, and Mental Health Issues — United States, 2022",
    by: "CDC, Morbidity and Mortality Weekly Report",
    publisher: "CDC (MMWR)",
    url: "https://www.cdc.gov/mmwr/volumes/73/wr/mm7324a1.htm",
    terms: NOSTATED,
    topics: ["isolation"],
    minutes: 6,
    added: "2026-10-12",
    excerpt: "A national survey found about a third of U.S. adults reported loneliness. You are far from the only one.",
    body: [
      "This is a research report, so it is more technical than the other pieces here.",
      "About one in three adults (32.1%) reported loneliness, and about one in four (24.1%) reported lacking social and emotional support.",
      "Adults who were lonely had much higher rates of stress, frequent mental distress and a history of depression than those who weren't.",
    ],
  },
  {
    id: "mayo-friendship",
    audience: "adult",
    type: "general",
    title: "Friendships: Enrich your life and improve your health",
    by: "Mayo Clinic",
    publisher: "Mayo Clinic",
    url: "https://www.mayoclinic.org/healthy-lifestyle/adult-health/in-depth/friendships/art-20044860",
    terms: "© Mayo Foundation for Medical Education and Research. HEARD links to it and summarizes in its own words.",
    topics: ["friendship", "isolation"],
    minutes: 5,
    added: "2026-10-12",
    excerpt: "The quality of a few close friendships matters more than how many friends you have. Reaching out first is normal.",
    body: [
      "People with strong social bonds tend to have lower odds of several health problems, including depression.",
      "The page says the quality of your closest friendships matters more than the number of friends or contacts.",
      "Making friends takes persistence: reach out first, suggest plans more than once, and try several ways to meet people, such as classes, volunteering, community groups or faith communities.",
      "Lasting friendships run on give-and-take: kindness, listening without rushing to advice, opening up, being reliable and spending regular time together.",
    ],
  },
  {
    id: "lboro-friendship",
    audience: "adult",
    type: "professional",
    title: "Friendship Conflicts",
    by: "Loughborough University student services (UK)",
    publisher: "Loughborough University",
    url: "https://www.lboro.ac.uk/services/student-services/topics/friendship-conflicts",
    terms: NOSTATED,
    topics: ["friendship", "unheard"],
    minutes: 3,
    added: "2026-10-12",
    excerpt: "How a university wellbeing service suggests handling a disagreement with a friend, including when you're stuck in the middle.",
    body: [
      "Be straightforward with your friend, but first get clear on your own thoughts. Stay open to what they say, even if it's hard to hear.",
      "When emotions are running high, pause before you reply so you don't say something you'll regret.",
      "Practice active listening. If you're caught between two friends, listen to both without taking sides.",
      "If a conflict gets beyond what you can manage, the page points students to wellbeing support at their university.",
    ],
  },
  {
    id: "childline-ghost",
    audience: "teen",
    type: "general",
    title: "How to cope when a friend ghosts you",
    by: "Childline (ISPCC, Ireland), written for young people",
    publisher: "Childline",
    url: "https://childline.ie/how-to-cope-when-a-friend-ghosts-you",
    terms: "© Childline. No reuse terms are stated on the page, so HEARD links to it and summarizes in its own words. It is written for young people in Ireland.",
    topics: ["friendship", "unheard"],
    minutes: 3,
    added: "2026-10-12",
    excerpt: "If a friend goes silent, it isn't automatically your fault. Writing a letter can help, and some friendships can't be fixed.",
    body: [
      "The page says nobody is entitled to make you feel you're to blame, and that you deserve to feel valued and cared for.",
      "Writing a letter, even one you don't send, can help you put into words how their silence has affected you.",
      "Handling disagreements and saying what you need are skills that healthy relationships rely on.",
      "If a friendship can't be fixed, it's okay to accept that and move on. Talking to a trusted adult, or joining a club, can help you find new friends.",
    ],
  },
  {
    id: "cywh-breakup",
    audience: "teen",
    type: "professional",
    title: "Relationships: How to Deal with a Breakup",
    by: "Center for Young Women's Health, Boston Children's Hospital",
    publisher: "Center for Young Women's Health",
    url: "https://youngwomenshealth.org/guides/relationships-how-to-deal-with-a-break-up/",
    terms: "© Center for Young Women's Health. HEARD links to it and summarizes in its own words. To quote it, use their permissions page.",
    topics: ["breakup", "grief"],
    minutes: 5,
    added: "2026-10-12",
    excerpt: "Relief, sadness, anger and loneliness can all show up. Be patient, keep your routine, and be careful about who you confide in.",
    body: [
      "Lots of feelings are normal after a breakup: relief, sadness, anger and loneliness. Grief over the loss takes time.",
      "Keep up your routine, stay active and lean on people you trust.",
      "The page suggests limiting social media and not contacting your ex right away. If you need to talk, wait a while and pick a calm setting.",
      "Alcohol and drugs won't resolve the pain. If you feel hopeless, can't function, or feel at risk of harming yourself or someone else, tell a trusted adult or your health care provider.",
    ],
  },
  {
    id: "jed-breakup",
    audience: "teen",
    type: "general",
    title: "Heartbreak to Healing: Real-Life Breakup Tips From 2 Creators",
    by: "The Jed Foundation, with two creators and a JED physician",
    publisher: "The Jed Foundation",
    url: "https://jedfoundation.org/resource/heartbreak-to-healing-real-life-breakup-tips/",
    terms: "No reuse terms are stated on the page; JED has a reprint guidelines page. HEARD links to it and summarizes in its own words.",
    topics: ["breakup"],
    minutes: 8,
    added: "2026-10-12",
    excerpt: "Two creators talk about what they learned from past breakups, alongside a JED doctor on the emotional process and when to get extra support.",
    body: [
      "The page says a breakup can affect your daily life and how you see yourself, but it doesn't define who you are.",
      "The conversation covers processing emotions in healthy ways, friendships that may shift, handling the digital side of a breakup, building resilience and finding support.",
      "It also says painful breakups can still lead to self-discovery and a clearer idea of what you want in future relationships.",
    ],
  },
  {
    id: "lir-green-flags",
    audience: "teen",
    type: "general",
    title: "Green flags in relationships",
    by: "love is respect, a program of the National Domestic Violence Hotline",
    publisher: "love is respect",
    url: "https://www.loveisrespect.org/?p=1385",
    terms: "© National Domestic Violence Hotline. HEARD links to it and summarizes in its own words.",
    topics: ["romance"],
    minutes: 4,
    added: "2026-10-12",
    excerpt: "Most advice lists warning signs. This lists what a healthy relationship tends to look like, which helps when things are new.",
    body: [
      "Healthy couples share thoughts and feelings openly, listen to each other, and feel free to bring up any topic.",
      "Respect means honoring each other's opinions, feelings and needs, including room to be yourself. Trust means believing your partner without needing proof.",
      "Equality and boundaries: making big decisions together, having equal influence, and respecting each other's need for time apart.",
      "Consent means talking openly about physical, sexual and reproductive choices, and every partner willingly agreeing. Relationships won't be perfect, and talking through lapses and working on them is itself a good sign.",
    ],
  },
  {
    id: "nimh-caring",
    type: "professional",
    title: "Caring for Your Mental Health",
    by: "National Institute of Mental Health (NIMH)",
    publisher: "NIMH",
    url: "https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health",
    terms: NIMH,
    topics: ["overwhelm", "burnout", "selfdoubt"],
    minutes: 4,
    added: "2026-10-11",
    excerpt: "Mental health is more than not having an illness. Small daily habits help, and some signs mean it's time to talk to a professional.",
    body: [
      "Mental health covers emotional, psychological and social well-being. It's more than the absence of a mental illness.",
      "Everyday habits support energy, focus and mood: regular movement, regular meals, water, and steady sleep. Relaxation, setting priorities, gratitude and staying connected with people help too. What works differs from person to person, so some trial and error is normal.",
      "The page lists signs that it may be time to get professional help when they are severe or distressing and last two weeks or more: trouble sleeping, changes in appetite, struggling to get out of bed, trouble concentrating, losing interest in things you enjoy, being unable to do usual tasks, and feeling irritable or restless.",
      "It says a primary care provider can refer you to a mental health professional.",
    ],
  },
  {
    id: "nimh-stressed",
    audience: "teen",
    type: "general",
    title: "I'm So Stressed Out! Fact Sheet",
    by: "National Institute of Mental Health (NIMH)",
    publisher: "NIMH",
    url: "https://www.nimh.nih.gov/health/publications/so-stressed-out-fact-sheet",
    terms: NIMH,
    topics: ["pressure", "burnout", "overwhelm"],
    minutes: 5,
    added: "2026-10-11",
    excerpt: "How stress differs from anxiety, what people try to cope, and when to ask for help. Written for teens and young adults.",
    body: [
      "Stress is a reaction to an outside cause and usually fades when the situation does. Anxiety is the body's reaction to stress and can continue even when nothing is threatening you right now.",
      "Ways people cope: journaling, relaxation or mindfulness apps, exercise, regular meals, a steady sleep routine, cutting back on caffeine, challenging negative thoughts, and leaning on friends or family. Finding what works may take trial and error.",
      "Consider getting help if you can't cope, symptoms won't go away, or they get in the way of daily life or make you avoid things.",
      "Talk therapy and medication are the two main treatments for anxiety, and many people use both. If you're in immediate distress, call or text 988.",
    ],
  },
  {
    id: "nimh-provider",
    type: "professional",
    title: "Tips for Talking With a Health Care Provider About Your Mental Health",
    by: "National Institute of Mental Health (NIMH)",
    publisher: "NIMH",
    url: "https://www.nimh.nih.gov/health/publications/tips-for-talking-with-your-health-care-provider",
    terms: NIMH,
    topics: ["unheard", "overwhelm", "selfdoubt"],
    minutes: 4,
    added: "2026-10-11",
    excerpt: "How to bring up what you're feeling with a doctor, what to prepare, and why bringing someone with you can help.",
    body: [
      "You can bring up mental health with your primary care provider even if they don't ask first. They can refer you to a mental health professional.",
      "Before the visit, write down your questions, list your medications and supplements, and review your family's mental health history.",
      "Consider bringing a friend or relative to take notes and share how they think you're doing.",
      "Be specific about symptoms: when they started, how severe they are, how often they happen, and any big stressors or changes. Ask about diagnoses and treatments, say so if an option makes you uncomfortable, and know that it's fine to look for other options or opinions.",
    ],
  },
  {
    id: "cdc-stress",
    type: "general",
    title: "Managing Stress",
    by: "Centers for Disease Control and Prevention (CDC)",
    publisher: "CDC",
    url: "https://www.cdc.gov/mental-health/living-with/index.html",
    terms: "No reuse statement was found on the page, so HEARD links to it and summarizes in its own words.",
    topics: ["overwhelm", "burnout", "pressure"],
    minutes: 3,
    added: "2026-10-11",
    excerpt: "Stress is normal, but long-lasting stress can add up. Daily habits and talking with people you trust can ease it.",
    body: [
      "Stress is a normal part of life, and everyone feels it sometimes. Stress that lasts a long time can make health problems worse.",
      "Practicing stress management every day may help keep long-term stress from building up.",
      "Limiting how much news and social media you take in, and talking with people you trust, can ease the strain.",
      "Sleep, physical activity, healthy eating, and limiting alcohol, tobacco and drugs all support mental well-being. Free, 24/7 support is available by calling or texting 988.",
    ],
  },
  {
    id: "stopbullying-what",
    audience: "teen",
    type: "general",
    title: "What Is Bullying",
    by: "StopBullying.gov (U.S. Department of Health and Human Services)",
    publisher: "StopBullying.gov",
    url: "https://www.stopbullying.gov/bullying/what-is-bullying",
    terms: "No reuse statement was found on the page, so HEARD links to it and summarizes in its own words. The page is written about school-aged children.",
    topics: ["bullying"],
    minutes: 3,
    added: "2026-10-11",
    excerpt: "A plain definition of bullying: repeated, with a power gap, and in person or online.",
    body: [
      "The page defines bullying as aggression that is repeated or likely to repeat, where one side has more power than the other.",
      "Power can come from physical strength, from having embarrassing information, or from social popularity, and it can shift between the same people in different situations.",
      "It takes three forms: verbal, social (harming reputation or relationships) and physical. It can happen at school, on the way there, in a neighborhood, or online.",
      "It cites federal surveys in which roughly one in five students reported being bullied.",
    ],
  },
  {
    id: "medline-bereavement",
    type: "general",
    title: "Bereavement",
    by: "MedlinePlus (U.S. National Library of Medicine)",
    publisher: "MedlinePlus",
    url: "https://medlineplus.gov/bereavement.html",
    terms: "MedlinePlus is a hub that links to other sources. HEARD summarizes the page in its own words and links to it.",
    topics: ["grief"],
    minutes: 3,
    added: "2026-10-11",
    excerpt: "Grief is a normal response to loss. It shows up in the mind and body, and support helps.",
    body: [
      "Bereavement is the period of grief and mourning after a death. Grieving is a normal response to loss.",
      "Grief can feel like anger, guilt, anxiety, sadness or despair, and can also show up physically as sleep problems, appetite changes or getting sick.",
      "How long it lasts depends on things like how close you were to the person and whether the death was expected.",
      "Friends, family and faith can support you. Grief counseling or therapy helps some people. The page also links to many other resources.",
    ],
  },
  {
    id: "am-loneliness",
    audience: "adult",
    type: "experience",
    title: "How to Manage Loneliness During College from a Gen Z Graduate",
    by: "Active Minds · written from a recent graduate's point of view",
    publisher: "Active Minds",
    url: "https://activeminds.org/blog/how-to-manage-loneliness-during-college-from-a-gen-z-graduate/",
    terms: "© Active Minds. HEARD links to it and summarizes in its own words. To quote it, ask Active Minds for permission.",
    topics: ["isolation", "transition"],
    minutes: 5,
    added: "2026-10-11",
    excerpt: "A recent graduate describes feeling isolated in the move to college, and how helping revive a campus mental health chapter led to lasting friendships.",
    body: [
      "A recent graduate describes how isolation during the move to college, and during the pandemic, left them lonely.",
      "They helped revive their university's mental health chapter. Being open about what they were going through with others in the group helped them build connections that lasted.",
    ],
  },
];
