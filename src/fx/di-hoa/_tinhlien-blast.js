// BOOM..INHALE: rolling earth and ash, pulled back up into the eye.
import { smooth, clamp, TAU, hex } from '../../core/index.js';
import { L, DUST, TX, BOOM, GHOST, INHALE, LC, EC, out3, hsh } from './_tinhlien-common.js';
import { dustMass } from './_tinhlien-dust-lib.js';

const EMBER = ['#572b23', '#883c28', '#b75b2e'].map(hex);
const FPS = 24;
const LEFT = -59, RIGHT = 298, TOP = -244, WIDTH = RIGHT - LEFT + 1;
const FRAME_COUNT = Math.ceil((INHALE[1] - BOOM) * FPS);

// The large crown billows roll out over the sloping sides of the cone.
const CROWN = [
  [-60, 120, 23, 1], [-43, 136, 32, 1], [-30, 150, 19, 1],
  [39, 132, 31, 1.5], [62, 121, 24, 1], [-12, 131, 48, 3], [24, 119, 35, 2],
];
const CONE = [
  [-44, 96, 20, 1], [39, 94, 24, 1], [2, 99, 39, 2.5],
  [-26, 73, 20, 1], [22, 71, 21, 1], [-6, 64, 29, 2.5],
  [11, 44, 19, 1], [-8, 41, 19, 2], [-1, 26, 17, 2], [1, 11, 11, 2],
];
const BILLOWS = [...CROWN, ...CONE].map(([x, h, r, z], i) => ({
  x, h, r, z, crown: i < CROWN.length,
  phase: hsh(i, 34) * TAU, delay: (1 - h / 172) * 0.33 + 0.08 * hsh(i, 35),
}));

// Retain the v4 internal light envelope, also consumed by the ending.
export const reveal = (t) => smooth(GHOST[0], GHOST[0] + 0.35, t) * (1 - smooth(INHALE[0] + 0.25, INHALE[0] + 0.6, t));

function inhale(t, x, y, r, phase, delay) {
  const k = clamp((t - INHALE[0] - delay) / 0.67);
  if (k <= 0) return [x, y, r];
  if (k >= 1) return null;
  const e = k * k, a = phase + k * 9 + y * 0.025;
  const orbit = Math.sin(a) * (12 + 0.13 * Math.abs(x - TX)) * Math.sin(Math.PI * k);
  return [x + (EC[0] - x) * out3(k) + orbit, y + (EC[1] - y) * e, r * (1 - e * 0.88)];
}

function coneBlobs(t, a, rise) {
  const blobs = [];
  for (const B of BILLOWS) {
    const roll = B.crown ? smooth(0, 0.9, a) * 2.35 : a * 1.6;
    const turn = B.crown ? 13 + 4 * Math.sin(B.phase) : 2.5;
    const x = TX + B.x * (0.19 + 0.81 * rise) + Math.sign(B.x) * turn * Math.sin(roll) * rise;
    const y = (-B.h + turn * (1 - Math.cos(roll)) * 0.67) * rise;
    const r = B.r * (0.2 + 0.8 * rise);
    const q = inhale(t, x + Math.sin(a * 2 + B.phase) * 2, y + Math.cos(a * 2 + B.phase) * 2,
      r, B.phase, B.delay);
    if (q) blobs.push({ x: q[0], y: q[1], r, z: B.z * rise, seed: B.phase });
  }
  return blobs;
}

// Stagger broad rolls along the ground so they form a low, continuous skirt.
const GROUND_ROLLS = [
  [-0.94, 0.43, 0], [-0.80, 0.77, 2], [-0.63, 1.08, 5],
  [-0.43, 0.93, 2], [-0.22, 0.77, 1], [0.02, 1, 4],
  [0.23, 0.91, 1], [0.44, 0.79, 2], [0.59, 1.02, 4],
  [0.79, 0.79, 1], [0.96, 0.40, 0],
];

function groundBlobs(t, a) {
  const b = a - 0.025;
  if (b <= 0) return [];
  const pull = smooth(INHALE[0], INHALE[0] + 0.5, t);
  const spread = out3(clamp(b / 0.82));
  const width = 15 + 182 * spread;
  const height = (7 + 33 * smooth(0, 0.44, b)) * (1 - 0.37 * smooth(0.84, 1.52, b));
  return GROUND_ROLLS.map(([position, scale, lift], i) => {
    const phase = b * 5 + position * 8;
    const radius = height * scale * (1.31 + 0.07 * Math.cos(phase));
    const x = TX + position * width + Math.sin(phase) * Math.sin(b * 5) * spread * 3;
    const y = 0.43 * radius - lift * spread - pull * (18 + (1 - Math.abs(position)) * 36);
    const q = inhale(t, x, y, radius, position * TAU, 0);
    return q && { x: q[0], y: q[1], r: radius, z: 0.8 + 0.3 * (i % 3), seed: i * 3.7 };
  }).filter(Boolean);
}

