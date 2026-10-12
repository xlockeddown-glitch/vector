import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { cellFromPoint, drawGrid, panBy, resetCamera } from "@/game/grid-draw";
import { beginRound, castAbility, cycleAim, sellValue, startLevel, stepRun, tryFocus, tryPlace, tryRank, trySell, type GridRun } from "@/game/grid-sim";
import { levelAt } from "@/game/levels";
import { offerSkills, SKILLS, type SkillId } from "@/game/skills";
import { MATCHUP, TOWER_IDS, TOWERS, canAfford, type TowerId } from "@/game/matchup";
import { AIM_WORD, offerParts, partById, type PartId } from "@/game/grid-parts";
import { loadMeta, openGrey, saveMeta, settlePatrol } from "@/game/grid-meta";
import type { CompanionId } from "@/game/grid";
import { cn } from "@/lib/utils";

const NAMES: Record<TowerId, string> = {
  lance: "Lance",
  halo: "Halo",
  crater: "Crater",
  rail: "Rail",
  beacon: "Beacon",
};

const SHIP: Record<CompanionId, string> = {
  "comp-auger": "Auger",
  "comp-boost": "Boost",
  "comp-shrike": "Shrike",
};

function arm(run: GridRun) {
  const meta = loadMeta();
  for (const tower of run.towers) {
    const part = meta.equipped[tower.id];
    if (part) tower.part = part;
  }
  return run;
}

