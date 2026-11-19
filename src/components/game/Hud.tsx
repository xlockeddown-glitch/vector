import type { Action } from "@/game/runtime";
import type { HudState, InspectHud } from "@/game/store";
import { fmtCount } from "@/game/format";
import { cn } from "@/lib/utils";
import { HOME_PAD } from "@/game/constants";
import { Pause, Play, Volume2, VolumeX, ChartNoAxesColumn } from "lucide-react";
import { CraftPortrait } from "./CardView";
import { CraftTree, GunTree } from "./GunTree";
import { OrderBar, OrderPick } from "./OrderBar";

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
        <p className="hud-kicker text-legend">Credit</p>
        <p className="hud-value num-glow-gold">{fmtCount(hud.points)}</p>
      </div>
      <div className="hud-stat">
        <p className="hud-kicker text-frost">Lives</p>
        <p className="hud-value">{fmtCount(hud.lives)}</p>
      </div>
      <div className="hud-stat">
        <p className="hud-kicker text-steel">
          {hud.campaign ? <span className="hud-stage" title={hud.campaign.name}>{hud.campaign.label}</span> : "Wave"}
        </p>
        <p className="hud-value">
          {hud.endless ? fmtCount(hud.wavesCleared) : `${fmtCount(hud.wavesCleared)}/${hud.winWaves}`}
        </p>
        {playing && (
          <LevelMeter
            level={hud.runLevel}
            xp={hud.xp}
            xpNext={hud.xpNext}
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
            className="hud-btn hud-btn-icon"
            aria-label={hud.paused ? "Resume" : "Pause"}
          >
            {hud.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
        )}
        {playing && (
          <button
            type="button"
            onClick={() => onAction({ type: "speed" })}
            className="hud-btn tabular"
          >
            {hud.speed}×
          </button>
        )}
        <button
          type="button"
          onClick={() => onAction({ type: "mute" })}
          className="hud-btn hud-btn-icon"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => onAction({ type: "help" })}
          className="hud-btn"
        >
          More
        </button>
        {hud.phase === "placement" && (
          <button
            type="button"
            onClick={() => onAction({ type: "startWave" })}
            className="hud-btn hud-btn-go"
          >
            Defend
          </button>
        )}
        {hud.phase === "shop" && (
          <button
            type="button"
            onClick={() => onAction({ type: "shopContinue" })}
            className="hud-btn hud-btn-go"
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
          onInfuse={(el) => onAction({ type: "infuse", uid: hud.selectedItem!.uid, el })}
          onClose={() => onAction({ type: "selectCard", uid: null })}
        />
      )}
      {!plantedGun && hud.selectedCraft && (
        <CraftTree
          craft={hud.selectedCraft}
          credit={hud.points}
          onBuy={(id) => onAction({ type: "upgradeCraft", uid: hud.selectedCraft!.uid, node: id })}
          onClose={() => onAction({ type: "selectCard", uid: null })}
        />
      )}
      {!plantedGun && !hud.selectedCraft && hud.inspect && hud.inspect.kind === "craft" && (
        <InspectPanel info={hud.inspect} onAction={onAction} />
      )}
      {showPlay && !plantedGun && !hud.selectedCraft && <OrderBar hud={hud} onAction={onAction} />}
      {showPlay && !plantedGun && !hud.selectedCraft && <OrderPick hud={hud} onAction={onAction} />}
      {showPlay && hud.announce && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2">
          <div className="neon-toast px-4 py-2 text-center">
            <p className="neon-kicker">
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
            "neon-toast pointer-events-none absolute left-1/2 z-20 w-max max-w-[calc(100%-1.5rem)] -translate-x-1/2 px-3 py-1.5 text-center text-[13px] text-paper",
            hud.announce ? "top-20" : "top-3",
          )}
        >
          {hud.canStart ? "Guns are down. Hit Defend." : "Tap a glowing moon. Keep Home."}
        </div>
      )}

      {hud.phase === "combat" && hud.paused && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink/60">
          <div className="neon-panel min-w-56 px-8 py-6 text-center">
            <p className="font-display text-2xl font-bold text-paper">Paused</p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onAction({ type: "pause" })}
                className="neon-btn neon-btn-go"
              >
                Resume
              </button>
              <button
                type="button"
                onClick={() => onAction({ type: "title" })}
                className="neon-btn"
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

function LevelMeter({
  level,
  xp,
  xpNext,
  say,
}: {
  level: number;
  xp: number;
  xpNext: number;
  say: string | null;
}) {
  const pct = xpNext > 0 ? Math.max(0, Math.min(1, xp / xpNext)) : 0;
  return (
    <div className="hud-bonus min-w-0" title="Kills fill this bar. Each level pays Credit.">
      <p className="text-[10px] font-medium tracking-[0.14em] text-frost">Level {fmtCount(level)}</p>
      <div className="level-bar-live mt-0.5">
        <span style={{ width: `${Math.round(pct * 100)}%` }} />
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

function InspectPanel({
  info,
  onAction,
}: {
  info: InspectHud;
  onAction: (a: Action) => void;
}) {
  return (
    <div className="inspect-card neon-panel pointer-events-auto absolute right-3 top-3 z-30 w-[min(100%-1.5rem,16.5rem)] p-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate font-display text-[15px] font-bold text-paper">{info.name}</p>
        <button
          type="button"
          onClick={() => onAction({ type: "selectCard", uid: null })}
          className="hud-btn shrink-0"
        >
          Close
        </button>
      </div>
      <p className="mt-1 text-[11px] tracking-wide text-frost">Level {fmtCount(info.level)}</p>
      <p className="mt-1.5 text-[11px] tracking-[0.18em] text-steel">First</p>
      <p className="text-[12px] text-steel">{info.base}</p>
      <p className="mt-1 text-[11px] tracking-[0.18em] text-frost">Now</p>
      <p className="text-[12px] text-paper">{info.now}</p>
      <dl className="mt-2 grid grid-cols-2 gap-1.5 text-[12px]">
        <div>
          <dt className="text-[11px] tracking-wide text-steel">Stopped</dt>
          <dd className="font-display text-lg font-bold tabular">{fmtCount(info.kills)}</dd>
        </div>
        {info.kind === "gun" ? (
          <div>
            <dt className="text-[11px] tracking-wide text-steel">Shots</dt>
            <dd className="font-display text-lg font-bold tabular">{fmtCount(info.shots)}</dd>
          </div>
        ) : (
          <div>
            <dt className="text-[11px] tracking-wide text-steel">Grenades</dt>
            <dd className="font-display text-lg font-bold tabular">{fmtCount(info.saves)}</dd>
          </div>
        )}
        {info.kind === "craft" ? (
          <>
            <div>
              <dt className="text-[11px] tracking-wide text-steel">Healed</dt>
              <dd className="font-display text-lg font-bold tabular">{fmtCount(info.heals)}</dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-wide text-steel">Hull</dt>
              <dd className="font-display text-lg font-bold tabular">
                {fmtCount(info.hull)}/{fmtCount(info.hullMax)}
              </dd>
            </div>
          </>
        ) : info.heals > 0 ? (
          <div>
            <dt className="text-[11px] tracking-wide text-steel">Healed</dt>
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
