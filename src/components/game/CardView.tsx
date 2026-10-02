import type { CardDef, Rarity, RolledCard } from "@/game/types";
import { KIND_LABEL, cardReadout } from "@/game/data/glossary";
import { RARITY_GEM, rarityFoil } from "@/game/data/rarity";
import { abilityOf, getCard } from "@/game/data/cards";
import { gunSheet, setSheets } from "@/game/data/card-stats";
import { cardPortraitSrc } from "@/game/data/card-art";
import { cn } from "@/lib/utils";
import { useId } from "react";
import { BoostRocket } from "./BoostRocket";
import { ShrikeJet } from "./ShrikeJet";
import { BoreAuger } from "./BoreAuger";
import { PoppyMill } from "./PoppyMill";
import { ZeekUfo } from "./ZeekUfo";
import { JouleRacer } from "./JouleRacer";
import { GunPortrait } from "./GunPortrait";
import {
  KelvinBear,
  HaloDrone,
  TorrShark,
  RookTruck,
  PuckDisc,
  ChisEagle,
  TorchTiger,
} from "./CompanionPortraits";

const RARITY_LABEL: Record<Rarity, string> = {
  common: RARITY_GEM.common.name,
  uncommon: RARITY_GEM.uncommon.name,
  rare: RARITY_GEM.rare.name,
  epic: RARITY_GEM.epic.name,
  legendary: RARITY_GEM.legendary.name,
};

const SHELL: Record<Rarity, string> = {
  common: "bg-surface",
  uncommon: "bg-surface",
  rare: "bg-ink-2",
  epic: "bg-ink-2",
  legendary: "card-legend bg-ink",
};

const BAR: Record<Rarity, string> = {
  common: "bg-paper text-ink",
  uncommon: "bg-uncommon text-ink",
  rare: "bg-ruby text-ink",
  epic: "bg-epic text-paper",
  legendary: "bg-ink text-legend",
};

function GemCut({ rarity }: { rarity: Rarity }) {
  if (rarity === "common") return <ellipse cx="20" cy="20" rx="12.5" ry="14.5" />;
  if (rarity === "uncommon") return <polygon points="20,5 31,12 31,28 20,35 9,28 9,12" />;
  if (rarity === "rare") return <polygon points="20,4 28,10 34,20 28,30 20,36 12,30 6,20 12,10" />;
  if (rarity === "epic") return <polygon points="20,3 33,11 33,25 20,37 7,25 7,11" />;
  return <polygon points="20,2 34,20 20,38 6,20" />;
}

const GEM_FACE: Record<Rarity, { hi: string; mid: string; lo: string; spark: string }> = {
  common: { hi: "#f7fbff", mid: "#d7e4ef", lo: "#7d92a6", spark: "#ffffff" },
  uncommon: { hi: "#c8e4ff", mid: "#3d9bff", lo: "#0c457f", spark: "#eef7ff" },
  rare: { hi: "#ffb3bc", mid: "#e14d5c", lo: "#7a1224", spark: "#ffe8ea" },
  epic: { hi: "#dccfff", mid: "#9b6cff", lo: "#3a2468", spark: "#f6f0ff" },
  legendary: { hi: "#fff4c4", mid: "#e8c15a", lo: "#7a5c12", spark: "#fff8e0" },
};

