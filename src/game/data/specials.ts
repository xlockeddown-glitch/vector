/** This-game Level-up picks. Quiet levels pick a part. These are the chips you tap. */

export type SynergyTag = "burn" | "frost" | "heal" | "yank" | "light" | "poison";

export type SpecialKind = "gun" | "craft";

export type SpecialDef = {
  id: string;
  name: string;
  blurb: string;
  kind: SpecialKind;
  round: 1 | 2 | 3 | 4 | 5;
  /** Hull role or craft template id. Shared picks leave this empty. */
  uniqueFor?: string;
  tag?: SynergyTag;
  pair?: string;
  gun?: {
    burnDps?: number;
    slowMul?: number;
    slowT?: number;
    poisonDps?: number;
    healAura?: number;
    auraDps?: number;
    rateMul?: number;
    dmgMul?: number;
    rangeMul?: number;
    splash?: number;
    knock?: number;
    sendHome?: number;
    chain?: number;
    coverArcMul?: number;
    shred?: number;
    markGold?: number;
    trick?: "drones" | "lip" | "hotslam" | "wake";
  };
  craft?: {
    dpsMul?: number;
    radiusMul?: number;
    interceptMul?: number;
    hpMul?: number;
    specialPeriodMul?: number;
    burnDps?: number;
    healMul?: number;
    knockMul?: number;
    buffMul?: number;
    cutDps?: number;
    cutSlow?: number;
    shred?: number;
    goldMul?: number;
    trail?: boolean;
    hunt?: boolean;
    trick?: "nova" | "storm" | "eclipse";
  };
};

export const GUN_PICK_AT = [2, 4, 6, 8, 10] as const;
export const CRAFT_PICK_AT = [3, 6, 9, 12] as const;

