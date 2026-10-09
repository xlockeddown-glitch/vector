type Item = { src: string; w: number; h: number; foot: [number, number] };
type Manifest = { scale: number; items: Record<string, Item> };

let manifest: Manifest | null = null;
const images = new Map<string, HTMLImageElement>();
let started = false;

export function ensurePack() {
  if (started || typeof Image === "undefined") return;
  started = true;
  void fetch("/game/pack/pack.json")
    .then((res) => res.json())
    .then((data: Manifest) => {
      manifest = data;
      for (const item of Object.values(data.items)) {
        const img = new Image();
        img.src = `/game/pack/${item.src}`;
        images.set(item.src, img);
      }
    });
}

export function blitPack(ctx: CanvasRenderingContext2D, id: string, cx: number, cy: number) {
  const item = manifest?.items[id];
  if (!manifest || !item) return false;
  const img = images.get(item.src);
  if (!img?.complete || !img.naturalWidth) return false;
  const s = manifest.scale;
  ctx.drawImage(img, cx - item.foot[0] * s, cy - item.foot[1] * s, item.w * s, item.h * s);
  return true;
}
