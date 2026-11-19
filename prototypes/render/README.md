# VECTOR isolated render prototype

Two render-only studies of the same deterministic, procedurally generated voxel
scene. Everything lives in this directory: no game imports, game assets, build
configuration changes, or integration hooks.

## Run

From `prototypes/render`:

```sh
npm install && npm run serve
```

Open:

- Index: http://127.0.0.1:5178/
- A, real 3D: http://127.0.0.1:5178/three.html
- B, software sprites: http://127.0.0.1:5178/sprite.html

`PORT` overrides 5178. The server binds only to `127.0.0.1`, serves this directory,
rejects paths outside it, and checks resolved symlinks as well.

Three.js is pinned to **0.170.0**. Installation needs the npm registry; rendering
uses only local files. Version B does not load Three.js. There is no build step.

## Isolation and deployment

This is a standalone npm package, excluded from the game build/deploy by design:
it is not referenced by any game entry point or asset manifest. Do not include
`prototypes/` in game deployment inputs. No existing game or deployment files
are modified; this prototype does not install a repository-wide exclusion rule.
Its local `node_modules` is prototype-only.

## Scene and scale

- Fixed 1280×800 canvas; CSS scales the presentation without changing capture size.
- Orthographic camera, downward pitch 35°, yaw 45°.
- One tile is one world unit; one voxel is 1/16 world unit.
- A 5×5 island has a 32-voxel-thick, tapering dirt underside.
- The one-tile-wide L-shaped cobble path bends once and sits two voxels below
  grass, with darker joints and curb.
- The Tesla Coil occupies tile `(3,2)`, beside the path. Its 16×16 base slab is
  two voxels thick; copper bulb included, the tower is exactly 48 voxels tall.
- Three cyan stars have a one-voxel dark outline; all other geometry has none.
- `voxels.js` exposes palette, camera constants, deterministic lightness noise,
  surface voxels, occupancy for AO, and tower/overlay anchors.

Interior solids are used temporarily for visibility tests but are not emitted.
A hard assertion keeps the returned voxel count below 60,000. No binary assets,
external fonts, remote textures, or runtime network services are used.

## Rendering details and deliberate approximations

**A:** One `InstancedMesh` contains all surface cubes. Box vertex colors establish
the top/left/right 100%/80%/60% face hierarchy before warm Lambert lighting and
cool fill. Lighting consequently changes final pixel ratios: this is not an
unlit palette-matching renderer. Occupancy-based per-instance crevice tint
approximates AO; soft shadow receiver tiles tint directional shadows lavender.
The ordinary Lambert receivers also self-shadow, so contact shadows can be
darker than the 35% tinted receiver. Local canvas textures provide the bulb halo
and crisp, camera-facing stars. Thin emissive-looking boxes form the arc.

**B:** A CPU orthographic rasterizer sorts cubes back-to-front and draws only
unoccluded top, left and right faces. Face-local occupancy AO adds a 15–25%
crevice term with a lavender contribution. The patch and anchor-local tower are
rasterized into separate offscreen canvases, then composited with a clipped soft
shadow and 2D arc, bulb glow, and star overlays. The cached tower is placed by
its tile anchor, not by a hand-tuned screen offset.

B intentionally uses a fixed shadow footprint rather than simulated lighting.
Its two-layer composition suits this scene, not arbitrary terrain intersections:
foreground cliffs, overhangs, or overlapping towers would need depth slices,
a depth buffer, or additional independently sorted sprites. General voxel
painter sorting is also not a replacement for a depth buffer in arbitrary scenes.
Both versions are static art comparisons rather than animation benchmarks.

## Approach comparison

| Area | A — real 3D voxels | B — rasterized angled sprites |
| --- | --- | --- |
| Performance | Low terrain draw-call count; GPU depth testing, but many cube triangles and a shadow pass | Higher one-time CPU rasterization cost; cached frames become a few image draws |
| Art pipeline | Shared voxel model can be inspected from other angles; lighting needs tuning | Shared voxels bake consistent face colors; more views or lighting variants require more caches |
| Dynamic terrain | Update instance buffers and occupancy; straightforward depth relationships | Invalidate affected patch caches; chunking and sprite ordering become important |
| Animation | Transform models, lights and effects without rebaking; articulated voxel models need grouping | Cheap overlay animation; changing model pose or view needs rebaking or an atlas |
| Mobile | WebGL capability, shadows, GPU fill and thermal budget matter | Canvas support is broad; initial CPU work and large sprite memory can cause stalls |
| Bundle size | Local Three.js module plus prototype source; larger payload | Prototype source only; no rendering dependency |

**Recommendation:** use A as the art-validation baseline and preferred starting
point if terrain or lighting is dynamic. Use B when a fixed camera and mostly
static content justify pre-baked or cached views. Measure representative mobile
hardware before choosing; this static study does not establish production FPS.

## Headless capture

Both pages work in modern headless Chrome. Wait until
`window.__ready === true`, then capture the page's canvas at its intrinsic
1280×800 size. A sets readiness after its first actual WebGL render and uses
`preserveDrawingBuffer: true`; B sets it after all software compositing completes.
A requires an available WebGL backend, including software WebGL where configured.
