// DRAFT v2 (motion + shape blocking) — Di Hoa 5: Tinh Lien Yeu Hoa. Script: design/di-hoa/05-tinh-lien-yeu-hoa.md (v2).
// A white lotus made of flickering flame blooms on the target; a huge beast eye in the sky opens in three jerks, each
// pouring down a pale sunbeam; fully open, its pupil narrows to a slit, the lotus crushes in and explodes into dust.
import { smooth, clamp, TAU, READY, hex } from '../../core/index.js';

// lotus / light: 0 dark-brown edge ... 6 white
const L = ['#3a2e1c', '#8a6a2a', '#c9a24a', '#e9cf8a', '#efe6cf', '#fbf8f0', '#ffffff'].map(hex);
// eye: lid darks, iris ambers, pupil, vein red
const LID = ['#120a10', '#24141e', '#3d2230'].map(hex), IRIS = ['#4a2006', '#8a420c', '#d2861a', '#f4b630', '#ffe07a'].map(hex);
const PUPIL = hex('#050304'), VEIN = hex('#8a1414');
const DUST = ['#2e2722', '#4a3f36', '#6b5d50', '#8f7f6e', '#b3a490'].map(hex);
const TX = 150, END = 5.0, APPEAR = 0.45, OPENS = [0.8, 1.35, 1.9], LEVEL = [0.25, 0.6, 1], LOCK = 2.0, BOOM = 2.35;
const LC = [TX, -24], EC = [TX, -188], EW = 64, EH = 21, IR = 19;   // lotus centre; eye centre, half width, half open height, iris radius
const sm = (u) => u * u * (3 - 2 * u), out3 = (u) => 1 - (1 - u) ** 3;
const hsh = (i, s = 0) => { const h = Math.sin(i * 91.7 + s * 47.3) * 43758.5453; return h - Math.floor(h); };

export const meta = {
  name: 'Tinh Lien Draft',
  desc: 'Motion draft v2: a flickering white flame-lotus blooms on the target, a beast eye opens in the sky pouring a pale sunbeam, then the lotus crushes and explodes into a dust storm.',
  tags: ['di-hoa', 'draft', 'fire', 'eye', 'light', 'explosion', 'one-shot'],
  size: [360, 260], origin: [60, 235], duration: END, loop: false, fps: 30, bg: 'ground', actor: 2,
  options: { seed: 5 },
};
const RAISE = { ...READY, crouch: 0, lean: -2, fx: 10, fy: -44, bx: 7, by: -40 };
const GRIP = { ...READY, crouch: 3, lean: 2, fx: 15, fy: -36, bx: 7, by: -33, armsFront: true };
const BRACE = { ...READY, crouch: 6, lean: -5, fx: 8, fy: -26, bx: 2, by: -22, armsFront: true };
const POSES = [[-0.2, READY], [0.35, RAISE], [LOCK - 0.05, RAISE], [LOCK + 0.05, GRIP, 'snap'], [BOOM, GRIP], [BOOM + 0.1, BRACE, 'snap'], [3.6, BRACE], [END, READY]];

// eye opening over time: three jerks (fast overshoot, settle), closes again in the dust
function openAt(t) {
  let o = 0;
  for (let i = 0; i < 3; i++) {
    const a = t - OPENS[i];
    if (a < 0) break;
    const prev = i ? LEVEL[i - 1] : 0, u = clamp(a / 0.12);
    o = prev + (LEVEL[i] - prev) * (out3(u) + 0.15 * Math.sin(Math.min(1, a / 0.3) * Math.PI) * (1 - u * 0.5));
  }
  if (t < OPENS[0]) o = 0.04 * smooth(APPEAR, OPENS[0], t) * (1 + Math.sin(t * 30));   // twitching while shut
  return Math.max(0, o * (1 - smooth(3.0, 3.6, t)));
}
const eyeK = (t) => smooth(APPEAR - 0.1, APPEAR + 0.25, t) * (1 - smooth(3.4, 4.0, t));
const pupilW = (t) => { const lock = smooth(LOCK - 0.05, LOCK + 0.15, t); return (2.5 + 4.5 * openAt(t)) * (1 - 0.7 * lock); };

