// Shared data for Van Lac Tam Viem (detail): palette, timing, poses, the caster's hand and the serpent's head path.
// Parts (_vanlac-*.js) import from here; the move (van-lac.js) owns meta/act. Script: design/di-hoa/03-van-lac-tam-viem.md.
import { smooth, clamp, TAU, WHITE, READY, hex, poseAt, mix } from '../../core/index.js';
export const C = ['#140c12', '#4a1428', '#a8204a', '#ff4f7a', '#ffb3c6', '#efe9ee', '#ffffff'].map(hex);
export const RIM = hex('#efe9ee'), SHADE = hex('#b9b3c4'), ASH = ['#2b2626', '#5a524f', '#8f8580'].map(hex);
export const TX = 150, END = 4.5, OUT = 0.6, REACH = 1.25, DIVE = 1.8, IN = 2.0, BEATS = [2.2, 2.65, 3.1], BURN = 3.4;
export const CHEST = [TX + 1, -30];
export const sm = (u) => u * u * (3 - 2 * u), out3 = (u) => 1 - (1 - u) ** 3;

export const HEART = { ...READY, crouch: 1, fx: 4, fy: -30, bx: 6, by: -29, armsFront: true };
export const PUSH = { ...READY, crouch: 4, lean: 6, fx: 24, fy: -28, bx: -5, by: -20 };
export const SEAL = { ...READY, crouch: 3, fx: 10, fy: -31, bx: 11, by: -30, armsFront: true };
export const POSES = [[-0.2, READY], [0.4, HEART], [OUT - 0.02, HEART], [OUT + 0.05, PUSH, 'snap'], [REACH, { ...PUSH, crouch: 3 }], [1.6, SEAL],
  [BURN - 0.05, { ...SEAL, fx: 9, fy: -30 }], [BURN, { ...READY, crouch: 5, lean: 4, fx: 16, fy: -32, bx: -4, by: -22 }, 'snap'], [END, READY]];
export const hand = (t) => { const q = poseAt(POSES, t); return [q.fx ?? 11, q.fy ?? -21]; };

// the serpent's head path in time; the body follows the same path a little behind
export function headAt(t) {
  const [hx, hy] = hand(OUT + 0.05);
  if (t < OUT) return [4, -30];
  if (t < REACH) {   // S-curve flight from the palm to the target's side
    const u = sm((t - OUT) / (REACH - OUT)), x = hx + (TX - 17 - hx) * u, y = hy + (-8 - hy) * u - 26 * Math.sin(u * Math.PI) + 9 * Math.sin(u * TAU * 2.5) * Math.sin(u * Math.PI);
    return [x, y];
  }
  if (t < DIVE) {   // coiling round the target, rising
    const u = (t - REACH) / (DIVE - REACH), a = Math.PI + u * TAU * 1.5;
    return [TX + Math.cos(a) * 17, -8 - 46 * u + Math.sin(a) * 3];
  }
  const u = sm(clamp((t - DIVE) / (IN - DIVE)));   // rears up then dives into the chest
  return [TX + 17 + (CHEST[0] - TX - 17) * u + 6 * Math.sin(u * Math.PI), -54 + (54 + CHEST[1]) * u - 14 * Math.sin(u * Math.PI)];
}
