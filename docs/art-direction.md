# VECTOR Art Direction (v3: Voxel Sky-Islands)

**Status:** Approved direction. Source of truth is the v3 poster (approved by Ryan, 2026-11-18) plus Ryan's vision: *Minecraft meets Astroneer meets Bloons TD*. This replaces the neon 2D canvas look: no black backgrounds, no glowing vector lines.

**About the numbers:** the poster fixes the look. Sizes, timings and hex values here are starting targets written to match it, not eyedropped from the file. Tune in-engine, compare against the poster, then update this doc.

## 1. Pillars

- **Everything is blocks.** Terrain, towers, creatures, particles and the title are built from cubes on one voxel grid. No smooth curves anywhere.
- **Silhouette first.** Every tower and enemy is identifiable as a flat black shape at minimum zoom. No recolors, no reskins.
- **One element, one material story.** Each element owns its materials, palette and particle behavior (§6).
- **Soft world, loud combat.** Sky and terrain are calm pastels. Saturated color and glow are reserved for attacks, rarity and telegraphs.
- **The map is alive.** Terrain changes in whole blocks, always telegraphed, never mid-wave.

## 2. Camera & voxel tile look

| Setting | Value |
|---|---|
| Projection | **Orthographic** (recommended) |
| Pitch | 35° down from horizontal (poster reads 30–35°) |
| Yaw | 45°, fixed (see Open questions) |
| Scale `s` | px per world unit; default 64 at 1080p |

Orthographic keeps tiles the same size everywhere, so ranges read fairly, tile picking is simple math, and large maps don't shrink at the far edge. It also works with either real-time 3D or pre-rendered sprites. Use perspective (FOV ≤ 20°) only for menu and key-art shots.

**Tile and voxel**
- 1 tile = 1 × 1 world unit; a full block is 1 unit tall.
- 16 voxels per tile edge (1 voxel = 0.0625 u).
- One global voxel size for terrain, towers, enemies and particles. Never scale a model so its voxels differ in size.
- Projection: tile top diamond = `1.414·s` wide × `0.811·s` tall; one block of height = `0.819·s`.

| Target | `s` | Tile diamond | 1 voxel | 3-tile tower height |
|---|---|---|---|---|
| Desktop 1080p default | 64 px | 91 × 52 px | 4 px | ~157 px |
| Mobile default (CSS px, render at device DPR) | 40 | 57 × 32 | 2.5 | ~98 |
| Play-zoom floor (all devices) | 32 | 45 × 26 | 2 | ~79 |

Phones cannot fit a whole map at play zoom, so mobile always pans and pinch-zooms. An overview zoom down to `s = 20` is allowed for planning only; stars and health bars keep a fixed screen size there. Taps snap to tiles.

**Block rules**
- Hard 90° edges. No bevels or rounding; curves are stair-stepped.
- Flat face shading as a share of base color: top 100%, left face 80%, right face 60%. No gradients across a face.
- Optional 1-voxel rim on top edges at +8% lightness. No drawn black outlines.
- AO: darken concave crevices 15–25% with 1-voxel falloff, tinted lavender, never black.
- Surface detail is per-voxel color noise, 2–3 tones within ±6% lightness. No photo textures or normal maps.

**Lighting**
- One warm key light from the upper-left of the screen, `#FFF1D6`, ~55° elevation.
- Shadows fall down-right at about 0.7× object height, soft-edged, `#3A2B5C` at 35% opacity.
- Cool ambient fill `#CBBBF0` at ~40%. Nothing renders pure black.
- Only the glow swatches (§6) are emissive. Bloom radius ≤ 2 voxels.

**Sky and background**
- Vertical gradient: `#B7A6E6` (top) → `#E7C3E3` → `#FFD8C0` (bottom).
- Puffy voxel clouds `#FFF7F2` with underside `#EBCFE0`, in 2 parallax layers (0.2× and 0.5× camera speed).
- Ringed planet `#8D6AD0` with ring `#D8BBF2`, top-right. Small floating voxel rocks `#A9A6B8` around the islands.
- Islands are 2–4 tiles thick. The underside tapers to a rough inverted cone in the zone's shadow color.
- Background is ~20% less saturated than the playfield so it never competes.

