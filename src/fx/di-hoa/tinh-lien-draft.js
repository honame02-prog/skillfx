// DRAFT v1 (motion + shape blocking) — Di Hoa 5: Tinh Lien Yeu Hoa. Script: design/di-hoa/05-tinh-lien-yeu-hoa.md.
// Silent white fire: one lotus petal drifts onto the target, white fire bleaches it while a golden mandorla rises
// behind it, then the white silhouette comes apart into hundreds of tiny petals and the mandorla closes to a point.
import { smooth, clamp, TAU, READY, hex, poseAt } from '../../core/index.js';

// 0 dark-brown edge, 1 deep gold, 2 gold, 3 pale gold, 4 cream, 5 warm white, 6 white
const C = ['#3a2e1c', '#8a6a2a', '#c9a24a', '#e9cf8a', '#efe6cf', '#fbf8f0', '#ffffff'].map(hex);
const TX = 150, END = 4.6, FLICK = 0.6, LAND = 1.35, SPREAD = 1.4, PURE = 2.6, ERASE = 2.75, ERASE_D = 0.6, CALM = 3.4;
const CHEST = [TX, -30], MC = [TX, -57], MH = 56, MW = 30;   // mandorla centre, half height, half width
const sm = (u) => u * u * (3 - 2 * u), out3 = (u) => 1 - (1 - u) ** 3;
const hsh = (i, s = 0) => { const h = Math.sin(i * 91.7 + s * 47.3) * 43758.5453; return h - Math.floor(h); };

export const meta = {
  name: 'Tinh Lien Draft',
  desc: 'Motion draft v1: a single white-fire lotus petal drifts onto the target, bleaches it white under a golden mandorla, and it dissolves into tiny petals.',
  tags: ['di-hoa', 'draft', 'fire', 'holy', 'one-shot'],
  size: [360, 260], origin: [60, 235], duration: END, loop: false, fps: 30, bg: 'ground', actor: 2,
  options: { seed: 5 },
};
const PINCH = { ...READY, crouch: 0, lean: -1, fx: 12, fy: -38, bx: 6, by: -26 };
const FLICKP = { ...READY, crouch: 1, lean: 3, fx: 20, fy: -34, bx: 6, by: -26 };
const CLOSE = { ...READY, crouch: 2, fx: 13, fy: -33, bx: 9, by: -31, armsFront: true };
const POSES = [[-0.2, READY], [0.4, PINCH], [FLICK - 0.03, PINCH], [FLICK + 0.04, FLICKP, 'snap'], [1.2, { ...FLICKP, fx: 18, fy: -32 }], [ERASE - 0.12, { ...CLOSE, fx: 15, fy: -35 }],
  [ERASE, CLOSE, 'snap'], [CALM + 0.3, CLOSE], [END, READY]];
const hand = (t) => { const q = poseAt(POSES, t); return [q.fx ?? 11, q.fy ?? -21]; };
const dots = [];
for (let t = SPREAD + 0.15; t < PURE; t += 0.2) dots.push({ t, shake: 0.04, amp: 0.5, push: 0.06, straw: 0, flash: 0 });
export const act = {
  target: { x: TX },
  poses: POSES,
  hits: [
    { t: LAND, shake: 0.05, amp: 0.5, push: 0.15, straw: 0, flash: 0, skin: 'holy' },
    ...dots,
    { t: PURE - 0.25, shake: 0.03, push: 0, straw: 0, flash: 0, skin: 'pure' },
    { t: ERASE, stop: 0.12, shake: 0.15, amp: 1.5, push: 0, straw: 0, flash: 0.05, erase: ERASE_D },
    { t: END - 0.03, push: 0, straw: 0, flash: 0, skin: null, erase: 0 },
  ],
};

