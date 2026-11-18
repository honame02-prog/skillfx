// Holy fox library (Opus, aesthetic design 18/11, v4 after user notes): the fox body is the user's reference image
// reduced to a smooth pixel sprite (_holyfox-sprite.js, tools/sprite_from_ref.py), sitting upright facing the viewer.
// It has NO tails: its "tail" is one large white flame-lotus blooming right behind the body (the body hides the
// lotus' heart; the petals splay out round it like a fan of tails) and flickering.
// The devouring never spins the fox: a vortex opens IN its chest; the body is drawn in toward that point (outer parts
// first, a slight inward stretch, a small local twist only near the chest) and the lotus closes and is swallowed.
// Card: design/di-hoa/tinh-lien-v2-ho-ly.md. Solid tiers, no alpha, stateless.
import { clamp, hex, TAU } from '../../core/index.js';
import { L, DUST, IRIS, grid } from './_tinhlien-common.js';
import { petal, LOOP } from '../ultimate/_lotus-lib.js';   // the approved living-fire petal of the earlier lotus moves
import { SW, SH, FEET, CHEST, ROWS } from './_holyfox-sprite.js';

export const FOX = [DUST[2], DUST[3], DUST[4], hex('#d9d0bd'), L[4], L[5], L[6]];
const NOSE = hex('#241c18');
// ivory fire ramps (7 steps, dark root -> white): two close variants so neighbouring petals differ a little
const IVORY = [['#3a2e1c', '#8a6a2a', '#c9a24a', '#e9cf8a', '#efe6cf', '#fbf8f0', '#ffffff'], ['#33281e', '#7a6040', '#b8a070', '#ddd0a8', '#f2ead6', '#fdfaf2', '#ffffff']].map((r) => r.map(hex));
const PX = new Int8Array(SW * SH).fill(-1);   // -1 empty, 0..6 tier, 7 eye, 8 nose
for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
  const ch = ROWS[y][x];
  PX[y * SW + x] = ch === '.' ? -1 : ch === 'e' ? 7 : ch === 'n' ? 8 : +ch;
}
// static flame-reach table: DOWN[(iy+24)*SW+ix] = smallest j in 1..14 such that the tongue source is j rows below (same rule as
// the original per-pixel scan), 15 when none. iy runs from -24 (rows above the sprite) to SH-1.
const DOWN = new Uint8Array((SH + 24) * SW).fill(15);
let IYMIN = SH;   // first row with any reachable source
for (let iy = -24; iy < SH; iy++) for (let ix = 0; ix < SW; ix++) {
  let j = 1;
  for (; j <= 14; j++) {
    const yy = iy + j;
    if (yy < 0 || yy >= SH) continue;
    if (PX[yy * SW + ix] >= 0 || (j > 2 && ((ix > 0 && PX[yy * SW + ix - 1] >= 0) || (ix < SW - 1 && PX[yy * SW + ix + 1] >= 0)))) break;
  }
  if (j <= 14) { DOWN[(iy + 24) * SW + ix] = j; if (iy < IYMIN) IYMIN = iy; }
}
const FLOWC = new Float64Array(SW * SH);
const RMAX = Math.hypot(Math.max(CHEST[0], SW - CHEST[0]), Math.max(CHEST[1], SH - CHEST[1]));

/** world position of the chest (vortex centre) for feet at F and scale S */
export const chestOf = (F, S) => [F[0] + (CHEST[0] - FEET[0]) * S, F[1] + (CHEST[1] - FEET[1]) * S];

/**
 * o: F [x,y] world feet, S scale, reveal (0..1 mist condenses), eye (0..1), lotus (0..1 bloom), devour (0..1: drawn into the
 * chest vortex), seed. Returns { chest, lotusTop, size } in world space.
 */
