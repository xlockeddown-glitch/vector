import { CELL_PX, GLYPH, type Sprite } from "./ink";

export function spriteOk(sprite: Sprite, size = CELL_PX) {
  return sprite.length === size && sprite.every((row) => row.length === size);
}

/** Clockwise. Pixel art stays on the grid. */
export function rotate(sprite: Sprite, turns: number): Sprite {
  let cur = sprite.map((row) => row);
  const n = ((turns % 4) + 4) % 4;
  for (let t = 0; t < n; t++) {
    const next = Array.from({ length: cur.length }, () => "");
    const size = cur.length;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) next[x] += cur[size - 1 - y]![x];
    }
    cur = next;
  }
  return cur;
}

export function blit(ctx: CanvasRenderingContext2D, sprite: Sprite, x: number, y: number) {
  for (let row = 0; row < sprite.length; row++) {
    const line = sprite[row] ?? "";
    for (let col = 0; col < line.length; col++) {
      const color = GLYPH[line[col] ?? "."];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x + col, y + row, 1, 1);
    }
  }
}

/** Neon pixels (the capitals) also light the four neighbors. Still hard pixels. */
export function bloom(ctx: CanvasRenderingContext2D, sprite: Sprite, x: number, y: number) {
  const hot = new Set(["F", "E", "G", "U", "S", "p", "w"]);
  ctx.save();
  ctx.globalAlpha = 0.45;
  for (let row = 0; row < sprite.length; row++) {
    const line = sprite[row] ?? "";
    for (let col = 0; col < line.length; col++) {
      const ch = line[col] ?? ".";
      if (!hot.has(ch)) continue;
      const color = GLYPH[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x + col - 1, y + row, 3, 1);
      ctx.fillRect(x + col, y + row - 1, 1, 3);
    }
  }
  ctx.restore();
}
