import { useEffect } from "react";
import { offerJobs, rankInBranch, startedBranches, treeOf } from "@/game/data/gun-tree";
import { upgradeCost } from "@/game/data/cards";
import type { RosterItem } from "@/game/types";
import { cn } from "@/lib/utils";
import { fmtCount } from "@/game/format";

export function GunTree({
  gun,
  credit,
  onBuy,
  onClose,
}: {
  gun: RosterItem;
  credit: number;
  onBuy: (id: string) => void;
  onClose: () => void;
}) {
  const tree = treeOf(gun.card.stats?.role);
  const cost = upgradeCost(gun.card, (gun.jobs ?? []).length);
  const offer = new Set(offerJobs(gun).map((n) => n.id));
  const started = startedBranches(gun);
  const left = Math.max(0, (gun.jobSlots ?? 5) - (gun.jobs ?? []).length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!tree) return null;

  return (
    <div className="gun-tree-scrim" onClick={onClose} role="presentation">
      <div
        className="gun-tree-live"
        role="dialog"
        aria-modal="true"
        aria-label={`${gun.card.name} tree`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="gun-tree-head">
          <div className="min-w-0">
            <p className="gun-tree-kicker">Spend Credit on this gun</p>
            <h2 className="gun-tree-title">{gun.card.name}</h2>
            <p className="gun-tree-sub">
              {left > 0 ? `${left} pick${left === 1 ? "" : "s"} left` : "This gun is full."}
            </p>
          </div>
          <div className="gun-tree-actions">
            <span className="tree-cost" title="Next pick costs Credit">
              Credit {fmtCount(cost)}
            </span>
            <button type="button" className="ui-btn ui-btn-ghost gun-tree-close" onClick={onClose}>
              Close
            </button>
          </div>
        </header>
        <div className="gun-tree-grid">
          {tree.branches.map((b) => {
            const have = rankInBranch(gun, b.id);
            const locked = have === 0 && started.length >= 2 && !started.includes(b.id);
            return (
              <div key={b.id} className={cn("tree-col", have > 0 && "is-live", locked && "is-locked")}>
                <p className="tree-col-name">{b.name}</p>
                <ol className="tree-rungs">
                  {b.nodes.map((n, i) => {
                    const rank = i + 1;
                    const on = have >= rank;
                    const open = !on && offer.has(n.id) && !locked;
                    const poor = open && credit < cost;
                    return (
                      <li key={n.id}>
                        <button
                          type="button"
                          disabled={!open || poor}
                          title={n.blurb}
                          className={cn("tree-node", on && "is-on", open && "is-open", n.cap && "is-cap")}
                          onClick={() => open && !poor && onBuy(n.id)}
                        >
                          <span className="tree-node-rank">{n.cap ? "Cap" : rank}</span>
                          <span className="tree-node-copy">
                            <span className="tree-node-name">{n.name}</span>
                            <span className="tree-node-blurb">{n.blurb}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
