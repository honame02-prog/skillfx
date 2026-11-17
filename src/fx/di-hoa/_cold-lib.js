// Materials for Di Hoa 2, Cot Linh Lanh Hoa (cold fire). Script: design/di-hoa/02-cot-linh-lanh-hoa.md.
//   coldFlame: a live tongue of cold fire along a path (it may hang DOWN): pale core, bone-white body, ice-blue edge that
//              breaks up into drifting mist instead of a hard outline.
//   iceFlame:  the same tongue frozen: flat-cut facets lit from the upper left, a bright rim on the lit side, a dark rim
//              on the shadow side, a faint line of fire still trapped in the core, and an optional sweeping glint.
// Both take pts = [[x, y], ...] from base to tip (3+ points; a smooth curve is sampled from them) and a base half-width W.
import { clamp, smooth, WHITE, hex, fit } from '../../core/index.js';

export const COLD = ['#0b1224', '#1d3557', '#3f6f9e', '#7fb2d9', '#c4e1f0', '#efece2', '#ffffff'];
export const coldRamp = (o) => fit(o?.palette ?? COLD, 7);

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
export const hash = (x, y, s = 0) => { const h = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return h - Math.floor(h); };
const pick = (C, x, sx, sy) => {   // dithered position on the 7-step ramp; narrow dither seams between flat steps
  x = clamp(x, 0, 6);
  const i = Math.floor(x), f = clamp((x - i - 0.5) * 2.4 + 0.5);
  return C[Math.min(6, f > BAYER[(sy & 3) * 4 + (sx & 3)] ? i + 1 : i)];
};

// sample a quadratic-ish smooth curve through the control points (Catmull-Rom), N segments
export function curve(pts, N = 10) {
  const P = (i) => pts[Math.max(0, Math.min(pts.length - 1, i))], out = [];
  for (let s = 0; s <= N; s++) {
    const f = (s / N) * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), u = f - i;
    const [a, b, c, d] = [P(i - 1), P(i), P(i + 1), P(i + 2)], u2 = u * u, u3 = u2 * u;
    out.push([0, 1].map((k) => 0.5 * (2 * b[k] + (-a[k] + c[k]) * u + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * u2 + (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * u3)));
  }
  return out;
}
// nearest point on a polyline: u along it 0..1, signed distance d (+ = left of travel), segment direction
function along(path, len, x, y) {
  let best = Infinity, U = 0, D = 0, acc = 0, dir = [0, -1];
  for (let i = 0; i < path.length - 1; i++) {
    const [ax, ay] = path[i], [bx, by] = path[i + 1], ex = bx - ax, ey = by - ay, l2 = ex * ex + ey * ey || 1, l = Math.sqrt(l2);
    const s = clamp(((x - ax) * ex + (y - ay) * ey) / l2), px = ax + ex * s - x, py = ay + ey * s - y, d2 = px * px + py * py;
    if (d2 < best) { best = d2; U = (acc + s * l) / len; D = ((x - ax) * ey - (y - ay) * ex) / l; dir = [ex / l, ey / l]; }
    acc += l;
  }
  return { u: U, d: D, dir };
}
const lengthOf = (path) => path.reduce((s, p, i) => i ? s + Math.hypot(p[0] - path[i - 1][0], p[1] - path[i - 1][1]) : 0, 0);
const box = (path, pad) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of path) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return [x0 - pad, y0 - pad, x1 + pad, y1 + pad];
};
// tongue width: full at the base, swelling slightly, then a long taper to a fine tip
const width = (W, u) => W * (0.75 + 0.25 * Math.sin(Math.PI * Math.min(1, u * 2.2))) * Math.pow(1 - u, 0.85);

