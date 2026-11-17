// The eye's additive sunbeam and the ground yielding to its stare.
import { smooth, clamp, TAU } from '../../core/index.js';
import { L, IRIS, DUST, TX, OPENS, LOCK, BOOM, LC, EC, sm, hsh, openAt, eyeK, lockAt, pulses } from './_tinhlien-common.js';

// Narrow additive strokes: no alpha dithering, and no rectangular shader per segment.
function lightLine(p, x0, y0, x1, y1, c, k) {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
  for (let j = 0; j <= n; j++) {
    const u = j / n, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u;
    p.add(p.cellX(x, y), p.cellY(x, y), c, k);
  }
}
const MOTES = Array.from({ length: 18 }, (_, i) => ({ s: hsh(i, 4), x: hsh(i, 5) * 1.6 - 0.8, phase: hsh(i, 12) * TAU }));
function beam(p, t) {
  const op = openAt(t), k = eyeK(t);
  if (op < 0.05 || t > BOOM + 0.12) return;
  const lock = lockAt(t), fl = pulses(t), y0 = EC[1] + 5, y1 = LC[1] + 4 * lock;
  const wTop = (3 + 6 * op) * (1 - 0.6 * lock), wBot = (10 + 34 * op) * (1 - 0.92 * lock) + 1;
  const fade = 1 - smooth(BOOM, BOOM + 0.1, t), str = (0.07 + 0.12 * op + 0.18 * fl + 0.35 * lock) * k * fade;
  const bands = OPENS.map(o => (t - o) / 0.25), lastY = lock > 0.5 ? Math.floor(y1) : 0;
  // Scan only the actual cone width. All sway and pulse transcendental work is per row.
  for (let yy = Math.floor(y0); yy <= lastY; yy++) {
    const v = (yy + 0.5 - y0) / -y0, foot = Math.max(0, (v - 0.88) / 0.12);
    const w = wTop + (wBot - wTop) * v + foot * foot * 4 * op * (1 - lock);
    const sway = Math.sin(t * 1.7 + v * 2) * 0.065;
    let band = 0;
    for (const s of bands) if (s > 0 && s < 1.2) band += Math.exp(-(((v - s) / 0.06) ** 2)) * (1 - s / 1.2);
    p.shade(TX - w * 1.5, yy, TX + w * 1.5, yy, (x, y, o) => {
      const q = (x - TX) / w, e = Math.abs(q);
      if (e > 1.5) return;
      // Three fine shafts within the soft cone; their edges sway with the wide rays.
      const shaft = Math.max(0, 1 - Math.abs(q - 0.72 - sway) * w / 1.1, 1 - Math.abs(q + 0.76 - sway) * w / 1.1, 1 - Math.abs(q - 0.38 + sway) * w / 0.8);
      const ray = 0.7 + 0.3 * Math.max(0, 1 - Math.abs(q + sway) * 1.5);
      o.l = e < 0.25 ? L[6] : e < 1 ? L[4] : L[3];
      o.k = e > 1 ? str * 0.35 * (1.5 - e) * 2 : Math.min(0.9, str * (1 - e * e) * ray + band * 0.35 * k + shaft * str * 0.55);
    });
  }
  MOTES.forEach((m, i) => {
    const s = (t * 0.5 + m.s) % 1, y = y0 - y0 * s;
    if (fade <= (i + 1) / 19 || (lock > 0.5 && y > y1)) return;
    const x = TX + m.x * (wTop + (wBot - wTop) * s), twinkle = Math.sin(t * 9 + m.phase);
    if (twinkle > -0.4) p.dot(x, y, L[4 + i % 3], 1);
    if (i % 4 === 0 && twinkle > 0.88 && lock < 0.95) {
      lightLine(p, x - 2, y, x + 2, y, L[6], 0.65 * fade);
      lightLine(p, x, y - 2, x, y + 2, L[5], 0.65 * fade);
    }
  });
  // Thin rising heat ripples, intentionally short and sparse.
  if (lock < 0.8) for (let i = 0; i < 4; i++) {
    const rise = (t * 0.55 + i * 0.27) % 1, x = TX + (i - 1.5) * wBot * 0.36, y = -3 - rise * 36;
    for (let j = 0; j < 8; j++) {
      const dx = Math.sin(t * 4 + i + j * 0.8) * 1.3;
      p.add(p.cellX(x + dx, y - j), p.cellY(x + dx, y - j), L[4], (1 - rise) * op * fade * 0.35);
    }
  }
  const pr = (10 + 34 * op) * 1.15 * (1 + lock * 0.2);
  p.shade(TX - pr, -5, TX + pr, 3, (x, y, o) => {
    const e = ((x - TX) / pr) ** 2 + ((y + 1) / 4) ** 2;
    if (e < 1) { o.l = L[5]; o.k = (1 - e) * str * (lock > 0.5 ? 0.55 : 1.6); }
    if (lock > 0 && e > 0.77 && e < 1) { o.l = L[3]; o.k += lock * fade * 0.45; }
  });
  if (op > 0.3 && lock < 0.8) for (let i = 0; i < 18; i++) {
    const a = i / 18 * TAU + t * 0.6, r0 = pr * 0.85, r1 = pr * (1.05 + 0.1 * Math.sin(t * 5 + i));
    lightLine(p, TX + Math.cos(a) * r0, -1 + Math.sin(a) * r0 * 0.12, TX + Math.cos(a) * r1, -1 + Math.sin(a) * r1 * 0.12, IRIS[i % 2 ? 2 : 3], (op - 0.3) * (1 - lock) * fade);
  }
  if (lock > 0.3) {
    const jitter = Math.round(Math.sin(t * 53)), x = TX + jitter;
    // Two white pixels flanked by one pale-gold pixel on each side.
    for (let j = -2; j < 2; j++) lightLine(p, x + j, y0, x + j, y1, j === -2 || j === 1 ? L[3] : L[6], lock * fade * (j === -2 || j === 1 ? 0.6 : 1));
    p.glow(x, y1, 7, L[4], lock * fade * 0.85);
    for (let i = 0; i < 6; i++) {
      const s = (t * 4 + hsh(i, 14)) % 1, a = -Math.PI / 2 + (hsh(i, 15) - 0.5) * 3;
      lightLine(p, x + Math.cos(a) * s * 10, y1 + Math.sin(a) * s * 10, x + Math.cos(a) * (s * 10 + 3), y1 + Math.sin(a) * (s * 10 + 3), L[6], (1 - s) * lock * fade);
    }
  }
}

