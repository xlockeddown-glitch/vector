import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { cellFromPoint, drawGrid, panBy, resetCamera } from "@/game/grid-draw";
import { beginRound, castAbility, startLevel, stepRun, tryPlace, type GridRun } from "@/game/grid-sim";
import { levelAt } from "@/game/levels";
import { SKILLS, type SkillId } from "@/game/skills";
import { TOWER_IDS, TOWERS, canAfford, type TowerId } from "@/game/matchup";
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

export function GridStage({
  companion,
  onExit,
}: {
  companion: CompanionId;
  onExit: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const climb = useRef({ level: 1, skills: [] as SkillId[], points: 0, paid: 0 });
  const runRef = useRef<GridRun>(startLevel(1, companion, []));
  const [tick, setTick] = useState(0);

  useEffect(() => {
    climb.current = { level: 1, skills: [], points: 0, paid: 0 };
    resetCamera();
    runRef.current = startLevel(1, companion, []);
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
      if (run.won && climb.current.paid < run.level) {
        climb.current.points += 1;
        climb.current.paid = run.level;
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
    const placed = tryPlace(run, cell.x, cell.y);
    if (!placed && run.selected) run.press = { x: cell.x, y: cell.y, life: 0.22 };
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
          <p className="font-display text-lg tracking-wide">{run.level > 8 ? `Endless ${run.level - 8}` : `Level ${run.level}`}</p>
          <p className="truncate text-[12px] text-muted">{def.blurb}</p>
        </div>
        <p className="ml-auto tabular text-legend">{run.credit}</p>
        <p className="tabular text-frost">{Math.ceil(run.companionHp)}</p>
      </header>
      <canvas
        ref={canvasRef}
        className="grid-board min-h-0 w-full flex-1 touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
      <div className="flex flex-col gap-2 px-3 pb-3 pt-2">
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
        <p className="pb-1 text-center text-[12px] text-muted">
          {run.hold ? "Place your guns, then start." : "Drag to look. Tap a pad."}
        </p>
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
              </button>
            );
          })}
        </div>
      </div>
      {(run.won || run.lost) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-ink/70 p-6">
          <div className="w-full max-w-xs text-center">
            <h2 className="font-display text-4xl uppercase">{run.won ? "Held" : "The ship fell"}</h2>
            {run.won && climb.current.points > 0 && (
              <div className="mt-4 flex max-h-52 flex-col gap-1.5 overflow-y-auto">
                {SKILLS.filter((skill) => !owned.has(skill.id)).map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    className="rounded-lg border border-line px-3 py-2 text-left"
                    onClick={() => {
                      if (climb.current.points < 1 || climb.current.skills.includes(skill.id)) return;
                      climb.current.skills.push(skill.id);
                      climb.current.points -= 1;
                      setTick((n) => n + 1);
                    }}
                  >
                    <span className="font-display uppercase tracking-wide">{skill.name}</span>
                    <span className="mt-0.5 block text-[13px] text-muted">{skill.line}</span>
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              className="ui-btn ui-btn-primary mt-4 w-full"
              onClick={() => {
                const current = runRef.current;
                if (current.won) climb.current.level += 1;
                runRef.current = startLevel(climb.current.level, companion, climb.current.skills);
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
