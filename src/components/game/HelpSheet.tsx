import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type Page = {
  kicker: string;
  title: string;
  lines: string[];
};

const PAGES: Page[] = [
  {
    kicker: "01 · Lane",
    title: "Hold the lane",
    lines: [
      "Enemies walk the warp lane toward Home.",
      "Guns sit on moons along the way.",
      "Stop them before they reach the planet.",
    ],
  },
  {
    kicker: "02 · Draft",
    title: "Draft once",
    lines: [
      "You pick cards before the fight. The fight never stops for a pack.",
      "First: two guns that already work together.",
      "Then more guns for empty moons.",
      "Last: two Signals. Then you plant.",
    ],
  },
  {
    kicker: "03 · Guns",
    title: "Plant on moons",
    lines: [
      "Tap a lit moon to plant a gun.",
      "Empty moons stay dark.",
      "Your main craft is already flying.",
      "Hit Defend when the moons are set.",
    ],
  },
  {
    kicker: "04 · Signals",
    title: "Two run rules",
    lines: [
      "A Signal is a rule for this run. It is not a gun.",
      "You pick two. They stay on. They never get used up.",
      "Twin spark: shots jump one extra time.",
    ],
  },
  {
    kicker: "05 · Grow",
    title: "Spend Credit on the gun",
    lines: [
      "Tap a planted gun to open its tree.",
      "Level-up chips pick a special. A small glow sits under the gun. It still shoots.",
      "Credit is paid on that gun. Not in a shop.",
      "Walk two lines. Grow what it already does.",
    ],
  },
  {
    kicker: "06 · Keep",
    title: "Hold 12. Bank Credit.",
    lines: [
      "Survive 12 waves. That is a win.",
      "Then keep flying for score, or return and draft again.",
      "Kills pay Credit. Spend it in the Vault between games.",
      "First Vault buys take a few wins.",
    ],
  },
];

