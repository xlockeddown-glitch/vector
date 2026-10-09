import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { cellFromPoint, drawGrid } from "@/game/grid-draw";
import { castAbility, startRun, stepRun, tryPlace, type GridRun } from "@/game/grid-sim";
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
  const runRef = useRef<GridRun>(startRun(1, companion));
  const [tick, setTick] = useState(0);

  useEffect(() => {
    runRef.current = startRun(1, companion);
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

  const onPointer = (e: PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cell = cellFromPoint(rect.width, rect.height, e.clientX - rect.left, e.clientY - rect.top);
    if (!cell) return;
    tryPlace(runRef.current, cell.x, cell.y);
    paintHover(cell);
    setTick((n) => n + 1);
  };

  const run = runRef.current;
  const ready = run.abilityCd <= 0 && !run.won && !run.lost;
  void tick;

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-ink text-paper">
      <header className="flex items-center gap-3 px-3 py-2">
        <button type="button" className="ui-btn ui-btn-ghost min-h-10 px-3" onClick={onExit}>
          Back
        </button>
        <p className="font-display text-lg tracking-wide">Level 1</p>
        <p className="ml-auto tabular text-legend">{run.credit}</p>
        <p className="tabular text-frost">{Math.ceil(run.companionHp)}</p>
      </header>
      <canvas ref={canvasRef} className="min-h-0 w-full flex-1 touch-none" onPointerDown={onPointer} />
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
            <button
              type="button"
              className="ui-btn ui-btn-primary mt-4 w-full"
              onClick={() => {
                const current = runRef.current;
                runRef.current = startRun(current.won ? current.seed + 1 : current.seed, companion);
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