export const SPECIALS: SpecialDef[] = [
  // Gun shared 1 — status
  { id: "g-burn", name: "Sunfire", blurb: "Shots light enemies on fire.", kind: "gun", round: 1, tag: "burn", pair: "Pairs with burn crafts.", gun: { burnDps: 8 } },
  { id: "g-slow", name: "Drift", blurb: "Shots make enemies crawl.", kind: "gun", round: 1, tag: "frost", pair: "Pairs with ice crafts.", gun: { slowMul: 0.62, slowT: 1.6 } },
  { id: "g-poison", name: "Sting", blurb: "A sting.", kind: "gun", round: 1, tag: "poison", pair: "Pairs with poison crafts.", gun: { poisonDps: 7 } },
  // Gun shared 2 — aura
  { id: "g-heal", name: "Dock glow", blurb: "Heals crafts that fly near it.", kind: "gun", round: 2, tag: "heal", pair: "Pairs with heal crafts.", gun: { healAura: 6 } },
  { id: "g-hurt", name: "Sun glow", blurb: "Burns enemies near it. Still shoots.", kind: "gun", round: 2, tag: "burn", pair: "Pairs with burn crafts.", gun: { auraDps: 10 } },
  { id: "g-fast", name: "Rapid", blurb: "Shoots 22% more often.", kind: "gun", round: 2, tag: "light", pair: "Pairs with light crafts.", gun: { rateMul: 1.22 } },
  // Gun shared 3 — push
  { id: "g-gate", name: "Gate toss", blurb: "Sometimes shoves enemies back to the gate.", kind: "gun", round: 3, tag: "yank", pair: "Pairs with yank crafts.", gun: { sendHome: 0.05 } },
  { id: "g-knock", name: "Shove", blurb: "Hits shove a clump backward.", kind: "gun", round: 3, tag: "yank", pair: "Pairs with yank crafts.", gun: { knock: 36 } },
  { id: "g-jump", name: "Hop", blurb: "A shot can hop to one more enemy.", kind: "gun", round: 3, gun: { chain: 1 } },
  // Gun shared 4 — shape
  { id: "g-wide", name: "Wide shade", blurb: "Hits a wider shade.", kind: "gun", round: 4, gun: { rangeMul: 1.16, coverArcMul: 1.2 } },
  { id: "g-splash", name: "Burst", blurb: "Hits splash onto nearby enemies.", kind: "gun", round: 4, tag: "burn", gun: { splash: 56 } },
  { id: "g-lip", name: "Rim", blurb: "A rim slows enemies that get close.", kind: "gun", round: 4, tag: "frost", pair: "Pairs with ice crafts.", gun: { trick: "lip" } },
  // Gun shared 5 — signature-ish
  { id: "g-drones", name: "Sats", blurb: "Two little guns fly with it.", kind: "gun", round: 5, gun: { trick: "drones" } },
  { id: "g-slam", name: "Sun slam", blurb: "Slam hits a wider ring.", kind: "gun", round: 5, tag: "burn", gun: { trick: "hotslam" } },
  { id: "g-wake", name: "Ion wake", blurb: "Hits farther.", kind: "gun", round: 5, gun: { trick: "wake", rangeMul: 1.12 } },
  // Gun unique round 5
  { id: "g-spike", name: "Deep lance", blurb: "Hits farther down the cone.", kind: "gun", round: 5, uniqueFor: "spear", gun: { rangeMul: 1.2, shred: 0.12 } },
  { id: "g-well", name: "Wide crater", blurb: "Splash covers more enemies.", kind: "gun", round: 5, uniqueFor: "crater", tag: "burn", gun: { splash: 90 } },
  { id: "g-rime", name: "Long halo", blurb: "Frost sticks longer.", kind: "gun", round: 5, uniqueFor: "frost", tag: "frost", pair: "Pairs with ice crafts.", gun: { slowMul: 0.48, slowT: 2.4 } },
  { id: "g-rail", name: "Warm rail", blurb: "The rail patches crafts more.", kind: "gun", round: 5, uniqueFor: "rail", tag: "heal", gun: { healAura: 8, rateMul: 1.15 } },
  { id: "g-dish", name: "Hard well", blurb: "Pulls enemies harder.", kind: "gun", round: 5, uniqueFor: "umbra", tag: "yank", gun: { dmgMul: 1.2 } },
  { id: "g-arc", name: "Long ion", blurb: "Spark jumps one more enemy.", kind: "gun", round: 5, uniqueFor: "cascade", gun: { chain: 2 } },
  { id: "g-fan", name: "Wide corona", blurb: "The cone covers more path.", kind: "gun", round: 5, uniqueFor: "sweep", gun: { coverArcMul: 1.35, rangeMul: 1.1 } },
  { id: "g-mark", name: "Rich beacon", blurb: "Beacon kills pay more.", kind: "gun", round: 5, uniqueFor: "brand", gun: { markGold: 0.8, dmgMul: 1.12 } },
  { id: "g-pit", name: "More mines", blurb: "Drops mines more often.", kind: "gun", round: 5, uniqueFor: "mine", gun: { rateMul: 1.28 } },
  { id: "g-helix", name: "Twin helix", blurb: "Both barrels jump one more enemy.", kind: "gun", round: 5, uniqueFor: "orbit", gun: { chain: 1, rateMul: 1.12 } },

  // Craft shared 1
  { id: "c-catch", name: "Catch", blurb: "Eats grenades from farther.", kind: "craft", round: 1, craft: { interceptMul: 1.4 } },
  { id: "c-wing", name: "Wing", blurb: "Hull +22%.", kind: "craft", round: 1, craft: { hpMul: 1.22 } },
  { id: "c-fast", name: "Quick job", blurb: "Sooner.", kind: "craft", round: 1, tag: "light", pair: "Pairs with fast-shot guns.", craft: { specialPeriodMul: 0.78 } },
  // Craft shared 2
  { id: "c-trail", name: "Trail", blurb: "Burns enemies it flies over.", kind: "craft", round: 2, tag: "burn", pair: "Pairs with burn guns.", craft: { burnDps: 8, trail: true } },
  { id: "c-heal", name: "Heal pulse", blurb: "Heals friends more.", kind: "craft", round: 2, tag: "heal", pair: "Pairs with patch guns.", craft: { healMul: 1.35 } },
  { id: "c-yank", name: "Yank", blurb: "Shoves enemies farther back.", kind: "craft", round: 2, tag: "yank", pair: "Pairs with knock guns.", craft: { knockMul: 1.45 } },
  // Craft shared 3
  { id: "c-hunt", name: "Hunt", blurb: "Hunts farther off gun light.", kind: "craft", round: 3, craft: { hunt: true, radiusMul: 1.2 } },
  { id: "c-crew", name: "Crew mend", blurb: "Friends heal when this craft is near.", kind: "craft", round: 3, tag: "heal", pair: "Pairs with patch guns.", craft: { healMul: 1.2, radiusMul: 1.15 } },
  { id: "c-far", name: "Far catch", blurb: "Eats bombs from way out.", kind: "craft", round: 3, craft: { interceptMul: 1.55 } },

  // Craft uniques — round 1
  { id: "c-auger-1", name: "Deeper cut", blurb: "Auger’s trench chips harder.", kind: "craft", round: 1, uniqueFor: "comp-auger", craft: { cutDps: 12, dpsMul: 1.12 } },
  { id: "c-boost-1", name: "Hot engine", blurb: "Boost lights guns harder.", kind: "craft", round: 1, uniqueFor: "comp-boost", tag: "light", pair: "Pairs with fast-shot guns.", craft: { buffMul: 1.35, burnDps: 6 } },
  { id: "c-shrike-1", name: "Peel dive", blurb: "Dive strips more armor.", kind: "craft", round: 1, uniqueFor: "comp-shrike", craft: { shred: 0.2, dpsMul: 1.12 } },
  { id: "c-torch-1", name: "Hop burn", blurb: "Fire hops enemy to enemy.", kind: "craft", round: 1, uniqueFor: "comp-torch", tag: "burn", pair: "Pairs with burn guns.", craft: { burnDps: 10, radiusMul: 1.15 } },
  { id: "c-kelvin-1", name: "Leave ice", blurb: "They stay icy.", kind: "craft", round: 1, uniqueFor: "comp-kelvin", tag: "frost", pair: "Pairs with slow guns.", craft: { cutSlow: 0.55 } },
  { id: "c-joule-1", name: "Spark ride", blurb: "Shots hitch a ride on Joule.", kind: "craft", round: 1, uniqueFor: "comp-joule", craft: { dpsMul: 1.15 } },
  { id: "c-rook-1", name: "Long reach", blurb: "Nearby guns reach farther.", kind: "craft", round: 1, uniqueFor: "comp-rook", tag: "light", craft: { buffMul: 1.2, radiusMul: 1.12 } },
  { id: "c-zeek-1", name: "Hard yank", blurb: "The beam pulls farther back.", kind: "craft", round: 1, uniqueFor: "comp-zeek", tag: "yank", pair: "Pairs with knock guns.", craft: { knockMul: 1.5 } },
  { id: "c-torr-1", name: "Pay bite", blurb: "Torr's kills pay.", kind: "craft", round: 1, uniqueFor: "comp-torr", craft: { goldMul: 1.2, dpsMul: 1.1 } },
  { id: "c-halo-1", name: "Pad kiss", blurb: "Guns Gyre kisses shoot faster.", kind: "craft", round: 1, uniqueFor: "comp-halo", tag: "light", pair: "Pairs with fast-shot guns.", craft: { buffMul: 1.4 } },
  { id: "c-poppy-1", name: "Strong heal", blurb: "Bloom heals more.", kind: "craft", round: 1, uniqueFor: "comp-poppy", tag: "heal", pair: "Pairs with patch guns.", craft: { healMul: 1.35 } },
  { id: "c-puck-1", name: "Hard bump", blurb: "Knocks a clump farther home.", kind: "craft", round: 1, uniqueFor: "comp-puck", tag: "yank", pair: "Pairs with knock guns.", craft: { knockMul: 1.4 } },
  { id: "c-chis-1", name: "Walk home", blurb: "Walks hurt friends home faster.", kind: "craft", round: 1, uniqueFor: "comp-chis", tag: "heal", craft: { healMul: 1.25, specialPeriodMul: 0.85 } },

  // Craft uniques — round 2
  { id: "c-auger-2", name: "Wide trench", blurb: "Wider. They slog.", kind: "craft", round: 2, uniqueFor: "comp-auger", tag: "frost", craft: { radiusMul: 1.4, cutSlow: 0.48 } },
  { id: "c-boost-2", name: "Wide light", blurb: "More guns light up as she passes.", kind: "craft", round: 2, uniqueFor: "comp-boost", tag: "light", pair: "Pairs with fast-shot guns.", craft: { radiusMul: 1.35, buffMul: 1.2 } },
  { id: "c-shrike-2", name: "Hard dive", blurb: "Dive hits sooner and harder.", kind: "craft", round: 2, uniqueFor: "comp-shrike", craft: { dpsMul: 1.2, specialPeriodMul: 0.75 } },
  { id: "c-torch-2", name: "Wider roar", blurb: "Fire covers more path.", kind: "craft", round: 2, uniqueFor: "comp-torch", tag: "burn", pair: "Pairs with burn guns.", craft: { radiusMul: 1.35 } },
  { id: "c-kelvin-2", name: "Hard freeze", blurb: "Ice holds longer.", kind: "craft", round: 2, uniqueFor: "comp-kelvin", tag: "frost", pair: "Pairs with slow guns.", craft: { cutSlow: 0.42, radiusMul: 1.18 } },
  { id: "c-joule-2", name: "Fast spark", blurb: "Sparks fly sooner.", kind: "craft", round: 2, uniqueFor: "comp-joule", craft: { specialPeriodMul: 0.72, dpsMul: 1.12 } },
  { id: "c-rook-2", name: "Tough truck", blurb: "Hauler takes more hits.", kind: "craft", round: 2, uniqueFor: "comp-rook", craft: { hpMul: 1.28 } },
  { id: "c-zeek-2", name: "Sticky beam", blurb: "The beam slows enemies more.", kind: "craft", round: 2, uniqueFor: "comp-zeek", tag: "frost", craft: { cutSlow: 0.58 } },
  { id: "c-torr-2", name: "Harder bite", blurb: "Torr hits harder.", kind: "craft", round: 2, uniqueFor: "comp-torr", craft: { dpsMul: 1.22 } },
  { id: "c-halo-2", name: "Fast ring", blurb: "The ring buffs sooner.", kind: "craft", round: 2, uniqueFor: "comp-halo", tag: "light", craft: { specialPeriodMul: 0.75, buffMul: 1.15 } },
  { id: "c-poppy-2", name: "Petal blast", blurb: "Petals hit a bigger clump and burn.", kind: "craft", round: 2, uniqueFor: "comp-poppy", tag: "burn", pair: "Pairs with burn guns.", craft: { radiusMul: 1.32, burnDps: 6 } },
  { id: "c-puck-2", name: "Wide bump", blurb: "The bump hits a bigger clump.", kind: "craft", round: 2, uniqueFor: "comp-puck", tag: "yank", craft: { radiusMul: 1.3, knockMul: 1.2 } },
  { id: "c-chis-2", name: "Strong patch", blurb: "Stitch heals more.", kind: "craft", round: 2, uniqueFor: "comp-chis", tag: "heal", pair: "Pairs with patch guns.", craft: { healMul: 1.4 } },

  // Craft uniques — round 3
  { id: "c-auger-3", name: "Fast Plunge", blurb: "Plunge drops sooner.", kind: "craft", round: 3, uniqueFor: "comp-auger", craft: { specialPeriodMul: 0.7 } },
  { id: "c-boost-3", name: "Crew light", blurb: "Boost lights crafts she flies by, harder.", kind: "craft", round: 3, uniqueFor: "comp-boost", tag: "light", pair: "Pairs with fast-shot guns.", craft: { buffMul: 1.5, radiusMul: 1.2 } },
  { id: "c-shrike-3", name: "Stop bombs", blurb: "Snatches grenades from farther.", kind: "craft", round: 3, uniqueFor: "comp-shrike", craft: { interceptMul: 1.5 } },
  { id: "c-torch-3", name: "Fast pounce", blurb: "Zap hits sooner and harder.", kind: "craft", round: 3, uniqueFor: "comp-torch", tag: "burn", pair: "Pairs with burn guns.", craft: { dpsMul: 1.18, specialPeriodMul: 0.72 } },
  { id: "c-kelvin-3", name: "Ice path", blurb: "The lane stays icy behind Kelvin.", kind: "craft", round: 3, uniqueFor: "comp-kelvin", tag: "frost", pair: "Pairs with slow guns.", craft: { radiusMul: 1.25, cutSlow: 0.5, trail: true } },
  { id: "c-joule-3", name: "Bounce spark", blurb: "Sparks bounce through Joule.", kind: "craft", round: 3, uniqueFor: "comp-joule", craft: { dpsMul: 1.2, radiusMul: 1.2 } },
  { id: "c-rook-3", name: "Home reach", blurb: "Home guns reach farther too.", kind: "craft", round: 3, uniqueFor: "comp-rook", tag: "light", craft: { buffMul: 1.25, radiusMul: 1.25 } },
  { id: "c-zeek-3", name: "Trash pay", blurb: "Yanked kills pay.", kind: "craft", round: 3, uniqueFor: "comp-zeek", tag: "yank", craft: { goldMul: 1.18, knockMul: 1.2 } },
  { id: "c-torr-3", name: "Pay burst", blurb: "Big kills pay a lot.", kind: "craft", round: 3, uniqueFor: "comp-torr", craft: { goldMul: 1.28, dpsMul: 1.15 } },
  { id: "c-halo-3", name: "All pads", blurb: "Every pad Gyre kissed stays hot longer.", kind: "craft", round: 3, uniqueFor: "comp-halo", tag: "light", pair: "Pairs with fast-shot guns.", craft: { buffMul: 1.3, radiusMul: 1.35 } },
  { id: "c-poppy-3", name: "Faster guns", blurb: "Nearby guns shoot a bit faster.", kind: "craft", round: 3, uniqueFor: "comp-poppy", tag: "light", pair: "Pairs with fast-shot guns.", craft: { buffMul: 1.22, specialPeriodMul: 0.85 } },
  { id: "c-puck-3", name: "Clump home", blurb: "Knocks a whole clump toward the gate.", kind: "craft", round: 3, uniqueFor: "comp-puck", tag: "yank", pair: "Pairs with knock guns.", craft: { knockMul: 1.55, radiusMul: 1.2 } },
  { id: "c-chis-3", name: "Far rescue", blurb: "Farther. Heal +20%.", kind: "craft", round: 3, uniqueFor: "comp-chis", tag: "heal", pair: "Pairs with patch guns.", craft: { radiusMul: 1.4, healMul: 1.2 } },

  { id: "c-auger-1b", name: "Harder bite", blurb: "Auger hits 18% harder.", kind: "craft", round: 1, uniqueFor: "comp-auger", craft: { dpsMul: 1.18 } },
  { id: "c-boost-1b", name: "Catch more", blurb: "Eats grenades from 40% farther.", kind: "craft", round: 1, uniqueFor: "comp-boost", craft: { interceptMul: 1.4 } },
  { id: "c-shrike-1b", name: "Fast wing", blurb: "Special comes 20% sooner.", kind: "craft", round: 1, uniqueFor: "comp-shrike", craft: { specialPeriodMul: 0.8 } },
  { id: "c-torch-1b", name: "Hotter roar", blurb: "Burn +8. Hits 10% harder.", kind: "craft", round: 1, uniqueFor: "comp-torch", tag: "burn", craft: { burnDps: 8, dpsMul: 1.1 } },
  { id: "c-kelvin-1b", name: "Ice hull", blurb: "Hull +20%. They stay icy.", kind: "craft", round: 1, uniqueFor: "comp-kelvin", tag: "frost", craft: { hpMul: 1.2, cutSlow: 0.62 } },
  { id: "c-joule-1b", name: "Wide spark", blurb: "Reach +18%. Sparks hitch farther.", kind: "craft", round: 1, uniqueFor: "comp-joule", craft: { radiusMul: 1.18 } },
  { id: "c-rook-1b", name: "Guard", blurb: "Hull +18%. Home is safer.", kind: "craft", round: 1, uniqueFor: "comp-rook", craft: { hpMul: 1.18 } },
  { id: "c-zeek-1b", name: "Far beam", blurb: "Reach +20%. Pulls from farther.", kind: "craft", round: 1, uniqueFor: "comp-zeek", tag: "yank", craft: { radiusMul: 1.2 } },
  { id: "c-torr-1b", name: "Gold tooth", blurb: "Kills pay 15% more.", kind: "craft", round: 1, uniqueFor: "comp-torr", craft: { goldMul: 1.15 } },
  { id: "c-halo-1b", name: "Wide kiss", blurb: "Reach +18%. More pads light.", kind: "craft", round: 1, uniqueFor: "comp-halo", tag: "light", craft: { radiusMul: 1.18 } },
  { id: "c-poppy-1b", name: "Far petal", blurb: "Reach +20%. Heals +15%.", kind: "craft", round: 1, uniqueFor: "comp-poppy", tag: "heal", craft: { radiusMul: 1.2, healMul: 1.15 } },
  { id: "c-puck-1b", name: "Hard hull", blurb: "Hull +22%. Bumps stay mean.", kind: "craft", round: 1, uniqueFor: "comp-puck", craft: { hpMul: 1.22 } },
  { id: "c-chis-1b", name: "Quick stitch", blurb: "Patch comes 18% sooner.", kind: "craft", round: 1, uniqueFor: "comp-chis", tag: "heal", craft: { specialPeriodMul: 0.82 } },
  { id: "c-sink-1", name: "Wide well", blurb: "Bends grenades from 30% farther.", kind: "craft", round: 1, uniqueFor: "comp-sink", craft: { radiusMul: 1.3, interceptMul: 1.2 } },
  { id: "c-sink-1b", name: "Hard well", blurb: "Hull +20%. The well holds.", kind: "craft", round: 1, uniqueFor: "comp-sink", craft: { hpMul: 1.2 } },

  { id: "c-auger-2b", name: "Mean trench", blurb: "Cut +10. Hits 12% harder.", kind: "craft", round: 2, uniqueFor: "comp-auger", craft: { cutDps: 10, dpsMul: 1.12 } },
  { id: "c-boost-2b", name: "Hot trail", blurb: "Burns enemies she flies over. Burn +8.", kind: "craft", round: 2, uniqueFor: "comp-boost", tag: "burn", craft: { burnDps: 8, trail: true } },
  { id: "c-shrike-2b", name: "Far dive", blurb: "Reach +22%. Dive from farther.", kind: "craft", round: 2, uniqueFor: "comp-shrike", craft: { radiusMul: 1.22 } },
  { id: "c-torch-2b", name: "Fast roar", blurb: "Zap 22% sooner.", kind: "craft", round: 2, uniqueFor: "comp-torch", tag: "burn", craft: { specialPeriodMul: 0.78 } },
  { id: "c-kelvin-2b", name: "Ice trail", blurb: "Leaves ice on the lane.", kind: "craft", round: 2, uniqueFor: "comp-kelvin", tag: "frost", craft: { trail: true, cutSlow: 0.52 } },
  { id: "c-joule-2b", name: "Hard spark", blurb: "Hits 20% harder.", kind: "craft", round: 2, uniqueFor: "comp-joule", craft: { dpsMul: 1.2 } },
  { id: "c-rook-2b", name: "Wide current", blurb: "Reach +22%. Guns reach more.", kind: "craft", round: 2, uniqueFor: "comp-rook", tag: "light", craft: { radiusMul: 1.22, buffMul: 1.15 } },
  { id: "c-zeek-2b", name: "Pay yank", blurb: "Yanked kills pay.", kind: "craft", round: 2, uniqueFor: "comp-zeek", tag: "yank", craft: { goldMul: 1.16 } },
  { id: "c-torr-2b", name: "Far bite", blurb: "Reach +20%. Shark hunts farther.", kind: "craft", round: 2, uniqueFor: "comp-torr", craft: { radiusMul: 1.2 } },
  { id: "c-halo-2b", name: "Tough ring", blurb: "Hull +24%.", kind: "craft", round: 2, uniqueFor: "comp-halo", craft: { hpMul: 1.24 } },
  { id: "c-poppy-2b", name: "Fast mill", blurb: "Bloom 22% sooner.", kind: "craft", round: 2, uniqueFor: "comp-poppy", craft: { specialPeriodMul: 0.78 } },
  { id: "c-puck-2b", name: "Fast bump", blurb: "Bump 22% sooner.", kind: "craft", round: 2, uniqueFor: "comp-puck", tag: "yank", craft: { specialPeriodMul: 0.78 } },
  { id: "c-chis-2b", name: "Far stitch", blurb: "Reach +25%. Rescue from farther.", kind: "craft", round: 2, uniqueFor: "comp-chis", tag: "heal", craft: { radiusMul: 1.25 } },
  { id: "c-sink-2", name: "Deep well", blurb: "Bend 25% sooner.", kind: "craft", round: 2, uniqueFor: "comp-sink", craft: { specialPeriodMul: 0.75 } },
  { id: "c-sink-2b", name: "Pay bend", blurb: "Bent bombs pay.", kind: "craft", round: 2, uniqueFor: "comp-sink", craft: { goldMul: 1.16 } },

  { id: "c-auger-3b", name: "Crew cut", blurb: "Friends near Auger hit 15% harder.", kind: "craft", round: 3, uniqueFor: "comp-auger", craft: { buffMul: 1.15, dpsMul: 1.1 } },
  { id: "c-boost-3b", name: "Steel hull", blurb: "Hull +28%.", kind: "craft", round: 3, uniqueFor: "comp-boost", craft: { hpMul: 1.28 } },
  { id: "c-shrike-3b", name: "Peel more", blurb: "Strips 12% more armor.", kind: "craft", round: 3, uniqueFor: "comp-shrike", craft: { shred: 0.12, dpsMul: 1.1 } },
  { id: "c-torch-3b", name: "Trail fire", blurb: "Leaves fire on the path.", kind: "craft", round: 3, uniqueFor: "comp-torch", tag: "burn", craft: { trail: true, burnDps: 8 } },
  { id: "c-kelvin-3b", name: "Crew ice", blurb: "Friends near Kelvin slow more.", kind: "craft", round: 3, uniqueFor: "comp-kelvin", tag: "frost", craft: { buffMul: 1.12, cutSlow: 0.5 } },
  { id: "c-joule-3b", name: "Pay spark", blurb: "Kills pay 18% more.", kind: "craft", round: 3, uniqueFor: "comp-joule", craft: { goldMul: 1.18 } },
  { id: "c-rook-3b", name: "Catch truck", blurb: "Eats grenades from farther.", kind: "craft", round: 3, uniqueFor: "comp-rook", craft: { interceptMul: 1.45 } },
  { id: "c-zeek-3b", name: "Hard hull", blurb: "Hull +26%.", kind: "craft", round: 3, uniqueFor: "comp-zeek", craft: { hpMul: 1.26 } },
  { id: "c-torr-3b", name: "Fast bite", blurb: "Bite 22% sooner.", kind: "craft", round: 3, uniqueFor: "comp-torr", craft: { specialPeriodMul: 0.78 } },
  { id: "c-halo-3b", name: "Catch ring", blurb: "Eats grenades from farther.", kind: "craft", round: 3, uniqueFor: "comp-halo", craft: { interceptMul: 1.4 } },
  { id: "c-poppy-3b", name: "Crew mend", blurb: "Heal +30%. Friends mend too.", kind: "craft", round: 3, uniqueFor: "comp-poppy", tag: "heal", craft: { healMul: 1.3 } },
  { id: "c-puck-3b", name: "Pay bump", blurb: "Bumped kills pay.", kind: "craft", round: 3, uniqueFor: "comp-puck", tag: "yank", craft: { goldMul: 1.16 } },
  { id: "c-chis-3b", name: "Steel wing", blurb: "Hull +30%.", kind: "craft", round: 3, uniqueFor: "comp-chis", craft: { hpMul: 1.3 } },
  { id: "c-sink-3", name: "Eat fire", blurb: "Eats grenades from way out.", kind: "craft", round: 3, uniqueFor: "comp-sink", craft: { interceptMul: 1.55 } },
  { id: "c-sink-3b", name: "Crew well", blurb: "Friends near Sink take less.", kind: "craft", round: 3, uniqueFor: "comp-sink", craft: { hpMul: 1.15, radiusMul: 1.2 } },

  // Craft shared 4 — Endless late light
  { id: "c-nova", name: "Nova", blurb: "A gold burst hits a wide ring.", kind: "craft", round: 4, tag: "burn", craft: { dpsMul: 1.22, radiusMul: 1.28, burnDps: 12, trick: "nova" } },
  { id: "c-storm", name: "Storm", blurb: "Sparks jump from enemy to enemy.", kind: "craft", round: 4, tag: "light", craft: { dpsMul: 1.18, radiusMul: 1.2, trick: "storm" } },
  { id: "c-eclipse", name: "Eclipse", blurb: "A dark pull holds enemies still.", kind: "craft", round: 4, tag: "yank", craft: { knockMul: 1.35, cutSlow: 0.48, trick: "eclipse" } },

  { id: "c-auger-4", name: "Gold pit", blurb: "Plunge drops a gold pit.", kind: "craft", round: 4, uniqueFor: "comp-auger", craft: { cutDps: 16, dpsMul: 1.2, trick: "nova" } },
  { id: "c-auger-4b", name: "Storm trench", blurb: "The trench flashes and bites.", kind: "craft", round: 4, uniqueFor: "comp-auger", craft: { radiusMul: 1.35, dpsMul: 1.15, trick: "storm" } },
  { id: "c-boost-4", name: "Sun flare", blurb: "Engine flare burns a wide ring.", kind: "craft", round: 4, uniqueFor: "comp-boost", tag: "burn", craft: { burnDps: 14, buffMul: 1.3, trick: "nova" } },
  { id: "c-boost-4b", name: "Spark ride", blurb: "Sparks jump off her trail.", kind: "craft", round: 4, uniqueFor: "comp-boost", tag: "light", craft: { radiusMul: 1.3, buffMul: 1.2, trick: "storm" } },
  { id: "c-shrike-4", name: "Black sun", blurb: "Dive hits with a dark burst.", kind: "craft", round: 4, uniqueFor: "comp-shrike", craft: { dpsMul: 1.28, shred: 0.16, trick: "eclipse" } },
  { id: "c-shrike-4b", name: "Storm dive", blurb: "Dive sparks jump the clump.", kind: "craft", round: 4, uniqueFor: "comp-shrike", craft: { dpsMul: 1.2, specialPeriodMul: 0.7, trick: "storm" } },
  { id: "c-torch-4", name: "Sun roar", blurb: "Fire bursts in a gold ring.", kind: "craft", round: 4, uniqueFor: "comp-torch", tag: "burn", craft: { burnDps: 16, radiusMul: 1.3, trick: "nova" } },
  { id: "c-torch-4b", name: "Storm hop", blurb: "Fire hops farther and harder.", kind: "craft", round: 4, uniqueFor: "comp-torch", tag: "burn", craft: { dpsMul: 1.22, radiusMul: 1.22, trick: "storm" } },
  { id: "c-kelvin-4", name: "Dark ice", blurb: "A cold well holds the lane.", kind: "craft", round: 4, uniqueFor: "comp-kelvin", tag: "frost", craft: { cutSlow: 0.4, radiusMul: 1.28, trick: "eclipse" } },
  { id: "c-kelvin-4b", name: "Ice nova", blurb: "Ice bursts in a wide ring.", kind: "craft", round: 4, uniqueFor: "comp-kelvin", tag: "frost", craft: { cutSlow: 0.46, dpsMul: 1.15, trick: "nova" } },
  { id: "c-joule-4", name: "Storm line", blurb: "Sparks chain down the path.", kind: "craft", round: 4, uniqueFor: "comp-joule", craft: { dpsMul: 1.25, radiusMul: 1.25, trick: "storm" } },
  { id: "c-joule-4b", name: "Gold spark", blurb: "A gold burst rides with Joule.", kind: "craft", round: 4, uniqueFor: "comp-joule", craft: { dpsMul: 1.2, goldMul: 1.2, trick: "nova" } },
  { id: "c-rook-4", name: "Crew storm", blurb: "Nearby guns spark with Rook.", kind: "craft", round: 4, uniqueFor: "comp-rook", tag: "light", craft: { buffMul: 1.35, radiusMul: 1.3, trick: "storm" } },
  { id: "c-rook-4b", name: "Home nova", blurb: "Home gets a gold burst too.", kind: "craft", round: 4, uniqueFor: "comp-rook", tag: "light", craft: { buffMul: 1.28, hpMul: 1.2, trick: "nova" } },
  { id: "c-zeek-4", name: "Dark beam", blurb: "The beam holds enemies still.", kind: "craft", round: 4, uniqueFor: "comp-zeek", tag: "yank", craft: { knockMul: 1.6, cutSlow: 0.5, trick: "eclipse" } },
  { id: "c-zeek-4b", name: "Pay nova", blurb: "A gold burst pays extra.", kind: "craft", round: 4, uniqueFor: "comp-zeek", tag: "yank", craft: { goldMul: 1.22, knockMul: 1.25, trick: "nova" } },
  { id: "c-torr-4", name: "Gold bite", blurb: "A gold burst pays a lot.", kind: "craft", round: 4, uniqueFor: "comp-torr", craft: { goldMul: 1.32, dpsMul: 1.2, trick: "nova" } },
  { id: "c-torr-4b", name: "Storm tooth", blurb: "Bites jump enemy to enemy.", kind: "craft", round: 4, uniqueFor: "comp-torr", craft: { dpsMul: 1.22, radiusMul: 1.22, trick: "storm" } },
  { id: "c-halo-4", name: "All-pad storm", blurb: "Every kissed pad sparks.", kind: "craft", round: 4, uniqueFor: "comp-halo", tag: "light", craft: { buffMul: 1.4, radiusMul: 1.4, trick: "storm" } },
  { id: "c-halo-4b", name: "Sun kiss", blurb: "The ring bursts gold.", kind: "craft", round: 4, uniqueFor: "comp-halo", tag: "light", craft: { buffMul: 1.3, dpsMul: 1.12, trick: "nova" } },
  { id: "c-poppy-4", name: "Sun bloom", blurb: "Petals burst in a gold ring.", kind: "craft", round: 4, uniqueFor: "comp-poppy", tag: "burn", craft: { radiusMul: 1.4, burnDps: 10, trick: "nova" } },
  { id: "c-poppy-4b", name: "Storm mill", blurb: "Heal sparks jump to friends.", kind: "craft", round: 4, uniqueFor: "comp-poppy", tag: "heal", craft: { healMul: 1.4, radiusMul: 1.25, trick: "storm" } },
  { id: "c-puck-4", name: "Dark bump", blurb: "A dark well shoves the clump.", kind: "craft", round: 4, uniqueFor: "comp-puck", tag: "yank", craft: { knockMul: 1.65, radiusMul: 1.3, trick: "eclipse" } },
  { id: "c-puck-4b", name: "Gold bump", blurb: "The bump bursts gold.", kind: "craft", round: 4, uniqueFor: "comp-puck", tag: "yank", craft: { knockMul: 1.35, goldMul: 1.18, trick: "nova" } },
  { id: "c-chis-4", name: "Sun stitch", blurb: "A gold burst patches friends.", kind: "craft", round: 4, uniqueFor: "comp-chis", tag: "heal", craft: { healMul: 1.45, radiusMul: 1.3, trick: "nova" } },
  { id: "c-chis-4b", name: "Storm wing", blurb: "Heal sparks jump the crew.", kind: "craft", round: 4, uniqueFor: "comp-chis", tag: "heal", craft: { healMul: 1.3, hpMul: 1.22, trick: "storm" } },
  { id: "c-sink-4", name: "Dark well", blurb: "The well holds grenades still.", kind: "craft", round: 4, uniqueFor: "comp-sink", craft: { radiusMul: 1.4, interceptMul: 1.4, trick: "eclipse" } },
  { id: "c-sink-4b", name: "Sun well", blurb: "Bent fire bursts gold.", kind: "craft", round: 4, uniqueFor: "comp-sink", craft: { interceptMul: 1.3, dpsMul: 1.18, trick: "nova" } },
];

