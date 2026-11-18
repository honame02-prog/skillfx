// Nhan Tang Lien: light reveals the lotus in the dust, then the eye draws both into its pupil.
import { smooth, TAU, hex } from '../../core/index.js';
import { L, DUST, TX, EC, EW, GHOST, INHALE, SHUT, ASH, END, hsh } from './_tinhlien-common.js';

const [EYE_X, EYE_Y] = EC;
const LOTUS_Y = -63;
const PETAL_W = 116, PETAL_H = 78, PETAL_X = -58, PETAL_Y = -45;
const PETALS = [
  // Root, tip and width, from the outer ring to the forward petals.
  [-13, 23, -53, 2, 17], [13, 23, 53, 2, 17],
  [-9, 24, -46, -18, 18], [9, 24, 46, -18, 18],
  [-6, 22, -25, -35, 19], [6, 22, 25, -35, 19],
  [-9, 27, -39, 10, 17], [9, 27, 39, 10, 17],
  [-5, 26, -24, -21, 18], [5, 26, 24, -21, 18], [0, 25, 0, -40, 21],
  [-5, 29, -20, 0, 13], [5, 29, 20, 0, 13], [0, 30, 0, -11, 15],
];

function lotusLightMask() {
  const owner = new Uint8Array(PETAL_W * PETAL_H);
  const light = new Uint8Array(owner.length);
  for (const [i, [bx, by, tx, ty, width]] of PETALS.entries()) {
    const dx = tx - bx, dy = ty - by, len = Math.hypot(dx, dy);
    for (let row = 0; row < PETAL_H; row++) {
      const y = PETAL_Y + row + 0.5 - by;
      for (let col = 0; col < PETAL_W; col++) {
        const x = PETAL_X + col + 0.5 - bx;
        const u = (x * dx + y * dy) / (len * len);
        if (u <= 0 || u >= 1) continue;
        const half = Math.sin(Math.PI * u ** 0.82) * width * 0.5;
        const side = Math.abs((x * dy - y * dx) / len) / half;
        if (side > 1) continue;
        const q = row * PETAL_W + col;
        owner[q] = i + 1;
        light[q] = 1 + Math.floor(7 * (1 - u) * (1 - 0.38 * side));
      }
    }
  }
  // Follow the exposed edges through overlaps. A cream shoulder backs the white front rims.
  for (let row = 2; row < PETAL_H - 2; row++) {
    for (let col = 2; col < PETAL_W - 2; col++) {
      const i = row * PETAL_W + col, id = owner[i];
      if (!id) continue;
      if (owner[i + 1] < id || owner[i - 1] < id || owner[i + PETAL_W] < id || owner[i - PETAL_W] < id) {
        light[i] = id <= 6 ? 9 : 10;
      } else if (owner[i + 2] < id || owner[i - 2] < id || owner[i + 2 * PETAL_W] < id || owner[i - 2 * PETAL_W] < id) {
        light[i] = 8;
      }
    }
  }
  return light;
}

const LOTUS_LIGHT = lotusLightMask();
const LIGHT_COLOR = [0, L[3], L[3], L[3], L[4], L[4], L[5], L[5], L[5], L[5], L[6]];
const LIGHT_GAIN = [0, 0.18, 0.24, 0.31, 0.39, 0.46, 0.53, 0.59, 0.58, 0.79, 0.94];
// Keep the shader's bounds tight at the thin crown and at the bottom of the bloom.
const LIGHT_BANDS = [];
for (let top = 0; top < PETAL_H; top += 8) {
  const bottom = Math.min(top + 8, PETAL_H);
  let left = PETAL_W, right = 0;
  for (let row = top; row < bottom; row++) {
    for (let col = 0; col < PETAL_W; col++) {
      if (!LOTUS_LIGHT[row * PETAL_W + col]) continue;
      left = Math.min(left, col);
      right = Math.max(right, col + 1);
    }
  }
  if (left < right) LIGHT_BANDS.push({ top, bottom, left, right });
}

