// Opening: the heart kindles, clear shoulder flames tremble, then the palm releases it.
// Every birth and motion is derived from time; layers can be drawn independently.
import { smooth, TAU } from '../../core/index.js';
import { C, RIM, ASH, OUT, REACH, hand, headAt } from './_vanlac-common.js';

const hash = (i) => { const n = Math.sin(i * 127.1 + 19.7) * 43758.5453; return n - Math.floor(n); };

function kindle(p, t, layer) {
  const grow = smooth(0, 0.48, t), fade = 1 - smooth(OUT, OUT + 0.12, t);
  if (grow * fade <= 0) return;
  if (layer === 'back') {
    // Seven narrow lenses rooted in the shoulders and back, 8..14 px high.
    const flames = Array.from({ length: 7 }, (_, i) => ({
      x: -12 + i * 3.6, y: -22 - 14 * Math.sin(i / 6 * Math.PI),
      h: (8 + 6 * (0.5 + 0.5 * Math.sin(t * 19 + i * 2.3))) * fade,
      bend: 1.8 * Math.sin(t * 23 + i * 1.7), w: (1.7 + hash(i)) * grow,
    }));
    // One shade pass for the group; the interiors brighten the backdrop.
    p.shade(-18, -53, 16, -20, (x, y, o) => {
      for (const f of flames) {
        const u = (f.y - y) / f.h;
        if (u < 0 || u > 1) continue;
        const center = f.x + f.bend * u * u, w = f.w * (1 - u) * (0.7 + 0.8 * Math.sin(u * Math.PI));
        const d = Math.abs(x - center);
        if (d > w) continue;
        if (w - d < 0.65) { o.c = RIM; o.a = 1; return; }
        o.l = RIM; o.k = 0.12 + 0.1 * u; return;
      }
    });
    // Heat waves shorten rather than stippling through a low alpha fade.
    for (let i = 0; i < 3; i++) {
      const side = i === 1 ? 1 : -1, y = -18 - i * 12;
      const pts = Array.from({ length: 6 }, (_, j) => [side * (17 + 1.3 * Math.sin(t * 18 + j * 1.2 + i)), y - j * grow * fade * 1.5]);
      p.polyline(pts, RIM, 1);
    }
    return;
  }
  const beat = Math.exp(-(((t - 0.25) / 0.045) ** 2)) + Math.exp(-(((t - 0.45) / 0.045) ** 2));
  const r = (0.6 + 2.5 * grow + 0.65 * beat) * fade;
  p.glow(4, -30, 6 + 5 * grow, C[3], (0.15 + 0.12 * beat) * grow * fade);
  p.disc(4, -30, r, C[2], 1);
  p.disc(4, -30.3, r * 0.72, C[3], 1);
  p.disc(3.7, -30.8, r * 0.32, C[4], 1);
  const [hx, hy] = hand(t);
  p.glow(hx, hy, 3.5, C[3], 0.12 * grow * fade);
}

function release(p, t) {
  const age = t - (OUT + 0.05), life = 0.15;
  if (age < 0 || age >= life) return;
  const u = age / life, r = 3 + 19 * u, [hx, hy] = hand(OUT + 0.05);
  // The fading lens loses circumference while keeping its surviving rim clean.
  const n = Math.max(3, Math.round(32 * (1 - smooth(0.35, 1, u))));
  p.polyline(Array.from({ length: n + 1 }, (_, i) => {
    const a = i / 32 * TAU + u * 0.4;
    return [hx + Math.cos(a) * r, hy + Math.sin(a) * r];
  }), RIM, 1);
  p.shade(hx - r, hy - r, hx + r, hy + r, (x, y, o) => {
    const d = Math.hypot(x - hx, y - hy);
    if (Math.abs(d - r) < 1.5) { o.l = RIM; o.k = 0.18 * (1 - u); }
  });
  for (let i = 0; i < 8; i++) {
    const a = -0.75 + i / 7 * 1.3, d = 3 + (18 + 12 * hash(i + 20)) * u;
    const len = (2 + 4 * hash(i + 40)) * (1 - u);
    p.line(hx + Math.cos(a) * (d - len), hy + Math.sin(a) * (d - len), hx + Math.cos(a) * d, hy + Math.sin(a) * d, C[i % 3 === 0 ? 4 : 3], 1);
  }
}

function flight(p, t) {
  // Ground particles are born directly below the head when it passes each sample.
  for (let i = 0; i < 24; i++) {
    const birth = OUT + (REACH - OUT) * i / 23, age = t - birth;
    const life = 0.28 + 0.12 * hash(i + 60);
    if (age < 0 || age > life) continue;
    const [gx] = headAt(birth), u = age / life;
    for (let j = 0; j < 2; j++) {
      const seed = i * 2 + j, h = 8 + 12 * hash(seed + 90);
      const x = gx + (j ? 1 : -1) * (2 + 6 * u) + Math.sin(u * TAU + seed) * 3 * Math.sin(u * Math.PI);
      const y = -h * Math.sin(u * Math.PI);
      p.dot(x, y, ASH[(i + j) % 3], 1);
      if (u > 0.12 && u < 0.65 && j === 0) p.dot(x - 1, y + 1, ASH[1], 1);
    }
  }
  // Short-lived additive crosses linger just below the head's trajectory.
  const marks = [];
  for (let i = 0; i < 35; i++) {
    const birth = OUT + (REACH - OUT) * i / 34, age = t - birth;
    if (age < 0 || age >= 0.3) continue;
    const [x, y] = headAt(birth), u = age / 0.3;
    marks.push({ x, y: y + 5 + 2 * u, k: 0.22 * (1 - u), r: 1.8 * (1 - u) + 0.5, i, u });
  }
  if (!marks.length) return;
  const x0 = Math.min(...marks.map(q => q.x)) - 3, x1 = Math.max(...marks.map(q => q.x)) + 3;
  const y0 = Math.min(...marks.map(q => q.y)) - 3, y1 = Math.max(...marks.map(q => q.y)) + 3;
  p.shade(x0, y0, x1, y1, (x, y, o) => {
    for (const q of marks) {
      const dx = Math.abs(x - q.x), dy = Math.abs(y - q.y);
      if ((dx < 0.65 && dy < q.r) || (dy < 0.65 && dx < q.r)) {
        o.l = RIM; o.k = q.k; return;
      }
    }
  });
  for (const q of marks) if (q.i % 4 === 0 && q.u < 0.72) p.dot(q.x, q.y + 1, RIM, 1);
}

export function intro(p, t, layer) {
  if (t < 0 || t > REACH + 0.4) return;
  if (t < OUT + 0.12) kindle(p, t, layer);
  if (layer !== 'front') return;
  release(p, t);
  if (t >= OUT) flight(p, t);
}