export function coldFlame(p, C, pts, W, t, seed = 0, { k = 1, mist = 1, dim = 0 } = {}) {
  if (k <= 0 || W < 0.3) return;
  const path = curve(pts), len = lengthOf(path);
  if (len < 1.5) return;
  const [x0, y0, x1, y1] = box(path, W + 3);
  p.shade(x0, y0, x1, y1, (x, y, o) => {
    const { u, d } = along(path, len, x, y);
    if (u <= 0 && Math.abs(d) > W) return;
    const w = Math.max(0.4, width(W, u)), r = Math.abs(d) / w;
    // the mist: past the edge, a few pixels drift off along the flow; inside the outer quarter the body thins to nothing
    const n = hash(Math.floor(x), Math.floor(y - t * 26), seed);
    if (r > 1) {
      if (r < 1.45 && mist > 0 && n > 0.86 - 0.1 * u) { o.c = C[3 + (n > 0.95 ? 1 : 0)]; o.a = k * 0.55 * mist; }
      return;
    }
    if (r > 0.72 && n < (r - 0.72) * 2.6 * (0.6 + 0.6 * u)) return;
    // the tip forks into two prongs that waver
    const fork = smooth(0.62, 0.9, u) * (0.32 + 0.12 * Math.sin(t * 8 + seed));
    if (r < fork) return;
    // streaks running down the flow, so it reads as moving fire and not a white stroke
    const streak = 0.75 * Math.sin(d * 1.25 + u * 5 - t * 9 + seed) * Math.sin(u * 3.1 - t * 3.7 + seed * 2);
    const rr = fork > 0 ? (r - fork) / (1 - fork) : r;
    o.c = pick(C, 5.7 - 2.9 * Math.pow(rr, 1.25) - 1.9 * u + streak * (0.4 + 0.6 * rr) - dim, x, y);
    o.a = k;
  });
}

export function iceFlame(p, C, pts, W, seed = 0, { k = 1, glint = -1, dim = 0, crack = 0 } = {}) {
  if (k <= 0 || W < 0.3) return;
  const path = curve(pts), len = lengthOf(path);
  if (len < 1.5) return;
  const [x0, y0, x1, y1] = box(path, W + 2);
  const facet = Math.max(4, len / 5);   // facet length along the tongue
  p.shade(x0, y0, x1, y1, (x, y, o) => {
    const { u, d, dir } = along(path, len, x, y);
    if (u <= 0 && Math.abs(d) > W) return;
    const w = Math.max(0.4, width(W, u) * 1.08), r = Math.abs(d) / w;
    if (r > 1) return;
    // which side faces the light (upper left): the side normal is (dir.y, -dir.x) for d > 0
    const nx = d > 0 ? dir[1] : -dir[1], ny = d > 0 ? -dir[0] : dir[0], lit = -(nx * 0.7 + ny * 0.7);
    const edge = (1 - r) * w;
    if (edge < 1) { o.c = lit > 0.1 ? C[6] : C[1]; o.a = k; return; }   // rims: bright on the lit side, dark in shadow
    // flat facets: steps along the length, split across the axis, each with its own slight tilt
    const fu = (u * len) / facet, fi = Math.floor(fu), half = d > 0 ? 1 : 0, tilt = hash(fi, half, seed) - 0.5;
    let tone = 3.6 + lit * 1.1 + tilt * 1.7 - 0.6 * u - dim;
    if (fu - fi < 0.12 && r < 0.9) tone += lit > 0 ? 1.2 : -1.2;   // the seam between two cut faces
    if (r < 0.22 && u < 0.85) tone = 5.3 - dim;                     // fire trapped in the core
    if (crack > 0 && Math.abs(Math.sin(fi * 2.1 + seed) * w * 0.6 - d) < 0.6 && hash(fi, 7, seed) < crack) tone = 6;
    if (glint >= 0) { const g = (x + y * 0.6) - glint; if (g > 0 && g < 2) tone = 6.5; }
    o.c = pick(C, tone, x, y);
    o.a = k;
  });
}

// Cap the material at the actual tip: nearest-segment distance alone otherwise extends
// the last pixel-wide filament beyond the centreline. The approved material is unchanged.
export function tipCapped(p, pts) {
  const tip = pts[pts.length - 1], prev = pts[pts.length - 2];
  const dx = tip[0] - prev[0], dy = tip[1] - prev[1], len = Math.hypot(dx, dy) || 1;
  const out = Object.create(p);
  out.shade = (x0, y0, x1, y1, fn) => p.shade(x0, y0, x1, y1, (x, y, o) => {
    if (((x - tip[0]) * dx + (y - tip[1]) * dy) / len > 0.6) return;
    return fn(x, y, o);
  });
  return out;
}

