// BOOM..END: outlined pixel puffs, a V plume and ballistic rubble.
import { smooth, clamp, TAU, hex } from '../../core/index.js';
import { L, DUST, TX, END, BOOM, GHOST, LC, out3, hsh } from './_tinhlien-common.js';

const WARM = ['#392a20', '#60462b', '#92703a', '#bc9653', '#d8bb7c'].map(hex);
const EMBER = ['#572b23', '#883c28', '#b75b2e'].map(hex);
const ROCKS = Array.from({ length: 34 }, (_, i) => {
  const vy = -90 - 260 * hsh(i, 9), land = (-vy + Math.sqrt(vy * vy + 4160)) / 520;
  return { vx: (hsh(i, 8) - 0.5) * 180, vy, land, bounce: 0.15 + 0.12 * hsh(i, 12), s: 1.4 + Math.floor(hsh(i, 10) * 3), c: Math.floor(hsh(i, 11) * 3), spin: (hsh(i, 13) - 0.5) * 12 };
});
// Stable, deliberately arranged rows: 48 puffs, largest around the crown.
const PUFFS = [2, 4, 6, 7, 8, 9, 12].flatMap((count, row) =>
  Array.from({ length: count }, (_, j) => {
    const i = row * 17 + j;
    return { s: 0.06 + row * 0.15 + (hsh(i, 31) - 0.5) * (row === 6 ? 0.06 : 0.105),
      u: (j / (count - 1) * 2 - 1) * 0.94 + (hsh(i, 32) - 0.5) * 0.08,
      r: row === 6 ? 15 + 3 * hsh(i, 33) : 5 + row * 1.4 + 2 * hsh(i, 33),
      phase: hsh(i, 34) * TAU, end: 2.55 + 0.43 * hsh(i, 35) };
  }));
const SURGE = Array.from({ length: 26 }, (_, i) => ({
  vx: (i % 2 ? 1 : -1) * (55 + 225 * hsh(i, 1)),
  r: 4 + 6 * hsh(i, 3), delay: 0.04 + 0.12 * hsh(i, 4),
  life: 1.6 + 1.1 * hsh(i, 5), phase: hsh(i, 6) * TAU
}));
const FALLOUT = Array.from({ length: 26 }, (_, i) => ({
  x: (hsh(i, 21) - 0.5) * 180, y: 18 + 72 * hsh(i, 22),
  speed: 12 + 16 * hsh(i, 23), end: 2.65 + 0.4 * hsh(i, 24),
  phase: hsh(i, 25) * TAU, size: hsh(i, 26) > 0.65 ? 2 : 1, c: 2 + (i % 2)
}));
// Pre-rasterized opaque cells: 1px rim, lower-right shadow, upper-left light and glint.
const PUFF_PIXELS = Array.from({ length: 22 }, (_, r) => {
  const cells = [];
  for (let y = -r - 1; y <= r + 1; y++) for (let x = -r - 1; x <= r + 1; x++) {
    const d = x * x + y * y;
    if (d > (r + 1) ** 2) continue;
    let band = 0;
    if (d <= r * r) {
      band = x * 0.45 + y > r * 0.38 ? 1 : 2;                                          // shade below a soft chord, lower right
      if ((x + r * 0.2) ** 2 + (y + r * 0.5) ** 2 < (r * 0.62) ** 2) band = 3;      // lit cap, upper left
      if (r >= 12 && (x + r * 0.35) ** 2 + (y + r * 0.62) ** 2 < (r * 0.2) ** 2) band = 4;   // a glint only on the big billows
    }
    cells.push([x, y, band]);
  }
  return cells;
});
// rim: 1 = only the dark silhouette pass (whole disc r+1), 0 = only the body bands. Drawing every rim first and every
// body after merges the puffs into one cloud mass with a single outer outline (cauliflower), not a pile of balls.
function puff(p, x, y, radius, palette, cool = false, rim = 0) {
  const r = Math.min(21, Math.round(radius));
  if (r < 1) return;
  x = Math.round(x); y = Math.round(y);
  for (const [dx, dy, band] of PUFF_PIXELS[r]) {
    if (rim ? false : band === 0) continue;
    const xx = x + dx, yy = y + dy;
    if (xx < -59 || xx > 298 || yy > 0 || yy < -234) continue;
    p.put(p.cellX(xx, yy), p.cellY(xx, yy), rim ? palette[0] : palette[cool ? Math.max(1, band - 1) : band]);
  }
}
const RAYS = Array.from({ length: 9 }, (_, i) => { const q = i * TAU / 9; return [Math.cos(q), Math.sin(q), 28 + 18 * hsh(i, 30)]; });
const SHAPE = [[-1, -0.35], [-0.25, -1], [0.8, -0.65], [1, 0.4], [-0.5, 0.8]];

