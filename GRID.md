# Grid contract

Branch `grid`. The moon lane stays on `main` at tag `v0.9.1-lane`. Do not delete it. Playable slice versions as `0.10.0`. This file is the rules. If code and this file disagree, the file wins until we change it on purpose.

## Board

16 columns, 10 rows. The whole level is on screen. No scrolling.

A cell is a button, a path, or the exit. Towers sit on buttons only. The path is one cell wide, orthogonal, no diagonals, no reused cell. It starts on an edge and ends on the exit. The companion stands on the exit. Enemies that reach it hurt that ship.

Every generated path has a straight of at least 4 cells (Rail) and at least one turn with a button beside it (Crater).

Skins are alloy, road, or dirt. Same grid. Skin does not change movement.

Level 1 is grunts, then swifts. Levels 2 through 8 teach a corner, a pack, armor, dirt, a road, Beacon, then all four. Clearing a level gives one skill. After 8, endless uses `scale.ts`. Play on the title opens the climb. Moon lane is still the other button.

## Not in this mode

Draft, signals, card flip, moons, the bezier lane. They stay in git. They are not loaded here.

One currency: Credit. Numbers live in `matchup.ts`. The live sim does not spend them yet.

Start at 60. Lance, Crater, and Rail cost 50. Halo costs 55. Beacon costs 70, so the first kills have to pay for it. Rank 2 costs 45. Rank 3 costs 90.

| Tower | Wins against | Loses to |
|---|---|---|
| Rail | Grunt | Swift |
| Halo | Swift | Plate |
| Lance | Plate | Swarm, because one shot does not clear the pack |
| Crater | Swarm | Plate |
| Beacon | Nobody. It marks. Marked kills pay 1.5× and take 25% more from the others. | |

Level 1 is 6 grunts, 4 swifts, 4 grunts.

Endless scale is `scale.ts`. Level 9 is tier 1. Health ×1.12 a tier, count ×1.06, speed ×1.04 and never past 1.6. Do not tune this by feel.

## Files

| File | Owner |
|---|---|
| `src/game/grid.ts` | Board. Cells, placement, audit. |
| `src/game/pathgen.ts` | Board. Seeded paths. |
| `src/game/matchup.ts` | Combat. Towers, tags, Credit, level 1. |
| `src/game/scale.ts` | Quant. Endless curve. |
| `src/game/sim.ts` | Do not grow it for this. |

Art does not edit these. Numbers do not land until a path audit is green.
