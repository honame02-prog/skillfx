// Van Lac Tam Viem, top-down for Tien Son (3/4 view, 3.0 s, centred on the target's feet). Draft v1 (Opus, 21/11).
// Script: design/tienson/08-van-lac-topdown.md. User choices 21/11: serpents rise out of the ground (a sealing ring),
// TWO mirror serpents, 3.0 s. The serpent itself is the approved v2 glass viper (_serpent-lib.js), drawn twice:
// serpent B is serpent A mirrored through the body axis x = 0, same time, same numbers.
// Colours: the approved side-view ramp C (_vanlac-common.js) + RIM/SHADE/TINT/ASH, never orange or green.
// options.part = 'all' | 'floor' | 'back' | 'front' (atlas export); options.weave = 'cross' | 'kiss' (see coilAngle).
import { clamp, smooth, TAU } from '../../core/index.js';
import { spine, drawSerpent } from './_serpent-lib.js';
import { C, RIM, SHADE, ASH } from './_vanlac-common.js';
import { heart as sideHeart } from './_vanlac-heart.js';
import { TX as SIDE_TX } from './_vanlac-common.js';
import { hash } from './_cold-lib.js';

export const VANLAC_HEX = ['#140c12', '#4a1428', '#a8204a', '#ff4f7a', '#ffb3c6', '#efe9ee', '#ffffff'];
const END = 3.0, SEAL = 0.0, EMERGE = 0.40, COIL = 1.10, REAR = 1.25, DIVE = 1.35, BEATS = [1.55, 1.90, 2.25], BURN = 2.40;
const SQ = 0.5, BODY_L = 110, W = 4.2, SLIDE = 300, SPOT = 18, CHEST = [0, -30], TOP = [16, -78];
const SEAL_RX = 40, TINT = 0xffe0d0d8;
const sm = (u) => u * u * (3 - 2 * u), out3 = (u) => 1 - (1 - u) ** 3;
const pk = (a) => Math.round(Math.abs(Math.cos(a)) * 97) * 211 + Math.round(Math.sin(a) * 97);   // same for a and PI - a
const fr = (t) => Math.floor(t * 30);

export const meta = {
  name: 'Van Lac Tam Viem (top-down)',
  desc: 'A seal cracks under the target; two invisible flame serpents rise, coil round it, dive into the chest, burn it from inside in three beats, then the heart bursts outward.',
  tags: ['tienson', 'top-down', 'di-hoa', 'fire', 'soul', 'serpent', 'dot', 'ultimate', 'one-shot'],
  size: [224, 200], origin: [112, 146], duration: END, loop: false, fps: 30, bg: 'ground', actor: 2,
  options: { seed: 5, part: 'all', weave: 'cross' },
};

// ---------------------------------------------------------------- the serpents' path (serpent A; B = mirror)
// cross: 1.5 turns of a helix; the mirror pair meets on the axis in front and behind (an X), heads included.
// kiss : each serpent weaves an S on its own side, front <-> back, never crossing (gap >= 3 px at the axis).
const A0 = 0.9;   // kiss: centrelines stay >= 8.5 px off the axis, so the bodies (half-width ~7 with fins) keep a 3 px gap
function coilAngle(u, weave) { return weave === 'kiss' ? A0 * Math.sin(u * Math.PI * 3) : u * Math.PI * 3; }
function coilPos(u, weave) {   // u 0..1 over EMERGE..COIL -> [x, y, z]
  const a = coilAngle(u, weave), R = SPOT - (weave === 'kiss' ? 4 : 6) * u, h = 2 + 50 * sm(u) + 4 * Math.sin(u * Math.PI);
  return [R * Math.cos(a), R * Math.sin(a) * SQ - h, Math.sin(a)];
}
function headA(t, weave) {
  if (t <= COIL) { const p = coilPos(clamp((t - EMERGE) / (COIL - EMERGE)), weave); return [p[0], p[1]]; }
  const [ex, ey] = coilPos(1, weave), side = Math.sign(ex) || 1;
  if (t <= REAR) {   // rear up beside the head, bowing outward
    const u = sm((t - COIL) / (REAR - COIL));
    return [ex + (side * TOP[0] - ex) * u + side * 7 * Math.sin(u * Math.PI), ey + (TOP[1] - ey) * u];
  }
  if (t <= DIVE) return [side * TOP[0] + side * 0.6 * Math.sin((t - REAR) * 90), TOP[1] - 1.5 * smooth(REAR, DIVE, t)];   // the strike pause
  const u = sm(clamp((t - DIVE) / 0.10));   // dive into the chest along a hooked arc
  return [side * TOP[0] * (1 - u) + side * 8 * Math.sin(u * Math.PI), TOP[1] + (CHEST[1] - TOP[1]) * u - 6 * Math.sin(u * Math.PI)];
}
const IN = DIVE + 0.10;
function zAt(ti, weave) { return ti <= COIL ? coilPos(clamp((ti - EMERGE) / (COIL - EMERGE)), weave)[2] : 1; }
function serpents(p, t, layer, weave) {
  if (t < EMERGE || t > IN + BODY_L / SLIDE) return;
  const offset = Math.max(0, t - IN) * SLIDE;
  const keep = (ti, ly) => (zAt(ti, weave) > 1e-3 ? 'front' : 'back') === ly;   // LESSONS 20/11: 1e-3, not > 0
  const opts = { L: BODY_L, W, layer, keep, offset, mouth: smooth(COIL + 0.05, REAR, t) * (1 - smooth(IN, IN + 0.05, t) * 0.5), heart: 0.6 + 0.4 * smooth(REAR, IN, t), seed: 2 };
  for (const m of [1, -1]) {
    const sp = spine((ti) => { const [x, y] = headA(ti, weave); return [m * x, y]; }, Math.min(t, IN), BODY_L - offset + 1, EMERGE);
    drawSerpent(p, sp, t, opts);
  }
}

