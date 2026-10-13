import type { SourceType } from "./data/library";

const PATHS = {
  talk: "M4 5.5h16v11H10l-5 4v-4H4z",
  book: "M5 4.5h10a3 3 0 0 1 3 3v12H8a3 3 0 0 1-3-3zM5 16.5a3 3 0 0 1 3-3h10",
  people: "M9 11a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 11zM3 19c0-3.2 2.7-5 6-5s6 1.8 6 5M17 10.6a2.6 2.6 0 1 0 0-5.2M21 18.6c0-2.2-1.5-3.6-3.6-4.2",
  list: "M10 6h10M10 12h10M10 18h10M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2",
  sliders: "M4 7h9M17 7h3M4 17h3M11 17h9M15 4.5v5M9 14.5v5",
  phone: "M6 4h4l1.6 4.6-2.3 1.4a11 11 0 0 0 5.7 5.7l1.4-2.3L20 15v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z",
  heart: "M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.4a4.2 4.2 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20z",
  check: "M5 12.5l4.5 4.5L19 7.5",
  x: "M6 6l12 12M18 6L6 18",
  plus: "M12 5v14M5 12h14",
  lock: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z",
  copy: "M9 9h11v11H9zM5 15V4h10",
  chevron: "M6 9l6 6 6-6",
  person: "M12 12a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2zM5 20c0-3.6 3-5.6 7-5.6s7 2 7 5.6",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5.2M12 7.8h.01",
  shieldcheck: "M12 3l7 3v5.5c0 4.4-3 7.8-7 9.5-4-1.7-7-5.1-7-9.5V6zM9 12l2.2 2.2L15.2 10",
  trash: "M5 7h14M10 7V4.5h4V7M7 7l.9 12.5h8.2L17 7",
  edit: "M5 19l.8-4L16 4.8 19.2 8 9 18.2z",
  send: "M4 12l16-8-5.5 16-3.2-6.8z",
  download: "M12 4v11M7 11l5 5 5-5M5 20h14",
  undo: "M9 14L4 9l5-5M4 9h9a6 6 0 0 1 0 12h-3",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ n, size = 20, filled = false, className }: { n: IconName; size?: number; filled?: boolean; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d={PATHS[n]} />
    </svg>
  );
}

/** Three source types are told apart by shape and word, never by color alone. */
export function TypeIcon({ type, size = 16 }: { type: SourceType; size?: number }) {
  const n: IconName = type === "experience" ? "person" : type === "general" ? "info" : "shieldcheck";
  return <Icon n={n} size={size} className={`ti ti--${type}`} />;
}
