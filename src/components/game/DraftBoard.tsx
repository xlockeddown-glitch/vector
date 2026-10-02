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
  const [focus, setFocus] = useState(0);
  const [narrow, setNarrow] = useState(false);
  const lockTimer = useRef(0);
  const swipe = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 720px)");
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (lockTimer.current) window.clearTimeout(lockTimer.current);
    setLocking(null);
    setFlipped(null);
    setFocus(cards.length > 2 ? 1 : 0);
  }, [packKey, cardSig, cards.length]);

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
        {opening && (
          <div className="arena-pips" aria-hidden>
            {Array.from({ length: OPENING_PICKS }, (_, i) => (
              <span key={i} className={cn("arena-pip", i < step && "is-done", i === step && "is-now")} />
            ))}
          </div>
        )}
      </header>
      <div
        className="arena-rail draft-rail"
        data-n={cards.length}
        data-fan={narrow ? "1" : "0"}
        onPointerDown={(e) => {
          swipe.current = e.clientX;
        }}
        onPointerUp={(e) => {
          if (!narrow || swipe.current == null) return;
          const dx = e.clientX - swipe.current;
          swipe.current = null;
          if (dx > 40) setFocus((i) => Math.max(0, i - 1));
          else if (dx < -40) setFocus((i) => Math.min(cards.length - 1, i + 1));
        }}
      >
        {cards.map((c, i) => {
          const on = i === focus;
          return (
            <CardView
              key={c.id}
              card={c}
              className={cn(
                narrow && on && "is-focus",
                narrow && i === focus - 1 && "is-prev",
                narrow && i === focus + 1 && "is-next",
                narrow && Math.abs(i - focus) > 1 && "is-far",
              )}
              onPick={() => {
                if (narrow && !on) {
                  setFocus(i);
                  return;
                }
                take(c.id);
              }}
              delay={i * 70}
              banned={packMode === "cut" && cutId === c.id}
              tag={packMode === "cut" && cutId === c.id ? "cut" : undefined}
              picked={locking === c.id}
              dimmed={!!locking && locking !== c.id}
              dealAnim
              flipped={flipped === c.id}
              faceFlip={narrow && on}
              onFlip={() => setFlipped((id) => (id === c.id ? null : c.id))}
            />
          );
        })}
      </div>
      {narrow && cards[focus] && (
        <button type="button" className="arena-take" onClick={() => take(cards[focus]!.id)}>
          Take {cards[focus]!.name}
        </button>
      )}
    </div>
  );
}
