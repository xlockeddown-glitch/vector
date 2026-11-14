# AI scorecard

Who did what on VECTOR, and how well. Claude (Opus 5.5) orchestrates, reviews and integrates every slice and has the final say. Scores are 1–10 from Claude's review after integration: correctness, staying in scope, quality of the result, and rework needed.

## Round 2 — visual overhaul, depth, skins, pass, animation (2026-11-14)

| Slice | Model | Score | Notes |
|---|---|---|---|
| Design proposal: depth/levels | Opus 5.5 | 9 | Grounded in the code (spotted single-lane `packLayout`, flat endless curve). Missed that "heat" is already a name in the game. |
| Design proposal: depth/levels | Fable 5.2 | 9.5 | Caught the "heat" name clash, checked lane geometry with a script, proposed targeting priority. Blended with Opus's Threat list and enemies. |
| Depth, scaling, levels | Opus 5.5 | 9 | Biggest slice; all five parts landed and play cleanly (Threat, endless HP, Shard/Warden, 3 lanes, targeting). Honest risk notes. One justified edit outside its files. |
| Visual overhaul (UI) | Fable 5.2 | 9 | Biggest visible win: neon title, flat neon card frames, one panel/button kit. Changed global theme tokens (flagged). Fixed an invisible hull bar it found. |
| Animation & juice | Sonnet 5.5 | 8.5 | All seven effects, no runtime errors in play, capped fx. Slipped in a small shake-tuning change (flagged). |
| Tower skins | Haiku 5.5 | 7.5 | Six skins, painter, picker hook; tight and in scope. Smallest task; decorations not visually verified by it. |
| Battle pass | Sonnet 5.5 | 6.5 | Daily challenges, new tiers, reveal UI all work. Committed the `node_modules` link, which wiped installed dependencies on merge; cost a reinstall and a .gitignore fix. |

**Best this round:** Fable 5.2 (design proposal and UI). **Most reliable on big code:** Opus 5.5.
**Lessons:** tell agents to stage `src` only (or never `git add -A`); `.gitignore` now ignores a `node_modules` link too.
