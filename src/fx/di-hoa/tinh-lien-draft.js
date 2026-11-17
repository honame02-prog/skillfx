// DRAFT v3 (motion + shape blocking) — Di Hoa 5: Tinh Lien Yeu Hoa. Script: design/di-hoa/05-tinh-lien-yeu-hoa.md (v3).
// Clouds gather; a white lotus of flickering flame blooms on the target; a beast eye parts the clouds and opens in three
// jerks, its gaze a pale sunbeam; it stares, rocks float up, then the gaze focuses to a searing ray, the ground cracks,
// the lotus crushes and explodes: a cone of dust bursts up, a giant ghost lotus burns inside it, then all settles.
import { smooth, clamp, TAU, READY, hex } from '../../core/index.js';

// lotus / light: 0 dark-brown edge ... 6 white
const L = ['#3a2e1c', '#8a6a2a', '#c9a24a', '#e9cf8a', '#efe6cf', '#fbf8f0', '#ffffff'].map(hex);
const LID = ['#120a10', '#24141e', '#3d2230'].map(hex), IRIS = ['#4a2006', '#8a420c', '#d2861a', '#f4b630', '#ffe07a'].map(hex);
const PUPIL = hex('#050304'), VEIN = hex('#8a1414');
const DUST = ['#2e2722', '#4a3f36', '#6b5d50', '#8f7f6e', '#b3a490'].map(hex);
const CLOUD = ['#16121c', '#221c2a', '#302838', '#43384a'].map(hex);
const TX = 150, END = 6.5, GATHER = 0.0, APPEAR = 0.6, OPENS = [1.0, 1.6, 2.2], LEVEL = [0.25, 0.6, 1], LOCK = 3.0, BOOM = 3.4;
const SHUT = [4.9, 5.5], GHOST = [3.9, 4.9];
const LC = [TX, -24], EC = [TX, -192], EW = 64, EH = 21, IR = 19;
const sm = (u) => u * u * (3 - 2 * u), out3 = (u) => 1 - (1 - u) ** 3;
const hsh = (i, s = 0) => { const h = Math.sin(i * 91.7 + s * 47.3) * 43758.5453; return h - Math.floor(h); };

export const meta = {
  name: 'Tinh Lien Draft',
  desc: 'Motion draft v3: clouds part for a beast eye whose gaze is a pale sunbeam on a flickering flame-lotus; the gaze focuses, the lotus explodes into a towering cone of dust with a ghost lotus burning inside.',
  tags: ['di-hoa', 'draft', 'fire', 'eye', 'light', 'explosion', 'one-shot'],
  size: [360, 260], origin: [60, 235], duration: END, loop: false, fps: 30, bg: 'ground', actor: 2,
  options: { seed: 5 },
};
const RAISE = { ...READY, crouch: 0, lean: -2, fx: 10, fy: -44, bx: 7, by: -40 };
const GRIP = { ...READY, crouch: 3, lean: 2, fx: 15, fy: -36, bx: 7, by: -33, armsFront: true };
const BRACE = { ...READY, crouch: 6, lean: -5, fx: 8, fy: -26, bx: 2, by: -22, armsFront: true };
const POSES = [[-0.2, READY], [0.4, RAISE], [LOCK - 0.05, RAISE], [LOCK + 0.05, GRIP, 'snap'], [BOOM, GRIP], [BOOM + 0.1, BRACE, 'snap'], [5.0, BRACE], [END, READY]];

