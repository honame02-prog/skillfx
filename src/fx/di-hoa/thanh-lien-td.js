// Thanh Lien Dia Tam Hoa, top-down for Tien Son (3/4 view, 2.5 s, centred on the target's feet). Draft v1.
// Script: design/tienson/07-thanh-lien-topdown.md. Petal = the approved v3 lotus petal (style B, tip flame) of
// di-hoa/thanh-lien.js, recoloured to the Tien Son 'moc' ramp. Floor shapes squashed 0.5 vertically, standing shapes not.
// Everything is mirror-symmetric about the body axis x = AX: angle sets are closed under a -> PI - a, and every
// per-element random value is keyed by a mirror-invariant key (pk) so a pair gets the same numbers.
// options.part = 'all' | 'floor' | 'back' | 'front' picks one layer for atlas export (tools/phaser-atlas.mjs --opts).
import { clamp, smooth, TAU, fit } from '../../core/index.js';
import { hash } from './_cold-lib.js';

export const MOC_HEX = ['#1a413c', '#127a4a', '#1fb85e', '#5cf08a', '#b4ffc0', '#ecfff0', '#ffffff'];
const C = fit(MOC_HEX, 7);
const END = 2.5, DROP = 0.1, LAND = 0.3, BUD = 0.7, BEATS = [0.98, 1.16], OPEN = 1.2, FULL = 1.48, GATHER = 1.46, ERUPT = 1.72;
const MELT = 0.14, COLH = 114, POOL_R = 46, SQ = 0.5, GRAV = 150;
export const AX = 0;
const out3 = (u) => 1 - (1 - u) ** 3, sm = (u) => u * u * (3 - 2 * u), inv = (u) => clamp(u);
const fr = (t) => Math.floor(t * 30);
const pk = (a) => Math.round(Math.abs(Math.cos(a)) * 97) * 211 + Math.round(Math.sin(a) * 97);   // same for a and PI - a
const onFloor = (a, r) => [AX + Math.cos(a) * r, Math.sin(a) * r * SQ];
const mx = (x) => Math.floor(Math.abs(x - AX + 0.5));   // mirror-invariant pixel column

export const meta = {
  name: 'Thanh Lien Dia Tam Hoa (top-down)',
  desc: 'A fire lotus seed drops into the ground, a pond of earth-heart fire spreads, a lotus bud rises and beats twice, blooms round the target, then a volcano column erupts through it crowned by a lotus of flame.',
  tags: ['tienson', 'top-down', 'di-hoa', 'fire', 'area', 'ultimate', 'one-shot'],
  size: [224, 200], origin: [112, 146], duration: END, loop: false, fps: 30, bg: 'ground', actor: 2,
  options: { seed: 3, part: 'all' },
};

// ---------------------------------------------------------------- shared
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
function tone(v, x, y) {   // continuous position on the ramp, narrow dithered seam between flat steps
  v = clamp(v, 0, 6);
  const i = Math.floor(v), f = clamp((v - i - 0.5) * 2.4 + 0.5);
  return C[Math.min(6, f > BAYER[(Math.floor(y) & 3) * 4 + (mx(x) & 3)] ? i + 1 : i)];
}
function beat(t) {
  let k = 0;
  for (const b of BEATS) k = Math.max(k, Math.exp(-(((t - b) / 0.05) ** 2)));
  return k;
}
const layerOf = (floorY) => (floorY > 1e-3 ? 'front' : 'back');   // sin(PI) = 1.2e-16 must not count as front

