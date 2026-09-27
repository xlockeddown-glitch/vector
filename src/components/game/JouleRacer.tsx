import { useId } from "react";
import { cn } from "@/lib/utils";

/** Title-grade T-racer: stealth steel, Keurig red pod, cyan wake. */
export function JouleRacer({
  className,
  compact,
  puddle,
}: {
  className?: string;
  compact?: boolean;
  puddle?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="-16 -28 252 180"
      className={cn("rocket-hull h-auto w-full", puddle ? "overflow-hidden" : "overflow-visible", className)}
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={`jl-hull-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eef3f7" />
          <stop offset="0.2" stopColor="#9aa3b2" />
          <stop offset="0.48" stopColor="#2a2e28" />
          <stop offset="0.78" stopColor="#121410" />
          <stop offset="1" stopColor="#070806" />
        </linearGradient>
        <linearGradient id={`jl-pod-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff8a96" />
          <stop offset="0.4" stopColor="#e31937" />
          <stop offset="1" stopColor="#3a080e" />
        </linearGradient>
        <linearGradient id={`jl-wake-${uid}`} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#7ef0ea" stopOpacity="0.95" />
          <stop offset="0.55" stopColor="#e31937" stopOpacity="0.35" />
          <stop offset="1" stopColor="#e31937" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`jl-sheen-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.4" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="120" cy="108" rx="52" ry="6" fill="#05060b" opacity="0.42" />
      {!compact && (
        <g>
          <path d="M16 62 Q-10 58 -22 54 Q-4 66 24 68 Z" fill={`url(#jl-wake-${uid})`} />
          <path d="M22 72 Q2 80 10 88 Q14 72 28 74 Z" fill="#7ef0ea" opacity="0.28" />
        </g>
      )}
      <path d="M168 36 L216 28 L216 92 L168 84 Z" fill="#121410" stroke="#05060b" strokeWidth="1.2" />
      <path d="M174 50 L210 46 L210 58 L174 60 Z" fill="#7ef0ea" opacity="0.55" />
      <path
        d="M22 58 L98 46 L140 40 L164 48 L164 78 L140 86 L98 78 L22 70 Z"
        fill={`url(#jl-hull-${uid})`}
        stroke="#05060b"
        strokeWidth="1.25"
      />
      <path d="M22 52 L210 44 L210 80 L22 72 Z" fill={`url(#jl-hull-${uid})`} stroke="#e31937" strokeWidth="1.05" />
      <rect x="44" y="56" width="92" height="5" fill="#e31937" />
      <rect x="44" y="62" width="92" height="1.5" fill="#7ef0ea" opacity="0.8" />
      <ellipse cx="118" cy="62" rx="17" ry="14" fill={`url(#jl-pod-${uid})`} stroke="#05060b" strokeWidth="1.1" />
      <ellipse cx="122" cy="57" rx="7" ry="5" fill="#f5e6d3" opacity="0.9" />
      <rect x="70" y="48" width="36" height="8" rx="2" fill={`url(#jl-sheen-${uid})`} />
      <circle cx="46" cy="80" r="9" fill="#070806" stroke="#c5ccd3" strokeWidth="1.3" />
      <circle cx="46" cy="80" r="3" fill="#7ef0ea" />
      <circle cx="152" cy="84" r="10" fill="#070806" stroke="#c5ccd3" strokeWidth="1.3" />
      <circle cx="152" cy="84" r="3.2" fill="#e31937" />
    </svg>
  );
}
