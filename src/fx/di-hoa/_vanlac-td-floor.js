// Van Lac top-down: mirrored polygonal seal, earth break-out and swept floor grit.
import { smooth, TAU } from '../../core/index.js';
import { C, SHADE, ASH } from './_vanlac-common.js';
import { hash } from './_cold-lib.js';
import { END, SEAL, EMERGE, COIL, DIVE, BEATS, BURN, SQ, SPOT, SEAL_RX, fr } from './_vanlac-td-common.js';

// Four cells straddle the axis; ten lie on either side. Mirrored sites give 14
// visible cells per half without forcing an artificial straight crack at x=0.
const SITES = [[0, -32], [0, -12], [0, 10], [0, 31], [12, -29], [26, -23],
  [34, -9], [32, 8], [23, 25], [11, 30], [12, 13], [22, 5], [20, -12], [10, -5]];
const FULL = [...SITES, ...SITES.filter(([x]) => x > 0).map(([x, y]) => [-x, y])];
const CELLS = new Map();
// Exact distance in SCREEN pixels to the nearest Voronoi boundary, including
// the 0.5 floor projection. Cache only geometry, never a seed or animation state.
function cellAt(x, y) {
  const key = `${x},${y}`;
  if (CELLS.has(key)) return CELLS.get(key);
  const yy = y / SQ;
  let best = Infinity, site = 0;
  for (let i = 0; i < FULL.length; i++) {
    const d = (x - FULL[i][0]) ** 2 + (yy - FULL[i][1]) ** 2;
    if (d < best) { best = d; site = i; }
  }
  const [sx, sy] = FULL[site];
  let edge = Infinity;
  for (let i = 0; i < FULL.length; i++) if (i !== site) {
    const [a, b] = FULL[i], d = (x - a) ** 2 + (yy - b) ** 2;
    edge = Math.min(edge, (d - best) / (2 * Math.hypot(a - sx, (b - sy) / SQ)));
  }
  const v = { edge, heat: 1 - Math.hypot(sx, sy) / SEAL_RX };
  CELLS.set(key, v); return v;
}
function sealGlow(t) {
  let g = smooth(SEAL, 0.35, t) * (1 - 0.5 * smooth(COIL, DIVE, t));
  for (const b of BEATS) g += 0.8 * Math.exp(-(((t - b) / 0.06) ** 2));
  return g + 1.2 * Math.exp(-(((t - BURN) / 0.08) ** 2));
}
const cooled = (i, t) => C[t <= 2.45 || i === 0 ? i : Math.max(1, i - Math.floor(3.999 * smooth(2.45, END, t)))];
function intact(x, y, t, sd) {
  if (t <= 2.45) return true;
  const decay = smooth(2.45, END, t);
  // Erode coherent little fragments first, then their remaining pixels.
  const noise = 0.7 * hash(Math.floor(Math.abs(x) / 3), Math.floor(y / 2), sd)
    + 0.3 * hash(Math.floor(Math.abs(x)), Math.floor(y), sd + 31);
  return noise >= decay;
}
export function seal(p, t, sd) {
  if (t <= 0 || t >= END) return;
  const grow = smooth(0, 0.30, t), open = smooth(0.08, 0.40, t), g = sealGlow(t), rot = t * 0.6;
  p.shade(-SEAL_RX - 3, -SEAL_RX * SQ - 2, SEAL_RX + 3, SEAL_RX * SQ + 2, (x, y, o) => {
    const ax = Math.abs(x), ex = ax / SEAL_RX, ey = y / (SEAL_RX * SQ), r = Math.hypot(ex, ey);
    if (r > 1.05 || !intact(ax, y, t, sd)) return;
    const ang = Math.atan2(ey, ex), sweep = Math.PI * (0.5 + 0.5 * grow) + 0.2;
    const fromBack = Math.abs(ang + Math.PI / 2) <= sweep || Math.abs(ang - 3 * Math.PI / 2) <= sweep;
    if (Math.abs(r - 1) < 0.035 && fromBack) { o.c = cooled(g > 0.9 ? 4 : 3, t); return; }
    if (Math.abs(r - 0.66) < 0.028 && grow > 0.4) {
      const d = (ang + rot) / TAU * 16;
      if (d - Math.floor(d) < 0.55) { o.c = cooled(g > 1 ? 3 : 2, t); return; }
    }
    if (r < 0.95 && r > 0.72 && grow > 0.6) {
      const q = Math.abs(ang) / TAU * 24 + 0.5, f = q - Math.floor(q);
      if ((f < 0.09 && Math.abs(r - 0.84) < 0.075)
        || (f < 0.20 && Math.abs(r - 0.88) < 0.02)) { o.c = cooled(g > 0.6 ? 2 : 1, t); return; }
    }
    if (r >= 0.95 || r > open * 1.02 || open <= 0) return;
    const { edge, heat } = cellAt(ax, y);
    if (edge < 0.48) o.c = cooled(g > 0.9 && heat > 0.25 ? 4 : (heat > 0.15 || g > 0.9 ? 3 : 2), t);
    else if (edge < 1.05) o.c = cooled(2, t);
  });
  // Two short, detached forks on each side: dim faults beyond the seal.
  if (open > 0.7) for (const m of [1, -1]) for (const [i, path] of [
    [[44, -10], [48, -12], [51, -10], [56, -11]],
    [[37, 20], [41, 22], [45, 21], [49, 24]],
  ].entries()) {
    for (let j = 1; j < path.length; j++) {
      const [a, b] = path[j - 1], [x, y] = path[j];
      p.line(m * a, b, m * x, y, cooled(g > 1 && j === 1 ? 2 : 1, t),
        (u) => intact(a + (x - a) * u, b + (y - b) * u, t, sd + i + 3) ? 1 : 0);
    }
    p.line(m * path[1][0], path[1][1], m * (path[1][0] + 1), path[1][1] - 3, cooled(1, t), intact(path[1][0], path[1][1], t, sd) ? 1 : 0);
  }
  for (const m of [1, -1]) {
    const pre = smooth(0.18, EMERGE, t), breach = smooth(EMERGE, 0.48, t);
    if (pre > 0) p.ellipse(m * SPOT, 0, 3 + 3 * pre, (2 + pre) * SQ, (r, a) => {
      const x = SPOT + Math.cos(a) * r * (3 + 3 * pre), y = Math.sin(a) * r * (2 + pre) * SQ;
      if (!intact(x, y, t, sd)) return 0;
      if (breach > 0) return cooled(r > 0.70 ? 3 : (r > 0.45 ? 1 : 0), t);
      return cooled(r < 0.6 ? 4 : 2, t);
    });
    // Eight angular chunks per hole. All launch/land in 0.40..0.60 s;
    // projected ground drift and uncompressed ballistic height are separate.
    for (let i = 0; i < 8; i++) {
      const launch = EMERGE + hash(i, 14, sd) * 0.022, life = 0.15 + hash(i, 15, sd) * 0.028;
      const u = (t - launch) / life;
      if (u <= 0 || u >= 1) continue;
      const a = (i + 0.3) / 8 * TAU, reach = 6 + hash(i, 16, sd) * 6;
      const x = SPOT + Math.cos(a) * (3 + reach * u), groundY = Math.sin(a) * (3 + reach * u) * SQ;
      const h = (6 + hash(i, 17, sd) * 6) * 4 * u * (1 - u), y = groundY - h;
      const s = 1.2 + hash(i, 18, sd) * 1.2, spin = a + u * 3;
      p.ellipse(m * x, groundY + 1, s + 0.8, 0.65, C[0]);
      const pts = [[-s, -0.3], [-s * 0.2, -s], [s, 0], [s * 0.3, s * 0.7]].map(([dx, dy]) =>
        [m * (x + dx * Math.cos(spin) - dy * Math.sin(spin)), y + dx * Math.sin(spin) + dy * Math.cos(spin)]);
      p.poly(pts, ASH[i % 3]);
      p.line(...pts[0], ...pts[1], C[2]);
    }
  }
}
export function dust(p, t) {
  if (t < EMERGE || t > COIL + 0.3) return;
  const k = smooth(EMERGE, EMERGE + 0.15, t) * (1 - smooth(COIL, COIL + 0.3, t));
  for (let i = 0; i < 14; i++) {
    const a0 = hash(i, 11, 3) * TAU, r = 16 + 22 * hash(i, 12, 3), a = a0 + (t - EMERGE) * (2.4 + hash(i, 13, 3) * 2);
    if (hash(i, fr(t), 5) > k) continue;
    const x = Math.abs(Math.cos(a) * r), y = Math.sin(a) * r * SQ;
    for (const m of [1, -1]) p.dot(m * x, y, i % 3 ? SHADE : C[4]);
  }
}
