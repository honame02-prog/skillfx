// DRAFT v2.0 (shape + motion blocking) — Di Hoa 5: Tinh Lien, redesign "Ho Ly May" (user 18/11).
// Card: design/di-hoa/tinh-lien-v2-ho-ly.md. Shapes: _holyfox-lib.js (fox), _tinhlien-lotus-lib.js (flame lotus).
// Ivory mist condenses into a cloud fox crouched behind the caster; its single tail blooms into a white flame-lotus that
// keeps shedding burning petals onto the target while the fox swells; suddenly the fox lunges and is sucked into one
// point: a white hole whose pull tears rocks out of the ground and swallows them, then it pinches out.
// v2.3 (user 18/11): fox body = reference sprite, its tail = a flame-lotus right behind the body; the devouring is a
// vortex opening in the fox's chest (the fox never spins). Hole visuals and rocks are still blocking.
import { smooth, clamp, READY } from '../../core/index.js';
import { L, DUST, CLOUD, hsh, sm } from './_tinhlien-common.js';
import { holyFox, chestOf } from './_holyfox-lib.js';
import { flamePetal } from './_tinhlien-lotus-lib.js';

const TX = 150, END = 5.8, FORM = [0.0, 0.8], SHED0 = 0.9, SHEDN = 6, SHEDDT = 0.34, FLY = 0.32;
const PRESS = [3.0, 3.1], OPEN = 3.05, DEVOUR = [3.1, 3.9], HOLE = [3.05, 4.9], GONE = [4.9, 5.3];
const F = [TX, -1], SPRESS = 0.95, H = chestOf(F, SPRESS);   // the fox sits ON the target; vortex in its chest

export const meta = {
  name: 'Tinh Lien v2 Draft',
  desc: 'Draft: a white fox spirit sits on the target, a flickering flame-lotus behind it sheds burning petals; it tenses and a white vortex in its chest devours it and the ground.',
  tags: ['di-hoa', 'draft', 'fire', 'fox', 'lotus', 'vortex', 'one-shot'],
  size: [360, 320], origin: [60, 295], duration: END, loop: false, fps: 30, bg: 'ground', actor: 2,
  options: { seed: 5 },
};
const RAISE = { ...READY, crouch: 0, lean: -2, fx: 10, fy: -44, bx: 7, by: -40 };
const PUSH = { ...READY, crouch: 3, lean: 3, fx: 16, fy: -34, bx: 8, by: -32, armsFront: true };
const shedT = (i) => SHED0 + i * SHEDDT;
const hitTicks = [];
for (let i = 0; i < SHEDN; i++) hitTicks.push({ t: shedT(i) + FLY, stop: 0.03, shake: 0.12 + 0.02 * i, amp: 1.5 + 0.3 * i, push: 0.3, straw: 3, flash: 0.02 });
for (let t = DEVOUR[0] + 0.2; t < HOLE[1]; t += 0.25) hitTicks.push({ t, shake: 0.12, amp: 1.4, push: -0.15, straw: 3, flash: 0 });
export const act = {
  target: { x: TX },
  poses: [[-0.2, READY], [0.4, RAISE], [PRESS[0], RAISE], [PRESS[0] + 0.06, PUSH, 'snap'], [GONE[1], PUSH], [END, READY]],
  hits: [
    ...hitTicks,
    { t: OPEN, stop: 0.12, shake: 0.7, amp: 5, push: -1, straw: 20, flash: 0.06, skin: 'holy' },
    { t: DEVOUR[0] + 0.15, shake: 0.2, amp: 2, push: -0.6, straw: 12, flash: 0, erase: 0.9 },   // the vortex devours the target too
    { t: GONE[0] + 0.3, stop: 0.08, shake: 0.5, amp: 4, push: 0, straw: 8, flash: 0.05 },
    { t: END - 0.02, push: 0, straw: 0, flash: 0, skin: null, erase: 0 },
  ],
};

// fox scale: swells while it attacks, then tenses (a sudden squeeze) as the vortex opens
const foxS = (t) => {
  const grow = 1 + 0.25 * sm(clamp((t - FORM[1]) / (PRESS[0] - FORM[1])));
  return grow + (SPRESS - grow) * sm(clamp((t - PRESS[0]) / (PRESS[1] - PRESS[0])));
};
const devourAt = (t) => sm(clamp((t - DEVOUR[0]) / (DEVOUR[1] - DEVOUR[0])));
const coreR = (t) => 20 * sm(clamp((t - OPEN) / 0.45)) * (1 - sm(clamp((t - GONE[0]) / (GONE[1] - GONE[0]))));
const armK = (t) => sm(clamp((t - OPEN) / 0.35)) * (1 - sm(clamp((t - 4.4) / 0.5)));

