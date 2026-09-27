import { useId } from "react";
import type { CardDef, SetId, TowerHull } from "@/game/types";
import { WATCH_WORLD, watchOf } from "@/game/data/worlds";
import { useGame } from "@/game/store";
import { cn } from "@/lib/utils";

function hullKey(art: string | undefined): TowerHull | string {
  if (!art) return "cone";
  if (art === "mortar" || art === "ember") return "invert";
  if (art === "fan") return "mill";
  if (art === "saw") return "spin";
  if (art === "rail") return "tube";
  if (art === "rime") return "crystal";
  if (art === "grove") return "dish";
  if (art === "arc") return "coil";
  if (art === "captain") return "stamp";
  if (art === "longbow") return "cone";
  if (art === "hex") return "prism";
  return art;
}

function neonOf(set: SetId | null | undefined) {
  if (set === "heat") return "#ff5c2a";
  if (set === "cold") return "#3cd6cc";
  if (set === "spark") return "#7c6cf0";
  return "#c5ccd3";
}

function Steel({ uid, neon, limb }: { uid: string; neon: string; limb: string }) {
  return (
    <defs>
      <linearGradient id={`gp-hull-${uid}`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#1a1e26" />
        <stop offset="0.16" stopColor="#eef3f7" />
        <stop offset="0.4" stopColor="#9aa3b2" />
        <stop offset="0.68" stopColor="#2a3038" />
        <stop offset="1" stopColor="#0b1018" />
      </linearGradient>
      <linearGradient id={`gp-nose-${uid}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#eef3f7" />
        <stop offset="0.45" stopColor={neon} />
        <stop offset="1" stopColor="#12151c" />
      </linearGradient>
      <radialGradient id={`gp-glow-${uid}`} cx="42%" cy="30%" r="70%">
        <stop offset="0" stopColor={neon} stopOpacity="0.9" />
        <stop offset="1" stopColor={neon} stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`gp-tile-${uid}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#6ec4f0" />
        <stop offset="1" stopColor="#1a4a72" />
      </linearGradient>
      <radialGradient id={`gp-world-${uid}`} cx="38%" cy="32%" r="72%">
        <stop offset="0" stopColor="#eef3f7" stopOpacity="0.35" />
        <stop offset="0.28" stopColor={limb} stopOpacity="0.85" />
        <stop offset="1" stopColor="#05060b" />
      </radialGradient>
    </defs>
  );
}

function Planet({
  uid,
  world,
}: {
  uid: string;
  world: (typeof WATCH_WORLD)[keyof typeof WATCH_WORLD];
}) {
  return (
    <g>
      <circle cx="72" cy="48" r="22" fill={`url(#gp-world-${uid})`} />
      <circle cx="72" cy="48" r="22" fill={world.fill} opacity="0.62" />
      <ellipse cx="66" cy="42" rx="8" ry="5" fill={world.sea} opacity="0.75" />
      <ellipse cx="80" cy="54" rx="7" ry="4" fill={world.sea} opacity="0.45" />
      {world.lava && <path d="M62 50 Q72 42 82 52 Q72 56 62 50" fill="#ff5c2a" opacity="0.7" />}
      {world.storm && (
        <path d="M60 44 Q72 36 84 50" fill="none" stroke="#eef3f7" strokeWidth="1.1" opacity="0.5" />
      )}
      {world.stars && (
        <>
          <circle cx="64" cy="38" r="0.8" fill="#eef3f7" opacity="0.9" />
          <circle cx="82" cy="44" r="0.7" fill="#eef3f7" opacity="0.7" />
          <circle cx="70" cy="56" r="0.6" fill="#c5ccd6" opacity="0.8" />
        </>
      )}
      <ellipse cx="62" cy="40" rx="7" ry="10" fill="#05060b" opacity="0.28" />
      <circle cx="72" cy="48" r="22" fill="none" stroke={world.limb} strokeWidth="1.4" opacity="0.9" />
      {world.ring && (
        <ellipse cx="72" cy="48" rx="30" ry="6" fill="none" stroke={world.limb} strokeWidth="1.6" opacity="0.75" />
      )}
    </g>
  );
}

function Pad({ uid, neon }: { uid: string; neon: string }) {
  return (
    <g>
      <ellipse cx="64" cy="168" rx="46" ry="12" fill="#000" opacity="0.45" />
      <ellipse cx="64" cy="160" rx="40" ry="14" fill="#12151c" />
      <ellipse cx="64" cy="158" rx="34" ry="10" fill="#0b1018" stroke="#4aa8e8" strokeWidth="1.3" />
      {[-16, -6, 4, 14].map((dx) => (
        <rect key={dx} x={64 + dx} y="155" width="8" height="3.2" fill={`url(#gp-tile-${uid})`} opacity="0.85" />
      ))}
      <ellipse cx="64" cy="156" rx="10" ry="3" fill="#05060b" />
      <circle cx="22" cy="150" r="3.2" fill={neon} />
      <circle cx="106" cy="150" r="3.2" fill={neon} />
    </g>
  );
}

function Hardware({ hull, uid, neon }: { hull: string; uid: string; neon: string }) {
  const H = `url(#gp-hull-${uid})`;
  const N = `url(#gp-nose-${uid})`;
  const ink = "#05060b";
  switch (hull) {
    case "invert":
      return (
        <g>
          <path d="M28 118 L100 118 L88 150 L40 150 Z" fill={H} stroke={ink} strokeWidth="1.4" />
          <rect x="44" y="88" width="40" height="32" rx="4" fill={H} stroke={ink} strokeWidth="1.3" />
          <rect x="56" y="70" width="16" height="22" rx="2" fill={`url(#gp-tile-${uid})`} />
          <circle cx="64" cy="128" r="10" fill={neon} opacity="0.85" />
        </g>
      );
    case "crystal":
      return (
        <g>
          <path d="M64 48 L86 118 L42 118 Z" fill={N} stroke={ink} strokeWidth="1.4" />
          <path d="M64 62 L74 110 L54 110 Z" fill="#eef3f7" opacity="0.28" />
          <path d="M48 96 L64 48 L56 118 Z" fill={neon} opacity="0.35" />
          <rect x="52" y="118" width="24" height="32" rx="3" fill={H} stroke={ink} strokeWidth="1.2" />
        </g>
      );
    case "tube":
      return (
        <g>
          <rect x="54" y="72" width="20" height="80" rx="4" fill={H} stroke={ink} strokeWidth="1.4" />
          <rect x="58" y="78" width="4" height="68" fill={`url(#gp-tile-${uid})`} />
          <rect x="44" y="64" width="40" height="16" rx="3" fill={N} stroke={ink} strokeWidth="1.2" />
          <rect x="48" y="56" width="32" height="10" rx="2" fill={neon} opacity="0.8" />
        </g>
      );
    case "spin":
      return (
        <g>
          <circle cx="64" cy="108" r="36" fill={H} stroke={ink} strokeWidth="1.4" />
          <path d="M64 74 L72 108 L64 142 L56 108 Z" fill={N} />
          <path d="M30 108 L64 100 L98 108 L64 116 Z" fill={neon} opacity="0.55" />
          <circle cx="64" cy="108" r="8" fill={ink} stroke={neon} strokeWidth="1.4" />
        </g>
      );
    case "dish":
    case "halo":
      return (
        <g>
          <ellipse cx="64" cy="100" rx="38" ry="16" fill={H} stroke={ink} strokeWidth="1.4" />
          <ellipse cx="64" cy="96" rx="26" ry="10" fill={ink} />
          <ellipse cx="64" cy="96" rx="18" ry="6" fill={neon} opacity="0.8" />
          <rect x="60" y="112" width="8" height="40" rx="2" fill={H} stroke={ink} strokeWidth="1.2" />
          {hull === "halo" && (
            <>
              <circle cx="36" cy="88" r="5" fill={neon} />
              <circle cx="92" cy="88" r="5" fill={neon} />
              <circle cx="64" cy="78" r="4" fill="#eef3f7" />
            </>
          )}
        </g>
      );
    case "coil":
      return (
        <g>
          <rect x="56" y="120" width="16" height="32" rx="2" fill={H} stroke={ink} strokeWidth="1.2" />
          {[0, 1, 2, 3].map((i) => (
            <ellipse key={i} cx="64" cy={70 + i * 14} rx="18" ry="7" fill="none" stroke={neon} strokeWidth="3" />
          ))}
          <rect x="60" y="52" width="8" height="18" fill={N} />
        </g>
      );
    case "mill":
      return (
        <g>
          <path d="M64 108 L108 72 L96 108 Z" fill={H} stroke={ink} strokeWidth="1.2" />
          <path d="M64 108 L40 64 L56 108 Z" fill={H} stroke={ink} strokeWidth="1.2" />
          <path d="M64 108 L88 148 L52 140 Z" fill={N} stroke={ink} strokeWidth="1.2" />
          <circle cx="64" cy="108" r="8" fill={ink} stroke={neon} strokeWidth="1.6" />
          <rect x="60" y="108" width="8" height="44" fill={H} />
        </g>
      );
    case "stamp":
      return (
        <g>
          <rect x="40" y="86" width="48" height="36" rx="3" fill={H} stroke={ink} strokeWidth="1.4" />
          <rect x="46" y="92" width="36" height="10" fill={neon} opacity="0.8" />
          <rect x="56" y="58" width="16" height="30" rx="2" fill={H} stroke={ink} strokeWidth="1.2" />
          <rect x="48" y="122" width="32" height="28" rx="2" fill={N} />
        </g>
      );
    case "lens":
      return (
        <g>
          <rect x="58" y="70" width="12" height="80" rx="3" fill={H} stroke={ink} strokeWidth="1.3" />
          <ellipse cx="64" cy="64" rx="22" ry="14" fill={N} stroke={neon} strokeWidth="2" />
          <ellipse cx="64" cy="64" rx="10" ry="6" fill="#eef3f7" opacity="0.45" />
          <rect x="50" y="148" width="28" height="8" fill={`url(#gp-tile-${uid})`} />
        </g>
      );
    case "crane":
      return (
        <g>
          <rect x="58" y="100" width="12" height="52" rx="2" fill={H} stroke={ink} strokeWidth="1.2" />
          <path d="M64 104 L112 70 L116 78 L64 112 Z" fill={H} stroke={ink} strokeWidth="1.2" />
          <path d="M112 74 L112 118" stroke={neon} strokeWidth="2" />
          <path d="M104 118 L112 128 L120 118" fill="none" stroke={neon} strokeWidth="2.2" />
        </g>
      );
    case "furnace":
      return (
        <g>
          <rect x="36" y="88" width="56" height="60" rx="6" fill={H} stroke={ink} strokeWidth="1.4" />
          <rect x="48" y="104" width="32" height="28" rx="4" fill={ink} />
          <rect x="52" y="108" width="24" height="20" rx="3" fill={neon} opacity="0.9" />
          <rect x="44" y="72" width="8" height="16" fill={H} />
          <rect x="76" y="68" width="8" height="20" fill={H} />
        </g>
      );
    case "drill":
      return (
        <g>
          <path d="M64 52 L84 148 L44 148 Z" fill={H} stroke={ink} strokeWidth="1.4" />
          <path d="M64 64 L72 140 L56 140 Z" fill={neon} opacity="0.4" />
          {[70, 90, 110, 130].map((y) => (
            <path key={y} d={`M48 ${y} L80 ${y + 6}`} stroke={ink} strokeWidth="1.2" />
          ))}
        </g>
      );
    case "drum":
      return (
        <g>
          <ellipse cx="64" cy="86" rx="28" ry="12" fill={N} stroke={ink} strokeWidth="1.3" />
          <rect x="36" y="86" width="56" height="52" fill={H} />
          <ellipse cx="64" cy="138" rx="28" ry="12" fill={H} stroke={ink} strokeWidth="1.3" />
          <rect x="60" y="90" width="8" height="44" fill={neon} opacity="0.7" />
        </g>
      );
    case "twin":
      return (
        <g>
          <rect x="34" y="72" width="18" height="76" rx="4" fill={H} stroke={ink} strokeWidth="1.3" />
          <rect x="74" y="72" width="18" height="76" rx="4" fill={H} stroke={ink} strokeWidth="1.3" />
          <rect x="38" y="78" width="6" height="64" fill={`url(#gp-tile-${uid})`} />
          <rect x="78" y="78" width="6" height="64" fill={`url(#gp-tile-${uid})`} />
          <rect x="48" y="120" width="32" height="14" rx="2" fill={N} />
        </g>
      );
    case "barrier":
      return (
        <g>
          <path d="M28 148 L28 96 Q64 60 100 96 L100 148" fill="none" stroke={H} strokeWidth="10" />
          <path d="M28 148 L28 96 Q64 60 100 96 L100 148" fill="none" stroke={ink} strokeWidth="1.4" />
          <rect x="24" y="140" width="12" height="16" fill={H} />
          <rect x="92" y="140" width="12" height="16" fill={H} />
          <path d="M40 108 Q64 84 88 108" fill="none" stroke={neon} strokeWidth="2.2" />
        </g>
      );
    case "prism":
      return (
        <g>
          <path d="M64 52 L100 140 L28 140 Z" fill={N} stroke={ink} strokeWidth="1.4" />
          <path d="M64 68 L84 128 L44 128 Z" fill="#eef3f7" opacity="0.22" />
          <path d="M64 52 L64 140" stroke={neon} strokeWidth="1.6" opacity="0.8" />
        </g>
      );
    case "cone":
    default:
      return (
        <g>
          <path d="M64 44 L92 148 L36 148 Z" fill={H} stroke={ink} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M64 56 L76 140 L52 140 Z" fill="#eef3f7" opacity="0.22" />
          <rect x="60" y="78" width="8" height="56" fill={`url(#gp-tile-${uid})`} />
          <path d="M64 44 L72 70 L56 70 Z" fill={N} />
          <circle cx="64" cy="96" r="3.2" fill={neon} />
        </g>
      );
  }
}

export function GunPortrait({ card, className }: { card: CardDef; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const set = card.set;
  const neon = neonOf(set);
  const hull = hullKey(card.stats?.hull ?? card.art);
  const cover = card.stats?.cover;
  const watch = watchOf(useGame((s) => s.hud?.themeId));
  const world = WATCH_WORLD[watch];
  const spin = hull === "mill" || hull === "spin";
  return (
    <svg
      viewBox="6 48 116 136"
      className={cn("rocket-hull gun-portrait h-auto w-full overflow-hidden", className)}
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
      data-hull={hull}
      data-cover={cover ?? "circle"}
      data-watch={watch}
    >
      <Steel uid={uid} neon={neon} limb={world.limb} />
      <circle cx="64" cy="124" r="46" fill={`url(#gp-glow-${uid})`} opacity="0.32" />
      <g transform="translate(44 2) scale(0.42)">
        <Planet uid={uid} world={world} />
      </g>
      <g className="gun-idle-bob">
        <g transform="translate(-8 -10) scale(1.05)">
          <Pad uid={uid} neon={neon} />
          <g className={spin ? "gun-hw-spin" : undefined}>
            <Hardware hull={hull} uid={uid} neon={neon} />
          </g>
        </g>
      </g>
    </svg>
  );
}