// ---------------------------------------------------------------- cupped Nelumbo petals, approved style B
// Solid, curved colour fields do the modelling; ordered pixels are confined to a narrow colour seam.
// side canonicalises the cross-section so the rolled lip, veins and heat flow mirror with each petal.
// Snap the canonical direction before pk: cos(60 deg)*97 can straddle the rounding tie at 48.5.
const petalKey = (a) => pk(Math.atan2(Math.round(Math.sin(a) * 1e6), Math.round(Math.abs(Math.cos(a)) * 1e6)));
function soft(v, x, y) {
  v = clamp(v, 0, 6);
  const i = Math.floor(v), f = clamp((v - i - 0.5) * 5 + 0.5);
  return C[Math.min(6, f > BAYER[(Math.floor(y) & 3) * 4 + (mx(x - 0.5) & 3)] ? i + 1 : i)];
}
function lotusPetal(p, bx, by, tx, ty, W, t, seed, { dim = 0, melt = 0, face = 'in', side = 1 } = {}) {
  const dx = tx - bx, dy = ty - by, L = Math.hypot(dx, dy);
  if (L < 2 || melt >= 1) return;
  const ux = dx / L, uy = dy / L, nx = -uy * side, ny = ux * side;
  // Elliptic shoulders, a fleshy narrow attachment, and a short subacute tip, rather than a spear.
  const M = 0.57, hw = (u) => W * 0.5 * (u < M
    ? 0.16 + 0.84 * Math.sqrt(Math.max(0, 1 - ((M - u) / M) ** 2))
    : Math.pow(Math.max(0, 1 - ((u - M) / (1 - M)) ** 2), 0.85));
  const pad = W * 0.65 + 2;
  p.shade(Math.min(bx, tx) - pad, Math.min(by, ty) - pad, Math.max(bx, tx) + pad, Math.max(by, ty) + pad, (x, y, o) => {
    if (side * (x - AX) < 0) return;   // paired shells meet at the axis without draw-order colour bias
    const ex = x - bx, ey = y - by, u = (ex * ux + ey * uy) / L;
    if (u < 0 || u > 1) return;
    const w = hw(u), bow = W * 0.08 * Math.sin(Math.PI * u);
    const s = (ex * nx + ey * ny - bow) / Math.max(0.5, w), as = Math.abs(s);
    if (as > 1) return;
    if (melt > 0) {   // same 0.14 s burn-through: stationary holes with white-hot margins
      const n = hash(mx(x - 0.5) >> 1, Math.floor(y / 2), seed) * 0.7 + (as * 0.5 + Math.abs(u - 0.5)) * 0.6;
      if (n < melt * 1.3 - 0.05) return;
      if (n < melt * 1.3 + 0.12) { o.c = C[6]; o.a = 1; return; }
    }
    const long = smooth(0.07, 1, u), belly = Math.sin(Math.PI * u);
    let tn = 5.0 - 1.85 * long - 0.65 * as ** 2 - dim;
    if (face === 'in') {
      // A crescent of inner face rolls over the far rim; its shadow is inside, never an outline.
      const lip = 0.85 - 0.42 * Math.sin(Math.PI * smooth(0.1, 1, u));
      const fold = Math.exp(-(((s - lip + 0.13) / 0.16) ** 2)) * belly;
      tn -= 0.72 * fold;
      tn += 1.2 * smooth(lip - 0.04, lip + 0.18, s) * belly;
      tn += 0.25 * Math.exp(-(((s + 0.18) / 0.48) ** 2)) * belly;
    } else {
      // Closed bud: a rounded back, with a soft lateral seam where the next shell overlaps.
      tn += 0.55 * Math.exp(-(((s + 0.25) / 0.5) ** 2)) * belly;
      tn -= 0.35 * smooth(0.5, 1, s) * belly;
    }
    // Two quiet, converging veins. No all-over checkerboard or granular noise.
    const vein = Math.min(Math.abs(s + 0.30), Math.abs(s - 0.14));
    if (u > 0.18 && u < 0.82) tn += 0.20 * Math.exp(-((vein / 0.055) ** 2)) * belly;
    tn += 0.12 * Math.sin(u * 8 - t * 5 + seed) * belly;
    o.c = soft(clamp(tn, 2.0, 5.6) + melt * 2, x, y); o.a = 1;
  });
}
// Each flame is sampled as a shape, so subpixel endpoints cannot move a mirror partner by one pixel.
function tipFlame(p, x, y, t, seed, h = 7) {
  const side = x < AX ? -1 : 1, hgt = h + 1.8 * Math.sin(t * 13 + seed);
  p.shade(x - 3, y - hgt - 1, x + 3, y + 1, (xx, yy, o) => {
    const f = (y - yy) / hgt;
    if (f < 0 || f > 1) return;
    const sway = side * 1.2 * Math.sin(t * 9 - f * 3 + seed) * f;
    if (Math.abs(xx - x - sway) > 1.3 * (1 - f) ** 0.8 + 0.15) return;
    o.c = C[f < 0.25 ? 5 : f < 0.66 ? 4 : 3]; o.a = 1;
  });
}
// Raised petals are less compressed than the floor. Roots share the pale receptacle; staggered rings
// open outside-in. Front-facing petals narrow with their projected length, preserving an elliptic profile.
const SQP = 0.70;
const RINGS = [
  { n: 8, off: TAU / 16, r: 8, L: 40, W: 22, th: 1.32 },
  { n: 6, off: 0, r: 5.5, L: 35, W: 20, th: 0.90 },
  { n: 4, off: TAU / 8, r: 3, L: 30, W: 16.5, th: 0.43 },
];
export function layout(t) {
  const rise = sm(inv((t - BUD) / (OPEN - BUD - 0.05))), open = sm(inv((t - OPEN) / (FULL - OPEN)));
  const squeeze = 1 - 0.15 * smooth(GATHER, ERUPT, t), list = [];
  RINGS.forEach((R, ring) => {
    const o = sm(clamp(open * 1.5 - ring * 0.25)), sq = ring === 2 ? squeeze : 1;
    for (let i = 0; i < R.n; i++) {
      const a = i * TAU / R.n + R.off, ca = Math.cos(a), sa = Math.sin(a);
      const th = (-0.06 + (R.th + 0.06) * o) * sq;
      const L = ([30, 35, 38][ring] * (1 - o) + R.L * o) * rise;
      const [bx, by] = onFloor(a, R.r * (0.7 + 0.3 * rise));
      const hz = Math.sin(th) * L, vx = ca * hz, vy = sa * hz * SQP - Math.cos(th) * L;
      // A closed bud converges into an ovoid crown. At bloom, its petals have broad shoulders,
      // but the foreshortened near petals keep the same length/width proportion as the side petals.
      const projected = Math.hypot(vx, vy) / Math.max(1, L);
      const k = Math.sqrt(1 / Math.max(1e-6, projected));
      const W = R.W * (0.48 + 0.52 * rise) * (0.72 + 0.28 * o) * Math.min(1, projected * k);
      list.push({ ring, a, th, bx, by, tx: bx + vx * k, ty: by + vy * k, W,
        seed: ring * 13 + (petalKey(a) % 17) });
    }
  });
  return list.sort((A, B) => A.ring - B.ring || A.by - B.by);
}
function lotus(p, t, layer) {
  if (t < BUD) return;
  const melt = inv((t - ERUPT) / MELT);
  if (melt >= 1) return;
  const dim = 0.18 - 0.45 * beat(t) - 0.38 * smooth(GATHER, ERUPT, t);
  for (const P of layout(t)) {
    if (layerOf(P.by) !== layer) continue;
    const face = Math.sin(P.a) < -0.2 || P.th > 0.6 ? 'in' : 'out';
    lotusPetal(p, P.bx, P.by, P.tx, P.ty, P.W, t, P.seed, {
      dim: dim + [0.35, 0.12, 0][P.ring] + (1 - smooth(OPEN, FULL, t)) * [0.45, 0.2, 0][P.ring] + (layer === 'back' ? 0.22 : 0),
      melt, face, side: Math.cos(P.a) >= 0 ? 1 : -1,
    });
    if (!melt && P.ring < 2 && t > BUD + 0.15) tipFlame(p, P.tx, P.ty, t, P.seed, P.ring ? 5.5 : 4.5);
  }
}

