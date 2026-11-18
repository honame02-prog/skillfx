// The eye's cream-and-gold sunbeam, ground iris and fissures.
import { smooth, clamp, TAU } from '../../core/index.js';
import { L, IRIS, DUST, TX, OPENS, LOCK, BOOM, LC, EC, sm, hsh, openAt, eyeK, lockAt, pulses } from './_tinhlien-common.js';

const HEAT = Array.from({ length: 8 }, (_, i) => [(i + 0.3 * hsh(i, 4)) / 8, (hsh(i, 5) - 0.5) * 1.37, hsh(i, 12) * TAU]);

function sunlight(p, t, op, lock, fade) {
  const top = EC[1] + 5, end = LC[1] * lock, travel = -top;
  const topWidth = 3.2 + 4.8 * op, bottomWidth = 8 + 33 * op;
  const strength = (0.34 + 0.3 * op + 0.09 * pulses(t)) * fade;
  const pinch = 1 - lock;
  const wave = OPENS.map(at => (t - at) / 0.25).find(u => u > 0 && u < 1);
  const waveStrength = wave === undefined ? 0 : 0.28 * smooth(0, 0.1, wave) * (1 - smooth(0.9, 1, wave));
  const widthAt = (v) => (topWidth + (bottomWidth - topWidth) * v) * pinch + 2.15 * lock;
  const rows = [];
  for (let y = top; y <= end; y++) {
    const v = (y + 0.5 - top) / travel;
    const width = widthAt(v);
    const center = TX + 0.62 * Math.sin(t * 6 + v * 4) * pinch;
    const pulse = waveStrength ? waveStrength * Math.max(0, 1 - Math.abs(wave - v) / 0.12) : 0;
    const nearFlower = smooth(LC[1] - 51, LC[1] - 27, y);
    // The long gold rays remain visible where the cream core falls onto the opaque flower.
    const haze = strength * (0.52 - 0.24 * nearFlower * pinch);
    const core = strength * (0.64 - 0.59 * nearFlower * pinch);
    const sway = t * 3.6 + v * 5;
    const left = center + (-0.64 + 0.075 * Math.sin(sway)) * width;
    const right = center + (0.61 + 0.069 * Math.sin(sway + 2.4)) * width;
    const inner = center + (0.31 + 0.041 * Math.cos(sway + 1.3)) * width;
    rows.push({ center, edge: 1 / width, coreWidth: 1 / (0.78 + 0.11 * width), pulse, haze, core, left, right, inner });
  }
  const leftK = strength * pinch * (0.33 + 0.055 * Math.sin(t * 6));
  const rightK = strength * pinch * (0.26 + 0.05 * Math.sin(t * 6 + 2.5));
  const innerK = strength * pinch * (0.18 + 0.04 * Math.sin(t * 6 + 3.9));
  const focusK = fade * 1.45 * lock;
  // Shade short sections to bound the scan to the widening cone.
  for (let from = top; from < end; from += 24) {
    const to = Math.min(from + 24, end), width = widthAt((to - top) / travel) + 1;
    p.shade(TX - width, from, TX + width, to, (x, y, o) => {
      if (y < from || y >= to) return;
      const row = rows[Math.floor(y) - top];
      const dx = Math.abs(x - row.center), edge = dx * row.edge;
      if (edge >= 1) return;
      const shaft = x < row.center ? leftK * Math.max(0, 1 - Math.abs(x - row.left) / 1.34)
        : rightK * Math.max(0, 1 - Math.abs(x - row.right) / 1.34)
          + innerK * Math.max(0, 1 - Math.abs(x - row.inner) / 1.1);
      const core = Math.max(0, 1 - dx * row.coreWidth);
      const falloff = 1 - edge;
      o.l = core > 0.27 || (lock > 0.55 && edge < 0.43) ? L[5] : edge < 0.34 ? L[3] : L[2];
      o.k = row.haze * falloff * falloff + row.core * core + shaft + (row.pulse + focusK) * falloff;
    });
  }
  if (lock > 0.25) p.glow(LC[0], LC[1], 7, L[4], 0.56 * lock * fade);

  for (let i = 0; i < HEAT.length; i++) {
    const [start, lane, phase] = HEAT[i];
    if ((i + 1) / HEAT.length > (0.47 + 0.53 * op) * pinch * fade) continue;
    const age = (t * (0.36 + (i % 3) * 0.038) + start) % 1;
    const v = 0.92 - 0.72 * age, y = Math.floor(top + travel * v);
    const x = TX + lane * (topWidth + (bottomWidth - topWidth) * v) * pinch + 1.3 * Math.sin(t * 4 + phase);
    p.line(x, y, x, y - 1, L[4]);
  }
}

