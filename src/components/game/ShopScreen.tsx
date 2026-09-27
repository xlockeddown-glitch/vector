import { HOME_PAD } from "@/game/constants";
import { displayName } from "@/game/data/glossary";
import { specialOf } from "@/game/data/specials";
import type { Action } from "@/game/runtime";
import type { CraftHud, HudState } from "@/game/store";
import { fmtCount } from "@/game/format";
import { cn } from "@/lib/utils";

const GRADE_TONE: Record<string, string> = {
  S: "text-paper",
  A: "text-steel",
  B: "text-accent",
  C: "text-muted",
  D: "text-ember",
  F: "text-ember",
};

function gradeLine(grade: string, leaks: number) {
  if (grade === "S") return "Clean sweep.";
  if (grade === "A") return "Held the lane.";
  if (leaks === 1) return "One enemy got through.";
  if (leaks > 1) return `${leaks} enemies got through.`;
  return "Round done.";
}

function craftScore(c: CraftHud) {
  return c.kills * 4 + c.saves * 3 + c.specials * 2 + Math.round(c.heals / 8) + Math.round(c.dmg / 80);
}

function craftLine(c: CraftHud) {
  const bits: string[] = [];
  if (c.kills) bits.push(`Stopped ${c.kills}`);
  if (c.saves) bits.push(`Ate ${c.saves} grenade${c.saves === 1 ? "" : "s"}`);
  if (c.specials) bits.push(`${c.special} ×${c.specials}`);
  if (c.heals) bits.push(`Healed ${c.heals}`);
  if (c.homes) bits.push(`Flew home ${c.homes}×`);
  if (c.runLevel > 1) bits.push(`Level ${c.runLevel}`);
  const learned = (c.specialIds ?? []).map((id) => specialOf(id)?.name).filter(Boolean);
  if (learned.length) bits.push(learned.slice(-1)[0] as string);
  if (!bits.length) return c.home ? "Flew home to heal." : "Flew cover.";
  return bits.slice(0, 3).join(" · ");
}

