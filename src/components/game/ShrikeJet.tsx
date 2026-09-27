import { useId } from "react";
import { cn } from "@/lib/utils";

/** Soyuz-stack craft — black/red hull, cyan-green hypergolic bells. */
export function ShrikeJet({
  className,
  compact,
  puddle,
  card,
}: {
  className?: string;
  compact?: boolean;
  puddle?: boolean;
  card?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg
      viewBox={card ? "0 0 200 250" : "8 0 84 236"}
      className={cn("rocket-hull h-auto w-full", puddle ? "overflow-hidden" : "overflow-visible", className)}
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={`sj-hull-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1a0c0c" />
          <stop offset="0.16" stopColor="#4a1818" />
          <stop offset="0.38" stopColor="#1c1e24" />
          <stop offset="0.52" stopColor="#2a1012" />
          <stop offset="0.78" stopColor="#121418" />
          <stop offset="1" stopColor="#05060b" />
        </linearGradient>
        <linearGradient id={`sj-sphere-${uid}`} x1="0.2" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="#6a2424" />
          <stop offset="0.28" stopColor="#2a1014" />
          <stop offset="0.62" stopColor="#121418" />
          <stop offset="1" stopColor="#05060b" />
        </linearGradient>
        <linearGradient id={`sj-drop-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5a1c1c" />
          <stop offset="0.35" stopColor="#1a0e10" />
          <stop offset="1" stopColor="#0a0c10" />
        </linearGradient>
        <linearGradient id={`sj-canopy-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eef3f7" />
          <stop offset="0.4" stopColor="#9aa3b2" />
          <stop offset="1" stopColor="#1a1f28" />
        </linearGradient>
        <linearGradient id={`sj-panel-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a1012" />
          <stop offset="0.5" stopColor="#121418" />
          <stop offset="1" stopColor="#0a0c10" />
        </linearGradient>
        <radialGradient id={`sj-bell-${uid}`} cx="38%" cy="28%" r="72%">
          <stop offset="0" stopColor="#e8fff4" />
          <stop offset="0.28" stopColor="#3cd6cc" />
          <stop offset="0.62" stopColor="#3ecf7a" />
          <stop offset="1" stopColor="#061410" />
        </radialGradient>
        <linearGradient id={`sj-plume-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4fffb" stopOpacity="0.95" />
          <stop offset="0.16" stopColor="#3cd6cc" />
          <stop offset="0.42" stopColor="#3ecf7a" stopOpacity="0.75" />
          <stop offset="0.72" stopColor="#3d9bff" stopOpacity="0.28" />
          <stop offset="1" stopColor="#3cd6cc" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`sj-photo-${uid}`} cx="50%" cy="42%" r="68%">
          <stop offset="0" stopColor="#3cd6cc" stopOpacity="0.26" />
          <stop offset="0.55" stopColor="#ff5c2a" stopOpacity="0.08" />
          <stop offset="1" stopColor="#05060b" stopOpacity="0" />
        </radialGradient>
        {puddle && (
          <clipPath id={`sj-puddle-${uid}`}>
            <rect x="10" y="168" width="80" height="68" />
          </clipPath>
        )}
      </defs>

      <g clipPath={puddle ? `url(#sj-puddle-${uid})` : undefined}>
        {card && <ellipse cx="100" cy="122" rx="78" ry="112" fill={`url(#sj-photo-${uid})`} />}
        <g transform={card ? "translate(50, 8)" : undefined}>
        {!compact && (
          <g className="jet-plume-svg">
            <path d="M28 198 Q38 258 38 278 Q38 258 46 198 Z" fill={`url(#sj-plume-${uid})`} />
            <path d="M42 202 Q50 264 50 286 Q50 264 58 202 Z" fill={`url(#sj-plume-${uid})`} />
            <path d="M54 198 Q62 258 62 278 Q62 258 72 198 Z" fill={`url(#sj-plume-${uid})`} />
            <path d="M46 202 Q50 248 50 266 Q50 248 54 202 Z" fill="#e8fff4" opacity="0.7" />
          </g>
        )}

        <ellipse cx="50" cy="208" rx="22" ry="5" fill="#000" opacity="0.45" />

        {/* Probe */}
        {!puddle && (
          <>
            <line x1="50" y1="4" x2="50" y2="16" stroke="#9aa3b2" strokeWidth="1.1" />
            <circle cx="50" cy="6" r="1.6" fill="#eef3f7" />
            <circle cx="50" cy="12" r="1.1" fill="#ff5c2a" />
          </>
        )}

        {/* Orbital module */}
        {!puddle && (
          <g>
            <circle cx="50" cy="32" r="16.5" fill={`url(#sj-sphere-${uid})`} stroke="#05060b" strokeWidth="1.2" />
            <ellipse cx="44" cy="26" rx="7" ry="5" fill="#eef3f7" opacity="0.12" />
            <circle cx="50" cy="32" r="16.5" fill="none" stroke="#ff5c2a" strokeWidth="0.7" opacity="0.55" />
            <circle cx="50" cy="28" r="4.2" fill={`url(#sj-canopy-${uid})`} stroke="#9aa3b2" strokeWidth="0.6" />
            <path d="M50 16 A16.5 16.5 0 0 1 50 48" fill="none" stroke="#ff5c2a" strokeWidth="1.4" opacity="0.85" />
            <rect x="47.4" y="44" width="5.2" height="6" rx="0.6" fill="#1a0c0c" />
          </g>
        )}

        {/* Descent module — the Soyuz gumdrop */}
        {!puddle && (
          <g>
            <path
              d="M34 48 Q50 42 66 48 L72 78 Q50 88 28 78 Z"
              fill={`url(#sj-drop-${uid})`}
              stroke="#05060b"
              strokeWidth="1.2"
            />
            <path d="M38 52 Q50 48 62 52 L64 70 Q50 74 36 70 Z" fill="#eef3f7" opacity="0.08" />
            <ellipse cx="50" cy="78" rx="22" ry="4.6" fill="#1a0c0c" stroke="#ff5c2a" strokeWidth="1.1" />
            <ellipse cx="50" cy="77" rx="14" ry="2.2" fill="#05060b" />
            <rect x="46" y="56" width="8" height="10" rx="1.2" fill={`url(#sj-canopy-${uid})`} stroke="#9aa3b2" strokeWidth="0.5" />
          </g>
        )}

        {/* Service module */}
        <rect x="36" y="80" width="28" height="78" rx="1.6" fill={`url(#sj-hull-${uid})`} stroke="#05060b" strokeWidth="1.2" />
        {Array.from({ length: 6 }, (_, i) => (
          <line
            key={i}
            x1="37.4"
            y1={90 + i * 11}
            x2="62.6"
            y2={90 + i * 11}
            stroke="#05060b"
            strokeWidth="0.55"
            opacity="0.45"
          />
        ))}
        <rect x="47.2" y="84" width="5.6" height="70" fill="#05060b" />
        <rect x="48.6" y="86" width="2" height="66" fill="#ff5c2a" opacity="0.85" />
        <rect x="38" y="80" width="6" height="78" fill="#eef3f7" opacity="0.06" />

        {/* Solar arrays */}
        <path d="M8 98 L36 90 L36 132 L8 124 Z" fill={`url(#sj-panel-${uid})`} stroke="#05060b" strokeWidth="1" />
        <path d="M92 98 L64 90 L64 132 L92 124 Z" fill={`url(#sj-panel-${uid})`} stroke="#05060b" strokeWidth="1" />
        <path d="M10 100 L34 93 L34 97 L10 104 Z" fill="#ff5c2a" />
        <path d="M90 100 L66 93 L66 97 L90 104 Z" fill="#ff5c2a" />
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <line x1="10" y1={106 + i * 5} x2="34" y2={100 + i * 5} stroke="#3cd6cc" strokeWidth="0.4" opacity="0.35" />
            <line x1="90" y1={106 + i * 5} x2="66" y2={100 + i * 5} stroke="#3cd6cc" strokeWidth="0.4" opacity="0.35" />
          </g>
        ))}
        <line x1="22" y1="101" x2="22" y2="126" stroke="#05060b" strokeWidth="0.5" opacity="0.5" />
        <line x1="78" y1="101" x2="78" y2="126" stroke="#05060b" strokeWidth="0.5" opacity="0.5" />

        {/* Skirt */}
        <path d="M34 158 L66 158 L78 186 L22 186 Z" fill="#121418" stroke="#05060b" strokeWidth="1.1" />
        <path d="M36 160 L64 160 L72 178 L28 178 Z" fill="#1a0c0c" />
        <rect x="32" y="156" width="36" height="6" rx="1" fill="#0a0c10" stroke="#ff5c2a" strokeWidth="0.8" />

        {/* Four-bell cluster */}
        <ellipse cx="34" cy="196" rx="6" ry="9" fill={`url(#sj-bell-${uid})`} stroke="#05060b" strokeWidth="0.8" />
        <ellipse cx="46" cy="200" rx="6.6" ry="10" fill={`url(#sj-bell-${uid})`} stroke="#05060b" strokeWidth="0.8" />
        <ellipse cx="54" cy="200" rx="6.6" ry="10" fill={`url(#sj-bell-${uid})`} stroke="#05060b" strokeWidth="0.8" />
        <ellipse cx="66" cy="196" rx="6" ry="9" fill={`url(#sj-bell-${uid})`} stroke="#05060b" strokeWidth="0.8" />
        <ellipse cx="34" cy="190" rx="2.4" ry="2.1" fill="#e8fff4" />
        <ellipse cx="46" cy="193" rx="2.8" ry="2.4" fill="#e8fff4" />
        <ellipse cx="54" cy="193" rx="2.8" ry="2.4" fill="#e8fff4" />
        <ellipse cx="66" cy="190" rx="2.4" ry="2.1" fill="#e8fff4" />
        </g>
      </g>
    </svg>
  );
}