const ticks = [];
for (let i = 0; i < 3; i++) {
  const h = { t: OPENS[i] + 0.03, stop: 0.04, shake: 0.12 + 0.08 * i, amp: 1.5 + i, push: 0.4 + 0.2 * i, straw: 4 + 3 * i, flash: 0.03 };
  if (i === 2) h.skin = 'holy';
  ticks.push(h);
  const t1 = i < 2 ? OPENS[i + 1] : BOOM - 0.1;
  for (let t = OPENS[i] + 0.15; t < t1 - 0.05; t += 0.12) ticks.push({ t, shake: 0.05 + 0.03 * i, amp: 0.8, push: 0.1, straw: 1 + i, flash: 0 });
}
export const act = {
  target: { x: TX },
  poses: POSES,
  hits: [
    { t: APPEAR, stop: 0.03, shake: 0.06, amp: 1, push: 0.2, straw: 0, flash: 0.02 },
    ...ticks,
    { t: BOOM, stop: 0.16, shake: 0.8, amp: 6, push: 3.5, straw: 40, flash: 0.08, skin: 'char' },
    { t: END - 0.35, push: 0, straw: 0, flash: 0, skin: null },
  ],
};

// ---------------------------------------------------------------- the beast eye
function eye(p, t) {
  const k = eyeK(t);
  if (k <= 0) return;
  const op = openAt(t), H = EH * op, pw = pupilW(t), look = 0.6 * Math.sin(t * 1.3);   // the pupil drifts a little, always on the target
  const lidH = 5 + 3 * k;   // thickness of the dark lid rim
  p.shade(EC[0] - EW - 6, EC[1] - EH - 14, EC[0] + EW + 6, EC[1] + EH + 10, (x, y, o) => {
    const dx = x - EC[0], dy = y - EC[1], u = dx / EW;
    if (Math.abs(u) > 1.08) return;
    const prof = Math.pow(Math.max(0, 1 - u * u), 0.75), top = -H * prof - 0.5, bot = H * 0.75 * prof + 0.5;
    const pl = Math.pow(Math.max(0, 1 - (u / 1.08) ** 2), 0.6), lt = -(H + lidH) * pl - 1.5, lb = (H * 0.75 + lidH * 0.7) * pl + 1.5;
    if (dy < lt || dy > lb) return;
    if (dy < top || dy > bot) {   // the lids: dark, a lighter crease line, a hot rim right at the opening
      const rim = dy < top ? top - dy : dy - bot;
      o.c = rim < 1 ? IRIS[1] : (Math.abs(dy - (top - lidH * 0.6)) < 0.6 ? LID[2] : LID[rim < 3 ? 1 : 0]); o.a = k; return;
    }
    // inside the eye: iris (amber, radial streaks), red ring round a vertical slit pupil, dark corners
    const ix = dx - look, d = Math.hypot(ix, dy), ang = Math.atan2(dy, ix);
    if (d > IR) { const vein = Math.abs(Math.sin(ang * 5 + Math.sin(d * 0.3 + ang * 3) * 0.8)) > 0.97; o.c = Math.abs(u) > 0.8 ? LID[1] : vein ? VEIN : (d < IR + 3 ? IRIS[1] : IRIS[0]); o.a = k; return; }
    const slit = (ix / pw) ** 2 + (dy / (IR * 0.95)) ** 2;
    if (slit < 1) { o.c = PUPIL; o.a = k; return; }
    if (slit < 1.6) { o.c = VEIN; o.a = k; return; }
    const streak = Math.sin(ang * 23 + Math.sin(ang * 5) * 2) * 0.5 + 0.5, r = d / IR;
    o.c = r > 0.92 ? IRIS[0] : IRIS[Math.max(0, Math.min(4, Math.round(4 - r * 3 + streak * 1.4 - 0.6)))]; o.a = k;
  });
  if (op > 0.2) { p.dot(EC[0] + look - 7, EC[1] - H * 0.45, L[6], k); p.dot(EC[0] + look - 6, EC[1] - H * 0.45, L[5], k); }   // a catch-light
  // flame lashes along both lids, flickering gold
  for (let i = 0; i <= 16; i++) {
    const u = -1 + 2 * i / 16, prof = Math.pow(Math.max(0, 1 - u * u), 0.6), x = EC[0] + u * EW * 1.04;
    const h = (3 + 3 * hsh(i, 3)) * (0.7 + 0.3 * Math.sin(t * 13 + i * 2.1)) * (0.6 + 0.4 * prof), lean = u * 2;
    const yt = EC[1] - (H + lidH) * prof - 1.5, yb = EC[1] + (H * 0.75 + lidH * 0.7) * prof + 1.5;
    p.line(x, yt, x + lean, yt - h, L[i % 3 ? 3 : 2], k);
    p.dot(x + lean, yt - h, L[5], k);
    if (i % 2 === 0) p.line(x, yb, x + lean * 0.6, yb + h * 0.5, L[2], k);
  }
}

