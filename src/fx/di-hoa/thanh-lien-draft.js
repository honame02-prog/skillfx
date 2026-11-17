// DRAFT v2 (motion + shape blocking) — Di Hoa 1: Thanh Lien Dia Tam Hoa. Script: design/di-hoa/01-thanh-lien-dia-tam-hoa.md.
// The lotus life cycle: seed -> lava pond -> bud -> bloom -> the seed pod bursts into a volcano.
// Flat, hard-banded shapes on purpose: this draft judges the petal silhouette, the layering and the timing.
import { fit, smooth, clamp, TAU, WHITE, READY, hex } from '../../core/index.js';
import { FLAMES } from '../ultimate/_lotus-lib.js';

const C = fit(FLAMES[0], 7), COOL = ['#100a0c', '#2a1814', '#5a2414', '#a8461c'].map(hex), DIRT = ['#342b3a', '#514353', '#81706d'].map(hex);
const TX = 150, END = 3.2, SEED = 0.35, LAND = 0.75, BUD = 1.1, OPEN = 1.45, FULL = 1.9, BURST = 2.05;
const sm = (u) => u * u * (3 - 2 * u), out3 = (u) => 1 - (1 - u) ** 3;
export const meta = {
  name: 'Thanh Lien Draft',
  desc: 'Motion draft v2: a fire lotus seed is flicked into the ground, a lava pond grows a bud that blooms round the target, then the seed pod erupts like a volcano.',
  tags: ['di-hoa', 'draft', 'fire', 'lotus', 'volcano', 'one-shot'],
  size: [360, 260], origin: [60, 235], duration: END, loop: false, fps: 30, bg: 'ground', actor: 2,
  options: { seed: 5 },
};
const MUDRA = { ...READY, crouch: 3, fx: 9, fy: -30, bx: 10, by: -31, armsFront: true };
export const act = {
  target: { x: TX },
  poses: [[-0.2, READY], [0.12, { ...READY, lean: -3, fx: -6, fy: -27, bx: -2, by: -22 }], [SEED, { ...READY, lean: -4, fx: -8, fy: -29, bx: -3, by: -22 }],
    [SEED + 0.06, { ...READY, lean: 6, crouch: 4, fx: 21, fy: -27, bx: -4, by: -20 }, 'snap'], [0.9, MUDRA], [FULL, { ...MUDRA, crouch: 5 }],
    [BURST, { ...READY, crouch: 0, fx: 6, fy: -45, bx: 8, by: -45 }, 'snap'], [BURST + 0.5, { ...READY, crouch: 2, fx: 9, fy: -40, bx: 10, by: -38 }], [END, READY]],
  hits: [
    { t: LAND, stop: 0.03, shake: 0.12, amp: 1, target: false },
    { t: BUD + 0.1, shake: 0.25, amp: 2, push: 0.5, straw: 6 },
    { t: BURST, stop: 0.12, shake: 0.5, amp: 4, push: 3, straw: 30, flash: 0.1, skin: 'char' },
    { t: END - 0.35, push: 0, straw: 0, skin: null },
  ],
};