// ---------------------------------------------------------------- floor: pond, roots, rings, pod, splats
function pond(p, t, seed) {
  if (t < LAND) return;
  const rx = Math.max(3, POOL_R * out3(inv((t - LAND) / 0.45))), ry = rx * SQ;
  const cool = smooth(ERUPT + 0.25, ERUPT + 0.6, t), erode = smooth(2.15, END, t);
  const glow = 1.5 * beat(t) + 2 * smooth(GATHER, ERUPT, t) * (t < ERUPT + 0.2 ? 1 : 0) + (t >= ERUPT && t < ERUPT + 0.07 ? 3 : 0);
  p.shade(AX - rx * 1.14 - 1, -ry * 1.14 - 1, AX + rx * 1.14 + 1, ry * 1.14 + 1, (x, y, o) => {
    const dx = x - AX, e = Math.hypot(dx / rx, y / ry);
    if (e > 1.13) return;
    const n = hash(mx(x), Math.floor(y), seed);
    if (n < erode * 1.02) { if (e < 1 && n > 0.88 && erode < 0.97) { o.c = C[0]; o.a = 1; } return; }
    if (e > 1) { if (n > 0.4) { o.c = C[0]; o.a = 1; } return; }       // scorched lip of dark rock
    if (e > 0.9) { o.c = cool > 0.5 ? C[1] : e > 0.96 ? C[2] : C[4]; o.a = 1; return; }
    const ax = mx(x);
    if (cool > 0) {   // cooling: dark crust plates split by glowing veins
      const vein = Math.abs(Math.sin(ax * 0.55 + Math.sin(y * 1.3) * 1.4) * Math.sin(y * 1.05 + Math.sin(ax * 0.8)));
      if (hash(ax >> 2, Math.floor(y / 2), seed + 1) < cool * 1.1) { o.c = vein < 0.1 ? C[2 + (cool < 0.7 ? 1 : 0)] : C[0]; o.a = 1; return; }
    }
    const flow = Math.sin(e * 15 - t * 9) * 0.55 + (hash(ax >> 1, Math.floor((y + t * 6) / 2), seed + 2) - 0.5) * 0.8;
    let tn = 2.3 + 1.7 * (1 - e) ** 0.7 + flow + glow * (1 - e * 0.6);
    if (ax > 2 && hash(ax, Math.floor(y / 2), seed + 3) > 0.96) tn = 1;  // floating crust specks (single pixels, none on the axis)
    o.c = tone(tn, x, y); o.a = 1;
  });
}
const ROOTS = Array.from({ length: 12 }, (_, i) => {
  // angles 15 + 30i deg: none on the axis (an axis root reads as a crosshair); mirror of i is 11 - i
  const a = i * TAU / 12 + TAU / 24, j = 11 - i, k = Math.min(i, j), sg = i === k ? 1 : -1;
  const pts = Array.from({ length: 7 }, (_, s) => onFloor(a + (s ? sg * (hash(k, s, 4) - 0.5) * 0.3 : 0), POOL_R * (0.92 + 0.6 * s / 6 * (0.75 + 0.4 * hash(k, 5)))));
  return { a, pts, grow: LAND + 0.15 + hash(k, 6) * 0.1 };
});
function roots(p, t, seed) {
  const cool = smooth(ERUPT + 0.3, ERUPT + 0.6, t), erode = smooth(2.1, END, t), flash = beat(t) > 0.5 || (t >= ERUPT && t < ERUPT + 0.1);
  for (const K of ROOTS) {
    const u = inv((t - K.grow) / 0.3);
    if (u <= 0) continue;
    const n = Math.max(1, Math.round(u * 6));
    for (let s = 1; s <= n; s++) {
      if (hash(pk(K.a), s + 20, seed) < erode) continue;
      const [x0, y0] = K.pts[s - 1], [x1, y1] = K.pts[s];
      p.line(x0, y0, x1, y1, flash ? (s < 3 ? C[6] : C[4]) : cool > 0.5 ? C[1] : s === n && u < 1 ? C[5] : s > 3 ? C[2] : C[3]);
    }
  }
}
function ring(p, t, t0, r0, r1, dur, w, hot = 6) {
  const d = t - t0;
  if (d < 0 || d > dur) return;
  const r = r0 + (r1 - r0) * out3(d / dur), f = fr(t), fade = d / dur;
  p.shade(AX - r - 2, -r * SQ - 2, AX + r + 2, r * SQ + 2, (x, y, o) => {
    const e = Math.hypot((x - AX) / r, y / (r * SQ)) * r;
    if (Math.abs(e - r) > w || hash(mx(x), Math.floor(y), f) < fade * 0.9) return;
    o.c = C[fade < 0.3 ? hot : fade < 0.6 ? hot - 1 : hot - 3]; o.a = 1;
  });
}
function pod(p, t) {   // continuous, shallow fleshy receptacle joining every petal root
  if (t < BUD || t >= ERUPT) return;
  const g = sm(inv((t - BUD) / 0.2)), rx = 12 * g, ry = rx * SQ, hot = beat(t) + smooth(GATHER, ERUPT, t);
  if (rx < 1) return;
  p.shade(AX - rx, -ry, AX + rx, ry, (x, y, o) => {
    const e = Math.hypot((x - AX) / rx, y / ry);
    if (e > 1) return;
    const cup = 4.9 - 1.5 * e ** 2 + 0.3 * (-y / ry) + 0.8 * hot;
    o.c = soft(cup, x, y); o.a = 1;
  });
}

