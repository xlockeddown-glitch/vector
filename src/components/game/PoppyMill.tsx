import { useId } from "react";
import { cn } from "@/lib/utils";

/** Title-grade windmill × beyblade. Gray/purple steel, orange lightbar veins. */
export function PoppyMill({
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
      viewBox="-16 -16 192 192"
      className={cn("rocket-hull h-auto w-full", puddle ? "overflow-hidden" : "overflow-visible", className)}
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={`pp-mast-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2a3038" />
          <stop offset="0.18" stopColor="#eef3f7" />
          <stop offset="0.42" stopColor="#9aa3b2" />
          <stop offset="0.72" stopColor="#3a3048" />
          <stop offset="1" stopColor="#16121c" />
        </linearGradient>
        <radialGradient id={`pp-hub-${uid}`} cx="36%" cy="30%" r="70%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.35" stopColor="#c5ccd3" />
          <stop offset="1" stopColor="#1a1428" />
        </radialGradient>
        <linearGradient id={`pp-blade-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4eeff" />
          <stop offset="0.35" stopColor="#9aa0c4" />
          <stop offset="0.7" stopColor="#5a4a88" />
          <stop offset="1" stopColor="#1a1428" />
        </linearGradient>
        <linearGradient id={`pp-sheen-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.4" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="80" cy="150" rx="28" ry="5" fill="#05060b" opacity="0.45" />
      <rect x="72" y="88" width="16" height="56" rx="4" fill={`url(#pp-mast-${uid})`} stroke="#05060b" strokeWidth="1.1" />
      <rect x="75" y="92" width="3" height="48" rx="1" fill="#ff5c2a" opacity="0.85" />
      <g className={compact ? undefined : "poppy-spin"} transform="translate(80 80)">
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <g key={deg} transform={`rotate(${deg})`}>
            <path
              d="M4 0 Q18 -14 48 -4 Q36 0 48 4 Q18 14 4 0 Z"
              fill={`url(#pp-blade-${uid})`}
              stroke="#05060b"
              strokeWidth="1.15"
            />
            <path d="M10 0 L42 0" stroke="#ff5c2a" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M14 -3 L38 -2" stroke="#ffffff" strokeWidth="0.7" opacity="0.35" />
          </g>
        ))}
      </g>
      <circle cx="80" cy="80" r="18" fill={`url(#pp-hub-${uid})`} stroke="#05060b" strokeWidth="1.4" />
      <circle cx="80" cy="80" r="11" fill="#12151c" stroke="#7c6cf0" strokeWidth="1.6" />
      <circle cx="80" cy="80" r="6" fill="#ff5c2a" />
      <circle cx="77" cy="77" r="1.8" fill="#ffe56a" />
      <ellipse cx="74" cy="70" rx="10" ry="4" fill={`url(#pp-sheen-${uid})`} />
      <circle cx="80" cy="80" r="22" fill="none" stroke="#ff5c2a" strokeWidth="1.1" opacity="0.45" />
    </svg>
  );
}