## 3. Maps

The poster shows a compact stack of single-element islands. Real maps are larger: several islands joined by bridges, with one continuous path.

| Size | Grid (tiles) | Islands | Path length | 1080p fit |
|---|---|---|---|---|
| Small | 24 × 16 | 2–3 | 60–80 tiles | Whole map at `s ≈ 60` |
| Medium | 36 × 24 | 3–4 | 110–150 | Whole map at `s ≈ 42`; default view pans |
| Large | 48 × 32 | 5–6 | 180–240 | Whole map only at the floor (`s ≈ 32`); played panned, minimap required |

Screen bounding box ≈ `(W+H)·0.707·s` wide × `(W+H)·0.406·s` tall, plus elevation.

**Path tiles**
- Tan cobblestone: base `#E0C794`, shadow `#B89A68`, highlight `#F2E2BC`, in irregular 3–5 voxel cobbles.
- Width is 2 tiles on main lanes and 1 tile on branches. XL enemies use main lanes only.
- The path is sunk 2 voxels below neighboring ground with a 1-voxel darker curb, so it reads by height as well as color.
- The path top is always ≥ 15 L* lighter than adjacent buildable ground (§8).
- Elevation uses whole-tile steps, 0–3 levels. Paths climb by 4-voxel stair steps.
- No scenery taller than 1 tile sits directly in front of (screen-below) a path tile.

**Elemental path variants** keep the same cobble pattern and width, tint ≤ 25% toward the element, and add trim:

| Zone | Path base | Trim |
|---|---|---|
| ICE | `#E6F2F8` | Frost rims, occasional slick ice slab |
| FIRE | `#DDAE7E` | Basalt curb with a glowing lava seam (in the curb, never on the walking surface) |
| EARTH | `#E0C794` | Moss voxels, grass tufts at the edges |
| WIND | `#EFE9C8` | Worn flagstones, drifting leaf cubes |
| LIGHTNING | `#DCC8E2` | Copper inlay strips pulsing in the travel direction |
| VOID | `#C4B0E0` | Floating slabs with 1-voxel gaps showing dark below |

**Dynamic map changes**
- Changes happen only between waves or stages, never while enemies are on the affected tiles.
- Units of change are whole tile columns rising or sinking, whole islands drifting in to dock, and bridges assembling block by block. Nothing pops or fades.
- **Telegraph (3 s):** affected tiles pulse ±15% brightness at 2 Hz with a 1-voxel white rim. The new route appears as a dotted line of cubes hovering 4 voxels up.
- **Move (1–2 s):** columns travel at 2 tiles/s, staggered 50 ms per tile outward from the path, ease-out, with dust cubes at the seams.
- **Settle (0.5 s):** the new path flashes once and arrow cubes run the full new route.
- Element flavor:
  - ICE bridges freeze into place block by block.
  - FIRE lava floods, then cools to basalt.
  - EARTH columns push up with dirt spray.
  - WIND islands drift and dock.
  - LIGHTNING segments switch on like circuits.
  - VOID tiles blink through a portal.

## 4. Towers

- **Size:** footprint 1×1 or 2×2 tiles, height 2–3 tiles (32–48 voxels). Towers are big but proportional and fill ≥ 75% of the footprint.
- **Overhang:** ≤ 4 voxels at ground level. Moving parts above 1 tile of height may overhang ≤ 8 voxels.
- **Base plate:** a 2-voxel stone slab covers the footprint and carries the rarity trim (§7).
- **Distinct silhouette and distinct attack:** if two towers share a mesh or a projectile type, one is redesigned. Test with black silhouettes side by side at `s = 32`.
- **Visible emitter:** each tower has one obvious muzzle, its highest-contrast glowing part. Shots originate exactly there; it turns toward the target and flashes for 0.1 s on fire.
- **Tiers add geometry, never just tint** (level mapping is proposed):
  - T1 (levels 1–2): base model.
  - T2 (levels 3–4): 1–2 new structural parts, ≥ 10% more silhouette area, larger emitter.
  - T3 (level 5): floating or animated parts plus idle particles, at most +0.5 tile of height.

