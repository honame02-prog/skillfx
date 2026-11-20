// Cot Linh Lanh Hoa, top-down for Tien Son (3/4 view, 2.5 s, centred on the target's feet). v2.
// Script: design/tienson/05-cot-linh-topdown.md (section "SỬA 20/11 — v2"). Materials reuse the approved cold fire /
// cut ice of _cold-lib.js, recoloured to the Tien Son 'bang' ramp. Floor shapes are squashed 0.5 vertically; standing
// shapes are not. Everything is symmetric about the body axis x = AX (Dao Si sprite measured centred within 0.4 px).
// options.part = 'all' | 'floor' | 'back' | 'front' picks one layer for atlas export (tools/phaser-atlas.mjs --opts).
import { clamp, smooth, TAU, fit } from '../../core/index.js';
import { fastColdFlame, bakeIceFlame, curve, hash } from './_cold-lib.js';

export const BANG_HEX = ['#13292d', '#1846a0', '#2a7fe0', '#4fc3ff', '#9ff0ff', '#e0fdff', '#ffffff'];
export const BANG = fit(BANG_HEX, 7);
const C = BANG;
const END = 2.5, GATHER = 0.5, WAVE = 0.5, WAVE_T = 0.3, FREEZE = 0.86, HIT = 1.1, BEATS = [1.3, 1.52], SWEEP2 = 1.58, SHATTER = 1.75;
export const AX = 0;                 // body axis relative to the feet pivot (px)
const LEGS = 7;                      // half width of the legs for the ice shell (feet measured at -4 / +4)
const SQ = 0.5, N = 8, RB = 28, R = 46, TOP = -68, GRAV = 130;
const out3 = (u) => 1 - (1 - u) ** 3, inv = (u) => clamp(u);
const fr = (t) => Math.floor(t * 30);
const WAVE_START = -Math.PI / 2;     // the wave and the rising order start at the back and run clockwise

export const meta = {
  name: 'Cot Linh Lanh Hoa (top-down)',
  desc: 'Frost seal draws itself, cold fire runs round it and raises eight ribs over the head; they freeze, beat twice, then burst into shards that skid and melt.',
  tags: ['tienson', 'top-down', 'di-hoa', 'ice', 'control', 'ultimate', 'one-shot'],
  size: [224, 176], origin: [112, 122], duration: END, loop: false, fps: 30, bg: 'ground', actor: 2,
  options: { seed: 5, part: 'all' },
};

// ---------------------------------------------------------------- helpers
const onFloor = (a, r) => [AX + Math.cos(a) * r, Math.sin(a) * r * SQ];
const angOf = (x, y) => Math.atan2(y / SQ, x - AX);
const lag = (a) => { const w = (((a - WAVE_START) % TAU) + TAU) % TAU; return Math.min(w, TAU - w) / Math.PI; };   // 0..1, both ways round from the back, meeting at the front
const isFront = (floorY) => floorY > 0;

// ---------------------------------------------------------------- the cage
const RIBS = Array.from({ length: N }, (_, i) => {
  const a = i * TAU / N + TAU / 16, ca = Math.cos(a), sa = Math.sin(a);
  const [bx, by] = onFloor(a, RB), hh = by - TOP;
  const pts = [[bx, by], [AX + ca * RB * 1.2, by - hh * 0.33], [AX + ca * RB * 0.98, by - hh * 0.66], [AX + ca * RB * 0.42, by - hh * 0.9], [AX + ca * 2.5, TOP + sa * 1.5]];
  const rise = WAVE + lag(a) * WAVE_T;
  return { a, bx, by, pts, W: by > 0 ? 4 : 3.5, seed: i * 7 + 3, front: by > 0, rise, tf: FREEZE + lag(a) * 0.12, ice: null };
}).sort((A, B) => A.by - B.by);
const diag = (x, y) => x + y * 0.6;
const G_LO = diag(AX - 40, TOP) - 4, G_HI = diag(AX + 40, 20) + 4;
const sweep = (u) => G_HI - (G_HI - G_LO) * u;
function beat(t) { let k = 0; for (const b of BEATS) k = Math.max(k, Math.exp(-(((t - b) / 0.05) ** 2))); return k; }

