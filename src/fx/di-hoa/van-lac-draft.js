// DRAFT v1 (motion + shape blocking) — Di Hoa 3: Van Lac Tam Viem. Script: design/di-hoa/03-van-lac-tam-viem.md.
// An invisible flame serpent (only faint rims and a rose-red heart) leaves the caster's chest, coils round the target,
// dives into its chest and burns it from inside in three heartbeats; a clench makes the heart flame burst out.
import { smooth, clamp, TAU, WHITE, READY, hex, poseAt, mix } from '../../core/index.js';
import { spine, drawSerpent } from './_serpent-lib.js';

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
    const u = sm((t - OUT) / (REACH - OUT)), x = hx + (TX - 17 - hx) * u, y = hy + (-8 - hy) * u - 22 * Math.sin(u * Math.PI) + 7 * Math.sin(u * TAU * 1.5) * (1 - u);
    return [x, y];
  }
  if (t < DIVE) {   // coiling round the target, rising
    const u = (t - REACH) / (DIVE - REACH), a = Math.PI + u * TAU * 1.5;
    return [TX + Math.cos(a) * 17, -8 - 46 * u + Math.sin(a) * 3];
  }
  const u = sm(clamp((t - DIVE) / (IN - DIVE)));   // rears up then dives into the chest
  return [TX + 17 + (CHEST[0] - TX - 17) * u + 6 * Math.sin(u * Math.PI), -54 + (54 + CHEST[1]) * u - 14 * Math.sin(u * Math.PI)];
}
const BODY_L = 88, SLIDE = 260;   // body length (px); speed it slides into the chest (px/s)
const coilAngle = (ti) => Math.PI + ((ti - REACH) / (DIVE - REACH)) * TAU * 1.5;
function serpent(p, t, layer) {
  if (t < OUT || t > IN + BODY_L / SLIDE) return;
  const offset = Math.max(0, t - IN) * SLIDE, sp = spine(headAt, Math.min(t, IN), BODY_L - offset + 1, OUT);
  const keep = (ti, ly) => {   // coiling: the half of each turn behind the target goes to the back layer
    const behind = ti > REACH && ti < DIVE && Math.sin(coilAngle(ti)) < 0;
    return behind === (ly === 'back');
  };
  drawSerpent(p, sp, t, { L: BODY_L, W: 6.5, layer, keep, offset, mouth: smooth(DIVE, DIVE + 0.12, t), heart: 0.6 + 0.4 * smooth(DIVE, IN, t), seed: 2 });
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
// the burst: the heart flame explodes OUTWARD — rose flash, a clear shock ring, clear flame tongues flung all round,
// rose embers and ash scattering with gravity
const RAYS = Array.from({ length: 16 }, (_, i) => ({ a: -Math.PI / 2 + (i / 16 - 0.5) * TAU * 0.92 + Math.sin(i * 7.3) * 0.12, L: 34 + ((i * 37) % 23), w: 2 + (i % 3) }));
function burn(p, t, layer) {
  const τ = t - BURN;
  if (τ < 0 || τ > 1.1 || layer !== 'front') return;
  const [cx, cy] = CHEST;
  if (τ < 0.09) p.disc(cx, cy, 8 + 160 * τ, C[4], 1 - τ / 0.09);
  // the shock ring in the air (clear, like a lens) and its echo on the ground
  const R = 10 + 120 * out3(clamp(τ / 0.5)), kr = 1 - smooth(0.2, 0.5, τ);
  if (kr > 0) {
    const ring = (rr) => Array.from({ length: 73 }, (_, i) => [cx + Math.cos(i * TAU / 72) * rr, Math.min(-1, cy + Math.sin(i * TAU / 72) * rr)]);
    p.polyline(ring(R), RIM, 0.55 * kr);
    p.polyline(ring(R - 2), C[4], 0.3 * kr);
    p.polyline(Array.from({ length: 49 }, (_, i) => [cx + Math.cos(i * TAU / 48) * R * 1.1, Math.sin(i * TAU / 48) * R * 0.14]), RIM, 0.5 * kr);
  }
  // clear flame tongues shot outward: rims + a rose tip, stretching then thinning away
  for (const r of RAYS) {
    const u = clamp(τ / 0.6), ext = r.L * out3(clamp(τ / 0.18)) + 40 * u, head = cx + Math.cos(r.a) * ext, hy = Math.min(-1, cy + Math.sin(r.a) * ext + 30 * u * u);
    const tail = Math.max(0, ext - r.L * (1 - u)), tx = cx + Math.cos(r.a) * tail, ty = Math.min(-1, cy + Math.sin(r.a) * tail);
    const k = 1 - smooth(0.35, 0.6, τ), nx = -Math.sin(r.a) * r.w, ny = Math.cos(r.a) * r.w;
    if (k <= 0) continue;
    p.line(tx + nx, ty + ny, head, hy, RIM, 0.6 * k);
    p.line(tx - nx, ty - ny, head, hy, RIM, 0.6 * k);
    p.line(tx, ty, head, hy, SHADE, 0.25 * k);
    p.disc(head, hy, 1.4, C[4], k);
  }
  for (let i = 0; i < 40; i++) {   // rose embers and ash, flung out, falling
    const a = (i / 40) * TAU + Math.sin(i * 3.1), v = 60 + (i * 53) % 110, s = Math.max(0, τ - (i % 4) * 0.02);
    const x = cx + Math.cos(a) * v * s, y = Math.min(0, cy + Math.sin(a) * v * s + 140 * s * s);
    p.dot(x, y, i % 3 ? C[3 + (i % 2)] : ASH[i % 3], 1 - smooth(0.5, 1.0, s));
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
