// DRAFT v1 (motion + shape blocking) — Di Hoa 4: Tam Thien Diem Viem Hoa. Script: design/di-hoa/04-tam-thien-diem-viem-hoa.md.
// A star nebula opens over the target; its stars catch black fire and rain down in three waves; the burning points
// link into a constellation on the ground, and the whole constellation flares into a black-violet curtain of fire.
// "Black fire": a near-black core with bright violet-pink edges (the inverse of ordinary fire).
import { smooth, clamp, TAU, WHITE, READY, hex } from '../../core/index.js';

const C = ['#0a0610', '#1e0f2e', '#5a2a8c', '#9b4dd6', '#e07af0', '#f6d6ff', '#ffffff'].map(hex);
const TX = 150, END = 4.6, CALL = 0.15, IGNITE = 0.6, RAIN = 1.2, WAVES = [1.25, 1.65, 2.05], MAP = 2.45, FLARE = 2.9, FALL = 3.5;
const NY = -150;   // nebula height
const sm = (u) => u * u * (3 - 2 * u), out3 = (u) => 1 - (1 - u) ** 3;
const hsh = (i, s = 0) => { const h = Math.sin(i * 91.7 + s * 47.3) * 43758.5453; return h - Math.floor(h); };
export const meta = {
  name: 'Tam Thien Draft',
  desc: 'Motion draft: a star nebula opens over the target, its black-fire stars rain down, link into a constellation and flare into a curtain of black fire.',
  tags: ['di-hoa', 'draft', 'fire', 'star', 'area', 'one-shot'],
  size: [360, 260], origin: [60, 235], duration: END, loop: false, fps: 30, bg: 'ground', actor: 2,
  options: { seed: 5 },
};
const POINT = { ...READY, crouch: 0, lean: -2, fx: 9, fy: -41, bx: -4, by: -20 };
const SWEEP = { ...READY, crouch: 6, lean: 7, fx: 21, fy: -14, bx: -6, by: -19 };
const CLENCH = { ...READY, crouch: 4, fx: 14, fy: -30, bx: 8, by: -28, armsFront: true };
const UP = { ...READY, crouch: 0, lean: -2, fx: 9, fy: -40, bx: 8, by: -39 };
export const act = {
  target: { x: TX },
  poses: [[-0.2, READY], [CALL + 0.2, POINT], [RAIN - 0.03, { ...POINT, fy: -42 }], [RAIN + 0.04, SWEEP, 'snap'], [MAP, { ...SWEEP, crouch: 5 }],
    [FLARE - 0.1, CLENCH], [FLARE, UP, 'snap'], [FALL, { ...UP, crouch: 2, fy: -38 }], [END, READY]],
  hits: [
    { t: RAIN + 0.03, stop: 0.03, shake: 0.08, amp: 1, target: false },
    ...WAVES.map((w, i) => ({ t: w + 0.22, shake: 0.12, amp: 1 + i * 0.4, push: 0.25, straw: 3 })),
    { t: FLARE, stop: 0.1, shake: 0.5, amp: 4, push: 2, straw: 26, flash: 0.08, skin: 'shadow' },
    { t: END - 0.35, push: 0, straw: 0, skin: null },
  ],
};

// the stars: their place in the nebula and where each falls
const STARS = Array.from({ length: 48 }, (_, i) => {
  const a = hsh(i, 1) * TAU, r = Math.sqrt(hsh(i, 2));
  return { i, x: TX + Math.cos(a) * r * 80, y: NY + Math.sin(a) * r * 16, born: CALL + 0.45 * hsh(i, 3), wave: i % 3, gx: TX - 85 + 170 * hsh(i, 4), lag: 0.25 * hsh(i, 5), hy: -(12 + 46 * hsh(i, 9)) };
});
const fallT = (s) => WAVES[s.wave] + s.lag;   // when it starts falling (lasts 0.22 s)
const landed = STARS.map((s) => s).sort((a, b) => a.gx - b.gx);