export function GridStage({
  companion,
  onExit,
}: {
  companion: CompanionId;
  onExit: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const climb = useRef({
    level: 1,
    skills: [] as SkillId[],
    points: 0,
    paid: 0,
    rolled: 0,
    heat: 0,
    offer: [] as SkillId[],
    parts: [] as PartId[],
    clean: false,
    partTaken: false,
  });
  const runRef = useRef<GridRun>(startLevel(1, companion, []));
  const [tick, setTick] = useState(0);
  const [note, setNote] = useState("");
  const [patrol, setPatrol] = useState(0);

  useEffect(() => {
    const settled = settlePatrol(loadMeta(), Date.now());
    saveMeta(settled.meta);
    setNote(settled.gained > 0 ? `Patrol brought ${settled.gained} scrap.` : "");
    setPatrol(settled.gained);
    climb.current = {
      level: settled.meta.level || 1,
      skills: settled.meta.skills,
      points: 0,
      paid: 0,
      rolled: 0,
      heat: settled.meta.heat,
      offer: [],
      parts: [],
      clean: false,
      partTaken: false,
    };
    resetCamera();
    runRef.current = arm(startLevel(climb.current.level, companion, climb.current.skills, [], climb.current.heat));
    const canvas = canvasRef.current;
    if (!canvas) return;
    let frame = 0;
    let last = performance.now();
    let acc = 0;
    let paintN = 0;
    const loop = (now: number) => {
      acc += Math.min(0.1, (now - last) / 1000);
      last = now;
      const run = runRef.current;
      if (run.won && climb.current.rolled < run.level) {
        climb.current.rolled = run.level;
        climb.current.points += 1;
        climb.current.paid = run.level;
        climb.current.offer = offerSkills(climb.current.skills, run.level * 3);
        climb.current.clean = run.companionHp >= run.companionMax;
        const meta = loadMeta();
        climb.current.parts = offerParts(run.level * 11 + (climb.current.clean ? 50 : 0), climb.current.clean ? meta.owned : []);
        climb.current.partTaken = false;
        meta.scrap += 20 + run.level * 2 + (climb.current.clean ? 15 : 0);
        meta.best = Math.max(meta.best, run.level);
        meta.level = run.level;
        meta.skills = climb.current.skills;
        saveMeta(meta);
      }
      while (acc >= 1 / 60) {
        stepRun(run, 1 / 60);
        acc -= 1 / 60;
      }
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      const ctx = canvas.getContext("2d");
      if (ctx) drawGrid(ctx, run, rect.width, rect.height, dpr, null);
      paintN += 1;
      if (paintN % 10 === 0) setTick((n) => n + 1);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [companion]);

  const paintHover = (hover: { x: number; y: number } | null) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    drawGrid(ctx, runRef.current, rect.width, rect.height, dpr, hover);
  };

  const drag = useRef({ x: 0, y: 0, moved: false });

  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    drag.current = { x: e.clientX, y: e.clientY, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    if (!drag.current.moved && Math.hypot(dx, dy) < 8) return;
    drag.current.moved = true;
    drag.current.x = e.clientX;
    drag.current.y = e.clientY;
    panBy(dx, dy);
  };

  const onPointerUp = (e: PointerEvent<HTMLCanvasElement>) => {
    if (drag.current.moved) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const localX = e.nativeEvent.offsetX || e.clientX - rect.left;
    const localY = e.nativeEvent.offsetY || e.clientY - rect.top;
    const cell = cellFromPoint(e.currentTarget.clientWidth, e.currentTarget.clientHeight, localX, localY);
    if (!cell) return;
    const run = runRef.current;
    const tower = run.towers.find((item) => item.x === cell.x && item.y === cell.y);
    if (!run.selected && tower) {
      run.picked = { x: cell.x, y: cell.y };
    } else if (!run.selected) {
      tryFocus(run, cell.x, cell.y);
      run.picked = null;
    } else {
      tryPlace(run, cell.x, cell.y);
      const fresh = run.towers.find((item) => item.x === cell.x && item.y === cell.y);
      const gear = fresh ? loadMeta().equipped[fresh.id] : undefined;
      if (fresh && gear) fresh.part = gear;
      if (!fresh && run.selected) run.press = { x: cell.x, y: cell.y, life: 0.22 };
    }
    paintHover(cell);
    setTick((n) => n + 1);
  };

  const run = runRef.current;
  const ready = run.abilityCd <= 0 && !run.won && !run.lost;
  const def = levelAt(run.level);
  const owned = new Set(climb.current.skills);
  void tick;

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-ink text-paper">
      <header className="flex items-center gap-3 px-3 py-2">
        <button type="button" className="ui-btn ui-btn-ghost min-h-10 px-3" onClick={onExit}>
          Back
        </button>
        <div className="min-w-0">
          <p className="font-display text-lg tracking-wide">{run.level > 8 ? def.blurb.split(".")[0] : `Level ${run.level}`}</p>
          <p className="truncate text-[12px] text-muted">
            {run.level > 8 ? `Endless ${run.level - 8}` : def.blurb}
            {climb.current.heat > 0 ? ` · Heat ${climb.current.heat}` : ""}
          </p>
        </div>
        <div className="ml-auto flex flex-col items-end">
          <p className="tabular text-legend">{run.credit}</p>
          <p className="text-[10px] text-muted">credit</p>
        </div>
        <div className="flex flex-col items-end">
          <p className="tabular text-frost">{Math.ceil(run.companionHp)}</p>
          <p className="text-[10px] text-muted">hull</p>
        </div>
        <div className="flex flex-col items-end">
          <p className="tabular text-paper">{loadMeta().scrap}</p>
          <p className="text-[10px] text-muted">scrap</p>
        </div>
      </header>
      <canvas
        ref={canvasRef}
        className="grid-board min-h-0 w-full flex-1 touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
      <div className="flex flex-col gap-2 px-3 pb-3 pt-2">
        {!run.hold && !run.won && !run.lost && (
          <button
            type="button"
            disabled={!ready}
            onClick={() => {
              castAbility(runRef.current);
              setTick((n) => n + 1);
            }}
            className={cn("ui-btn w-full", ready ? "ui-btn-primary" : "ui-btn-ghost")}
          >
            {SHIP[run.companion]}
            {run.abilityCd > 0 ? ` ${Math.ceil(run.abilityCd)}` : ""}
          </button>
        )}
        {run.hold && (
          <button
            type="button"
            className="ui-btn ui-btn-primary w-full"
            onClick={() => {
              beginRound(runRef.current);
              setTick((n) => n + 1);
            }}
          >
            Start
          </button>
        )}
        <p className="pb-1 text-center text-[12px] text-muted">
          {run.callAt != null && !run.hold && run.time > run.callAt - 3 && run.time < run.callAt + 2
            ? "Swifts break out."
            : run.hold
              ? run.selected
                ? `Tap a pad for ${NAMES[run.selected]}.`
                : "Pick a gun, then a pad. Tap a tower to aim or sell."
              : run.handsOff
                ? "Hands off. Nearest target. Ship stays dark."
                : "Drag to look. Tap a body to focus it."}
        </p>
        {note && <p className="text-center text-[12px] text-steel">{note}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            className={cn("ui-btn flex-1", run.handsOff ? "ui-btn-primary" : "ui-btn-ghost")}
            onClick={() => {
              runRef.current.handsOff = !runRef.current.handsOff;
              setTick((n) => n + 1);
            }}
          >
            Hands off
          </button>
          {loadMeta().scrap >= 40 && (
            <button
              type="button"
              className="ui-btn ui-btn-ghost flex-1"
              onClick={() => {
                const meta = loadMeta();
                const opened = openGrey(meta, Date.now() % 100000);
                if (!opened) return;
                saveMeta(meta);
                const spec = partById(opened.part);
                setNote(opened.duplicate ? `${spec.name} came back as scrap.` : `${spec.name} is in the bin. Fit it from the tower.`);
                setTick((n) => n + 1);
              }}
            >
              Grey crate
            </button>
          )}
        </div>
        {run.picked && (() => {
          const tower = run.towers.find((item) => item.x === run.picked!.x && item.y === run.picked!.y);
          if (!tower) return null;
          const rankCost = tower.rank === 1 ? 45 : tower.rank === 2 ? 90 : 0;
          return (
            <div className="flex flex-col gap-1">
              <p className="text-[12px] text-steel">
                {NAMES[tower.id]} · {AIM_WORD[tower.aim]}
                {tower.part ? ` · ${partById(tower.part).name}` : ""}
              </p>
              <div className="flex items-center gap-1.5">
              <button type="button" className="ui-btn ui-btn-ghost flex-1" onClick={() => { cycleAim(run, tower.x, tower.y); setTick((n) => n + 1); }}>Aim</button>
              <button type="button" className="ui-btn ui-btn-ghost flex-1" onClick={() => { trySell(run, tower.x, tower.y); setTick((n) => n + 1); }}>Sell {sellValue(run, tower)}</button>
              {tower.rank < 3 && (
                <button type="button" className="ui-btn ui-btn-ghost flex-1" disabled={run.credit < rankCost} onClick={() => { tryRank(run, tower.x, tower.y); setTick((n) => n + 1); }}>Rank {rankCost}</button>
              )}
              {(() => {
                const spare = loadMeta().owned.find((id) => partById(id).gun === tower.id && id !== tower.part);
                if (!spare) return null;
                const spec = partById(spare);
                return (
                  <button
                    type="button"
                    className="ui-btn ui-btn-ghost flex-1"
                    onClick={() => {
                      const meta = loadMeta();
                      meta.equipped[tower.id] = spare;
                      saveMeta(meta);
                      tower.part = spare;
                      setTick((n) => n + 1);
                    }}
                  >
                    Fit {spec.name}
                  </button>
                );
              })()}
              </div>
            </div>
          );
        })()}
        <div className="grid grid-cols-5 gap-1.5">
          {TOWER_IDS.map((id) => {
            const on = run.selected === id;
            const afford = canAfford(run.credit, id) || on;
            return (
              <button
                key={id}
                type="button"
                disabled={!afford && !on}
                onClick={() => {
                  runRef.current.selected = runRef.current.selected === id ? null : id;
                  setTick((n) => n + 1);
                }}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center rounded-lg border px-1 py-1",
                  on ? "border-moonstone bg-raised text-paper" : "border-line bg-ink text-steel",
                  !afford && !on && "opacity-40",
                )}
              >
                <span className="font-display text-sm uppercase tracking-wide text-paper">{NAMES[id]}</span>
                <span className="tabular text-[11px]">{TOWERS[id].cost}</span>
                {run.hold && (
                  <span className={cn("mt-0.5 h-1.5 w-1.5 rounded-full", MATCHUP[id][run.preview.tag] >= 1 ? "bg-frost" : MATCHUP[id][run.preview.tag] < 0.7 ? "bg-ember" : "bg-steel")} />
                )}
              </button>
            );
          })}
        </div>
      </div>
      {patrol > 0 && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink/80 p-6">
          <div className="w-full max-w-xs text-center">
            <img src={`/game/pack/${companion === "comp-boost" ? "boost" : companion === "comp-shrike" ? "shrike" : "auger"}.png`} alt="" className="mx-auto h-28 w-auto object-contain opacity-80" />
            <p className="mt-2 font-display text-2xl uppercase">Patrol</p>
            <p className="mt-1 text-[14px] text-steel">The ship ran the last table without you.</p>
            <p className="mt-2 tabular text-lg text-paper">+{patrol} scrap</p>
            <button type="button" className="ui-btn ui-btn-primary mt-4 w-full" onClick={() => setPatrol(0)}>
              Back to the table
            </button>
          </div>
        </div>
      )}
      {(run.won || run.lost) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-ink/70 p-6">
          <div className="w-full max-w-xs text-center">
            <h2 className="font-display text-4xl uppercase">{run.won ? "Held" : "The ship fell"}</h2>
            {run.won && climb.current.points > 0 && climb.current.offer.length > 0 && (
              <div className="mt-4 flex max-h-36 flex-col gap-1.5 overflow-y-auto">
                {climb.current.offer.map((id) => {
                  const skill = SKILLS.find((item) => item.id === id);
                  if (!skill || owned.has(skill.id)) return null;
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      className="rounded-lg border border-line px-3 py-2 text-left"
                      onClick={() => {
                        if (climb.current.points < 1 || climb.current.skills.includes(skill.id)) return;
                        climb.current.skills.push(skill.id);
                        climb.current.points -= 1;
                        climb.current.offer = [];
                        const meta = loadMeta();
                        meta.skills = climb.current.skills;
                        saveMeta(meta);
                        setTick((n) => n + 1);
                      }}
                    >
                      <span className="font-display uppercase tracking-wide">{skill.name}</span>
                      <span className="mt-0.5 block text-[13px] text-muted">{skill.line}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {run.won && !climb.current.partTaken && climb.current.parts.length > 0 && (
              <div className="mt-3">
                <p className="text-[11px] tracking-[0.16em] text-steel">{climb.current.clean ? "Black crate" : "Field pick"}</p>
                <div className="mt-1.5 flex flex-col gap-1.5">
                  {climb.current.parts.map((id) => {
                    const part = partById(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        className="flex items-center gap-2 rounded-lg border border-line bg-ink px-2 py-2 text-left"
                        onClick={() => {
                          const meta = loadMeta();
                          meta.equipped[part.gun] = id;
                          if (!meta.owned.includes(id)) meta.owned.push(id);
                          saveMeta(meta);
                          for (const tower of run.towers) if (tower.id === part.gun) tower.part = id;
                          climb.current.partTaken = true;
                          setTick((n) => n + 1);
                        }}
                      >
                        <img src={`/game/pack/${part.gun}.png`} alt="" className="h-14 w-10 object-contain" />
                        <span>
                          <span className="font-display uppercase tracking-wide">{part.name}</span>
                          <span className="mt-0.5 block text-[13px] text-muted">{part.line}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {run.won && (
              <button
                type="button"
                className="ui-btn ui-btn-ghost mt-3 w-full"
                onClick={() => {
                  if (climb.current.partTaken) return;
                  climb.current.heat += 1;
                  climb.current.partTaken = true;
                  const meta = loadMeta();
                  meta.heat = climb.current.heat;
                  saveMeta(meta);
                  setTick((n) => n + 1);
                }}
              >
                Leave the dock open
              </button>
            )}
            <button
              type="button"
              className="ui-btn ui-btn-primary mt-4 w-full"
              onClick={() => {
                const current = runRef.current;
                const kept = current.towers.map((tower) => ({ ...tower }));
                if (current.won) climb.current.level += 1;
                const meta = loadMeta();
                meta.level = climb.current.level;
                meta.skills = climb.current.skills;
                meta.heat = climb.current.heat;
                meta.patrolAt = Date.now();
                saveMeta(meta);
                runRef.current = arm(startLevel(climb.current.level, companion, climb.current.skills, kept, climb.current.heat));
                setTick((n) => n + 1);
              }}
            >
              {run.won ? "Next" : "Again"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
