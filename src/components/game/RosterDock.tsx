import { CardMark, CraftPortrait } from "./CardView";
import type { Action } from "@/game/runtime";
import type { HudState } from "@/game/store";
import type { CardDef, RolledCard } from "@/game/types";
import { cn } from "@/lib/utils";

export function RosterDock({
  hud,
  onAction,
}: {
  hud: HudState;
  onAction: (a: Action) => void;
}) {
  if (hud.phase !== "placement" && hud.phase !== "combat") return null;
  const items = hud.roster.filter((r) => r.card.kind === "tower");
  const unplaced = items.filter((r) => !r.placedPad).length;
  const selected = items.find((r) => r.uid === hud.selectedCard);
  const placing = hud.phase === "placement" && selected && !selected.placedPad;

  const status =
    hud.phase === "placement"
      ? placing
        ? `Tap a glowing moon for ${selected?.card.name ?? "that gun"}.`
        : `Guns ${hud.placedCount}/${hud.maxTowers} · ${unplaced} left`
      : `Guns ${hud.placedCount}`;

  return (
    <div className="play-bench bench-dock relative z-10 shrink-0 border-t border-line bg-ink/95 pb-[max(0.2rem,env(safe-area-inset-bottom))] pt-1">
      <div className="flex items-center gap-2 px-3">
        <p className="min-w-0 flex-1 truncate text-[11px] font-medium tracking-wide text-steel">
          {status}
        </p>
        {hud.selectedItem && hud.selectedItem.card.kind === "tower" && hud.scrapValue > 0 ? (
          <button
            type="button"
            onClick={() => onAction({ type: "scrap", uid: hud.selectedItem!.uid })}
            className="h-8 shrink-0 rounded-md border border-line px-2 text-[11px] tracking-wide text-paper"
          >
            Sell · {hud.scrapValue}
          </button>
        ) : null}
      </div>

      <div className="mt-1 flex gap-1 overflow-x-auto px-3 pb-1">
        {items.length === 0 && (
          <p className="py-1 text-[12px] text-muted">Guns sit here.</p>
        )}
        {items.map((r) => {
          const isSelected = hud.selectedCard === r.uid;
          const planted = !!r.placedPad;
          const tag = planted ? "tap for tree" : "tap a moon";
          return (
            <button
              key={r.uid}
              type="button"
              title={`${r.card.name} · ${tag}`}
              onClick={() =>
                onAction({
                  type: "selectCard",
                  uid: isSelected ? null : r.uid,
                })
              }
              className={cn(
                "bench-chip",
                isSelected && "bench-chip-on",
                planted && !isSelected && "opacity-70",
              )}
            >
              <ChipArt card={r.card} level={r.level} />
              <span className="bench-chip-name">{r.card.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChipArt({ card, level }: { card: CardDef; level?: number }) {
  const id = "templateId" in card ? String((card as RolledCard).templateId ?? card.id) : card.id;
  if (card.kind === "companion") {
    return <CraftPortrait id={id} className="h-7 w-7" />;
  }
  return (
    <span className="bench-chip-art relative">
      <CardMark card={card} />
      {level && level > 1 ? <span className="bench-lv">L{level}</span> : null}
    </span>
  );
}