function lightLotus(p, t) {
  const lit = smooth(GHOST[0], GHOST[0] + 0.21, t) * (1 - smooth(5.22, 5.72, t));
  if (lit <= 0) return;
  const lift = smooth(INHALE[0], 5.71, t);
  const width = (1 - 0.91 * lift) * (1 + 0.025 * Math.sin(t * 18));
  const height = 1 + 0.9 * smooth(INHALE[0], 5.22, t) - 1.63 * smooth(5.22, 5.72, t);
  const cx = TX + 11 * lift * (1 - lift) * Math.sin(t * 13);
  const cy = LOTUS_Y + (EYE_Y - LOTUS_Y) * lift;
  const curl = 16 * lift * (1 - lift) / 45;
  const invWidth = 1 / width, invHeight = 1 / height;
  const gain = lit * (0.94 + 0.06 * Math.sin(t * 27));
  const hx = 76 * width, hy = 59 * height, center = cy - 4 * height;
  const haze = 0.24 * smooth(GHOST[0], GHOST[0] + 0.12, t) * (1 - smooth(5.22, 5.72, t));
  p.shade(cx - hx, center - hy, cx + hx, center + hy, (x, y, o) => {
    const falloff = 1 - ((x - cx) / hx) ** 2 - ((y - center) / hy) ** 2;
    if (falloff <= 0) return;
    o.l = L[3];
    o.k = haze * falloff * (0.35 + 0.65 * falloff);
  });
  for (const { top, bottom, left, right } of LIGHT_BANDS) {
    const y0 = PETAL_Y + top, y1 = PETAL_Y + bottom;
    p.shade(cx + (PETAL_X + left) * width + y0 * curl, cy + y0 * height,
      cx + (PETAL_X + right) * width + y1 * curl, cy + y1 * height, (x, y, o) => {
        const yy = (y - cy) * invHeight;
        const row = Math.floor(yy - PETAL_Y);
        if (row < top || row >= bottom) return;
        const col = Math.floor((x - cx - curl * yy) * invWidth - PETAL_X);
        if (col < left || col >= right) return;
        const band = LOTUS_LIGHT[row * PETAL_W + col];
        if (band === 0) return;
        o.l = LIGHT_COLOR[band];
        o.k = LIGHT_GAIN[band] * gain;
      });
  }
}

function shaft(p, t) {
  const gain = smooth(GHOST[0], GHOST[0] + 0.24, t) * (1 - smooth(INHALE[0], 5.08, t));
  if (gain <= 0) return;
  const bottom = LOTUS_Y + 21, span = bottom - EYE_Y, sway = Math.sin(t * 7) * 2;
  p.shade(EYE_X - 17, EYE_Y, EYE_X + 17, bottom, (x, y, o) => {
    const u = (y - EYE_Y) / span;
    if (u < 0 || u >= 1) return;
    const d = Math.abs(x - EYE_X - u * sway) / (2.5 + 12 * u);
    if (d >= 1) return;
    const falloff = Math.min(1, (1 - u) * 3.5);
    o.l = d < 0.13 ? L[5] : d < 0.37 ? L[4] : L[3];
    o.k = (d < 0.13 ? 0.51 : 0.24 * (1 - d)) * gain * falloff;
  });
}

const TWIST = 2.6 * TAU;
const PULL = Array.from({ length: 84 }, (_, i) => ({
  phase: hsh(i, 1), speed: 0.68 + 0.65 * hsh(i, 2),
  angle: i % 3 === 0 ? 0.62 + (i % 2) * Math.PI + 1.1 * (hsh(i, 3) - 0.5) : 2.3 * (hsh(i, 3) - 0.5),
  drift: 0.75 + 0.65 * hsh(i, 4), spark: i % 3 === 0, hot: hsh(i, 5) > 0.46,
}));
const FOOT_DUST = Array.from({ length: 12 }, (_, i) => ({
  side: i % 2 ? 1 : -1,
  offset: hsh(i, 61), depth: hsh(i, 62), width: 1 + 3 * hsh(i, 63),
}));

function ribbon(p, x, y, half, gain) {
  for (let col = Math.round(x - half); col <= Math.round(x + half); col++) {
    const d = Math.abs(col - x) / (half + 0.5);
    const band = d < 0.2 ? 6 : d < 0.43 ? 5 : d < 0.69 ? 4 : 3;
    p.light(col, y, L[band], gain * Math.max(0.12, 1 - 0.85 * d));
  }
}