// ---------------------------------------------------------------- floor: the sealing ring that cracks open
const CRACKS = Array.from({ length: 6 }, (_, k) => (k + 0.5) / 12 * TAU).flatMap((a) => [a, Math.PI - a]);   // 12, mirror pairs
function sealGlow(t) {
  let g = smooth(SEAL, 0.35, t) * (1 - 0.5 * smooth(COIL, DIVE, t));
  for (const b of BEATS) g += 0.8 * Math.exp(-(((t - b) / 0.06) ** 2));
  return g + 1.2 * Math.exp(-(((t - BURN) / 0.08) ** 2));
}
function seal(p, t, sd) {
  if (t > END) return;
  const grow = smooth(0, 0.30, t), g = sealGlow(t), rot = t * 0.6;
  const decay = smooth(BURN + 0.05, END - 0.05, t);
  p.shade(-SEAL_RX - 4, -SEAL_RX * SQ - 3, SEAL_RX + 4, SEAL_RX * SQ + 3, (x, y, o) => {
    const ax = Math.abs(x), ex = ax / SEAL_RX, ey = y / (SEAL_RX * SQ), r = Math.hypot(ex, ey);
    if (r > 1.08) return;
    if (decay > 0 && hash(Math.floor(ax), Math.floor(y) + 99, sd) < decay * 1.1) return;   // dissolves by noise
    const ang = Math.atan2(ey, ex);                                                          // 0..PI, mirror-invariant
    const sweep = Math.PI * (0.5 + 0.5 * grow) + 0.2;                                        // drawn from the back, both ways at once
    const fromBack = Math.abs(ang + Math.PI / 2) <= sweep || Math.abs(ang - 3 * Math.PI / 2) <= sweep;
    if (Math.abs(r - 1) < 0.045 && fromBack && grow > 0) { o.c = g > 0.9 ? C[4] : C[3]; o.a = 1; return; }
    if (Math.abs(r - 0.66) < 0.035 && grow > 0.4) {                                          // inner ring: dashed, turning
      const d = (Math.atan2(ey, ex * (x < 0 ? -1 : 1)) + rot) / TAU * 16; if (d - Math.floor(d) < 0.55) { o.c = C[2]; o.a = 1; return; }
    }
    if (r < 0.98 && r > 0.70 && grow > 0.6) {                                                // seal glyph marks between the rings
      const q = Math.abs(Math.atan2(ey, ex)) / TAU * 24 + 0.5, f = q - Math.floor(q);
      if (f < 0.08 && Math.abs(r - 0.84) < 0.09) { o.c = C[1 + (g > 0.6 ? 1 : 0)]; o.a = 1; return; }
    }
  });
  // 12 cracks out of the centre (mirror pairs), jagged, hot core
  const open = smooth(0.08, 0.38, t);
  if (open > 0) for (const a of CRACKS) {
    const key = pk(a), len = (0.7 + 0.35 * hash(key, 3, sd)) * SEAL_RX * open;
    let px = 0, py = 0;
    for (let s = 3; s <= len; s += 3) {
      const j = (hash(key, s, sd) - 0.5) * 2.4, x = Math.cos(a) * s - Math.sin(a) * j, y = (Math.sin(a) * s + Math.cos(a) * j) * SQ;
      if (s > 3) {
        if (decay > 0 && hash(key, s, 7) < decay * 1.2) { px = x; py = y; continue; }
        const hot = g > 0.9 && s < len * 0.6;
        p.line(px, py, x, y, hot ? C[4] : (s < len * 0.5 ? C[3] : C[2]));
      }
      px = x; py = y;
    }
  }
  // the two spots the serpents break out of
  for (const m of [1, -1]) {
    const k = smooth(0.18, 0.40, t) * (1 - smooth(0.55, 0.9, t));
    if (k > 0) { p.disc(m * SPOT, 0, 3 + 2 * k, C[2], 1); p.disc(m * SPOT, 0, 1.5 + 1.5 * k, C[k > 0.6 ? 6 : 4], 1); }
    const sc = smooth(0.40, 0.55, t) * (1 - smooth(BURN, END, t));
    if (sc > 0) p.ellipse(m * SPOT, 0, 4, 2, C[1], 1);   // the broken seal left behind
  }
}
function dust(p, t) {   // rose grit swept round in two counter-turning swirls while the serpents rise
  if (t < EMERGE || t > COIL + 0.3) return;
  const k = smooth(EMERGE, EMERGE + 0.15, t) * (1 - smooth(COIL, COIL + 0.3, t));
  for (let i = 0; i < 14; i++) {
    const a0 = hash(i, 11, 3) * TAU, r = 16 + 22 * hash(i, 12, 3), a = a0 + (t - EMERGE) * (2.4 + hash(i, 13, 3) * 2);
    if (hash(i, fr(t), 5) > k) continue;
    const x = Math.abs(Math.cos(a) * r), y = Math.sin(a) * r * SQ;
    for (const m of [1, -1]) p.dot(m * x, y, i % 3 ? SHADE : C[4]);
  }
}

