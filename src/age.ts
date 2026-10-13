import type { Age } from "./types";
import type { Resource } from "./engine/safety";
import { TEEN_LINE } from "./engine/safety";

// HEARD is for people 13 and up. 13 to 17 gets the same app with safer defaults:
// no open Notes (strangers replying), adult-only sources and services hidden, and trusted adults first.

export const isTeen = (age?: Age) => age === "teen";

/** Open Notes lets strangers read and reply. That stays 18+ until it has real human moderation. */
export const canUseOpenNotes = (age?: Age) => !isTeen(age);

type Audienced = { audience?: "teen" | "adult" | "teen-only" };

/** Teens don't see "adult" items; adults don't see "teen-only" ones. "teen" just means good for teens, and everyone can see it. */
export function forAge<T extends Audienced>(items: T[], age?: Age): T[] {
  return items.filter((x) => (isTeen(age) ? x.audience !== "adult" : x.audience !== "teen-only"));
}

/** Teen-written or teen-focused first, otherwise keeps the existing order. */
export function teenFirst<T extends Audienced>(items: T[], age?: Age): T[] {
  if (!isTeen(age)) return items;
  return [...items].sort((a, b) => Number(b.audience === "teen") - Number(a.audience === "teen"));
}

/** For the crisis sheet: teens also see Teen Line, placed after the 24/7 lines. */
export function crisisLines(list: Resource[], age?: Age): Resource[] {
  if (!isTeen(age) || list.some((r) => r.name === TEEN_LINE.name)) return list;
  const at = list.findIndex((r) => /Crisis Text/.test(r.name));
  const out = [...list];
  out.splice(at < 0 ? out.length : at + 1, 0, TEEN_LINE);
  return out;
}

export const AGE_LABEL: Record<Age, string> = { teen: "13 to 17", adult: "18 or older" };