// ---------------------------------------------------------------- pieces
function petal(p, x, y, ang, s, k = 1) {   // teardrop: round base at (x,y), point along ang
  if (k <= 0 || s < 0.4) return;
  const c = Math.cos(ang), sn = Math.sin(ang), L = 7 * s, W = 2.6 * s, pts = [];
  for (let i = 0; i <= 10; i++) {
    const u = i / 10, w = W * Math.sin(Math.PI * Math.pow(u, 0.7)) ;
    pts.push([u * L, w]);
  }
  for (let i = 9; i >= 1; i--) pts.push([pts[i][0], -pts[i][1]]);
  const P = pts.map(([a, b]) => [x + a * c - b * sn, y + a * sn + b * c]);
  p.poly(P, C[5], k);
  if (s > 1.1) p.polyline([...P, P[0]], C[1], k); else p.dot(x, y, C[3], k);
  p.line(x + c * L * 0.15, y + sn * L * 0.15, x + c * L * 0.7, y + sn * L * 0.7, C[3], k);
}
function candle(p, x, y, h, t, seed, k = 1) {   // a straight, still white flame
  if (h < 1 || k <= 0) return;
  const sway = 0.6 * Math.sin(t * 5 + seed * 3), w = Math.max(1, h * 0.22);
  p.poly([[x - w, y], [x - w * 0.6, y - h * 0.45], [x + sway, y - h], [x + w * 0.6, y - h * 0.45], [x + w, y]], C[3], k);
  p.poly([[x - w * 0.5, y], [x + sway * 0.6, y - h * 0.8], [x + w * 0.5, y]], C[6], k);
  p.dot(x, y, C[2], k);
}
// the drifting petal's path: palm -> chest, slow and swaying like a falling leaf
function petalAt(t) {
  const [hx, hy] = hand(Math.min(t, FLICK));
  if (t < FLICK) return [hx + 2, hy - 4, -Math.PI / 2 + 0.2 * Math.sin(t * 3)];
  const u = clamp((t - FLICK) / (LAND - FLICK)), e = sm(u);
  const x = hx + (CHEST[0] - hx) * e, y = hy + (CHEST[1] - hy) * e - 26 * Math.sin(u * Math.PI) + 5 * Math.sin(u * TAU * 2);
  return [x, y, -Math.PI / 2 + 0.9 * Math.sin(u * TAU * 1.5) + u * 1.2];
}

// mandorla: two circular arcs meeting at top and bottom; a(=0..1) along each side from the bottom up
function mandorla(p, t, layer) {
  const grow = smooth(SPREAD + 0.1, PURE, t), close = sm(clamp((t - ERASE) / 0.5)), gone = smooth(ERASE + 0.5, ERASE + 0.7, t);
  if (grow <= 0 || gone >= 1) return;
  if (layer === 'front') {   // the point it closes into
    if (close > 0.85) { const f = 1 - gone; p.glow(MC[0], MC[1], 10, C[6], 0.3 * f); p.line(MC[0] - 6 * f, MC[1], MC[0] + 6 * f, MC[1], C[6], f); p.line(MC[0], MC[1] - 9 * f, MC[0], MC[1] + 9 * f, C[6], f); }
    return;
  }
  const H = MH * (1 - 0.15 * close), rings = [MW, MW - 5];
  for (let ri = 0; ri < 2; ri++) {
    const W = Math.max(0.5, rings[ri] * (1 - close)), r = (W * W + H * H) / (2 * W), off = r - W, n = 40;
    for (const side of [-1, 1]) {
      const pts = [];
      for (let i = 0; i <= n * grow; i++) {
        const v = -1 + 2 * i / n, yy = v * H, xx = side * (Math.sqrt(Math.max(0, r * r - yy * yy)) - off);
        pts.push([MC[0] + xx, MC[1] - yy]);
      }
      if (pts.length > 1) p.polyline(pts, C[ri === 0 ? 2 : 3], 1 - gone);
      // white flame tongues pointing outward along the outer ring
      if (ri === 0) for (let i = 2; i < pts.length - 1; i += 3) {
        const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1;
        const nx = side * Math.abs(dy) / l * 1, ny = -dx / l * side * 0;   // mostly outward
        const h = (3 + 2 * Math.sin(t * 6 + i)) * (1 - close);
        p.line(x0, y0, x0 + side * h * 0.9, y0 - h * 0.6 + ny, C[6], 1 - gone);
        p.dot(x0 + side * h * 0.9, y0 - h * 0.6, C[3], 1 - gone);
      }
    }
  }
}

// the lotus seat on the ground: a flat ring of 12 petals lying down
function seat(p, t, layer) {
  const k = smooth(SPREAD + 0.3, PURE - 0.2, t) * (1 - smooth(END - 0.5, END - 0.1, t));
  if (k <= 0) return;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + 0.13, front = Math.sin(a) > 0;
    if (front !== (layer === 'front')) continue;
    const x = TX + Math.cos(a) * 18, y = Math.sin(a) * 3.5 - 0.5, ox = Math.cos(a) * 12 * k, oy = Math.sin(a) * 2.6 * k;
    p.poly([[x - 3 * Math.sin(a), y], [x + ox, y + oy], [x + 3 * Math.sin(a), y]], C[5], 1);
    p.polyline([[x - 3 * Math.sin(a), y], [x + ox, y + oy], [x + 3 * Math.sin(a), y]], C[2], 1);
  }
}