function rib(p, T, t) {
  if (t < T.rise || t >= SHATTER) return;
  if (t >= T.tf) {
    T.ice ??= bakeIceFlame(C, T.pts, T.W, T.seed);
    const d = t - T.tf, g0 = diag(T.bx, T.by) + 2, g1 = diag(...T.pts[4]) - 4;
    let glint = -1;
    if (d < 0.1) glint = g0 + (g1 - g0) * (d / 0.1);                         // frost runs root to tip
    else if (t >= HIT && t < HIT + 0.16) glint = sweep((t - HIT) / 0.16);
    else if (t >= SWEEP2 && t < SWEEP2 + 0.16) glint = sweep((t - SWEEP2) / 0.16);
    const crack = t > SHATTER - 0.06 ? 2 : clamp(0.25 * smooth(HIT, SHATTER, t) + 0.7 * beat(t) + 0.45 * smooth(SHATTER - 0.2, SHATTER - 0.06, t));
    T.ice(p, { glint, crack });
    return;
  }
  const g = out3(inv((t - T.rise) / 0.2));
  const pts = T.pts.map(([x, y], j) => j === 0 ? [x, y]
    : [T.bx + (x - T.bx) * g + Math.sin(t * 15 + T.seed + j) * 1.3 * j / 4, T.by + (y - T.by) * g]);
  fastColdFlame(p, C, pts, T.W * (0.55 + 0.45 * g), t, T.seed, { mist: 1 });
}

// ---------------------------------------------------------------- the seal on the floor
const RUNES = [   // tiny carved marks, segments in a 6x6 box
  [[-2, -3, -2, 3], [-2, 0, 2, -2], [-2, 0, 2, 2]], [[0, -3, 0, 3], [-2, -1, 2, -1], [-2, 2, 2, 2]],
  [[-2, -3, 2, -3], [0, -3, 0, 3], [-2, 3, 2, 3]], [[-2, 3, 0, -3], [0, -3, 2, 3], [-1, 1, 1, 1]],
];
const CRACKS = Array.from({ length: 12 }, (_, i) => {
  const a = i * TAU / 12 + (hash(i, 9) - 0.5) * 0.3, len = 1.05 + 0.25 * hash(i, 8);
  const pts = Array.from({ length: 7 }, (_, s) => { const aa = a + (s ? (hash(i, s) - 0.5) * 0.3 : 0), r = R * (0.45 + (len - 0.45) * s / 6); return onFloor(aa, r); });
  return { a, pts, grow: WAVE + lag(a) * WAVE_T };
});
function seal(p, t, seed) {
  if (t <= 0) return;
  const trace = TAU * out3(inv(t / 0.42));
  const erode = smooth(SHATTER + 0.2, END, t);
  const flash = (t >= HIT && t < HIT + 0.07) || (t >= SHATTER && t < SHATTER + 0.07);
  const spin = t * 1.8, fi = fr(t);
  p.shade(AX - R - 2, -R * SQ - 2, AX + R + 2, R * SQ + 2, (x, y, o) => {
    const e = Math.hypot((x - AX) / R, y / (R * SQ));
    if (e > 1.02) return;
    const n = hash(Math.floor(x), Math.floor(y), seed);
    if (n < erode * 1.02) { if (e < 1 && n > 0.9 && erode < 0.98) { o.c = C[1]; o.a = 1; } return; }   // frost residue
    const rel = lag(angOf(x, y)) * TAU;
    if (e > 0.92) {                                                    // the rim, traced round
      if (rel > trace) return;
      const tip = trace < TAU - 0.01 && trace - rel < 0.25;
      o.c = flash || tip ? C[6] : e > 0.97 ? C[2] : C[4]; o.a = 1; return;
    }
    if (t > 0.12 && (Math.abs(e - 0.62) < 0.02 || Math.abs(e - 0.82) < 0.02)) { o.c = C[flash ? 5 : 2]; o.a = 1; return; }
    if (t > 0.18 && Math.abs(e - 0.45) < 0.03 && Math.sin(8 * (angOf(x, y) + spin)) > 0.15) { o.c = C[flash ? 6 : 3]; o.a = 1; return; }
    if (n > 0.74 + 0.22 * (1 - e)) { o.c = C[n > 0.95 ? 3 : 1]; o.a = 1; }
  });
  for (let i = 0; i < 8; i++) {                                      // runes appear one by one
    const a = i * TAU / 8 + TAU / 16, u = (t - 0.15 - lag(a) * 0.3) / 0.06;
    if (u < 0 || hash(i, fi, 31) < erode) continue;
    const [cx, cy] = onFloor(a, R * 0.72), col = u < 1 || flash ? C[6] : beat(t) > 0.3 ? C[5] : C[4];
    for (const [x0, y0, x1, y1] of RUNES[i % 4]) p.line(cx + x0, cy + y0 * 0.6, cx + x1, cy + y1 * 0.6, col);
  }
  for (const K of CRACKS) {                                          // cracks run out with the wave
    const u = inv((t - K.grow) / 0.15);
    if (u <= 0) continue;
    const n = Math.max(1, Math.round(u * 6));
    for (let s = 1; s <= n; s++) {
      if (hash(K.a * 10, s + 20, seed) < erode) continue;
      const [x0, y0] = K.pts[s - 1], [x1, y1] = K.pts[s];
      p.line(x0, y0, x1, y1, flash ? C[6] : s === n && u < 1 ? C[5] : C[3]);
    }
  }
}
// floor shock rings
function shock(p, t, t0, r0, r1, dur, w) {
  const d = t - t0;
  if (d < 0 || d > dur) return;
  const r = r0 + (r1 - r0) * out3(d / dur), f = fr(t), fade = d / dur;
  p.shade(AX - r - 2, -r * SQ - 2, AX + r + 2, r * SQ + 2, (x, y, o) => {
    const e = Math.hypot((x - AX) / r, y / (r * SQ)) * r;
    if (Math.abs(e - r) > w) return;
    if (hash(Math.floor(x), Math.floor(y), f) < fade * 0.9) return;
    o.c = C[fade < 0.3 ? 6 : fade < 0.6 ? 5 : 3]; o.a = 1;
  });
}

