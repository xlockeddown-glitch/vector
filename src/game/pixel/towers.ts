import type { Sprite } from "./ink";
import type { TowerId } from "../matchup";

const lance: Sprite = [
  ".....FF.....",
  ".....ff.....",
  ".....ofo....",
  ".....ofo....",
  ".....ofo....",
  "....ohhho...",
  "....omFmo...",
  "...ommmmmo..",
  "...ohbbbho..",
  "...obbbbbo..",
  "....oooo....",
  "............",
];

const lanceFlash: Sprite = [
  "....FFFF....",
  ".....FF.....",
  ".....ofo....",
  ".....ofo....",
  ".....ofo....",
  "....ohhho...",
  "....omFmo...",
  "...ommmmmo..",
  "...ohbbbho..",
  "...obbbbbo..",
  "....oooo....",
  "............",
];

const halo: Sprite = [
  "............",
  "...oooooo...",
  "..oF....Fo..",
  "..o......o..",
  "..o..FF..o..",
  "..o..FF..o..",
  "..o......o..",
  "..oF....Fo..",
  "...oooooo...",
  "...obbbbo...",
  "....oooo....",
  "............",
];

const haloFlash: Sprite = [
  "............",
  "...oFFFFo...",
  "..oFFFFFFFo.",
  "..oF.FF.Fo..",
  "..oF.FF.Fo..",
  "..oF.FF.Fo..",
  "..oF.FF.Fo..",
  "..oFFFFFFFo.",
  "...oFFFFo...",
  "...obbbbo...",
  "....oooo....",
  "............",
];

const crater: Sprite = [
  "............",
  "....oooo....",
  "...oEEEEo...",
  "...oEeeEo...",
  "...oEEEEo...",
  "....oeeo....",
  "....ommo....",
  "...ommmmmo..",
  "...obbbbbo..",
  "...ohhhhho..",
  "....oooo....",
  "............",
];

const craterFlash: Sprite = [
  "...EEEEEE...",
  "..oEEEEEEEo.",
  "...oEEEEo...",
  "...oEeeEo...",
  "...oEEEEo...",
  "....oeeo....",
  "....ommo....",
  "...ommmmmo..",
  "...obbbbbo..",
  "...ohhhhho..",
  "....oooo....",
  "............",
];

const rail: Sprite = [
  "............",
  "............",
  ".ooooooooooo",
  ".omwwwwwwwpo",
  ".obhhhhhhhoo",
  ".omwwwwwwwpo",
  ".obbbbbbbbo.",
  "..oooooooo..",
  "...bbbbbb...",
  "...oooooo...",
  "............",
  "............",
];

const railFlash: Sprite = [
  "............",
  "........ppp.",
  ".oooooooppp.",
  ".omwwwwwpppo",
  ".obhhhhhhhoo",
  ".omwwwwwpppo",
  ".obbbbbbbbo.",
  "..oooooooo..",
  "...bbbbbb...",
  "...oooooo...",
  "............",
  "............",
];

const beacon: Sprite = [
  ".....GG.....",
  "....GppG....",
  "....GppG....",
  ".....GG.....",
  "......o.....",
  "......m.....",
  "....omhmo...",
  "...obbbbbo..",
  "...omgggmo..",
  "...obbbbbo..",
  "....oooo....",
  "............",
];

const beaconFlash: Sprite = [
  "....GGGG....",
  "...GGppGG...",
  "...GGppGG...",
  "....GGGG....",
  "......o.....",
  "......m.....",
  "....omhmo...",
  "...obbbbbo..",
  "...omgggmo..",
  "...obbbbbo..",
  "....oooo....",
  "............",
];

export const TOWERS: Record<TowerId, { idle: Sprite; flash: Sprite }> = {
  lance: { idle: lance, flash: lanceFlash },
  halo: { idle: halo, flash: haloFlash },
  crater: { idle: crater, flash: craterFlash },
  rail: { idle: rail, flash: railFlash },
  beacon: { idle: beacon, flash: beaconFlash },
};
