// DRAFT v1 (motion + shape blocking) — Di Hoa 3: Van Lac Tam Viem. Script: design/di-hoa/03-van-lac-tam-viem.md.
// An invisible flame serpent (only faint rims and a rose-red heart) leaves the caster's chest, coils round the target,
// dives into its chest and burns it from inside in three heartbeats; a clench makes the heart flame burst out.
import { smooth, clamp, TAU, WHITE, READY, hex, poseAt, mix } from '../../core/index.js';

const C = ['#140c12', '#4a1428', '#a8204a', '#ff4f7a', '#ffb3c6', '#efe9ee', '#ffffff'].map(hex);
const RIM = hex('#efe9ee'), SHADE = hex('#b9b3c4'), ASH = ['#2b2626', '#5a524f', '#8f8580'].map(hex);
const TX = 150, END = 4.5, OUT = 0.6, REACH = 1.2, DIVE = 1.8, IN = 2.0, BEATS = [2.2, 2.65, 3.1], BURN = 3.4;
const CHEST = [TX + 1, -30];
const sm = (u) => u * u * (3 - 2 * u), out3 = (u) => 1 - (1 - u) ** 3;
export const meta = {
  name: 'Van Lac Draft',
  desc: 'Motion draft: an invisible flame serpent with a rose-red heart coils round the target, dives into its chest and burns it from inside in three beats.',
  tags: ['di-hoa', 'draft', 'fire', 'soul', 'dot', 'one-shot'],
  size: [360, 260], origin: [60, 235], duration: END, loop: false, fps: 30, bg: 'ground', actor: 2,
  options: { seed: 5 },
};
const HEART = { ...READY, crouch: 1, fx: 4, fy: -30, bx: 6, by: -29, armsFront: true };
const PUSH = { ...READY, crouch: 4, lean: 6, fx: 24, fy: -28, bx: -5, by: -20 };
const SEAL = { ...READY, crouch: 3, fx: 10, fy: -31, bx: 11, by: -30, armsFront: true };
export const act = {
  target: { x: TX },
  poses: [[-0.2, READY], [0.4, HEART], [OUT - 0.02, HEART], [OUT + 0.05, PUSH, 'snap'], [REACH, { ...PUSH, crouch: 3 }], [1.6, SEAL],
    [BURN - 0.05, { ...SEAL, fx: 9, fy: -30 }], [BURN, { ...READY, crouch: 5, lean: 4, fx: 16, fy: -32, bx: -4, by: -22 }, 'snap'], [END, READY]],
  hits: [
    { t: OUT + 0.03, stop: 0.03, shake: 0.08, amp: 1, target: false },
    { t: 1.5, shake: 0.2, amp: 1, push: 0.2, straw: 2 },
    { t: IN - 0.05, stop: 0.06, shake: 0.2, amp: 2, push: 0.6, straw: 4, flash: 0.04 },
    { t: BEATS[0], shake: 0.12, amp: 1, push: 0.3, straw: 3, skin: 'red' },
    { t: BEATS[1], shake: 0.16, amp: 1.5, push: 0.4, straw: 5 },
    { t: BEATS[2], shake: 0.2, amp: 2, push: 0.6, straw: 7 },
    { t: BURN, stop: 0.1, shake: 0.45, amp: 3.5, push: 1.6, straw: 24, flash: 0.08, skin: 'char' },
    { t: END - 0.35, push: 0, straw: 0, skin: null },
  ],
};
const hand = (t) => { const q = poseAt(act.poses, t); return [q.fx ?? 11, q.fy ?? -21]; };