// ---------------------------------------------------------------- motes spiralling in
const MOTES = Array.from({ length: 40 }, (_, j) => ({ a: j * TAU / 40, r0: 70 + 40 * hash(j, 41), z0: 4 + 14 * hash(j, 42), dl: hash(j, 43) * 0.2, j }));
function motes(p, t, layer) {
  if (t > GATHER + 0.1 || layer === 'floor') return;
  for (const M of MOTES) {
    const u = inv((t - M.dl) / 0.42);
    if (u <= 0 || u >= 1) continue;
    const draw = (uu, c) => {
      const r = M.r0 * (1 - uu) ** 1.3 + 12, a = M.a + uu * 2.2, [x, fy] = onFloor(a, r), z = M.z0 * (1 - uu);
      if (isFront(fy) !== (layer === 'front')) return;
      p.dot(x, fy - z, c);
    };
    draw(Math.max(0, u - 0.06), C[2]);
    draw(Math.max(0, u - 0.03), C[4]);
    draw(u, M.j % 5 === 0 ? C[6] : C[5]);
  }
}

// ---------------------------------------------------------------- the running ring of low cold fire
const WAVE_SLOTS = Array.from({ length: 16 }, (_, j) => j * TAU / 16 + TAU / 32);
function wave(p, t, layer) {
  if (t < WAVE || t > WAVE + WAVE_T + 0.35) return;
  const headU = (t - WAVE) / WAVE_T;
  for (const a of WAVE_SLOTS) {
    const behind = headU - lag(a);
    if (behind < 0) continue;
    const env = Math.exp(-behind * 2.4) * (behind < 0.05 ? behind / 0.05 : 1);
    const h = 13 * env;
    if (h < 2) continue;
    const [x, y] = onFloor(a, R * 0.9);
    if (isFront(y) !== (layer === 'front')) continue;
    fastColdFlame(p, C, [[x, y], [x + Math.sin(t * 13 + a) * 1.2, y - h * 0.5], [x, y - h]], 2.4, t, 60 + a * 9, { mist: 0.8 });
  }
}

// ---------------------------------------------------------------- ice spikes along the cracks
const SPIKES = CRACKS.flatMap((K, i) => [2, 4, 5].map((s) => ({ x: K.pts[s][0], y: K.pts[s][1], at: K.grow + s * 0.025, h: 3 + 3 * hash(i, s, 3), k: i * 10 + s })));
function spikes(p, t, layer) {
  for (const S of SPIKES) {
    if (t < S.at || isFront(S.y) !== (layer === 'front')) continue;
    let h = S.h * out3(inv((t - S.at) / 0.08));
    const d = t - SHATTER;
    if (d >= 0) { h *= d < 0.08 ? 1 + 0.5 * (d / 0.08) : 1.5; if (d > 0.08 && hash(S.k, fr(t), 8) < smooth(0.08, 0.3, d)) continue; }
    const w = Math.max(1, h * 0.35);
    p.tri(S.x - w, S.y, S.x, S.y - h, S.x, S.y, C[5]);
    p.tri(S.x, S.y, S.x, S.y - h, S.x + w, S.y, C[2]);
    p.dot(S.x, S.y - h, C[6]);
  }
}

