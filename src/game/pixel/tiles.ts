import type { Sprite } from "./ink";

/** Empty socket. The well stays clear so the gun reads. */
export const PAD: Sprite = [
  "............",
  "..oooooooo..",
  ".ohbbbbbbho.",
  ".ob......bo.",
  ".ob.oooo.bo.",
  ".ob.o..o.bo.",
  ".ob.o..o.bo.",
  ".ob.oooo.bo.",
  ".ob......bo.",
  ".obbbbbbbbo.",
  "..oooooooo..",
  "............",
];

export const PAD_HOT: Sprite = [
  "............",
  "..FFFFFFFF..",
  ".oFbbbbbbFo.",
  ".oF......Fo.",
  ".oF.oooo.Fo.",
  ".oF.o..o.Fo.",
  ".oF.o..o.Fo.",
  ".oF.oooo.Fo.",
  ".oF......Fo.",
  ".oFbbbbbbFo.",
  "..FFFFFFFF..",
  "............",
];

const alloyH: Sprite = [
  "............",
  "............",
  "oooooooooooo",
  "fbbbbbbbbbbf",
  "fbFFppppFFbf",
  "fbFFppppFFbf",
  "fbbbbbbbbbbf",
  "oooooooooooo",
  "............",
  "............",
  "............",
  "............",
];

const alloyC: Sprite = [
  "............",
  "............",
  "ooooooo.....",
  "fbbbbbf.....",
  "fFFppbf.....",
  "fFFppbf.....",
  "fbbbbbf.....",
  "oofbbbbf....",
  "..fbbbbf....",
  "..fFFppf....",
  "..fbbbbf....",
  "..ooooooo...",
];

const roadH: Sprite = [
  "............",
  "............",
  "mmmmmmmmmmmm",
  "rwwwwwwwwwmr",
  "r..ww..ww.mr",
  "r..ww..ww.mr",
  "rwwwwwwwwwmr",
  "mmmmmmmmmmmm",
  "............",
  "............",
  "............",
  "............",
];

const roadC: Sprite = [
  "............",
  "............",
  "mmmmmmm.....",
  "rwwwwwm.....",
  "r..wwrm.....",
  "r..wwrm.....",
  "rwwwwwm.....",
  "mmrwwwwm....",
  "..rwwwwm....",
  "..r..wwm....",
  "..rwwwwm....",
  "..mmmmmmm...",
];

const dirtH: Sprite = [
  "............",
  "............",
  "yyyyyyyyyyyy",
  "ddddddddddyd",
  "ddyddddeedyd",
  "dddddyddddyd",
  "ddddddddddyd",
  "yyyyyyyyyyyy",
  "............",
  "............",
  "............",
  "............",
];

const dirtC: Sprite = [
  "............",
  "............",
  "yyyyyyy.....",
  "ddddddd.....",
  "dydeedd.....",
  "ddddddd.....",
  "ddddddd.....",
  "yydddddd....",
  "..ddddyd....",
  "..dydddd....",
  "..dddddd....",
  "..yyyyyyy...",
];

export const LANE: Record<"alloy" | "road" | "dirt", { straight: Sprite; corner: Sprite }> = {
  alloy: { straight: alloyH, corner: alloyC },
  road: { straight: roadH, corner: roadC },
  dirt: { straight: dirtH, corner: dirtC },
};