function openAt(t) {
  let o = 0;
  for (let i = 0; i < 3; i++) {
    const a = t - OPENS[i];
    if (a < 0) break;
    const prev = i ? LEVEL[i - 1] : 0, u = clamp(a / 0.12);
    o = prev + (LEVEL[i] - prev) * (out3(u) + 0.15 * Math.sin(Math.min(1, a / 0.3) * Math.PI) * (1 - u * 0.5));
  }
  if (t < OPENS[0]) o = 0.04 * smooth(APPEAR, OPENS[0], t) * (1 + Math.sin(t * 30));
  return Math.max(0, o * (1 - smooth(SHUT[0], SHUT[1], t)));
}
const eyeK = (t) => smooth(APPEAR - 0.1, APPEAR + 0.25, t) * (1 - smooth(SHUT[1] - 0.1, SHUT[1] + 0.4, t));
const lockAt = (t) => smooth(LOCK - 0.05, LOCK + 0.2, t);
const pupilW = (t) => (2.5 + 4.5 * openAt(t)) * (1 - 0.7 * lockAt(t)) * (1 + 0.6 * smooth(BOOM + 0.3, BOOM + 0.8, t));
const pulses = (t) => OPENS.reduce((s, o) => s + Math.exp(-(((t - o - 0.05) / 0.06) ** 2)), 0);

const ticks = [];
for (let i = 0; i < 3; i++) {
  const h = { t: OPENS[i] + 0.05, stop: 0.04, shake: 0.12 + 0.08 * i, amp: 1.5 + i, push: 0.4 + 0.2 * i, straw: 4 + 3 * i, flash: 0.03 };
  if (i === 2) h.skin = 'holy';
  ticks.push(h);
  const t1 = i < 2 ? OPENS[i + 1] : LOCK;
  for (let t = OPENS[i] + 0.15; t < t1 - 0.05; t += 0.12) ticks.push({ t, shake: 0.05 + 0.03 * i, amp: 0.8, push: 0.1, straw: 1 + i, flash: 0 });
}
for (let t = LOCK + 0.05; t < BOOM - 0.03; t += 0.06) ticks.push({ t, shake: 0.12, amp: 1.2, push: 0.05, straw: 1, flash: 0 });   // the searing ray
export const act = {
  target: { x: TX },
  poses: POSES,
  hits: [
    { t: APPEAR, stop: 0.03, shake: 0.06, amp: 1, push: 0.2, straw: 0, flash: 0.02 },
    ...ticks,
    { t: BOOM, stop: 0.2, shake: 1, amp: 7, push: 3.5, straw: 45, flash: 0.08, skin: 'char' },
    { t: 4.1, shake: 0.35, amp: 3, push: 1.2, straw: 10, flash: 0 },
    { t: 4.5, stop: 0.06, shake: 0.5, amp: 4, push: 1.8, straw: 16, flash: 0.04 },
    { t: END - 0.4, push: 0, straw: 0, flash: 0, skin: null },
  ],
};

// ---------------------------------------------------------------- clouds gathering, parted by the eye
function clouds(p, t) {
  const k = smooth(GATHER, 0.6, t) * (1 - smooth(5.0, 6.0, t));
  if (k <= 0) return;
  const op = openAt(t), push = op + 0.3 * smooth(APPEAR, OPENS[0], t) + 0.6 * smooth(5.0, 6.0, t);
  const hx = 40 + 70 * push, hy = 12 + 22 * push, swirl = t * 0.25;
  p.shade(-60, -235, 300, -128, (x, y, o) => {
    const dx = (x - EC[0]) / hx, dy = (y - EC[1]) / hy, r = Math.hypot(dx, dy);
    const ang = Math.atan2(y - EC[1], (x - EC[0]) * 0.4) + swirl;
    const n = 0.5 + 0.3 * Math.sin(ang * 5 + r * 3 - t * 0.8) * Math.sin(x * 0.04 - t * 0.5 + y * 0.09) + 0.2 * Math.sin(x * 0.11 + y * 0.07 + ang * 3);
    const lower = (-128 - y) / 60;   // thins out downward
    const dens = (n * 1.1 + Math.min(1, lower) * 0.5 - 0.35) * k * smooth(1, 1.35 + 0.3 * n, r);
    if (dens <= 0.12) return;
    const rim = r < 1.12 + 0.08 * n && op > 0.05;   // lit by the eye at the edge of the gap
    o.c = rim ? (n > 0.62 ? IRIS[1] : CLOUD[3]) : CLOUD[dens > 0.75 ? 2 : dens > 0.45 ? 1 : 0]; o.a = Math.min(1, dens * 1.4);
  });
}

