import { useId } from "react";
import { cn } from "@/lib/utils";

function hull(className?: string, viewBox = "0 0 160 160") {
  return {
    viewBox,
    className: cn("rocket-hull craft-card-art h-auto w-full overflow-visible", className),
    "aria-hidden": true as const,
    preserveAspectRatio: "xMidYMid meet" as const,
  };
}

function SteelKit({ uid, accent }: { uid: string; accent: string }) {
  return (
    <defs>
      <linearGradient id={`st-hull-${uid}`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#2a3038" />
        <stop offset="0.16" stopColor="#eef3f7" />
        <stop offset="0.4" stopColor="#9aa3b2" />
        <stop offset="0.7" stopColor="#2a3038" />
        <stop offset="1" stopColor="#0b0d12" />
      </linearGradient>
      <linearGradient id={`st-sheen-${uid}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="0.4" stopColor="#ffffff" stopOpacity="0.42" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
      <radialGradient id={`st-glow-${uid}`} cx="38%" cy="30%" r="70%">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.45" stopColor={accent} />
        <stop offset="1" stopColor="#05060b" />
      </radialGradient>
      <radialGradient id={`st-photo-${uid}`} cx="50%" cy="46%" r="72%">
        <stop offset="0" stopColor={accent} stopOpacity="0.32" />
        <stop offset="0.62" stopColor={accent} stopOpacity="0.06" />
        <stop offset="1" stopColor="#05060b" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

export function KelvinBear({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg {...hull(className, "-20 -16 200 196")}>
      <SteelKit uid={uid} accent="#3cd6cc" />
      <ellipse cx="80" cy="80" rx="70" ry="62" fill={`url(#st-photo-${uid})`} />
      <ellipse cx="80" cy="150" rx="32" ry="5" fill="#05060b" opacity="0.42" />
      <rect x="50" y="102" width="60" height="34" rx="14" fill={`url(#st-hull-${uid})`} stroke="#05060b" strokeWidth="1.2" />
      <rect x="58" y="114" width="44" height="8" rx="2" fill="#3cd6cc" />
      <ellipse cx="52" cy="38" rx="15" ry="17" fill={`url(#st-glow-${uid})`} stroke="#05060b" strokeWidth="1.2" />
      <ellipse cx="108" cy="38" rx="15" ry="17" fill={`url(#st-glow-${uid})`} stroke="#05060b" strokeWidth="1.2" />
      <circle cx="80" cy="74" r="36" fill={`url(#st-glow-${uid})`} stroke="#05060b" strokeWidth="1.4" />
      <rect x="48" y="66" width="64" height="18" rx="9" fill="#12151c" />
      <rect x="52" y="70" width="24" height="10" rx="5" fill="#3cd6cc" />
      <rect x="84" y="70" width="24" height="10" rx="5" fill="#3cd6cc" />
      <ellipse cx="68" cy="56" rx="16" ry="6" fill={`url(#st-sheen-${uid})`} />
      <ellipse cx="80" cy="96" rx="8" ry="6" fill="#12151c" />
      <circle cx="80" cy="94" r="2" fill="#ffffff" />
    </svg>
  );
}

export function HaloDrone({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg {...hull(className, "-20 -20 200 200")}>
      <SteelKit uid={uid} accent="#4aa8e8" />
      <ellipse cx="80" cy="80" rx="70" ry="62" fill={`url(#st-photo-${uid})`} />
      <ellipse cx="80" cy="150" rx="30" ry="5" fill="#05060b" opacity="0.42" />
      <ellipse cx="28" cy="48" rx="20" ry="7" fill="#4aa8e8" stroke="#05060b" strokeWidth="1.1" />
      <ellipse cx="132" cy="48" rx="20" ry="7" fill="#ff5c2a" stroke="#05060b" strokeWidth="1.1" />
      <ellipse cx="28" cy="112" rx="20" ry="7" fill="#e8c15a" stroke="#05060b" strokeWidth="1.1" />
      <ellipse cx="132" cy="112" rx="20" ry="7" fill="#3ecf7a" stroke="#05060b" strokeWidth="1.1" />
      <line x1="46" y1="54" x2="64" y2="70" stroke="#c5ccd3" strokeWidth="3" />
      <line x1="114" y1="54" x2="96" y2="70" stroke="#c5ccd3" strokeWidth="3" />
      <line x1="46" y1="106" x2="64" y2="90" stroke="#c5ccd3" strokeWidth="3" />
      <line x1="114" y1="106" x2="96" y2="90" stroke="#c5ccd3" strokeWidth="3" />
      <circle cx="80" cy="80" r="26" fill={`url(#st-hull-${uid})`} stroke="#05060b" strokeWidth="1.4" />
      <circle cx="80" cy="80" r="16" fill="#12151c" stroke="#4aa8e8" strokeWidth="1.6" />
      <circle cx="80" cy="80" r="7" fill="#4aa8e8" />
      <circle cx="83" cy="77" r="2" fill="#ffffff" />
      <ellipse cx="72" cy="70" rx="10" ry="4" fill={`url(#st-sheen-${uid})`} />
    </svg>
  );
}

export function TorrShark({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg {...hull(className, "0 0 200 200")}>
      <SteelKit uid={uid} accent="#e8c15a" />
      <ellipse cx="100" cy="102" rx="92" ry="78" fill={`url(#st-photo-${uid})`} />
      <ellipse cx="100" cy="168" rx="62" ry="9" fill="#05060b" opacity="0.5" />
      <path
        d="M22 108 Q28 72 78 78 Q118 68 148 88 Q168 98 158 112 Q172 118 156 128 Q118 148 70 140 Q28 132 22 108 Z"
        fill={`url(#st-hull-${uid})`}
        stroke="#05060b"
        strokeWidth="1.5"
      />
      <path d="M70 112 Q118 132 152 108 Q128 128 74 120 Z" fill="#0b0d12" opacity="0.5" />
      <rect x="52" y="98" width="78" height="6" rx="1.2" fill="#e8c15a" />
      <rect x="52" y="100" width="78" height="2" fill="#ffe56a" opacity="0.75" />
      <path d="M96 70 L122 28 L128 86 Z" fill="#e8c15a" stroke="#05060b" strokeWidth="1.2" />
      <path d="M102 68 L120 40 L122 82 Z" fill="#ffe56a" opacity="0.45" />
      <path d="M24 92 L6 68 L22 112 Z" fill="#e8c15a" stroke="#05060b" strokeWidth="1" />
      <circle cx="150" cy="96" r="7" fill="#121418" stroke="#e8c15a" strokeWidth="1.3" />
      <circle cx="152.4" cy="94" r="2.2" fill="#ffe56a" />
      <path d="M160 98 L194 108 L160 118 Z" fill="#eef3f7" stroke="#05060b" strokeWidth="0.9" />
      <path d="M36 114 L48 126 L32 122 Z" fill="#eef3f7" />
      <path d="M50 122 L62 134 L46 130 Z" fill="#eef3f7" />
      <path d="M64 128 L74 138 L60 134 Z" fill="#eef3f7" />
      <ellipse cx="72" cy="84" rx="28" ry="10" fill={`url(#st-sheen-${uid})`} />
    </svg>
  );
}

export function RookTruck({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg {...hull(className, "-12 -12 184 176")}>
      <SteelKit uid={uid} accent="#ff5c2a" />
      <ellipse cx="80" cy="80" rx="70" ry="62" fill={`url(#st-photo-${uid})`} />
      <ellipse cx="80" cy="142" rx="38" ry="5" fill="#05060b" opacity="0.42" />
      <circle cx="44" cy="114" r="20" fill="#12151c" stroke="#c5ccd3" strokeWidth="2.2" />
      <circle cx="116" cy="114" r="22" fill="#12151c" stroke="#c5ccd3" strokeWidth="2.2" />
      <circle cx="44" cy="114" r="6" fill="#9aa3b2" />
      <circle cx="116" cy="114" r="7" fill="#9aa3b2" />
      <path d="M22 76 L138 68 L146 104 L14 104 Z" fill={`url(#st-hull-${uid})`} stroke="#05060b" strokeWidth="1.3" />
      <rect x="50" y="46" width="14" height="28" fill="#12151c" stroke="#c5ccd3" strokeWidth="1.2" />
      <rect x="96" y="44" width="14" height="30" fill="#12151c" stroke="#c5ccd3" strokeWidth="1.2" />
      <rect x="128" y="80" width="20" height="10" fill="#ff5c2a" />
      <rect x="56" y="82" width="42" height="8" fill="#3cd6cc" />
      <rect x="40" y="74" width="70" height="5" fill={`url(#st-sheen-${uid})`} />
    </svg>
  );
}

export function PuckDisc({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg {...hull(className, "-20 -20 200 200")}>
      <SteelKit uid={uid} accent="#e31937" />
      <ellipse cx="80" cy="80" rx="70" ry="62" fill={`url(#st-photo-${uid})`} />
      <ellipse cx="80" cy="150" rx="28" ry="5" fill="#05060b" opacity="0.45" />
      <path d="M80 18 L132 48 L132 104 L80 134 L28 104 L28 48 Z" fill={`url(#st-hull-${uid})`} stroke="#05060b" strokeWidth="1.5" />
      <rect x="36" y="74" width="88" height="10" rx="1" fill="#e31937" />
      <rect x="36" y="76" width="88" height="3" fill="#ff8a8a" opacity="0.7" />
      <circle cx="80" cy="80" r="14" fill="#12151c" stroke="#7ef0ea" strokeWidth="1.4" />
      <circle cx="80" cy="80" r="8" fill="#7ef0ea" />
      <circle cx="77" cy="77" r="2.2" fill="#ffffff" />
      <ellipse cx="62" cy="50" rx="20" ry="8" fill={`url(#st-sheen-${uid})`} />
    </svg>
  );
}

export function ChisEagle({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg {...hull(className, "-16 -8 192 168")}>
      <SteelKit uid={uid} accent="#3ecf7a" />
      <ellipse cx="80" cy="78" rx="70" ry="58" fill={`url(#st-photo-${uid})`} />
      <ellipse cx="80" cy="130" rx="32" ry="5" fill="#05060b" opacity="0.42" />
      <path d="M80 70 Q22 24 8 72 Q36 90 78 82 Z" fill={`url(#st-hull-${uid})`} stroke="#05060b" strokeWidth="1.2" />
      <path d="M80 70 Q138 24 152 72 Q124 90 82 82 Z" fill={`url(#st-hull-${uid})`} stroke="#05060b" strokeWidth="1.2" />
      <ellipse cx="80" cy="82" rx="20" ry="24" fill="#143322" stroke="#3ecf7a" strokeWidth="1.6" />
      <rect x="75" y="64" width="10" height="36" fill="#3ecf7a" />
      <rect x="60" y="78" width="40" height="10" fill="#3ecf7a" />
      <path d="M80 48 L88 62 L72 62 Z" fill="#ffe56a" stroke="#05060b" strokeWidth="0.8" />
      <ellipse cx="68" cy="60" rx="14" ry="5" fill={`url(#st-sheen-${uid})`} />
    </svg>
  );
}

export function TorchTiger({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg {...hull(className, "0 0 200 200")}>
      <SteelKit uid={uid} accent="#ff5c2a" />
      <ellipse cx="100" cy="102" rx="92" ry="78" fill={`url(#st-photo-${uid})`} />
      <ellipse cx="100" cy="170" rx="62" ry="9" fill="#05060b" opacity="0.5" />
      <path d="M78 58 L60 18 L52 64 L92 78 Z" fill="#ff5c2a" stroke="#05060b" strokeWidth="1.2" />
      <path d="M66 52 L54 26 L74 68 Z" fill="#ffe56a" opacity="0.55" />
      <path d="M96 62 L118 22 L108 76 Z" fill="#ff5c2a" stroke="#05060b" strokeWidth="1.1" />
      <path
        d="M18 114 Q36 70 82 78 Q124 66 146 92 Q162 112 132 126 Q86 146 24 128 Z"
        fill={`url(#st-hull-${uid})`}
        stroke="#05060b"
        strokeWidth="1.5"
      />
      <path d="M50 96 Q56 128 58 138" stroke="#ff5c2a" strokeWidth="3.6" fill="none" />
      <path d="M76 86 Q82 124 84 134" stroke="#ff5c2a" strokeWidth="3.6" fill="none" />
      <path d="M102 84 Q108 122 110 132" stroke="#ff5c2a" strokeWidth="3.6" fill="none" />
      <rect x="44" y="92" width="82" height="6" rx="1.2" fill="#ff5c2a" />
      <rect x="44" y="94" width="82" height="2" fill="#ffe08a" opacity="0.75" />
      <path d="M140 90 L176 70 L194 98 L164 118 L140 108 Z" fill="#ff7a18" stroke="#05060b" strokeWidth="1.3" />
      <circle cx="170" cy="92" r="6.2" fill="#121418" stroke="#ff5c2a" strokeWidth="1.2" />
      <circle cx="172.2" cy="90" r="2" fill="#ffe56a" />
      <path d="M182 98 L200 106 L182 114 Z" fill="#ff5c2a" />
      <ellipse cx="28" cy="126" rx="8" ry="5" fill="#2a180e" stroke="#ff5c2a" strokeWidth="0.8" />
      <ellipse cx="48" cy="138" rx="7" ry="4.5" fill="#2a180e" stroke="#ff5c2a" strokeWidth="0.8" />
      <ellipse cx="70" cy="80" rx="28" ry="10" fill={`url(#st-sheen-${uid})`} />
    </svg>
  );
}
