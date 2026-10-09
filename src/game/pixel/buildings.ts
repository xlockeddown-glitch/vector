import type { Sprite } from "./ink";
import type { TowerId } from "../matchup";
import type { EnemyTag } from "../matchup";
import type { CompanionId } from "../grid";

/** Feet sit on the last row. Wide base, narrow top, not a box. */

const lance: Sprite = [
  "........FF..........",
  ".......FppF.........",
  "........oo..........",
  ".......oFFo.........",
  ".......oFFo.........",
  "......ommmmo........",
  "......obFFbo........",
  ".....oombbmoo.......",
  ".....obhhhhbo.......",
  ".....obbbbbbo.......",
  "....oobbbbbboo......",
  "....obFFppFFbo......",
  "....obbbbbbbbo......",
  "...oobbbbbbbbbo.....",
  "...obhhhhhhhhbo.....",
  "...obbbbbbbbbbo.....",
  "..oobbbbbbbbbboo....",
  "..oooooooooooooo....",
];

const halo: Sprite = [
  "....................",
  "......oooooo........",
  "....ooF....Foo......",
  "...oF........Fo.....",
  "...o....FF....o.....",
  "...o...FppF...o.....",
  "...o....FF....o.....",
  "...oF........Fo.....",
  "....ooF....Foo......",
  "......oooooo........",
  ".......ommo.........",
  "......obbbbo........",
  ".....obhhhhbo.......",
  "....oobbbbbboo......",
  "....obbbbbbbbo......",
  "...oooooooooooo.....",
  "....................",
  "....................",
];

const crater: Sprite = [
  "....................",
  "....................",
  ".....oooooooo.......",
  "...ooEEEEEEEEoo.....",
  "..oEEeeeeeEEEEo.....",
  "..oEEeeeeeeEEo......",
  "...ooEEEEEoo........",
  "....oobbbboo........",
  "...oobbbbbbboo......",
  "..oobhhhhhhhhboo....",
  "..obbbbbbbbbbbbo....",
  ".oobbbbbbbbbbbbbo...",
  ".oooooooooooooooo...",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
];

const rail: Sprite = [
  "....................",
  "....................",
  "....................",
  "..............pp....",
  ".........oooooppo...",
  "......oomwwwmppmo...",
  ".....ombhhhhhhbmo...",
  ".....ombbbbbbbbmo...",
  "....oombbbbbbbbmo...",
  "...oobhhhhhhhhhbo...",
  "..oobbbbbbbbbbbbo...",
  "..ooooooooooooooo...",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
];

const beacon: Sprite = [
  ".......GGGG.........",
  "......GGppGG........",
  "......GppppG........",
  "......GGppGG........",
  ".......GGGG.........",
  "........oo..........",
  "........mo..........",
  "........mo..........",
  "........mo..........",
  ".......omo..........",
  "......obmbo.........",
  ".....obbbbbo........",
  "....obhhhhhbo.......",
  "...oobbbbbbbbo......",
  "...ooooooooooo......",
  "....................",
  "....................",
  "....................",
];

export const BUILDINGS: Record<TowerId, { idle: Sprite; flash: Sprite }> = {
  lance: { idle: lance, flash: lance.map((row, i) => (i === 0 ? ".......FFFFF........" : row)) },
  halo: { idle: halo, flash: halo.map((row) => row.replaceAll("F", "p")) },
  crater: { idle: crater, flash: crater.map((row) => row.replaceAll("E", "p")) },
  rail: { idle: rail, flash: rail.map((row, i) => (i === 3 ? "............pppp...." : row)) },
  beacon: { idle: beacon, flash: beacon.map((row, i) => (i === 0 ? "......GGGGGG........" : row)) },
};

const grunt: Sprite = [
  "....oooo....",
  "..ommmmmmo..",
  ".omhppppmoo.",
  ".ommmmmmmmo.",
  "..obEEEEbo..",
  "...oooooo...",
];

const swift: Sprite = [
  ".....oo.....",
  "...offffo...",
  "..oEffffppo.",
  "...offffo...",
  ".....oo.....",
  "............",
];

const plate: Sprite = [
  ".oooooooooo.",
  "ommmmmmmwwwo",
  "omhpppppwww.",
  "obbbbbbbwwwo",
  ".oEEEEEo....",
  "..oooooo....",
];

const swarm: Sprite = [
  "..EE........",
  "..ee..EE....",
  "......ee....",
  "....EE......",
  "....ee..EE..",
  "........ee..",
];

export const TROOPS: Record<EnemyTag, Sprite> = { grunt, swift, plate, swarm };

export const HULLS: Record<CompanionId, Sprite> = {
  "comp-auger": [
    "....oooo........",
    "..oUUUUUmo......",
    ".oUUmmmmmmmo....",
    "oUUmmhppmmmEo...",
    ".oUUmmmmmmmo....",
    "..oUUUUUmo......",
    "....oooo........",
    "................",
  ],
  "comp-boost": [
    "..ooo..ooo......",
    ".oEEEooEEEo.....",
    "oEEmmmmmmEEo....",
    "oEmmhppmmEEEo...",
    "oEEmmmmmmEEo....",
    ".oEEEooEEEo.....",
    "..ooo..ooo......",
    "................",
  ],
  "comp-shrike": [
    ".....oo.........",
    "...oSSSoo.......",
    "..oSSSSSSSo.....",
    ".oSShppSSSEo....",
    "..oSSSSSSSo.....",
    "...oSSSoo.......",
    ".....oo.........",
    "................",
  ],
};