// ---------------------------------------------------------------- the beast eye
function eye(p, t) {
  const k = eyeK(t);
  if (k <= 0) return;
  const op = openAt(t), H = EH * op, pw = pupilW(t), look = 0.6 * Math.sin(t * 1.3), lidH = 5 + 3 * k;
  p.shade(EC[0] - EW - 6, EC[1] - EH - 14, EC[0] + EW + 6, EC[1] + EH + 10, (x, y, o) => {
    const dx = x - EC[0], dy = y - EC[1], u = dx / EW;
    if (Math.abs(u) > 1.08) return;
    const prof = Math.pow(Math.max(0, 1 - u * u), 0.75), top = -H * prof - 0.5, bot = H * 0.75 * prof + 0.5;
    const pl = Math.pow(Math.max(0, 1 - (u / 1.08) ** 2), 0.6), lt = -(H + lidH) * pl - 1.5, lb = (H * 0.75 + lidH * 0.7) * pl + 1.5;
    if (dy < lt || dy > lb) return;
    if (dy < top || dy > bot) {
      const rim = dy < top ? top - dy : dy - bot;
      o.c = rim < 1 ? IRIS[1] : (Math.abs(dy - (top - lidH * 0.6)) < 0.6 ? LID[2] : LID[rim < 3 ? 1 : 0]); o.a = k; return;
    }
    const ix = dx - look, d = Math.hypot(ix, dy), ang = Math.atan2(dy, ix);
    if (d > IR) { const vein = Math.abs(Math.sin(ang * 5 + Math.sin(d * 0.3 + ang * 3) * 0.8)) > 0.97; o.c = Math.abs(u) > 0.8 ? LID[1] : vein ? VEIN : (d < IR + 3 ? IRIS[1] : IRIS[0]); o.a = k; return; }
    const slit = (ix / pw) ** 2 + (dy / (IR * 0.95)) ** 2;
    if (slit < 1) { o.c = PUPIL; o.a = k; return; }
    if (slit < 1.6) { o.c = VEIN; o.a = k; return; }
    const streak = Math.sin(ang * 23 + Math.sin(ang * 5) * 2) * 0.5 + 0.5, r = d / IR;
    o.c = r > 0.92 ? IRIS[0] : IRIS[Math.max(0, Math.min(4, Math.round(4 - r * 3 + streak * 1.4 - 0.6 + 0.8 * lockAt(t))))]; o.a = k;
  });
  if (op > 0.2) { p.dot(EC[0] + look - 7, EC[1] - H * 0.45, L[6], k); p.dot(EC[0] + look - 6, EC[1] - H * 0.45, L[5], k); }
  for (let i = 0; i <= 16; i++) {   // flame lashes
    const u = -1 + 2 * i / 16, prof = Math.pow(Math.max(0, 1 - u * u), 0.6), x = EC[0] + u * EW * 1.04;
    const h = (3 + 3 * hsh(i, 3)) * (0.7 + 0.3 * Math.sin(t * 13 + i * 2.1)) * (0.6 + 0.4 * prof) * (1 + 0.6 * lockAt(t)), lean = u * 2;
    const yt = EC[1] - (H + lidH) * prof - 1.5, yb = EC[1] + (H * 0.75 + lidH * 0.7) * prof + 1.5;
    p.line(x, yt, x + lean, yt - h, L[i % 3 ? 3 : 2], k);
    p.dot(x + lean, yt - h, L[5], k);
    if (i % 2 === 0) p.line(x, yb, x + lean * 0.6, yb + h * 0.5, L[2], k);
  }
}

