import { MEGA_EVERY } from "../constants";
import type { EnemyType, WaveDef, WaveGroup } from "../types";
import { THEME_LEN, THEME_ORDER, themeAt } from "./themes";

function namesFor(theme: string): string[] {
  const label = theme === "earth" ? "Dust" : theme === "space" ? "Vacuum" : "Tide";
  return Array.from({ length: THEME_LEN }, (_, i) => `${label} ${i + 1}`);
}

function g(type: EnemyType, count: number, interval: number, delay = 0): WaveGroup {
  return { type, count, interval, delay };
}

export function isMegaWave(index: number) {
  return (Math.max(0, index) + 1) % MEGA_EVERY === 0;
}

function mixFor(local: number, theme: string, act: number): WaveGroup[] {
  const n = 1.2 + act * 0.24;
  const loop = Math.floor(Math.max(0, act) / THEME_ORDER.length);
  const c = (x: number) => Math.max(1, Math.round(x * n));
  const water = theme === "water";
  const earth = theme === "earth";
  const swarmN = water ? 1.35 : 1;
  const plateN = earth ? 1.35 : 1;
  const fastN = theme === "space" ? 1.3 : 1;

  const groups = ((): WaveGroup[] => {
  switch (local) {
    case 0:
      return [
        g("grunt", c(26), 0.22, 0.04),
        g("striker", c(12 * fastN), 0.24, 0.9),
        g("swarm", c(14 * swarmN), 0.14, 2.4),
        g("dart", c(6 * fastN), 0.16, 1.4),
      ];
    case 1:
      return [g("grunt", c(22), 0.28), g("striker", c(16 * fastN), 0.24, 1.0), g("swarm", c(12 * swarmN), 0.16, 3.5), g("dart", c(8 * fastN), 0.14, 2.2)];
    case 2:
      return [
        g("grunt", c(20), 0.26),
        g("striker", c(16 * fastN), 0.22, 1.0),
        g("swarm", c(22 * swarmN), 0.14, 2.8),
        g("cache", 1, 1, 5.2),
        g("dart", c(8 * fastN), 0.14, 3.2),
      ];
    case 3:
      return [g("plate", c(8 * plateN), 0.9, 0.25), g("grunt", c(20), 0.28, 0.8), g("striker", c(12 * fastN), 0.24, 3.5)];
    case 4:
      return [
        g("grunt", c(18), 0.26),
        g("swarm", c(24 * swarmN), 0.14, 0.8),
        g("striker", c(14 * fastN), 0.24, 3),
        g("cache", 1, 1, 4.8),
      ];
    case 5:
      return [
        g("grunt", c(18), 0.26),
        g("colossus", 1 + (act > 1 ? 1 : 0) + loop, 1, 1.8),
        g("striker", c(14 * fastN), 0.24, 3.5),
        g("swarm", c(14 * swarmN), 0.16, 5.5),
        g("cache", 1, 1, 6.4),
      ];
    case 6:
      return [
        g("swarm", c(22 * swarmN), 0.15),
        g("plate", c(6 * plateN), 0.9, 1.4),
        g("striker", c(14 * fastN), 0.26, 3.5),
      ];
    case 7:
      return [
        g("plate", c(10 * plateN), 0.65),
        g("grunt", c(16), 0.28, 2),
        g("colossus", 1 + (act > 0 ? 1 : 0) + loop, 3, 6.5),
        g("cache", 1, 1, 5),
      ];
    case 8:
      return [
        g("striker", c(20 * fastN), 0.22),
        g("swarm", c(18 * swarmN), 0.15, 1.2),
        g("plate", c(6 * plateN), 0.9, 4.5),
      ];
    case 9:
      return [
        g("grunt", c(18), 0.26),
        g("plate", c(8 * plateN), 0.75, 1),
        g("colossus", 1 + act + loop, 3, 3.2),
        g("striker", c(14 * fastN), 0.26, 5),
        g("cache", 1, 1, 6),
      ];
    case 10:
      return [
        g("swarm", c(24 * swarmN), 0.14),
        g("plate", c(8 * plateN), 0.8, 1.4),
        g("striker", c(16 * fastN), 0.24, 3.5),
        g("colossus", 1, 1, 7),
        g("cache", 1, 1, 4.2),
      ];
    default:
      return [
        g("swarm", c(24 * swarmN), 0.14),
        g("titan", 1, 1, 1.8),
        g("plate", c(8 * plateN), 0.8, 3.5),
        g("colossus", 1 + act + loop, 3.2, 7),
        g("striker", c(14 * fastN), 0.24, 5),
        g("cache", 1 + (act > 0 ? 1 : 0), 2.4, 5.5),
      ];
  }
  })();
  groups.push(g("dart", c(5 * fastN), 0.15, 0.5));
  if (local >= Math.max(4, 6 - loop)) groups.push(g("medic", 1 + (act > 0 ? 1 : 0) + (loop > 0 ? 1 : 0), 2.5, 1.6));
  return groups;
}

function withMega(groups: WaveGroup[], mega: boolean, act: number): WaveGroup[] {
  if (!mega) return groups;
  const scaled = groups.map((grp) => ({
    ...grp,
    count: grp.type === "cache" ? grp.count : Math.max(1, Math.round(grp.count * 1.45)),
  }));
  scaled.push(g("titan", 1, 1, 2.1));
  scaled.push(g("cache", 1 + Math.min(2, act), 1.8, 3.6));
  return scaled;
}

function buildWaves(): WaveDef[] {
  const out: WaveDef[] = [];
  for (let act = 0; act < THEME_ORDER.length; act++) {
    const theme = THEME_ORDER[act]!;
    const names = namesFor(theme);
    for (let local = 0; local < THEME_LEN; local++) {
      const index = act * THEME_LEN + local;
      const mega = isMegaWave(index);
      out.push({
        name: mega ? `Mega ${names[local] ?? `Wave ${local + 1}`}` : (names[local] ?? `Wave ${local + 1}`),
        groups: withMega(mixFor(local, theme, act), mega, act),
        mega,
      });
    }
  }
  return out;
}

export const WAVES: WaveDef[] = buildWaves();

export function waveAt(index: number): WaveDef {
  const theme = themeAt(index);
  const local = ((index % THEME_LEN) + THEME_LEN) % THEME_LEN;
  const act = Math.floor(Math.max(0, index) / THEME_LEN);
  const mega = isMegaWave(index);
  return {
    name: mega ? `Mega ${theme.short} ${local + 1}` : `${theme.short} ${local + 1}`,
    groups: withMega(mixFor(local, theme.id, act), mega, act),
    mega,
  };
}

export function waveThemeName(wave: number) {
  return themeAt(wave).name;
}
