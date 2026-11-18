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
import { flamePetal } from './_tinhlien-lotus-lib.js';

const h1 = (x) => { const s = Math.sin(x * 91.7 + 13.1) * 43758.5453; return s - Math.floor(s); };
const TONGUE = [L[6], L[5], L[4], L[3]];

// the petal half-width profile of flamePetal (copied so the tongues sit exactly on its rims)
const M = 0.55;
const hw = (u, W) => u < M ? W * (0.2 + 0.8 * Math.sqrt(1 - ((M - u) / M) ** 2)) : W * Math.sqrt(Math.max(0, 1 - ((u - M) / (1 - M)) ** 2)) * (0.35 + 0.65 * Math.cos((u - M) / (1 - M) * 1.2));

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
      flamePetal(p, bx, by, tx, ty, W, t, seed + ri * 7 + j * 3.1, { dim: R.dim, side: a >= 0 ? 1 : -1, wisp: 0.9 + 0.3 * k, heat: crush, sway: -Math.sin(a) * 4 * s });
      petalFire(p, bx, by, tx, ty, W, t, seed + ri * 13 + j * 5.7, k * (1 - 0.5 * crush) * Math.min(1, s * 1.1));
    }
  });
}
