import { useLayoutEffect, useRef, type PointerEvent } from "react";
import { DraftBoard } from "./DraftBoard";
import { EndScreen } from "./EndScreen";
import { EngraveScreen } from "./EngraveScreen";
import { HangarScreen } from "./HangarScreen";
import { HelpSheet } from "./HelpSheet";
import { LoopScreen } from "./LoopScreen";
import { TUTORIAL_TIPS } from "@/game/data/vault";
import { HudBar, HudOverlays, CraftBanner } from "./Hud";
import { MerchantScreen } from "./MerchantScreen";
import { RosterDock } from "./RosterDock";
import { ShopScreen } from "./ShopScreen";
import { TitleScreen } from "./TitleScreen";
import { createRuntime, RUNTIME_GEN, type HudSink, type Runtime } from "@/game/runtime";
import { useGame } from "@/game/store";
import { orbitRank } from "@/game/data/orbit";
import { audio } from "@/game/audio";
import { cn } from "@/lib/utils";

function hudSink(w: Parameters<HudSink>[0]) {
  useGame.getState().setHud(w);
}

function bootRuntime(canvas: HTMLCanvasElement): Runtime {
  const runtime = createRuntime(canvas, hudSink);
  runtime.bindHud(hudSink);
  runtime.start();
  return runtime;
}