// the serpent's head path in time; the body follows the same path a little behind
function headAt(t) {
  const [hx, hy] = hand(OUT + 0.05);
  if (t < OUT) return [4, -30];
  if (t < REACH) {   // S-curve flight from the palm to the target's side
    const u = sm((t - OUT) / (REACH - OUT)), x = hx + (TX - 16 - hx) * u, y = hy - 18 * Math.sin(u * Math.PI) + 7 * Math.sin(u * TAU * 1.5) * (1 - u);
    return [x, y];
  }
  if (t < DIVE) {   // coiling round the target, rising
    const u = (t - REACH) / (DIVE - REACH), a = Math.PI + u * TAU * 1.5;
    return [TX + Math.cos(a) * 15, -8 - 46 * u + Math.sin(a) * 3];
  }
  const u = sm(clamp((t - DIVE) / (IN - DIVE)));   // rears up then dives into the chest
  return [TX + 8 * (1 - u) - 4 * Math.sin(u * Math.PI), -56 + (56 + CHEST[1]) * u - 10 * Math.sin(u * Math.PI)];
}
const BODY = 22, LAG = 0.02;   // body samples, seconds between samples
function serpent(p, t, layer) {
  if (t < OUT || t > IN + BODY * LAG) return;
  for (let i = BODY - 1; i >= 0; i--) {
    const ti = t - i * LAG;
    if (ti < OUT) continue;
    if (ti > IN && t >= IN) continue;   // the part already inside the chest is hidden
    const [x, y] = headAt(Math.min(ti, IN)), r = 5.5 * (1 - i / BODY) + 1.2;
    // in front of the target or behind it while coiling
    const coil = ti > REACH && ti < DIVE, behind = coil && Math.sin(Math.PI + ((ti - REACH) / (DIVE - REACH)) * TAU * 1.5) < 0;
    if (behind !== (layer === 'back')) continue;
    p.circle(x, y, r, RIM, 0.45);
    p.circle(x, y, r * 0.55, SHADE, 0.18);
    if (i % 3 === 0) p.dot(x, y - r, WHITE, 0.6);   // scale glints
    if (i === 0) {   // head: two flame crests and the rose heart at the neck
      const [px, py] = headAt(Math.max(OUT, ti - LAG)), dx = x - px, dy = y - py, d = Math.hypot(dx, dy) || 1;
      p.line(x, y, x - dy / d * 6 + dx / d * 3, y + dx / d * 6 + dy / d * 3, RIM, 0.6);
      p.line(x, y, x + dy / d * 6 + dx / d * 3, y - dx / d * 6 + dy / d * 3, RIM, 0.6);
    }
    if (i === 3) { p.disc(x, y, 2.4, C[3], 1); p.dot(x, y, C[6], 1); }
  }
}
// the ember in the caster's chest, the shimmer round him
function caster(p, t) {
  if (t > OUT + 0.1) return;
  const k = smooth(0.1, 0.5, t), pulse = 0.7 + 0.3 * Math.sin(t * 18);
  p.glow(4, -30, 8, C[3], 0.3 * k * pulse);
  p.disc(4, -30, 1.8 * k, C[3], k);
  for (let i = 0; i < 6; i++) {   // the clear flame shimmering round the body
    const a = i / 6 * TAU + t * 3, x = Math.cos(a) * 12, y = -26 + Math.sin(a) * 18;
    p.line(x, y, x + Math.sin(t * 9 + i) * 2, y - 6, RIM, 0.35 * k);
  }
}
// the heart burning inside the target: three beats, veins spread further each time; clear flames leak from its outline
function heart(p, t, layer) {
  if (t < IN || t > BURN + 0.9) return;
  const beat = BEATS.reduce((m, b, i) => Math.max(m, t >= b ? (0.55 + 0.25 * i) * Math.exp(-(t - b) * 6) : 0), 0);
  const level = BEATS.filter((b) => t >= b).length, [cx, cy] = CHEST, fade = 1 - smooth(BURN, BURN + 0.4, t);
  if (layer === 'front') {
    p.glow(cx, cy, 10 + 10 * beat, C[3], (0.25 + 0.5 * beat) * fade);
    p.disc(cx, cy, 2 + beat * 2, C[3 + (beat > 0.5 ? 1 : 0)], fade);
    // veins: branches from the chest, longer per beat
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * TAU + 0.3, L = (6 + 8 * level) * (0.7 + 0.3 * ((i * 0.37) % 1)), x1 = cx + Math.cos(a) * L * 0.6, y1 = cy + Math.sin(a) * L;
      p.line(cx, cy, x1, y1, C[2 + (beat > 0.3 ? 1 : 0)], (0.5 + 0.5 * beat) * fade);
      p.line(x1, y1, x1 + Math.cos(a + 0.6) * 4, y1 + Math.sin(a + 0.6) * 4, C[2], 0.6 * fade);
    }
    // clear flames leaking out of the body's edge
    for (let i = 0; i < 4 + level * 3; i++) {
      const side = i % 2 ? 1 : -1, y = -8 - ((i * 13) % 44), x = TX + side * 8, h = 6 + 5 * Math.sin(t * 12 + i);
      p.line(x, y, x + side * 2, y - h, RIM, 0.45 * fade);
      p.line(x + side, y, x + side * 3, y - h * 0.6, C[4], 0.35 * fade);
    }
  }
}
// the burst: rose flash from the chest, a clear column shooting up, ash rising, the serpent's soul fading upward
function burn(p, t, layer) {
  const τ = t - BURN;
  if (τ < 0 || τ > 1.1) return;
  const [cx, cy] = CHEST;
  if (layer === 'front') {
    if (τ < 0.1) p.disc(cx, cy, 10 + 140 * τ, C[4], 1 - τ / 0.1);
    const h = 150 * out3(clamp(τ / 0.2)), w = 10 * (1 - smooth(0.3, 0.8, τ));
    if (w > 0.5) for (const s of [-1, 1]) {   // the clear column: only its rims and a few inner streaks
      p.line(cx + s * w, cy + 10, cx + s * w * 0.4, cy - h, RIM, 0.7);
      p.line(cx + s * w * 0.4, cy, cx + s * w * 0.15, cy - h * 0.8, C[4], 0.5);
    }
    for (let i = 0; i < 20; i++) {   // ash
      const s = τ - (i % 5) * 0.04;
      if (s > 0) p.dot(cx + Math.sin(i * 2.7) * (6 + 30 * s), cy - 10 - (i * 7) % 40 - 60 * s, ASH[i % 3], 1 - smooth(0.5, 1, s));
    }
    // soul of the serpent: a fading ring trail rising in an S
    for (let i = 0; i < 10; i++) {
      const u = clamp(τ * 1.4 - i * 0.04), x = cx + Math.sin(u * 7 + i * 0.3) * 10, y = cy - 20 - 120 * u;
      if (u > 0 && u < 1) p.circle(x, y, 4 * (1 - i / 10) + 1, RIM, 0.35 * (1 - u));
    }
  }
}

export function drawBack(p, t) {
  serpent(p, t, 'back');
}
export function draw(p, t) {
  caster(p, t);
  serpent(p, t, 'front');
  heart(p, t, 'front');
  burn(p, t, 'front');
}
