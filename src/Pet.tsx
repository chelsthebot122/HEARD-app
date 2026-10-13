import { useRef, useState, type ReactNode } from "react";
import { useApp } from "./store";

const LINES: Record<number, string> = { 5: "Milo likes you.", 10: "Okay, he's very happy now.", 20: "He'd do this all day." };

/** Wrap Milo so a click or tap makes him hop and send up a little heart (or a "z" if he's asleep). */
export function Pet({ children, sleepy = false, className = "", decorative = false }: { children: ReactNode; sleepy?: boolean; className?: string; decorative?: boolean }) {
  const { toast } = useApp();
  const [hop, setHop] = useState(0);
  const [bits, setBits] = useState<{ id: number; dx: number }[]>([]);
  const n = useRef(0);
  const id = useRef(0);

  const pet = () => {
    n.current += 1;
    setHop((h) => h + 1);
    const mine = ++id.current;
    setBits((b) => [...b.slice(-4), { id: mine, dx: Math.round((Math.random() - 0.5) * 36) }]);
    window.setTimeout(() => setBits((b) => b.filter((x) => x.id !== mine)), 1100);
    if (LINES[n.current]) toast(LINES[n.current]);
  };

  return (
    <span
      className={`pet ${className}`}
      // Inside a decorative (aria-hidden) area it still reacts to a click, but isn't a tab stop.
      role={decorative ? undefined : "button"}
      tabIndex={decorative ? undefined : 0}
      aria-label={decorative ? undefined : "Pet Milo"}
      onClick={pet}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          pet();
        }
      }}
    >
      <span className="pet__body" key={hop} data-hop={hop > 0 ? "true" : "false"}>
        {children}
      </span>
      {bits.map((b) => (
        <span key={b.id} className="pet__bit" aria-hidden="true" style={{ ["--dx" as string]: `${b.dx}px` }}>
          {sleepy ? "z" : "♥"}
        </span>
      ))}
    </span>
  );
}
