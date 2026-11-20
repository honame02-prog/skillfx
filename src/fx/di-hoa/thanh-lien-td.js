// Thanh Lien Dia Tam Hoa, top-down for Tien Son (3/4 view, 2.5 s, centred on the target's feet). Draft v1.
// Script: design/tienson/07-thanh-lien-topdown.md. Petal = the approved v3 lotus petal (style B, tip flame) of
// di-hoa/thanh-lien.js, recoloured to the Tien Son 'moc' ramp. Floor shapes squashed 0.5 vertically, standing shapes not.
// Everything is mirror-symmetric about the body axis x = AX: angle sets are closed under a -> PI - a, and every
// per-element random value is keyed by a mirror-invariant key (pk) so a pair gets the same numbers.
// options.part = 'all' | 'floor' | 'back' | 'front' picks one layer for atlas export (tools/phaser-atlas.mjs --opts).
import { clamp, smooth, TAU, fit } from '../../core/index.js';
import { hash } from './_cold-lib.js';

// v5 (Opus): the approved jade ramp of the side-view Thanh Lien (ultimate/_lotus-lib.js FLAMES[0]), not grass 'moc'.
export const JADE_HEX = ['#031d29', '#07545b', '#0c9b88', '#24d9a1', '#7afbc6', '#caffed', '#ffffff'];
export const MOC_HEX = JADE_HEX;   // legacy name kept for older tools
const C = fit(JADE_HEX, 7);
const END = 2.5, DROP = 0.1, LAND = 0.3, BUD = 0.7, BEATS = [0.98, 1.16], OPEN = 1.2, FULL = 1.48, GATHER = 1.46, ERUPT = 1.72;
const MELT = 0.14, COLH = 114, POOL_R = 46, SQ = 0.5, GRAV = 150;
export const AX = 0;
const out3 = (u) => 1 - (1 - u) ** 3, sm = (u) => u * u * (3 - 2 * u), inv = (u) => clamp(u);
const fr = (t) => Math.floor(t * 30);
const pk = (a) => Math.round(Math.abs(Math.cos(a)) * 97) * 211 + Math.round(Math.sin(a) * 97);   // same for a and PI - a
const onFloor = (a, r) => [AX + Math.cos(a) * r, Math.sin(a) * r * SQ];
const mx = (x) => Math.floor(Math.abs(x - AX));   // mirror-invariant pixel column

export const meta = {
  name: 'Thanh Lien Dia Tam Hoa (top-down)',
  desc: 'A seed ignites an earth-heart fire pond. A lotus bud beats twice, cups the target in three rings of petals, then melts into an erupting column crowned by flame.',
  tags: ['tienson', 'top-down', 'di-hoa', 'fire', 'area', 'ultimate', 'one-shot'],
  size: [224, 200], origin: [112, 146], duration: END, loop: false, fps: 30, bg: 'ground', actor: 2,
  options: { seed: 3, part: 'all' },
};

function dot(p, x, y, c) {
  const q = Math.floor(Math.abs(x - AX));
  if (Math.abs(x - AX) < 1e-6) { p.dot(AX - 1, y, c); p.dot(AX, y, c); }
  else p.dot(AX + (x < AX ? -q - 1 : q), y, c);
}
function line(p, x0, y0, x1, y1, c) {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    dot(p, x0 + (x1 - x0) * u, Math.round((y0 + (y1 - y0) * u) * 1e8) / 1e8, c);
  }
}
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
// Standing elements exactly on the target's plane belong in front; retain the petal seam tolerance.
const standingLayer = (floorY) => Math.abs(floorY) <= 1e-3 ? 'front' : layerOf(floorY);

