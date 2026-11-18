// Three tiers of white flame, viewed slightly from above.
import { clamp, smooth } from '../../core/index.js';
import { L, APPEAR, OPENS, LOCK, BOOM, LC, out3, hsh } from './_tinhlien-common.js';

// Root x/y, open tip x/y, full width, phase. The outer ring straddles the other tiers.
const OUTER_BACK = [
  [-7, 4, -34, -15, 15, 0.3], [1, 4, 27, -29, 16, 4.4], [7, 5, 35, -15, 15, 5.6],
];
const MIDDLE = [
  [-5, 4, -27, -28, 13, 2], [4, 3, 16, -36, 14, 6.6], [-1, 4, 0, -40, 15, 3.7],
  [-3, 4, -15, -36, 14, 1.7], [5, 5, 27, -24, 13, 8.2],
];
const BUD = [
  [-3, 4, -10, -25, 11, 4.9], [4, 4, 12, -25, 11, 7.3], [0, 4, 3, -32, 12, 2.8],
];
const OUTER_FRONT = [
  [-7, 8, -32, -8, 17, 1.2], [7, 8, 33, -7, 17, 3.3], [0, 9, -3, -13, 15, 5.1],
];

// Local axial positions and half-widths. The last crown points form continuous forks.
const PROFILE = [[0, 0.09], [0.19, 0.32], [0.39, 0.51], [0.58, 0.47], [0.73, 0.31]];
const EMBERS = Array.from({ length: 6 }, (_, i) => [hsh(i, 6), hsh(i, 7)]);
const SPARKS = Array.from({ length: 7 }, (_, i) => {
  const a = -Math.PI / 2 + (i - 3) * 0.49 + (hsh(i, 15) - 0.5) * 0.2;
  return [Math.cos(a), Math.sin(a), i / 7, hsh(i, 16)];
});

function fillPetal(p, points, ox, oy, ax, ay, veinWidth, rim, body, base, vein) {
  const edges = [], screen = points.map(([x, y]) => [p.toX(x, y), p.toY(x, y)]);
  let low = Infinity, high = -Infinity;
  for (let i = 0, j = screen.length - 1; i < screen.length; j = i++) {
    let [x0, y0] = screen[j], [x1, y1] = screen[i];
    if (y1 < y0) { [x0, x1] = [x1, x0]; [y0, y1] = [y1, y0]; }
    if (y1 === y0) continue;
    edges.push([x0, y0, y1, (x1 - x0) / (y1 - y0)]);
    low = Math.min(low, y0);
    high = Math.max(high, y1);
  }
  const hits = [], xEnd = p.ox + p.w - 1;
  for (let y = Math.max(p.oy, Math.ceil(low - 0.5)); y <= Math.min(p.oy + p.h - 1, Math.floor(high - 0.5)); y++) {
    const yy = y + 0.5;
    hits.length = 0;
    for (const edge of edges) {
      if (yy >= edge[1] && yy < edge[2]) hits.push(edge[0] + (yy - edge[1]) * edge[3]);
    }
    if (hits.length === 2 && hits[0] > hits[1]) [hits[0], hits[1]] = [hits[1], hits[0]];
    if (hits.length > 2) hits.sort((a, b) => a - b);
    for (let j = 0; j + 1 < hits.length; j += 2) {
      const left = Math.ceil(hits[j] - 0.5), right = Math.floor(hits[j + 1] - 0.5);
      const dy = yy - oy;
      const end = Math.min(right, xEnd);
      for (let x = Math.max(left, p.ox); x <= end; x++) {
        const dx = x + 0.5 - ox, u = dx * ax + dy * ay;
        // The curled vein ends before the fork, leaving the tips white.
        const v = dy * ax - dx * ay + 0.052 * u * u;
        const pigment = u < 0.22 ? base : u < 0.76 && Math.abs(v) < veinWidth ? vein : body;
        p.put(x, y, pigment);
      }
    }
  }
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    p.line(points[j][0], points[j][1], points[i][0], points[i][1], rim);
  }
}

