# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.9.9] - 2026-11-19

### Removed

- Unused game imports, dead draft helpers, obsolete map layouts, and unreferenced source exports.

### Changed

- Shared the identical craft hull upgrade calculation without changing game behavior.
- Test hygiene (no separate bump): tests now remove their temp directories; sim.ts split read without a non-null assertion.

## [0.9.8] - 2026-11-18

### Changed

- sim.ts type follow-ups: required World fields, precise relic/save/order types, fewer non-null assertions, removed dead code (uncalled grantGem, always-true orbit check).

## [0.9.7] - 2026-11-18

### Changed

- Test hygiene: env copies per test, case-insensitive flag stripping, isolated auth-invariant symlink test with temp cleanup.

## [0.9.6] - 2026-11-18

### Added

- Auth tests for app-env `true`, the absent-file default (auth on), and an explicit `false` env override.

## [0.9.5] - 2026-11-18

### Changed

- CI runs the full `scripts/**/*.test.mjs` suite (`npm test`) after `check:local`.

## [0.9.4] - 2026-11-18

### Fixed

- Isolated auth environment and share metadata tests from local workspace files.
- Used Windows directory junctions for symlink CLI tests.

### Changed

- Removed disabled legacy hull art and its unused mast helper without changing rendering.
- Extracted command resolution and tested Windows Vite, other Windows commands, and Linux Vite.

## [0.9.3] - 2026-11-18

### Changed

- Removed `@ts-nocheck` from `sim.ts`; typed the simulation with no behavior change.

## [0.9.2] - 2026-11-17

### Fixed

- `npm test` runs the full scripts suite on Windows.
- `with-app-env` spawns Vite cross-platform so `check:local`, build, and dev work on Windows.
- Lint errors in `map.ts` and `render.ts`.
