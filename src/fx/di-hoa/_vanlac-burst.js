// Outward heart-flame burst; all trajectories are evaluated directly from time.
import { smooth, TAU } from '../../core/index.js';
import { C, RIM, SHADE, ASH, END, BURN, CHEST, out3 } from './_vanlac-common.js';

const hash = (i) => { const n = Math.sin(i * 127.1 + 31.7) * 43758.5453; return n - Math.floor(n); };
const RAYS = Array.from({ length: 16 }, (_, i) => ({
  // Twelve directions above the chest, four below; no fire column.
  a: i < 12 ? -Math.PI + (i + 0.4) / 12 * Math.PI : (i - 11.5) / 4 * Math.PI,
  reach: 60 + 60 * hash(i), w: 3 + hash(i + 20), bend: (hash(i + 40) - 0.5) * 7,
}));

// An asymmetric curved tongue, with a broad root and a sharp rose point.
function tongue(p, x0, y0, x1, y1, width, bend, k, phase) {
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
  if (len < 1 || width < 0.15 || k <= 0) return;
  const ax = dx / len, ay = dy / len, nx = -ay, ny = ax, pad = width + Math.abs(bend) + 2;
  // Sample the profile once per tongue, not trigonometry for every candidate pixel.
  const curves = new Float64Array(33), widths = new Float64Array(33);
  for (let i = 0; i <= 32; i++) {
    const u = i / 32, wave = Math.sin(u * Math.PI);
    curves[i] = bend * wave + Math.sin(u * TAU + phase) * width * 0.22 * wave;
    widths[i] = width * Math.pow(1 - u, 0.8) * (0.82 + 0.28 * wave);
  }
  p.shade(Math.min(x0, x1) - pad, Math.min(y0, y1) - pad,
    Math.max(x0, x1) + pad, Math.min(-1, Math.max(y0, y1) + pad), (x, y, o) => {
      if (y > -1) return;
      const u = ((x - x0) * ax + (y - y0) * ay) / len;
      if (u < 0 || u > 1) return;
      const sample = u * 32, i = Math.min(31, Math.floor(sample)), f = sample - i;
      const curve = curves[i] + (curves[i + 1] - curves[i]) * f;
      const d = (x - x0) * nx + (y - y0) * ny - curve;
      const w = widths[i] + (widths[i + 1] - widths[i]) * f;
      if (Math.abs(d) > w) return;
      if (u > 0.89) { o.c = C[u > 0.96 ? 4 : 3]; o.a = 1; return; }
      if (w - Math.abs(d) < 0.8 || u * len < 0.7) { o.c = RIM; o.a = 1; return; }
      o.l = SHADE; o.k = (0.1 + 0.16 * Math.abs(d) / w) * k;
    });
}

