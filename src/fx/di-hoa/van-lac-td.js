// Van Lac Tam Viem, top-down for Tien Son (3/4 view, 3.0 s, centred on the target's feet). Draft v2 (Opus, 21/11): serpents
// redrawn after the user's style target XC (_serpent-td-lib.js); v1 = commit f5de5b4.
// v3 (21/11 chiều): serpent library rebuilt at true size (segments on the spine, XA2 hearts); body W 4 (tube 8 px).
// Script: design/tienson/08-van-lac-topdown.md. User choices 21/11: serpents rise out of the ground (a sealing ring),
// TWO mirror serpents, 3.0 s. The serpent itself is the approved v2 glass viper (_serpent-lib.js), drawn twice:
// serpent B is serpent A mirrored through the body axis x = 0, same time, same numbers.
// Colours: the approved side-view ramp C (_vanlac-common.js) + RIM/SHADE/TINT/ASH, never orange or green.
// options.part = 'all' | 'floor' | 'back' | 'front' (atlas export); options.weave = 'cross' | 'kiss' (see coilAngle).
// Split 21/11 (mechanical, same output): shared constants in _vanlac-td-common.js, floor in _vanlac-td-floor.js, burst in _vanlac-td-burst.js.
import { clamp, smooth, TAU } from '../../core/index.js';
import { spine } from './_serpent-lib.js';
import { drawSerpentTD } from './_serpent-td-lib.js';   // v2: XC style target (design/tienson/ref-vanlac-xc)
import { C, RIM, SHADE, ASH } from './_vanlac-common.js';
import { heart as sideHeart } from './_vanlac-heart.js';
import { TX as SIDE_TX } from './_vanlac-common.js';
import { hash } from './_cold-lib.js';

import { END, EMERGE, COIL, REAR, DIVE, BEATS, BURN, SQ, BODY_L, W, SLIDE, SPOT, CHEST, TOP, BOW, IN, sm } from './_vanlac-td-common.js';
import { seal, dust } from './_vanlac-td-floor.js';
import { burst } from './_vanlac-td-burst.js';

export const VANLAC_HEX = ['#140c12', '#4a1428', '#a8204a', '#ff4f7a', '#ffb3c6', '#efe9ee', '#ffffff'];

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
  const a = coilAngle(u, weave), R = SPOT - (weave === 'kiss' ? 4 : 6) * u, h = 4 + 40 * u;   // v3b: coil tops out at the chest (was 48: the necks left in a bar across the shoulders)   // even climb: front at the knees and chest, behind at the waist
  return [R * Math.cos(a), R * Math.sin(a) * SQ - h, Math.sin(a)];
}
function headA(t, weave) {
  if (t <= COIL) { const p = coilPos(clamp((t - EMERGE) / (COIL - EMERGE)), weave); return [p[0], p[1]]; }
  const [ex, ey] = coilPos(1, weave), side = Math.sign(ex) || 1;
  if (t <= REAR) {   // rear up: the neck bows outward, then the head hooks back in so the two heads face each other (XC)
    // cubic Bezier: swing wide out at chest height, rise, then hook level and inward, so each neck bows like ( ) (XC panel 3)
    const u = sm((t - COIL) / (REAR - COIL)), v = 1 - u, P = [[ex, ey], [side * BOW, ey - 8], [side * (BOW + 6), TOP[1] - 22], [side * TOP[0], TOP[1]]];
    const w = [v * v * v, 3 * u * v * v, 3 * u * u * v, u * u * u];
    return [w.reduce((q, k, i) => q + k * P[i][0], 0), w.reduce((q, k, i) => q + k * P[i][1], 0)];
  }
  if (t <= DIVE) return [side * TOP[0] - side * 1.5 * smooth(REAR, DIVE, t), TOP[1]];   // the strike pause: a slight forward lean
  const u = sm(clamp((t - DIVE) / 0.10));   // dive into the chest along a hooked arc
  return [side * TOP[0] * (1 - u) + side * 8 * Math.sin(u * Math.PI), TOP[1] + (CHEST[1] - TOP[1]) * u - 6 * Math.sin(u * Math.PI)];
}
function zAt(ti, weave) { return ti <= COIL ? coilPos(clamp((ti - EMERGE) / (COIL - EMERGE)), weave)[2] : 1; }
function serpents(p, t, layer, weave) {
  if (t < EMERGE || t > IN + BODY_L / SLIDE) return;
  const offset = Math.max(0, t - IN) * SLIDE;
  const keep = (ti, ly) => (zAt(ti, weave) > 1e-3 ? 'front' : 'back') === ly;   // LESSONS 20/11: 1e-3, not > 0
  const opts = { L: BODY_L, W, layer, keep, offset, xmin: -1, mouth: smooth(COIL + 0.05, REAR, t) * (1 - smooth(IN, IN + 0.05, t) * 0.5), heart: 0.6 + 0.4 * smooth(REAR, IN, t), seed: 2 };
  for (const m of [1, -1]) {
    const sp = spine((ti) => { const [x, y] = headA(ti, weave); return [m * x, y]; }, Math.min(t, IN), BODY_L - offset + 1, EMERGE);
    drawSerpentTD(p, sp, t, { ...opts, dorsal: -m });   // fixed dorsal side: fins never flip mid-coil
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


// ---------------------------------------------------------------- exact mirror + atlas-safe glass
// Only writes on the right half (screen x >= the body axis) are kept; each is copied to its mirror column. Everything,
// including the side-view heart and both serpents, is therefore exactly mirror-symmetric (K3/K7), whatever the
// rasteriser does with whole coordinates or with which serpent is drawn last.
// K1: the side-view heart fades by interpolating colours; every written colour is snapped to the nearest approved one.
const PAL = [...VANLAC_HEX, '#b9b3c4', '#d8d0e0', '#2b2626', '#5a524f', '#8f8580'].map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
const SNAP = new Map();
function snap(c) {
  if (!c) return c;
  let v = SNAP.get(c); if (v !== undefined) return v;
  const r = c & 255, g = (c >>> 8) & 255, b = (c >>> 16) & 255; let best = Infinity;
  for (const [R, G, B] of PAL) { const d = (r - R) ** 2 + (g - G) ** 2 + (b - B) ** 2; if (d < best) { best = d; v = ((c >>> 24) << 24 | B << 16 | G << 8 | R) >>> 0; } }
  v = v | 0; SNAP.set(c, v); return v;
}
function mirrored(p, fn) {
  const ax = Math.round(p.tx), { put, add, blendPx } = Object.getPrototypeOf(p);
  const copy = (sx, sy) => {
    const x = sx - p.ox, y = sy - p.oy, mx = 2 * ax - 1 - sx - p.ox;
    if (y < 0 || y >= p.h || x < 0 || x >= p.w || mx < 0 || mx >= p.w) return;
    p.C[y * p.w + mx] = p.C[y * p.w + x]; p.L[y * p.w + mx] = p.L[y * p.w + x];
  };
  p.put = (sx, sy, c, a = 1) => { if (sx < ax) return; put.call(p, sx, sy, snap(c), a); copy(sx, sy); };
  p.add = (sx, sy, c, k = 1) => { if (sx < ax) return; add.call(p, sx, sy, c, k); copy(sx, sy); };
  p.blendPx = (sx, sy, c, a) => {
    if (sx < ax) return; blendPx.call(p, sx, sy, c, a);
    const x = sx - p.ox, y = sy - p.oy; if (x >= 0 && y >= 0 && x < p.w && y < p.h) p.C[y * p.w + x] = snap(p.C[y * p.w + x]);
    copy(sx, sy);
  };
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