// ---------------------------------------------------------------- the pale sunbeam
function beam(p, t) {
  const op = openAt(t), k = eyeK(t);
  if (op < 0.05 || t > BOOM + 0.15) return;
  const lock = smooth(LOCK, BOOM, t), flashes = OPENS.reduce((s, o) => s + Math.exp(-(((t - o - 0.05) / 0.06) ** 2)), 0);
  const y0 = EC[1] + 4, y1 = 0, wTop = 3 + 6 * op, wBot = (10 + 34 * op) * (1 - 0.8 * lock), str = (0.08 + 0.14 * op + 0.2 * flashes) * k * (1 - smooth(BOOM, BOOM + 0.15, t));
  p.shade(TX - wBot - 2, y0, TX + wBot + 2, y1, (x, y, o) => {
    const v = (y - y0) / (y1 - y0), w = wTop + (wBot - wTop) * v, e = Math.abs(x - TX) / w;
    if (e > 1) return;
    const ray = 0.75 + 0.25 * Math.sin(x * 0.7 - y * 0.05 + t * 3);   // faint rays inside
    o.l = e < 0.3 ? L[6] : L[4]; o.k = str * (1 - e * e) * ray;
  });
  // motes drifting down the beam; a pool of light on the ground
  for (let i = 0; i < 20; i++) {
    const s = (t * 0.5 + hsh(i, 4)) % 1, y = y0 + (y1 - y0) * s, w = wTop + (wBot - wTop) * s;
    p.dot(TX + (hsh(i, 5) * 2 - 1) * w * 0.8, y, L[4 + (i % 3)], k * (0.5 + 0.5 * op));
  }
  const pr = wBot * 1.1;
  p.shade(TX - pr, -4, TX + pr, 2, (x, y, o) => { const e = ((x - TX) / pr) ** 2 + ((y + 1) / 3) ** 2; if (e < 1) { o.l = L[5]; o.k = (1 - e) * str * 1.6; } });
}

