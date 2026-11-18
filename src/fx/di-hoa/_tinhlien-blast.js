// BOOM..INHALE: a V plume of outlined pixel billows (size hierarchy, creases, specks, a rolling crown, earth below and
// ash above), lit from inside when the eye looks through it, then drawn up in a spiral into the eye. Ballistic rubble.
import { smooth, clamp, TAU, hex } from '../../core/index.js';
import { L, DUST, TX, BOOM, GHOST, INHALE, LC, EC, out3, hsh } from './_tinhlien-common.js';

// palettes: [rim, shadow, body, light, glint]
const EARTH = ['#21170f', '#3b2a1c', '#5a412c', '#7c5e41', '#a07e5a'].map(hex);
const ASHP = ['#252327', '#3f3b40', '#5d5859', '#827b77', '#a8a097'].map(hex);
const WARM = ['#3a2a1c', '#6a4c2a', '#9c773e', '#c9a35c', '#ecd59a'].map(hex);
const HOT = ['#5a4024', '#a07a3c', '#d2ac62', '#efd79a', '#fff4d0'].map(hex);
const EMBER = ['#572b23', '#883c28', '#b75b2e'].map(hex);
const ROCKS = Array.from({ length: 34 }, (_, i) => {
  const vy = -90 - 260 * hsh(i, 9), land = (-vy + Math.sqrt(vy * vy + 4160)) / 520;
  return { vx: (hsh(i, 8) - 0.5) * 180, vy, land, bounce: 0.15 + 0.12 * hsh(i, 12), s: 1.4 + Math.floor(hsh(i, 10) * 3), c: Math.floor(hsh(i, 11) * 3), spin: (hsh(i, 13) - 0.5) * 12 };
});
// The plume: a few huge billows give the shape, mid billows fill, small ones fray the edges.
const PUFFS = [];
for (let i = 0; i < 8; i++) PUFFS.push({ s: 0.8 + 0.2 * hsh(i, 1), u: (i / 7 * 2 - 1) * 0.9 + (hsh(i, 2) - 0.5) * 0.15, r: 20 + 9 * hsh(i, 3), big: 1 });
for (let i = 0; i < 30; i++) { const s = 0.15 + 0.8 * hsh(i, 4); PUFFS.push({ s, u: (hsh(i, 5) * 2 - 1) * 0.85, r: 7 + 4 * s + 5 * hsh(i, 6) }); }
for (let i = 0; i < 24; i++) { const s = 0.1 + 0.95 * hsh(i, 7); PUFFS.push({ s, u: (i % 2 ? 1 : -1) * (0.85 + 0.25 * hsh(i, 8)), r: 3 + 4 * hsh(i, 9) }); }
PUFFS.forEach((P, i) => { P.phase = hsh(i, 34) * TAU; P.d = 0.28 * (1 - P.s) + 0.15 * hsh(i, 35); });
const SURGE = Array.from({ length: 26 }, (_, i) => ({
  vx: (i % 2 ? 1 : -1) * (55 + 225 * hsh(i, 1)), r: 4 + 7 * hsh(i, 3), delay: 0.04 + 0.12 * hsh(i, 4), phase: hsh(i, 6) * TAU, d: 0.05 + 0.3 * hsh(i, 5)
}));
// Pre-rasterized opaque cells: 0 rim, 1 shadow, 2 body, 3 light, 4 glint, 5 crease, 6 speck.
const PUFF_PIXELS = Array.from({ length: 33 }, (_, r) => {
  const cells = [];
  for (let y = -r - 1; y <= r + 1; y++) for (let x = -r - 1; x <= r + 1; x++) {
    const d = x * x + y * y;
    if (d > (r + 1) ** 2) continue;
    let band = 0;
    if (d <= r * r) {
      band = x * 0.45 + y > r * 0.38 ? 1 : 2;
      if ((x + r * 0.2) ** 2 + (y + r * 0.5) ** 2 < (r * 0.62) ** 2) band = 3;
      if (r >= 12 && (x + r * 0.35) ** 2 + (y + r * 0.62) ** 2 < (r * 0.2) ** 2) band = 4;
      if (r >= 10 && band <= 2) {   // a fold: an inner arc that splits the billow into lobes
        const c = Math.hypot(x - r * 0.3, y - r * 0.05) - r * (0.55 + 0.1 * hsh(r, 7));
        if (Math.abs(c) < 0.6 && y < r * 0.55 && x < r * 0.5) band = 5;
      }
      if (r >= 7 && band <= 2 && hsh(x * 31 + y * 17 + r * 7, 5) > 0.965) band = 6;   // grit in the dust
    }
    cells.push([x, y, band]);
  }
  return cells;
});
function puff(p, x, y, radius, P, cool, rim) {
  const r = Math.min(32, Math.round(radius));
  if (r < 1) return;
  x = Math.round(x); y = Math.round(y);
  for (const [dx, dy, band] of PUFF_PIXELS[r]) {
    if (rim ? false : band === 0) continue;
    const xx = x + dx, yy = y + dy;
    if (xx < -59 || xx > 298 || yy > 0 || yy < -234) continue;
    const c = rim ? P[0] : band >= 5 ? P[band === 5 ? 0 : 1] : P[cool ? Math.max(1, band - 1) : band];
    p.put(p.cellX(xx, yy), p.cellY(xx, yy), c, 1);
  }
}
// the lit lotus inside the dust: how close a point is to it (0..1), used to warm the billows it shines through
export const reveal = (t) => smooth(GHOST[0], GHOST[0] + 0.35, t) * (1 - smooth(INHALE[0] + 0.25, INHALE[0] + 0.6, t));
const litAt = (x, y, g) => g <= 0 ? 0 : g * Math.max(0, 1 - Math.hypot((x - TX) / 46, (y + 68) / 44));
// Each billow is pulled up a twisting column into the eye: higher ones first. Returns null once swallowed.
function inhale(t, x, y, r, phase, d) {
  const k = clamp((t - INHALE[0] - d) / 0.5);
  if (k <= 0) return [x, y, r];
  if (k >= 1) return null;
  const e = k * k, top = EC[1] + 26, f = Math.sin(phase + e * 7) * 16 * (1 - e) * Math.min(1, k * 4);
  return [x + (TX - x) * Math.min(1, e * 1.6) + f, y + (top - y) * e, r * (1 - 0.8 * e)];
}
const RAYS = Array.from({ length: 9 }, (_, i) => { const q = i * TAU / 9; return [Math.cos(q), Math.sin(q), 28 + 18 * hsh(i, 30)]; });
const SHAPE = [[-1, -0.35], [-0.25, -1], [0.8, -0.65], [1, 0.4], [-0.5, 0.8]];
const STREAK = Array.from({ length: 7 }, (_, i) => ({ x: (i - 3) * 4.5 + (hsh(i, 50) - 0.5) * 3, h: 0.5 + 0.4 * hsh(i, 51), c: i % 2 ? 1 : 3 }));