| Element | Tower | Footprint × height | Silhouette | Emitter | Attack visual | T2 → T3 adds |
|---|---|---|---|---|---|---|
| ICE | Crystal Spire | 1×1 × 3 | Jagged crystal cluster, one dominant spike | Floating shard at the tip | Continuous pale-blue frost beam; frost cubes build up on the target | Side crystals → orbiting shard ring |
| FIRE | Brick Furnace | 2×2 × 2 | Squat brick kiln, offset chimney | Glowing furnace mouth | Fireball on a high arc with smoke and ember trail; burn patch on impact | Second chimney and bellows → lava ring, constant embers |
| EARTH | Boulder Catapult | 2×2 × 2 (arm reaches 3) | Wooden A-frame with long throwing arm | Sling bucket with visible boulder | Boulder arc with ground shadow; dirt-chunk burst on impact | Stone counterweight → twin bucket, mossy armor |
| WIND | Windmill Turbine | 1×1 × 3 | Thin tower, four wide blades | Blade hub | Swirling white-cyan gust cone with a spiral cube trail | Tail vane, bigger blades → second counter-rotating rotor |
| LIGHTNING | Tesla Coil | 1×1 × 3 | Stacked rings narrowing to a copper bulb | Copper bulb | Jagged violet-blue arc chaining enemy to enemy | Two side pylons → floating copper rings, idle arcs |
| VOID | Obelisk | 1×1 × 3 | Narrow dark monolith, the thinnest tower | Swirling black-hole portal disc | Cubes and light pulled inward; small implosion at the target | Floating rune blocks → split obelisk framing a larger portal |
| LEGENDARY | Gold Cannon | 2×2 × 2.5 | Fat gold barrel on a blocky carriage | Barrel muzzle | Thick golden beam (6 voxels) with sparkle cubes | See Open questions |

These seven cover spike, squat block, arm, blades, bulb-on-stack, monolith and barrel. Every new tower must add a new shape class.

## 5. Enemies

- Every enemy is a unique creature with its own body plan and movement style. A new enemy means a new body plan, not a new color.
- Size classes (footprint, height in tiles):
  - **S:** 0.5, ≤ 0.5
  - **M:** 0.75–1, 0.5–1
  - **L:** 1–1.5, 1–1.5
  - **XL boss:** 2×2, 2.5–3
- 3/4 readability: put identity features on the top and back (shell, horns, wings, plates). Check the silhouette from the game camera, not from the side.
- Animation moves rigid parts only: limbs rotate or translate as whole blocks. No squash, stretch or mesh bending.
- Every enemy has a blob shadow on the path. Flyers' shadows stay on the path.
- Proposed: all enemies have 1–2 voxel hostile eyes in `#FF3355`.
- Elemental variants keep the same creature, rig and silhouette (±10%). They swap materials and add element particles, and are named as variants ("Frost Beetle"). A variant never counts as a new enemy.

| Creature | Class | Body plan | Movement | Key colors | Example variant |
|---|---|---|---|---|---|
| Spider | M | 8 splayed legs, low round abdomen | Fast scuttle | `#7B4FC9` | VOID: obsidian body, legs leave fading dark cubes |
| Beetle | M | Domed shell, short legs, front horn | Steady trundle | Shell `#C8443C`, grey `#8A8794` | ICE: crystal-plate shell, sheds frost cubes |
| Shield skeleton | M (1 tile tall) | Thin upright biped, big square shield | March | Bone `#E9E2D0`, shield `#6B6F80` | FIRE: charred bones, ember-rimmed shield |
| Armored beast | L | Heavy rhino-like quadruped, plated back, nose horn | Head-down charge | `#8E8C99` | EARTH: mossy stone plates, dirt kick-up |
| Segmented worm | M (0.5 × 1.5) | Chain of 5–7 cubes | Undulating wave | `#B05CC8` | LIGHTNING: copper bands, sparks hop between segments |
| Bug | S | Tiny, 4 legs, big head; swarms | Hops | `#A6E22E` | WIND: leaf wing-covers, glides between hops |
| Bat | S, flies 1.5 tiles up | Wide wings, tiny body | 2-pose flap, bobbing | `#4B3A6B` | ICE: crystal wings, snow trail |
| Lava golem | XL boss | Hulking biped, oversized arms, small head | Slow stomp, dust per step | Basalt `#3A2E33`, lava `#FF7A1A` | Native FIRE; other elements get their own boss creature |

