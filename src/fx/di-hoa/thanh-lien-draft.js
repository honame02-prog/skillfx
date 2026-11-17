// DRAFT (motion blocking) — Di Hoa 1: Thanh Lien Dia Tam Hoa. Simple shapes to judge paths and timing only.
// Script: design/di-hoa/01-thanh-lien-dia-tam-hoa.md (project root).
//   0.00-0.45 palm pressed to the ground   0.30-0.85 a lava vein races underground to the target
//   0.80-1.05 the cracks open into an 8-petal lotus on the floor   1.05-1.35 green lava erupts, petals grow round the target
//   1.35-1.90 the petals close over the target and burn (two hits)   1.90-2.90 embers, the cracks cool and go out
import { fit, smooth, clamp, TAU, WHITE, Rng, READY } from '../../core/index.js';
import { FLAMES, petal } from '../ultimate/_lotus-lib.js';

const C = fit(FLAMES[0], 7), EMBER = fit(['#1a0a08', '#4a1a10', '#8a3a18'], 3);
const TX = 150, HAND = 16, END = 2.9;
const ease = (u) => u * u * (3 - 2 * u);
export const meta = {
  name: 'Thanh Lien Draft',
  desc: 'Motion draft: a palm on the ground sends a green lava vein to the target, a lotus of cracks opens and erupts into petals that close and burn.',
  tags: ['di-hoa', 'draft', 'fire', 'ground', 'lotus', 'one-shot'],
  size: [320, 240], origin: [60, 215], duration: END, loop: false, fps: 30, bg: 'ground', actor: 2,
  options: { seed: 5 },
};
const KNEEL = { ...READY, crouch: 9, lean: 7, fx: 17, fy: -2, bx: 5, by: -15, ffx: 9, fbx: -9 };
export const act = {
  target: { x: TX },
  poses: [[-0.2, READY], [0.18, KNEEL, 'snap'], [1.0, { ...KNEEL, crouch: 8 }], [1.15, { ...KNEEL, crouch: 5, lean: 2, fy: -9 }],
    [1.9, { ...READY, crouch: 4 }], [END, READY]],
  hits: [
    { t: 0.18, stop: 0.04, shake: 0.12, amp: 1, target: false },
    { t: 1.05, shake: 0.3, amp: 2, push: 0.6, straw: 6 },
    { t: 1.62, stop: 0.07, shake: 0.25, amp: 3, push: 1.6, straw: 14, flash: 0.08 },
    { t: 1.84, stop: 0.05, shake: 0.2, amp: 2, push: 1.2, straw: 10, skin: 'char' },
    { t: END - 0.4, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: 0.18, x: 14, n: 6, dir: 1 }, { t: 0.18, x: 14, n: 6, dir: -1 }],
};

// the underground vein: a jittered path with a few short branches, fixed by the seed
const R = new Rng(5), VEIN = [], BR = [];
for (let x = HAND; x <= TX; x += 5) VEIN.push([x, 1 + Math.round(R.range(-1.5, 1.5))]);
for (let i = 0; i < 6; i++) {
  const k = 3 + Math.floor(i * (VEIN.length - 6) / 6), [x, y] = VEIN[k], s = i % 2 ? 1 : -1;
  BR.push({ k, pts: [[x, y], [x + R.range(4, 8), y + s * R.range(2, 4)], [x + R.range(9, 15), y + s * R.range(3, 6)]] });
}
const veinColor = (t, heat = 1) => {
  const cool = smooth(1.9, 2.8, t);
  return cool < 0.5 ? C[heat > 0.7 ? 5 : 3] : EMBER[2 - Math.min(2, Math.floor((cool - 0.5) * 6))];
};

