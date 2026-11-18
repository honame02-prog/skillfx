// Holy flame-lotus library (Opus, aesthetic design 18/11, after the user found the fan of flame blades monotonous):
// a REAL lotus (Nelumbo) burning. Three rings seen a little from the front:
//   outer ring  — 8 broad petals splayed wide and drooping at the tips (they read as the fox's tails around the body);
//   middle ring — 6 petals cupped upright into a bowl;
//   inner bud   — 4 short petals closed round the seed pod (mostly hidden by the fox's body).
// Each petal is the true lotus petal of _tinhlien-lotus-lib.js (elliptic, widest above the middle, blunt-pointed tip,
// cupped inner face, veins, warm root) — plus FIERCE FIRE: tongues lick off both rims and leap from the tip, jumping
// every ~1/16 s per petal (gusts), embers tear off; the petal outline breathes hard. Solid tiers, stateless.
import { clamp, hex } from '../../core/index.js';
import { L } from './_tinhlien-common.js';

const h1 = (x) => { const s = Math.sin(x * 91.7 + 13.1) * 43758.5453; return s - Math.floor(s); };
const TONGUE = [L[6], L[5], L[4], L[3]];

// the petal half-width profile of flamePetal (copied so the tongues sit exactly on its rims)
const M = 0.55;
const hw = (u, W) => u < M ? W * (0.2 + 0.8 * Math.sqrt(1 - ((M - u) / M) ** 2)) : W * Math.sqrt(Math.max(0, 1 - ((u - M) / (1 - M)) ** 2)) * (0.35 + 0.65 * Math.cos((u - M) / (1 - M) * 1.2));

