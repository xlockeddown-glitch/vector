import { useId } from "react";
import { cn } from "@/lib/utils";

/** Title-grade yellow saucer: chrome paint, sage lip, frost-pip eye. */
export function ZeekUfo({
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
      viewBox="-12 -28 224 176"
      className={cn("rocket-hull h-auto w-full", puddle ? "overflow-hidden" : "overflow-visible", className)}
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={`zk-chrome-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff6c8" />
          <stop offset="0.18" stopColor="#ffe56a" />
          <stop offset="0.45" stopColor="#ffc72c" />
          <stop offset="0.72" stopColor="#b8860a" />
          <stop offset="1" stopColor="#3a2a08" />
        </linearGradient>
        <radialGradient id={`zk-dome-${uid}`} cx="36%" cy="28%" r="72%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.28" stopColor="#fff6c8" />
          <stop offset="0.62" stopColor="#ffc72c" />
          <stop offset="1" stopColor="#6a4a08" />
        </radialGradient>
        <radialGradient id={`zk-eye-${uid}`} cx="38%" cy="32%" r="70%">
          <stop offset="0" stopColor="#d4ff8a" />
          <stop offset="0.4" stopColor="#3ecf7a" />
          <stop offset="1" stopColor="#0c1408" />
        </radialGradient>
        <linearGradient id={`zk-sheen-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.4" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="104" rx="56" ry="6" fill="#05060b" opacity="0.42" />
      {!compact && (
        <g className="zeek-beam">
          <path d="M72 86 Q100 128 128 86" fill="#3ecf7a" opacity="0.22" />
          <path d="M82 86 Q100 114 118 86" fill="#ffc72c" opacity="0.2" />
        </g>
      )}
      <ellipse cx="100" cy="76" rx="82" ry="20" fill={`url(#zk-chrome-${uid})`} stroke="#05060b" strokeWidth="1.35" />
      <ellipse cx="100" cy="72" rx="64" ry="12" fill="#121418" />
      <ellipse cx="100" cy="72" rx="64" ry="12" fill="none" stroke="#3ecf7a" strokeWidth="3" />
      <path d="M46 72 L74 60 L100 56 L126 60 L154 72" fill="none" stroke="#3ecf7a" strokeWidth="2.2" />
      <rect x="78" y="68" width="44" height="5" rx="1.5" fill="#3ecf7a" />
      <ellipse cx="100" cy="48" rx="38" ry="26" fill={`url(#zk-dome-${uid})`} stroke="#05060b" strokeWidth="1.2" />
      <ellipse cx="88" cy="40" rx="14" ry="8" fill={`url(#zk-sheen-${uid})`} />
      <ellipse cx="100" cy="46" rx="20" ry="14" fill="#0c1014" stroke="#3ecf7a" strokeWidth="1.5" />
      <ellipse cx="108" cy="44" rx="8" ry="6.5" fill={`url(#zk-eye-${uid})`} />
      <ellipse cx="111" cy="42" rx="2.2" ry="1.8" fill="#ffffff" />
      {[36, 60, 84, 116, 140, 164].map((x) => (
        <ellipse key={x} cx={x} cy="84" rx="5.5" ry="3" fill="#121418" stroke="#ffe56a" strokeWidth="0.9" />
      ))}
    </svg>
  );
}