function GemStone({ rarity, tiny }: { rarity: Rarity; tiny?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const clip = `g-cut-${uid}`;
  const fill = `g-fill-${uid}`;
  const prism = `g-prism-${uid}`;
  const face = GEM_FACE[rarity];
  return (
    <span className={cn("card-gem-chip", tiny && "card-gem-tiny", `gem-${rarity}`)} title={RARITY_LABEL[rarity]}>
      <svg viewBox="0 0 40 40" className="gem-svg" aria-hidden>
        <defs>
          <radialGradient id={fill} cx="36%" cy="28%" r="74%">
            <stop offset="0" stopColor={face.hi} />
            <stop offset="0.42" stopColor={face.mid} />
            <stop offset="1" stopColor={face.lo} />
          </radialGradient>
          {rarity === "legendary" && (
            <linearGradient id={prism} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ff5c2a" stopOpacity="0.42" />
              <stop offset="0.38" stopColor="#e8c15a" stopOpacity="0.12" />
              <stop offset="0.68" stopColor="#3cd6cc" stopOpacity="0.4" />
              <stop offset="1" stopColor="#e8c15a" stopOpacity="0.18" />
            </linearGradient>
          )}
          <clipPath id={clip}>
            <GemCut rarity={rarity} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clip})`}>
          <rect width="40" height="40" fill={`url(#${fill})`} />
          {rarity === "legendary" && <rect width="40" height="40" fill={`url(#${prism})`} />}
          <ellipse cx="14" cy="13" rx="6" ry="5" fill={face.spark} opacity="0.35" />
        </g>
      </svg>
    </span>
  );
}

function SignalMark() {
  return (
    <svg viewBox="0 0 80 80" className="h-[85%] w-[85%]" aria-hidden>
      <circle cx="40" cy="40" r="28" fill="none" stroke="#3cd6cc" strokeWidth="1.4" opacity="0.35" />
      <circle cx="40" cy="40" r="20" fill="none" stroke="#3cd6cc" strokeWidth="1.8" opacity="0.7" />
      <circle cx="40" cy="40" r="12" fill="none" stroke="#eef3f7" strokeWidth="1.5" />
      <circle cx="40" cy="40" r="5" fill="#3cd6cc" />
      <path d="M40 8 L40 18 M40 72 L40 62 M8 40 L18 40 M72 40 L62 40" stroke="#3cd6cc" strokeWidth="2" />
    </svg>
  );
}

export function CraftPortrait({ id, className }: { id: string; className?: string }) {
  const fig = cn(className, "craft-card-art");
  if (id.includes("boost")) return <BoostRocket className={fig} card />;
  if (id.includes("shrike")) return <ShrikeJet className={fig} card />;
  if (id.includes("auger")) return <BoreAuger className={fig} card />;
  if (id.includes("poppy")) return <PoppyMill className={fig} />;
  if (id.includes("zeek")) return <ZeekUfo className={fig} />;
  if (id.includes("joule")) return <JouleRacer className={fig} />;
  if (id.includes("kelvin") || id.includes("nix")) return <KelvinBear className={fig} />;
  if (id.includes("halo")) return <HaloDrone className={fig} />;
  if (id.includes("torr") || id.includes("mote")) return <TorrShark className={fig} />;
  if (id.includes("rook")) return <RookTruck className={fig} />;
  if (id.includes("puck")) return <PuckDisc className={fig} />;
  if (id.includes("chis") || id.includes("glim")) return <ChisEagle className={fig} />;
  if (id.includes("torch")) return <TorchTiger className={fig} />;
  if (id.includes("sink")) return <SignalMark />;
  return null;
}

function isCraftArt(id: string) {
  return /boost|shrike|auger|poppy|zeek|joule|kelvin|nix|halo|torr|mote|rook|puck|chis|glim|torch|sink/.test(id);
}

function portraitKeys(card: CardDef): string[] {
  const rolled = card as RolledCard;
  return [rolled.templateId, card.id, card.art, card.stats?.role, card.name.toLowerCase()].filter(
    (k): k is string => !!k,
  );
}