// ---------------------------------------------------------------- the gaze: a pale sunbeam
function beam(p, t) {
  const op = openAt(t), k = eyeK(t);
  if (op < 0.05 || t > BOOM + 0.12) return;
  const lock = lockAt(t), fl = pulses(t), y0 = EC[1] + 5, y1 = LC[1] + 4 * lock;   // when focused it stops on the lotus
  const wTop = (3 + 6 * op) * (1 - 0.6 * lock), wBot = (10 + 34 * op) * (1 - 0.92 * lock) + 1, fade = 1 - smooth(BOOM, BOOM + 0.1, t);
  const str = (0.07 + 0.12 * op + 0.18 * fl + 0.35 * lock) * k * fade;
  p.shade(TX - wBot * 1.5 - 2, y0, TX + wBot * 1.5 + 2, 0, (x, y, o) => {
    const v = (y - y0) / (0 - y0), w = wTop + (wBot - wTop) * v, e = Math.abs(x - TX) / w;
    if (e > 1.5 || (lock > 0.5 && y > y1)) return;
    // pulses running down the beam at each opening
    let band = 0;
    for (const o0 of OPENS) { const s = (t - o0) / 0.25; if (s > 0 && s < 1.2) band += Math.exp(-(((v - s) / 0.06) ** 2)) * (1 - s / 1.2); }
    const ray = 0.7 + 0.3 * Math.sin((x - TX) / w * 9 + Math.sin(t * 1.7 + v * 2) * 1.5);   // god rays, swaying
    if (e > 1) { o.l = L[3]; o.k = str * 0.35 * (1.5 - e) * 2 * ray; return; }   // soft halo
    o.l = e < 0.25 ? L[6] : L[4]; o.k = Math.min(0.9, str * (1 - e * e) * ray + band * 0.35 * k + (lock > 0.3 && e < 0.4 ? 0.4 * lock : 0));
  });
  for (let i = 0; i < 22; i++) {   // motes drifting down; heat rising from the ground
    const s = (t * 0.5 + hsh(i, 4)) % 1, y = y0 + (0 - y0) * s, w = wTop + (wBot - wTop) * s;
    if (y > y1 + 2 && lock > 0.5) continue;
    p.dot(TX + (hsh(i, 5) * 2 - 1) * w * 0.8, y, L[4 + (i % 3)], k * (0.5 + 0.5 * op) * fade);
    const s2 = (t * 0.9 + hsh(i, 12)) % 1;
    if (i < 12 && lock < 0.5) p.dot(TX + (hsh(i, 13) * 2 - 1) * wBot * 0.9 + Math.sin(t * 6 + i) * 1.5, -2 - s2 * 26, L[3], (1 - s2) * op * fade);
  }
  // the gaze mark on the ground: a pool of light, and the iris pattern turning slowly
  const pr = wBot * 1.15;
  p.shade(TX - pr, -4, TX + pr, 2, (x, y, o) => { const e = ((x - TX) / pr) ** 2 + ((y + 1) / 3) ** 2; if (e < 1) { o.l = L[5]; o.k = (1 - e) * str * 1.6; } });
  if (op > 0.3 && lock < 0.8) for (let i = 0; i < 18; i++) {
    const a = (i / 18) * TAU + t * 0.6, r0 = pr * 0.85, r1 = pr * (1.05 + 0.1 * Math.sin(t * 5 + i));
    p.line(TX + Math.cos(a) * r0, -1 + Math.sin(a) * r0 * 0.12, TX + Math.cos(a) * r1, -1 + Math.sin(a) * r1 * 0.12, IRIS[i % 2 ? 2 : 3], (op - 0.3) * (1 - lock) * fade);
  }
  if (lock > 0.3) for (let i = 0; i < 6; i++) {   // sparks where the searing ray strikes the lotus
    const s = (t * 4 + hsh(i, 14)) % 1, a = -Math.PI / 2 + (hsh(i, 15) - 0.5) * 3;
    p.line(TX + Math.cos(a) * s * 10, y1 + Math.sin(a) * s * 10, TX + Math.cos(a) * (s * 10 + 3), y1 + Math.sin(a) * (s * 10 + 3), L[6], (1 - s) * lock * fade);
  }
}