// ---------------------------------------------------------------- cupped Nelumbo petals, approved style B
// Solid, curved colour fields do the modelling; ordered pixels are confined to a narrow colour seam.
// side canonicalises the cross-section so the rolled lip, veins and heat flow mirror with each petal.
// Snap the canonical direction before pk: cos(60 deg)*97 can straddle the rounding tie at 48.5.
const petalKey = (a) => pk(Math.atan2(Math.round(Math.sin(a) * 1e6), Math.round(Math.abs(Math.cos(a)) * 1e6)));
function soft(v, x, y) {
  v = clamp(v, 0, 6);
  const i = Math.floor(v), f = clamp((v - i - 0.5) * 3 + 0.5);
  return C[Math.min(6, f > BAYER[(Math.floor(y) & 3) * 4 + (mx(x) & 3)] ? i + 1 : i)];
}
function burnField(x, y, seed) {
  const X = mx(x) / 4, Y = y / 4, ix = Math.floor(X), iy = Math.floor(Y);
  const u = sm(X - ix), v = sm(Y - iy);
  const a = hash(ix, iy, seed) * (1 - u) + hash(ix + 1, iy, seed) * u;
  const b = hash(ix, iy + 1, seed) * (1 - u) + hash(ix + 1, iy + 1, seed) * u;
  return a * (1 - v) + b * v;
}
function lotusPetal(p, bx, by, tx, ty, W, t, seed, { dim = 0, melt = 0, face = 'in', side = 1, bud = false } = {}) {
  const dx = tx - bx, dy = ty - by, L = Math.hypot(dx, dy);
  if (L < 2 || melt >= 1) return;
  const ux = dx / L, uy = dy / L, nx = -uy * (side || 1), ny = ux * (side || 1);
  // Elliptic shoulders, a fleshy narrow attachment, and a short subacute tip, rather than a spear.
  // v5: plump, rounded shoulders and a blunt tip (style B), not a faceted spear.
  const M = 0.52, hw = (u) => W * 0.5 * (u < M
    ? 0.24 + 0.76 * Math.sqrt(Math.max(0, 1 - ((M - u) / M) ** 2))
    : Math.pow(Math.max(0, 1 - ((u - M) / (1 - M)) ** 2), 0.62));
  const pad = W * 0.65 + 2;
  p.shade(Math.min(bx, tx) - pad, Math.min(by, ty) - pad, Math.max(bx, tx) + pad, Math.max(by, ty) + pad, (x, y, o) => {
    if (side * (x - AX) < 0) return;   // paired shells meet at the axis without draw-order colour bias
    const ex = (side === 0 ? Math.abs(x - AX) : x) - bx, ey = y - by, u = (ex * ux + ey * uy) / L;
    if (u < 0 || u > 1) return;
    const w = hw(u), bow = W * 0.08 * Math.sin(Math.PI * u);
    const s = (ex * nx + ey * ny - bow) / Math.max(0.5, w), as = Math.abs(s);
    if (as > 1) return;
    if (melt > 0) {   // same 0.14 s burn-through: stationary holes with white-hot margins
      const n = burnField(x, y, seed) * 0.7 + (as * 0.5 + Math.abs(u - 0.5)) * 0.6;
      if (n < melt * 1.3 - 0.05) return;
      if (n < melt * 1.3 + 0.025) { o.c = C[6]; o.a = 1; return; }
    }
    const long = smooth(0.12, 1, u), belly = Math.sin(Math.PI * u);
    // Broad curved value fields: the root is the light source, the rolled rim is the only pale strip.
    // v5 (Opus): every transition is a smooth field. Translucent glow from the root and the centre line,
    // edges and tip sink into deep jade; the rolled lip is a soft bright crescent with a soft fold beneath.
    let tn = 4.75 - 1.45 * long - 1.05 * as ** 2.2 - dim;
    tn += 0.55 * Math.exp(-((s / 0.30) ** 2)) * smooth(0.05, 0.5, u) * (1 - long * 0.6);   // inner glow along the midrib
    if (face === 'in') {
      const lip = 0.80 - 0.28 * belly;
      const lipPx = (s - lip) * w;
      const on = smooth(0.2, 0.34, u) * (1 - smooth(0.9, 0.98, u));
      const rim = Math.exp(-((lipPx / 1.0) ** 2)) * on;
      tn += (5.2 - dim * 0.35 - tn) * rim;                        // soft 1 px core-lit rim on both faces
      tn -= 1.05 * Math.exp(-(((lipPx + 1.9) / 1.2) ** 2)) * on;    // cupped hollow under the lip
    } else {
      tn += 0.75 * Math.exp(-(((s + 0.22) / 0.55) ** 2)) * belly;     // rounded back catches the core light
      tn -= 0.85 * smooth(0.35, 1, s) * belly;                        // far flank turns away
      if (bud) {
        tn = 2.0 + 2.45 * (1 - as ** 1.4) + 0.5 * u - dim * 0.4;
        // Two overlapping shells expose their joins, rather than outlining the bud.
        const seam = 0.36 + 0.16 * Math.sin(u * Math.PI);
        if (Math.abs(as - seam) * w < 0.8 && u > 0.16 && u < 0.87) tn = 1.8;
      }
    }
    tn += 0.14 * Math.sin(u * 9 - t * 9 + seed) * belly;             // slow heat shimmer flowing to the tip
    // sparse living sparkles inside the bright body (approved style B), mirror-safe
    if (!bud && !melt && tn > 3.6 && hash(mx(x), Math.floor(y), (fr(t) >> 1) + seed) > 0.975) { o.c = C[6]; o.a = 1; return; }
    o.c = soft(clamp(tn, 1.1, 5.8) + melt * 0.35, x, y); o.a = 1;
  });
}
function contactShadow(p, P, t) {
  if (!P.ring || t < OPEN + 0.12) return;
  const dx = P.tx - P.bx, dy = P.ty - P.by, L = Math.hypot(dx, dy);
  if (L < 2) return;
  const side = Math.abs(Math.cos(P.a)) < 1e-6 ? 0 : Math.cos(P.a) >= 0 ? 1 : -1;
  const inside = (x, y) => {
    const ex = (side === 0 ? Math.abs(x) : x) - P.bx, ey = y - P.by;
    const u = (ex * dx + ey * dy) / (L * L);
    if (u < 0.15 || u > 0.94) return false;
    const w = P.W * 0.5 * (u < 0.57 ? 0.16 + 0.84 * Math.sqrt(Math.max(0, 1 - ((0.57 - u) / 0.57) ** 2)) : Math.pow(Math.max(0, 1 - ((u - 0.57) / 0.43) ** 2), 0.85));
    return Math.abs((ex * -dy + ey * dx) / L * (side || 1) - P.W * 0.08 * Math.sin(Math.PI * u)) < w;
  };
  p.shade(Math.min(P.bx, P.tx) - P.W, Math.min(P.by, P.ty) - P.W, Math.max(P.bx, P.tx) + P.W, Math.max(P.by, P.ty) + P.W, (x, y, o) => {
    if (side * x < 0 || !p.get(x, y)) return;
    if (inside(x, y - 1.5) && !inside(x, y)) { o.c = C[1]; o.a = 1; }
  });
}
function bodyFire(p, P, t) {
  const dx = P.tx - P.bx, dy = P.ty - P.by, L = Math.hypot(dx, dy);
  if (L < 2) return;
  for (let j = 0; j < 3; j++) {
    const u = 0.53 + j * 0.14, w = P.W * 0.46 * Math.sqrt(Math.max(0, 1 - ((u - 0.57) / 0.43) ** 2));
    const side = Math.cos(P.a) >= 0 ? 1 : -1;
    const x = P.bx + dx * u + -dy / L * w * side, y = P.by + dy * u + dx / L * w * side;
    const h = 2 + Math.floor(hash(P.seed, j, fr(t)) * 3);
    for (let k = 0; k < h; k++) {
      dot(p, x, y - k, C[k < 1 ? 4 : 3]);
      if (Math.abs(Math.cos(P.a)) < 1e-6) dot(p, -x, y - k, C[k < 1 ? 4 : 3]);
    }
  }
}
// Each flame is sampled as a shape, so subpixel endpoints cannot move a mirror partner by one pixel.
function tipFlame(p, x, y, t, seed, h = 7) {
  const side = Math.abs(x - AX) < 1e-6 ? 0 : x < AX ? -1 : 1, hgt = h + 1.0 * Math.sin(t * 13 + seed);
  p.shade(x - 3, y - hgt - 1, x + 3, y + 1, (xx, yy, o) => {
    const f = (y - yy) / hgt;
    if (f < 0 || f > 1) return;
    const sway = side * 1.2 * Math.sin(t * 9 - f * 3 + seed) * f;
    if (Math.abs(xx - x - sway) > 1.3 * (1 - f) ** 0.8 + 0.15) return;
    o.c = C[f < 0.25 ? 5 : f < 0.66 ? 4 : 3]; o.a = 1;
  });
}
// Raised petals are less compressed than the floor. Roots share the pale receptacle; staggered rings
// open outside-in. All petals use the same square-root projection normalisation, on both hemispheres.
const SQP = 0.70;
const RINGS = [
  { n: 8, off: TAU / 16, r: 8, L: 34, W: 22, th: 1.25 },
  { n: 8, off: 0, r: 5.5, L: 28, W: 19, th: 0.95 },
  { n: 4, off: TAU / 8, r: 3, L: 20, W: 15, th: 0.60 },
];
export function layout(t) {
  const rise = sm(inv((t - BUD) / (OPEN - BUD - 0.05))), open = sm(inv((t - OPEN) / (FULL - OPEN)));
  const squeeze = 1 - 0.15 * smooth(GATHER, ERUPT, t), list = [];
  RINGS.forEach((R, ring) => {
    const ringOpen = sm(clamp(open * 1.5 - ring * 0.25)), sq = ring === 2 ? squeeze : 1;
    for (let i = 0; i < R.n; i++) {
      const a = i * TAU / R.n + R.off, ca = Math.round(Math.cos(a) * 1e9) / 1e9, sa = Math.round(Math.sin(a) * 1e9) / 1e9;
      const o = ringOpen;
      const th = (-0.06 + (R.th + 0.06) * o) * sq;
      const L = ([30, 35, 38][ring] * (1 - o) + R.L * o) * rise;
      const [bx, by] = onFloor(a, R.r * (0.7 + 0.3 * rise));
      const hz = Math.sin(th) * L, vx = ca * hz, vy = sa * hz * SQP - Math.cos(th) * L;
      // A closed bud converges into an ovoid crown. At bloom, its petals have broad shoulders,
      // but the foreshortened near petals keep the same length/width proportion as the side petals.
      const projected = Math.hypot(vx, vy) / Math.max(1, L);
      const k = Math.sqrt(1 / Math.max(1e-6, projected));
      const W = R.W * (0.48 + 0.52 * rise) * (0.72 + 0.28 * o) * Math.min(1, projected * k);
      list.push({ ring, a, th, L, width3D: R.W, open: o, height3D: Math.cos(th) * L,
        bx, by, tx: bx + vx * k, ty: by + vy * k, W,
        seed: ring * 13 + (petalKey(a) % 17) });
    }
  });
  return list.sort((A, B) => A.ring - B.ring || A.by - B.by);
}
function lotus(p, t, layer) {
  if (t < BUD) return;
  const melt = inv((t - ERUPT) / MELT);
  if (melt >= 1) return;
  const dim = -0.12 * beat(t);
  const bud = t < OPEN + 0.14;
  for (const P of layout(t)) {
    if (layerOf(P.by) !== layer) continue;
    // Translucent jade: the core lights the rolled rim through either face, without a front/back switch.
    const face = bud ? 'out' : 'in';
    contactShadow(p, P, t);
    lotusPetal(p, P.bx, P.by, P.tx, P.ty, P.W, t, P.seed, {
      dim: dim + [1.0, 0.45, 0][P.ring],
      melt, face, bud, side: Math.abs(Math.cos(P.a)) < 1e-6 ? 0 : Math.cos(P.a) >= 0 ? 1 : -1,
    });
    if (!melt && P.ring < 2 && t > BUD + 0.15) {
      bodyFire(p, P, t);
      tipFlame(p, P.tx, P.ty, t, P.seed, P.ring ? 5 : 7);
    }
  }
}

