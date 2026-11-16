// Flame tongues and cooling puffs use Sprite Fusion's open-source fire techniques
// (https://www.spritefusion.com/pixel-art-vfx/fire), MIT License, Copyright (c) 2026 Hugo Duprez.
import { fit, TAU, WHITE, sparkle, smooth, cycle } from '../../core/index.js';
import { flameBlade, noiseFor, hotFirst, LAYERS, simDraw } from '../fire/_lib.js';

export const FLAMES = [
  ['#031d29', '#07545b', '#0c9b88', '#24d9a1', '#7afbc6', '#caffed', '#ffffff'],
  ['#210c38', '#4e1a79', '#8436c2', '#bd64f5', '#dda3ff', '#f4dcff', '#ffffff'],
  ['#081d47', '#164983', '#328ac4', '#70c8f3', '#b0e9ff', '#e0f8ff', '#ffffff'],
  ['#370c1c', '#8d1c29', '#e34a22', '#ff952e', '#ffce62', '#fff1b6', '#ffffff'],
];
export function flames(o) {
  const a = o.flames ?? FLAMES;
  const ramps = a.slice(0, 4).map(r => fit(r, 7));
  // palette is a useful shorthand for replacing the first flame; the others stay distinct.
  if (o.palette) ramps[0] = fit(o.palette, 7);
  return ramps.length >= 2 ? ramps : FLAMES.slice(0, 2).map(r => fit(r, 7));
}
export const LOOP = 3.2;
const NL = noiseFor(LOOP);
const WIDTH = Array.from({ length: 257 }, (_, i) => Math.pow(Math.sin(Math.PI * i / 256), 0.62) * (1 - 0.3 * i / 256));
const CURVE = Array.from({ length: 257 }, (_, i) => Math.sin(Math.PI * i / 256));

// A petal-shaped volume of fire: cooling root, translucent ragged edges and turbulent light.
// Shared by the intact flower and falling fragments; there is no solid rim or folded facet.
export function petal(p, x, y, dx, dy, w, C, t, seed, alpha = 1, crack = 0, lick = true) {
  t = ((t % LOOP) + LOOP) % LOOP;
  const len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  if (len < 0.01) return;
  const N = (rate, s = 0, off = 0) => NL(t, rate, s, off);
  const bend = Math.sin(seed * 3.71) * w * 0.19;
  const flow = Array.from({ length: 65 }, (_, i) => [
    N(3.75, seed, -i * 0.11), N(5, seed + 9, -i * 0.14), N(2.5, seed + 19, -i * 0.09),
  ]);
  const margin = w + 3;
  p.each(Math.min(x, x + dx) - margin, Math.min(y, y + dy) - margin,
    Math.max(x, x + dx) + margin, Math.max(y, y + dy) + margin, (px, py, sx, sy) => {
      const ax = px - x, ay = py - y, u = (ax * ux + ay * uy) / len;
      if (u <= 0 || u >= 1) return;
      const ui = Math.round(u * 256), f = flow[Math.round(u * 64)];
      const v = ax * nx + ay * ny - bend * CURVE[ui] - f[2] * u * 1.2;
      const upper = v * ny < 0, rough = (upper ? 2 : 0.8) * smooth(0.25, 0.85, u);
      const half = w * WIDTH[ui] + (v < 0 ? f[0] : f[1]) * rough;
      const edge = half - Math.abs(v);
      if (edge <= 0 || half <= 0) return;
      const volume = smooth(0, Math.max(1.8, half * 0.7), edge);
      const heat = smooth(0.08, 0.4, u) * (0.65 + 0.35 * f[2]);
      const curl = Math.max(0, 1 - Math.abs(v / half + f[0] * 0.4));
      const a = alpha * volume * (0.5 + 0.22 * heat) * (0.8 + f[1] * 0.2);
      p.blendPx(sx, sy, C[u < 0.18 ? 0 : heat > 0.65 ? 3 : 2], a);
      p.add(sx, sy, C[4], alpha * volume * heat * curl * (0.36 + crack * 0.15));
    });
  if (lick) {
    const H = hotFirst(C), side = ny > 0 ? -1 : 1;
    for (let j = 0; j < 2; j++) {
      const u = 0.72 + j * 0.22, ui = Math.round(u * 256);
      const off = bend * CURVE[ui] + side * w * WIDTH[ui] * 0.65;
      const tx = x + dx * u + nx * off, ty = y + dy * u + ny * off;
      const L = (3 + 5 * (0.5 + 0.5 * N(4, seed + j * 13))) * Math.min(1, w / 6);
      const fade = p.fade; p.fade *= alpha;
      flameBlade(p, tx, ty, ux * 0.18, -1, L, Math.max(0.55, w * 0.12),
        N(5, seed + j + 3) * 1.6, N, seed + j * 13, H, [[1, 1, 4], [0.5, 0.65, 3]], 0.5, 1.2);
      p.fade = fade;
      p.glow(tx, ty - L * 0.35, L, C[4], 0.08 * alpha);
    }
    // P.FIRE / P.EMBER rise and cooling, sampled analytically to preserve the loop.
    cycle(t, LOOP, 5, seed + 300, R => R.range(0.22, 0.55), (age, life, R) => {
      const q = age / life, u = R.range(0.78, 1), k = Math.sin(q * Math.PI) * alpha;
      const tx = x + dx * u + R.range(-1.5, 1.5) + R.range(-4, 4) * age;
      const ty = y + dy * u - (14 * age + 16 * age * age);
      p.disc(tx, ty, (1 - q) * 1.2, C[q < 0.4 ? 4 : 2], d => k * (1 - d) * 0.75);
      p.light(tx, ty, C[5], k * 0.5);
      p.glow(tx, ty, 3, C[4], k * 0.22);
    });
  }
  p.glow(x + dx * 0.65, y + dy * 0.65, w * 1.8, C[4], 0.09 * alpha);
}