// ---------------------------------------------------------------- heart: the approved side-view part, shifted and time-warped
// knots: td time -> side-view time (IN 2.0, beats 2.2 / 2.65 / 3.1, BURN 3.4)
const WARP = [[IN - 0.02, 2.0], [BEATS[0], 2.2], [BEATS[1], 2.65], [BEATS[2], 3.1], [BURN, 3.4], [BURN + 0.3, 3.7]];
function warp(t) {
  if (t <= WARP[0][0]) return 2.0 - (WARP[0][0] - t);
  for (let i = 1; i < WARP.length; i++) if (t <= WARP[i][0]) {
    const [a, A] = WARP[i - 1], [b, B] = WARP[i]; return A + (B - A) * (t - a) / (b - a);
  }
  return 3.7 + (t - WARP[WARP.length - 1][0]);
}
function heart(p, t) {
  if (t < IN - 0.02 || t > BURN + 0.3) return;
  const tx = p.tx; p.tx = tx - SIDE_TX * p.fx;
  try { sideHeart(p, warp(t), 'front'); } finally { p.tx = tx; }
}

// ---------------------------------------------------------------- burst: the heart flares and bursts outward (no column)
const TONGUES = Array.from({ length: 16 }, (_, k) => (k + 0.5) / 16 * TAU);           // closed under a -> PI - a
const EMBERS = Array.from({ length: 20 }, (_, k) => (k + 0.5) / 20 * TAU / 2 - Math.PI / 2)   // half set, mirrored below
  .flatMap((a) => [a, Math.PI - a]);
