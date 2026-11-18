// Shared data for Tinh Lien Yeu Hoa (detail): palettes, timing, poses, the eye's opening in time, a coarse noise grid.
// Parts (_tinhlien-*.js) import from here; the move (tinh-lien.js) owns meta/act. Script: design/di-hoa/05-tinh-lien-yeu-hoa.md (v3).
import { smooth, clamp, READY, hex } from '../../core/index.js';

export const L = ['#3a2e1c', '#8a6a2a', '#c9a24a', '#e9cf8a', '#efe6cf', '#fbf8f0', '#ffffff'].map(hex);
export const LID = ['#120a10', '#24141e', '#3d2230'].map(hex), IRIS = ['#4a2006', '#8a420c', '#d2861a', '#f4b630', '#ffe07a'].map(hex);
export const PUPIL = hex('#050304'), VEIN = hex('#8a1414');
export const DUST = ['#2e2722', '#4a3f36', '#6b5d50', '#8f7f6e', '#b3a490'].map(hex);
export const CLOUD = ['#16121c', '#221c2a', '#302838', '#43384a'].map(hex);
export const TX = 150, END = 7.8, GATHER = 0.0, APPEAR = 0.6, OPENS = [1.0, 1.6, 2.2], LEVEL = [0.25, 0.6, 1], LOCK = 3.0, BOOM = 3.4;
export const SHUT = [5.72, 5.9], GHOST = [3.8, 4.8], INHALE = [4.75, 5.8], ASH = [5.9, 7.55];   // v4 ending: reveal, inhale, snap shut, ash
export const LC = [TX, -24], EC = [TX, -232], EW = 100, EH = 30, IR = 30;   // v4: a bigger eye in a tear of the sky
export const sm = (u) => u * u * (3 - 2 * u), out3 = (u) => 1 - (1 - u) ** 3;
export const hsh = (i, s = 0) => { const h = Math.sin(i * 91.7 + s * 47.3) * 43758.5453; return h - Math.floor(h); };

export const RAISE = { ...READY, crouch: 0, lean: -2, fx: 10, fy: -44, bx: 7, by: -40 };
export const GRIP = { ...READY, crouch: 3, lean: 2, fx: 15, fy: -36, bx: 7, by: -33, armsFront: true };
export const BRACE = { ...READY, crouch: 6, lean: -5, fx: 8, fy: -26, bx: 2, by: -22, armsFront: true };
export const POSES = [[-0.2, READY], [0.4, RAISE], [LOCK - 0.05, RAISE], [LOCK + 0.05, GRIP, 'snap'], [BOOM, GRIP], [BOOM + 0.1, BRACE, 'snap'], [INHALE[0], BRACE], [INHALE[1], { ...BRACE, crouch: 4, lean: -7, fy: -30, by: -26 }], [SHUT[1] + 0.1, BRACE, 'snap'], [6.6, BRACE], [END, READY]];

export function openAt(t) {
  let o = 0;
  for (let i = 0; i < 3; i++) {
    const a = t - OPENS[i];
    if (a < 0) break;
    const prev = i ? LEVEL[i - 1] : 0, u = clamp(a / 0.12);
    o = prev + (LEVEL[i] - prev) * (out3(u) + 0.15 * Math.sin(Math.min(1, a / 0.3) * Math.PI) * (1 - u * 0.5));
  }
  if (t < OPENS[0]) o = 0.04 * smooth(APPEAR, OPENS[0], t) * (1 + Math.sin(t * 30));
  return Math.max(0, o * (1 - smooth(SHUT[0], SHUT[1], t)));
}
export const eyeK = (t) => smooth(APPEAR - 0.1, APPEAR + 0.25, t) * (1 - smooth(SHUT[1] - 0.1, SHUT[1] + 0.4, t));
export const lockAt = (t) => smooth(LOCK - 0.05, LOCK + 0.2, t);
export const pupilW = (t) => (2.5 + 4.5 * openAt(t)) * (1 - 0.7 * lockAt(t)) * (1 + 0.6 * smooth(BOOM + 0.3, BOOM + 0.8, t));
export const pulses = (t) => OPENS.reduce((s, o) => s + Math.exp(-(((t - o - 0.05) / 0.06) ** 2)), 0);

// a coarse noise field: fn sampled every S px, read back with bilinear filtering (noise is the costly part per pixel)
export function grid(x0, y0, x1, y1, S, fn) {
  const nx = Math.ceil((x1 - x0) / S) + 2, ny = Math.ceil((y1 - y0) / S) + 2, g = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) g[j * nx + i] = fn(x0 + i * S, y0 + j * S);
  return (x, y) => {
    const fx = Math.max(0, (x - x0) / S), fy = Math.max(0, (y - y0) / S), i = Math.min(nx - 2, fx | 0), j = Math.min(ny - 2, fy | 0);
    const u = Math.min(1, fx - i), v = Math.min(1, fy - j), q = j * nx + i;
    return (g[q] * (1 - u) + g[q + 1] * u) * (1 - v) + (g[q + nx] * (1 - u) + g[q + nx + 1] * u) * v;
  };
}