export function GameApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rt = useRef<Runtime | null>(null);
  const hud = useGame((s) => s.hud);
  const muted = useGame((s) => s.muted);
  const help = useGame((s) => s.help);
  const hangar = useGame((s) => s.hangar);
  const ready = useGame((s) => s.ready);
  const best = useGame((s) => s.best);
  const hasRun = useGame((s) => s.hasRun);
  const profiles = useGame((s) => s.profiles);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      rt.current = bootRuntime(canvas);
    } catch (err) {
      console.warn("vector boot", err);
    }
  }, [RUNTIME_GEN]);

  const act = (a: Parameters<Runtime["dispatch"]>[0]) => {
    if (!rt.current) {
      const canvas = canvasRef.current;
      try {
        if (canvas) rt.current = bootRuntime(canvas);
      } catch (err) {
        console.warn("vector act", err);
      }
    }
    const runtime =
      rt.current ??
      (typeof window !== "undefined"
        ? (window as unknown as { __vectorRuntime?: Runtime }).__vectorRuntime
        : undefined);
    runtime?.dispatch(a);
  };

  const onCanvas = (e: PointerEvent<HTMLCanvasElement>) => {
    audio.unlock();
    rt.current?.pointer(e.clientX, e.clientY);
  };

  const onHover = (e: PointerEvent<HTMLCanvasElement>) => {
    rt.current?.hover(e.clientX, e.clientY);
  };

  const phase = hud?.phase ?? "title";
  const orbit = orbitRank(best.orbitXp ?? 0);

  return (
    <div
      className={cn(
        "play-shell h-full min-h-0 w-full overflow-hidden bg-ink text-paper",
        hud?.themeId && phase !== "title" && `sector-${hud.themeId}`,
        orbit >= 4 && "orbit-lord",
      )}
      data-orbit={orbit}
      data-phase={phase}
    >
      {hud && phase !== "title" && <HudBar hud={hud} muted={muted} onAction={act} />}
      <div className="play-board relative min-h-0">
      {hud && phase !== "title" && <CraftBanner hud={hud} onAction={act} />}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        onPointerDown={onCanvas}
        onPointerMove={onHover}
      />

      {phase === "title" && (
        <TitleScreen
          ready={ready}
          best={best}
          hasRun={hasRun}
          profiles={profiles}
          onPlay={(opts) => act({ type: "play", tutorial: opts?.tutorial, mode: opts?.mode })}
          onContinue={() => act({ type: "play", continue: true })}
          onHelp={() => act({ type: "help" })}
          onHangar={() => act({ type: "hangar" })}
          onSlot={(id) => act({ type: "slot", id })}
          onBind={(id) => act({ type: "bind", id })}
        />
      )}

      {help && <HelpSheet onClose={() => act({ type: "closeHelp" })} />}

      {hud?.tutorialActive && hud.phase !== "title" && (
        <div className="tutorial-banner">
          <p>{TUTORIAL_TIPS[Math.max(0, Math.min(6, (hud.tutorialStep || 1) - 1))]}</p>
          <button type="button" onClick={() => act({ type: "skipTutorial" })}>
            Skip tutorial
          </button>
        </div>
      )}

      {hud?.tutorialDoneReady && (
        <div className="tutorial-gate">
          <div className="tutorial-gate-panel">
            <h2 className="font-display text-2xl font-bold text-paper">You’re ready</h2>
            <p className="mt-2 text-[14px] text-muted">Hold 12 waves. Then keep flying, or return.</p>
            <button type="button" className="ui-btn ui-btn-primary card-bevel mt-5 w-full" onClick={() => act({ type: "finishTutorial" })}>
              Keep playing
            </button>
          </div>
        </div>
      )}

      {hud?.swapToast && phase !== "opening" && phase !== "draft" && phase !== "loot" && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-ink/60 p-4">
          <div className="glass-panel relative w-full max-w-sm overflow-hidden rounded-xl p-5 text-center">
            <span className="cyber-frame">
              <span className="cyber-corner cyber-tl" />
              <span className="cyber-corner cyber-tr" />
              <span className="cyber-corner cyber-bl" />
              <span className="cyber-corner cyber-br" />
            </span>
            <p className="text-[11px] font-medium tracking-[0.18em] text-frost">Pack bonus</p>
            <h2 className="mt-1 font-display text-3xl font-bold tracking-wide text-paper">Swap token</h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              Move a gun to another moon. You start with one. Extra moves are rare.
            </p>
            <button
              type="button"
              onClick={() => act({ type: "dismissSwap" })}
              className="ui-btn ui-btn-primary card-bevel mt-5 w-full"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {hud && (phase === "opening" || phase === "draft" || phase === "loot") && (
        <DraftBoard
          title={hud.draftTitle}
          sub={hud.draftSub}
          cards={hud.draftCards}
          odds={hud.draftOdds}
          opening={phase === "opening"}
          loot={phase === "loot"}
          climb={hud.draftLane === "level"}
          stamp={hud.draftLane === "stamp"}
          heat={hud.draftLane === "round" ? hud.packHeat : null}
          packMode={hud.packMode}
          cutId={hud.cutId}
          step={hud.openingStep}
          signed={hud.signed}
          kind={hud.draftKind}
          setCounts={hud.setCounts}
          picksLeft={hud.draftPicksLeft}
          skipCharge={hud.skipCharge}
          canSkipPack={hud.canSkipPack}
          compensate={hud.draftCompensate}
          packGift={hud.packGift}
          onPick={(id) => act({ type: "pick", id })}
          onSkipPack={() => act({ type: "skipPack" })}
        />
      )}

      {hud && phase === "shop" && <ShopScreen hud={hud} onAction={act} />}

      {hud && phase === "engrave" && <EngraveScreen hud={hud} onAction={act} />}

      {hud && phase === "merchant" && <MerchantScreen hud={hud} onAction={act} />}

      {hud && phase === "loop" && (
        <LoopScreen
          hud={hud}
          onKeep={() => act({ type: "watchKeep" })}
          onTitle={() => act({ type: "title" })}
        />
      )}

      {hud && (phase === "victory" || phase === "defeat") && (
        <EndScreen
          hud={hud}
          onRetry={() => act({ type: "retry" })}
          onHangar={() => act({ type: "hangar" })}
          onTitle={() => act({ type: "title" })}
        />
      )}

      {hud && <HudOverlays hud={hud} onAction={act} />}
      </div>
      {hud && phase !== "title" && <RosterDock hud={hud} onAction={act} />}
      {hangar && (
        <HangarScreen
          best={best}
          onEquip={(id) => act({ type: "skin", id })}
          onBuy={(id) => act({ type: "hangarBuy", id })}
          onBuySkin={(id) => act({ type: "hangarSkin", id })}
          onClose={() => act({ type: "closeHangar" })}
        />
      )}
    </div>
  );
}
