import { useId } from "react";
import { cn } from "@/lib/utils";

/** Arcade-cyber SpaceX craft — VECTOR chrome steel, ember only on the bells. */
export function BoostRocket({
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
      viewBox={card ? "0 0 200 240" : "14 0 72 220"}
      className={cn("rocket-hull h-auto w-full", puddle ? "overflow-hidden" : "overflow-visible", className)}
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={`br-hull-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="color-mix(in oklab, var(--color-steel) 38%, var(--color-ink))" />
          <stop offset="0.16" stopColor="var(--color-paper)" />
          <stop offset="0.38" stopColor="var(--color-steel)" />
          <stop offset="0.62" stopColor="color-mix(in oklab, var(--color-steel) 48%, var(--color-ink))" />
          <stop offset="0.84" stopColor="var(--color-steel)" />
          <stop offset="1" stopColor="color-mix(in oklab, var(--color-steel) 28%, var(--color-ink))" />
        </linearGradient>
        <linearGradient id={`br-nose-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--color-paper)" />
          <stop offset="0.42" stopColor="var(--color-steel)" />
          <stop offset="1" stopColor="color-mix(in oklab, var(--color-steel) 32%, var(--color-ink))" />
        </linearGradient>
        <linearGradient id={`br-fin-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--color-paper)" />
          <stop offset="1" stopColor="color-mix(in oklab, var(--color-steel) 30%, var(--color-ink))" />
        </linearGradient>
        <radialGradient id={`br-bell-${uid}`} cx="38%" cy="28%" r="72%">
          <stop offset="0" stopColor="#ffb089" />
          <stop offset="0.35" stopColor="var(--color-ember)" />
          <stop offset="1" stopColor="#1a1210" />
        </radialGradient>
        <linearGradient id={`br-plume-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff6ee" stopOpacity="0.95" />
          <stop offset="0.18" stopColor="var(--color-ember)" />
          <stop offset="0.55" stopColor="var(--color-ember)" stopOpacity="0.45" />
          <stop offset="1" stopColor="var(--color-ember)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`br-sheen-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-paper)" stopOpacity="0" />
          <stop offset="0.4" stopColor="var(--color-paper)" stopOpacity="0.38" />
          <stop offset="1" stopColor="var(--color-paper)" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`br-photo-${uid}`} cx="50%" cy="42%" r="68%">
          <stop offset="0" stopColor="var(--color-ember)" stopOpacity="0.28" />
          <stop offset="0.55" stopColor="var(--color-steel)" stopOpacity="0.08" />
          <stop offset="1" stopColor="var(--color-ink)" stopOpacity="0" />
        </radialGradient>
        {puddle && (
          <clipPath id={`br-puddle-${uid}`}>
            <rect x="8" y="158" width="84" height="62" />
          </clipPath>
        )}
      </defs>

      <g clipPath={puddle ? `url(#br-puddle-${uid})` : undefined}>
        {card && <ellipse cx="100" cy="118" rx="78" ry="108" fill={`url(#br-photo-${uid})`} />}
        <g transform={card ? "translate(50, 10)" : undefined}>
        {!compact && (
          <g className="rocket-plume-svg">
            <path d="M34 188 Q50 252 50 278 Q50 252 66 188 Z" fill={`url(#br-plume-${uid})`} />
            <path d="M42 188 Q50 238 50 258 Q50 238 58 188 Z" fill="#fff6ee" opacity="0.7" />
          </g>
        )}

        <ellipse cx="50" cy="198" rx="20" ry="5" fill="var(--color-ink)" opacity="0.45" />

        <path d="M32 166 L16 206 L26 206 L38 172 Z" fill={`url(#br-fin-${uid})`} stroke="var(--color-ink)" strokeWidth="1.1" />
        <path d="M68 166 L84 206 L74 206 L62 172 Z" fill={`url(#br-fin-${uid})`} stroke="var(--color-ink)" strokeWidth="1.1" />
        <path d="M32 166 L16 206" stroke="var(--color-steel)" strokeWidth="0.8" opacity="0.55" />
        <path d="M68 166 L84 206" stroke="var(--color-paper)" strokeWidth="0.7" opacity="0.35" />

        {!puddle && (
          <>
            <path d="M50 4 L66 46 L34 46 Z" fill={`url(#br-nose-${uid})`} stroke="var(--color-ink)" strokeWidth="1.2" />
            <path d="M50 10 L60 40 L50 37 L40 40 Z" fill="var(--color-paper)" opacity="0.32" />
            <circle cx="50" cy="26" r="2.6" fill="var(--color-ink)" stroke="var(--color-steel)" strokeWidth="0.7" />

            <rect x="34" y="46" width="32" height="124" rx="2.4" fill={`url(#br-hull-${uid})`} stroke="var(--color-ink)" strokeWidth="1.2" />
            {Array.from({ length: 9 }, (_, i) => (
              <line
                key={i}
                x1="35.5"
                y1={58 + i * 12}
                x2="64.5"
                y2={58 + i * 12}
                stroke="var(--color-ink)"
                strokeWidth="0.55"
                opacity="0.38"
              />
            ))}
            <rect x="46.2" y="50" width="7.6" height="112" fill="var(--color-ink)" />
            <rect x="48.2" y="52" width="2.4" height="106" fill="var(--color-paper)" opacity="0.38" />
            <rect x="38" y="46" width="7" height="124" fill={`url(#br-sheen-${uid})`} />

            <rect x="33.5" y="88" width="33" height="11" fill="var(--color-ink)" />
            <rect x="35" y="90" width="30" height="1.6" fill="var(--color-steel)" />
            <rect x="35" y="95.5" width="30" height="1.6" fill="var(--color-paper)" opacity="0.28" />

            <rect x="41" y="58" width="12" height="13" rx="1.2" fill="var(--color-ink)" stroke="var(--color-steel)" strokeWidth="0.7" />
            <rect x="42.4" y="59.6" width="9.2" height="9.6" rx="0.8" fill="var(--color-steel)" opacity="0.38" />
            <rect x="44" y="61.2" width="4" height="4" rx="0.4" fill="var(--color-paper)" opacity="0.22" />

            <path d="M16 102 L34 94 L34 116 L16 124 Z" fill={`url(#br-fin-${uid})`} stroke="var(--color-ink)" strokeWidth="1.1" />
            <path d="M84 102 L66 94 L66 116 L84 124 Z" fill={`url(#br-fin-${uid})`} stroke="var(--color-ink)" strokeWidth="1.1" />
            <path d="M20 106 L32 100 M20 111 L32 106 M20 116 L32 112" fill="none" stroke="var(--color-steel)" strokeWidth="0.75" />
            <path d="M80 106 L68 100 M80 111 L68 106 M80 116 L68 112" fill="none" stroke="var(--color-steel)" strokeWidth="0.75" />
            <path d="M23 105 L23 118 M27 103 L27 117" stroke="var(--color-ink)" strokeWidth="0.55" />
            <path d="M77 105 L77 118 M73 103 L73 117" stroke="var(--color-ink)" strokeWidth="0.55" />
          </>
        )}

        <rect x="32" y="166" width="36" height="12" rx="1.8" fill="#161b24" stroke="var(--color-ink)" strokeWidth="1" />
        <rect x="33.5" y="168" width="33" height="1.4" fill="var(--color-steel)" opacity="0.7" />

        <ellipse cx="39" cy="186" rx="5.6" ry="8.5" fill={`url(#br-bell-${uid})`} stroke="var(--color-ink)" strokeWidth="0.8" />
        <ellipse cx="50" cy="188" rx="6.2" ry="9.5" fill={`url(#br-bell-${uid})`} stroke="var(--color-ink)" strokeWidth="0.8" />
        <ellipse cx="61" cy="186" rx="5.6" ry="8.5" fill={`url(#br-bell-${uid})`} stroke="var(--color-ink)" strokeWidth="0.8" />
        <ellipse cx="39" cy="181" rx="2.6" ry="2.3" fill="#ffb089" />
        <ellipse cx="50" cy="182" rx="3" ry="2.5" fill="#fff6ee" />
        <ellipse cx="61" cy="181" rx="2.6" ry="2.3" fill="#ffb089" />
        </g>
      </g>
    </svg>
  );
}