function column(p, t) {
  const age = t - INHALE[0];
  if (age <= 0 || t >= INHALE[1]) return;
  const neck = smooth(INHALE[0], INHALE[0] + 0.24, t);
  const rise = smooth(INHALE[0] + 0.24, INHALE[1], t);
  const top = -103 + (EYE_Y + 103) * neck;
  const foot = -89 + 86 * neck + (EYE_Y + 3) * rise;
  const spin = age * 2.2 * TAU;
  const lit = smooth(0, 0.11, age) * (1 - smooth(5.68, INHALE[1], t));
  for (let y = Math.ceil(top); y <= foot; y++) {
    const v = (y - EYE_Y) / (-3 - EYE_Y);
    const radius = 1.5 + 30 * v * (0.45 + 0.55 * v);
    const phase = v * TWIST + spin;
    const side = Math.sin(phase), face = Math.cos(phase);
    const x = EYE_X + radius * side * 0.76;
    const half = (1.3 + 7.5 * v) * (0.72 + 0.28 * Math.abs(face));
    const brown = v > 0.55;
    const shadow = brown ? DUST[0] : DUST[1];
    const body = brown ? DUST[1] : DUST[2];
    const rim = brown ? DUST[3] : DUST[4];
    const winding = EYE_X - radius * side * 0.67;
    const edge = (0.6 + 3.1 * v) * (0.55 + 0.45 * Math.abs(face));
    if (face < 0) p.line(winding - edge, y, winding + edge, y, DUST[1]);
    p.line(x - half, y, x + half, y, shadow);
    p.line(x - half * 0.76, y, x + half * 0.7, y, body);
    const glint = x + half * face * 0.52;
    p.line(glint - edge * 0.7, y, glint + edge * 0.7, y, rim);
    if (face >= 0) p.line(winding - edge, y, winding + edge, y, DUST[2]);

    ribbon(p, glint, y, 0.6 + edge * 0.59, (0.20 + 0.16 * Math.max(0, face)) * lit);
  }

  // Match the broader dust vortex in blast so the light also follows its rising tail.
  const dustTop = EYE_Y + 13;
  const draw = smooth(INHALE[0], INHALE[0] + 0.26, t);
  const dustFoot = dustTop * smooth(INHALE[1] - 0.38, INHALE[1] - 0.02, t);
  const spread = draw * (1 - smooth(INHALE[1] - 0.22, INHALE[1], t));
  for (let y = Math.ceil(dustTop * draw); y < dustFoot; y++) {
    const v = 1 - y / dustTop;
    const center = EYE_X + Math.sin(y * 0.076 - age * 17) * (4 + 14 * v) * draw;
    const radius = (6 + 36 * v ** 0.8) * spread;
    const phase = v * TWIST + spin + 0.62;
    const face = Math.cos(phase);
    const reach = radius * Math.sin(phase);
    const half = 0.9 + 1.4 * v + radius * Math.abs(face) * TWIST / -dustTop * 0.55;
    const glow = lit * smooth(0, 13, dustFoot - y);
    ribbon(p, center, y, 1.2 + 3 * v, 0.34 * glow);
    ribbon(p, center + reach, y, half, (0.37 + 0.59 * Math.max(0, face)) * glow);
    ribbon(p, center - reach, y, half * 0.76, (0.22 + 0.52 * Math.max(0, -face)) * glow);
  }
  // The ragged tail spills a few small clumps in the direction of the pull.
  if (spread > 0.35 && dustFoot > -32) {
    const v = 1 - dustFoot / dustTop;
    const mid = EYE_X + Math.sin(dustFoot * 0.076 - age * 17) * (4 + 14 * v) * draw;
    for (const m of FOOT_DUST) {
      const x = mid + m.side * (16 + 38 * m.offset) * spread;
      const y = Math.min(0, dustFoot + 3 - 20 * m.depth);
      const w = m.width * spread;
      p.line(x - w, y, x + w, y, DUST[1]);
      p.line(x - w * 0.4, y - 1, x + w * 0.6, y - 1, DUST[2]);
      if (w > 2.4) p.dot(x, y - 2, DUST[3]);
    }
  }
  for (const mote of PULL) {
    const v = 1 - (mote.phase + age * mote.speed) % 1;
    const y = EYE_Y + v * (-3 - EYE_Y);
    if (y < top || y > foot) continue;
    const phase = v * TWIST + spin + mote.angle;
    const radius = (2 + 38 * v * (0.45 + 0.55 * v)) * mote.drift;
    const x = EYE_X + Math.sin(phase) * radius;
    if (mote.spark && mote.hot) {
      p.line(x, y, x + Math.cos(phase) * v * 3, y + 1 + v, L[3]);
      p.dot(x, y, L[6]);
    } else {
      p.dot(x, y, mote.spark ? L[5] : y < -90 ? DUST[4] : DUST[2]);
    }
  }

  const spineLight = lit * smooth(5.02, 5.2, t);
  if (spineLight <= 0) return;
  const spineFoot = Math.max(foot, dustFoot);
  const sway = age * 12;
  for (let y = Math.ceil(top); y < spineFoot; y++) {
    const v = (y - EYE_Y) / (-EYE_Y);
    const x = Math.round(EYE_X + 4.5 * v * Math.sin(y * 0.05 - sway));
    const gain = spineLight * (0.73 + 0.27 * smooth(0, 9, spineFoot - y));
    if (v > 0.42) {
      p.light(x - 2, y, L[5], 0.61 * gain);
      p.light(x + 1, y, L[5], 0.69 * gain);
    }
    p.light(x - 1, y, L[6], 0.91 * gain);
    p.light(x, y, L[6], gain);
  }
}

