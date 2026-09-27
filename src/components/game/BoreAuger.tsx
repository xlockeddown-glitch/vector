import { useId } from "react";
import { cn } from "@/lib/utils";

/** White Neutron-hull borer with purple/cyan glow and a Prufrock 4-spoke cutterhead. */
export function BoreAuger({
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
      viewBox={card ? "-28 -42 296 196" : "0 4 240 108"}
      className={cn("rocket-hull h-auto w-full", puddle ? "overflow-hidden" : "overflow-visible", className)}
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={`ba-hull-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.22" stopColor="#eef6ff" />
          <stop offset="0.48" stopColor="#d8e4f4" />
          <stop offset="0.78" stopColor="#c8c0e8" />
          <stop offset="1" stopColor="#9aa0c4" />
        </linearGradient>
        <linearGradient id={`ba-jaw-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#d4f6f2" />
          <stop offset="1" stopColor="#9b6cff" />
        </linearGradient>
        <linearGradient id={`ba-glow-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#9b6cff" />
          <stop offset="0.5" stopColor="#7ef0ea" />
          <stop offset="1" stopColor="#3cd6cc" />
        </linearGradient>
        <radialGradient id={`ba-head-${uid}`} cx="38%" cy="32%" r="70%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor="#d4f6f2" />
          <stop offset="1" stopColor="#9b6cff" />
        </radialGradient>
        <radialGradient id={`ba-bell-${uid}`} cx="36%" cy="30%" r="70%">
          <stop offset="0" stopColor="#d4f6f2" />
          <stop offset="0.4" stopColor="#3cd6cc" />
          <stop offset="1" stopColor="#2a1840" />
        </radialGradient>
        <linearGradient id={`ba-dust-${uid}`} x1="1" y1="0.5" x2="0" y2="0.5">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="0.28" stopColor="#3cd6cc" stopOpacity="0.75" />
          <stop offset="0.7" stopColor="#9b6cff" stopOpacity="0.45" />
          <stop offset="1" stopColor="#9b6cff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`ba-sheen-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.4" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`ba-photo-${uid}`} cx="50%" cy="48%" r="70%">
          <stop offset="0" stopColor="#9b6cff" stopOpacity="0.28" />
          <stop offset="0.55" stopColor="#3cd6cc" stopOpacity="0.08" />
          <stop offset="1" stopColor="#05060b" stopOpacity="0" />
        </radialGradient>
        {puddle && (
          <clipPath id={`ba-puddle-${uid}`}>
            <rect x="0" y="72" width="240" height="44" />
          </clipPath>
        )}
      </defs>

      <g clipPath={puddle ? `url(#ba-puddle-${uid})` : undefined}>
        {card && <ellipse cx="118" cy="52" rx="130" ry="78" fill={`url(#ba-photo-${uid})`} />}
        {!compact && (
          <g className="bore-plume-svg">
            <path d="M22 44 Q-8 36 -22 32 Q-4 48 22 50 Z" fill={`url(#ba-dust-${uid})`} />
            <path d="M22 56 Q-2 66 12 74 Q8 56 24 58 Z" fill={`url(#ba-dust-${uid})`} opacity="0.65" />
            <circle cx="8" cy="40" r="2.1" fill="#ffffff" opacity="0.9" />
            <circle cx="2" cy="54" r="1.5" fill="#3cd6cc" opacity="0.9" />
            <circle cx="-4" cy="46" r="1.7" fill="#9b6cff" opacity="0.85" />
            <path d="M210 48 Q236 42 250 40 Q236 52 210 54 Z" fill={`url(#ba-dust-${uid})`} opacity="0.55" />
          </g>
        )}

        <ellipse cx="118" cy="92" rx="52" ry="6" fill="#05060b" opacity="0.38" />

        {/* Neutron-style engine cluster — rear */}
        <ellipse cx="196" cy="48" rx="7" ry="9" fill={`url(#ba-bell-${uid})`} stroke="#1a1014" strokeWidth="0.9" />
        <ellipse cx="200" cy="36" rx="5.5" ry="7" fill={`url(#ba-bell-${uid})`} stroke="#1a1014" strokeWidth="0.8" />
        <ellipse cx="200" cy="64" rx="5.5" ry="7" fill={`url(#ba-bell-${uid})`} stroke="#1a1014" strokeWidth="0.8" />
        <ellipse cx="204" cy="42" rx="4.4" ry="5.6" fill={`url(#ba-bell-${uid})`} stroke="#1a1014" strokeWidth="0.7" />
        <ellipse cx="204" cy="58" rx="4.4" ry="5.6" fill={`url(#ba-bell-${uid})`} stroke="#1a1014" strokeWidth="0.7" />

        {/* coke-bottle hull */}
        <path
          d="M78 28 C108 22 148 24 178 32 L186 40 L186 64 L178 72 C148 80 108 82 78 76 C70 74 64 68 62 54 C64 40 70 30 78 28 Z"
          fill={`url(#ba-hull-${uid})`}
          stroke="#1a1014"
          strokeWidth="1.25"
        />
        <path
          d="M86 36 C114 30 150 32 174 40 L176 44 L176 60 L174 64 C150 72 114 74 86 68 C80 66 76 60 76 54 C76 46 80 38 86 36 Z"
          fill={`url(#ba-sheen-${uid})`}
        />
        <rect x="82" y="50" width="92" height="5" rx="2" fill={`url(#ba-glow-${uid})`} />
        <rect x="118" y="42" width="28" height="10" rx="3" fill="#1a1014" />
        <rect x="122" y="44.5" width="20" height="5" rx="2" fill="#7ef0ea" opacity="0.92" />

        {/* Neutron grid fins */}
        <path d="M132 26 L154 18 L158 22 L138 32 Z" fill="#ffffff" stroke="#9b6cff" strokeWidth="1.1" />
        <path d="M132 78 L154 86 L158 82 L138 72 Z" fill="#ffffff" stroke="#3cd6cc" strokeWidth="1.1" />
        <path d="M140 22 L152 20 M144 28 L150 24" stroke="#9b6cff" strokeWidth="0.6" opacity="0.8" />
        <path d="M140 82 L152 84 M144 76 L150 80" stroke="#3cd6cc" strokeWidth="0.6" opacity="0.8" />

        {/* Neutron clamshell jaws around the bit */}
        <path
          d="M78 30 C58 8 36 10 22 28 C34 24 52 26 72 38 Z"
          fill={`url(#ba-jaw-${uid})`}
          stroke="#1a1014"
          strokeWidth="1.15"
        />
        <path
          d="M78 74 C58 96 36 94 22 76 C34 80 52 78 72 66 Z"
          fill={`url(#ba-jaw-${uid})`}
          stroke="#1a1014"
          strokeWidth="1.15"
        />
        <path d="M70 32 C54 18 38 20 28 32" fill="none" stroke="#9b6cff" strokeWidth="1.4" />
        <path d="M70 72 C54 86 38 84 28 72" fill="none" stroke="#3cd6cc" strokeWidth="1.4" />

        {/* Prufrock 4-spoke cutterhead */}
        <g className="bore-head-spin">
          <circle cx="40" cy="52" r="26" fill={`url(#ba-head-${uid})`} stroke="#1a1014" strokeWidth="1.35" />
          <circle cx="40" cy="52" r="22" fill="none" stroke="#3cd6cc" strokeWidth="2" />
          <path
            d="M40 32 L46 46 L60 52 L46 58 L40 72 L34 58 L20 52 L34 46 Z"
            fill="#ffffff"
            stroke="#9b6cff"
            strokeWidth="1.3"
          />
          {[0, 90, 180, 270].map((deg) => {
            const a = (deg * Math.PI) / 180;
            const x = 40 + Math.cos(a) * 16;
            const y = 52 + Math.sin(a) * 16;
            return (
              <g key={deg}>
                <circle cx={x} cy={y} r="4.2" fill="#d4f6f2" stroke="#9b6cff" strokeWidth="1.1" />
                <circle cx={x} cy={y} r="1.6" fill="#3cd6cc" />
              </g>
            );
          })}
          <circle cx="40" cy="52" r="6.5" fill="#ffffff" stroke="#9b6cff" strokeWidth="1.2" />
          <circle cx="40" cy="52" r="2.6" fill="#3cd6cc" />
        </g>
      </g>
    </svg>
  );
}