function coneDust(p, t) {
  const raw = t - BOOM;
  if (raw < 0.02 || raw >= 3.02) return;
  // Two-frame holds at 30fps: pixel animation poses at 15fps, no alpha fade.
  const a = Math.floor(raw * 15) / 15;
  const rise = out3(clamp(a / 0.6)), slump = smooth(1.5, 2.9, a);
  const H = (12 + 112 * rise) * (1 - 0.57 * slump);
  const warm = t >= GHOST[0] && t < GHOST[1];
  const poses = PUFFS.map(P => {
    const shrink = 1 - smooth(P.end - 0.72, P.end, a);
    const x = TX + P.u * (6 + (12 + 112 * rise) * P.s * (0.62 + 0.22 * slump)) + 18 * slump * P.s
      + Math.sin(a * 1.3 + P.phase) * (1 + 2 * P.s);
    const y = -H * P.s - Math.min(a, 1.5) * 2 * P.s;
    return { x, y, r: P.r * (0.35 + 0.65 * rise) * (1 + 0.06 * Math.min(a, 2)) * shrink };
  });
  // High/far first; near rims overlap bodies to separate cauliflower lobes.
  poses.sort((a, b) => a.y - b.y);
  const pal = (P) => warm && Math.abs(P.x - TX) < 33 + -P.y * 0.17 ? WARM : DUST;
  for (const P of poses) puff(p, P.x, P.y, P.r, pal(P), false, 1);
  for (const P of poses) puff(p, P.x, P.y, P.r, pal(P), a > 2.25);
}
function groundDust(p, t) {
  const a = Math.floor((t - BOOM) * 15) / 15;
  const poses = [];
  for (const P of SURGE) {
    const b = a - P.delay;
    if (b < 0 || b >= P.life) continue;
    const f = b / P.life, r = P.r * (0.5 + 0.5 * out3(clamp(b / 0.35))) * (1 - smooth(0.52, 1, f));
    const x = TX + P.vx * (1 - Math.exp(-1.7 * b)) / 1.7;
    const y = -r - 1 - (1 + Math.sin(b * 3 + P.phase)) * 1.5;
    poses.push({ x, y, r });
  }
  poses.sort((a, b) => a.y - b.y);
  const pal = (P) => t >= GHOST[0] && t < GHOST[1] && Math.abs(P.x - TX) < 32 ? WARM : DUST;
  for (const P of poses) puff(p, P.x, P.y, P.r, pal(P), false, 1);
  for (const P of poses) puff(p, P.x, P.y, P.r, pal(P), a > 2.25);
}