// ---------------------------------------------------------------- the seed falling on the axis
function seed(p, t) {
  if (t < DROP || t >= LAND + 0.02) return;
  const u = inv((t - DROP) / (LAND - DROP)), y = -128 + 128 * u * u;
  for (let k = 1; k <= 22; k++) { const yy = y - k * (1 + 3 * u); p.dot(AX, yy, C[k < 5 ? 5 : k < 12 ? 4 : 3]); if (k < 8) { p.dot(AX - 1, yy, C[3]); p.dot(AX + 1, yy, C[3]); } }
  p.poly([[AX, y - 4], [AX + 2, y - 1], [AX, y + 1], [AX - 2, y - 1]], C[6]);
}
const DROPS = Array.from({ length: 10 }, (_, j) => { const a = (j >> 1) * TAU / 5 * 0.5 + 0.35, sx = j & 1 ? -1 : 1; return { vx: sx * Math.cos(a) * (40 + 30 * hash(j >> 1, 7)), vy: -(60 + 40 * hash(j >> 1, 8)), fy: Math.sin(a) * 10 * (j >> 1 & 1 ? 1 : -1) }; });
function splash(p, t, layer) {
  const d = t - LAND;
  if (d < 0 || d > 0.4) return;
  for (const D of DROPS) {
    if (layerOf(D.fy) !== layer) continue;
    const x = AX + D.vx * d, y = D.fy * d * 3 + D.vy * d + 0.5 * 400 * d * d;
    if (y > D.fy * d * 3) continue;
    p.dot(x, y, C[d < 0.12 ? 6 : 5]); p.dot(x, y + 1, C[3]);
  }
}