export function specialOf(id: string | null | undefined): SpecialDef | undefined {
  if (!id) return undefined;
  return SPECIALS.find((s) => s.id === id);
}

export function pickRoundForLevel(kind: SpecialKind, level: number): 1 | 2 | 3 | 4 | 5 | null {
  const at: readonly number[] = kind === "craft" ? CRAFT_PICK_AT : GUN_PICK_AT;
  const i = at.indexOf(level);
  if (i < 0) return null;
  return (i + 1) as 1 | 2 | 3 | 4 | 5;
}

export function maxSpecials(kind: SpecialKind): number {
  return kind === "craft" ? CRAFT_PICK_AT.length : GUN_PICK_AT.length;
}

function hashUid(uid: string): number {
  let n = 0;
  for (let i = 0; i < uid.length; i++) n = (n * 33 + uid.charCodeAt(i)) >>> 0;
  return n;
}

export function dealSpecials(
  kind: SpecialKind,
  uniqueFor: string,
  round: 1 | 2 | 3 | 4 | 5,
  uid: string,
  have: string[] = [],
): string[] {
  const taken = new Set(have);
  const uniques = SPECIALS.filter((s) => s.kind === kind && s.round === round && s.uniqueFor === uniqueFor && !taken.has(s.id));
  const shared = SPECIALS.filter((s) => s.kind === kind && s.round === round && !s.uniqueFor && !taken.has(s.id));
  const start = hashUid(uid + String(round))% Math.max(1, shared.length);
  const rotated = [...shared.slice(start), ...shared.slice(0, start)];
  const out: string[] = [];
  const wantUnique = kind === "craft" ? 2 : 1;
  for (const s of uniques) {
    if (out.length >= wantUnique) break;
    out.push(s.id);
  }
  for (const s of rotated) {
    if (out.length >= 3) break;
    out.push(s.id);
  }
  if (out.length < 3) {
    const extra = SPECIALS.filter((s) => s.kind === kind && !s.uniqueFor && !taken.has(s.id) && !out.includes(s.id));
    for (const s of extra) {
      if (out.length >= 3) break;
      out.push(s.id);
    }
  }
  return out.slice(0, 3);
}

export function specialCards(ids: string[]): SpecialDef[] {
  return ids.map((id) => specialOf(id)).filter((s): s is SpecialDef => !!s);
}

export function flyingTags(specials: string[] | null | undefined): SynergyTag[] {
  const tags: SynergyTag[] = [];
  for (const id of specials ?? []) {
    const t = specialOf(id)?.tag;
    if (t && !tags.includes(t)) tags.push(t);
  }
  return tags;
}