// ---- flamePetal of _tinhlien-lotus-lib.js, same maths and same output pixel for pixel, but cheaper (perf 18/11): own pixel
// loop (no closure / OUT per pixel), a cheap reject of pixels beyond the petal's widest half-width before any sin(), the
// per-frame terms hoisted. Writes through p.put / p.add exactly as p.shade would.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const RAMP = [L[1], L[2], L[3], L[4], L[5], L[6], L[6]];
const tone = (x, sx, sy) => {
  x = clamp(x, 0, 6);
  const i = Math.floor(x), f = clamp((x - i - 0.5) * 2.2 + 0.5);
  return RAMP[Math.min(6, f > BAYER[(sy & 3) * 4 + (sx & 3)] ? i + 1 : i)];
};
// sin(x) to ~6e-8 (7th-order fold, cheaper than Math.sin); only the petal shader uses it
const INV_TAU = 1 / (2 * Math.PI), HALF_PI = Math.PI / 2;
function fsin(x) {
  x -= 6.283185307179586 * Math.round(x * INV_TAU);          // -pi..pi
  if (x > HALF_PI) x = 3.141592653589793 - x; else if (x < -HALF_PI) x = -3.141592653589793 - x;
  const x2 = x * x;
  return x * (1 + x2 * (-0.16666666666666666 + x2 * (0.008333333333333333 + x2 * (-0.0001984126984126984 + x2 * (2.7557319223985893e-6 + x2 * -2.505210838544172e-8)))));
}
const sm3 = (e0, e1, x) => { const t = (x - e0) / (e1 - e0), c = t < 0 ? 0 : t > 1 ? 1 : t; return c * c * (3 - 2 * c); };
const hwF = (u, W) => u < M ? W * (0.2 + 0.8 * Math.sqrt(1 - ((M - u) / M) ** 2)) : W * Math.sqrt(Math.max(0, 1 - ((u - M) / (1 - M)) ** 2)) * (0.35 + 0.65 * fsin((u - M) / (1 - M) * 1.2 + HALF_PI));
function petalPx(p, bx, by, tx, ty, W, t, seed, o) {
  const { dim = 0, side = 1, wisp = 1, heat = 0, sway = 0 } = o;
  const dx = tx - bx, dy = ty - by, Ln = Math.hypot(dx, dy);
  if (Ln < 2) return;
  const ux = dx / Ln, uy = dy / Ln, nx = -uy, ny = ux;
  const WH = 5 + Ln * 0.13;
  const pad = W * 1.4 + 6, x0 = Math.min(bx, tx) - pad, x1 = Math.max(bx, tx) + pad, y0 = Math.min(by, ty) - pad - WH, y1 = Math.max(by, ty) + pad;
  const ph = seed * 1.7;
  let ax = Infinity, bxx = -Infinity, ay = Infinity, byy = -Infinity;
  for (let k = 0; k < 4; k++) {
    const x = k & 1 ? x1 : x0, y = k & 2 ? y1 : y0, sx = p.toX(x, y), sy = p.toY(x, y);
    if (sx < ax) ax = sx; if (sx > bxx) bxx = sx; if (sy < ay) ay = sy; if (sy > byy) byy = sy;
  }
  const sx0 = Math.max(Math.floor(ax), p.ox), sx1 = Math.min(Math.ceil(bxx), p.ox + p.w - 1);
  const sy0 = Math.max(Math.floor(ay), p.oy), sy1 = Math.min(Math.ceil(byy), p.oy + p.h - 1);
  const { tx: ptx, ty: pty, cs, sn, fx } = p;
  const VMAX = Math.max(0.6, W * 1.2);   // half-width never exceeds 1.11 W (or 0.6): farther pixels are empty (the wisp is tested first)
  const tw = t * 6.5, tw2 = t * 10, tf = t * 9, tg = t * 2.1;
  const wispH = WH * wisp * (0.8 + 0.2 * fsin(t * 11 + ph)), hp2 = ph * 2;
  // per row, the span of sx where the pixel can be inside the oriented box u in [-0.02, wisp top], |v| <= VM (u and v are linear in sx);
  // a 1 px margin each side, and every pixel inside is still tested exactly as before
  const umax = wisp > 0 ? 0.93 + wispH / Ln : 0.93, VM = Math.max(VMAX, wisp > 0 ? W * 0.42 + 0.4 + Math.abs(sway) + 1.2 : 0);
  const du = (cs * fx * ux - sn * uy) / Ln, dv = (cs * fx * nx - sn * ny) * side;
  for (let sy = sy0; sy <= sy1; sy++) {
    const ddy = sy + 0.5 - pty;
    let lo = sx0, hi = sx1;
    {
      const ddx0 = sx0 + 0.5 - ptx, lx0 = (ddx0 * cs + ddy * sn) * fx, ly0 = -ddx0 * sn + ddy * cs;
      const e0x = lx0 - bx, e0y = ly0 - by, u0 = (e0x * ux + e0y * uy) / Ln, v0 = (e0x * nx + e0y * ny) * side;
      // k = sx - sx0 must satisfy lo_ <= a0 + d*k <= hi_
      const span = (a0, d, lo_, hi_) => {
        if (Math.abs(d) < 1e-9) { if (a0 < lo_ - 1e-6 || a0 > hi_ + 1e-6) hi = -1e9; return; }
        let k0 = (lo_ - a0) / d, k1 = (hi_ - a0) / d;
        if (k0 > k1) { const q = k0; k0 = k1; k1 = q; }
        lo = Math.max(lo, sx0 + Math.floor(k0) - 1); hi = Math.min(hi, sx0 + Math.ceil(k1) + 1);
      };
      span(u0, du, -0.02, umax); span(v0, dv, -VM, VM);
      if (lo > hi) continue;
    }
    for (let sx = lo; sx <= hi; sx++) {
      const ddx = sx + 0.5 - ptx;
      const lx = (ddx * cs + ddy * sn) * fx, ly = -ddx * sn + ddy * cs;
      const ex = lx - bx, ey = ly - by, u = (ex * ux + ey * uy) / Ln;
      if (u < -0.02) continue;
      const v = (ex * nx + ey * ny) * side;
      if (u > 0.93) {
        if (wisp <= 0) continue;
        const f = (u - 0.93) * Ln / wispH;
        if (f > 1) continue;
        const c = sway * f * f + 1.2 * fsin(t * 8 + f * 3 + ph) * f;
        const w = W * 0.42 * Math.sqrt(Math.max(0, 1 - f * f)) * (1 - 0.35 * f) + 0.4;
        if (Math.abs(v - c) > w) continue;
        p.put(sx, sy, tone(4.6 - f * 1.6 + heat, lx, ly), 1);
        const kk = 0.12 * (1 - f);
        if (kk > 0) p.add(sx, sy, L[6], kk);
        continue;
      }
      if (v > VMAX || -v > VMAX) continue;
      const breathe = 1 + (0.07 * fsin(u * 5.5 - tw + ph + (v > 0 ? 0 : 1.9)) + 0.04 * fsin(u * 11 - tw2 + hp2)) * sm3(0.15, 0.8, u);
      const w = Math.max(0.6, hwF(u < 0 ? 0 : u, W) * breathe), s = v / w, as = Math.abs(s);
      if (as > 1) continue;
      const edge = (1 - as) * w;
      if (edge < 1 && u > 0.05) { p.put(sx, sy, RAMP[clamp(Math.round((s < 0 ? 0.6 : 1.6) - dim * 0.4 + heat * 2.5), 0, 6)], 1); continue; }
      const lip = 1 - 0.4 * sm3(0.25, 0.95, u), inner = s > lip;
      const flow = 0.35 * fsin(u * 8 - tf + ph + s * 1.3) * fsin(s * 2.4 + tg + ph);
      let b = 1.6 + 2.1 * sm3(0, 0.45, u) - 1.2 * as * as * Math.sqrt(as) + 0.6 * (1 - as) * sm3(0.3, 0.7, u) + flow - dim * 1.2 + heat * 2.8;
      if (inner) b = 4.9 - 0.5 * sm3(0.5, 1, u) - dim * 0.6 + heat;
      else if (s > lip - 0.14 && u > 0.3) b -= 1.1;
      const vs = s / (inner ? 1 : lip);
      if (!inner && u > 0.1 && u < 0.86 && Math.abs(fsin(vs * Math.PI * 1.5)) < 0.13) b -= 0.6;
      p.put(sx, sy, tone(b, lx, ly), 1);
      if (u > 0.2) { const kk = 0.06 * (1 - as); if (kk > 0) p.add(sx, sy, L[6], kk); }
    }
  }
}

