import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { markTip } from "@/game/data/glossary";

export function HintTip({
  text,
  children,
  className,
}: {
  text: string;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className="absolute left-0 top-full z-40 mt-1 w-56 rounded-md border border-line bg-ink px-2.5 py-2 text-[12px] font-normal normal-case tracking-normal text-muted shadow-panel"
        >
          {text}
        </span>
      )}
    </span>
  );
}

export function FirstTip({ tip }: { tip: { id: string; text: string } | null }) {
  const [show, setShow] = useState(tip);
  useEffect(() => {
    setShow(tip);
    if (tip) markTip(tip.id);
  }, [tip]);
  if (!show) return null;
  return (
    <button
      type="button"
      onClick={() => setShow(null)}
      className="mt-3 w-full rounded-md border border-frost/40 bg-ink-2 px-3 py-2 text-left text-[13px] leading-snug text-paper"
    >
      <span className="block text-[10px] font-medium tracking-[0.16em] text-frost">Tip</span>
      <span className="mt-0.5 block text-muted">{show.text}</span>
    </button>
  );
}
