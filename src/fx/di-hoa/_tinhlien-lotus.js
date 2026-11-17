// Flame lotus: opaque stepped petals, detached tongues and staggered dust echoes.
import { smooth, clamp } from '../../core/index.js';
import { L, TX, APPEAR, OPENS, LOCK, BOOM, GHOST, LC, sm, out3, hsh } from './_tinhlien-common.js';

const RINGS = [
  { n: 6, len: 30, w: 17, spread: 1.25 },
  { n: 5, len: 27, w: 15, spread: 0.8 },
  { n: 3, len: 21, w: 12, spread: 0.3 },
];
const PROFILE = Array.from({ length: 9 }, (_, i) => Math.sin(Math.PI * (i / 8) ** 0.75) * 0.5);
const SEEDS = Array.from({ length: 8 }, (_, i) => [hsh(i, 6), hsh(i, 7)]);

// Scan transformed polygon rows once, rather than testing every edge at every pixel.
// The axial coordinate supplies solid gold/cream/white bands without extra fills.
function fillPetal(p, pts, bx, by, c, s, len, white, echo, seed) {
  const q = pts.map(([x, y]) => [p.toX(x, y), p.toY(x, y)]);
  const ox = p.toX(bx, by), oy = p.toY(bx, by);
  const dx = p.toX(bx + c, by + s) - ox, dy = p.toY(bx + c, by + s) - oy;
  let lo = Infinity, hi = -Infinity;
  for (const a of q) { lo = Math.min(lo, a[1]); hi = Math.max(hi, a[1]); }
  const base = echo ? L[1] : L[white > 0.35 ? 4 : 3];
  const body = echo ? L[2] : L[white > 0.7 ? 6 : white > 0.25 ? 5 : 4];
  const rim = echo ? L[3 + (seed % 2)] : L[white > 0.45 ? 6 : 5];
  for (let y = Math.max(p.oy, Math.floor(lo)); y <= Math.min(p.oy + p.h - 1, Math.ceil(hi)); y++) {
    const hits = [], yy = y + 0.5;
    for (let i = 0, j = q.length - 1; i < q.length; j = i++) {
      const a = q[j], b = q[i];
      if ((a[1] > yy) !== (b[1] > yy)) hits.push(a[0] + (yy - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
    }
    hits.sort((a, b) => a - b);
    for (let i = 0; i + 1 < hits.length; i += 2) {
      const left = Math.max(p.ox, Math.ceil(hits[i] - 0.5)), right = Math.min(p.ox + p.w - 1, Math.floor(hits[i + 1] - 0.5));
      let u = ((left + 0.5 - ox) * dx + (yy - oy) * dy) / len;
      for (let x = left; x <= right; x++, u += dx / len) {
        p.put(x, y, x === left || x === right || u > 0.86 ? rim : u < 0.3 ? base : body);
      }
    }
  }
}

function flamePetal(p, bx, by, ang, len, w, t, seed, white, echo) {
  if (len < 0.6) return;
  const c = Math.cos(ang), s = Math.sin(ang), left = [], right = [];
  const bend = 2.2 * Math.sin(t * 6 + seed * 3), phase = t * 11 + seed * 5;
  const point = (a, b) => [bx + a * c - b * s, by + a * s + b * c];
  for (let i = 0; i <= 8; i++) {
    const u = i / 8;
    const half = w * PROFILE[i] * (1 + 0.25 * Math.sin(phase + u * 6) + 0.12 * Math.sin(t * 23 + seed + u * 11));
    const b = bend * u * u;
    left.push(point(u * len, -half + b)); right.push(point(u * len, half + b));
  }
  const tip = point(len * (1.04 + 0.07 * Math.sin(t * 17 + seed * 7)), bend);
  fillPetal(p, [...left, tip, ...right.reverse()], bx, by, c, s, len, white, echo, seed);
  const a = point(len * 0.12, 0), b = point(len * 0.69, bend * 0.48);
  p.line(...a, ...b, echo ? L[3] : L[white > 0.65 ? 5 : 3]);
  if (echo || white > 0.8) return;
  // Each tongue leaves a real gap, rises vertically and shrinks away, then respawns.
  for (let j = 0; j < 2; j++) {
    const age = (t * (1.6 + (seed % 3) * 0.13) + seed * 0.137 + j * 0.47) % 1;
    if (age > 0.78) continue;
    const x = tip[0] + (j ? 1 : -1) * w * 0.1 + Math.sin(t * 18 + seed) * age * 2;
    const y = tip[1] - 1.5 - age * 9, h = (1 - age) * Math.min(4, len * 0.16);
    p.line(x, y, x + Math.sin(seed + t * 9), y - h, L[j ? 5 : 6]);
  }
}

function lotusShape(p, t, layer, cx, cy, size, crush, echo = 0) {
  const sway = 0.12 * Math.sin(t * 3.1) + 0.05 * Math.sin(t * 8.3) + crush * 0.32 * Math.sin(t * 10);
  const ring = (R, ri) => {
    for (let j = 0; j < R.n; j++) {
      const seed = ri * 10 + j, f = j / (R.n - 1) - 0.5;
      let reveal = 1;
      if (echo) {
        reveal = smooth(GHOST[0] + (seed % 7) * 0.032, GHOST[0] + 0.22 + (seed % 7) * 0.032, t)
          * (1 - smooth(GHOST[1] - 0.28 - (seed % 5) * 0.025, GHOST[1], t));
        if (Math.sin(t * (16 + j * 0.5) + seed * 2.3) < -0.78 || reveal < 0.13) continue;
      }
      const ang = -Math.PI / 2 + sway + f * 2 * R.spread * (1 - 0.86 * crush);
      flamePetal(p, cx + f * 6 * size, cy + 6 * size, ang, R.len * size * reveal, R.w * size * reveal,
        t, seed, crush, echo);
    }
  };
  if (layer === 'back') { ring(RINGS[0], 0); return; }
  ring(RINGS[1], 1); ring(RINGS[2], 2);
  // Shallow golden receptacle, with a bright elliptical lip and seven lotus seeds.
  const cupSize = size * (echo ? smooth(GHOST[0] + 0.08, GHOST[0] + 0.35, t)
    * (1 - smooth(GHOST[1] - 0.3, GHOST[1], t)) : 1);
  const y = cy + 1.5 * size, w = 7 * cupSize, h = 3 * cupSize;
  if (cupSize < 0.12) return;
  const cup = [[cx - w, y], [cx - w * 0.65, y + h], [cx, y + h * 1.3], [cx + w * 0.65, y + h], [cx + w, y]];
  p.poly(cup, L[echo ? 1 : crush > 0.6 ? 5 : 2]);
  p.poly([[cx - w, y], [cx - w * 0.5, y - h * 0.6], [cx + w * 0.5, y - h * 0.6], [cx + w, y], [cx, y + h * 0.45]], L[echo ? 2 : crush > 0.4 ? 6 : 3]);
  for (let i = 0; i < 7; i++) p.dot(cx + ((i % 4) - (i < 4 ? 1.5 : 1)) * 2.7 * cupSize, y + (i < 4 ? -0.7 : 0.6) * cupSize, L[echo ? 4 : 6]);
}

function liveLotus(p, t, layer) {
  if (t < APPEAR - 0.05 || t > BOOM + 0.02) return;
  const born = out3(clamp((t - APPEAR + 0.05) / 0.25)), crush = sm(clamp((t - LOCK) / (BOOM - LOCK))), stare = smooth(OPENS[2], LOCK, t);
  const breathe = 1 + (0.08 + 0.08 * stare) * Math.sin(t * (7 + 6 * stare)) + 0.04 * Math.sin(t * 17);
  const size = born * breathe * (1 - 0.7 * crush) * (1 + 0.1 * Math.sin(t * 40) * crush);
  const cx = LC[0] + crush * Math.sin(t * 113) * 1.3, cy = LC[1] + crush * Math.sin(t * 137);
  if (layer === 'back') p.glow(cx, cy - 7 * size, 17 * size, L[4], 0.12 * breathe);
  lotusShape(p, t, layer, cx, cy, size, crush);
  if (layer !== 'front') return;
  if (crush > 0.3) {
    p.glow(cx, cy, 8 + 20 * crush, L[6], 0.3 * crush);
    const ball = smooth(0.5, 0.94, crush);
    if (ball > 0) p.disc(cx, cy - 2, 7 * ball, L[6], 0.95 * ball);
  }
  for (let i = 0; i < 8; i++) {
    const age = (t * 1.3 + SEEDS[i][0]) % 1;
    if (age > 0.8) continue;
    const x = cx + (SEEDS[i][1] - 0.5) * 35 * size + Math.sin(t * 6 + i) * age * 2;
    const y = cy - (10 + 27 * age) * size;
    p.line(x, y, x, y - (age < 0.4 ? 1.5 : 0), L[6]);
  }
}

function ghost(p, t) {
  if (t <= GHOST[0] || t >= GHOST[1]) return;
  const g = smooth(GHOST[0], GHOST[0] + 0.3, t) * (1 - smooth(GHOST[1] - 0.4, GHOST[1], t));
  const size = 2.1 * (1 + 0.035 * Math.sin(t * 13));
  lotusShape(p, t, 'back', TX, -62, size, 0, 1);
  lotusShape(p, t, 'front', TX, -62, size, 0, 1);
  p.glow(TX, -68, 35, L[4], 0.16 * g);
}
export function lotus(p, t, layer) { liveLotus(p, t, layer); if (layer === 'front') ghost(p, t); }