/** fire tongues licking off a petal from (bx,by) to (tx,ty), half-width W */
function petalFire(p, bx, by, tx, ty, W, t, seed, k) {
  const dx = tx - bx, dy = ty - by, Ln = Math.hypot(dx, dy);
  if (Ln < 3) return;
  const ux = dx / Ln, uy = dy / Ln, nx = -uy, ny = ux;
  const n = Math.max(5, Math.round(Ln / 3.2));
  for (let i = 1; i < n; i++) {
    const u = 0.25 + 0.72 * (i / n);
    for (const side of [-1, 1]) {
      const g = h1(seed * 3.1 + i * 7.3 + side * 1.7 + Math.floor(t * 16 + i * 0.29 + seed) * 5.9);
      if (g < 0.3) continue;
      const w = hw(u, W) + 0.5, len = (1.5 + 6.5 * g * g) * k * (0.6 + 0.6 * u);
      const x0 = bx + ux * u * Ln + nx * side * w, y0 = by + uy * u * Ln + ny * side * w;
      // tongues lean outward and UP (fire rises whatever the petal's angle), curl with a slow wave
      let ox = nx * side * 0.55 + ux * 0.25, oy = ny * side * 0.55 + uy * 0.25 - 0.8;
      const ol = Math.hypot(ox, oy); ox /= ol; oy /= ol;
      for (let j = 0; j < len; j++) {
        const f = j / len, wob = Math.sin(t * 14 + i + j * 0.7 + seed) * f * 1.4;
        p.dot(x0 + ox * j - oy * wob, y0 + oy * j + ox * wob, TONGUE[Math.min(3, Math.floor(f * 3.2))]);
        if (j < len * 0.4 && len > 4) p.dot(x0 + ox * j - oy * wob + nx * side * 0.6, y0 + oy * j + ox * wob + ny * side * 0.6, L[6]);
      }
      if (g > 0.93) p.dot(x0 + ox * (len + 2), y0 + oy * (len + 2) - 1, L[5]);   // an ember torn off
    }
  }
  // the tip flame leaps: a tall flickering tongue above the tip
  const g = h1(seed * 9.7 + Math.floor(t * 14 + seed) * 2.3), tl = (4 + 9 * g) * k;
  for (let j = 0; j < tl; j++) {
    const f = j / tl, wob = Math.sin(t * 11 + j * 0.5 + seed) * f * 2;
    const x = tx + ux * j * 0.5 + wob, y = ty + uy * j * 0.5 - j * 0.85;
    p.dot(x, y, TONGUE[Math.min(3, Math.floor(f * 3.5))]);
    if (f < 0.5) p.dot(x + 1, y, L[5]);
  }
}