// ---------------------------------------------------------------- gather: rays of light sucked into the pod
const RAYS = Array.from({ length: 16 }, (_, i) => ({ a: (i % 8) * TAU / 8 + TAU / 16, dl: (i >> 3) * 0.1 }));
function rays(p, t, layer) {
  for (const R of RAYS) {
    const u = inv((t - GATHER - R.dl - hash(pk(R.a), 9) * 0.04) / 0.18);
    if (u <= 0 || u >= 1) continue;
    const r0 = 96 * (1 - u * u) + 6, r1 = r0 + 10 + 10 * u;
    const [x0, y0] = onFloor(R.a, r0), [x1, y1] = onFloor(R.a, r1), z = 10 * (1 - u);
    if (layerOf(y0) !== layer) continue;
    p.line(x1, y1 - z, x0, y0 - z, C[4]); p.dot(x0, y0 - z, C[6]);
  }
}

// ---------------------------------------------------------------- the earth-heart column
function column(p, t, layer) {
  const d = t - ERUPT;
  if (d < 0 || d > 0.62) return;
  const H = COLH * out3(inv(d / 0.07)), u = smooth(0.32, 0.6, d), white = d < 0.07;
  const Ht = H * (1 - 0.35 * u);
  p.shade(AX - 26, -Ht - 14, AX + 26, 2, (x, y, o) => {
    const h = -y, dx = Math.abs(x - AX + 0.5);
    let w = (8.5 + 2 * Math.sin(h * 0.17 - t * 31) + 1.2 * Math.sin(h * 0.41 + t * 23)) * (1 - 0.85 * u);
    if (h < 16) w += 10 * (1 - h / 16) ** 2 * (1 - u);                  // flared foot where it bursts from the pod
    if (h > Ht - 14) w *= 1 + 0.5 * Math.sin(Math.PI * clamp((h - Ht + 14) / 14));
    if (h > Ht) { const c = (h - Ht) / Math.max(1, w * 0.8); if (c >= 1) return; w *= Math.sqrt(1 - c * c); }
    if (h < -1) return;
    const r = dx / Math.max(0.6, w), n = hash(mx(x), Math.floor((y + t * 150) / 3), 7);
    if (r > 1) { if (r < 1.45 && n > 0.74 - 0.2 * (1 - u)) { o.c = C[3]; o.a = 1; } return; }
    if (layer === 'front' && !white && r < 0.72 + 0.1 * Math.sin(h * 0.3 - t * 20)) return;   // the target shows burning inside
    const tn = white ? 6 : 6.2 - r * r * 3.4 + (n - 0.5) * 1.3 - u * 2.4;
    o.c = tone(tn, x, y); o.a = 1;
  });
}
// the lotus of flame that opens on the column top
const CROWN = Array.from({ length: 8 }, (_, i) => i * TAU / 8 + TAU / 16);
const CR_TOP = -COLH;
function crown(p, t, layer) {
  const d = t - ERUPT - 0.06;
  if (d < 0) return;
  const open = sm(inv(d / 0.16)), melt = inv((d - 0.3) / MELT);
  if (melt >= 1) return;
  for (const a of [...CROWN].sort((A, B) => Math.sin(A) - Math.sin(B))) {
    if (layerOf(Math.sin(a)) !== layer) continue;
    const th = 0.2 + 1.0 * open, L = 16 * (0.4 + 0.6 * open), [bx, by] = [AX + Math.cos(a) * 3, CR_TOP + Math.sin(a) * 1.5], hz = Math.sin(th) * L;
    lotusPetal(p, bx, by, bx + Math.cos(a) * hz, by + Math.sin(a) * hz * SQ - Math.cos(th) * L, 11 * (0.7 + 0.3 * Math.abs(Math.cos(a))), t, 40 + (petalKey(a) % 11), { side: Math.cos(a) >= 0 ? 1 : -1, melt, dim: layer === 'back' ? 0.4 : -0.3, face: open > 0.5 ? 'in' : 'out' });
  }
}