// ---------------------------------------------------------------- the flame lotus
const RINGS = [   // outer, middle, bud: count, length, width, spread (rad from vertical)
  { n: 6, len: 30, w: 17, spread: 1.25 },
  { n: 5, len: 27, w: 15, spread: 0.8 },
  { n: 3, len: 21, w: 12, spread: 0.3 },
];
function flamePetal(p, bx, by, ang, len, w, t, seed, col, edge, k) {
  const c = Math.cos(ang), s = Math.sin(ang), left = [], right = [];
  for (let i = 0; i <= 8; i++) {
    const u = i / 8, wob = 1 + 0.25 * Math.sin(t * 11 + seed * 5 + u * 6) + 0.12 * Math.sin(t * 23 + seed + u * 11);
    const half = w * Math.sin(Math.PI * Math.pow(u, 0.75)) * 0.5 * wob, bend = 2.2 * Math.sin(t * 6 + seed * 3) * u * u;
    left.push([u * len, -half + bend]); right.push([u * len, half + bend]);
  }
  // the tip licks off as a flame tongue
  const tl = len * (1.08 + 0.12 * Math.sin(t * 17 + seed * 7)), tb = 2 * Math.sin(t * 9 + seed * 2);
  const pts = [...left, [tl, tb], ...right.reverse()].map(([a, b]) => [bx + a * c - b * s, by + a * s + b * c]);
  p.poly(pts, col, k);
  p.polyline([...pts, pts[0]], edge, k);
  p.line(bx + c * len * 0.1, by + s * len * 0.1, bx + c * len * 0.6, by + s * len * 0.6, L[3], k);
}
function lotus(p, t, layer) {
  if (t < APPEAR - 0.05 || t > BOOM + 0.02) return;
  const born = out3(clamp((t - APPEAR + 0.05) / 0.25)), crush = sm(clamp((t - LOCK) / (BOOM - LOCK)));
  const breathe = 1 + 0.08 * Math.sin(t * 7) + 0.04 * Math.sin(t * 17), size = born * breathe * (1 - 0.7 * crush) * (1 + 0.1 * Math.sin(t * 40) * crush);
  const sway = 0.12 * Math.sin(t * 3.1) + 0.05 * Math.sin(t * 8.3), white = crush > 0.6;
  const ring = (R, ri) => {
    for (let j = 0; j < R.n; j++) {
      const f = j / (R.n - 1) - 0.5, ang = -Math.PI / 2 + sway + f * 2 * R.spread * (1 - 0.6 * crush);
      flamePetal(p, LC[0] + f * 6 * size, LC[1] + 6 * size, ang, R.len * size, R.w * size, t, ri * 10 + j, white ? L[6] : L[ri === 0 ? 4 : 5], white ? L[4] : L[ri === 0 ? 2 : 3], 1);
    }
  };
  if (layer === 'back') { ring(RINGS[0], 0); return; }
  ring(RINGS[1], 1); ring(RINGS[2], 2);
  // the seat: a flat flickering cup, golden heart
  for (let i = -3; i <= 3; i++) flamePetal(p, LC[0] + i * 3 * size, LC[1] + 7 * size, Math.PI / 2 + i * 0.35 + sway, 6 * size, 4 * size, t, 40 + i, L[4], L[2], 1);
  p.disc(LC[0], LC[1] + 3 * size, 2.5 * size, white ? L[6] : L[3], 1);
  if (crush > 0.3) p.glow(LC[0], LC[1], 8 + 20 * crush, L[6], 0.3 * crush);
  for (let i = 0; i < 8; i++) {   // white embers flicking off
    const s = (t * 1.3 + hsh(i, 6)) % 1, a = -Math.PI / 2 + (hsh(i, 7) - 0.5) * 2.2;
    p.dot(LC[0] + Math.cos(a) * (10 + 16 * s) * size, LC[1] + Math.sin(a) * (10 + 16 * s) * size, L[5 - (i % 3)], 1 - s);
  }
}