// ---------------------------------------------------------------- the flame lotus
const RINGS = [
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
  const tl = len * (1.08 + 0.12 * Math.sin(t * 17 + seed * 7)), tb = 2 * Math.sin(t * 9 + seed * 2);
  const pts = [...left, [tl, tb], ...right.reverse()].map(([a, b]) => [bx + a * c - b * s, by + a * s + b * c]);
  p.poly(pts, col, k);
  p.polyline([...pts, pts[0]], edge, k);
  p.line(bx + c * len * 0.1, by + s * len * 0.1, bx + c * len * 0.6, by + s * len * 0.6, L[3], k);
}
function lotusShape(p, t, layer, cx, cy, size, white, k, petalCol) {
  const sway = 0.12 * Math.sin(t * 3.1) + 0.05 * Math.sin(t * 8.3), crush = white;
  const ring = (R, ri) => {
    for (let j = 0; j < R.n; j++) {
      const f = j / (R.n - 1) - 0.5, ang = -Math.PI / 2 + sway + f * 2 * R.spread * (1 - 0.6 * crush);
      flamePetal(p, cx + f * 6 * size, cy + 6 * size, ang, R.len * size, R.w * size, t, ri * 10 + j, petalCol ?? (crush > 0.6 ? L[6] : L[ri === 0 ? 4 : 5]), crush > 0.6 ? L[4] : L[ri === 0 ? 2 : 3], k);
    }
  };
  if (layer === 'back') { ring(RINGS[0], 0); return; }
  ring(RINGS[1], 1); ring(RINGS[2], 2);
  for (let i = -3; i <= 3; i++) flamePetal(p, cx + i * 3 * size, cy + 7 * size, Math.PI / 2 + i * 0.35 + sway, 6 * size, 4 * size, t, 40 + i, petalCol ?? L[4], L[2], k);
}
function lotus(p, t, layer) {
  if (t < APPEAR - 0.05 || t > BOOM + 0.02) return;
  const born = out3(clamp((t - APPEAR + 0.05) / 0.25)), crush = sm(clamp((t - LOCK) / (BOOM - LOCK))), stare = smooth(OPENS[2], LOCK, t);
  const breathe = 1 + (0.08 + 0.08 * stare) * Math.sin(t * (7 + 6 * stare)) + 0.04 * Math.sin(t * 17);
  const size = born * breathe * (1 - 0.7 * crush) * (1 + 0.1 * Math.sin(t * 40) * crush);
  lotusShape(p, t, layer, LC[0], LC[1], size, crush, 1);
  if (layer !== 'front') return;
  p.disc(LC[0], LC[1] + 3 * size, 2.5 * size, crush > 0.6 ? L[6] : L[3], 1);
  if (crush > 0.3) p.glow(LC[0], LC[1], 8 + 20 * crush, L[6], 0.3 * crush);
  for (let i = 0; i < 8; i++) {
    const s = (t * 1.3 + hsh(i, 6)) % 1, a = -Math.PI / 2 + (hsh(i, 7) - 0.5) * 2.2;
    p.dot(LC[0] + Math.cos(a) * (10 + 16 * s) * size, LC[1] + Math.sin(a) * (10 + 16 * s) * size, L[5 - (i % 3)], 1 - s);
  }
}

