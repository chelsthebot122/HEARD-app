// Masks personal details before anything is analyzed or saved.
// A rule-based first pass. The same idea scales up to Microsoft Presidio on a server.

export interface Mask {
  kind: string;
  original: string;
  token: string;
}

const RULES: { kind: string; token: string; re: RegExp; group?: number }[] = [
  { kind: "email", token: "[email]", re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g },
  { kind: "phone", token: "[phone]", re: /(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}\b/g },
  { kind: "ID number", token: "[id number]", re: /\b\d{3}-\d{2}-\d{4}\b/g },
  { kind: "link", token: "[link]", re: /\bhttps?:\/\/\S+|\bwww\.\S+/g },
  { kind: "handle", token: "[handle]", re: /(^|\s)@[A-Za-z0-9_.]{2,}/g },
  {
    kind: "address",
    token: "[address]",
    re: /\b\d{1,5}\s+(?:[A-Z][a-z]+\s+){1,3}(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd|Lane|Ln|Way|Court|Ct)\b\.?/g,
  },
  {
    kind: "school",
    token: "[school]",
    re: /\b(?:[A-Z][A-Za-z.'&]+\s+){1,4}(?:High School|Middle School|University|College|Academy|Institute)\b/g,
  },
  {
    kind: "name",
    token: "[name]",
    // "my name is Dara", "Call me Dara", "name's Dara", "named Dara", "I'm Dara Okoye"
    re: /\b(?:[Mm]y name is|[Cc]all me|[Nn]ame's|named)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,
    group: 1,
  },
  {
    kind: "name",
    token: "[name]",
    // "I'm Dara Okoye": only a full two-word name, so "I'm Tired" is left alone
    re: /\b(?:I'm|I am)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g,
    group: 1,
  },
];

export function redact(input: string): { text: string; masks: Mask[] } {
  let text = input;
  const masks: Mask[] = [];
  for (const rule of RULES) {
    text = text.replace(rule.re, (...args) => {
      const match = args[0] as string;
      if (rule.group) {
        const g = args[rule.group] as string;
        masks.push({ kind: rule.kind, original: g, token: rule.token });
        return match.replace(g, rule.token);
      }
      // keep a leading space captured by the handle rule
      const lead = rule.kind === "handle" && /^\s/.test(match) ? match[0] : "";
      masks.push({ kind: rule.kind, original: match.trim(), token: rule.token });
      return lead + rule.token;
    });
  }
  return { text, masks };
}

/**
 * The privacy layer is a seam. The app only ever calls `privacyLayer.redact`.
 * Today it is the rule-based pass above. To use a stronger detector (for example a
 * local Presidio + spaCy service), replace this object with one whose `redact`
 * calls it and returns the same shape. If it throws, the app analyses nothing.
 */
export interface PrivacyLayer {
  name: string;
  redact(text: string): Promise<{ text: string; masks: Mask[] }> | { text: string; masks: Mask[] };
}

export const privacyLayer: PrivacyLayer = { name: "Built-in rules", redact };