export function HelpSheet({ onClose }: { onClose: () => void }) {
  const [page, setPage] = useState(0);
  const last = page === PAGES.length - 1;
  const copy = PAGES[page]!;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setPage((p) => Math.min(PAGES.length - 1, p + 1));
      if (e.key === "ArrowLeft") setPage((p) => Math.max(0, p - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="brief-stage" role="dialog" aria-label="Briefing" onClick={onClose}>
      <div className="brief-panel" onClick={(e) => e.stopPropagation()}>
        <header className="brief-head">
          <div>
            <p className="brief-mark">Briefing</p>
            <p className="brief-kicker">{copy.kicker}</p>
            <h2 className="brief-title">{copy.title}</h2>
          </div>
          <button type="button" onClick={onClose} className="ui-btn ui-btn-ghost ui-btn-icon shrink-0" aria-label="Close">
            <X className="size-5" />
          </button>
        </header>

        <div className="how-stage brief-visual" key={page}>
          <HowVisual page={page} />
        </div>

        <div className="brief-copy">
          {copy.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        <div className="brief-dots">
          {PAGES.map((p, i) => (
            <button
              key={p.kicker}
              type="button"
              aria-label={p.title}
              aria-current={i === page}
              onClick={() => setPage(i)}
              className="brief-dot-hit"
            >
              <span className={cn("brief-dot", i === page && "is-on")} />
            </button>
          ))}
        </div>

        <footer className="brief-foot">
          <button
            type="button"
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="brief-nav"
          >
            <span className="brief-chev brief-chev-l" aria-hidden="true" />
            <span>Back</span>
            <span className="brief-chev-slot" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => (last ? onClose() : setPage(page + 1))}
            className="brief-nav brief-nav-go"
          >
            <span className="brief-chev-slot" aria-hidden="true" />
            <span>{last ? "Got it" : "Next"}</span>
            {last ? (
              <span className="brief-chev-slot" aria-hidden="true" />
            ) : (
              <span className="brief-chev brief-chev-r" aria-hidden="true" />
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}

function HowVisual({ page }: { page: number }) {
  switch (page) {
    case 0:
      return <GoalMap />;
    case 1:
      return <DraftPack />;
    case 2:
      return <PlaceShade />;
    case 3:
      return <SignalPick />;
    case 4:
      return <GrowGun />;
    default:
      return <KeepVault />;
  }
}

function GoalMap() {
  return (
    <div className="how-map how-map-run" aria-hidden>
      <svg className="how-lane-svg" viewBox="0 0 360 140" role="img">
        <title>Enemies walk the warp lane from Gate to Home</title>
        <path
          className="how-lane-stroke"
          d="M 52 70 H 286"
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <polygon className="how-lane-arrow" points="276,63 292,70 276,77" />
        <polygon className="how-enemy" points="96,70 104,64 112,70 104,76" />
        <polygon className="how-enemy" points="156,70 164,64 172,70 164,76" />
        <polygon className="how-enemy how-enemy-dim" points="216,70 223,65 230,70 223,75" />
        <circle className="how-moon" cx="132" cy="40" r="9" />
        <circle className="how-moon-core" cx="132" cy="40" r="3.5" />
        <rect className="how-moon-gun" x="127.5" y="24" width="9" height="18" rx="1" />
        <circle className="how-moon" cx="200" cy="100" r="9" />
        <circle className="how-moon-core" cx="200" cy="100" r="3.5" />
        <text className="how-svg-note" x="132" y="16" textAnchor="middle">
          Moon
        </text>
        <text className="how-svg-note" x="200" y="122" textAnchor="middle">
          Moon
        </text>
        <circle className="how-gate-dot" cx="28" cy="70" r="18" />
        <text className="how-svg-home" x="28" y="74" textAnchor="middle">
          Gate
        </text>
        <circle className="how-home-dot" cx="328" cy="70" r="22" />
        <text className="how-svg-home" x="328" y="74" textAnchor="middle">
          Home
        </text>
      </svg>
    </div>
  );
}

function GrowGun() {
  return (
    <div className="how-kinds how-kinds-2" aria-hidden>
      <MiniCard kind="Gun" name="Well" set="Tap to grow" tone="frost" />
      <MiniCard kind="Credit" name="On the gun" set="Not a shop" tone="ember" />
    </div>
  );
}

function MiniCard({
  kind,
  name,
  set,
  tone,
}: {
  kind: string;
  name: string;
  set: string;
  tone: "ember" | "frost" | "accent";
}) {
  return (
    <div className={cn("how-mini", `how-mini-${tone}`)}>
      <p className="how-mini-gem">{kind}</p>
      <div className="how-mini-art" />
      <p className="how-mini-name">{name}</p>
      <p className="how-mini-set">{set}</p>
    </div>
  );
}

function DraftPack() {
  return (
    <div className="how-draft" aria-hidden>
      <div className="how-draft-row">
        <MiniCard kind="Two guns" name="Pierce" set="Goes through. Ice slows." tone="ember" />
        <MiniCard kind="Gun" name="Well" set="Drags enemies in" tone="frost" />
        <MiniCard kind="This run" name="Twin spark" set="Shots jump extra" tone="accent" />
      </div>
      <p className="how-live how-live-on">3 pick 1 · then you plant</p>
    </div>
  );
}

function SignalPick() {
  return (
    <div className="how-kinds how-kinds-2" aria-hidden>
      <MiniCard kind="This run" name="Twin spark" set="Shots jump extra" tone="accent" />
      <MiniCard kind="This run" name="Long freeze" set="Freeze lasts" tone="frost" />
    </div>
  );
}

function PlaceShade() {
  return (
    <div className="how-place" aria-hidden>
      <div className="how-place-lane" />
      <div className="how-shade" />
      <div className="how-pad" />
      <div className="how-gun" />
      <p className="how-live how-live-on">Shade = what it can hit</p>
    </div>
  );
}

function KeepVault() {
  return (
    <div className="how-keep" aria-hidden>
      <span className="how-flux how-flux-1" />
      <span className="how-flux how-flux-2" />
      <span className="how-flux how-flux-3" />
      <div className="how-vault">
        <p className="how-vault-kicker">Vault</p>
        <p className="how-vault-title">What you saved</p>
      </div>
      <p className="how-live how-live-on">Credit stays. Vault between games.</p>
    </div>
  );
}