// ---------------------------------------------------------------- ice shell climbing the legs
function shell(p, t) {
  const u = inv((t - FREEZE - 0.04) / 0.2);
  if (u <= 0 || t >= SHATTER) return;
  const top = -18 * out3(u);
  p.shade(AX - LEGS - 1, top - 4, AX + LEGS + 1, 2, (x, y, o) => {
    const dx = x - AX, half = LEGS * (0.85 + 0.15 * Math.cos((y - top) / 9));
    if (Math.abs(dx) > half || y > 1.5 || (Math.abs(dx) < 1.2 && y > top + 6)) return;   // two shins, a gap between
    const edge = top + 2.5 * hash(Math.floor(x / 2), 3, 7);
    if (y < edge) return;
    const cell = hash(Math.floor((x + 40) / 3), Math.floor((y + 40) / 4), 11);
    let tone = 3.6 + (dx < 0 ? 0.9 : -0.6) + (cell - 0.5) * 1.6;
    if (y - edge < 1.2) tone = 5.6;
    if (half - Math.abs(dx) < 1) tone = dx < 0 ? 5 : 1.5;
    if (beat(t) > 0.4 && cell > 0.8) tone = 6;
    o.c = C[clamp(Math.round(tone), 0, 6)]; o.a = 1;
  });
}

// ---------------------------------------------------------------- snow
const SNOW = Array.from({ length: 30 }, (_, j) => ({ x: (hash(j, 60) - 0.5) * 44, z: hash(j, 61), v: 18 + 14 * hash(j, 62), ph: hash(j, 63) * 6, big: j % 6 === 0, front: j % 2 === 0, j }));
function snow(p, t, layer) {
  if (t < HIT) return;
  for (const S of SNOW) {
    if (S.front !== (layer === 'front')) continue;
    const d = t - HIT - S.z * 0.4;
    if (d < 0) continue;
    const spread = t > SHATTER ? 1 + (t - SHATTER) * 1.6 : 1;
    const x = AX + S.x * spread + Math.sin(t * 3 + S.ph) * 2, y = TOP + 4 + ((d * S.v) % 72);
    if (hash(S.j, fr(t), 70) < smooth(2.1, END, t)) continue;
    if (S.big) { p.dot(x, y, C[6]); p.dot(x - 1, y, C[4]); p.dot(x + 1, y, C[4]); p.dot(x, y - 1, C[4]); p.dot(x, y + 1, C[4]); }
    else p.dot(x, y, C[5]);
  }
}

