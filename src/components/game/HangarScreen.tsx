import { SKINS } from "@/game/data/skins";
import { SKIN_FLUX } from "@/game/data/hangar";
import { VAULT, VAULT_BRANCH, vaultCanBuy, vaultHas, vaultOf, type VaultBranch } from "@/game/data/vault";
import { fmtCount, fmtFlux } from "@/game/format";
import type { MetaSave, SkinId } from "@/game/types";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function HangarScreen({
  best,
  onEquip,
  onBuy,
  onBuySkin,
  onClose,
}: {
  best: MetaSave;
  onEquip: (id: SkinId) => void;
  onBuy: (id: string) => void;
  onBuySkin: (id: SkinId) => void;
  onClose: () => void;
}) {
  const kills = Object.values(best.gunKills ?? {}).reduce((s, n) => s + n, 0);
  const progress = {
    kills,
    leakless: best.leakless ?? 0,
    runs: best.runs,
    bestWave: best.bestWave,
  };
  const vault = vaultOf(best.vault);
  const flux = best.flux ?? 0;
  const [flash, setFlash] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const buy = (id: string, cost: number, locked: boolean, owned: boolean, prior?: string) => {
    if (owned) {
      setNote("Already owned.");
      return;
    }
    if (locked) {
      setNote(prior ? `Buy ${prior} first.` : "Locked.");
      return;
    }
    if (flux < cost) {
      setNote(`Need ${fmtCount(cost - flux)} more Credit. Win a few more runs.`);
      return;
    }
    setNote(null);
    setFlash(id);
    onBuy(id);
    window.setTimeout(() => setFlash(null), 180);
  };

  return (
    <div
      className="vault-stage"
      role="dialog"
      aria-label="Vault"
      onClick={onClose}
    >
      <div className="vault-lasers" aria-hidden>
        <span className="vault-beam vault-beam-a" />
        <span className="vault-beam vault-beam-b" />
        <span className="vault-beam vault-beam-c" />
        <span className="vault-beam vault-beam-d" />
        <span className="vault-fog" />
      </div>
      <div
        className="vault-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="vault-head">
          <div className="min-w-0">
            <p className="text-[11px] font-medium tracking-[0.28em] text-epic">VAULT</p>
            <h2 className="mt-0.5 font-display text-2xl font-bold tracking-wide text-paper">What you saved</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] font-medium tracking-[0.22em] text-epic">Credit</p>
              <p className="vault-credit font-display text-3xl font-bold tabular leading-none">{fmtCount(flux)}</p>
            </div>
            <button type="button" onClick={onClose} className="ui-btn ui-btn-primary card-bevel h-11 shrink-0 px-4">
              Close
            </button>
          </div>
        </div>
        <p className="vault-lead">
          {flux < 240
            ? "Win a few runs. Credit banks after each round. Then spend it here."
            : "Between runs, stock the post."}
        </p>
        {note ? <p className="vault-note">{note}</p> : null}

        <div className="vault-body">
          <div className="vault-racks">
            {(Object.keys(VAULT) as VaultBranch[]).map((branch) => (
              <div key={branch} className="vault-rack" data-branch={branch}>
                <p className="vault-rack-name">{VAULT_BRANCH[branch].name}</p>
                <p className="vault-rack-line">{VAULT_BRANCH[branch].line}</p>
                <ul className="mt-2 space-y-1.5">
                  {VAULT[branch].map((node) => {
                    const owned = vaultHas(vault, node.id);
                    const locked = !owned && !vaultCanBuy(vault, node.id);
                    const can = !owned && !locked && flux >= node.cost;
                    const prior = VAULT[branch].find((x) => x.rank === node.rank - 1);
                    return (
                      <li key={node.id}>
                        <button
                          type="button"
                          onClick={() => buy(node.id, node.cost, locked, owned, prior?.name)}
                          className={cn(
                            "vault-node",
                            owned && "is-owned",
                            can && "is-afford",
                            locked && "is-locked",
                            !owned && !locked && !can && "is-need",
                            flash === node.id && "vault-buy-flash",
                          )}
                        >
                          <span className="vault-pips" aria-hidden>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <i key={i} className={cn(i < node.rank && "on")} />
                            ))}
                          </span>
                          <span className="min-w-0 flex-1 text-left">
                            <span className="flex items-baseline justify-between gap-2">
                              <span className="font-display text-[15px] font-bold text-paper">{node.name}</span>
                              <span className="text-[11px] text-faint">
                                {owned
                                  ? "Owned"
                                  : locked
                                    ? "Locked"
                                    : can
                                      ? fmtFlux(node.cost)
                                      : `Need ${fmtCount(node.cost - flux)} more`}
                              </span>
                            </span>
                            <span className="block text-[12px] text-muted">{node.blurb}</span>
                            {locked && prior ? (
                              <span className="mt-0.5 block text-[11px] text-steel">Buy {prior.name} first</span>
                            ) : null}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          <p className="mt-6 text-[10px] font-medium tracking-[0.18em] text-steel">Gun finish</p>
          <p className="mt-1 text-[12px] text-muted">One finish on every gun. Play to unlock, or pay a lot of credits.</p>
          <ul className="mt-2 space-y-2">
            {SKINS.map((s) => {
              const open = best.unlocked.includes(s.id);
              const on = best.equipped === s.id;
              const p = s.progress(progress);
              const pct = Math.min(100, Math.round((p.n / Math.max(1, p.of)) * 100));
              const price = SKIN_FLUX[s.id];
              const canBuy = !open && !!price && flux >= price;
              return (
                <li key={s.id}>
                  <div
                    className={cn(
                      "card-bevel flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left",
                      on ? "border-ember bg-raised" : "border-line bg-surface",
                      !open && "opacity-80",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => open && onEquip(s.id)}
                      disabled={!open}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <span
                        className="h-8 w-8 shrink-0 rounded-sm border"
                        style={{ background: s.glow, borderColor: s.stroke, boxShadow: `0 0 12px ${s.glow}` }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="font-display text-[16px] font-bold text-paper">{s.name}</span>
                          <span className="text-[11px] text-faint">{open ? (on ? "Equipped" : "Ready") : s.unlock}</span>
                        </span>
                        <span className="block text-[12px] text-muted">{s.blurb}</span>
                        {!open && (
                          <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-raised">
                            <span className="block h-full bg-frost" style={{ width: `${pct}%` }} />
                          </span>
                        )}
                      </span>
                    </button>
                    {!open && price ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (!canBuy) {
                            setNote(`Need ${fmtCount(price - flux)} more Credit for ${s.name}.`);
                            return;
                          }
                          onBuySkin(s.id);
                        }}
                        className="card-bevel shrink-0 rounded-md border border-line px-2.5 py-1.5 text-[11px] font-medium text-paper"
                      >
                        {fmtFlux(price)}
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