function plume(p, t) {
  const raw = t - BOOM;
  if (raw < 0.02 || t > INHALE[1] + 0.1) return;
  const tq = BOOM + Math.floor(raw * 15) / 15, a = tq - BOOM;   // 15 fps poses: pixel animation, no alpha fade
  const rise = out3(clamp(a / 0.6)), H = 10 + 100 * rise, g = reveal(tq);
  const poses = [];
  for (const P of PUFFS) {
    let x = TX + P.u * (6 + H * P.s * 0.66) + Math.sin(a * 1.3 + P.phase) * (1 + 2 * P.s);
    let y = -H * P.s - Math.min(a, 1.5) * 3 * P.s, r = P.r * (0.35 + 0.65 * rise) * (1 + 0.08 * Math.min(a, 1.5));
    if (P.s > 0.72) {   // the crown rolls: out, over and down
      const th = a * 1.9 + P.phase, side = Math.sign(P.u) || 1;
      x += side * (Math.cos(th) * 4 + Math.min(a, 1.4) * 9 * P.s); y += Math.sin(th) * 3.5 + Math.min(a, 1.4) * 5 * Math.max(0, Math.abs(P.u) - 0.5);
    }
    const q = inhale(tq, x, y, r, P.phase, P.d);
    if (q) poses.push({ x: q[0], y: q[1], r: q[2], lift: tq > INHALE[0] + P.d });
  }
  poses.sort((a, b) => a.y - b.y);
  const pal = (P) => { const w = litAt(P.x, P.y, g); return w > 0.55 ? HOT : w > 0.15 ? WARM : P.y < -H * 0.55 || P.lift ? ASHP : EARTH; };
  for (const P of poses) puff(p, P.x, P.y, P.r, pal(P), false, 1);
  for (const P of poses) puff(p, P.x, P.y, P.r, pal(P), false, 0);
  // earth jets straight up the stem in the first beat
  if (a < 1.0) for (const S of STREAK) {
    const len = H * S.h * (a < 0.6 ? 1 : 1 - (a - 0.6) / 0.4);
    if (len > 2) p.line(TX + S.x, -3, TX + S.x * 1.4, -3 - len, EARTH[S.c], 1);
  }
  // grains fraying off the edges
  if (a < INHALE[0] - BOOM) for (let i = 0; i < 40; i++) {
    const P = poses[(i * 7) % poses.length];
    if (!P || P.r < 6) continue;
    const ph = (a * 1.2 + hsh(i, 60)) % 1, ang = hsh(i, 61) * TAU;
    const x = P.x + Math.cos(ang) * (P.r + 1 + ph * 9), y = P.y + Math.sin(ang) * (P.r + 1 + ph * 9) + ph * 4;
    if (ph < 0.8 && y < -1) p.dot(x, y, (litAt(x, y, g) > 0.3 ? WARM : ASHP)[ph < 0.4 ? 3 : 2], 1);
  }
}
function groundDust(p, t) {
  const tq = BOOM + Math.floor((t - BOOM) * 15) / 15, a = tq - BOOM;
  const poses = [];
  for (const P of SURGE) {
    const b = a - P.delay;
    if (b < 0) continue;
    const r = P.r * (0.5 + 0.5 * out3(clamp(b / 0.35)));
    const x = TX + P.vx * (1 - Math.exp(-1.7 * b)) / 1.7, y = -r - 1 - (1 + Math.sin(b * 3 + P.phase)) * 1.5;
    const q = inhale(tq, x, y, r, P.phase, P.d);
    if (q) poses.push({ x: q[0], y: q[1], r: q[2] });
  }
  poses.sort((a, b) => a.y - b.y);
  for (const P of poses) puff(p, P.x, P.y, P.r, EARTH, false, 1);
  for (const P of poses) puff(p, P.x, P.y, P.r, EARTH, false, 0);
}

