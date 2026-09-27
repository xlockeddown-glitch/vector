import { useEffect, useRef, useState } from "react";
import { CardView } from "./CardView";
import { OPENING_PICKS } from "@/game/constants";
import type { CardDef, CardKind, PackHeat, PackMode, Rarity, SetId } from "@/game/types";
import type { SignedPick } from "@/game/store";
import { cn } from "@/lib/utils";

export function DraftBoard({
  title,
  sub,
  cards,
  opening,
  step,
  onPick,
  packMode = "show",
  cutId = null,
}: {
  title: string;
  sub: string;
  cards: CardDef[];
  odds: Record<Rarity, number>;
  opening: boolean;
  step: number;
  signed: SignedPick[];
  kind: CardKind | null;
  setCounts: Record<SetId, number>;
  onPick: (id: string) => void;
  loot?: boolean;
  climb?: boolean;
  stamp?: boolean;
  heat?: PackHeat | null;
  packMode?: PackMode;
  cutId?: string | null;
  picksLeft?: number;
  skipCharge?: number;
  canSkipPack?: boolean;
  compensate?: boolean;
  packGift?: string | null;
  onSkipPack?: () => void;
}) {
  const packKey = `${opening ? "open" : "run"}-${step}-${title}`;
  const cardSig = cards.map((c) => c.id).join("|");
  const [locking, setLocking] = useState<string | null>(null);
  const [flipped, setFlipped] = useState<string | null>(null);
  const lockTimer = useRef(0);

  useEffect(() => {
    if (lockTimer.current) window.clearTimeout(lockTimer.current);
    setLocking(null);
    setFlipped(null);
  }, [packKey, cardSig]);

  useEffect(() => {
    return () => {
      if (lockTimer.current) window.clearTimeout(lockTimer.current);
    };
  }, []);

  const take = (id: string) => {
    if (locking) return;
    if (packMode === "cut" && !cutId) {
      onPick(id);
      return;
    }
    setLocking(id);
    if (lockTimer.current) window.clearTimeout(lockTimer.current);
    lockTimer.current = window.setTimeout(() => {
      lockTimer.current = 0;
      onPick(id);
      setLocking(null);
    }, 140);
  };

  return (
    <div className="arena-stage">
      <header className="arena-head">
        <p className="arena-kicker">{opening ? `${step + 1} / ${OPENING_PICKS}` : "Pick 1"}</p>
        <h2 className="arena-title">{title}</h2>
        <p className="arena-sub">{sub || "Three cards. Take one."}</p>
        <p className="arena-flip-hint">Flip to compare. Do not add the bars. Each gun wins a different job.</p>
        {opening && (
          <div className="arena-pips" aria-hidden>
            {Array.from({ length: OPENING_PICKS }, (_, i) => (
              <span key={i} className={cn("arena-pip", i < step && "is-done", i === step && "is-now")} />
            ))}
          </div>
        )}
      </header>
      <div className="arena-rail draft-rail" data-n={cards.length}>
        {cards.map((c, i) => (
          <CardView
            key={c.id}
            card={c}
            onPick={() => take(c.id)}
            delay={i * 70}
            banned={packMode === "cut" && cutId === c.id}
            tag={packMode === "cut" && cutId === c.id ? "cut" : undefined}
            picked={locking === c.id}
            dimmed={!!locking && locking !== c.id}
            dealAnim
            flipped={flipped === c.id}
            onFlip={() => setFlipped((id) => (id === c.id ? null : c.id))}
          />
        ))}
      </div>
    </div>
  );
}
