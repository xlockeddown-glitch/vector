import type { EnemyType, ThemeId } from "./types";

export type Assets = {
  maps: Partial<Record<ThemeId, HTMLImageElement>>;
  title: HTMLImageElement | null;
  crystal: HTMLImageElement | null;
  towers: Record<string, HTMLImageElement>;
  enemies: Record<EnemyType, HTMLImageElement[]>;
};

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(src));
    img.src = src;
  });
}

async function loadOptional(src: string): Promise<HTMLImageElement | null> {
  try {
    return await loadImg(src);
  } catch {
    return null;
  }
}

async function loadFrames(type: EnemyType): Promise<HTMLImageElement[]> {
  const frames: HTMLImageElement[] = [];
  for (let i = 1; i <= 4; i++) {
    const f = await loadOptional(`/game/enemies/${type}-${i}.png`);
    if (f) frames.push(f);
  }
  if (frames.length) return frames;
  const sheet = await loadOptional(`/game/enemies/${type}.png`);
  return sheet ? [sheet] : [];
}

export async function loadAssets(): Promise<Assets> {
  const [water, earth, space, title, crystal] = await Promise.all([
    loadOptional("/game/map/water.jpg"),
    loadOptional("/game/map/earth.jpg"),
    loadOptional("/game/map/space.jpg"),
    loadOptional("/game/map/title-cyber.jpg"),
    loadOptional("/game/fx/crystal.png"),
  ]);

  const towerIds = ["longbow", "ember", "rime", "hex", "grove", "arc", "captain"];
  const towers: Record<string, HTMLImageElement> = {};
  await Promise.all(
    towerIds.map(async (id) => {
      const img = (await loadOptional(`/game/towers/${id}.png`)) ?? (await loadOptional(`/game/towers/${id}-card.png`));
      if (img) towers[id] = img;
    }),
  );

  const [grunt, striker, plate, colossus, titan, swarm, cache] = await Promise.all([
    loadFrames("grunt"),
    loadFrames("striker"),
    loadFrames("plate"),
    loadFrames("colossus"),
    loadFrames("titan"),
    loadFrames("swarm"),
    loadFrames("cache"),
  ]);

  return {
    maps: {
      ...(water ? { water } : {}),
      ...(earth ? { earth } : {}),
      ...(space ? { space } : {}),
    },
    title,
    crystal,
    towers,
    enemies: {
      grunt,
      striker,
      plate,
      swarm: swarm.length ? swarm : grunt,
      colossus,
      titan: titan.length ? titan : colossus,
      cache: cache.length ? cache : striker,
      dart: striker.length ? striker : grunt,
      medic: grunt,
    },
  };
}