// ---------------------------------------------------------------- the stare: rocks float up, the ground cracks
const FLOAT = Array.from({ length: 16 }, (_, i) => ({ x: TX + (hsh(i, 20) - 0.5) * 110, h: 8 + 34 * hsh(i, 21), s: 1 + Math.floor(hsh(i, 22) * 3), c: Math.floor(hsh(i, 23) * 3), d: hsh(i, 24) * 0.4, vx: (hsh(i, 25) - 0.5) * 2 }));
function stare(p, t, layer) {
  if (layer !== 'front' || t < OPENS[2] || t > BOOM + 1.2) return;
  for (const R of FLOAT) {   // levitating rubble; at the blast it is flung away
    const a = t - OPENS[2] - R.d;
    if (a < 0) continue;
    let x = R.x, y = -R.h * sm(clamp(a / 0.9)) + 1.2 * Math.sin(t * 3 + R.h);
    if (t > LOCK) x += (Math.floor(t * 30) & 1 ? 1 : -1) * lockAt(t);   // shaking
    if (t > BOOM) { const b = t - BOOM, dir = Math.sign(R.x - TX) || 1; x += dir * 260 * b; y += -80 * b + 260 * b * b; if (y > 0) continue; }
    p.disc(x, y, R.s * 0.7, DUST[R.c + 1], 1); p.dot(x, y - R.s * 0.5, DUST[R.c + 2], 1);
  }
  const ck = smooth(LOCK, LOCK + 0.3, t) * (1 - smooth(BOOM + 0.4, BOOM + 1.2, t));
  if (ck > 0) for (let i = 0; i < 10; i++) {   // glowing cracks radiating across the ground
    const a = (i / 10) * TAU + hsh(i, 26), len = (20 + 50 * hsh(i, 27)) * smooth(LOCK, LOCK + 0.35, t + hsh(i, 28) * 0.1);
    let x = TX, y = -1;
    for (let j = 0; j < 4; j++) {
      const q = a + (hsh(i * 7 + j, 29) - 0.5) * 0.8, nx = x + Math.cos(q) * len / 4, ny = -1 + Math.sin(q) * len / 4 * 0.1 * (j + 1);
      p.line(x, y, nx, ny, j < 2 ? L[5] : L[3], ck);
      x = nx; y = Math.max(-2, Math.min(1, ny));
    }
  }
}