// ---------------------------------------------------------------- embers, splatter, petal sparks
// screen-space ballistic sparks; all lists built as mirror pairs (even j = right, odd j = left, same numbers)
const pair = (n, fn) => Array.from({ length: n }, (_, j) => fn(j >> 1, j & 1 ? -1 : 1, j));
const RISE = pair(28, (k, sx) => ({ x: sx * (1 + 7 * hash(k, 31)), t0: ERUPT + 0.05 + 0.5 * hash(k, 32), v: 60 + 50 * hash(k, 33), ph: hash(k, 34) * 6, sx, front: k % 2 === 0 }));
function rising(p, t, layer) {
  for (const S of RISE) {
    if (S.front !== (layer === 'front')) continue;
    const d = t - S.t0;
    if (d < 0 || d > 0.55) continue;
    const y = -20 - S.v * d - 30 * hash(Math.abs(S.x), 35), x = AX + S.x * (1 + d * 2.5) + S.sx * Math.sin(t * 7 + S.ph) * 1.5;
    if (y < -150) continue;
    p.dot(x, y, C[d < 0.3 ? 6 : 4]); p.dot(x, y + 1, C[3]);
  }
}
const BLOBS = pair(12, (k, sx) => { const a = (k * 0.5 + 0.2), s = 55 + 40 * hash(k, 41); return { vx: sx * Math.cos(a) * s, fv: Math.sin(a) * (k % 2 ? 1 : -1) * s * SQ, vz: 90 + 60 * hash(k, 42), z0: 30 + 50 * hash(k, 43), k }; });
function blobAt(B, d) {
  const tl = (B.vz + Math.sqrt(B.vz * B.vz + 2 * GRAV * 2 * B.z0)) / (2 * GRAV), dd = Math.min(d, tl);
  const z = Math.max(0, B.z0 + B.vz * dd - GRAV * dd * dd);
  return { X: AX + B.vx * dd, F: B.fv * dd, z, landed: d >= tl };
}
function splatter(p, t, layer) {
  const d = t - ERUPT;
  if (d < 0) return;
  const cool = smooth(0.5, 0.75, d), erode = smooth(2.1, END, t);
  for (const B of BLOBS) {
    const { X, F, z, landed } = blobAt(B, d);
    if (layer === 'floor') {
      if (landed && hash(B.k, 44) > erode) { p.line(X - 1, F, X + 1, F, cool > 0.5 ? C[1] : C[4]); p.dot(X, F - 1, cool > 0.5 ? C[0] : C[3]); }
      continue;
    }
    if (landed || layerOf(F) !== layer) continue;
    p.dot(X, F - z, C[6]); p.dot(X + (B.vx > 0 ? 1 : -1), F - z, C[5]); p.dot(X, F - z + 1, C[4]);
  }
}
function petalSparks(p, t, layer) {   // petals burst into sparks flying the way they pointed
  const d = t - ERUPT;
  if (d < 0 || d > 0.5) return;
  for (const P of layout(ERUPT - 0.001)) {
    if (layerOf(P.by) !== layer) continue;
    for (let q = 0; q < 3; q++) {
      const s = 50 + 40 * hash(pk(P.a), q, P.ring), vz = 40 + 30 * hash(pk(P.a), q + 5, P.ring);
      const x = P.tx + Math.cos(P.a) * s * d, y = P.ty + Math.sin(P.a) * s * SQ * d - vz * d + 0.5 * GRAV * d * d;
      if (hash(pk(P.a), q, fr(t)) < d * 2) continue;
      p.dot(x, y, C[d < 0.15 ? 6 : 5]);
    }
  }
}
function crownRain(p, t, layer) {
  const d = t - ERUPT - 0.36;
  if (d < 0 || d > 0.5) return;
  for (const a of CROWN) for (let q = 0; q < 2; q++) {
    if (layerOf(Math.sin(a) + 0.001) !== layer) continue;
    const s = 30 + 25 * hash(pk(a), q, 51), x = AX + Math.cos(a) * (12 + s * d), y = CR_TOP - 6 + Math.sin(a) * s * SQ * d + 0.5 * 220 * d * d - 20 * d;
    if (hash(pk(a), q, fr(t)) < d * 1.8) continue;
    p.dot(x, y, C[d < 0.2 ? 6 : 4]); p.dot(x, y - 1, C[3]);
  }
}

