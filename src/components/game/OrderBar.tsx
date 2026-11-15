import type { Action } from "@/game/runtime";
import type { HudState } from "@/game/store";
import type { OrderId } from "@/game/data/orders";
import { cn } from "@/lib/utils";
import { Snowflake, Zap, ArrowDownToLine, Undo2 } from "lucide-react";

const ICON: Record<OrderId, typeof Snowflake> = {
  stasis: Snowflake,
  lance: ArrowDownToLine,
  surge: Zap,
  recall: Undo2,
};

const R = 30;
const C = 2 * Math.PI * R;

/**
 * Orders: two round neon buttons bottom-right of the board, above the roster dock.
 * Each ring fills toward that Order's cost from the shared Energy; the lockout sweeps over both.
 * Tap (or 1 / 2) to arm, then tap the lane (or a gun for Surge). Escape or a miss disarms.
 */
export function OrderBar({ hud, onAction }: { hud: HudState; onAction: (a: Action) => void }) {
  const o = hud.orders;
  if (!o?.on || hud.phase !== "combat") return null;
  const armed = o.armed >= 0 ? o.slots[o.armed] : null;
  const lockK = o.lockMax > 0 ? Math.min(1, o.lock / o.lockMax) : 0;
  return (
    <div className="order-bar" data-orders="1">
      {armed && (
        <p className="order-hint" style={{ color: armed.color }}>
          {armed.target === "gun" ? "Tap a gun" : "Tap the lane"}
        </p>
      )}
      <div className="order-row">
        <p className="order-energy tabular" title="Energy. Refills from kills, reactions and time. Resets to 40 each wave.">
          <Zap className="h-3 w-3" aria-hidden />
          {o.energy}
        </p>
        {o.slots.map((s, i) => {
          const Icon = ICON[s.id];
          const fill = Math.max(0, Math.min(1, o.energy / s.cost));
          const ready = !s.block;
          const isArmed = o.armed === i;
          const dim = !ready && !isArmed;
          return (
            <button
              key={s.id}
              type="button"
              data-order={s.id}
              aria-label={`${s.name}, ${s.cost} energy`}
              aria-pressed={isArmed}
              title={`${s.name} · ${s.cost} · key ${i + 1}\n${s.blurb}`}
              onClick={() => onAction({ type: "armOrder", slot: i })}
              className={cn("order-btn", isArmed && "order-btn-armed", dim && "order-btn-dim")}
              style={{ ["--oc" as string]: s.color }}
            >
              <svg className="order-ring" viewBox="0 0 68 68" aria-hidden>
                <circle cx="34" cy="34" r={R} className="order-ring-bg" />
                <circle
                  cx="34"
                  cy="34"
                  r={R}
                  className="order-ring-fill"
                  strokeDasharray={`${C * fill} ${C}`}
                  transform="rotate(-90 34 34)"
                />
                {lockK > 0 && (
                  <circle
                    cx="34"
                    cy="34"
                    r={R - 7}
                    className="order-ring-lock"
                    strokeDasharray={`${2 * Math.PI * (R - 7) * lockK} ${C}`}
                    transform="rotate(-90 34 34)"
                  />
                )}
              </svg>
              <Icon className="order-icon" aria-hidden />
              <span className="order-cost tabular">{s.cost}</span>
              <span className="order-key" aria-hidden>
                {i + 1}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Run Level 3: pick the second Order. Non-modal; the wave keeps running. */
export function OrderPick({ hud, onAction }: { hud: HudState; onAction: (a: Action) => void }) {
  const o = hud.orders;
  if (!o?.on || !o.offer.length) return null;
  if (hud.phase !== "combat" && hud.phase !== "placement") return null;
  return (
    <div className="order-pick neon-panel" data-order-pick="1">
      <p className="neon-kicker">Level {hud.runLevel} · New Order</p>
      <p className="mt-0.5 text-[12px] text-steel">Pick one for slot 2. It stays all run.</p>
      <div className="mt-2 flex flex-col gap-1.5">
        {o.offer.map((d) => {
          const Icon = ICON[d.id];
          return (
            <button
              key={d.id}
              type="button"
              data-pick-order={d.id}
              onClick={() => onAction({ type: "pickOrder", id: d.id })}
              className="order-pick-opt"
              style={{ ["--oc" as string]: d.color }}
            >
              <Icon className="h-5 w-5 shrink-0" style={{ color: d.color }} aria-hidden />
              <span className="min-w-0 flex-1 text-left">
                <span className="block text-[13px] font-semibold text-paper">
                  {d.name} <span className="font-normal text-steel">· {d.cost}</span>
                </span>
                <span className="block text-[11px] leading-snug text-muted">{d.blurb}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