function ellipse(rx, ry, n) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = i * TAU / n;
    return [Math.cos(a) * rx, Math.sin(a) * ry];
  });
}

const RIPPLE = ellipse(1, 1, 24);
const GROUND_RIPPLE = ellipse(1, 1, 48);
const SNAP = SHUT[0] + 0.06;
function gulp(p, t) {
  const a = t - SNAP;
  if (a < 0 || t >= SHUT[1]) return;
  if (a < 0.1) {
    const crest = Math.sin(Math.PI * a / 0.1);
    const reach = EW * (0.94 + 0.06 * crest);
    const left = EYE_X - 1.55 * reach, right = EYE_X + 1.37 * reach;
    for (let x = Math.ceil(left); x <= right; x++) {
      // The shutter follows the eye's seam, including its raised outer corner.
      const u = (x - left) / (right - left), edge = Math.abs(2 * u - 1);
      const y = EYE_Y + 4 - 8 * u - 17 * u ** 6 + 2 * Math.sin(Math.PI * u);
      const color = L[edge < 0.62 ? 6 : edge < 0.82 ? 5 : edge < 0.94 ? 4 : 3];
      const glow = (0.35 + 0.48 * crest) * (1 - edge);
      p.dot(x, y, color);
      p.light(x, y - 1, L[5], glow);
      p.light(x, y + 1, L[4], glow * 0.72);
    }
  }
  const u = a / (SHUT[1] - SNAP);
  const rx = 10 + 24 * u, ry = 2 + 4 * u;
  p.polyline(RIPPLE.map(([x, y]) => [EYE_X + x * rx, EYE_Y + y * ry]), u < 0.36 ? L[5] : u < 0.72 ? L[3] : L[1]);
}

const FLAKES = Array.from({ length: 70 }, (_, i) => ({
  x: -59 + (i % 10 + hsh(i, 10)) * 35.7,
  y: -234 + (Math.floor(i / 10) + hsh(i, 11)) * 32.4,
  phase: hsh(i, 12) * TAU, speed: 11 + 15 * hsh(i, 13),
  start: hsh(i, 14) * 0.16, end: ASH[1] - 1.03 * hsh(i, 15) ** 1.7,
  shape: i % 5, color: L[i % 11 === 0 ? 3 : i % 3 === 0 ? 4 : 5],
}));