export function lotus(p, t, ramps, { x = 0, y = -28, size = 1, instability = 0, halo = true, seed = 1 } = {}) {
  t = ((t % LOOP) + LOOP) % LOOP;
  const ph = t / LOOP * TAU, breath = 1 + Math.sin(ph * 2) * 0.025;
  const s = size * breath, rot = 0.11 * Math.sin(ph), bob = Math.sin(ph) * s;
  const jit = instability * Math.sin(t * 113) * 1.2;
  x += jit; y += bob;
  if (halo) wheel(p, t, ramps, x, y - 6 * s, 40 * s);
  const drawRow = (n, radius, high, width, row, baseY) => {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI + 0.17 + i / (n - 1) * (Math.PI - 0.34) + rot;
      const sway = instability * Math.sin(t * 91 + i * 4 + row) * 2;
      const dx = Math.cos(a) * radius * s + sway;
      const dy = (Math.sin(a) * high - 3) * s;
      const C = ramps[(i + row) % ramps.length];
      petal(p, x + Math.cos(a) * 2 * s, y + baseY * s, dx, dy, width * s, C, t,
        seed * 31 + i + row * 11, 1, instability * smooth(0.25, 0.8, i / n + 0.25));
    }
  };
  drawRow(7, 32, 32, 8.3, 0, 0);
  drawRow(5, 24, 23, 8.1, 1, 3);
  // Lower petals close into a shallow bowl, leaving the white stamen above them.
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI + 0.12 + i / 4 * (Math.PI - 0.24) + rot;
    petal(p, x, y + 7 * s, Math.cos(a) * 29 * s, (Math.sin(a) * 10 - 5) * s,
      5.2 * s, ramps[(i + 2) % ramps.length], t, seed * 41 + i, 1, instability);
  }
  const pulse = 0.85 + 0.15 * Math.sin(ph * 2);
  for (let i = 0; i < 5; i++) {
    const dx = (i - 2) * 1.8 * s, h = (5 - Math.abs(i - 2)) * s;
    p.line(x + dx, y - 2 * s, x + dx * 0.7, y - h - 4 * s, ramps[i % ramps.length][4], 0.5);
    p.light(x + dx * 0.7, y - h - 4 * s, WHITE, pulse * 0.65);
  }
  p.disc(x, y - 5 * s, 1.5 * s, WHITE, d => (1 - d) * pulse);
  sparkle(p, x, y - 5 * s, 4 * s, WHITE, ramps[0][4], 0.23 * pulse);
  p.glow(x, y - 5 * s, 10 * s, WHITE, 0.34 * pulse);
  p.glow(x, y - 8 * s, 42 * s, ramps[0][3], 0.1 * pulse);
}

export function wheel(p, t, ramps, x, y, radius) {
  t = ((t % LOOP) + LOOP) % LOOP;
  p.ring(x, y, radius, 1, ramps[0][3], 0.18);
  p.ring(x, y, radius - 3, 0.6, ramps[1][3], 0.12);
  // Twelve turning broken spokes, with a complete revolution at the loop seam.
  for (let i = 0; i < 12; i++) {
    const a = i * TAU / 12 + 0.15 * Math.sin(t / LOOP * TAU);
    const C = ramps[i % ramps.length];
    const r = radius - 6;
    p.line(x + Math.cos(a) * r, y + Math.sin(a) * r, x + Math.cos(a) * radius, y + Math.sin(a) * radius, C[4], 0.25);
    const pts = Array.from({ length: 6 }, (_, k) => {
      const g = a + 0.03 + k / 5 * 0.19;
      return [x + Math.cos(g) * (radius - 8), y + Math.sin(g) * (radius - 8)];
    });
    p.polyline(pts, C[3], 0.2);
  }
}

// Seamless analytic EMBER motion: the same rise, wander, cooling and hot head as P.EMBER.
export function orbitEmbers(p, t, ramps, seed, x = 0, y = -30, size = 1) {
  t = ((t % LOOP) + LOOP) % LOOP;
  cycle(t, LOOP, 42, seed, R => R.range(0.5, 1.3), (age, life, R) => {
    const q = age / life, a = R.range(0, TAU) + q * 1.4, r = R.range(25, 43) * size;
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * 0.5 - q * 14 * size;
    const C = ramps[R.int(0, ramps.length - 1)], k = Math.sin(q * Math.PI);
    p.line(px - Math.cos(a) * 1.6, py + 1, px, py, C[q < 0.4 ? 5 : 3], k);
    p.glow(px, py, 3, C[4], 0.3 * k);
  });
}

// Never alter a shared particle renderer: select one ramp per system and draw its fire locally.
export function drawColored(ps, p, C, layer) {
  simDraw(p, ps, hotFirst(fit(C, 9)), layer);
}
