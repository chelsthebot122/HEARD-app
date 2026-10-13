import type { CSSProperties } from "react";
import { Milo, type Mood } from "./Milo";
import { Pet } from "./Pet";
import { useApp, type Tab } from "./store";

export interface SegOption<T extends string> {
  id: T;
  label: string;
  n?: number;
}

/** Segmented control with a thumb that slides between options. */
export function Seg<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: SegOption<T>[];
  onChange: (v: T) => void;
  label: string;
}) {
  const i = Math.max(0, options.findIndex((o) => o.id === value));
  return (
    <div className="seg" role="group" aria-label={label} style={{ "--n": options.length, "--i": i } as CSSProperties}>
      <span className="seg__ind" aria-hidden="true" />
      {options.map((o) => (
        <button key={o.id} type="button" aria-pressed={o.id === value} onClick={() => onChange(o.id)}>
          {o.label}
          {o.n !== undefined && <span className="n nums">{o.n}</span>}
        </button>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" className="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} />;
}

/** Milo, unless the person switched the mascot off. */
export function Pup({ mood = "happy", size = 72, label, pet = true }: { mood?: Mood; size?: number; label?: string; pet?: boolean }) {
  const { p } = useApp();
  if (!p.settings.milo) return null;
  if (!pet) return <Milo mood={mood} size={size} label={label} />;
  return (
    <Pet sleepy={mood === "sleepy"}>
      <Milo mood={mood} size={size} label={label} />
    </Pet>
  );
}

const TITLES = /^(Dr\.|Coach|Aunt|Uncle|Professor|Prof\.|Ms\.|Mr\.|Mrs\.)\s+/;
export function Avatar({ name, pro }: { name: string; pro?: boolean }) {
  const ch = name.replace(TITLES, "").trim().charAt(0).toUpperCase() || "?";
  return (
    <span className="avatar" data-pro={pro ? "true" : "false"} aria-hidden="true">
      {ch}
    </span>
  );
}

export const fmtDay = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

/** Renders masked placeholders like [email] as small coral tags. */
export function Tokens({ text }: { text: string }) {
  const parts = text.split(/(\[(?:email|phone|id number|link|handle|address|school|name)\])/g);
  return (
    <>
      {parts.map((s, i) =>
        /^\[.+\]$/.test(s) ? (
          <span key={i} className="tok">
            {s}
          </span>
        ) : (
          s
        ),
      )}
    </>
  );
}

const TAB_MOOD: Record<Tab, Mood> = { talk: "listening", library: "reading", notes: "mail", people: "wave", plan: "plan", help: "guard", settings: "lock" };
export const isLate = (d = new Date()) => d.getHours() >= 23 || d.getHours() < 5;

/** Milo's mood for a place in the app. Late at night he dozes, except in Help, where he stays on watch. */
export function moodFor(tab: Tab): Mood {
  if (tab !== "help" && isLate()) return "sleepy";
  return TAB_MOOD[tab];
}

const HELLO: Record<Tab, string> = {
  talk: "Milo, listening",
  library: "Milo, reading",
  notes: "Milo, with a paper plane",
  people: "Milo, waving",
  plan: "Milo, with a clipboard",
  help: "Milo, on watch",
  settings: "Milo, with a padlock",
};

/** Milo beside a page title, in the mood that fits the tab. */
export function Companion({ tab, size = 76 }: { tab: Tab; size?: number }) {
  const { p } = useApp();
  if (!p.settings.milo) return null;
  return (
    <span className="companion">
      <Pet sleepy={moodFor(tab) === "sleepy"}>
        <Milo mood={moodFor(tab)} size={size} label={HELLO[tab]} />
      </Pet>
    </span>
  );
}
