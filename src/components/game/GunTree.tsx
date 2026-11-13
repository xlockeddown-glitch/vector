import { useEffect, type ReactNode } from "react";
import { ELEMENTS, infuseChoices, type ElementId } from "@/game/data/elements";
import { offerJobs, rankInBranch, startedBranches, treeOf } from "@/game/data/gun-tree";
import {
  CRAFT_BRANCHES_MAX,
  craftPicksLeft,
  craftRankInBranch,
  craftStartedBranches,
  craftTreeOf,
  craftUpgradeCost,
  offerCraftJobs,
} from "@/game/data/craft-tree";
import { upgradeCost } from "@/game/data/cards";
import { PARAMS } from "@/game/params";
import type { CardDef, RosterItem } from "@/game/types";
import { cn } from "@/lib/utils";
import { copiesToNext, starLabel } from "@/game/data/merge";
import { fmtCount } from "@/game/format";

type TreeNodeView = { id: string; name: string; blurb: string; cap: boolean };
type TreeBranchView = { id: string; name: string; nodes: TreeNodeView[] };

/** Shared skill tree dialog. Guns and crafts use the same look and rules. */
function TreeModal({
  kicker,
  title,
  branches,
  rankOf,
  offer,
  started,
  branchesMax,
  left,
  fullLine,
  note,
  extra,
  cost,
  credit,
  onBuy,
  onClose,
}: {
  kicker: string;
  title: string;
  branches: TreeBranchView[];
  rankOf: (branchId: string) => number;
  offer: Set<string>;
  started: string[];
  branchesMax: number;
  left: number;
  fullLine: string;
  note?: string;
  extra?: ReactNode;
  cost: number;
  credit: number;
  onBuy: (id: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="gun-tree-scrim" onClick={onClose} role="presentation">
      <div
        className="gun-tree-live"
        role="dialog"
        aria-modal="true"
        aria-label={`${title} tree`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="gun-tree-head">
          <div className="min-w-0">
            <p className="gun-tree-kicker">{kicker}</p>
            <h2 className="gun-tree-title">{title}</h2>
            <p className="gun-tree-sub">
              {left > 0 ? `${left} pick${left === 1 ? "" : "s"} left · walk ${branchesMax} lines` : fullLine}
              {note ? ` · ${note}` : ""}
            </p>
          </div>
          <div className="gun-tree-actions">
            {left > 0 && (
              <span className={cn("tree-cost", credit < cost && "is-poor")} title="Next pick costs Credit">
                Credit {fmtCount(cost)}
              </span>
            )}
            <button type="button" className="ui-btn ui-btn-ghost gun-tree-close" onClick={onClose}>
              Close
            </button>
          </div>
        </header>
        <div className="gun-tree-grid">
          {branches.map((b) => {
            const have = rankOf(b.id);
            const locked = have === 0 && started.length >= branchesMax && !started.includes(b.id);
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
        {extra}
      </div>
    </div>
  );
}

/** One-time element infusion for a gun: Plasma, Cryo or Volt. */
function ElementRow({
  gun,
  credit,
  onInfuse,
}: {
  gun: RosterItem;
  credit: number;
  onInfuse: (el: ElementId) => void;
}) {
  const cost = PARAMS.infuseCost;
  const have = gun.infuse ?? null;
  const choices = infuseChoices(gun.card.set);
  return (
    <div className="tree-elements">
      <p className="tree-col-name">
        Element{" "}
        <span className="tree-elements-sub">
          {have ? `Infused · ${ELEMENTS[have].name}` : `One per gun · Credit ${fmtCount(cost)} · two elements on one enemy react`}
        </span>
      </p>
      <div className="tree-elements-row">
        {choices.map((el) => {
          const def = ELEMENTS[el];
          const on = have === el;
          const open = !have;
          const poor = open && credit < cost;
          return (
            <button
              key={el}
              type="button"
              disabled={!open || poor}
              title={def.blurb}
              style={{ ["--el" as string]: def.color }}
              className={cn("tree-node tree-element", on && "is-on", open && "is-open")}
              onClick={() => open && !poor && onInfuse(el)}
            >
              <span className="tree-node-copy">
                <span className="tree-node-name">
                  {def.name} · {def.word}
                </span>
                <span className="tree-node-blurb">{def.blurb}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function GunTree({
  gun,
  credit,
  onBuy,
  onInfuse,
  onClose,
}: {
  gun: RosterItem;
  credit: number;
  onBuy: (id: string) => void;
  onInfuse?: (el: ElementId) => void;
  onClose: () => void;
}) {
  const tree = treeOf(gun.card.stats?.role);
  if (!tree) return null;
  const used = (gun.jobs ?? []).length;
  return (
    <TreeModal
      kicker="Spend Credit on this gun"
      title={(gun.copies ?? 1) > 1 ? `${gun.card.name} ${starLabel(gun.copies)}` : gun.card.name}
      note={(() => {
        if ((gun.copies ?? 1) <= 1) return undefined;
        const next = copiesToNext(gun.copies);
        return next ? `Copies ${next.have}/${next.need} to ${"★".repeat(next.star)}` : "Max ★";
      })()}
      branches={tree.branches}
      rankOf={(id) => rankInBranch(gun, id)}
      offer={new Set(offerJobs(gun).map((n) => n.id))}
      started={startedBranches(gun)}
      branchesMax={PARAMS.jobBranchesMax}
      left={Math.max(0, (gun.jobSlots ?? PARAMS.jobSlotsStart) - used)}
      fullLine="This gun is full."
      extra={onInfuse ? <ElementRow gun={gun} credit={credit} onInfuse={onInfuse} /> : null}
      cost={upgradeCost(gun.card, used)}
      credit={credit}
      onBuy={onBuy}
      onClose={onClose}
    />
  );
}

export type CraftTreeTarget = { uid: string; card: CardDef & { templateId?: string }; jobs: string[]; hull?: number; hullMax?: number };

export function CraftTree({
  craft,
  credit,
  onBuy,
  onClose,
}: {
  craft: CraftTreeTarget;
  credit: number;
  onBuy: (id: string) => void;
  onClose: () => void;
}) {
  const tree = craftTreeOf(craft.card);
  return (
    <TreeModal
      kicker="Spend Credit on this craft"
      title={craft.card.name}
      branches={tree.branches}
      rankOf={(id) => craftRankInBranch(craft, id)}
      offer={new Set(offerCraftJobs(craft).map((n) => n.id))}
      started={craftStartedBranches(craft)}
      branchesMax={CRAFT_BRANCHES_MAX}
      left={craftPicksLeft(craft)}
      fullLine="This craft is full."
      note={craft.hullMax ? `Hull ${fmtCount(craft.hull ?? 0)}/${fmtCount(craft.hullMax)}` : undefined}
      cost={craftUpgradeCost(craft.jobs.length)}
      credit={credit}
      onBuy={onBuy}
      onClose={onClose}
    />
  );
}
