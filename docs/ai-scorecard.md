# AI scorecard

Who did what on VECTOR, and how well. Claude (Opus 5.5) orchestrates, reviews and integrates every slice and has the final say. Scores are 1–10 from Claude's review after integration: correctness, staying in scope, quality of the result, and rework needed.

## Round 4 — Blink + Jammer enemies, balance pass (2026-11-15)

| Slice | Model | Score | Notes |
|---|---|---|---|
| Blink + Jammer enemies | Fable 5.2 | 9 | Both enemies, telegraphs, jam limits, campaign hook; measured in the browser. Changed the commit trailer against instructions. |
| Balance pass (bots) | Opus 5.5 | 7.5 | Real data; fixed runaway grenades and uncounted grenade leaks. Ran 3h44m uncommitted, was cut off by a restart, left Hot Comb unsolved. |
| Enemy code review | Gemini 4 Hydrogen (router) | 6.5 | Its top finding was already handled; no real bugs this time. |

**Best this round:** Fable 5.2. Final tuning (HP square term 0.04, Hot Comb, L5 Gate) done by Claude during integration with fresh bot runs. **Lesson:** long bot runs must commit checkpoints.

## Round 3 — campaign, mutant visuals, Steps lane (2026-11-14)

First round with models from the AI Router (Gemini via Large context, Grok via Code builder).

| Slice | Model | Score | Notes |
|---|---|---|---|
| Campaign design proposal | Fable 5.2 | 9.5 | Read the real entry points; caught the every-3-waves win check, Retry dropping the stage, lives vs leaks. |
| Campaign design proposal | Gemini 4 Hydrogen (router) | 8 | Fast and tidy; caught Threat leaking into Continue and the wave-6 mega titan. Shallower on tracking. |
| Campaign build (15 stages) | Opus 5.5 | 9.5 | 18 files, drove a 3-star win in the browser, checked Arena regression, flagged its own loopholes. |
| Campaign code review | Gemini 4 Hydrogen (router) | 8.5 | Found a real bug (mid-wave guns dodged the guns rule). |
| Mutant affix visuals | Sonnet 5.5 | 9 | Shield hex, swift streaks, regen diamonds, HP-bar shield segment. Verified with screenshots. |
| Mutant affix visuals | Grok Build CLI (router) | 1 | Two runs, no files changed; second reply contained a made-up diff. Reassigned to Sonnet. |

**Best this round:** Opus 5.5 (campaign build). **Lesson:** check the working tree after every router build job.

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