function CardArt({ card, className }: { card: CardDef; className?: string }) {
  const src = portraitKeys(card)
    .map((key) => cardPortraitSrc(key))
    .find((s): s is string => !!s);
  if (src) return <img src={src} alt="" draggable={false} className={cn("card-paint", className)} />;
  const tid = "templateId" in card ? (card as RolledCard).templateId : card.id;
  const craftId = card.kind === "kit" ? (card.kit?.craftId ?? card.art) : tid;
  if (card.kind === "set" && card.setGuns?.length) {
    return (
      <div className={cn("flex h-full w-full items-center justify-center gap-1 px-1", className)}>
        {card.setGuns.map((id) => {
          try {
            const g = getCard(id);
            return <GunPortrait key={id} card={g} className="h-full w-1/2 min-w-0" />;
          } catch {
            return null;
          }
        })}
      </div>
    );
  }
  if (card.kind === "signal") {
    return (
      <div className={cn("flex h-full w-full items-center justify-center p-2", className)}>
        <SignalMark />
      </div>
    );
  }
  if (isCraftArt(craftId ?? "")) return <CraftPortrait id={craftId ?? ""} className={className} />;
  if (card.kind === "tower" || card.kind === "defender") return <GunPortrait card={card} className={className} />;
  return (
    <div className={cn("flex h-full w-full items-center justify-center p-2", className)}>
      <SignalMark />
    </div>
  );
}

export function CardMark({ card }: { card: CardDef }) {
  return (
    <span className="card-mark">
      <CardArt card={card} />
    </span>
  );
}

export function CardView({
  card,
  onPick,
  selected,
  compact,
  tiny,
  delay = 0,
  tag,
  hint,
  sealed,
  banned,
  picked,
  dimmed,
  foil,
  dealAnim = true,
  flipped = false,
  onFlip,
  faceFlip = false,
  className,
}: {
  card: CardDef;
  onPick?: () => void;
  selected?: boolean;
  compact?: boolean;
  tiny?: boolean;
  delay?: number;
  tag?: string;
  hint?: { label: string; sub: string; hot?: boolean } | null;
  sealed?: boolean;
  banned?: boolean;
  picked?: boolean;
  dimmed?: boolean;
  foil?: boolean;
  dealAnim?: boolean;
  flipped?: boolean;
  onFlip?: () => void;
  faceFlip?: boolean;
  className?: string;
}) {
  const readout = cardReadout(card);
  const slim = tiny || compact;
  const isGun = card.kind === "tower" || card.kind === "defender";
  const isCraft = card.kind === "companion";
  const isSignal = card.kind === "signal";
  const isSet = card.kind === "set";
  const job = abilityOf(card);
  const kindWord = isSignal ? "This run" : isSet ? "Two guns" : isCraft ? "Ship" : isGun ? "Gun" : KIND_LABEL[card.kind];

  if (sealed) {
    return (
      <CardBack
        rarity={card.rarity}
        delay={delay}
        selected={selected}
        onPick={onPick}
        compact={slim}
        picked={picked}
        dimmed={dimmed}
        foil={foil}
      />
    );
  }

  return (
    <div
      className={cn(
        "hs-wrap",
        className,
        dealAnim && "hs-deal",
        tiny && "is-tiny",
        compact && "is-compact",
        banned && "opacity-40 grayscale",
        picked && "is-picked",
        dimmed && "is-dim",
        selected && "is-on",
        hint?.hot && "is-hot",
      )}
      data-gem={card.rarity}
      data-kind={kindWord.toLowerCase()}
      data-paint="1"
      style={{ animationDelay: `${delay}ms` }}
    >
      {!slim && <span className="hs-stock" aria-hidden />}
      <button type="button" onClick={faceFlip ? onFlip : onPick} disabled={banned} title={readout.tip} className="hs-face">
        {flipped && !slim ? (
          <CardStatBack card={card} kindWord={kindWord} job={job} title={readout.title} />
        ) : (
          <>
            <span className="hs-art">
              <CardArt card={card} />
            </span>
            <span className="hs-inset">
              <GemStone rarity={card.rarity} tiny={tiny} />
              <span className="hs-foot">
                <span className="hs-banner">
                  <span className="hs-name">{readout.title}</span>
                </span>
                <span className="hs-text">
                  <span className="hs-type">
                    {kindWord}
                    {tag ? ` · ${tag}` : ""}
                  </span>
                  {!slim && <span className="hs-job">{job}</span>}
                </span>
              </span>
            </span>
          </>
        )}
      </button>
      {onFlip && !slim && !faceFlip && (
        <button
          type="button"
          className="hs-flip-tab"
          onClick={(e) => {
            e.stopPropagation();
            onFlip();
          }}
        >
          {flipped ? "Front" : "Flip"}
        </button>
      )}
    </div>
  );
}