function petal(p, design, cx, cy, sx, sy, sway, t, crush, rim, body) {
  const [rootX, rootY, tipX, tipY, width, phase] = design;
  const bx = cx + rootX * sx, by = cy + rootY * sy;
  const flicker = t * 13 + phase;
  const dx = ((tipX - rootX) * (1 - 0.73 * crush) + sway * (rootY - tipY) + 1.55 * Math.sin(flicker)) * sx;
  const dy = (tipY - rootY + 1.5 * Math.sin(t * 11 + phase)) * sy;
  const length = Math.hypot(dx, dy);
  const nx = -dy / length, ny = dx / length, w = width * sx;
  const bend = w * (0.11 * Math.sin(t * 8 + phase) - 0.06);
  const point = (u, v) => {
    const offset = v * w + bend * u * u;
    const x = bx + dx * u + nx * offset, y = by + dy * u + ny * offset;
    return [x, y];
  };

  const left = [], right = [];
  for (const [u, half] of PROFILE) {
    left.push(point(u, -half * (1 + 0.15 * Math.sin(flicker - u * 10))));
    right.push(point(u, half * (1 + 0.15 * Math.sin(flicker + 1.2 - u * 10))));
  }
  const leftTip = 0.82 + 0.06 * Math.sin(flicker + 0.5);
  const rightTip = 0.86 + 0.07 * Math.sin(flicker - 0.9);
  const crown = [
    point(leftTip, -0.24), point(0.8, -0.09),
    point(1.01 + 0.04 * Math.sin(flicker + 2), 0.025 * Math.cos(flicker)),
    point(0.82, 0.1), point(rightTip, 0.22),
  ];
  const ox = p.toX(bx, by), oy = p.toY(bx, by);
  const ax = (p.toX(bx + dx, by + dy) - ox) / (length * length);
  const ay = (p.toY(bx + dx, by + dy) - oy) / (length * length);
  const heat = clamp(crush + 0.13 * Math.sin(flicker * 0.76));
  fillPetal(p, [...left, ...crown, ...right.reverse()], ox, oy, ax, ay, 0.54 / length,
    L[heat > 0.92 ? 5 : heat > 0.55 ? 4 : rim],
    L[heat > 0.47 ? 6 : body],
    L[heat > 0.78 ? 5 : heat > 0.48 ? 4 : 2],
    L[heat > 0.65 ? 5 : 3]);
}

function embers(p, t, cx, cy, sx, sy, born, crush) {
  for (let i = 0; i < EMBERS.length; i++) {
    const [seed, drift] = EMBERS[i];
    const age = (t * 1.5 + i / EMBERS.length) % 1;
    const size = born * smooth(0, 0.1, age) * (1 - smooth(0.54, 1, age)) * (1 - crush);
    if (size < 0.42) continue;
    const side = i % 2 ? 1 : -1;
    const x = cx + side * (16 + 14 * seed - age * 5) * sx + Math.sin(t * 6 + i) * age * 3;
    const y = cy - (10 + 9 * drift + age * 30) * sy;
    const h = (4.5 + seed * 3) * size, w = (1.2 + drift * 0.7) * size;
    p.poly([[x, y], [x - w, y - h * 0.35], [x + side * w * 0.7, y - h],
      [x + w, y - h * 0.42], [x + w * 0.65, y - h * 0.12]], L[4]);
    p.line(x, y - h * 0.25, x + side * w * 0.55, y - h * 0.71, L[6]);
  }
}

export function lotus(p, t, layer) {
  if (t < APPEAR - 0.05 || t > BOOM + 0.02) return;
  const born = out3(clamp((t - APPEAR + 0.05) / 0.25));
  if (born < 0.08) return;
  const crush = smooth(LOCK, BOOM, t), stare = smooth(OPENS[2], LOCK, t);
  const breath = (0.06 + 0.05 * stare) * Math.sin(t * 8.4) + 0.025 * Math.sin(t * 15);
  const size = born * (1 - 0.5 * crush);
  const sx = size * (1 + breath), sy = size * (1 - 0.58 * breath);
  const sway = 0.07 * Math.sin(t * 4.3) + 0.035 * Math.sin(t * 9.1);
  // The loose bloom rests on the chest. During compression its crown meets the ray at LC.
  const cx = LC[0] + 1.7 * Math.sin(t * 5) * (1 - crush);
  const cy = LC[1] + 0.85 * Math.sin(t * 8.4) + 8 * crush;
  if (layer === 'back') {
    p.glow(cx, cy - 10 * sy, 24 * size, L[3], 0.075 + 0.1 * crush);
    for (const shape of OUTER_BACK) petal(p, shape, cx, cy, sx, sy, sway, t, crush, 4, 5);
    return;
  }
  for (const shape of MIDDLE) petal(p, shape, cx, cy, sx, sy, sway, t, crush, 3, 5);
  for (const shape of BUD) petal(p, shape, cx, cy, sx, sy, sway, t, crush, 3, 6);
  for (const shape of OUTER_FRONT) petal(p, shape, cx, cy, sx, sy, sway, t, crush, 3, 5);
  embers(p, t, cx, cy, sx, sy, born, crush);

  const flare = smooth(0.2, 1, crush);
  if (flare <= 0) return;
  p.glow(LC[0], LC[1], 7 + 8 * flare, L[5], 0.36 * flare);
  for (const [dx, dy, phase, seed] of SPARKS) {
    const age = ((t - LOCK) * 5 + phase) % 1;
    if (age > 0.45 + 0.37 * flare) continue;
    const r = 1 + age * (11 + 13 * flare), length = 1 + (1 - age) * (2 + seed * 2) * flare;
    p.line(LC[0] + dx * r, LC[1] + dy * r,
      LC[0] + dx * (r + length), LC[1] + dy * (r + length), L[age < 0.3 ? 6 : 4]);
  }
}
