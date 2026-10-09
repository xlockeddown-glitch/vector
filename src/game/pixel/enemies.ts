import type { Sprite } from "./ink";
import type { EnemyTag } from "../matchup";

const grunt: Sprite = [
  "............",
  "............",
  "...oooooo...",
  "..ommmmmmo..",
  "..omhpppmoo.",
  "..ommmmmmmoo",
  "..obbbbbbmo.",
  "...oEEEEo...",
  "....oooo....",
  "............",
  "............",
  "............",
];

const gruntB: Sprite = [
  "............",
  "............",
  "...oooooo...",
  "..ommmmmmo..",
  "..omhpppmoo.",
  "..ommmmmmmoo",
  "..obbbbbbmo.",
  "....oEEo....",
  "...oEEEEo...",
  "............",
  "............",
  "............",
];

const swift: Sprite = [
  "............",
  ".....oo.....",
  "....offo....",
  "...offffoo..",
  "..oEfffffppo",
  "...offffoo..",
  "....offo....",
  ".....oo.....",
  "............",
  "............",
  "............",
  "............",
];

const swiftB: Sprite = [
  "............",
  ".....oo.....",
  "....offo....",
  "...offffoo..",
  ".oEEfffffppo",
  "...offffoo..",
  "....offo....",
  ".....oo.....",
  "............",
  "............",
  "............",
  "............",
];

const plate: Sprite = [
  "............",
  "..oooooooo..",
  ".ommmmmmmmo.",
  ".omhpppppww.",
  ".ommmmmmmww.",
  ".obbbbbbbww.",
  ".oEEEEEbbmo.",
  "..oooooooo..",
  "............",
  "............",
  "............",
  "............",
];

const plateB: Sprite = [
  "............",
  "..oooooooo..",
  ".ommmmmmmmo.",
  ".omhpppppww.",
  ".ommmmmmmww.",
  ".obbbbbbbww.",
  "..oEEEbbmo..",
  ".oooooooo...",
  "............",
  "............",
  "............",
  "............",
];

const swarm: Sprite = [
  "............",
  "..oEo.......",
  "..oEo.......",
  "......oEo...",
  "......oEo...",
  ".........oE.",
  ".........oE.",
  "....oEo.....",
  "....oEo.....",
  "............",
  "............",
  "............",
];

const swarmB: Sprite = [
  "............",
  "..Eo........",
  "..oEo.......",
  "......Eo....",
  "......oEo...",
  "........oE..",
  ".........oE.",
  "....Eo......",
  "....oEo.....",
  "............",
  "............",
  "............",
];

export const ENEMIES: Record<EnemyTag, { a: Sprite; b: Sprite }> = {
  grunt: { a: grunt, b: gruntB },
  swift: { a: swift, b: swiftB },
  plate: { a: plate, b: plateB },
  swarm: { a: swarm, b: swarmB },
};