function vein(p, t) {
  if (t < 0.3) return;
  const u = smooth(0.3, 0.85, t), head = HAND + (TX - HAND) * u, k = 1 - smooth(2.4, 2.9, t);
  const pts = VEIN.filter(([x]) => x <= head);
  if (pts.length > 1) p.polyline(pts, (v) => veinColor(t, v), k);
  for (const b of BR) if (VEIN[b.k][0] < head - 10) p.polyline(b.pts, veinColor(t, 0.3), 0.8 * k);
  if (u < 1) { p.glow(head, 0, 7, C[4], 0.5); p.disc(head, 0, 1.5, C[6], 1); }
}
function palm(p, t) {
  const k = smooth(0.12, 0.2, t) * (1 - smooth(0.45, 0.7, t));
  if (k <= 0) return;
  p.glow(HAND, -1, 14, C[4], 0.45 * k);
  p.ellipse(HAND, 0, 10 + 8 * smooth(0.18, 0.45, t), 2, C[5], 0.6 * k);
}
// floor lotus: eight petal-shaped cracks in perspective
function floorLotus(p, t) {
  const k = smooth(0.8, 1.0, t) * (1 - smooth(2.3, 2.9, t)), grow = ease(clamp((t - 0.8) / 0.25));
  if (k <= 0) return;
  for (let i = 0; i < 8; i++) {
    const a = i * TAU / 8 + 0.2, a1 = a - 0.28, a2 = a + 0.28, R0 = 36 * grow;
    const tip = [TX + Math.cos(a) * R0, Math.sin(a) * R0 * 0.2];
    p.polyline([[TX, 0], [TX + Math.cos(a1) * R0 * 0.6, Math.sin(a1) * R0 * 0.12], tip, [TX + Math.cos(a2) * R0 * 0.6, Math.sin(a2) * R0 * 0.12], [TX, 0]],
      veinColor(t, 0.5), k);
  }
  if (t < 1.35) p.glow(TX, -2, 30 * grow, C[3], 0.3 * k);
}
function eruption(p, t) {
  const k = smooth(1.05, 1.12, t) * (1 - smooth(1.3, 1.5, t));
  if (k <= 0) return;
  const h = 110 * ease(clamp((t - 1.05) / 0.2));
  p.beam(TX, 0, TX, -h, 10 * k, C[4], 0.8 * k);
  p.beam(TX, 0, TX, -h, 4 * k, C[6], k);
  p.glow(TX, -h, 12, C[5], 0.5 * k);
  const R2 = new Rng(9);
  for (let i = 0; i < 16; i++) {
    const vx = R2.range(-90, 90), vy = -R2.range(120, 220), s = t - 1.05;
    const x = TX + vx * s, y = Math.min(0, vy * s + 300 * s * s);
    if (s > 0) p.rect(x, y - 2, 2, 2, i % 3 ? C[2] : C[5], 1 - smooth(0.6, 1.0, s));
  }
}
// eight fire petals rise round the target, then fold inward over it
function petals(p, t, layer) {
  const g = smooth(1.08, 1.35, t), close = ease(clamp((t - 1.35) / 0.3)), fade = 1 - smooth(1.9, 2.3, t);
  if (g <= 0 || fade <= 0) return;
  for (let i = 0; i < 8; i++) {
    const a = i * TAU / 8 + 0.2, back = Math.sin(a) < 0;
    if (back !== (layer === 'back')) continue;
    const bx = TX + Math.cos(a) * 30, by = Math.sin(a) * 6;
    const open = [Math.cos(a) * 22, -62 * g], shut = [TX + Math.cos(a) * 3 - bx, -72 - by];
    const dx = open[0] + (shut[0] - open[0]) * close, dy = open[1] + (shut[1] - open[1]) * close;
    petal(p, bx, by, dx, dy, 9, C, t, 50 + i, fade * (back ? 0.75 : 1), 0, true);
  }
  const burst = Math.max(0, 1 - Math.abs(t - 1.62) / 0.08) + Math.max(0, 1 - Math.abs(t - 1.84) / 0.08) * 0.8;
  if (layer === 'front' && burst > 0) { p.glow(TX, -34, 46, C[5], 0.6 * burst); p.glow(TX, -34, 16, WHITE, 0.6 * burst); }
}
function embers(p, t) {
  if (t < 1.85) return;
  const R3 = new Rng(21);
  for (let i = 0; i < 26; i++) {
    const s = t - 1.85 - R3.range(0, 0.4), x0 = TX + R3.range(-26, 26), sp = R3.range(25, 60), life = R3.range(0.6, 1.0);
    if (s <= 0 || s > life) continue;
    p.dot(x0 + Math.sin(s * 6 + i) * 4, -10 - R3.range(0, 40) - sp * s, C[s < life * 0.4 ? 5 : 3], 1 - s / life);
  }
}

export function drawBack(p, t) {
  floorLotus(p, t);
  petals(p, t, 'back');
}
export function draw(p, t) {
  palm(p, t);
  vein(p, t);
  eruption(p, t);
  petals(p, t, 'front');
  embers(p, t);
}