export function burst(p, t, layer) {
  const age = t - BURN;
  if (age < 0 || t >= END || layer !== 'front') return;
  const [cx, cy] = CHEST;
  // Small, rapidly extinguished flash, with a separate thin white rim.
  if (age < 0.08) {
    const u = age / 0.08, r = 7 + 16 * out3(u), k = (1 - u) ** 2;
    p.disc(cx, cy, r, C[4], k);
    p.shade(cx - r - 2, cy - r - 2, cx + r + 2, cy + r + 2, (x, y, o) => {
      const d = Math.hypot(x - cx, y - cy);
      if (d > r && d < r + 1) { o.c = RIM; o.a = 1; }
    });
  }
  // Four-pixel lens band, clipped instead of flattened against the ground.
  if (age < 0.5) {
    const r = 10 + 120 * out3(age / 0.5), k = 1 - smooth(0.23, 0.5, age), band = 4;
    const outer2 = r * r, inner2 = (r - band) ** 2;
    p.shade(cx - r, cy - r, cx + r, Math.min(-1, cy + r), (x, y, o) => {
      if (y > -1) return;
      const dx = x - cx, dy = y - cy, d2 = dx * dx + dy * dy;
      if (d2 > outer2 || d2 < inner2) return;
      const d = r - Math.sqrt(d2);
      // Dissolve in long arcs while keeping surviving rims opaque.
      if (k < 0.5 && Math.sin(Math.atan2(y - cy, x - cx) * 7 + age * 4) > k * 4 - 1) return;
      if (d < 1) { o.c = RIM; o.a = 1; return; }
      o.l = SHADE; o.k = (0.08 + 0.22 * (1 - d / band)) * k;
    });
    const rx = r * 1.1, ry = r * 0.14, ix2 = 1 / (rx * rx), iy2 = 1 / (ry * ry);
    p.shade(cx - rx, -ry, cx + rx, ry, (x, y, o) => {
      const dx = x - cx, d2 = dx * dx * ix2 + y * y * iy2;
      if (d2 > 1 || d2 < (1 - 1.6 * k / ry) ** 2) return;
      const edge = (1 - Math.sqrt(d2)) * ry;
      if (edge < 0 || edge > 1.6 * k) return;
      if (edge < 0.7 * k) { o.c = RIM; o.a = 1; return; }
      o.l = SHADE; o.k = 0.16 * k;
    });
  }
  if (age < 0.6) {
    const u = age / 0.6, k = 1 - smooth(0.28, 0.6, age);
    for (let i = 0; i < RAYS.length; i++) {
      const r = RAYS[i], travel = r.reach * out3(u), stretch = (10 + 30 * Math.sin(Math.PI * u)) * Math.sqrt(k);
      const tail = Math.max(0, travel - stretch), ca = Math.cos(r.a), sa = Math.sin(r.a), gravity = 18 * u * u;
      tongue(p, cx + ca * tail, cy + sa * tail + gravity * 0.55,
        cx + ca * travel, cy + sa * travel + gravity, r.w * Math.sqrt(k), r.bend * k, k, t * 13 + i);
    }
  }
  // 48 rose embers: ballistic flight, one analytic bounce, then extinction.
  const g = 180, ground = -1;
  for (let i = 0; i < 48; i++) {
    const s = age - hash(i + 80) * 0.035;
    if (s < 0) continue;
    const a = i / 48 * TAU + (hash(i + 90) - 0.5) * 0.22;
    const v = 90 + 95 * hash(i + 100), vx = Math.cos(a) * v, vy = Math.sin(a) * v;
    const hit = (-vy + Math.sqrt(vy * vy + 4 * g * (ground - cy))) / (2 * g);
    let x = cx + vx * s, y = cy + vy * s + g * s * s, life = 1 - smooth(0.65, 1.05, s);
    if (s >= hit) {
      const b = s - hit, bounce = (vy + 2 * g * hit) * 0.32, duration = bounce / g;
      if (b >= duration) continue;
      x = cx + vx * hit + vx * 0.65 * b;
      y = ground - bounce * b + g * b * b;
      life *= 1 - smooth(duration * 0.35, duration, b);
    }
    if (life <= 0) continue;
    p.dot(x, Math.min(ground, y), C[life < 0.3 ? 2 : 3 + i % 2], 1);
    if (i % 6 === 0 && s < hit && life > 0.5) p.line(x, y, x - vx * 0.014, Math.min(ground, y - (vy + 2 * g * s) * 0.014), C[2], 0.9);
  }
  // Slower ash loses its outward impulse and drifts upward.
  for (let i = 0; i < 20; i++) {
    const s = age - hash(i + 150) * 0.1;
    if (s < 0) continue;
    const a = i / 20 * TAU, drift = 12 + 22 * hash(i + 170), k = 1 - smooth(0.7, 1.08, age);
    if (k <= 0 || hash(i + 190) > k) continue;
    const x = cx + Math.cos(a) * drift * (1 - Math.exp(-s * 4)) + 2 * Math.sin(s * 5 + i) * s;
    const y = cy + Math.sin(a) * drift * s * Math.exp(-s * 2) - 23 * s * s;
    p.dot(x, Math.min(-1, y), ASH[i % ASH.length], 1);
  }
  // Last clear tongues lick the charred torso, shrinking into its outline.
  if (age >= 0.55 && age < 1.02) {
    const k = smooth(0.55, 0.64, age) * (1 - smooth(0.7, 1.02, age));
    for (let i = 0; i < 5; i++) {
      const side = i % 2 ? 1 : -1, x = cx + side * (5 + i % 3), y = -13 - i * 7;
      tongue(p, x, y, x + side * (3 + Math.sin(t * 14 + i) * 2) * k,
        y - (7 + 5 * hash(i + 210)) * k, 2.3 * k, side * 1.6 * k, k, t * 11 + i);
    }
  }
  // Thin S-shaped soul, born at the chest at +0.6 s, gone by +1.0 s.
  if (age >= 0.6 && age < 1) {
    const u = (age - 0.6) / 0.4, k = 1 - smooth(0.45, 1, u), pts = [];
    const length = (14 + 20 * out3(u)) * Math.sqrt(k), top = cy - 60 * u;
    for (let i = 0; i <= 24; i++) {
      const v = i / 24;
      pts.push([cx + 6 * Math.sin(v * TAU - u * 2) * Math.sin(v * Math.PI), top + length * v]);
    }
    for (let i = 0; i < pts.length - 1; i++) {
      const [x, y] = pts[i], [xx, yy] = pts[i + 1];
      p.shade(Math.min(x, xx) - 1, y, Math.max(x, xx) + 1, yy, (px, py, o) => {
        const q = (py - y) / (yy - y || 1), spine = x + (xx - x) * q;
        if (Math.abs(px - spine) < 1) { o.l = SHADE; o.k = 0.12 * k; }
      });
    }
    p.polyline(pts, RIM, 1);
    p.dot(pts[0][0], pts[0][1], C[u > 0.8 ? 2 : 4], 1);
  }
}
