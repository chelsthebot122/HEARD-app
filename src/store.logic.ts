import type { Age, Persisted } from "./types";
import { SEED_PEOPLE, SEED_PEOPLE_TEEN, SEED_REACHOUTS, SEED_REACHOUTS_TEEN, SEED_STEPS, SEED_STEPS_TEEN } from "./data/seed";

/** Picking an age band. 13 to 17 swaps in the teen examples, but only if the person hasn't changed the sample data. */
export const withAge = (p: Persisted, age: Age): Persisted => {
  const untouched = p.people.every((x) => x.example) && p.steps.every((x) => x.example) && p.reachouts.every((x) => x.example);
  const base = untouched ? { people: age === "teen" ? SEED_PEOPLE_TEEN : SEED_PEOPLE, steps: age === "teen" ? SEED_STEPS_TEEN : SEED_STEPS, reachouts: age === "teen" ? SEED_REACHOUTS_TEEN : SEED_REACHOUTS } : {};
  return { ...p, ...base, age, onboarded: true };
};