const RINGS = [
  // outer: broad, splayed to ±100°, drooping tips (tilt pulls the tip down at the sides)
  { n: 8, spread: 1.75, len: 31, W: 9.5, lift: 0, droop: 0.45, dim: 0.9, back: true },
  { n: 6, spread: 0.95, len: 30, W: 9, lift: 5, droop: 0.1, dim: 0.45, back: false },
  { n: 4, spread: 0.38, len: 21, W: 7.5, lift: 9, droop: 0, dim: 0, back: false },
];

/**
 * A burning real lotus with its root (heart) at (cx,cy), scale s (1 ~ 62 px tall, 100 px wide).
 * o: open (0..1 bloom), crush (0..1 closes & whitens, for the devouring), k (fire strength 0..1.5), seed.
 */
export function holyLotus(p, cx, cy, s, t, o = {}) {
  const { open = 1, crush = 0, k = 1, seed = 0 } = o;
  if (s <= 0.05) return;
  const breathe = 1 + 0.04 * Math.sin(t * 3.1 + seed) + 0.025 * Math.sin(t * 7.7);
  RINGS.forEach((R, ri) => {
    for (let j = 0; j < R.n; j++) {
      const q = (j + 0.5) / R.n - 0.5, sp = R.spread * (0.3 + 0.7 * open) * (1 - 0.7 * crush);
      const a = q * 2 * sp + 0.06 * Math.sin(t * (2.1 + j * 0.31) + ri * 2 + j * 1.3 + seed);
      const len = R.len * s * breathe * (0.9 + 0.1 * Math.sin(t * 5 + j * 2.1 + ri)) * (1 - 0.4 * crush);
      const bx = cx + Math.sin(a) * 3 * s, by = cy - R.lift * s;
      // droop: the outer petals' tips fall as they splay sideways
      const ang = a * (1 + R.droop * Math.abs(q) * 0.6);
      const tx = bx + Math.sin(ang) * len, ty = by - Math.cos(ang) * len * (0.85 + 0.15 * (1 - R.droop)) + R.droop * Math.abs(Math.sin(ang)) * len * 0.35;
      const W = R.W * s * (1 - 0.3 * crush);
      petalPx(p, bx, by, tx, ty, W, t, seed + ri * 7 + j * 3.1, { dim: R.dim, side: a >= 0 ? 1 : -1, wisp: 0.9 + 0.3 * k, heat: crush, sway: -Math.sin(a) * 4 * s });
      petalFire(p, bx, by, tx, ty, W, t, seed + ri * 13 + j * 5.7, k * (1 - 0.5 * crush) * Math.min(1, s * 1.1));
    }
  });
}