function ash(p, t) {
  if (t < ASH[0] || t >= ASH[1]) return;
  for (const f of FLAKES) {
    const age = t - ASH[0] - f.start;
    if (age < 0 || t >= f.end) continue;
    const x = f.x + Math.sin(f.phase + age * 3) * 3.2;
    const y = f.y + age * f.speed;
    if (x < -59 || x >= 298 || y >= 11) continue;
    p.dot(x, y, f.color);
    if (f.shape === 0) p.dot(x + 1, y, f.color);
    if (f.shape === 1) p.dot(x, y + 1, f.color);
  }
}

const BURN_APPEAR = INHALE[0] + 0.45, BURN_START = 6.0;
const COOL = [L[5], L[3], ...['#d87932', '#a13b1d', '#622318', '#371a15'].map(hex)];
const OUTER_RING = ellipse(45, 9, 48);
const SEED_RING = ellipse(8, 1.75, 18);
const BURN_PETALS = Array.from({ length: 8 }, (_, i) => {
  const angle = i * TAU / 8;
  const side = [[13, 0], [19, 0.19], [26, 0.29], [32, 0.21], [39, 0]];
  const points = [...side, ...side.slice(0, -1).reverse().map(([r, w]) => [r, -w])].map(([r, w]) => [
    TX + Math.cos(angle + w) * r, Math.sin(angle + w) * r * 0.2, r,
  ]);
  return { points, cool: i > 4 ? 0.06 : 0 };
});

function heatColor(age) {
  return age < 1 ? COOL[Math.min(COOL.length - 1, Math.floor(Math.max(0, age) * COOL.length))] : 0;
}

function groundRing(p, pts, c, grow) {
  if (c) p.polyline(pts.map(([x, y]) => [TX + x * grow, y * grow]), c);
}

function groundRipple(p, t) {
  if (t < SHUT[1] || t >= 6.2) return;
  const u = (t - SHUT[1]) / (6.2 - SHUT[1]);
  const grow = 1 - (1 - u) ** 2;
  const rx = 17 + 120 * grow, ry = 3 + 14 * grow;
  const color = L[u < 0.25 ? 6 : u < 0.49 ? 5 : u < 0.74 ? 3 : 2];
  p.polyline(GROUND_RIPPLE.map(([x, y]) => [TX + x * rx, -1 + y * ry]), color);
}

function scorch(p, t) {
  if (t <= BURN_APPEAR || t >= END) return;
  const age = (t - BURN_START) / (END - BURN_START);
  const grow = smooth(BURN_APPEAR, BURN_APPEAR + 0.35, t);
  groundRing(p, OUTER_RING, heatColor(age * 1.2 + 0.04), grow);
  for (const { points, cool } of BURN_PETALS) {
    for (let i = 1; i < points.length; i++) {
      const [x0, y0, r0] = points[i - 1], [x1, y1, r1] = points[i];
      const color = heatColor(age * (0.94 + (r0 + r1) * 0.0022) + cool);
      if (color) p.line(TX + (x0 - TX) * grow, y0 * grow, TX + (x1 - TX) * grow, y1 * grow, color);
    }
  }
  const core = heatColor(age * 1.09 - 0.09);
  groundRing(p, SEED_RING, core, grow);
  if (core) p.dot(TX, 0, core);

  // Three short curls from different points on the hot mark.
  const smoke = 1 - smooth(6.65, 7.59, t);
  if (t < BURN_START || smoke <= 0) return;
  for (let i = 0; i < 3; i++) {
    const u = ((t - BURN_START) * (0.63 + i * 0.08) + i * 0.29) % 1;
    const gain = 0.33 * smoke * Math.sin(Math.PI * u);
    for (let j = 0; j < 13; j++) {
      const v = j / 13;
      const x = TX + (i - 1) * 22 + Math.sin(u * 5 + v * 4 + i) * (1 + 3 * v);
      const y = 1 - u * 19 - j;
      p.light(x, y, DUST[4], gain * (1 - v));
    }
  }
}

export function ending(p, t, layer) {
  if (t <= GHOST[0] || t >= END) return;
  if (layer === 'back') {
    scorch(p, t);
    return;
  }
  shaft(p, t);
  column(p, t);
  lightLotus(p, t);
  gulp(p, t);
  groundRipple(p, t);
  ash(p, t);
}