function addVortex(blobs, t) {
  const draw = smooth(INHALE[0], INHALE[0] + 0.26, t);
  const clear = smooth(INHALE[1] - 0.38, INHALE[1] - 0.02, t);
  if (draw <= 0 || clear >= 1) return;
  const top = EC[1] + 13;
  const head = top * draw, foot = top * clear;
  const span = foot - head;
  const count = Math.ceil(span / 15);
  for (let i = 0; i < count; i++) {
    const y = head + span * (i + 0.5) / count;
    const v = 1 - y / top;
    const turn = y * 0.076 - (t - INHALE[0]) * 17;
    const x = EC[0] + Math.sin(turn) * (4 + 14 * v) * draw;
    const r = (10 + 29 * v ** 0.8) * Math.sqrt(draw);
    blobs.push({ x, y, r, z: 2, seed: i * 1.7 + 71 });
  }
}

const footHeat = (a) => 1 - smooth(0.11, 0.47, a);

function dustFrame(t) {
  const a = t - BOOM, rise = out3(clamp(a / 0.6));
  const light = reveal(t), heat = footHeat(a);
  const glow = light > 0 ? { x: TX, y: -60, r: 60, k: light, c: L[6] }
    : heat > 0 ? { x: TX, y: 0, r: 78, k: heat * 0.52, c: L[3] } : null;
  const pixels = new Uint32Array(WIDTH * (1 - TOP));
  const lights = glow && new Float32Array(pixels.length);
  const inside = (x, y) => x >= LEFT && x <= RIGHT && y >= TOP && y <= 0;
  const offset = (x, y) => (y - TOP) * WIDTH + x - LEFT;
  const record = {
    dot(x, y, color) {
      if (!inside(x, y)) return;
      const i = offset(x, y);
      pixels[i] = color;
      if (lights) lights[i] = 0;
    },
    light(x, y, c, k) {
      if (inside(x, y)) lights[offset(x, y)] = k;
    },
  };

  const cone = coneBlobs(t, a, rise);
  addVortex(cone, t);
  const erode = 0.19 * smooth(INHALE[0], INHALE[0] + 0.35, t)
    + 0.81 * smooth(INHALE[0] + 0.53, INHALE[1] - 0.02, t);
  dustMass(record, cone, a, { top: -168 * rise, bottom: 0, erode, glow, seed: 63 });

  const groundErode = 0.10 * smooth(0.84, 1.35, a) + 0.90 * smooth(INHALE[0], INHALE[0] + 0.5, t);
  dustMass(record, groundBlobs(t, a), a, { top: -85, bottom: 0, erode: groundErode, glow, seed: 17 });

  const rows = [];
  for (let y = TOP; y <= 0; y++) {
    const start = offset(LEFT, y), end = start + WIDTH;
    let first = start, last = end - 1;
    while (first < end && !pixels[first]) first++;
    if (first === end) continue;
    while (!pixels[last]) last--;
    rows.push({ x: LEFT + first - start, y, colors: pixels.slice(first, last + 1), light: lights?.slice(first, last + 1) });
  }
  return { rows, lightColor: glow?.c };
}

// Cache the local raster at the existing dust cadence. Playback still uses the
// caller's placement, fade and additive light strength.
const DUST_FRAMES = Array.from({ length: FRAME_COUNT }, (_, i) => dustFrame(BOOM + (i + 0.5) / FPS));

function drawDust(p, a) {
  const frame = DUST_FRAMES[Math.floor(a * FPS)];
  if (!frame) return;
  const aligned = p.sn === 0 && p.cs === 1;
  for (const { x, y, colors, light } of frame.rows) {
    if (aligned) {
      const sx = p.cellX(x, y), sy = p.cellY(x, y);
      for (let i = 0; i < colors.length; i++) p.put(sx + i * p.fx, sy, colors[i]);
    } else {
      for (let i = 0; i < colors.length; i++) {
        if (colors[i]) p.dot(x + i, y, colors[i]);
      }
    }
    if (light) {
      for (let i = 0; i < light.length; i++) {
        if (light[i] > 0) p.light(x + i, y, frame.lightColor, light[i]);
      }
    }
  }
}