// ---------------------------------------------------------------- floor: pond, roots, rings, pod, splats
function pond(p, t, seed) {
  if (t < LAND) return;
  const rx = Math.max(3, POOL_R * out3(inv((t - LAND) / 0.45))), ry = rx * SQ;
  const cool = smooth(ERUPT + 0.25, ERUPT + 0.6, t), erode = smooth(2.15, END, t);
  const glow = 1.5 * beat(t) + 1.1 * smooth(GATHER, ERUPT, t) * (t < ERUPT + 0.2 ? 1 : 0) + (t >= ERUPT && t < ERUPT + 0.07 ? 3 : 0);
  p.shade(AX - rx * 1.14 - 1, -ry * 1.14 - 1, AX + rx * 1.14 + 1, ry * 1.14 + 1, (x, y, o) => {
    const dx = x - AX, e = Math.hypot(dx / rx, y / ry);
    if (e > 1.13) return;
    // Cooling and erosion follow broad warped plates, rather than isolated pixel cells.
    const ax = mx(x), px = ax + 1.7 * Math.sin(y * 0.22), py = y + 1.5 * Math.sin(ax * 0.19);
    const n = hash(Math.floor(px / 9), Math.floor((py + 40) / 6), seed);
    if (n < erode * 1.02) return;
    if (e > 1) { if (n > 0.4) { o.c = C[0]; o.a = 1; } return; }       // scorched lip of dark rock
    if (e > 0.9) { o.c = cool > 0.5 ? C[1] : e > 0.96 ? C[2] : t >= FULL ? C[2] : C[4]; o.a = 1; return; }
    if (cool > 0) {   // cooling: dark crust plates split by glowing veins
      const vein = Math.min(Math.abs(Math.sin(px * 0.24 + Math.sin(py * 0.18) * 0.6)),
        Math.abs(Math.sin(py * 0.34 + Math.sin(px * 0.17) * 0.7)));
      if (hash(Math.floor(px / 9), Math.floor((py + 40) / 6), seed + 1) < cool * 1.1) {
        o.c = vein < 0.075 ? C[2 + (cool < 0.7 ? 1 : 0)] : C[1]; o.a = 1; return;
      }
    }
    const flow = Math.sin(e * 15 - t * 9) * 0.55 + (hash(ax >> 1, Math.floor((y + t * 6) / 2), seed + 2) - 0.5) * 0.8;
    let tn = 2.3 - 1.6 * smooth(OPEN, FULL, t) + 1.7 * (1 - e) ** 0.7 + flow + glow * (1 - 0.65 * smooth(OPEN, FULL, t)) * (1 - e * 0.6);
    if (cool === 0 && ax > 2 && hash(ax, Math.floor(y / 2), seed + 3) > 0.96) tn = 1;
    o.c = tone(tn, x, y); o.a = 1;
  });
}
const ROOTS = Array.from({ length: 12 }, (_, i) => {
  // Angles 15 + 30i deg: no axis root. PI-a pairs have indices (5-i) mod 12.
  const a = i * TAU / 12 + TAU / 24, j = (5 - i + 12) % 12, k = Math.min(i, j), sg = i === k ? 1 : -1;
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
      line(p, x0, y0, x1, y1, flash ? (s < 3 ? C[6] : C[4]) : cool > 0.5 ? C[1] : s === n && u < 1 ? C[5] : s > 3 ? C[2] : C[3]);
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
    // Radial falloff on the squashed floor ellipse; sparse edge pixels merge into the pond.
    const edge = smooth(0.78, 1, e);
    if (edge > BAYER[(Math.floor(y) & 3) * 4 + (mx(x) & 3)]) return;
    const cup = 4.8 - 2.5 * e ** 1.5 + 0.35 * beat(t) * (1 - e);
    o.c = soft(cup, x, y); o.a = 1;
  });
}