// ---- one lotus petal: narrow root, widest near 60%, pointed tip; hard bands, centre vein, dark rim
function petalShape(p, bx, by, tx, ty, W, k, crackK = 0) {
  const dx = tx - bx, dy = ty - by, L = Math.hypot(dx, dy);
  if (L < 2 || k <= 0) return;
  const ux = dx / L, uy = dy / L, nx = -uy, ny = ux, N = 12;
  // broad, cupped lotus petal: full shoulders high up, a short pointed tip
  const hw = (u) => u < 0.68 ? W * (0.22 + 0.78 * Math.pow(Math.sin(Math.PI * 0.5 * u / 0.68), 0.75)) : W * Math.pow((1 - u) / 0.32, 1.15);
  const outline = (s, u0 = 0) => {
    const l = [], r = [];
    for (let i = 0; i <= N; i++) {
      const u = u0 + (1 - u0) * i / N, x = bx + dx * u, y = by + dy * u, w = hw(u) * s;
      l.push([x + nx * w, y + ny * w]); r.unshift([x - nx * w, y - ny * w]);
    }
    return [...l, ...r];
  };
  const o = outline(1);
  p.poly(o, C[2], k);
  p.poly(outline(0.6, 0.18), C[3], k);
  p.poly(outline(0.28, 0.4), C[5], k);
  p.polyline([...o, o[0]], C[1], k);
  p.line(bx + dx * 0.1, by + dy * 0.1, bx + dx * 0.8, by + dy * 0.8, C[4], 0.7 * k);
  p.dot(tx, ty, C[6], k);
  if (crackK > 0) p.polyline([[bx + dx * 0.2, by + dy * 0.2], [bx + dx * 0.45 + nx * 2, by + dy * 0.45 + ny * 2], [bx + dx * 0.7, by + dy * 0.7]], WHITE, crackK);
}
// ---- the flower: three rings round the seed pod; open 0 = closed bud (tips lean in), 1 = full bloom
const RINGS = [{ n: 6, r: 24, L: 38, W: 13, th: 1.18, off: 0.26 }, { n: 5, r: 14, L: 40, W: 12.5, th: 0.72, off: 0.9 }, { n: 4, r: 6, L: 36, W: 11, th: 0.26, off: 0.4 }];
function petals(t) {
  const rise = sm(clamp((t - BUD) / (OPEN - BUD))), open = sm(clamp((t - OPEN) / (FULL - OPEN)));
  const squeeze = 1 - 0.1 * smooth(FULL, BURST, t), list = [];
  RINGS.forEach((R, ring) => {
    // outer petals open first, inner ones last
    const o = sm(clamp(open * 1.5 - ring * 0.25));
    for (let i = 0; i < R.n; i++) {
      const a = i * TAU / R.n + R.off, th = (-0.18 + (R.th + 0.18) * o) * squeeze, L = R.L * rise * (0.92 + 0.08 * squeeze), W = R.W * (0.55 + 0.45 * rise);
      const bx = TX + Math.cos(a) * R.r, by = -3 + Math.sin(a) * R.r * 0.3;
      list.push({ ring, a, bx, by, tx: bx + Math.cos(a) * Math.sin(th) * L, ty: by - Math.cos(th) * L + Math.sin(a) * Math.sin(th) * L * 0.3, W, front: Math.sin(a) >= 0 });
    }
  });
  return list;
}
function flower(p, t, layer) {
  if (t < BUD || t >= BURST) return;
  const crackK = smooth(FULL, BURST, t);
  const all = petals(t).filter((q) => q.front === (layer === 'front'));
  all.sort((a, b) => layer === 'front' ? b.ring - a.ring : a.ring - b.ring);   // back: outer->inner, front: inner->outer
  for (const q of all) petalShape(p, q.bx, q.by, q.tx, q.ty, q.W, 1, crackK * 0.8);
  if (layer === 'back' && t > OPEN) {   // the seed pod
    const k = smooth(OPEN, OPEN + 0.2, t), glow = 0.3 + 0.7 * smooth(FULL, BURST, t);
    p.ellipse(TX, -9, 9, 3, C[3], k);
    p.ellipse(TX, -10, 7, 2, C[5], k);
    for (let i = 0; i < 5; i++) p.dot(TX - 4 + i * 2, -10 + (i & 1), WHITE, k * glow);
  }
}

