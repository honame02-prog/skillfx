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

// A curved, pointed petal: dark folded underside, saturated body, thin hot lip and a lit vein.
// Shared by the intact flower and the falling fragments, so debris retains its identity.
export function petal(p, x, y, dx, dy, w, C, t, seed, alpha = 1, crack = 0, lick = true) {
  const len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  const bend = Math.sin(seed * 3.71) * w * 0.19;
  const margin = w + 2;
  p.shade(Math.min(x, x + dx) - margin, Math.min(y, y + dy) - margin,
    Math.max(x, x + dx) + margin, Math.max(y, y + dy) + margin, (px, py, out) => {
      const ax = px - x, ay = py - y, u = (ax * ux + ay * uy) / len;
      if (u <= 0 || u >= 1) return;
      const ui = Math.round(u * 256), half = w * WIDTH[ui];
      const v = ax * nx + ay * ny - bend * CURVE[ui], d = Math.abs(v), edge = half - d;
      if (edge < 0) return;
      const ridge = Math.abs(v + half * 0.22);
      out.a = alpha;
      out.c = edge < 0.85 ? C[v < 0 ? 5 : 2] : ridge < 0.7 && u > 0.2 ? C[5]
        : v > half * 0.4 ? C[1] : d > half * 0.65 ? C[3] : C[u > 0.57 ? 3 : 2];
      if (crack > 0 && u > 0.16 && u < 0.9 && Math.abs(v - Math.sin(u * 24 + seed) * half * 0.32) < crack * 0.8) {
        out.c = WHITE; out.k = 0.4 * crack; out.l = C[5];
      }
    });
  if (lick) {
    const N = (rate, s = 0, off = 0) => NL(t, rate, s, off);
    const L = 4 + 5 * (0.5 + 0.5 * N(5, seed));
    flameBlade(p, x + dx * 0.89, y + dy * 0.89, ux * 0.25, -1,
      L, Math.max(0.65, w * 0.15), N(4, seed + 3) * 2, N, seed, hotFirst(C), LAYERS);
  }
  p.glow(x + dx * 0.65, y + dy * 0.65, w * 1.8, C[4], 0.1 * alpha);
}

export function lotus(p, t, ramps, { x = 0, y = -28, size = 1, instability = 0, halo = true, seed = 1 } = {}) {
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
    p.line(x + dx, y - 2 * s, x + dx * 0.7, y - h - 4 * s, ramps[i % ramps.length][5]);
    p.dot(x + dx * 0.7, y - h - 4 * s, WHITE);
  }
  sparkle(p, x, y - 5 * s, 5 * s, WHITE, ramps[0][4], 0.3 * pulse);
  p.glow(x, y - 5 * s, 13 * s, WHITE, 0.26 * pulse);
  p.glow(x, y - 8 * s, 49 * s, ramps[0][3], 0.18 * pulse);
}

export function wheel(p, t, ramps, x, y, radius) {
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
