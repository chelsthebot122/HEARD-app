export type Mood = "happy" | "listening" | "thinking" | "worried" | "sleepy" | "reading" | "mail" | "wave" | "plan" | "guard" | "lock" | "cheer";

interface Props {
  mood?: Mood;
  size?: number;
  label?: string;
  className?: string;
}

// Milo is an original character: a round biscuit-colored pup with a blue scarf.
export function Milo({ mood = "happy", size = 96, label, className = "" }: Props) {
  const eyeY = 74;
  const open = mood !== "sleepy";
  const smile = mood === "cheer" || mood === "wave";
  const look = mood === "thinking" ? { x: 3, y: -3 } : { x: 0, y: 0 };

  return (
    <svg
      className={`milo milo--${mood} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 160 160"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {/* tail */}
      <g className="milo__tail">
        <path d="M112 132 C134 128 142 108 132 96 C130 112 122 120 108 122 Z" fill="var(--fur-dark)" />
      </g>

      {/* body */}
      <ellipse cx="80" cy="130" rx="33" ry="22" fill="var(--fur)" />
      <ellipse cx="62" cy="148" rx="11" ry="6.5" fill="var(--cream)" />
      <ellipse cx="98" cy="148" rx="11" ry="6.5" fill="var(--cream)" />

      {/* ears behind head */}
      <g className="milo__ear milo__ear--l">
        <path d="M44 54 C26 56 22 84 30 100 C42 100 52 84 52 66 Z" fill="var(--fur-dark)" />
      </g>
      <g className="milo__ear milo__ear--r">
        <path d="M116 54 C134 56 138 84 130 100 C118 100 108 84 108 66 Z" fill="var(--fur-dark)" />
      </g>

      {/* head */}
      <ellipse cx="80" cy="80" rx="48" ry="42" fill="var(--fur)" />
      <path d="M80 40 C70 40 64 52 66 62 C72 58 88 58 94 62 C96 52 90 40 80 40 Z" fill="var(--fur-dark)" opacity=".35" />

      {/* scarf */}
      <path d="M52 112 C66 124 94 124 108 112 L110 122 C94 134 66 134 50 122 Z" fill="var(--milo-scarf)" />
      <path d="M96 124 L102 144 L111 140 L106 121 Z" fill="var(--milo-scarf)" />

      {/* muzzle */}
      <ellipse cx="80" cy="94" rx="21" ry="15" fill="var(--cream)" />
      <ellipse cx="80" cy="86" rx="6.5" ry="4.8" fill="var(--ink-fixed)" />
      <ellipse cx="78.2" cy="84.6" rx="1.8" ry="1.1" fill="#fff" opacity=".7" />

      {/* mouth */}
      {mood === "worried" ? (
        <path d="M70 100 q10 -5 20 0" stroke="var(--ink-fixed)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      ) : mood === "thinking" ? (
        <path d="M73 98 h14" stroke="var(--ink-fixed)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M80 91 v4 M80 95 q-6 6 -12 1 M80 95 q6 6 12 1" stroke="var(--ink-fixed)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      )}

      {/* cheeks */}
      <ellipse cx="50" cy="92" rx="8" ry="5" fill="var(--coral-fixed)" opacity=".5" />
      <ellipse cx="110" cy="92" rx="8" ry="5" fill="var(--coral-fixed)" opacity=".5" />

      {/* eyes */}
      {open ? (
        <g className="milo__eyes">
          {[62, 98].map((cx) => (
            <g key={cx}>
              <circle cx={cx + look.x} cy={eyeY + look.y} r="6" fill="var(--ink-fixed)" />
              <circle cx={cx + look.x + 2} cy={eyeY + look.y - 2.2} r="2" fill="#fff" />
            </g>
          ))}
        </g>
      ) : (
        <g stroke="var(--ink-fixed)" strokeWidth="2.6" fill="none" strokeLinecap="round">
          <path d="M55 76 q7 6 14 0" />
          <path d="M91 76 q7 6 14 0" />
        </g>
      )}

      {/* brows */}
      {mood === "worried" && (
        <g stroke="var(--ink-fixed)" strokeWidth="2.2" strokeLinecap="round" fill="none">
          <path d="M54 62 L68 58" />
          <path d="M106 62 L92 58" />
        </g>
      )}
      {smile && <path d="M72 96 q8 10 16 0 z" fill="var(--coral-fixed)" opacity=".85" />}
      {mood === "listening" && (
        <g stroke="var(--ink-fixed)" strokeWidth="2" strokeLinecap="round" fill="none" opacity=".7">
          <path d="M55 62 q7 -4 14 -1" />
          <path d="M105 62 q-7 -4 -14 -1" />
        </g>
      )}

      {/* extras that depend on where Milo is */}
      {mood === "reading" && (
        <g>
          <g stroke="var(--ink-fixed)" strokeWidth="2.4" fill="none">
            <circle cx="62" cy="74" r="11" />
            <circle cx="98" cy="74" r="11" />
            <path d="M73 74 h14" />
          </g>
          <g className="milo__book">
            <path d="M44 128 L80 120 L116 128 L116 152 L80 144 L44 152 Z" fill="var(--cream)" stroke="var(--ink-fixed)" strokeWidth="2" strokeLinejoin="round" />
            <path d="M80 120 V144" stroke="var(--ink-fixed)" strokeWidth="2" />
            <path d="M52 132 L74 127 M52 138 L74 133 M86 127 L108 132 M86 133 L108 138" stroke="var(--blue-fixed)" strokeWidth="1.6" strokeLinecap="round" opacity=".6" />
          </g>
        </g>
      )}
      {mood === "mail" && (
        <g className="milo__plane">
          <path d="M112 30 L152 14 L136 52 L128 38 Z" fill="var(--cream)" stroke="var(--ink-fixed)" strokeWidth="2" strokeLinejoin="round" />
          <path d="M128 38 L152 14" stroke="var(--ink-fixed)" strokeWidth="2" />
          <path d="M96 40 q8 6 14 0" stroke="var(--blue-fixed)" strokeWidth="2" fill="none" strokeDasharray="2 5" strokeLinecap="round" />
        </g>
      )}
      {mood === "wave" && (
        <g className="milo__paw">
          <ellipse cx="132" cy="108" rx="9" ry="12" fill="var(--fur)" />
          <ellipse cx="132" cy="118" rx="6" ry="4" fill="var(--cream)" />
        </g>
      )}
      {mood === "plan" && (
        <g>
          <g className="milo__clip">
            <rect x="96" y="112" width="34" height="42" rx="4" fill="var(--cream)" stroke="var(--ink-fixed)" strokeWidth="2" />
            <rect x="106" y="108" width="14" height="7" rx="2" fill="var(--blue-fixed)" />
            <path d="M102 126 l3 3 l6 -6 M102 138 l3 3 l6 -6 M116 127 h9 M116 139 h9" stroke="var(--ink-fixed)" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </g>
      )}
      {mood === "guard" && (
        <g className="milo__badge">
          <path d="M116 112 L136 118 V134 C136 146 128 152 116 156 C104 152 96 146 96 134 V118 Z" fill="var(--blue-fixed)" stroke="var(--cream)" strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M107 134 l7 7 l12 -14" stroke="#fff" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      {mood === "lock" && (
        <g className="milo__lock">
          <rect x="104" y="128" width="30" height="24" rx="5" fill="var(--blue-fixed)" stroke="var(--cream)" strokeWidth="2" />
          <path d="M110 128 v-8 a9 9 0 0 1 18 0 v8" stroke="var(--blue-fixed)" strokeWidth="4" fill="none" />
          <circle cx="119" cy="139" r="3" fill="#fff" />
        </g>
      )}
      {mood === "cheer" && (
        <g className="milo__confetti">
          <rect x="22" y="24" width="7" height="7" rx="1.5" fill="var(--coral-fixed)" />
          <rect x="132" y="22" width="7" height="7" rx="1.5" fill="var(--blue-fixed)" />
          <circle cx="40" cy="12" r="3.5" fill="var(--blue-fixed)" />
          <circle cx="122" cy="10" r="3.5" fill="var(--coral-fixed)" />
          <rect x="80" y="4" width="6" height="6" rx="1.5" fill="var(--coral-fixed)" />
        </g>
      )}

      {/* extras */}
      {mood === "thinking" && (
        <g className="milo__dots" fill="var(--blue-fixed)">
          <circle cx="126" cy="34" r="3" />
          <circle cx="136" cy="26" r="3.6" />
          <circle cx="148" cy="16" r="4.4" />
        </g>
      )}
      {mood === "sleepy" && (
        <g className="milo__zs" fill="var(--blue-fixed)" fontFamily="Nunito, sans-serif" fontWeight="800">
          <text x="124" y="40" fontSize="16">z</text>
          <text x="136" y="26" fontSize="12">z</text>
        </g>
      )}
    </svg>
  );
}