// The held statue never moves. Bake the expensive curve-distance/facet shader once;
// retain the shader's exact crack thresholds and apply its moving glint when painting.
export function bakeIceFlame(C, pts, W, seed = 0, { dim = 0 } = {}) {
  const pixels = [], path = curve(pts), len = lengthOf(path), facet = Math.max(4, len / 5);
  const capture = {
    shade(x0, y0, x1, y1, fn) {
      const o = {};
      for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) {
        o.c = 0; o.a = 1;
        fn(x + 0.5, y + 0.5, o);
        if (!o.c) continue;
        const { u, d } = along(path, len, x + 0.5, y + 0.5);
        const w = Math.max(0.4, width(W, u) * 1.08), interior = w - Math.abs(d) >= 1;
        const fi = Math.floor(u * len / facet);
        const cracked = interior && Math.abs(Math.sin(fi * 2.1 + seed) * w * 0.6 - d) < 0.6;
        pixels.push({ x, y, c: o.c, interior, threshold: cracked ? hash(fi, 7, seed) : 2 });
      }
    },
  };
  iceFlame(tipCapped(capture, pts), C, pts, W, seed, { dim });
  return (p, { k = 1, glint = -1, crack = 0 } = {}) => {
    for (const q of pixels) {
      const g = q.x + 0.5 + (q.y + 0.5) * 0.6 - glint;
      const bright = q.interior && glint >= 0 && g > 0 && g < 2;
      p.dot(q.x, q.y, bright || crack > q.threshold ? C[6] : q.c, k);
    }
  };
}

// Same live material and ten-segment curve; prepare segment invariants once,
// rather than allocating nearest-point results and recomputing lengths per pixel.
export function fastColdFlame(p, C, pts, W, t, seed = 0, { k = 1, mist = 1, dim = 0 } = {}) {
  if (k <= 0 || W < 0.3) return;
  const path = curve(pts), len = lengthOf(path);
  if (len < 1.5) return;
  const segments = [];
  let acc = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const [ax, ay] = path[i], [bx, by] = path[i + 1];
    const ex = bx - ax, ey = by - ay, l2 = ex * ex + ey * ey || 1, l = Math.sqrt(l2);
    segments.push({ ax, ay, ex, ey, l2, l, acc });
    acc += l;
  }
  const [x0, y0, x1, y1] = box(path, W + 3);
  const forkWave = 0.32 + 0.12 * Math.sin(t * 8 + seed);
  p.shade(x0, y0, x1, y1, (x, y, o) => {
    let best = Infinity, nearest = segments[0], position = 0;
    for (let i = 0; i < segments.length; i++) {
      const q = segments[i];
      const s = clamp(((x - q.ax) * q.ex + (y - q.ay) * q.ey) / q.l2);
      const px = q.ax + q.ex * s - x, py = q.ay + q.ey * s - y, d2 = px * px + py * py;
      if (d2 < best) { best = d2; nearest = q; position = s; }
    }
    const q = nearest, u = (q.acc + position * q.l) / len;
    const d = ((x - q.ax) * q.ey - (y - q.ay) * q.ex) / q.l;
    if (u <= 0 && Math.abs(d) > W) return;
    const w = Math.max(0.4, width(W, u)), r = Math.abs(d) / w;
    if (r >= 1.45) return;
    const n = hash(Math.floor(x), Math.floor(y - t * 26), seed);
    if (r > 1) {
      if (mist > 0 && n > 0.86 - 0.1 * u) { o.c = C[3 + (n > 0.95 ? 1 : 0)]; o.a = k * 0.55 * mist; }
      return;
    }
    if (r > 0.72 && n < (r - 0.72) * 2.6 * (0.6 + 0.6 * u)) return;
    const fork = smooth(0.62, 0.9, u) * forkWave;
    if (r < fork) return;
    const streak = 0.75 * Math.sin(d * 1.25 + u * 5 - t * 9 + seed) * Math.sin(u * 3.1 - t * 3.7 + seed * 2);
    const rr = fork > 0 ? (r - fork) / (1 - fork) : r;
    o.c = pick(C, 5.7 - 2.9 * Math.pow(rr, 1.25) - 1.9 * u + streak * (0.4 + 0.6 * rr) - dim, x, y);
    o.a = k;
  });
}
