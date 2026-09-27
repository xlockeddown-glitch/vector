import { useMemo, useState } from "react";
import { SKILL_TREES, type SkillTree, type TreeBranch } from "@/game/data/skill-trees";
import { cn } from "@/lib/utils";

type RankMap = Record<string, number>;

function startedOf(ranks: RankMap): string[] {
  return Object.entries(ranks)
    .filter(([, n]) => n > 0)
    .map(([id]) => id);
}

function takenCount(ranks: RankMap): number {
  return Object.values(ranks).reduce((s, n) => s + n, 0);
}

function canTake(tree: SkillTree, ranks: RankMap, branch: TreeBranch, rank: number): boolean {
  const have = ranks[branch.id] ?? 0;
  if (rank !== have + 1) return false;
  if (takenCount(ranks) >= tree.picks) return false;
  const started = startedOf(ranks);
  if (have === 0 && started.length >= tree.branchesMax && !started.includes(branch.id)) return false;
  return true;
}

function walkLine(tree: SkillTree, ranks: RankMap): string {
  const bits = tree.branches
    .map((b) => {
      const n = ranks[b.id] ?? 0;
      if (!n) return null;
      const node = b.nodes[n - 1];
      return `${b.name} ${n}${node?.cap ? " · cap" : ""}`;
    })
    .filter(Boolean);
  if (!bits.length) return "Tap a start. Walk two lines.";
  const left = tree.picks - takenCount(ranks);
  return left > 0 ? `${bits.join(" · ")} · ${left} pick${left === 1 ? "" : "s"} left` : bits.join(" · ");
}

export function TreeBoard({ onClose }: { onClose: () => void }) {
  const [id, setId] = useState(SKILL_TREES[0]!.id);
  const [ranks, setRanks] = useState<RankMap>({});
  const tree = useMemo(() => SKILL_TREES.find((t) => t.id === id) ?? SKILL_TREES[0]!, [id]);

  const pick = (branch: TreeBranch, rank: number) => {
    if (!canTake(tree, ranks, branch, rank)) return;
    setRanks((r) => ({ ...r, [branch.id]: rank }));
  };

  const switchTree = (next: string) => {
    setId(next);
    setRanks({});
  };

  return (
    <div className="tree-stage" role="dialog" aria-label="Skill trees" onClick={onClose}>
      <div className="tree-panel" onClick={(e) => e.stopPropagation()}>
        <header className="tree-head">
          <div>
            <p className="text-[11px] font-medium tracking-[0.18em] text-frost">Skill trees</p>
            <h2 className="font-display text-2xl font-bold tracking-wide text-paper sm:text-3xl">{tree.name}</h2>
            <p className="mt-1 text-[13px] text-muted">{tree.job}</p>
          </div>
          <button type="button" className="ui-btn ui-btn-ghost" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="tree-tabs" role="tablist">
          {SKILL_TREES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={t.id === tree.id}
              className={cn("tree-tab", t.id === tree.id && "is-on", t.kind === "craft" && "is-craft")}
              onClick={() => switchTree(t.id)}
            >
              <span className="tree-tab-kicker">{t.kind === "gun" ? "Gun" : "Craft"}</span>
              {t.name}
            </button>
          ))}
        </div>

        <p className="tree-walk">{walkLine(tree, ranks)}</p>

        <div className="tree-grid" data-kind={tree.kind}>
          {tree.branches.map((b) => {
            const have = ranks[b.id] ?? 0;
            return (
              <div key={b.id} className={cn("tree-col", have > 0 && "is-live")}>
                <p className="tree-col-name">{b.name}</p>
                <p className="tree-col-job">{b.job}</p>
                <ol className="tree-rungs">
                  {b.nodes.map((n, i) => {
                    const rank = i + 1;
                    const on = have >= rank;
                    const open = canTake(tree, ranks, b, rank);
                    return (
                      <li key={n.id}>
                        <button
                          type="button"
                          disabled={!on && !open}
                          className={cn(
                            "tree-node",
                            on && "is-on",
                            open && "is-open",
                            n.cap && "is-cap",
                          )}
                          onClick={() => pick(b, rank)}
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

        <footer className="tree-foot">
          <p className="text-[12px] text-steel">
            {tree.kind === "gun"
              ? "A gun walks two lines. Five picks. Caps are tricks, not percents."
              : "A craft takes three nodes. You can dip a second line."}
          </p>
          <button type="button" className="ui-btn ui-btn-ghost" onClick={() => setRanks({})}>
            Clear path
          </button>
        </footer>
      </div>
    </div>
  );
}