// white fire creeping over the body: a burning gold edge growing out from the chest, still candle flames along it
function bleach(p, t) {
  const u = smooth(LAND, PURE - 0.2, t);
  if (u <= 0 || t > ERASE) return;
  const r = 4 + 40 * u;
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * TAU, x = CHEST[0] + Math.cos(a) * r * 0.45, y = CHEST[1] + Math.sin(a) * r;
    if (Math.abs(x - TX) > 12 || y > -1 || y < -54) continue;   // only on the body
    p.dot(x, y, C[Math.sin(t * 20 + i * 2) > 0 ? 6 : 3], 1);
    if (i % 3 === 0) candle(p, x, y, 4 + 3 * hsh(i, 2), t, i);
  }
}

// erasing: the silhouette comes apart from the top down into tiny petals that rise, turn and dim to gold motes
const NP = 110;
const BITS = Array.from({ length: NP }, (_, i) => ({ u: (i + hsh(i, 1)) / NP, x: (hsh(i, 2) - 0.5) * 22, vx: (hsh(i, 3) - 0.5) * 50, vy: -35 - 45 * hsh(i, 4), spin: (hsh(i, 5) - 0.5) * 10, life: 0.8 + 0.7 * hsh(i, 6), s: 0.5 + 0.45 * hsh(i, 7) }));
function petals(p, t) {
  if (t < ERASE) return;
  for (const b of BITS) {
    const tb = ERASE + b.u * ERASE_D, a = t - tb;
    if (a < 0 || a > b.life) continue;
    const y0 = -52 + 55 * b.u, f = a / b.life, x = TX + b.x + b.vx * a + 6 * Math.sin(a * 3 + b.u * 20), y = y0 + b.vy * a - 8 * a * a;
    if (f < 0.6) petal(p, x, y, -Math.PI / 2 + b.spin * a, b.s * (1 - f * 0.5));
    else p.dot(x, y, C[f < 0.8 ? 3 : 2], 1 - (f - 0.8) / 0.2);
  }
  // the burning cut line
  const cu = (t - ERASE) / ERASE_D;
  if (cu < 1) { const y = -52 + 55 * cu; p.line(TX - 11, y, TX + 11, y, C[3], 1); p.line(TX - 8, y - 1, TX + 8, y - 1, C[6], 1); }
}

export function drawBack(p, t) {
  mandorla(p, t, 'back');
  seat(p, t, 'back');
}
export function draw(p, t) {
  // the petal in the fingers / drifting
  if (t > 0.2 && t < LAND + 0.05) {
    const [x, y, ang] = petalAt(t), k = smooth(0.2, 0.45, t);
    petal(p, x, y, ang, 1.4, k);
    candle(p, x + Math.cos(ang) * 9, y + Math.sin(ang) * 9, 5, t, 1, k);
    for (let i = 0; i < 6; i++) {   // golden motes rising / trail
      const s = (t * 0.9 + hsh(i, 8)) % 1, d = s * 0.3;
      const [tx, ty] = petalAt(Math.max(0.2, t - d));
      p.dot(tx + (hsh(i, 9) - 0.5) * 6, ty - s * 6, C[2 + (i % 2)], 1 - s);
    }
  }
  if (t >= LAND && t < LAND + 0.3) {   // silent touch: a white point and a thin gold ripple
    const a = (t - LAND) / 0.3, r = 3 + 16 * out3(a);
    const pts = []; for (let i = 0; i <= 24; i++) { const q = (i / 24) * TAU; pts.push([CHEST[0] + Math.cos(q) * r, CHEST[1] + Math.sin(q) * r]); }
    p.polyline(pts, C[2], 1 - a);
    p.disc(CHEST[0], CHEST[1], 2 * (1 - a), C[6], 1);
  }
  bleach(p, t);
  seat(p, t, 'front');
  mandorla(p, t, 'front');
  petals(p, t);
  // the last small white flame on the lotus seat
  if (t > ERASE + 0.4 && t < END - 0.15) {
    const k = smooth(ERASE + 0.4, ERASE + 0.6, t), h = 9 * k * (1 - smooth(CALM + 0.3, END - 0.2, t));
    candle(p, TX, -1, h, t, 7);
  }
}