## 6. Element palettes

| Element | Base | Shadow | Highlight | Accent / glow | Particle | Materials |
|---|---|---|---|---|---|---|
| ICE | `#8FC6EA` | `#5F93C4` | `#E2F6FF` | `#4FD8FF` | `#D6F4FF` | Faceted crystal (lighter inner voxels fake translucency), snow caps. Highlight is for crystals, not large ground areas. |
| FIRE | `#3A2E33` | `#1F181C` | `#6B5559` | `#FF7A1A` | `#FFC24A` | Basalt, 1-voxel emissive lava cracks, brick `#A8553A`, grey smoke cubes `#5A4E55`. |
| EARTH | `#5FA83F` | `#5A4630` | `#A8DC6E` | `#B8834A` | `#8E8F86` | Grass-topped dirt, mossy stone, wood. No glow; the accent is warm wood. |
| WIND | `#5CC9A7` | `#3C9C8A` | `#C8F5E2` | `#B8FBFF` | `#FFFFFF` | Mint grass, whitewashed wood, canvas sails `#F4EFE2`. |
| LIGHTNING | `#8A6FC2` | `#56408A` | `#B9A3E6` | `#7C8CFF` | `#E3E0FF` | Mid-value purple stone, copper `#C9773E`. Arcs lean blue. |
| VOID | `#2A1B3D` | `#120A1F` | `#5A3F86` | `#B14DFF` | `#E06BFF` | Near-black obsidian with a slight sheen (highlight voxels only). Glow leans magenta. |

Three pairs are close and need deliberate separation:
- LIGHTNING vs VOID: mid-value stone with copper and blue arcs against near-black stone with magenta glow.
- FIRE vs VOID: warm dark with orange against cold dark with violet.
- Epic purple vs the purple zones: handled by the dark star outline (§7).

## 7. Rarity tiers and level stars

| Tier | Color | Base-plate cue (non-color) | Extra |
|---|---|---|---|
| Common | `#C9CDD6` grey (proposed; not on the poster) | Plain slab | None |
| Uncommon | `#5FD35A` green | Thin trim band | None |
| Rare | `#3FD0F5` cyan | Thick trim band | None |
| Epic | `#A66BFF` purple | Band + corner studs | Faint idle glow on the emitter |
| Legendary | `#FFC93A` gold | Band + studs + crown voxels | Sparkle cubes, gold materials |

**Level stars**
- 1–5 voxel stars show level; star color shows rarity. On the poster, ICE has 3 cyan stars (level 3 Rare) and the cannon has 5 gold (level 5 Legendary).
- Stars sit in a centered row 6 voxels above the unit's highest point and always face the camera. Only earned stars are shown.
- Size is 20 px at 1080p and at least 12 CSS px on mobile; they never shrink below that.
- Each star has a 1-voxel outline in `#2B2338` so it reads on the pastel sky and in purple zones.
- On level-up the new star pops in at 150% and settles in 0.2 s with an 8-cube burst.
- Stars float above leveled units, which today means towers. Gold, trim and stars are never used on enemies.

**Boosts** are shown around the base, never by tinting the tower or changing its stars:
- Damage: `#FF5A4A` cubes rising in a column around the tower.
- Attack speed: `#FFE14A` fast-orbiting cube ring at mid-height.
- Range: `#4AC8FF` dotted ring pulsing outward on the ground.
- Show at most 2 boost visuals per tower; the rest go in the tooltip.
- When a tower is selected, a dotted cube line links it to its boost source.

## 8. Effects & UI