const want = (o, part) => { const q = o?.part ?? 'all'; return q === 'all' || q === part; };
export function drawBack(p, t, o) {
  if (want(o, 'floor')) {
    const sd = o?.seed ?? 3;
    pond(p, t, sd); roots(p, t, sd);
    ring(p, t, LAND, 4, 40, 0.35, 1.2);
    for (const b of BEATS) ring(p, t, b, POOL_R * 0.6, POOL_R + 26, 0.3, 1.1, 5);
    ring(p, t, ERUPT, 16, 104, 0.42, 2);
    pod(p, t); splatter(p, t, 'floor');
  }
  if (want(o, 'back')) {
    rays(p, t, 'back'); lotus(p, t, 'back'); column(p, t, 'back');
    crown(p, t, 'back'); petalSparks(p, t, 'back'); splatter(p, t, 'back'); rising(p, t, 'back'); crownRain(p, t, 'back'); splash(p, t, 'back');
  }
}
export function draw(p, t, o) {
  if (!want(o, 'front')) return;
  rays(p, t, 'front'); lotus(p, t, 'front'); column(p, t, 'front');
  crown(p, t, 'front'); petalSparks(p, t, 'front'); splatter(p, t, 'front'); rising(p, t, 'front'); crownRain(p, t, 'front');
  splash(p, t, 'front'); seed(p, t);
}
