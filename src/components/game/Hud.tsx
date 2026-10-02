import type { Action } from "@/game/runtime";
import type { HudState, SpecialPickHud, InspectHud } from "@/game/store";
import { fmtCount } from "@/game/format";
import { cn } from "@/lib/utils";
import { rarityGem } from "@/game/data/rarity";
import type { Rarity } from "@/game/types";
import { HOME_PAD, WIN_WAVES } from "@/game/constants";
import { Pause, Play, Volume2, VolumeX, ChartNoAxesColumn } from "lucide-react";
import { CraftPortrait } from "./CardView";
import { GunTree } from "./GunTree";

export function HudBar({
  hud,
  muted,
  onAction,
}: {
  hud: HudState;
  muted: boolean;
  onAction: (a: Action) => void;
}) {
  if (hud.phase === "title" || hud.phase === "help") return null;
  const playing = hud.phase === "placement" || hud.phase === "combat";
  return (
    <div className="play-top relative z-20">
      <div className="hud-stat">
        <p className="hud-kicker text-epic">Credit</p>
        <p className="hud-value num-glow-gold">{fmtCount(hud.points)}</p>
      </div>
      <div className="hud-stat">
        <p className="hud-kicker text-frost">Lives</p>
        <p className="hud-value">{fmtCount(hud.lives)}</p>
      </div>
      <div className="hud-stat">
        <p className="hud-kicker text-steel">Wave</p>
        <p className="hud-value">
          {hud.endless ? fmtCount(hud.wavesCleared) : `${fmtCount(hud.wavesCleared)}/${WIN_WAVES}`}
        </p>
        {playing && (
          <ClimbMeter
            xp={hud.xp}
            xpNext={hud.xpNext}
            pending={hud.pendingLevels > 0}
            bay={hud.climbRanks.bay}
            pack={hud.climbRanks.pack}
            crew={hud.climbRanks.crew}
            say={hud.bonusSay}
          />
        )}
      </div>
      {playing && hud.signalCards.some((c) => !!c) && (
        <div className="signal-dock" aria-label="Signals">
          {hud.signalCards.filter(Boolean).map((c) => (
            <div
              key={c!.id}
              className="signal-slot"
              data-signal-slot="1"
              title={`${c!.name}. ${c!.blurb}`}
            >
              <span className="signal-slot-job">{c!.blurb}</span>
            </div>
          ))}
        </div>
      )}
      <div className="hud-actions">
        {hud.phase === "combat" && (
          <button
            type="button"
            onClick={() => onAction({ type: "pause" })}
            className="grid h-10 w-10 place-items-center rounded-md border border-line text-paper"
            aria-label={hud.paused ? "Resume" : "Pause"}
          >
            {hud.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
        )}
        {playing && (
          <button
            type="button"
            onClick={() => onAction({ type: "speed" })}
            className="h-10 min-w-10 rounded-md border border-line px-2 text-[12px] font-medium text-paper"
          >
            {hud.speed}×
          </button>
        )}
        <button
          type="button"
          onClick={() => onAction({ type: "mute" })}
          className="grid h-10 w-10 place-items-center rounded-md border border-line text-paper"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => onAction({ type: "help" })}
          className="h-10 rounded-md border border-line px-2.5 text-[12px] font-medium text-paper"
        >
          More
        </button>
        {hud.phase === "placement" && (
          <button
            type="button"
            onClick={() => onAction({ type: "startWave" })}
            className="card-bevel h-10 rounded-md bg-ember px-3 text-[13px] font-medium text-ink"
          >
            Defend
          </button>
        )}
        {hud.phase === "shop" && (
          <button
            type="button"
            onClick={() => onAction({ type: "shopContinue" })}
            className="card-bevel h-10 rounded-md bg-ember px-3 text-[13px] font-medium text-ink"
          >
            Next round
          </button>
        )}
      </div>
    </div>
  );
}