// ---------------------------------------------------------------- the blast: flash, shockwave, a cone of dust, flying earth
const ROCKS = Array.from({ length: 34 }, (_, i) => ({ vx: (hsh(i, 8) - 0.5) * 300, vy: -90 - 260 * hsh(i, 9), s: 1 + Math.floor(hsh(i, 10) * 3), c: Math.floor(hsh(i, 11) * 3) }));
const SURGE = Array.from({ length: 30 }, (_, i) => ({ vx: (i % 2 ? 1 : -1) * (60 + 200 * hsh(i, 1)), r0: 3 + 3 * hsh(i, 3), r1: 8 + 10 * hsh(i, 4), life: 1.4 + 0.8 * hsh(i, 5), c: 1 + Math.floor(hsh(i, 6) * 3) }));
function coneDust(p, t) {
  const a = t - BOOM;
  if (a < 0.02 || a > END - BOOM) return;
  const rise = out3(clamp(a / 0.6)), H = 25 + 115 * rise;                         // height of the cone
  const slump = smooth(1.5, 2.6, a), thin = smooth(1.8, 3.0, a);                    // it sags, spreads, thins
  const Htop = H * (1 - 0.45 * slump), drift = 30 * slump;
  p.shade(TX - 180, -Htop - 22, TX + 180, 0, (x, y, o) => {
    const h = -y, v = h / Htop, wob = Math.sin(h * 0.09 - a * 2.2) * 6 + Math.sin(h * 0.21 + a * 3.1) * 3;
    const w = 8 + h * (0.62 + 0.5 * slump) + wob + 22 * (1 - Math.min(1, h / 12)) * slump, dx = x - TX - drift * v;
    const e = Math.abs(dx) / w;
    if (e > 1.15 || v > 1.12) return;
    // billows: lumpy, rolling upward inside the cone
    const n = 0.5 + 0.32 * Math.sin(dx * 0.12 + Math.sin(h * 0.05) * 2 - a * 0.6) * Math.sin(h * 0.14 - a * 2.6) + 0.18 * Math.sin(dx * 0.27 - a) * Math.sin(h * 0.31 + a * 1.3);
    const edge = 1 - smooth(0.7, 1.1, e + (n - 0.5) * 0.3), top = 1 - smooth(0.85, 1.1, v + (n - 0.5) * 0.25);
    const dens = edge * top * (0.75 + 0.5 * n) - thin * (1.2 - 0.4 * (1 - v));
    if (dens <= 0.08) return;
    const shade = e * 0.6 + n * 0.8 - v * 0.2 - 0.15 * dx / w;   // lit from the upper left, darker core
    o.c = DUST[Math.max(0, Math.min(4, Math.round(shade * 3.2)))]; o.a = Math.min(1, dens * 1.3);
  });
}
function boom(p, t, layer) {
  const a = t - BOOM;
  if (a < 0) return;
  if (layer === 'back') {   // a scorched crater, cooling
    const k = 1 - smooth(2.2, 2.9, a), hot = 1 - smooth(0.2, 1.6, a);
    p.shade(TX - 32, -3, TX + 32, 1, (x, y, o) => { const e = ((x - TX) / 32) ** 2 + ((y + 1) / 2.5) ** 2; if (e < 1) { o.c = e < 0.3 && hot > 0.3 ? L[2] : DUST[0]; o.a = k; } });
    return;
  }
  if (a < 0.25) {   // white flash + flat shockwave along the ground
    const f = 1 - a / 0.25;
    p.glow(LC[0], LC[1], 44, L[6], 0.35 * f);
    p.disc(LC[0], LC[1], 16 * f, L[6], 1);
    const r = 20 + 240 * out3(a / 0.25), pts = [];
    for (let i = 0; i <= 48; i++) { const q = (i / 48) * TAU; pts.push([TX + Math.cos(q) * r, -2 + Math.sin(q) * r * 0.12]); }
    p.polyline(pts, L[5], f);
  }
  for (let i = 0; i < SURGE.length; i++) {   // a low surge of dust rolling out along the ground
    const P = SURGE[i], b = a - 0.05;
    if (b < 0 || b > P.life) continue;
    const drag = (1 - Math.exp(-2.4 * b)) / 2.4, x = TX + P.vx * drag, f = b / P.life;
    const r = (P.r0 + (P.r1 - P.r0) * out3(Math.min(1, b / 0.6))) * (1 - smooth(0.5, 1, f));
    p.disc(x, -r * 0.6, r, DUST[P.c], 0.75 - 0.35 * f);
  }
  coneDust(p, t);
  // the ghost lotus burning inside the dust
  const g = smooth(GHOST[0], GHOST[0] + 0.3, t) * (1 - smooth(GHOST[1] - 0.4, GHOST[1], t));
  if (g > 0.05) {
    const fl = 0.75 + 0.25 * Math.sin(t * 9), k = g * fl * 0.5;
    lotusShape(p, t, 'back', TX, -62, 2.1, 0, k, L[3]);
    lotusShape(p, t, 'front', TX, -62, 2.1, 0, k, L[4]);
    p.glow(TX, -60, 40, L[5], 0.25 * g);
  }
  for (const R of ROCKS) {   // flying earth on parabolas, landing and lying still
    const tl = (2 * -R.vy) / 520, b = Math.min(a, tl), x = TX + R.vx * b, y = Math.min(0, -4 + R.vy * b + 260 * b * b);
    const k = 1 - smooth(2.2, 2.7, a);
    p.disc(x, y - R.s * 0.5, R.s * 0.7, DUST[R.c], k);
    if (a < tl) p.dot(x - R.vx * 0.01, y - (R.vy + 520 * b) * 0.01, DUST[R.c + 1], k * 0.8);
  }
}

export function drawBack(p, t) {
  clouds(p, t);
  eye(p, t);
  beam(p, t);
  lotus(p, t, 'back');
  boom(p, t, 'back');
}
export function draw(p, t) {
  lotus(p, t, 'front');
  stare(p, t, 'front');
  boom(p, t, 'front');
}
