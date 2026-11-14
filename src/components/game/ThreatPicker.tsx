import { useEffect, useState } from "react";
import { THREATS, loadThreat, saveThreat, threatPayMul, threatPoints, type ThreatId } from "@/game/data/threat";
import { cn } from "@/lib/utils";

/**
 * Threat picker, shown on the title screen before a run starts.
 * The choice is saved at once; the next run reads it when it starts.
 */
export function ThreatPicker() {
  const [open, setOpen] = useState(false);
  // Read the saved choice after mount so server and client render the same first frame.
  const [on, setOn] = useState<ThreatId[]>([]);
  useEffect(() => {
    setOn(loadThreat());
  }, []);
  const points = threatPoints(on);
  const pay = Math.round((threatPayMul(points) - 1) * 100);

  const toggle = (id: ThreatId) => {
    const next = on.includes(id) ? on.filter((x) => x !== id) : [...on, id];
    setOn(saveThreat(next));
  };

  return (
    <div className={cn("depth-threat", open && "is-open", points > 0 && "is-hot")}>
      <button
        type="button"
        className="depth-threat-tab"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="depth-threat-k">Threat</span>
        <span className="depth-threat-n">{points}</span>
        {pay > 0 && <span className="depth-threat-pay">+{pay}% pay</span>}
      </button>
      {open && (
        <div className="depth-threat-panel" role="group" aria-label="Threat toggles">
          <p className="depth-threat-sub">Harder runs pay more Vault Credit and Pass XP. Applies to your next run.</p>
          <ul className="depth-threat-list">
            {THREATS.map((t) => {
              const lit = on.includes(t.id);
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    aria-pressed={lit}
                    className={cn("depth-threat-row", lit && "is-on")}
                    onClick={() => toggle(t.id)}
                  >
                    <span className="depth-threat-box" aria-hidden />
                    <span className="depth-threat-copy">
                      <span className="depth-threat-name">{t.name}</span>
                      <span className="depth-threat-blurb">{t.blurb}</span>
                    </span>
                    <span className="depth-threat-pts">+{t.points}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {points > 0 && (
            <button type="button" className="depth-threat-clear" onClick={() => setOn(saveThreat([]))}>
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