export function HudOverlays({
  hud,
  onAction,
}: {
  hud: HudState;
  onAction: (a: Action) => void;
}) {
  const showPlay = hud.phase === "placement" || hud.phase === "combat";
  const showPick = showPlay || hud.phase === "shop";
  if (!showPick) return null;

  const plantedGun =
    hud.phase === "combat" &&
    hud.selectedItem?.card.kind === "tower" &&
    !!hud.selectedItem.placedPad &&
    hud.selectedItem.placedPad !== HOME_PAD;

  return (
    <>
      {plantedGun && hud.selectedItem && (
        <GunTree
          gun={hud.selectedItem}
          credit={hud.points}
          onBuy={(id) => onAction({ type: "upgrade", uid: hud.selectedItem!.uid, tune: id })}
          onClose={() => onAction({ type: "selectCard", uid: null })}
        />
      )}
      {!plantedGun && hud.inspect && hud.inspect.kind === "craft" && (
        <InspectPanel info={hud.inspect} onAction={onAction} />
      )}
      {showPlay && hud.announce && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2">
          <div className="rounded-md border border-accent/40 bg-ink/85 px-4 py-2 text-center">
            <p className="text-[10px] tracking-[0.18em] text-accent">
              {hud.announce.startsWith("Wave")
                ? "Next wave"
                : hud.announce.startsWith("+")
                  ? "Credit"
                  : /froze|popped|cut |lined |jumped|swept|got /.test(hud.announce)
                    ? "That wave"
                    : /held|flying/i.test(hud.announce)
                      ? "Arena"
                      : "Lane"}
            </p>
            <p
              className={cn(
                "mt-0.5 max-w-[18rem] font-display font-bold tracking-wide text-paper",
                hud.announce.length > 28 ? "text-lg" : "text-2xl",
              )}
            >
              {hud.announce}
            </p>
          </div>
        </div>
      )}
      {hud.phase === "placement" && (
        <div
          className={cn(
            "pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 rounded-md border border-frost/40 bg-ink/90 px-3 py-1 text-center text-[12px] text-paper",
            hud.announce ? "top-20" : "top-3",
          )}
        >
          {hud.canStart ? "Guns are down. Hit Defend." : "Tap a glowing moon. Keep Home."}
        </div>
      )}

      {hud.phase === "combat" && hud.paused && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink/50">
          <div className="rounded-lg border border-line bg-surface px-8 py-6 text-center">
            <p className="font-display text-2xl font-bold text-paper">Paused</p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onAction({ type: "pause" })}
                className="card-bevel h-10 rounded-md bg-ember px-5 text-sm font-medium text-ink"
              >
                Resume
              </button>
              <button
                type="button"
                onClick={() => onAction({ type: "title" })}
                className="card-bevel h-10 rounded-md border border-line px-5 text-sm font-medium text-paper"
              >
                Title
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ClimbMeter({
  xp,
  xpNext,
  pending,
  bay,
  pack,
  crew,
  say,
}: {
  xp: number;
  xpNext: number;
  pending: boolean;
  bay: number;
  pack: number;
  crew: number;
  say: string | null;
}) {
  const pct = xpNext > 0 ? Math.max(0, Math.min(1, xp / xpNext)) : 0;
  return (
    <div className={cn("hud-bonus min-w-0", pending && "climb-ready")}>
      <p className="text-[9px] font-medium tracking-[0.16em] text-frost">Bonus</p>
      <div className="climb-bar-live mt-0.5">
        <span style={{ width: `${Math.round(pct * 100)}%` }} />
      </div>
      <div className="rank-pipe mt-0.5" aria-hidden>
        <i className={cn("rank-tick", bay > 0 && "on")} />
        <i className={cn("rank-tick", pack > 0 && "on")} />
        <i className={cn("rank-tick", crew > 0 && "on")} />
      </div>
      {say ? <p className="bonus-say">{say}</p> : null}
    </div>
  );
}

function CraftPips({ pips }: { pips: number }) {
  return (
    <span className="climb-branch">
      {[0, 1, 2].map((i) => (
        <i key={i} className={cn("climb-pip", i < pips && "on")} />
      ))}
    </span>
  );
}

function StatGlow({
  label,
  value,
  glow,
}: {
  label: string;
  value: string | number;
  glow?: "gold" | "frost" | "ember" | "sage" | "accent";
}) {
  return (
    <div>
      <p className="text-[10px] font-medium tracking-[0.22em] text-muted">{label}</p>
      <p
        className={cn(
          "font-display text-2xl font-bold tabular leading-none",
          glow === "gold" && "num-glow-gold",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function gemOf(r: string | undefined): Rarity {
  if (r === "legendary" || r === "epic" || r === "rare" || r === "uncommon" || r === "common") return r;
  return "common";
}

function SpecialPickPanel({
  pick,
  onAction,
}: {
  pick: SpecialPickHud;
  onAction: (a: Action) => void;
}) {
  return (
    <div className="level-pick-veil pointer-events-auto absolute inset-0 z-40 flex items-end justify-center bg-ink/70 p-3 sm:items-center">
      <div className="level-pick glass-panel relative w-full max-w-xl overflow-hidden rounded-xl p-3">
        <span className="cyber-frame">
          <span className="cyber-corner cyber-tl" />
          <span className="cyber-corner cyber-tr" />
          <span className="cyber-corner cyber-bl" />
          <span className="cyber-corner cyber-br" />
        </span>
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="min-w-0">
            <p className="text-[10px] font-medium tracking-[0.22em] text-frost">
              {pick.lane === "part" ? "Part" : "Level-up"}
            </p>
            <p className="truncate font-display text-2xl font-bold text-paper">{pick.name}</p>
          </div>
          <button
            type="button"
            onClick={() => onAction({ type: "selectCard", uid: null })}
            className="h-10 shrink-0 rounded-md border border-line px-3 text-[12px] text-paper"
          >
            Later
          </button>
        </div>
        <div
          className="title-pips level-pick-pips mt-2"
          data-gem={gemOf(pick.options[0]?.rarity)}
          aria-hidden
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <i key={i} style={{ animationDelay: `${(i % 6) * 120}ms` }} />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {pick.options.map((o, i) => (
            <button
              key={o.id}
              type="button"
              onClick={() => onAction({ type: "special", uid: pick.uid, id: o.id })}
              className={cn(
                "card-bevel gem-pick gem-pick-lg flex min-h-28 flex-col items-start rounded-md border bg-raised px-2.5 py-2 text-left",
                gemOf(o.rarity) === "legendary"
                  ? "border-citrine/60 gem-pick-legend"
                  : gemOf(o.rarity) === "rare"
                    ? "border-ruby/50"
                    : gemOf(o.rarity) === "epic"
                      ? "border-accent/50"
                      : "border-frost/40",
              )}
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <span
                className={cn(
                  "text-[10px] font-medium tracking-[0.18em]",
                  gemOf(o.rarity) === "legendary"
                    ? "text-citrine"
                    : gemOf(o.rarity) === "rare"
                      ? "text-ruby"
                      : gemOf(o.rarity) === "epic"
                        ? "text-accent"
                        : "text-frost",
                )}
              >
                {pick.lane === "part" ? rarityGem(gemOf(o.rarity)) || "Moonstone" : "Special"}
              </span>
              <span className="mt-1 font-display text-xl font-bold leading-none text-paper">{o.name}</span>
              <span className="mt-1.5 text-[12px] leading-snug text-muted">{o.blurb}</span>
              {o.pair ? <span className="mt-auto pt-2 text-[10px] tracking-wide text-frost">{o.pair}</span> : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function InspectPanel({
  info,
  onAction,
}: {
  info: InspectHud;
  onAction: (a: Action) => void;
}) {
  return (
    <div className="inspect-card pointer-events-auto absolute right-3 top-3 z-30 w-[min(100%-1.5rem,16.5rem)] rounded-md border border-line bg-ink/95 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate font-display text-[15px] font-bold text-paper">{info.name}</p>
        <button
          type="button"
          onClick={() => onAction({ type: "selectCard", uid: null })}
          className="h-8 shrink-0 rounded-md border border-line px-2 text-[11px] text-paper"
        >
          Close
        </button>
      </div>
      <p className="mt-1 text-[11px] tracking-wide text-frost">Level {fmtCount(info.level)}</p>
      <p className="mt-1.5 text-[10px] tracking-[0.18em] text-faint">First</p>
      <p className="text-[12px] text-muted">{info.base}</p>
      <p className="mt-1 text-[10px] tracking-[0.18em] text-frost">Now</p>
      <p className="text-[12px] text-paper">{info.now}</p>
      <dl className="mt-2 grid grid-cols-2 gap-1.5 text-[12px]">
        <div>
          <dt className="text-[10px] tracking-wide text-faint">Stopped</dt>
          <dd className="font-display text-lg font-bold tabular">{fmtCount(info.kills)}</dd>
        </div>
        {info.kind === "gun" ? (
          <div>
            <dt className="text-[10px] tracking-wide text-faint">Shots</dt>
            <dd className="font-display text-lg font-bold tabular">{fmtCount(info.shots)}</dd>
          </div>
        ) : (
          <div>
            <dt className="text-[10px] tracking-wide text-faint">Grenades</dt>
            <dd className="font-display text-lg font-bold tabular">{fmtCount(info.saves)}</dd>
          </div>
        )}
        {info.kind === "craft" ? (
          <>
            <div>
              <dt className="text-[10px] tracking-wide text-faint">Healed</dt>
              <dd className="font-display text-lg font-bold tabular">{fmtCount(info.heals)}</dd>
            </div>
            <div>
              <dt className="text-[10px] tracking-wide text-faint">Hull</dt>
              <dd className="font-display text-lg font-bold tabular">
                {fmtCount(info.hull)}/{fmtCount(info.hullMax)}
              </dd>
            </div>
          </>
        ) : info.heals > 0 ? (
          <div>
            <dt className="text-[10px] tracking-wide text-faint">Healed</dt>
            <dd className="font-display text-lg font-bold tabular">{fmtCount(info.heals)}</dd>
          </div>
        ) : null}
      </dl>
      {info.specials.length ? (
        <p className="mt-1.5 text-[11px] text-muted">Specials · {info.specials.join(" · ")}</p>
      ) : null}
      {info.parts.length ? (
        <p className="mt-0.5 text-[11px] text-steel">Parts · {info.parts.join(" · ")}</p>
      ) : null}
    </div>
  );
}

export function CraftBanner({
  hud,
  onAction,
}: {
  hud: HudState;
  onAction: (a: Action) => void;
}) {
  if (hud.phase !== "placement" && hud.phase !== "combat" && hud.phase !== "shop") return null;
  const towers = hud.roster.filter((r) => r.card.kind === "tower");
  const gunsDown = towers.length > 0 && towers.every((r) => !!r.placedPad);
  if (gunsDown && (hud.phase === "placement" || hud.phase === "combat")) return null;
  const crafts = hud.crafts ?? [];
  return (
    <div className="play-craft craft-dock relative z-10 shrink-0 border-b border-line bg-ink/95">
      <div className="flex items-center gap-2 px-3 pt-1">
        <p className="min-w-0 flex-1 truncate text-[11px] font-medium tracking-wide text-steel">
          {crafts.length ? `Crafts ${crafts.filter((c) => c.flying).length}/${crafts.length}` : "Crafts fly here."}
        </p>
      </div>
      <div className="mt-0.5 flex gap-1 overflow-x-auto px-3 pb-1">
        {crafts.length === 0 && <p className="py-1 text-[12px] text-muted">No crafts yet.</p>}
        {crafts.map((c) => {
          const isSelected = hud.selectedCard === c.uid;
          const ready = (c.specialOffer ?? []).length > 0 || (c.partOffer ?? []).length > 0;
          const hp = Math.max(0, Math.min(1, c.hp / Math.max(1, c.hpMax)));
          return (
            <button
              key={c.uid}
              type="button"
              title={ready ? `${c.name} · Level-up` : c.name}
              onClick={() => onAction({ type: "selectCard", uid: isSelected && !ready ? null : c.uid })}
              className={cn("craft-chip", isSelected && "craft-chip-on", ready && "craft-chip-ready")}
            >
              <CraftPortrait id={c.art} className="h-7 w-7" />
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-[11px] font-medium text-paper">
                  {c.name}
                  {c.runLevel > 1 ? ` · L${c.runLevel}` : ""}
                </span>
                <span className="craft-hp mt-0.5 block" aria-hidden>
                  <i style={{ width: `${Math.round(hp * 100)}%` }} />
                </span>
              </span>
              {ready ? <span className="level-chip">Level-up</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

void ChartNoAxesColumn;
void StatGlow;
void CraftPips;