// ---------------------------------------------------------------- the seed falling on the axis
function seed(p, t) {
  if (t < DROP || t >= LAND + 0.02) return;
  const u = inv((t - DROP) / (LAND - DROP)), y = -128 + 128 * u * u;
  for (let k = 1; k <= 22; k++) { const yy = y - k * (1 + 3 * u); if (yy < -meta.origin[1]) continue; dot(p, AX, yy, C[k < 5 ? 5 : k < 12 ? 4 : 3]); if (k < 8) { dot(p, AX - 1, yy, C[3]); dot(p, AX + 1, yy, C[3]); } }
  // Analytic diamond avoids edge-tie bias in the polygon rasteriser on this tiny axial seed.
  p.shade(AX - 2, y - 4, AX + 2, y + 1, (x, yy, o) => {
    const v = yy - y + 4, w = v < 3 ? v * 2 / 3 : 5 - v;
    if (v >= 0 && v <= 5 && Math.abs(x - AX) <= w) { o.c = C[6]; o.a = 1; }
  });
}
const DROPS = Array.from({ length: 10 }, (_, j) => { const a = (j >> 1) * TAU / 5 * 0.5 + 0.35, sx = j & 1 ? -1 : 1; return { vx: sx * Math.cos(a) * (40 + 30 * hash(j >> 1, 7)), vy: -(60 + 40 * hash(j >> 1, 8)), fy: Math.sin(a) * 10 * (j >> 1 & 1 ? 1 : -1) }; });
function splash(p, t, layer) {
  const d = t - LAND;
  if (d < 0 || d > 0.4) return;
  for (const D of DROPS) {
    if (layerOf(D.fy) !== layer) continue;
    const x = AX + D.vx * d, y = D.fy * d * 3 + D.vy * d + 0.5 * 400 * d * d;
    if (y > D.fy * d * 3) continue;
    dot(p, x, y, C[d < 0.12 ? 6 : 5]); dot(p, x, y + 1, C[3]);
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
    if (standingLayer(y0) !== layer) continue;
    line(p, x1, y1 - z, x0, y0 - z, C[4]); dot(p, x0, y0 - z, C[6]);
  }
}