function nebula(p, t) {
  const open = out3(clamp((t - CALL) / 0.45)) * (1 - smooth(FLARE + 0.4, FALL + 0.6, t));
  if (open <= 0) return;
  const rx = 95 * open, ry = 22 * open;
  p.shade(TX - rx - 6, NY - ry - 6, TX + rx + 6, NY + ry + 6, (x, y, o) => {
    const ex = (x - TX) / rx, ey = (y - NY) / ry, d = Math.hypot(ex, ey), ang = Math.atan2(ey, ex);
    const edge = 0.85 + 0.12 * Math.sin(ang * 5 + t * 2) + 0.08 * Math.sin(ang * 11 - t * 3);
    if (d > edge) return;
    const swirl = Math.sin(ang * 3 + d * 6 - t * 2.5);
    o.c = d > edge - 0.08 ? C[3] : swirl > 0.55 && d > 0.3 ? C[2] : C[d < 0.5 ? 0 : 1];
    o.a = 1;
  });
}
function star(p, x, y, k, t, i) {
  const tw = 0.6 + 0.4 * Math.sin(t * 17 + i * 2.3), l = 2 + 2 * tw;
  p.line(x - l, y, x + l, y, C[4], k); p.line(x, y - l, x, y + l, C[4], k);
  p.dot(x, y, C[0], k); p.dot(x + 1, y, C[3], k);
}
function stars(p, t) {
  for (const s of STARS) {
    if (t < s.born || t >= fallT(s)) continue;
    const lit = smooth(IGNITE, IGNITE + 0.3, t - s.lag * 0.4);
    if (lit <= 0) { p.dot(s.x, s.y, C[5], 1); continue; }   // still a pale point of light
    star(p, s.x, s.y, 1, t, s.i);
  }
}
function rain(p, t) {
  for (const s of STARS) {
    const u = (t - fallT(s)) / 0.22;
    if (u < 0 || u > 1) continue;
    const x = s.x + (s.gx - s.x) * u * u, y = s.y + (0 - s.y) * u * u, x0 = s.x + (s.gx - s.x) * Math.max(0, u - 0.45) ** 2, y0 = s.y + (0 - s.y) * Math.max(0, u - 0.45) ** 2;
    // black streak with violet edges
    for (const o of [-2, 2]) p.line(x0 + o * 0.5, y0, x + o, y, C[3], 0.9); p.line(x0 - 1, y0, x - 1, y, C[4], 0.8); p.line(x0, y0, x, y, C[0], 1); p.line(x0 + 1, y0, x + 1, y, C[0], 1);
    star(p, x, y, 1, t, s.i);
  }
}
function groundFires(p, t) {
  for (const s of STARS) {
    const tl = fallT(s) + 0.22;
    if (t < tl || t > FLARE + 0.1) continue;
    const τ = t - tl;
    if (τ < 0.12) for (let j = 0; j < 5; j++) { const a = -Math.PI * (0.15 + 0.7 * j / 4); p.line(s.gx, -1, s.gx + Math.cos(a) * 9 * (τ / 0.12 + 0.3), -1 + Math.sin(a) * 7 * (τ / 0.12 + 0.3), C[4], 1 - τ / 0.12); }
    const h = 5 + 2 * Math.sin(t * 13 + s.i);
    p.poly([[s.gx - 2.5, 0], [s.gx + 2.5, 0], [s.gx, -h]], C[3], 1);
    p.poly([[s.gx - 1.2, 0], [s.gx + 1.2, 0], [s.gx, -h * 0.6]], C[0], 1);
  }
}
// the stars that fell lift off their fires and hang in front of the target as a constellation, linked by violet lines
const node = (s, t) => { const u = sm(clamp((t - MAP - 0.006 * (s.i % 20)) / 0.25)); return [s.gx, -2 + (s.hy + 2) * u]; };
function constellation(p, t) {
  if (t < MAP || t > FLARE + 0.12) return;
  const u = clamp((t - MAP - 0.15) / 0.25), n = Math.floor(u * (landed.length - 1)), pulse = 0.75 + 0.25 * Math.sin(t * 30), k = 1 - smooth(FLARE, FLARE + 0.12, t);
  for (let i = 0; i < n; i++) {
    const [ax, ay] = node(landed[i], t), [bx, by] = node(landed[i + 1], t);
    p.line(ax, ay, bx, by, C[4], pulse * k);
    if (i % 3 === 0 && i + 4 < landed.length) { const [cx, cy] = node(landed[i + 4], t); p.line(ax, ay, cx, cy, C[3], 0.8 * pulse * k); }
  }
  for (const s of landed) { const [x, y] = node(s, t); star(p, x, y, k, t, s.i); p.line(s.gx, -1, x, y, C[2], 0.5 * k); }
}
function curtain(p, t) {
  const τ = t - FLARE;
  if (τ < 0 || τ > END - FLARE - 0.1) return;
  const rise = out3(clamp(τ / 0.18)), fall = smooth(FALL - FLARE, FALL - FLARE + 0.5, τ), H = 72 * rise * (1 - fall);
  if (H < 1) return;
  p.shade(TX - 100, -H - 14, TX + 100, 0, (x, y, o) => {
    const edgeX = 1 - smooth(78, 98, Math.abs(x - TX));
    const top = H * edgeX * (0.65 + 0.2 * Math.sin(x * 0.21 - τ * 9) + 0.15 * Math.sin(x * 0.53 + τ * 15));
    const tongue = Math.pow(Math.max(0, Math.sin(x * 0.33 + τ * 6)), 6) * 12 * edgeX * (1 - fall);
    const h = top + tongue;
    if (-y > h) return;
    const e = h + y;   // distance below the flame's top edge
    o.c = e < 1.5 ? C[5] : e < 4 ? C[4] : e < 8 ? C[3] : (Math.sin(x * 0.4 + y * 0.3 - τ * 10) > 0.6 ? C[1] : C[0]);
    o.a = 1;
  });
  for (let i = 0; i < 30; i++) {   // violet embers lifting off the top
    const s = (τ * 1.2 + hsh(i, 6)) % 1, x = TX - 90 + 180 * hsh(i, 7) + Math.sin(s * 6 + i) * 4, y = -H * 0.8 - s * 50;
    p.dot(x, y, C[4 + (i % 2)], (1 - s) * (1 - fall * 0.5));
  }
}
function embers(p, t) {   // after the curtain: last stars drifting down, violet ash
  if (t < FALL) return;
  const k = 1 - smooth(END - 0.6, END - 0.1, t);
  for (let i = 0; i < 20; i++) {
    const s = clamp((t - FALL - 0.04 * i) / 0.9);
    if (s <= 0 || s >= 1) continue;
    p.dot(TX - 90 + 180 * hsh(i, 8) + Math.sin(s * 5 + i) * 6, -60 + 60 * s, C[3 + (i % 3)], k * (1 - s));
  }
}

export function drawBack(p, t) {
  nebula(p, t);
  stars(p, t);
  constellation(p, t);
}
export function draw(p, t) {
  rain(p, t);
  groundFires(p, t);
  curtain(p, t);
  embers(p, t);
}