export function holyFox(p, t, o) {
  const { F, S, reveal = 1, eye = 1, lotus = 1, devour = 0, seed = 0, layer } = o;   // layer 'back': lotus only, 'front': body only
  if (S <= 0.01 || reveal <= 0 || devour >= 1) return null;
  const [Cx, Cy] = chestOf(F, S);
  const toW = (sx, sy) => [F[0] + (sx - FEET[0]) * S, F[1] + (sy - FEET[1]) * S];

  // 1. the flame-lotus right behind the body: the earlier moves' living-fire lotus in ivory; the body hides its heart
  const [lx, ly] = toW(FEET[0], SH * 0.62);
  const pull = devour * devour, lit = 1 - 0.5 * devour;
  const lpx = lx + (Cx - lx) * pull, lpy = ly + (Cy - ly) * pull;
  const ls = 2.1 * S * (0.25 + 0.75 * lotus) * (1 - 0.85 * devour);
  if (layer !== 'front' && lotus > 0 && reveal > 0.3 && ls > 0.15) {
    if (o.lotusFn) o.lotusFn(p, lpx, lpy, ls, t, devour, lotus); else fireLotus(p, t, lpx, lpy, ls, 0.3 + 0.7 * devour);
  }

  if (layer === 'back') return { chest: [Cx, Cy], lotusTop: [lpx, lpy - 30 * ls], size: ls };
  // 2. the body
  const [X0, Y0] = toW(-8, -24), [X1, Y1] = toW(SW + 8, SH + 2);
  // the noise is only read while the mist condenses or the body is devoured
  const nz = (devour > 0 || reveal < 1) ? grid(X0, Y0, X1, Y1, 3, (x, y) => noiseLite((x - F[0]) / S * 0.13 + seed, (y - F[1]) / S * 0.13 + t * 0.4)) : null;
  // per-frame column terms of the flame tongues and lazy per-sprite-pixel flow cache
  const WG = new Float64Array(SW), COLSIN = new Float64Array(SW), FLOWX = new Float64Array(SW);
  const beatT = t * 18;
  for (let ix = 0; ix < SW; ix++) {
    const cl = Math.floor(ix / 2), beat = Math.floor(beatT + cl * 0.61);
    const gust = 0.35 + 0.65 * hsh01(cl * 7.1 + beat * 3.3);
    const wave = 0.5 + 0.5 * Math.sin(ix * 0.9 + t * 13 + Math.sin(ix * 0.37 + t * 4) * 2.4);
    WG[ix] = 7 * wave * gust;
    COLSIN[ix] = Math.sin(ix * 0.5 + t * 2.3) * 2.5;
    FLOWX[ix] = ix * 0.31 - t * 1.7;
  }
  FLOWC.fill(NaN);
  const tFlow = t * 16;
  p.shade(X0, Y0, X1, Y1, (x, y, out) => {
    let sx = (x - F[0]) / S + FEET[0], sy = (y - F[1]) / S + FEET[1];
    const n = nz ? nz(x, y) : 0;
    if (devour > 0) {
      // drawn in: sample farther out (the body stretches toward the chest), a small twist near the chest only
      let dx = sx - CHEST[0], dy = sy - CHEST[1];
      const r = Math.hypot(dx, dy), tw = o.twist ?? 2.2, th = devour * tw * Math.exp(-r / (o.twistR ?? 14)), c = Math.cos(th), s = fsin(th);
      const ex = dx * c - dy * s; dy = dx * s + dy * c; dx = ex;
      const k = 1 + devour * 0.45 * (r / RMAX);
      sx = CHEST[0] + dx * k; sy = CHEST[1] + dy * k;
      if ((r / RMAX) * 0.85 + n * 0.35 > 1.15 - devour * 1.35) return;   // outer parts swallowed first
    }
    if (sx < -3 || sx > SW + 3 || sy >= SH + 4 || sy < IYMIN - 4) return;   // too far from the sprite for the flow to reach it
    // the whole body burns: turbulent upward flow distorts the lookup (stronger toward the top and the sides)
    const up = clamp(1 - sy / SH), side = Math.min(1, Math.abs(sx - FEET[0]) / (SW * 0.5));
    const tur = (0.6 + 1.4 * up) * (0.5 + 0.5 * side) * lit;
    sx += fsin(sy * 0.55 + t * 15 + fsin(sx * 0.4 + t * 5)) * 0.7 * tur;
    sy += (0.5 + 0.5 * fsin(sx * 0.8 - t * 17 + sy * 0.3)) * 1.1 * tur;
    const ix = Math.floor(sx), iy = Math.floor(sy);
    if (ix < 0 || ix >= SW || iy >= SH) return;
    let v = iy < 0 ? -1 : PX[iy * SW + ix];
    if (v < 0) {
      // fierce white fire from every edge: tongues rise from the body (also from the sides, via the diagonal columns)
      const j = DOWN[(iy + 24) * SW + ix];
      if (j > 14) return;
      const hgt = (2 + WG[ix]) * (0.55 + 0.45 * lit) * (0.5 + 0.5 * up);
      const f = j / hgt;
      if (reveal < 0.85) return;
      if (f > 1) {   // embers torn off the tongue tips
        if (f < 1.7 && hsh01(ix * 3.7 + iy * 11.3 + Math.floor(t * 24) * 5.1) > 0.93) { out.c = L[5]; out.a = 1; out.l = L[5]; out.k = 0.15; }
        return;
      }
      out.c = f < 0.35 ? L[6] : f < 0.65 ? L[5] : f < 0.85 ? L[4] : L[3]; out.a = 1;
      return;
    }
    if (reveal < 1) {   // mist condenses: chest first, ears and paws last
      const r = Math.hypot(ix - CHEST[0], iy - CHEST[1]) / RMAX;
      if (n * 0.5 + r * 0.7 > reveal * 1.3 - 0.02) return;
    }
    if (v === 7) {
      if (eye < 0.5 || devour > 0.3) v = 5;
      else { out.c = IRIS[3]; out.a = 1; out.l = IRIS[4]; out.k = 0.35 * eye; return; }
    }
    if (v === 8) { out.c = devour > 0.3 ? FOX[4] : NOSE; out.a = 1; return; }
    const fi = iy * SW + ix;
    let flow = FLOWC[fi];
    if (flow !== flow) FLOWC[fi] = flow = fsin(iy * 0.5 + tFlow + COLSIN[ix]) * fsin(FLOWX[ix] + iy * 0.08);
    const tier = Math.min(6, Math.max(0, v - (v >= 5 && iy > CHEST[1] - 8 ? 1 : 0)) + Math.round(devour * 3) + (flow > 0.6 ? 1 : 0));
    out.c = FOX[tier]; out.a = 1;
  });
  return { chest: [Cx, Cy], lotusTop: [lpx, lpy - 30 * ls], size: ls };
}

