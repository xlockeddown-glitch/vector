/**
 * Sharp labels on a pixel board.
 * The board renders at PARAMS.pixelRes and is scaled up pixelated, which turns small
 * canvas text into mush. While a frame draws, text calls are recorded instead of drawn;
 * afterwards they replay on a full-resolution overlay canvas stacked on top.
 */

type TextOp = {
  kind: "fill" | "stroke";
  text: string;
  x: number;
  y: number;
  maxWidth?: number;
  m: DOMMatrix;
  font: string;
  fillStyle: string | CanvasGradient | CanvasPattern;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
  alpha: number;
  shadowColor: string;
  shadowBlur: number;
};

const ops: TextOp[] = [];

function record(ctx: CanvasRenderingContext2D, kind: "fill" | "stroke", text: string, x: number, y: number, maxWidth?: number) {
  ops.push({
    kind,
    text: String(text),
    x,
    y,
    maxWidth,
    m: ctx.getTransform(),
    font: ctx.font,
    fillStyle: ctx.fillStyle,
    strokeStyle: ctx.strokeStyle,
    lineWidth: ctx.lineWidth,
    textAlign: ctx.textAlign,
    textBaseline: ctx.textBaseline,
    alpha: ctx.globalAlpha,
    shadowColor: ctx.shadowColor,
    shadowBlur: ctx.shadowBlur,
  });
}

/** Runs draw() with text calls on ctx captured for the overlay. */
export function withCapturedText(ctx: CanvasRenderingContext2D, draw: () => void) {
  ops.length = 0;
  const fill = ctx.fillText;
  const stroke = ctx.strokeText;
  ctx.fillText = function (text: string, x: number, y: number, maxWidth?: number) {
    record(ctx, "fill", text, x, y, maxWidth);
  };
  ctx.strokeText = function (text: string, x: number, y: number, maxWidth?: number) {
    record(ctx, "stroke", text, x, y, maxWidth);
  };
  try {
    draw();
  } finally {
    ctx.fillText = fill;
    ctx.strokeText = stroke;
  }
}

/** Finds or makes the overlay canvas right after the board canvas. */
export function labelCanvasFor(board: HTMLCanvasElement): HTMLCanvasElement | null {
  const parent = board.parentElement;
  if (!parent || typeof document === "undefined") return null;
  let el = parent.querySelector<HTMLCanvasElement>("canvas[data-board-labels]");
  if (!el) {
    el = document.createElement("canvas");
    el.dataset.boardLabels = "1";
    el.setAttribute("aria-hidden", "true");
    el.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;";
    board.insertAdjacentElement("afterend", el);
  }
  return el;
}

/** Replays recorded text sharply on the overlay. */
export function drawCapturedText(board: HTMLCanvasElement, overlay: HTMLCanvasElement) {
  const rect = board.getBoundingClientRect();
  const dpr = Math.min(2, (typeof window !== "undefined" && window.devicePixelRatio) || 1);
  const w = Math.max(1, Math.floor(rect.width * dpr));
  const h = Math.max(1, Math.floor(rect.height * dpr));
  if (overlay.width !== w || overlay.height !== h) {
    overlay.width = w;
    overlay.height = h;
  }
  const o = overlay.getContext("2d");
  if (!o) return;
  o.setTransform(1, 0, 0, 1, 0, 0);
  o.clearRect(0, 0, w, h);
  const k = w / Math.max(1, board.width);
  for (const op of ops) {
    const m = op.m;
    o.setTransform(m.a * k, m.b * k, m.c * k, m.d * k, m.e * k, m.f * k);
    o.font = op.font;
    o.textAlign = op.textAlign;
    o.textBaseline = op.textBaseline;
    o.globalAlpha = op.alpha;
    o.shadowColor = op.shadowColor;
    o.shadowBlur = op.shadowBlur * k;
    if (op.kind === "fill") {
      o.fillStyle = op.fillStyle;
      o.fillText(op.text, op.x, op.y, op.maxWidth);
    } else {
      o.strokeStyle = op.strokeStyle;
      o.lineWidth = op.lineWidth;
      o.strokeText(op.text, op.x, op.y, op.maxWidth);
    }
  }
  o.globalAlpha = 1;
  o.shadowBlur = 0;
}
