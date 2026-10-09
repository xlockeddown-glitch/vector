# Grid contract

Branch `grid`. The moon lane stays on `main` at tag `v0.9.1-lane`. Do not delete it. Playable slice versions as `0.10.0`. This file is the rules. If code and this file disagree, the file wins until we change it on purpose.

## Board

16 columns, 10 rows. The whole level is on screen. No scrolling.

A cell is a button, a path, or the exit. Towers sit on buttons only. The path is one cell wide, orthogonal, no diagonals, no reused cell. It starts on an edge and ends on the exit. The companion stands on the exit. Enemies that reach it hurt that ship.

Every generated path has a straight of at least 4 cells (Rail) and at least one turn with a button beside it (Crater).

Skins are alloy, road, or dirt. Same grid. Skin does not change movement.

Companions are `comp-auger`, `comp-boost`, `comp-shrike`.

## Not in this mode

Draft, signals, card flip, moons, the bezier lane. They stay in git. They are not loaded here.

One currency later: Credit. Not this slice.

## Files

| File | Owner |
|---|---|
| `src/game/grid.ts` | Board. Cells, placement, audit. |
| `src/game/pathgen.ts` | Board. Seeded paths. |
| `src/game/sim.ts` | Do not grow it for this. |

Art does not edit these. Numbers do not land until a path audit is green.