function SegRow({ label, n }: { label: string; n: number }) {
  return (
    <div className="hs-seg-row">
      <span className="hs-seg-label">{label}</span>
      <span className="hs-segs" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <i key={i} className={cn("hs-seg", i < n && "is-on")} />
        ))}
      </span>
    </div>
  );
}

function CardStatBack({
  card,
  kindWord,
  job,
  title,
}: {
  card: CardDef;
  kindWord: string;
  job: string;
  title: string;
}) {
  const gun = gunSheet(card);
  const setRows = card.kind === "set" ? setSheets(card) : [];
  return (
    <span className="hs-stat-back">
      <span className="hs-stat-name">{title}</span>
      <span className="hs-stat-kind">{kindWord}</span>
      {setRows.length > 0 ? (
        setRows.map((row) => (
          <span key={row.name} className="hs-stat-gun">
            <span className="hs-stat-gun-name">
              {row.name}
              <em>{row.bars.trickName}</em>
            </span>
            <SegRow label="Hurt" n={row.bars.hurt} />
            <SegRow label="Speed" n={row.bars.speed} />
            <SegRow label="Reach" n={row.bars.reach} />
          </span>
        ))
      ) : gun ? (
        <>
          <SegRow label="Hurt" n={gun.bars.hurt} />
          <SegRow label="Speed" n={gun.bars.speed} />
          <SegRow label="Reach" n={gun.bars.reach} />
          <SegRow label={gun.bars.trickName} n={gun.bars.trick} />
          <span className="hs-stat-job">{job}</span>
        </>
      ) : (
        <span className="hs-stat-job">{job}</span>
      )}
    </span>
  );
}

export function CardBack({
  rarity,
  onPick,
  delay = 0,
  selected,
  compact,
  picked,
  dimmed,
  foil,
}: {
  rarity: Rarity;
  onPick?: () => void;
  delay?: number;
  selected?: boolean;
  compact?: boolean;
  picked?: boolean;
  dimmed?: boolean;
  foil?: boolean;
}) {
  return (
    <div
      className={cn(
        compact ? "relative w-[5.4rem] min-w-[5.4rem]" : "hs-wrap hs-deal",
        picked && "is-picked",
        dimmed && "is-dim",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <button
        type="button"
        onClick={onPick}
        className={cn(
          "hs-face relative flex w-full flex-col overflow-hidden text-left",
          SHELL[rarity],
          rarityFoil(rarity),
          selected && "ring-1 ring-ember/50",
        )}
      >
        <div className={cn("relative flex items-center justify-between px-2.5 py-1", BAR[rarity])}>
          <span className="text-[10px] font-medium tracking-wide">{foil ? "Peek" : "Sealed"}</span>
          <span className="text-[10px] font-medium tracking-wide">{RARITY_LABEL[rarity]}</span>
        </div>
        <div className="relative mx-2 mb-2 mt-1.5 flex h-[7.25rem] flex-col items-center justify-center overflow-hidden rounded-md border border-line">
          <span className="font-display text-2xl font-bold tracking-[0.2em] text-steel">V</span>
        </div>
        <p className="px-2.5 pb-2.5 font-display text-[15px] font-bold tracking-wide text-paper">
          {foil ? "Tap to flip" : "VECTOR"}
        </p>
      </button>
    </div>
  );
}