**Effects**
- Particles are cubes only, 1–2 voxels (4–8 px at 1080p), flat-colored. They tumble and shrink to zero over 0.3–0.8 s. Smoke is grey cubes, not soft sprites.
- Proposed budgets: ≤ 24 cubes per hit; ≤ 600 live on desktop and ≤ 250 on mobile.
- Beams are straight segments 2–4 voxels wide (Legendary 6) with a white core, a glow-colored edge and cube sparks at both ends.
- Lightning uses 45° and 90° segments only, re-randomized every 60–80 ms, lasting ≤ 0.25 s.
- Arcing projectiles always cast a ground shadow.
- Impact shape per element also serves as the colorblind cue:

  | Element | Impact shape |
  |---|---|
  | ICE | Shards burst out and stick |
  | FIRE | Embers rise |
  | EARTH | Chunks fall |
  | WIND | Spiral |
  | LIGHTNING | Zigzag flash |
  | VOID | Cubes pulled inward |

**Readability rules**
- Value ladder for top surfaces, light to dark: path > buildable ground > rock and non-buildable > island underside.
- Enemies appear only on the path, with a shadow and a health bar. Towers appear only on ground, with a base plate.
- Enemies need ≥ 20 L* contrast against the path. Pale creatures like the skeleton carry dark gear.
- An enemy hidden behind a tower shows through it as a flat dark silhouette.
- Glow priority: attacks > telegraphs > rarity > terrain. Lava cracks and void swirls stay ≤ 50% of attack-glow brightness.
- Build feedback: valid is a green tile with corner brackets; invalid is a red tile with an X. Range is a dotted cube ring on the ground.
- UI:
  - Title lettering is stone voxels, `#B8B6C4` with `#8B889A` shadow.
  - Panels are `#2B2338` at 90% with square corners.
  - Text is `#FFF8F0`.
  - Rarity colors are used in UI only to mean rarity.

**Colorblind**
- Never use color alone. Element glyphs appear on cards, the build menu and damage numbers:

  | Element | Glyph |
  |---|---|
  | ICE | Hexagon |
  | FIRE | Triangle |
  | EARTH | Square |
  | WIND | Spiral |
  | LIGHTNING | Zigzag |
  | VOID | Ring |

- Rarity is color plus the base-plate cue plus the tier name on cards. Level is star count.
- Test every zone in grayscale and with deuteranopia and protanopia simulators.

## 9. Do / Don't

**Do**
- Build everything on the 16-voxel grid with one voxel size.
- Give every tower and creature a unique silhouette and motion.
- Show where shots come from: emitter flash, then projectile, then impact.
- Add parts for upgrades and swap materials for elemental variants.
- Keep the path the lightest surface and sunk below ground.
- Telegraph every terrain change for 3 s before blocks move.
- Pair every color signal with a shape, count or glyph.

**Don't**
- No smooth curves, bevels, gradients on faces, soft particles or outline strokes.
- No recolored towers and no reskinned enemies sold as new units.
- No neon-on-black and no pure black shadows.
- No mixed voxel sizes and no non-uniform scaling of models.
- No terrain glow brighter than attack glow.
- No map changes mid-wave and no blocks that pop or fade in.
- No rarity colors used as decoration.

## 10. Open questions for Ryan

1. **Renderer and camera:** should this be real-time 3D (WebGL, orthographic) or pre-rendered isometric sprites on the current 2D canvas, and is yaw fixed or 90° snap-rotatable? Recommendation: real-time 3D with fixed yaw. Rising terrain, added tier parts and aiming emitters multiply sprite counts fast, and fixed yaw keeps occlusion predictable. The cost is a mobile GPU budget to manage.
2. **Legendary and Common:** is Legendary a rarity any tower can reach, which needs a gold treatment for all six element towers, or a set of unique towers like the Gold Cannon? Is grey acceptable for Common, since the poster shows only green, cyan, purple and gold?
3. **Levels vs model tiers:** stars run 1–5 but there are three model tiers. Is the L1–2 / L3–4 / L5 mapping right, or are upgrades and levels separate tracks?
4. **Dynamic maps and placed towers:** when a tile with a tower changes, does the tower ride the block, lock the tile, or get refunded? This doc assumes towers ride their block and occupied tiles never become path.

