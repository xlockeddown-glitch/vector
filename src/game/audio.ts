type AudioApi = {
  unlock: () => void;
  setMuted: (m: boolean) => void;
  play: (name: Sfx) => void;
};

export type Sfx =
  | "ui"
  | "place"
  | "shoot"
  | "hit"
  | "kill"
  | "leak"
  | "draft"
  | "rip"
  | "grade"
  | "win"
  | "lose";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor({ latencyHint: "interactive" });
    } catch {
      ctx = new Ctor();
    }
    master = ctx.createGain();
    master.gain.value = 0.28;
    master.connect(ctx.destination);
  }
  return ctx;
}

function beep(opts: {
  freq: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  slide?: number;
  delay?: number;
}) {
  const audio = ac();
  if (!audio || !master || muted) return;
  const t0 = audio.currentTime + (opts.delay ?? 0);
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.type = opts.type ?? "triangle";
  osc.frequency.setValueAtTime(opts.freq, t0);
  if (opts.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, opts.slide), t0 + opts.dur);
  const amp = opts.gain ?? 0.12;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(amp, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
  osc.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + opts.dur + 0.02);
  osc.onended = () => {
    osc.disconnect();
    g.disconnect();
  };
}

export const audio: AudioApi = {
  unlock() {
    const audioCtx = ac();
    if (audioCtx && audioCtx.state === "suspended") void audioCtx.resume();
  },
  setMuted(m) {
    muted = m;
    if (master) master.gain.setTargetAtTime(m ? 0 : 0.28, ac()?.currentTime ?? 0, 0.03);
  },
  play(name) {
    const audioCtx = ac();
    if (!audioCtx || muted) return;
    switch (name) {
      case "ui":
        beep({ freq: 520, dur: 0.06, type: "sine", gain: 0.06 });
        break;
      case "place":
        beep({ freq: 180, dur: 0.12, type: "sine", gain: 0.14, slide: 90 });
        beep({ freq: 420, dur: 0.08, type: "triangle", gain: 0.05, delay: 0.04 });
        break;
      case "shoot":
        beep({
          freq: 340 + Math.random() * 40,
          dur: 0.045,
          type: "square",
          gain: 0.035,
        });
        break;
      case "hit":
        beep({
          freq: 220 + Math.random() * 80,
          dur: 0.05,
          type: "sawtooth",
          gain: 0.04,
        });
        break;
      case "kill":
        beep({ freq: 480, dur: 0.1, type: "triangle", gain: 0.07, slide: 240 });
        break;
      case "leak":
        beep({ freq: 160, dur: 0.22, type: "sawtooth", gain: 0.1, slide: 70 });
        break;
      case "draft":
        beep({ freq: 380, dur: 0.09, type: "sine", gain: 0.08 });
        beep({ freq: 520, dur: 0.1, type: "sine", gain: 0.06, delay: 0.07 });
        beep({ freq: 660, dur: 0.14, type: "triangle", gain: 0.05, delay: 0.14 });
        break;
      case "rip":
        beep({ freq: 240, dur: 0.12, type: "sawtooth", gain: 0.07, slide: 140 });
        beep({ freq: 720, dur: 0.08, type: "triangle", gain: 0.05, delay: 0.05 });
        beep({ freq: 980, dur: 0.16, type: "sine", gain: 0.04, delay: 0.12 });
        break;
      case "grade":
        beep({ freq: 300, dur: 0.12, type: "sine", gain: 0.08 });
        beep({ freq: 450, dur: 0.16, type: "triangle", gain: 0.07, delay: 0.1 });
        break;
      case "win":
        beep({ freq: 392, dur: 0.18, type: "sine", gain: 0.09 });
        beep({ freq: 494, dur: 0.18, type: "sine", gain: 0.08, delay: 0.12 });
        beep({ freq: 587, dur: 0.28, type: "triangle", gain: 0.09, delay: 0.24 });
        break;
      case "lose":
        beep({ freq: 220, dur: 0.35, type: "sawtooth", gain: 0.08, slide: 80 });
        break;
    }
  },
};

export function resumeAudioOnVisible() {
  if (typeof document === "undefined") return;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") audio.unlock();
  });
}