const FLOAT = Array.from({ length: 16 }, (_, i) => ({
  x: TX + (hsh(i, 20) - 0.5) * 110, h: 8 + 34 * hsh(i, 21), s: 1.5 + Math.floor(hsh(i, 22) * 3),
  c: 1 + Math.floor(hsh(i, 23) * 2), d: hsh(i, 24) * 0.4, phase: hsh(i, 25) * TAU,
  pts: Array.from({ length: 4 + i % 3 }, (_, j) => { const a = j / (4 + i % 3) * TAU, r = 0.75 + hsh(i * 7 + j, 30) * 0.3; return [Math.cos(a) * r, Math.sin(a) * r]; })
}));
const CRACKS = Array.from({ length: 10 }, (_, i) => {
  const a = i / 10 * TAU + hsh(i, 26), len = 20 + 50 * hsh(i, 27), pts = [[TX, -1]];
  for (let j = 0; j < 4; j++) {
    const q = a + (hsh(i * 7 + j, 29) - 0.5) * 0.8;
    pts.push([pts[j][0] + Math.cos(q) * len / 4, -1 + Math.sin(q) * len / 4 * 0.1 * (j + 1)]);
  }
  return pts;
});
function stare(p, t) {
  if (t < OPENS[2] || t > BOOM + 1.2) return;
  const lock = lockAt(t);
  FLOAT.forEach((R, i) => {
    const a = t - OPENS[2] - R.d;
    if (a < 0) return;
    const lift = sm(clamp(a / 0.9)), rot = t * 0.55 + R.phase, cs = Math.cos(rot), sn = Math.sin(rot);
    let x = R.x, y = -R.h * lift + 1.2 * Math.sin(t * 3 + R.h);
    if (i % 4 === 0) { x = TX + Math.cos(rot) * (18 + R.h * 0.5); y += Math.sin(rot) * 3; }
    if (t > LOCK) x += (Math.floor(t * 30) & 1 ? 1 : -1) * lock;
    if (t > BOOM) { const b = t - BOOM; x += (Math.sign(R.x - TX) || 1) * 260 * b; y += -80 * b + 260 * b * b; }
    if (y > 0 || x < -56 || x > 295) return;
    const pts = R.pts.map(([u, v]) => [x + (u * cs - v * sn) * R.s, y + (u * sn + v * cs) * R.s]);
    p.poly(pts, DUST[R.c], 1);
    p.poly([pts[0], pts[1], [x, y], pts[pts.length - 1]], DUST[R.c + 1], 1);
    if (a < 0.9 && lift > 0.1) for (let j = 0; j < 2; j++) {
      const fall = (a * 1.6 + j * 0.5) % 1;
      p.dot(x + j * 2 - 1, Math.min(-1, y + 3 + fall * 9), DUST[2], 1);
    }
  });
  const fade = 1 - smooth(BOOM + 0.4, BOOM + 1.2, t), grow = clamp((t - LOCK) / 0.35);
  if (grow <= 0 || fade <= 0) return;
  const flare = smooth(BOOM - 0.1, BOOM, t), strength = (0.3 + 0.6 * flare) * fade;
  for (const pts of CRACKS) for (let j = 0; j < 4; j++) {
    const u = clamp(grow * 4 - j);
    if (u <= 0) break;
    const [x, y] = pts[j], nx = x + (pts[j + 1][0] - x) * u, ny = y + (pts[j + 1][1] - y) * u;
    // Light spills on both lips; solid stepped edges enclose the white fissure.
    lightLine(p, x, y - 2, nx, ny - 2, L[3], strength * 0.3);
    lightLine(p, x, y + 2, nx, ny + 2, L[3], strength * 0.3);
    lightLine(p, x, y - 1, nx, ny - 1, L[3], strength);
    lightLine(p, x, y + 1, nx, ny + 1, L[3], strength);
    lightLine(p, x, y, nx, ny, L[6], strength);
    if (j === 1 || j === 2) {
      const bx = nx + (nx - x) * 0.35, by = ny + (j === 1 ? -2 : 2) * u;
      lightLine(p, nx, ny + 1, bx, by + 1, L[3], strength * 0.65);
      lightLine(p, nx, ny, bx, by, L[6], strength * 0.8);
    }
  }
}
export function gaze(p, t, layer) { if (layer === 'back') beam(p, t); else stare(p, t); }