// ---- seed in the palm, its arc to the ground
function seed(p, t) {
  if (t > LAND) return;
  let x = 16, y = -27;
  if (t > SEED) { const u = (t - SEED) / (LAND - SEED); x = 16 + (TX - 16) * u; y = -27 + 27 * u - 46 * Math.sin(Math.PI * u); }
  const k = smooth(0.05, 0.25, t);
  for (let i = 1; t > SEED && i < 6; i++) {   // trail
    const u = clamp((t - SEED - i * 0.025) / (LAND - SEED)), tx = 16 + (TX - 16) * u, ty = -27 + 27 * u - 46 * Math.sin(Math.PI * u);
    p.dot(tx, ty, C[i < 3 ? 4 : 3], 1 - i / 6);
  }
  p.ellipse(x, y, 2.5, 1.8, C[5], k);
  p.dot(x, y - 1, WHITE, k);
  p.glow(x, y, 7, C[4], 0.35 * k);
}
// ---- the ground: ripples, lava pond, fire roots, cooling to cracked black rock
function ground(p, t) {
  if (t < LAND) return;
  const τ = t - BURST, cool = smooth(BURST + 0.3, BURST + 1.0, t), fade = 1 - smooth(END - 0.25, END - 0.02, t);
  for (let i = 0; i < 3; i++) {   // the earth ripples like water
    const u = clamp((t - LAND - i * 0.08) / 0.35);
    if (u > 0 && u < 1) p.ellipse(TX, 0, 8 + 60 * u, (8 + 60 * u) * 0.2, C[4], (1 - u) * 0.8);
  }
  const g = out3(clamp((t - LAND - 0.1) / 0.3)), rx = 62 * g;
  if (rx < 1) return;
  const col = (i) => cool < 0.5 ? C[i] : COOL[Math.min(3, i - 1)];
  p.ellipse(TX, 0, rx, rx * 0.22, col(2), fade);
  p.ellipse(TX, 0, rx * 0.72, rx * 0.15, col(3), fade * (1 - cool * 0.7));
  p.polyline(Array.from({ length: 41 }, (_, i) => [TX + Math.cos(i * TAU / 40) * rx, Math.sin(i * TAU / 40) * rx * 0.22]), col(4), fade);
  for (let i = 0; i < 10; i++) {   // fire roots creeping out under the floor
    const a = i * TAU / 10 + 0.3, len = (18 + (i * 7) % 20) * smooth(LAND + 0.1, BUD + 0.1, t), pts = [];
    for (let s = 0; s <= 4; s++) { const r = rx + len * s / 4; pts.push([TX + Math.cos(a + Math.sin(s * 1.7 + i) * 0.06) * r, Math.sin(a) * r * 0.22]); }
    p.polyline(pts, cool < 0.5 ? C[3] : COOL[2], fade * (1 - 0.5 * cool));
  }
  if (cool > 0.3) for (let i = 0; i < 6; i++) {   // cracks in the cooled crust
    const a = i * 1.1, r0 = rx * 0.2, r1 = rx * 0.8;
    p.polyline([[TX + Math.cos(a) * r0, Math.sin(a) * r0 * 0.22], [TX + Math.cos(a + 0.2) * r1 * 0.6, Math.sin(a + 0.2) * r1 * 0.13], [TX + Math.cos(a) * r1, Math.sin(a) * r1 * 0.22]], COOL[3], fade * smooth(0.3, 0.6, cool));
  }
  void τ;
}
// dirt thrown when the bud breaks the ground
function chunks(p, t) {
  const s = t - BUD;
  if (s <= 0 || s > 0.8) return;
  for (let i = 0; i < 14; i++) {
    const vx = Math.cos(i * 2.39) * (40 + (i * 13) % 50), vy = -(70 + (i * 29) % 70);
    const x = TX + vx * s, y = Math.min(0, -2 + vy * s + 260 * s * s);
    p.rect(x, y - 2, i % 3 ? 2 : 3, 2, DIRT[i % 3], 1 - smooth(0.5, 0.8, s));
  }
}
// ---- the volcano: column from the seed pod, petals blown off, lava, shock ring
function burst(p, t, layer) {
  const τ = t - BURST;
  if (τ < 0) return;
  if (layer === 'front') {
    const h = 240 * out3(clamp(τ / 0.18)), w = 16 * (1 - smooth(0.35, 1.0, τ)), bot = -2 - 200 * smooth(0.45, 1.0, τ);
    if (w > 0.5) {
      const band = (s, c) => p.poly([[TX - w * s, bot], [TX - w * s * 0.45, -h], [TX + w * s * 0.45, -h], [TX + w * s, bot]], c, 1);
      band(1, C[3]); band(0.6, C[4]); band(0.3, C[5]); band(0.12, C[6]);
    }
    const R = 20 + 260 * out3(clamp(τ / 0.6)), k = 1 - smooth(0.25, 0.6, τ);
    if (k > 0) p.polyline(Array.from({ length: 49 }, (_, i) => [TX + Math.cos(i * TAU / 48) * R, Math.sin(i * TAU / 48) * R * 0.18]), C[5], k);
    for (let i = 0; i < 18; i++) {   // lava droplets
      const a = -Math.PI * (0.15 + 0.7 * ((i * 0.618) % 1)), v = 120 + (i * 37) % 120, x = TX + Math.cos(a) * v * τ, y = Math.min(0, -10 + Math.sin(a) * v * τ + 300 * τ * τ);
      p.rect(x, y - 1, 2, 2, y < 0 ? C[i % 2 ? 5 : 4] : COOL[3], 1 - smooth(0.7, 1.0, τ));
    }
    for (let i = 0; i < 16; i++) {   // sparks left by the column
      const s = τ - 0.3 - (i % 5) * 0.05;
      if (s > 0 && s < 0.7) p.dot(TX + Math.sin(i * 3.1 + s * 5) * 8, -40 - (i * 13) % 120 - 90 * s, C[s < 0.3 ? 6 : 4], 1 - s / 0.7);
    }
  }
  // the petals, torn off and flung outward, tumbling down
  const fade = 1 - smooth(0.75, 1.1, τ);
  if (fade <= 0) return;
  for (const q of petals(BURST - 0.001)) {
    if (q.front !== (layer === 'front')) continue;
    const d = (130 - 25 * q.ring) * (1 - Math.exp(-3 * τ));
    const ox = Math.cos(q.a) * d, oy = Math.sin(q.a) * d * 0.3 - 60 * τ + 160 * τ * τ;
    const spin = τ * (4 + q.ring) * (q.a > Math.PI / 2 && q.a < 1.5 * Math.PI ? -1 : 1), L = Math.hypot(q.tx - q.bx, q.ty - q.by) * 0.75;
    const ang = Math.atan2(q.ty - q.by, q.tx - q.bx) + spin, bx = q.bx + ox, by = Math.min(-2, q.by + oy);
    petalShape(p, bx, by, bx + Math.cos(ang) * L, by + Math.sin(ang) * L, q.W * 0.8, fade, 0);
  }
}

export function drawBack(p, t) {
  ground(p, t);
  flower(p, t, 'back');
  burst(p, t, 'back');
}
export function draw(p, t) {
  seed(p, t);
  chunks(p, t);
  flower(p, t, 'front');
  burst(p, t, 'front');
}
