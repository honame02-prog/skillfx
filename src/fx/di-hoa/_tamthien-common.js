// Shared data for Tam Thien Diem Viem Hoa (detail): palette, timing, poses and the sphere's state in time.
// Parts (_tamthien-*.js) import from here; the move (tam-thien.js) owns meta/act. Script: design/di-hoa/04-tam-thien-diem-viem-hoa.md (v3).
import { smooth, clamp, READY, hex } from '../../core/index.js';
// black fire: near-black core, bright violet-pink edge. 0 darkest ... 6 white
export const C = ['#0a0610', '#1e0f2e', '#5a2a8c', '#9b4dd6', '#e07af0', '#f6d6ff', '#ffffff'].map(hex);
export const TX = 150, END = 5.0, IGNITE = 0.1, RAIN = 0.9, ORB = 2.3, STARS = 2.7, FADE = 3.9, CLIMAX = FADE - 0.12;
export const R = 70, SC = [TX, -R - 1], SKY = -232, XC = 120;   // sphere radius / centre; top of the canvas; middle of the canvas
export const sm = (u) => u * u * (3 - 2 * u), out3 = (u) => 1 - (1 - u) ** 3;
export const hsh = (i, s = 0) => { const h = Math.sin(i * 91.7 + s * 47.3) * 43758.5453; return h - Math.floor(h); };

export const UP = { ...READY, crouch: 0, lean: -2, fx: 9, fy: -40, bx: 8, by: -39 };
export const SWEEP = { ...READY, crouch: 6, lean: 7, fx: 21, fy: -14, bx: -6, by: -19 };
export const CLENCH = { ...READY, crouch: 4, fx: 14, fy: -30, bx: 8, by: -28, armsFront: true };
export const POSES = [[-0.2, READY], [0.35, UP], [RAIN - 0.03, UP], [RAIN + 0.04, SWEEP, 'snap'], [ORB - 0.08, { ...SWEEP, crouch: 5 }], [ORB, CLENCH, 'snap'],
  [FADE, { ...CLENCH, crouch: 5 }], [FADE + 0.5, { ...READY, crouch: 2, fx: 12, fy: -26, bx: 6, by: -24 }], [END, READY]];

// the sphere in time (shared by the shell part and the stars part so they stay in step)
export function orbState(t) {
  const form = out3(clamp((t - ORB) / 0.35));
  const inten = smooth(STARS, CLIMAX, t) * (1 - smooth(CLIMAX, CLIMAX + 0.3, t));
  const squeeze = 1 - 0.07 * Math.exp(-(((t - CLIMAX) / 0.05) ** 2));
  const pulse = (1 + 0.05 * inten * Math.sin(t * (20 + 30 * inten))) * squeeze;
  const peel = SC[1] - R + 2 * R * sm(clamp((t - FADE - 0.1) / 0.9));   // shell is gone above this line
  const flare = Math.exp(-(((t - CLIMAX) / 0.06) ** 2));
  return { form, inten, squeeze, Rr: R * pulse, peel, flare };
}