function layerOfZ(z) { return z > 1e-3 ? 'front' : 'back'; }
function burst(p, t, part) {
  const age = t - BURN;
  if (age < 0 || t > END) return;
  const [cx, cy] = CHEST;
  if (part === 'front' && age < 0.08) {   // rose flash, white core
    const r = 7 + 13 * (age / 0.08);
    p.disc(cx, cy, r, C[3], 1); p.disc(cx, cy, r * 0.6, C[4], 1); p.disc(cx, cy, r * 0.3, C[6], 1);
  }
  if (part === 'floor' && age < 0.5) {    // glass shock ring on the floor
    const u = out3(age / 0.5), rx = 10 + 90 * u, k = 1 - smooth(0.3, 0.5, age);
    p.shade(-rx - 3, -rx * SQ - 3, rx + 3, rx * SQ + 3, (x, y, o) => {
      const r = Math.hypot(Math.abs(x) / rx, y / (rx * SQ)), d = (1 - r) * rx;
      if (d < 0 || d > 4) return;
      if (hash(Math.floor(Math.abs(x)), Math.floor(y), fr(t)) > k) return;
      if (d < 1.2) { o.c = RIM; o.a = 1; return; }
      if (d < 2.4 && age < 0.25) { o.c = C[4]; o.a = 1; return; }
      o.l = 0xffd8d0e0; o.k = 0.25 * k;
    });
  }
  if ((part === 'front' || part === 'back') && age < 0.35) {   // air ring round the chest, split by depth
    const u = out3(age / 0.35), rx = 8 + 52 * u, k = 1 - smooth(0.2, 0.35, age);
    for (let i = 0; i < 64; i++) {
      const a = (i + 0.5) / 64 * TAU, z = Math.sin(a);
      if (layerOfZ(z) !== part || hash(pk(a), fr(t), 9) > k) continue;
      p.dot(cx + Math.cos(a) * rx, cy + z * rx * SQ * 0.6, i % 4 ? RIM : C[4]);
    }
  }
  if ((part === 'front' || part === 'back') && age < 0.6) {   // 16 clear flame tongues flung out in 3D
    for (const a of TONGUES) {
      const z = Math.sin(a); if (layerOfZ(z) !== part) continue;
      const key = pk(a), lift = (hash(key, 1, 4) - 0.35) * 0.9, reach = (40 + 26 * hash(key, 2, 4)) * out3(clamp(age / 0.4));
      const tail = Math.max(0, reach - 26 * (1 - smooth(0.25, 0.6, age)) - 4), k = 1 - smooth(0.35, 0.6, age);
      const at = (s) => [cx + Math.cos(a) * s, cy + z * s * SQ - lift * s - 0.5 * 60 * (s / 80) ** 2];
      const n = Math.max(2, Math.ceil(reach - tail));
      for (let i = 0; i <= n; i++) {
        const s = tail + (reach - tail) * (i / n), [x, y] = at(s), w = 1.6 * Math.sin(Math.PI * i / n);
        if (hash(key, i, fr(t)) > k + 0.2) continue;
        const nx = -Math.sin(a), ny = Math.cos(a) * 0.4;
        p.dot(x + nx * w, y + ny * w, RIM); p.dot(x - nx * w, y - ny * w, SHADE);
        if (i > n - 3) p.dot(x, y, i === n ? C[4] : C[3]);
      }
    }
  }
  if (age < 0.6) for (const a of EMBERS) {   // embers: arc out, fall, land with a shadow
    const key = pk(a), sp = 40 + 50 * hash(key, 5, 6), up = 50 + 40 * hash(key, 6, 6), g = 260;
    const tt = Math.min(age, 0.55), r = sp * tt, h = 30 + up * tt - 0.5 * g * tt * tt, z = Math.sin(a);
    const fx = Math.cos(a) * r, fy = z * r * SQ;
    if (part === 'floor') { if (h < 30) p.dot(fx, fy, C[0]); continue; }
    if (layerOfZ(z) !== part) continue;
    if (h <= 0) { if (hash(key, fr(t), 8) < 0.6) p.dot(fx, fy, C[2]); continue; }
    p.dot(fx, fy - h, age < 0.25 ? C[4] : C[3]);
  }
  if (part === 'front' && age > 0.05) for (let i = 0; i < 8; i++) {   // ash flakes rising (mirror pairs)
    const a2 = age - 0.05 - hash(i, 21, 2) * 0.1; if (a2 < 0) continue;
    const x = 4 + 10 * hash(i, 22, 2) + 6 * a2, y = cy - 6 - 40 * a2 + 3 * Math.sin(a2 * 9 + i), c = ASH[i % 3];
    if (hash(i, fr(t), 3) < smooth(0.35, 0.6, age)) continue;
    p.dot(x, y, c); p.dot(-x - 1e-6, y, c);
  }
  if (part === 'front' && age > 0.08) {   // two soul serpents rise from the head in a V and fade
    const k = 1 - smooth(0.30, 0.55, age);   // fades by shrinking from the tail, never by stipple (K12)
    if (k > 0.08) for (const m of [1, -1]) {
      const head = (ti) => { const u = clamp((ti - BURN - 0.08) / 0.5); return [m * (4 + 44 * u + 3 * Math.sin(u * 9)), cy - 22 - 46 * u]; };
      const sp = spine(head, t, 46 * k, BURN + 0.08);
      drawSerpent(p, sp, t, { L: 46, W: 2.6, heart: 0.3, layer: 'front', seed: 4 });
    }
  }
  if (part === 'front' && age < END - BURN - 0.05) {   // the last ember of the heart dies last
    const k = 1 - smooth(0.3, END - BURN - 0.05, age);
    if (k > 0.05) { p.dot(-1, cy, C[k > 0.5 ? 3 : 2]); p.dot(0, cy, C[k > 0.5 ? 3 : 2]); }
  }
}