// The largest chips take different arcs along each flank of the cone.
const OUTER_ROCKS = [
  [-203, -251, 3.55], [210, -204, 3.45],
  [-172, -224, 3.15], [171, -244, 3.25],
  [-148, -287, 2.9], [183, -170, 2.8],
];
const ROCKS = Array.from({ length: 20 }, (_, i) => {
  const outer = OUTER_ROCKS[i];
  const side = i % 2 ? 1 : -1, base = -1 - 6 * hsh(i, 15), gravity = 310;
  const [vx, vy, size] = outer ?? [side * (22 + 125 * hsh(i, 8)), -78 - 230 * hsh(i, 9), 1 + 2 * hsh(i, 10)];
  const land = (-vy + Math.sqrt(vy * vy + 16 * gravity)) / (2 * gravity);
  return {
    vx, vy, size, base, land, gravity, startX: TX + (outer ? side * (9 + 13 * hsh(i, 17)) : 0),
    bounce: 0.11 + 0.14 * hsh(i, 12), hot: i % 3 !== 1,
    spin: (hsh(i, 13) - 0.5) * 16, phase: hsh(i, 16) * TAU,
    delay: 0.24 + 0.25 * hsh(i, 14),
  };
});
const SHAPE = [[-1, -0.35], [-0.45, -1], [0.6, -0.7], [0.95, 0.15], [0.1, 0.9], [-0.74, 0.62]];
const ROCK_RIM = hex('#231b1a');

function rubble(p, t, a) {
  for (const R of ROCKS) {
    const b = Math.min(a, R.land), after = Math.max(0, a - R.land);
    const hop = Math.min(after, R.bounce);
    const x = R.startX + R.vx * (b + hop * 0.32);
    const y = R.base - 4 + R.vy * b + R.gravity * b * b - R.gravity * hop * (R.bounce - hop);
    const q = inhale(t, x, y, R.size, R.phase, R.delay);
    if (!q || q[2] < 0.65) continue;
    const [cx, ground, size] = q, cy = ground - size;
    const angle = R.phase + R.spin * (b + hop) + Math.max(0, t - INHALE[0] - R.delay) * 9;
    const cs = Math.cos(angle), sn = Math.sin(angle);
    const pts = SHAPE.map(([u, v]) => [cx + (u * cs - v * sn) * size, cy + (u * sn + v * cs) * size]);
    if (size >= 1.7 && a < R.land && a < 0.60) {
      const speed = R.vy + 2 * R.gravity * b;
      p.line(cx - R.vx * 0.045, cy - speed * 0.045, cx - R.vx * 0.019, cy - speed * 0.019, DUST[2]);
      if (size >= 2.8) p.dot(cx - R.vx * 0.028, cy - speed * 0.028, DUST[4]);
    }
    if (after > 0 && after < 0.23) {
      const hitX = R.startX + R.vx * R.land, d = 2 + after * 24;
      const lift = after * 18, side = Math.sign(R.vx);
      p.poly([[hitX - d, R.base - lift], [hitX + side * d * 0.4, R.base - lift - 3],
        [hitX + d, R.base - lift - 1], [hitX + d * 0.3, R.base - lift + 1]], DUST[2]);
      p.dot(hitX + side * d * 0.7, R.base - 2 - lift, DUST[3]);
    }
    const bright = R.hot && a < 0.48 ? L[3] : DUST[4];
    p.poly(pts, DUST[0]);
    // Select the upward-facing facet as the silhouette tumbles.
    const light = Math.floor(((0.25 - angle / TAU + 8) % 1) * pts.length);
    p.poly([pts[light], pts[(light + 1) % 6], pts[(light + 2) % 6], [cx + size * 0.22, cy + size * 0.08]], bright);
    p.polyline([...pts, pts[0]], ROCK_RIM);
    if (size < 1.8) p.dot(cx, cy, bright);
  }
}

const SPARKS = Array.from({ length: 27 }, (_, i) => ({
  phase: hsh(i, 64), rad: 18 + 39 * hsh(i, 65), speed: 0.9 + 0.7 * hsh(i, 66), color: i % 5 ? EMBER[2] : L[2],
}));