// ---------------------------------------------------------------- explosion: flash, ground shockwave, dust storm, flying earth
const PUFFS = Array.from({ length: 90 }, (_, i) => {
  const side = i % 2 ? 1 : -1, far = hsh(i, 1);
  return { vx: side * (40 + 260 * far * far), vy: -(10 + 130 * hsh(i, 2)) * (1 - far * 0.6), r0: 3 + 4 * hsh(i, 3), r1: 10 + 14 * hsh(i, 4), life: 1.5 + 0.9 * hsh(i, 5), c: Math.floor(hsh(i, 6) * 4), d: hsh(i, 7) * 0.12 };
});
const ROCKS = Array.from({ length: 34 }, (_, i) => ({ vx: (hsh(i, 8) - 0.5) * 300, vy: -60 - 220 * hsh(i, 9), s: 1 + Math.floor(hsh(i, 10) * 3), c: Math.floor(hsh(i, 11) * 3) }));
function boom(p, t, layer) {
  const a = t - BOOM;
  if (a < 0) return;
  if (layer === 'front' && a < 0.25) {   // white flash + flat shockwave along the ground
    const f = 1 - a / 0.25;
    p.glow(LC[0], LC[1], 40, L[6], 0.35 * f);
    p.disc(LC[0], LC[1], 14 * f, L[6], 1);
    const r = 20 + 220 * out3(a / 0.25), pts = [];
    for (let i = 0; i <= 48; i++) { const q = (i / 48) * TAU; pts.push([TX + Math.cos(q) * r, -2 + Math.sin(q) * r * 0.12]); }
    p.polyline(pts, L[5], f);
  }
  // dust: billowing puffs rolling out along the ground and up, slowly thinning
  for (let i = 0; i < PUFFS.length; i++) {
    const P = PUFFS[i], b = a - P.d;
    if (b < 0 || b > P.life) continue;
    if ((layer === 'front') !== (i % 3 !== 0)) continue;
    const drag = (1 - Math.exp(-2.6 * b)) / 2.6, x = TX + P.vx * drag, y = Math.min(-P.r0 * 0.6, -6 + P.vy * drag - 6 * b), f = b / P.life;
    const r = P.r0 + (P.r1 - P.r0) * out3(Math.min(1, b / 0.8)), shrink = 1 - smooth(0.55, 1, f);
    const c = Math.min(4, P.c + (b < 0.15 ? 2 : 0));
    p.disc(x, y, r * shrink, DUST[c], 0.7 - 0.35 * f);
    p.disc(x - r * 0.25, y - r * 0.3, r * 0.55 * shrink, DUST[Math.min(4, c + 1)], 0.8 - 0.4 * f);
  }
  // a haze of dust filling the lower canvas, thinning slowly from the top down
  if (layer === 'front' && a > 0.1) {
    const grow = out3(clamp((a - 0.1) / 0.6)), thin = smooth(0.9, 2.2, a), top = -40 - 110 * grow, half = 40 + 230 * grow;
    p.shade(TX - half, top, TX + half, 0, (x, y, o) => {
      const e = Math.abs(x - TX) / half, v = (y - top) / -top;
      const n = 0.5 + 0.35 * Math.sin(x * 0.08 + a * 1.2 + 1.5 * Math.sin(y * 0.07)) * Math.sin(y * 0.12 - a * 0.8 + Math.sin(x * 0.05)) + 0.15 * Math.sin(x * 0.21 + y * 0.17);
      const dens = (1 - e * e) * v * (0.6 + 0.6 * n) - thin * 1.1;
      if (dens <= 0.05) return;
      o.c = DUST[n > 0.6 ? 3 : 2]; o.a = Math.min(0.75, dens);
    });
  }
  // flying earth: chunks on parabolas, landing and lying still
  if (layer === 'front') for (const R of ROCKS) {
    const tl = (2 * -R.vy) / 520, b = Math.min(a, tl), x = TX + R.vx * b, y = Math.min(0, -4 + R.vy * b + 260 * b * b);
    const k = 1 - smooth(2.0, 2.5, a);
    p.disc(x, y - R.s * 0.5, R.s * 0.7, DUST[R.c], k);
    if (a < tl) p.dot(x - R.vx * 0.01, y - (R.vy + 520 * b) * 0.01, DUST[R.c + 1], k * 0.8);
  }
  // a scorched crater
  if (layer === 'back') { const k = 1 - smooth(2.0, 2.6, a); p.shade(TX - 30, -3, TX + 30, 1, (x, y, o) => { const e = ((x - TX) / 30) ** 2 + ((y + 1) / 2.5) ** 2; if (e < 1) { o.c = DUST[0]; o.a = k; } }); }
}

export function drawBack(p, t) {
  eye(p, t);
  beam(p, t);
  lotus(p, t, 'back');
  boom(p, t, 'back');
}
export function draw(p, t) {
  lotus(p, t, 'front');
  boom(p, t, 'front');
}