// ---------------------------------------------------------------- exact mirror + atlas-safe glass
// Only writes on the right half (screen x >= the body axis) are kept; each is copied to its mirror column. Everything,
// including the side-view heart and both serpents, is therefore exactly mirror-symmetric (K3/K7), whatever the
// rasteriser does with whole coordinates or with which serpent is drawn last.
function mirrored(p, fn) {
  const ax = Math.round(p.tx), { put, add, blendPx } = Object.getPrototypeOf(p);
  const copy = (sx, sy) => {
    const x = sx - p.ox, y = sy - p.oy, mx = 2 * ax - 1 - sx - p.ox;
    if (y < 0 || y >= p.h || x < 0 || x >= p.w || mx < 0 || mx >= p.w) return;
    p.C[y * p.w + mx] = p.C[y * p.w + x]; p.L[y * p.w + mx] = p.L[y * p.w + x];
  };
  p.put = (sx, sy, c, a = 1) => { if (sx < ax) return; put.call(p, sx, sy, c, a); copy(sx, sy); };
  p.add = (sx, sy, c, k = 1) => { if (sx < ax) return; add.call(p, sx, sy, c, k); copy(sx, sy); };
  p.blendPx = (sx, sy, c, a) => { if (sx < ax) return; blendPx.call(p, sx, sy, c, a); copy(sx, sy); };
  try { fn(); } finally { delete p.put; delete p.add; delete p.blendPx; }
}
// The atlas keeps 2 alpha levels and no background, so additive "lens" glass would vanish or turn off-palette (K1).
// Glass is redrawn as a sparse ordered dither of the approved TINT; brighter glass (toward the rims) = denser.
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const GLASS = 0xffe0d0d8;   // #d8d0e0 (TINT) as 0xAABBGGRR
function glassy(p) {
  const q = Object.create(p);
  q.shade = (x0, y0, x1, y1, fn) => Object.getPrototypeOf(q).shade.call(q, x0, y0, x1, y1, (x, y, o) => {
    const c = fn(x, y, o);
    if (c || o.c || !(o.k > 0)) return c;
    const cover = Math.min(0.45, o.k * 2.2);
    o.k = 0;
    if (cover > BAYER4[((Math.floor(y) & 3) << 2) | (Math.floor(Math.abs(x)) & 3)]) { o.c = GLASS; o.a = 1; }
  });
  return q;
}
const render = (p, fn) => mirrored(p, () => fn(glassy(p)));

const want = (o, part) => { const q = o?.part ?? 'all'; return q === 'all' || q === part; };
export function drawBack(p, t, o) {
  if (t >= END) return;
  const weave = o?.weave ?? 'cross';
  if (o?.only === 'heart') return;
  render(p, (g) => {
    if (want(o, 'floor')) { seal(g, t, o?.seed ?? 5); dust(g, t); burst(g, t, 'floor'); }
    if (want(o, 'back')) { serpents(g, t, 'back', weave); burst(g, t, 'back'); }
  });
}
export function draw(p, t, o) {
  if (t >= END || !want(o, 'front')) return;
  const weave = o?.weave ?? 'cross';
  if (o?.only === 'heart') { render(p, (g) => heart(g, t)); return; }   // measuring K10 only
  render(p, (g) => { serpents(g, t, 'front', weave); heart(g, t); burst(g, t, 'front'); });
}