function embers(p, t) {
  if (t < INHALE[0] || t >= INHALE[1]) return;
  const a = t - INHALE[0], clear = smooth(INHALE[0] + 0.46, INHALE[1], t);
  for (const S of SPARKS) {
    const k = (S.phase + a * S.speed) % 1;
    if (k < clear || k > a * 5) continue;
    const y = EC[1] * k, phase = k * 13 - a * 13 + S.phase * TAU;
    const x = EC[0] + Math.sin(phase) * S.rad * (1 - 0.9 * k);
    p.dot(x, y, S.color);
    if (S.color === L[2]) p.dot(x - Math.cos(phase), y + 2, EMBER[1]);
  }
}

const RAYS = Array.from({ length: 9 }, (_, i) => {
  const q = i * TAU / 9;
  return [Math.cos(q), Math.sin(q), 28 + 18 * hsh(i, 30)];
});
const RING = Array.from({ length: 41 }, (_, i) => [Math.cos(i * TAU / 40), Math.sin(i * TAU / 40)]);

function groundFlash(p, a) {
  const heat = footHeat(a);
  const afterglow = smooth(0.16, 0.28, a) * (1 - smooth(0.38, 0.47, a));
  const glow = Math.max(heat, 0.68 * afterglow);
  if (glow <= 0) return;
  const reach = 32 + 64 * out3(clamp(a / 0.28));
  const depth = 1.6 + 1.2 * heat + 1.35 * afterglow;
  const hotSpan = 0.32 + 0.34 * heat + 0.19 * afterglow;
  p.shade(TX - reach, -depth * 3 - 2, TX + reach, depth * 2, (x, y, o) => {
    const u = (x - TX) / reach;
    const mid = -1 + 2 * u * u + Math.sin(u * 11) * 0.65;
    const v = (y - mid) / depth;
    const energy = glow * (1 - (u / hotSpan) ** 2 - v * v);
    const halo = 1 - u * u - v * v * 0.18;
    if (halo > 0) {
      o.l = L[3];
      o.k = halo * halo * glow * 0.23;
    }
    if (energy > 0.042) o.c = L[3 + Math.min(3, Math.floor(energy * 4.6))];
  });
}

function shockWaves(p, a) {
  const grow = out3(a / 0.25);
  const outer = 27 + 115 * grow, inner = 12 + 95 * grow;
  const crest = RING.map(([x, y]) => [TX + x * outer, -2 + y * outer * 0.17]);
  if (a < 0.15) p.polyline(crest.map(([x, y]) => [x, y - 1]), L[3]);
  p.polyline(crest, L[a < 0.075 ? 6 : a < 0.18 ? 5 : 3]);
  p.polyline(RING.map(([x, y]) => [TX + x * inner, -2 + y * inner * 0.12]), L[a < 0.14 ? 4 : 3]);
}

export function blast(p, t, layer) {
  const a = t - BOOM;
  if (a < 0 || t > INHALE[1] + 0.6) return;
  if (layer === 'back') {
    const k = 1 - smooth(INHALE[1] - 0.2, INHALE[1] + 0.5, t), hot = 1 - smooth(0.2, 1.8, a);
    if (k <= 0) return;
    const rx = 34 * k, ry = 3.5 * k;
    p.shade(TX - rx, -5, TX + rx, 2, (x, y, o) => {
      const e = ((x - TX) / rx) ** 2 + ((y + 1) / ry) ** 2;
      if (e > 1) return;
      o.c = e > 0.65 ? (y < -1 ? DUST[3] : DUST[1]) : e < 0.27 && hot > 0.05 ? EMBER[Math.min(2, Math.floor(hot * 3))] : DUST[0];
    });
    return;
  }
  if (a < 0.25) {
    const f = 1 - a / 0.25;
    p.glow(LC[0], LC[1], 44, L[6], 0.35 * f);
    p.disc(LC[0], LC[1], 11 * f, L[6], 1);
  }
  drawDust(p, a);
  groundFlash(p, a);
  if (a < 0.25) shockWaves(p, a);
  if (a < 0.095) {
    for (const [dx, dy, len] of RAYS) {
      const r = len * (0.75 + a * 3);
      p.poly([[TX + dx * 10 - dy * 2, LC[1] + dy * 10 + dx * 2], [TX + dx * r, LC[1] + dy * r], [TX + dx * 10 + dy * 2, LC[1] + dy * 10 - dx * 2]], L[5]);
    }
    p.disc(LC[0], LC[1], 9 * (1 - a / 0.095), L[6], 1);
  }
  rubble(p, t, a);
  embers(p, t);
}