export function ShopScreen({
  hud,
  onAction,
}: {
  hud: HudState;
  onAction: (a: Action) => void;
}) {
  const result = hud.grade;
  const fielded = hud.roster.filter((r) => r.placedPad && r.card.kind !== "socket");
  const crafts = [...(hud.crafts ?? [])].sort((a, b) => craftScore(b) - craftScore(a));
  const mvp = crafts.find((c) => craftScore(c) > 0) ?? null;
  const endless = hud.endless || hud.playMode === "arcade";
  const starGun = [...hud.roster]
    .filter((r) => r.card.kind === "tower" && r.placedPad)
    .sort((a, b) => (b.kills ?? 0) - (a.kills ?? 0))[0];

  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-ink/75 p-3 sm:items-center sm:p-4">
      <div className="glass-panel relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-xl">
        <span className="cyber-frame">
          <span className="cyber-corner cyber-tl" />
          <span className="cyber-corner cyber-tr" />
          <span className="cyber-corner cyber-bl" />
          <span className="cyber-corner cyber-br" />
        </span>
        <div className="shrink-0 border-b border-line p-5">
          <p className="text-[11px] font-medium tracking-[0.18em] text-accent">Round report</p>
          <div className="mt-2 flex items-end gap-4">
            {result ? (
              <span
                className={cn(
                  "card-bevel inline-flex min-w-16 items-center justify-center rounded-md border border-line bg-raised px-3 py-2 font-display text-6xl font-bold leading-none",
                  result.grade === "S" || result.grade === "A" ? "num-glow-s" : GRADE_TONE[result.grade],
                )}
              >
                {result.grade}
              </span>
            ) : null}
            <div className="min-w-0 pb-1">
              <p className="font-display text-2xl font-bold text-paper">
                {endless
                  ? `Wave ${fmtCount(hud.wave + 1)}. Keep holding.`
                  : result
                    ? gradeLine(result.grade, result.leaks)
                    : "Round done."}
              </p>
              {endless ? (
                <p className="mt-1 text-[13px] text-faint">
                  {fmtCount(hud.lives)} lives · {fmtCount(hud.flux + hud.points)} Credit
                  {result?.leaks ? ` · ${fmtCount(result.leaks)} got through` : " · Clean"}
                </p>
              ) : result ? (
                <p className="mt-1 text-[13px] text-faint">
                  {result.flux ? `+${fmtCount(result.flux)} Credit` : "Credit banks at round end"}
                </p>
              ) : (
                <p className="mt-1 text-[13px] text-muted">The enemies stopped. Keep going.</p>
              )}
              <p className="mt-1 text-[13px] text-frost">
                {hud.roundXp > 0 ? `+${fmtCount(hud.roundXp)} Bonus` : "No Bonus this round"}
                {" · "}
                {hud.pendingLevels > 0
                  ? "Bonus ready"
                  : `${fmtCount(hud.xp)} / ${fmtCount(hud.xpNext)} to ${fmtCount(hud.runLevel + 1)}`}
              </p>
            </div>
            <div className="ml-auto pb-1 text-right">
              <p className="text-[10px] font-medium tracking-[0.22em] text-epic">Credit</p>
              <p className="num-glow-gold font-display text-5xl font-bold tabular leading-none">{fmtCount(hud.flux + hud.points)}</p>
            </div>
          </div>
          {result && (
            <dl className="mt-4 grid grid-cols-2 gap-2 text-[13px]">
              <StatTile label="Stopped" value={fmtCount(result.kills)} />
              <StatTile label="Got through" value={fmtCount(result.leaks)} hot={result.leaks > 0} />
            </dl>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {endless ? (
            <>
              <p className="text-[11px] tracking-wide text-faint">Stars this wave</p>
              <ul className="mt-2 space-y-2">
                {mvp ? (
                  <li className="craft-report craft-report-mvp rounded-md border border-frost/50 bg-raised px-3 py-2">
                    <p className="font-display text-[16px] font-bold text-paper">{mvp.name}</p>
                    <p className="mt-1 text-[13px] text-muted">{craftLine(mvp)}</p>
                  </li>
                ) : (
                  <li className="text-[13px] text-muted">No craft stood out.</li>
                )}
                {starGun ? (
                  <li className="rounded-md border border-line bg-raised px-3 py-2">
                    <p className="font-display text-[15px] font-bold text-paper">{displayName(starGun.card)}</p>
                    <p className="text-[11px] text-muted">
                      Level {fmtCount(starGun.level)} · Stopped {fmtCount(starGun.kills ?? 0)}
                    </p>
                  </li>
                ) : null}
              </ul>
            </>
          ) : (
            <>
          <p className="text-[11px] tracking-wide text-faint">Crafts this round</p>
          {crafts.length === 0 ? (
            <p className="mt-2 text-[13px] text-muted">No crafts flew.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {crafts.map((c) => {
                const star = mvp?.uid === c.uid;
                const hp = Math.max(0, Math.min(1, c.hp / Math.max(1, c.hpMax)));
                return (
                  <li
                    key={c.uid}
                    className={cn(
                      "craft-report rounded-md border bg-raised px-3 py-2",
                      star ? "craft-report-mvp border-frost/50" : "border-line",
                    )}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-display text-[16px] font-bold text-paper">{c.name}</p>
                      {star ? (
                        <span className="text-[10px] font-medium tracking-[0.16em] text-frost">Star</span>
                      ) : c.home ? (
                        <span className="text-[10px] tracking-[0.14em] text-ember">At the bay</span>
                      ) : null}
                    </div>
                    <div className="craft-hp mt-1.5" aria-hidden>
                      <i style={{ width: `${Math.round(hp * 100)}%` }} />
                    </div>
                    <p className="mt-1.5 text-[13px] text-muted">{craftLine(c)}</p>
                    <p className="mt-0.5 text-[11px] tabular text-faint">
                      {fmtCount(c.hp)}/{fmtCount(c.hpMax)} hull
                    </p>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="mt-5 text-[11px] tracking-wide text-faint">Guns on the field</p>
          <ul className="mt-2 space-y-2">
            {fielded.length === 0 && <li className="text-[13px] text-muted">No guns on the field.</li>}
            {fielded.map((r) => {
              const card = r.card;
              const isHouse = r.placedPad === HOME_PAD;
              const names = (r.specials ?? []).map((id) => specialOf(id)?.name).filter(Boolean);
              return (
                <li
                  key={r.uid}
                  className={cn(
                    "rounded-md border bg-raised px-3 py-2",
                    isHouse ? "border-legend/50" : "border-line",
                  )}
                >
                  <p className="font-display text-[15px] font-bold text-paper">{displayName(card)}</p>
                  <p className="text-[11px] text-muted">
                    {r.level > 1 ? `Level ${r.level}` : "Level 1"}
                    {names.length ? ` · ${names.join(" · ")}` : ""}
                    {isHouse ? " · always firing" : ""}
                    {(r.specialOffer ?? []).length ? " · Level-up waiting" : ""}
                  </p>
                </li>
              );
            })}
          </ul>
            </>
          )}
        </div>

        <div className="shrink-0 border-t border-line p-4">
          <button
            type="button"
            onClick={() => onAction({ type: "shopContinue" })}
            className="ui-btn ui-btn-primary card-bevel w-full"
          >
            {hud.pendingEngrave ? "Engrave a gun" : hud.pendingStamp ? "Perk pack next" : "Open draft"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, hot }: { label: string; value: string; hot?: boolean }) {
  return (
    <div className="rounded-md border border-line bg-ink/40 px-3 py-2">
      <p className="text-[10px] tracking-wide text-faint">{label}</p>
      <p className={cn("font-display text-2xl font-bold tabular", hot && "text-ember")}>{value}</p>
    </div>
  );
}