function groundIris(p, t, op, lock, fade) {
  const rx = 12 + 35 * op, ry = 3.4 + 5.1 * op, cy = -1;
  const strength = (0.22 + 0.46 * op) * (1 - 0.68 * lock) * fade;
  p.shade(TX - rx, cy - ry, TX + rx, cy + ry, (x, y, o) => {
    const e = ((x - TX) / rx) ** 2 + ((y - cy) / ry) ** 2;
    if (e >= 1) return;
    const lip = Math.max(0, 1 - Math.abs(e - 0.83) / 0.15);
    o.l = e < 0.59 ? L[4] : L[2];
    o.k = strength * (0.66 * (1 - e) + lip * (0.52 + lock * 0.24));
  });

  const visibility = smooth(0.11, 0.48, op) * (1 - 0.32 * lock) * fade;
  if (visibility < 0.2) return;
  for (let i = 0; i < 16; i++) {
    const a = i * TAU / 16 + t * 0.49;
    const cos = Math.cos(a), sin = Math.sin(a);
    const reach = (i % 4 === 0 ? 1 : 0.72) * visibility;
    const x = TX + cos * rx, y = cy + sin * ry;
    p.line(x - cos * 2.1 * reach, y - sin * 1.8 * reach,
      x + cos * 4.8 * reach, y + sin * 3.2 * reach, IRIS[i % 4 === 0 && visibility > 0.44 ? 3 : 2]);
  }
}

function beam(p, t) {
  const op = openAt(t);
  if (op < 0.036 || t > BOOM + 0.12) return;
  const lock = lockAt(t), fade = eyeK(t) * (1 - smooth(BOOM, BOOM + 0.1, t));
  if (fade < 0.007) return;
  sunlight(p, t, op, lock, fade);
  groundIris(p, t, op, lock, fade);
}

const FLOAT = Array.from({ length: 12 }, (_, i) => ({
  x: TX + (i % 2 ? 1 : -1) * (10 + 7 * Math.floor(i / 2) + 7 * hsh(i, 20)),
  h: 7 + 29 * hsh(i, 21), s: 1.5 + Math.floor(hsh(i, 22) * 3),
  c: 1 + Math.floor(hsh(i, 23) * 2), d: hsh(i, 24) * 0.26, phase: hsh(i, 25) * TAU,
  pts: Array.from({ length: 4 + i % 3 }, (_, j) => {
    const a = j / (4 + i % 3) * TAU, r = 0.7 + hsh(i * 7 + j, 30) * 0.38;
    return [Math.cos(a) * r, Math.sin(a) * r];
  }),
}));

// Screen-plane offsets of the main fissures. Space the tips and stagger the growth.
const CRACKS = [
  [[-2, 0], [-13, 3], [-22, 2], [-32, 6], [-45, 7]],
  [[-2, 1], [-8, 7], [-16, 9], [-19, 15], [-26, 17]],
  [[0, 1], [5, 5], [1, 9], [5, 13], [3, 19]],
  [[2, 1], [15, 3], [22, 7], [30, 6], [44, 10]],
  [[3, 0], [14, -3], [25, -2], [33, -5], [49, -4]],
  [[-3, 0], [-13, -3], [-24, -2], [-30, -5], [-39, -5]],
];

function fissures(p, t) {
  const hold = 1 - smooth(BOOM + 0.4, BOOM + 1.2, t);
  const grow = clamp((t - LOCK) / 0.35);
  if (grow <= 0 || hold <= 0) return;
  const heat = smooth(LOCK, BOOM, t);
  for (let i = 0; i < CRACKS.length; i++) {
    const path = CRACKS[i], reach = grow * (4.65 - (i % 3) * 0.12) - (i % 3) * 0.23;
    for (let j = 0; j < path.length - 1; j++) {
      const u = clamp(reach - j);
      if (u <= 0) break;
      const [x0, y0] = path[j], [x1, y1] = path[j + 1];
      const dx = (x1 - x0) * u, dy = (y1 - y0) * u;
      const len = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))));
      const strength = hold * (0.35 + 0.53 * heat) * (1 - j * 0.12);
      for (let k = 0; k <= len; k++) {
        const x = TX + x0 + dx * k / len, y = y0 + dy * k / len;
        p.light(x, y, L[3], strength);
        p.light(x, y + 1, L[2], strength * 0.47);
      }
      if (j === 2 && u > 0.45) {
        const n = u * (3 + i % 3);
        for (let k = 1; k <= n; k++) p.light(TX + x0 + dx * 0.6 + k * Math.sign(dx),
          y0 + dy * 0.6 + k * (i % 2 ? 0.75 : -0.75), L[2], strength * 0.7);
      }
    }
  }
}

function stare(p, t) {
  if (t < OPENS[2] || t > BOOM + 1.2) return;
  const lock = lockAt(t);
  for (const R of FLOAT) {
    const a = t - OPENS[2] - R.d;
    if (a <= 0) continue;
    const lift = sm(clamp(a / 0.85));
    const rot = t * 0.72 + R.phase, cs = Math.cos(rot), sn = Math.sin(rot);
    const shiver = lock * Math.sin(t * 37 + R.phase);
    let x = R.x + 1.7 * cs * lift + 0.9 * shiver;
    let y = -(R.h + 1.6 * sn) * lift + 0.36 * shiver;
    if (t > BOOM) {
      const b = t - BOOM;
      x += Math.sign(R.x - TX) * 260 * b;
      y += -80 * b + 260 * b * b;
    }
    if (y > -R.s * 0.5 || x < -56 || x > 295) continue;
    const pts = R.pts.map(([u, v]) => [x + (u * cs - v * sn) * R.s, y + (u * sn + v * cs) * R.s]);
    p.poly(pts, DUST[R.c]);
    p.poly([pts[0], pts[1], [x, y], pts[pts.length - 1]], DUST[R.c + 1]);
  }
  fissures(p, t);
}

export function gaze(p, t, layer) {
  if (layer === 'back') beam(p, t);
  else stare(p, t);
}