// ---------------------------------------------------------------- the earth-heart column
function column(p, t, layer) {
  const d = t - ERUPT;
  if (d < 0 || d > 0.62) return;
  // v7 (Opus): a broad, continuous jade jet. Rise 0-0.10 with a pointed white head (no cap), hold,
  // then 0.33-0.62 the foot lifts off the ground and the jet thins as it flies up and dies.
  const H = COLH * out3(inv(d / 0.10)), u = smooth(0.33, 0.62, d), white = d < 0.08;
  const Ht = H, lift = COLH * 0.8 * u * u;
  const jet = p;
  // Flame tongues have real floor anchors around the jet; their height never decides the layer.
  for (let i = 0; i < 12; i++) {
    const a = i * TAU / 12 + TAU / 24, [fx, fy] = onFloor(a, 9 * (1 - u));
    if (standingLayer(fy) !== layer) continue;
    const k = petalKey(a), z = Ht * (0.3 + 0.55 * hash(k, 14));
    tipFlame(jet, fx * (1.2 + 0.2 * Math.sin(t * 19 + k)), fy - z, t, k,
      (7 + 6 * hash(k, 15)) * (1 - u));
  }
  // v7: the jet is drawn in BOTH layers - solid behind the target, shell + rising streaks in front.
  const front = layer === 'front';
  jet.shade(AX - 28, -Ht - 4, AX + 28, 2, (x, y, o) => {
    const h = -y, dx = mx(x) + 0.5;   // mirror-safe distance: pixel columns -1 and 0 are a pair
    if (h < lift - 1 || h > Ht + 1) return;
    const hn = h / Math.max(1, Ht);
    // smooth taper 11 -> 7 half-width, flared foot, pointed head; edge tongues travel upward fast
    let w = (11 - 4 * hn) * (1 - 0.55 * u);
    if (h - lift < 14) w += 5 * (1 - (h - lift) / 14) ** 2 * (1 - u);
    w += 1.4 * Math.sin((h + t * 130) * 0.33) * (0.6 + 0.4 * hn) + 0.8 * Math.sin((h + t * 95) * 0.71 + 1.3);
    if (h > Ht - 14) w *= Math.sqrt(Math.max(0, (Ht + 1 - h) / 15));
    if (h < lift + 6 && u > 0) w *= (h - lift + 1) / 7;                 // the lifted foot closes into a flame tail
    const r = dx / Math.max(0.6, w);
    if (r > 1) return;
    // bright streaks sliding up inside the jet (mirror-safe per column)
    const streak = Math.sin((h - t * 170) / 3.2 + hash(mx(x), 0, 77) * 6.283) > 0.72;
    // front layer: solid shell at the sides, only rising streaks across the body -> target stands inside the fire
    // v7b: the jet is SOLID in front of the target too (user: the skill must be in front, never hollow).
    const core = dx < (white ? 3.5 : 2.2) * (1 - 0.6 * u);
    o.c = core ? C[6] : tone(Math.min(5.6, 5.25 - 2.7 * r * r + (streak ? 0.9 : 0) - 1.6 * u), x, y);
    o.a = 1;
  });
}
// the lotus of flame that opens on the column top
const CROWN = Array.from({ length: 8 }, (_, i) => i * TAU / 8 + TAU / 16);
const CR_TOP = -COLH;
function crown(p, t, layer) {
  // v7 (Opus): a real crown lotus, two rings, ~44 px wide, opening on the jet head after it arrives.
  const d = t - ERUPT - 0.09;
  if (d < 0) return;
  const open = sm(inv(d / 0.18)), melt = inv((d - 0.34) / (MELT * 0.5));   // quick burn: no lingering hole pattern
  if (melt >= 1) return;
  const rings = [
    { as: CROWN, L: 22, W: 15, th: 0.35 + 0.95 * open, r: 4, dim: 0.5 },
    { as: [0, TAU / 4, TAU / 2, TAU * 3 / 4], L: 15, W: 12, th: 0.15 + 0.5 * open, r: 2, dim: 0 },
  ];
  for (const R of rings) for (const a of [...R.as].sort((A, B) => Math.sin(A) - Math.sin(B))) {
    if (standingLayer(Math.sin(a) * 3) !== layer) continue;
    const L = R.L * (0.45 + 0.55 * open), bx = AX + Math.cos(a) * R.r, by = CR_TOP + Math.sin(a) * R.r * SQ, hz = Math.sin(R.th) * L;
    lotusPetal(p, bx, by, bx + Math.cos(a) * hz, by + Math.sin(a) * hz * SQP - Math.cos(R.th) * L,
      R.W * (0.75 + 0.25 * open), t, 40 + (petalKey(a) % 11),
      { side: Math.abs(Math.cos(a)) < 1e-6 ? 0 : Math.cos(a) >= 0 ? 1 : -1, melt, dim: R.dim, face: 'in' });
    if (!melt && R.r > 3 && open > 0.6) tipFlame(p, bx + Math.cos(a) * hz, by + Math.sin(a) * hz * SQP - Math.cos(R.th) * L, t, petalKey(a), 5);
  }
}