export function blast(p, t, layer) {
  const a = t - BOOM;
  if (a < 0 || t > INHALE[1] + 0.6) return;
  if (layer === 'back') {   // the crater: a hot core cooling under a dark rim
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
  if (a > 0.12 && t < INHALE[0] + 0.5) {   // ground veil, pulled away with the rest
    const k = 1 - smooth(INHALE[0], INHALE[0] + 0.5, t), r = (35 + 85 * out3(clamp(a))) * k;
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
  plume(p, t);
  groundDust(p, t);
  if (a < 0.095) for (const [dx, dy, len] of RAYS) {
    const r = len * (0.75 + a * 3);
    p.poly([[TX + dx * 10 - dy * 2, LC[1] + dy * 10 + dx * 2], [TX + dx * r, LC[1] + dy * r], [TX + dx * 10 + dy * 2, LC[1] + dy * 10 - dx * 2]], L[5]);
  }
  if (a < 0.095) p.disc(LC[0], LC[1], 12 * (1 - a / 0.095), L[6], 1);
  for (const [i, R] of ROCKS.entries()) {
    const b = Math.min(a, R.land), after = Math.max(0, a - R.land), hop = Math.min(after, R.bounce);
    let x = TX + R.vx * (b + hop * 0.25), y = a < R.land ? -4 + R.vy * b + 260 * b * b : -260 * hop * (R.bounce - hop);
    const q = inhale(t, x, y, R.s, i, 0.1 + 0.3 * hsh(i, 14));   // the rubble goes up too
    if (!q) continue;
    x = q[0]; y = q[1];
    const s = q[2], angle = R.spin * (b + hop) + Math.max(0, t - INHALE[0]) * 9, cs = Math.cos(angle), sn = Math.sin(angle);
    const pts = SHAPE.map(([u, v]) => [x + (u * cs - v * sn) * s, y - s + (u * sn + v * cs) * s]);
    if (s > 3 && a < R.land) {
      const vy = R.vy + 520 * b;
      p.line(x - R.vx * 0.055, y - s - vy * 0.055, x - R.vx * 0.015, y - s - vy * 0.015, DUST[2]);
    }
    p.poly(pts, DUST[R.c]);
    p.poly([pts[0], pts[1], pts[2], [x, y - s]], DUST[R.c + 1]);
  }
}