// the earlier moves' fire lotus (two fans of living-fire petals), WITHOUT its glows/halo so the fox stays readable
function fireLotus(p0, t, x, y, s, inst) {
  // same painter, but the petals' added light is cut to 15% (it washed the white fox out)
  const p = Object.create(p0), K = 0.15;
  p.light = (a, b, c, k = 1) => p0.light(a, b, c, k * K);
  p.glow = (a, b, r, c, k = 0.5) => p0.glow(a, b, r, c, k * K);
  p.add = (a, b, c, k = 1) => p0.add(a, b, c, k * K);
  p.shade = (a, b, c, d, fn) => p0.shade(a, b, c, d, (xx, yy, out) => { fn(xx, yy, out); if (out.k) out.k *= K; });
  const tl = ((t % LOOP) + LOOP) % LOOP, ph = tl / LOOP * TAU, rot = 0.11 * Math.sin(ph);
  const row = (n, radius, high, width, r, baseY) => {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI + 0.17 + i / (n - 1) * (Math.PI - 0.34) + rot;
      const sway = inst * Math.sin(t * 91 + i * 4 + r) * 2;
      petal(p, x + Math.cos(a) * 2 * s, y + baseY * s, Math.cos(a) * radius * s + sway, (Math.sin(a) * high - 3) * s, width * s, IVORY[(i + r) % 2], tl, 5 * 31 + i + r * 11, 1, inst * 0.5);
    }
  };
  row(7, 32, 34, 8.3, 0, 0);
  row(5, 24, 25, 8.1, 1, 3);
}
// sin(x) to ~6e-8 (cheaper than Math.sin); used by the body shader's per-pixel flow only
const INV_TAU = 1 / (2 * Math.PI), HALF_PI = Math.PI / 2;
function fsin(x) {
  x -= 6.283185307179586 * Math.round(x * INV_TAU);
  if (x > HALF_PI) x = 3.141592653589793 - x; else if (x < -HALF_PI) x = -3.141592653589793 - x;
  const x2 = x * x;
  return x * (1 + x2 * (-0.16666666666666666 + x2 * (0.008333333333333333 + x2 * (-0.0001984126984126984 + x2 * (2.7557319223985893e-6 + x2 * -2.505210838544172e-8)))));
}
function hsh01(x) { const h = Math.sin(x * 91.7) * 43758.5453; return h - Math.floor(h); }
function noiseLite(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const h = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
  const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}