// ---------------------------------------------------------------- embers, splatter, petal sparks
// screen-space ballistic sparks; all lists built as mirror pairs (even j = right, odd j = left, same numbers)
const pair = (n, fn) => Array.from({ length: n }, (_, j) => fn(j >> 1, j & 1 ? -1 : 1, j));
const RISE = pair(28, (k, sx) => ({ x: sx * (1 + 7 * hash(k, 31)), fy: (k % 2 ? -1 : 1) * (2 + 5 * hash(k, 36)), t0: ERUPT + 0.05 + 0.5 * hash(k, 32), v: 60 + 50 * hash(k, 33), ph: hash(k, 34) * 6, sx }));
function rising(p, t, layer) {
  for (const S of RISE) {
    if (standingLayer(S.fy) !== layer) continue;
    const d = t - S.t0;
    if (d < 0 || d > 0.55) continue;
    const y = S.fy - 20 - S.v * d - 30 * hash(Math.abs(S.x), 35), x = AX + S.x * (1 + d * 2.5) + S.sx * Math.sin(t * 7 + S.ph) * 1.5;
    if (y < -150) continue;
    dot(p, x, y, C[d < 0.3 ? 6 : 4]); dot(p, x, y + 1, C[3]);
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
      if (landed && hash(B.k, 44) > erode) { line(p, X - 1, F, X + 1, F, cool > 0.5 ? C[1] : C[4]); dot(p, X, F - 1, cool > 0.5 ? C[0] : C[3]); }
      continue;
    }
    if (landed || standingLayer(F) !== layer) continue;
    dot(p, X, F - z, C[6]); dot(p, X + (B.vx > 0 ? 1 : -1), F - z, C[5]); dot(p, X, F - z + 1, C[4]);
  }
}
function petalSparks(p, t, layer) {   // petals burst into sparks flying the way they pointed
  const d = t - ERUPT;
  if (d < 0 || d > 0.5) return;
  for (const P of layout(ERUPT - 0.001)) {
    for (let q = 0; q < 3; q++) {
      const s = 50 + 40 * hash(petalKey(P.a), q, P.ring), vz = 40 + 30 * hash(petalKey(P.a), q + 5, P.ring);
      const x = P.tx + Math.cos(P.a) * s * d, y = P.ty + Math.sin(P.a) * s * SQ * d - vz * d + 0.5 * GRAV * d * d;
      const floorY = P.by + Math.sin(P.a) * (Math.sin(P.th) * P.L + s * d) * SQ;
      if (standingLayer(floorY) !== layer) continue;
      if (hash(petalKey(P.a), q, fr(t)) < d * 2) continue;
      dot(p, x, y, C[d < 0.15 ? 6 : 5]);
    }
  }
}
function crownRain(p, t, layer) {
  const d = t - ERUPT - 0.36;
  if (d < 0 || d > 0.5) return;
  for (const a of CROWN) for (let q = 0; q < 2; q++) {
    const s = 30 + 25 * hash(pk(a), q, 51), x = AX + Math.cos(a) * (12 + s * d), y = CR_TOP - 6 + Math.sin(a) * s * SQ * d + 0.5 * 220 * d * d - 20 * d;
    if (standingLayer(Math.sin(a) * (12 + s * d) * SQ) !== layer) continue;
    if (hash(pk(a), q, fr(t)) < d * 1.8) continue;
    dot(p, x, y, C[d < 0.2 ? 6 : 4]); dot(p, x, y - 1, C[3]);
  }
}

const want = (o, part) => { const q = o?.part ?? 'all'; return q === 'all' || q === part; };
export function drawBack(p, t, o) {
  if (t >= END) return;
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
  if (t >= END) return;
  if (!want(o, 'front')) return;
  rays(p, t, 'front'); lotus(p, t, 'front'); column(p, t, 'front');
  crown(p, t, 'front'); petalSparks(p, t, 'front'); splatter(p, t, 'front'); rising(p, t, 'front'); crownRain(p, t, 'front');
  splash(p, t, 'front'); seed(p, t);
}