export function blast(p, t, layer) {
  const a = t - BOOM;
  if (a < 0 || t >= END) return;
  if (layer === 'back') {
    const k = 1 - smooth(2.25, 3.08, a), hot = 1 - smooth(0.2, 1.8, a);
    if (k <= 0) return;
    const rx = 34 * k, ry = 3.5 * k;
    p.shade(TX - rx, -5, TX + rx, 2, (x, y, o) => {
      const e = ((x - TX) / rx) ** 2 + ((y + 1) / ry) ** 2;
      if (e > 1) return;
      o.c = e > 0.65 ? (y < -1 ? DUST[3] : DUST[1]) : e < 0.27 && hot > 0.05 ? EMBER[Math.min(2, Math.floor(hot * 3))] : DUST[0];
    });
    return;
  }
  // Ground veil shrinks in height and width instead of fading through dither.
  if (a > 0.12 && a < 3.05) {
    const k = 1 - smooth(1.7, 3.05, a), r = (35 + 85 * out3(clamp(a))) * k;
    p.shade(TX - r, -6 * k, TX + r, 1, (x, y, o) => {
      if (Math.abs(x - TX) < 29 * k && y > -4 * k) return;
      if (((x - TX) / r) ** 2 + ((y + 1) / (4 * k + 0.1)) ** 2 < 1) o.c = y < -2 ? DUST[2] : DUST[1];
    });
  }
  if (a < 0.25) {
    const f = 1 - a / 0.25;
    p.glow(LC[0], LC[1], 44, L[6], 0.35 * f);
    p.disc(LC[0], LC[1], 16 * f, L[6], 1);
    for (let ring = 0; ring < 2; ring++) {
      const r = 14 + (ring ? 108 : 132) * out3(clamp(a / 0.25)), pts = [];
      for (let i = 0; i <= 40; i++) { const q = i * TAU / 40; pts.push([TX + Math.cos(q) * r, -2 + Math.sin(q) * r * 0.1]); }
      p.polyline(pts, ring ? L[3] : L[5]);
      if (!ring && a < 0.15) p.polyline(pts.map(([x, y]) => [x, y - 1]), L[4]);
    }
  }
  coneDust(p, t);
  groundDust(p, t);
  // Keep the two-to-three-frame flash rays in front of the rising earth.
    if (a < 0.095) for (const [dx, dy, len] of RAYS) {
      const r = len * (0.75 + a * 3);
      p.poly([[TX + dx * 10 - dy * 2, LC[1] + dy * 10 + dx * 2], [TX + dx * r, LC[1] + dy * r], [TX + dx * 10 + dy * 2, LC[1] + dy * 10 - dx * 2]], L[5]);
    }
  if (a < 0.095) p.disc(LC[0], LC[1], 12 * (1 - a / 0.095), L[6], 1);
  for (const R of ROCKS) {
    if (a > 2.3 + 0.65 * R.c / 3) continue;
    const b = Math.min(a, R.land), after = Math.max(0, a - R.land), hop = Math.min(after, R.bounce);
    const x = TX + R.vx * (b + hop * 0.25), y = a < R.land ? -4 + R.vy * b + 260 * b * b : -260 * hop * (R.bounce - hop);
    const angle = R.spin * (b + hop), cs = Math.cos(angle), sn = Math.sin(angle);
    const pts = SHAPE.map(([u, v]) => [x + (u * cs - v * sn) * R.s, y - R.s + (u * sn + v * cs) * R.s]);
    if (R.s > 3 && a < R.land) {
      const vy = R.vy + 520 * b;
      p.line(x - R.vx * 0.055, y - R.s - vy * 0.055, x - R.vx * 0.015, y - R.s - vy * 0.015, DUST[2]);
    }
    p.poly(pts, DUST[R.c]);
    p.poly([pts[0], pts[1], pts[2], [x, y - R.s]], DUST[R.c + 1]);
  }
  if (a > 1.6) for (const P of FALLOUT) {
    if (a >= P.end) continue;
    const b = a - 1.6, y = -P.y + b * P.speed;
    const x = TX + P.x + Math.sin(b * 1.8 + P.phase) * 2;
    if (y < -3) {
      p.dot(x, y, DUST[P.c]);
      if (P.size === 2) p.dot(x + 1, y, DUST[P.c]);
    }
  }
}
