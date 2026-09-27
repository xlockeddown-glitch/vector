import type { TuneDef } from "@/game/data/tunes";
import { cn } from "@/lib/utils";

export function TunePick({
  label,
  hint,
  cost,
  disabled,
  options,
  onPick,
}: {
  label: string;
  hint: string;
  cost: number;
  disabled: boolean;
  options: TuneDef[];
  onPick: (id: string) => void;
}) {
  return (
    <div>
      <p className="text-[11px] tracking-wide text-faint">
        {label} · {cost} Credit
      </p>
      <p className="mt-1 text-[11px] leading-snug text-muted">{hint}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {options.map((m) => (
          <button
            key={m.id}
            type="button"
            disabled={disabled}
            onClick={() => onPick(m.id)}
            className={cn(
              "card-bevel flex min-h-16 flex-col items-start rounded-md border border-line bg-raised px-2.5 py-2 text-left disabled:opacity-40",
            )}
          >
            <span className="text-[13px] font-medium text-paper">{m.name}</span>
            <span className="mt-0.5 text-[11px] leading-snug text-muted">{m.blurb}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