export function drawBack(p, t) {
  if (t > OPEN - 0.02 && t < OPEN + 0.04) p.rect(-60, -295, 360, 320, CLOUD[0]);   // the squeeze: one inverted beat
  const ck = smooth(DEVOUR[0], DEVOUR[0] + 0.8, t) * (1 - smooth(END - 0.6, END - 0.15, t));
  if (ck > 0) { p.ellipse(TX, 1, 42 * ck, 5 * ck, DUST[0]); p.ellipse(TX, 0, 34 * ck, 3 * ck, CLOUD[0]); }
  fox(p, t, 'back');   // the lotus behind
}
// the fox itself burns IN FRONT of the target: its fire engulfs the character (user 18/11)
function fox(p, t, layer) {
  const dv = devourAt(t);
  if (dv >= 1) return;
  const r = holyFox(p, t, { F, S: foxS(t), reveal: smooth(FORM[0], FORM[1], t), eye: smooth(FORM[1] - 0.15, FORM[1] + 0.1, t), lotus: smooth(0.3, 0.9, t), devour: dv, layer });
  if (r && layer === 'front' && t < PRESS[0]) shed(p, t, r);
}

// burning petals peel off the lotus behind the fox and dive onto the target
function shed(p, t, r) {
  for (let i = 0; i < SHEDN; i++) {
    const u = (t - shedT(i)) / FLY;
    if (u < 0 || u > 1) continue;
    const side = i & 1 ? 1 : -1;
    const sx = r.lotusTop[0] + side * (18 + hsh(i, 2) * 22) * r.size * 0.4, sy = r.lotusTop[1] + 10, ex = TX + (hsh(i, 3) - 0.5) * 12, ey = -24;
    const x = sx + (ex - sx) * u + side * Math.sin(u * Math.PI) * 26, y = sy + (ey - sy) * u * u;
    const vx = ex - sx + side * Math.cos(u * Math.PI) * 26 * Math.PI, vy = (ey - sy) * 2 * u + 1, l = Math.hypot(vx, vy) || 1;
    flamePetal(p, x - vx / l * 13, y - vy / l * 13, x, y, 4.5, t, i * 5.3, { wisp: 0.8, heat: 0.4, side });
  }
}

export function draw(p, t) {
  fox(p, t, 'front');
  const R = coreR(t), ak = armK(t);
  if (R > 0.5 || ak > 0) {
    const R2 = R + 75 * ak;
    p.shade(H[0] - R2 - 2, H[1] - R2 - 2, H[0] + R2 + 2, H[1] + R2 + 2, (x, y, out) => {
      const dx = x - H[0], dy = y - H[1], d = Math.hypot(dx, dy);
      if (d > R2 || y > 22) return;
      if (d < R) { out.c = d < R * 0.6 ? L[6] : d < R * 0.85 ? L[5] : L[4]; out.a = 1; out.l = L[6]; out.k = 0.2; return; }
      if (d < R + 1.6 && R > 3) { out.c = CLOUD[0]; out.a = 1; return; }
      // three spiral arms flowing inward; thin and broken toward the outside
      const a = Math.atan2(dy, dx), f = (d - R) / Math.max(1, R2 - R);
      const arm = Math.sin(a * 3 + Math.log(d + 1) * 7 + t * 11);
      if (arm > 0.35 + 0.55 * f) {
        const e = (arm - 0.35 - 0.55 * f) / (0.65 - 0.55 * f + 1e-3);   // 0 at the arm's edge .. 1 on its spine
        out.c = e > 0.55 && f < 0.6 ? L[6] : f < 0.3 ? L[5] : f < 0.65 ? L[4] : e > 0.4 ? L[4] : DUST[4]; out.a = 1;
      }
    });
    if (R > 0.5) p.glow(H[0], H[1], R * 2.6, L[5], 0.35);
    rocks(p, t);
  }
  if (t > GONE[1] - 0.05 && t < GONE[1] + 0.35) {
    const u = (t - GONE[1] + 0.05) / 0.4;
    p.ring(H[0], H[1], 6 + 70 * sm(clamp(u)), 2, L[6]);
    if (u < 0.3) p.disc(H[0], H[1], 3, L[6], 1);
  }
}

// rocks torn from the ground, spiralling in and shrinking
function rocks(p, t) {
  for (let i = 0; i < 28; i++) {
    const t0 = DEVOUR[0] + 0.1 + hsh(i, 1) * 1.1, u = (t - t0) / (0.7 + hsh(i, 4) * 0.5);
    if (u < 0 || u >= 1) continue;
    const x0 = TX + (hsh(i, 5) - 0.5) * 230, y0 = -1 - hsh(i, 6) * 4;
    const dx = x0 - H[0], dy = y0 - H[1], r0 = Math.hypot(dx, dy), a0 = Math.atan2(dy, dx);
    const e = u * u, r = r0 * (1 - e), a = a0 - 2.6 * e;
    const s = Math.max(1, Math.round((2 + hsh(i, 7) * 4) * (1 - 0.8 * e)));
    const x = H[0] + Math.cos(a) * r, y = H[1] + Math.sin(a) * r;
    if (r < coreR(t)) continue;
    p.rect(Math.round(x), Math.round(y), s, s, DUST[1 + (i % 3)]);
    if (s > 2) p.rect(Math.round(x), Math.round(y), s, 1, DUST[4]);
  }
}