// ---------------------------------------------------------------- the burst
const SHARDS = Array.from({ length: 40 }, (_, j) => {
  const T = RIBS[j % N], k = 1 + Math.floor(hash(j, 11) * 9), [x0, y0] = curve(T.pts, 10)[k];
  const fy0 = T.by * (1 - 0.8 * k / 10), z0 = Math.max(0, fy0 - y0), a = T.a + (hash(j, 12) - 0.5) * 0.7;
  const size = j < 10 ? 3.5 + 1.5 * hash(j, 15) : j < 24 ? 2.2 + 0.8 * hash(j, 15) : 1.2 + 0.8 * hash(j, 15);
  const s = (j < 10 ? 40 : 60) + 50 * hash(j, 13), vz = 25 + 45 * hash(j, 14);
  const tl = (vz + Math.sqrt(vz * vz + 4 * GRAV * z0)) / (2 * GRAV);
  return { x0, fy0, z0, a, s, vz, tl, size, j, melt: 0.25 + 0.2 * hash(j, 16) };
});
function shardAt(S, d) {
  const h = d < S.tl ? S.s * d : S.s * S.tl + S.s * (1 - Math.exp(-7 * (d - S.tl))) / 7;
  const z = Math.max(0, S.z0 + S.vz * d - GRAV * d * d);
  const X = S.x0 + Math.cos(S.a) * h, F = S.fy0 + Math.sin(S.a) * h * SQ;
  return { X, F, Y: F - z, z };
}
function burst(p, t, layer) {
  const d = t - SHATTER;
  if (d < 0) return;
  const f = fr(t);
  for (const S of SHARDS) {
    const { X, F, Y, z } = shardAt(S, d), melt = smooth(S.melt, S.melt + 0.25, d);
    if (layer === 'floor') { if (z > 3 && S.size > 2 && melt < 0.5) p.dot(X, F, C[1]); continue; }
    if (isFront(F) !== (layer === 'front')) continue;
    if (hash(S.j, f, 77) < melt) {                                     // melting: a wisp of mist rises
      if (melt < 0.95 && hash(S.j, f, 78) > 0.5) p.dot(X, Y - 1 - (d - S.melt) * 8, C[3]);
      continue;
    }
    const rot = S.j + Math.min(d, S.tl) * 11, r = S.size;
    if (S.size > 3) {
      const v = [0, 1.6, 3.1, 4.6].map((q, i) => [X + Math.cos(rot + q) * r * (i % 2 ? 0.6 : 1), Y + Math.sin(rot + q) * r * 0.8 * (i % 2 ? 0.6 : 1)]);
      p.poly(v, C[3]);
      p.tri(v[0][0], v[0][1], v[1][0], v[1][1], v[2][0], v[2][1], C[5]);
      p.line(v[2][0], v[2][1], v[3][0], v[3][1], C[1]);
      p.dot(v[0][0], v[0][1], C[6]);
    } else {
      const v = [0, 2.1, 4.2].map((q) => [X + Math.cos(rot + q) * r, Y + Math.sin(rot + q) * r * 0.8]);
      p.poly(v, C[4]);
      p.dot(v[0][0], v[0][1], C[6]);
    }
    if (d > S.tl && hash(S.j, f, 5) > 0.88) p.dot(X, Y - 1, C[6]);   // twinkle once landed
  }
  if (d < 0.3 && layer !== 'floor') for (let i = 0; i < 56; i++) {   // ice dust
    const a = i * TAU / 56, r = 84 * out3(d / 0.3) * (0.3 + 0.7 * hash(i, 51)), [x, fy] = onFloor(a, r);
    if (isFront(fy) !== (layer === 'front')) continue;
    if (hash(i, f, 9) < d * 3.2) continue;
    p.dot(x, fy - 34 * hash(i, 52) * (1 - d / 0.3) - 6, C[d < 0.08 ? 6 : 5]);
  }
  if (d < 0.034 && layer !== 'floor') {                                // white-out frame where the cage was
    for (const T of RIBS) if (T.front === (layer === 'front')) { T.ice ??= bakeIceFlame(C, T.pts, T.W, T.seed); T.ice(p, { crack: 2 }); }
  }
}
// slow cold mist rising at the end
function mist(p, t, layer) {
  if (t < SHATTER + 0.15) return;
  for (let i = 0; i < 12; i++) {
    const a = i * TAU / 12 + TAU / 24, [x, y] = onFloor(a, 20 + 26 * hash(i, 90));
    if (isFront(y) !== (layer === 'front')) continue;
    const u = inv((t - SHATTER - 0.12 - hash(i, 91) * 0.15) / 0.45);
    if (u <= 0 || u >= 1) continue;
    const h = 10 * Math.sin(Math.PI * u), lift = 10 * u;
    if (h > 2) fastColdFlame(p, C, [[x, y - lift], [x + 2, y - lift - h * 0.5], [x - 1, y - lift - h]], 1.6, t, 90 + i, { mist: 1, dim: 1.2 });
  }
}
function star(p, t) {
  const d = t - HIT;
  if (d < 0 || d > 0.14) return;
  const L = 8 * (1 - d / 0.14), x = AX, y = TOP - 2;
  p.line(x - L, y, x + L, y, C[6]); p.line(x, y - L * 1.3, x, y + L * 0.7, C[6]);
  p.line(x - L * 0.5, y - L * 0.5, x + L * 0.5, y + L * 0.5, C[5]); p.line(x - L * 0.5, y + L * 0.5, x + L * 0.5, y - L * 0.5, C[5]);
}

const want = (o, part) => { const q = o?.part ?? 'all'; return q === 'all' || q === part; };
export function drawBack(p, t, o) {
  if (want(o, 'floor')) {
    seal(p, t, o?.seed ?? 5);
    shock(p, t, HIT, R, R + 30, 0.3, 1.2);
    shock(p, t, SHATTER, 18, 100, 0.4, 2);
    burst(p, t, 'floor');
  }
  if (want(o, 'back')) {
    motes(p, t, 'back'); wave(p, t, 'back'); spikes(p, t, 'back'); snow(p, t, 'back');
    for (const T of RIBS) if (!T.front) rib(p, T, t);
    burst(p, t, 'back'); mist(p, t, 'back');
  }
}
export function draw(p, t, o) {
  if (!want(o, 'front')) return;
  motes(p, t, 'front'); wave(p, t, 'front'); spikes(p, t, 'front');
  shell(p, t);
  for (const T of RIBS) if (T.front) rib(p, T, t);
  snow(p, t, 'front');
  burst(p, t, 'front'); mist(p, t, 'front');
  star(p, t);
}
