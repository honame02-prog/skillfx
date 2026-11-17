// DRAFT v4 (17/11/2026) — Phat No Hoa Lien with a new impact (user proposal): the lotus lands on the target and swells to
// its limit, then explodes into five-coloured clouds and dust; a five-colour pillar is born at the centre, slowly widens
// to its limit and slowly dissolves. Gather / bloom / rise / dive are unchanged from v3 (phat-no-hoa-lien.js).
//   GATHER  five fire-qi streams spiral round the caster (passing behind and in front) and climb to meet above the head
//   BLOOM   they fold into the approved lotus
//   RISE / HANG / DIVE  the lotus soars, holds and compresses at the apex, then slams down on the target
//   IMPACT  the lotus loses its shape: five streams wrap into one twisting pillar that shoots to the sky, a five-colour
//           fireball, a far-reaching ground shock (shared _blast.js: geysers, rocks, dust surge, haze) and an air ripple
import { chain, READY, smooth, clamp, ease, TAU, WHITE, Rng, P, PF, Particles, Blazes, Lights, fit, hex, mix, band, flare } from '../../core/index.js';
import { FLAMES, lotus, orbitEmbers, drawColored } from './_lotus-lib.js';
import { createGroundBlast } from './_blast.js';
import { STONE } from './_lib.js';

const GOLD5 = ['#2a1805', '#6e4a08', '#b8860f', '#e9c12c', '#ffe27a', '#fff5c4', '#ffffff'];
// the five strange fires (Di Hoa 1-5): Thanh Lien teal, Cot Linh cold blue, Van Lac rose, Tam Thien black-violet, Tinh Lien white-gold
const ALL5 = [
  FLAMES[0],
  ['#0b1224', '#1d3557', '#3f6f9e', '#7fb2d9', '#c4e1f0', '#efece2', '#ffffff'],
  ['#140c12', '#4a1428', '#a8204a', '#ff4f7a', '#ffb3c6', '#efe9ee', '#ffffff'],
  ['#0a0610', '#1e0f2e', '#5a2a8c', '#9b4dd6', '#e07af0', '#f6d6ff', '#ffffff'],
  ['#3a2e1c', '#8a6a2a', '#c9a24a', '#e9cf8a', '#efe6cf', '#fbf8f0', '#ffffff'],
];
const G1 = 1.55, B0 = 1.3, B1 = 2.1, R1 = 2.95, H1 = 3.2, TI = 3.4, BOOM = 4.05, AFTER = 4.6;   // TI: touch; BOOM: after the swell
const HEAD = [0, -64], APEX = [36, -262], TX = 168;
const sm = (u) => u * u * (3 - 2 * u);
const SMK = ['#66636b', '#514e58', '#3d3944', '#2a2632', '#18151f'].map(hex);

export const meta = {
  name: 'Phat No Hoa Lien Draft4',
  desc: 'Draft v4: the lotus lands, swells to its limit and explodes into five-coloured clouds and dust; a five-colour pillar widens to its limit, then dissolves.',
  tags: ['ultimate', 'draft', 'move', 'lotus', 'fire', 'spell', 'explosion', 'pillar', 'one-shot'],
  size: [480, 380], origin: [88, 342], duration: BOOM + AFTER, loop: false, fps: 30, bg: 'ground', actor: 2,
  options: { flames: ALL5, seed: 17 },
};
const ramps = (o) => {
  const a = (o.flames ?? ALL5).slice(0, 5).map(r => fit(r, 7));
  return a.length >= 2 ? a : ALL5.map(r => fit(r, 7));
};

export const act = {
  target: { x: TX },
  poses: [
    [-0.2, READY],
    [0, { ...READY, crouch: 2, fx: 9, fy: -22, bx: -7, by: -22 }],
    [0.8, { ...READY, crouch: 4, fx: 13, fy: -30, bx: -11, by: -30 }],
    [B0, { ...READY, crouch: 1, fx: 4, fy: -44, bx: -2, by: -44, hy: -1 }],
    [R1, { ...READY, crouch: 0, fx: 6, fy: -43, bx: 0, by: -43, hy: -1, lean: -3 }],
    [H1, { ...READY, crouch: 2, fx: 10, fy: -39, bx: 2, by: -39, lean: -4 }],
    [TI - 0.05, { ...READY, x: 6, crouch: 5, lean: 6, fx: 20, fy: -24, bx: 4, by: -28, toeB: true }, 'snap'],
    [BOOM - 0.1, { ...READY, x: 6, crouch: 6, lean: 7, fx: 22, fy: -26, bx: 6, by: -27, toeB: true }],
    [BOOM + 0.1, { ...READY, x: 2, crouch: 7, lean: -5, fx: -4, fy: -34, bx: 8, by: -34 }, 'snap'],
    [BOOM + 2.0, { ...READY, crouch: 4, fx: -2, fy: -30, bx: 6, by: -30 }],
    [BOOM + AFTER, READY],
  ],
  hits: [
    { t: H1, stop: 0.04, shake: 0.1, amp: 1.5, target: false },
    { t: TI, stop: 0.06, shake: 0.35, amp: 3, push: 1.5, straw: 10, flash: 0.04 },
    ...Array.from({ length: 7 }, (_, i) => ({ t: TI + 0.1 + i * 0.075, shake: 0.08 + 0.03 * i, amp: 1 + 0.4 * i, push: 0.1, straw: 2, flash: 0 })),
    { t: BOOM, stop: 0.22, shake: 1.1, amp: 8, push: 6, straw: 60, flash: 0.15, skin: 'char' },
    { t: BOOM + 0.9, shake: 0.4, amp: 3, push: 1.5, straw: 12, flash: 0 },
    { t: BOOM + 1.8, shake: 0.3, amp: 2.5, push: 1, straw: 8, flash: 0 },
    { t: BOOM + AFTER - 0.4, push: 0, straw: 0, flash: 0, skin: null },
  ],
  dust: [{ t: 0.1, x: 0, n: 8, dir: 1 }, { t: 0.1, x: 0, n: 8, dir: -1 }, { t: BOOM + 0.05, x: 4, n: 9, dir: -1 }],
};

// ------------------------------------------------------------------ part A: gather, lotus, flight, swell
function orbit(j, t) {
  const t0 = j * 0.1, u = clamp((t - t0) / (G1 - t0));
  const a = j * TAU / 5 + u * TAU * 2.4;
  const r = 58 * (1 - sm(u)) ** 1.3 + 4 * (1 - u);
  const y = -4 + (HEAD[1] + 4) * (0.55 * u + 0.45 * sm(u));
  return { x: HEAD[0] + Math.cos(a) * r, y: y + Math.sin(a) * r * 0.28, a, front: Math.sin(a) > 0, u };
}
function lotusAt(t) {
  if (t < B1) return { x: HEAD[0], y: HEAD[1] - 6, s: 0.1 + 0.8 * smooth(B0, B1, t), shake: 0 };
  if (t < R1) {
    const u = (t - B1) / (R1 - B1), e = u < 0.6 ? 0.5 * (u / 0.6) ** 2 : 0.5 + 0.5 * sm((u - 0.6) / 0.4);
    return { x: HEAD[0] + (APEX[0] - HEAD[0]) * e, y: HEAD[1] - 6 + (APEX[1] - HEAD[1] + 6) * e, s: 0.9 - 0.15 * e, shake: 0 };
  }
  if (t < H1) {
    const u = (t - R1) / (H1 - R1);
    return { x: APEX[0], y: APEX[1] - 6 * Math.sin(u * Math.PI / 2), s: 0.78 - 0.13 * u, shake: u * 1.4 };
  }
  if (t < TI) {
    const u = clamp((t - H1) / (TI - H1)), e = u ** 2.2;
    return { x: APEX[0] + (TX - APEX[0]) * e, y: APEX[1] - 6 + (-14 - APEX[1] + 6) * e, s: 0.65 - 0.12 * u, shake: 1.4 };
  }
  // landed: the lotus swells round the target to its limit (fast, then straining), shaking harder and harder
  const g = swellAt(t);
  return { x: TX, y: -14 - 70 * g, s: 0.53 + 3.1 * g, shake: 1.4 + 5 * g };
}
function swellAt(t) {
  const u = clamp((t - TI) / (BOOM - 0.06 - TI));
  return 1 - (1 - u) ** 2.5 * (1 - 0.15 * u) + 0.02 * Math.sin(t * 60) * u;
}

const flight = {
  meta: { duration: BOOM, loop: false, options: {} },
  create(o) {
    const C = ramps(o), R = new Rng(o.seed);
    const ps = C.map((r, i) => new Particles({ rng: new Rng(o.seed + 31 * i), sparks: [r[5], r[4], r[3], r[1]] }));
    const acc = C.map(() => 0);
    let t = 0;
    return {
      update(dt) {
        t += dt;
        for (let j = 0; j < C.length; j++) {
          if (t < G1 + 0.1) {
            const s = orbit(j, t);
            if (s.u > 0 && s.u < 1) for (acc[j] += dt * 80; acc[j] >= 1; acc[j]--) {
              // tongues leave the head of the stream, drifting up and back along its path
              ps[j].spawn(P.FIRE, s.x + R.range(-1.5, 1.5), s.y + R.range(-1.5, 1.5),
                Math.sin(s.a) * 22, -R.range(18, 40), R.range(0.14, 0.24), 0, R.range(1.4, 2.6), 0, s.front ? 0 : PF.BACK);
              if (R.chance(0.12)) ps[j].spawn(P.EMBER, s.x, s.y, R.range(-20, 20), -R.range(20, 60), R.range(0.4, 0.8), C[j][4], 1, 0, s.front ? 0 : PF.BACK);
            }
          } else if (t > B1 && t < BOOM) {
            const L = lotusAt(t), dive = t > H1 && t < TI, rate = t >= TI ? 60 : dive ? 160 : t > R1 ? 25 : 70;
            for (acc[j] += dt * rate; acc[j] >= 1; acc[j]--) {
              const off = (j - (C.length - 1) / 2) * 5 * L.s;
              ps[j].spawn(P.FIRE, L.x + off + R.range(-2, 2), L.y + 8 * L.s + R.range(-2, 2),
                dive ? -R.range(40, 90) : R.range(-10, 10), dive ? -R.range(120, 220) : R.range(-10, 25),
                R.range(0.12, 0.24), 0, R.range(1.6, dive ? 4.5 : 3.2), 0, 0);
            }
          }
          ps[j].update(dt);
        }
      },
      drawBack(p) {
        if (t >= BOOM) return;
        for (let j = 0; j < C.length; j++) drawColored(ps[j], p, C[j], 'back');
        ribbons(p, 'back');
      },
      draw(p) {
        if (t >= BOOM) return;
        ribbons(p, 'front');
        for (let j = 0; j < C.length; j++) drawColored(ps[j], p, C[j], 'front');
        if (t < B0) return;
        const L = lotusAt(t);
        if (t > R1) {
          // compressed air: dark/light ripples closing in on the flower at the apex and during the fall
          const u = smooth(R1, H1, t);
          for (let i = 0; i < 3; i++) {
            const q = (t * 2.4 + i / 3) % 1, r = (14 + (1 - q) * 38) * L.s / 0.55;
            const pts = Array.from({ length: 41 }, (_, k) => [L.x + Math.cos(k / 40 * TAU) * r, L.y - 4 + Math.sin(k / 40 * TAU) * r * 0.6]);
            p.polyline(pts, SMK[0], Math.sin(q * Math.PI) * u * 0.45);
          }
        }
        if (t > H1 && t < TI) {
          // falling streak: one wake per colour, longest just before contact
          const u = clamp((t - H1) / (TI - H1));
          for (let j = 0; j < C.length; j++) {
            const q = lotusAt(t - 0.05 - 0.03 * u), off = (j - (C.length - 1) / 2) * 3;
            p.glowLine(q.x + off, q.y, L.x + off, L.y, 3, C[j][3], 0.45);
            p.line(q.x + off, q.y, L.x + off, L.y, C[j][5], 0.9);
          }
        }
        lotus(p, t, C, { x: L.x, y: L.y, size: L.s, instability: L.shake, halo: t < R1, seed: o.seed });
        if (t < R1) orbitEmbers(p, t, C, o.seed, L.x, L.y, L.s * 0.9);
        p.glow(L.x, L.y - 5, Math.min(90, 40 * L.s), WHITE, 0.06 + 0.1 * smooth(R1, H1, t) + 0.2 * smooth(TI, BOOM, t));
        if (t > TI) {
          // the swell: five-colour rays straining out of the flower, a white-hot core, air sucked in
          const g = swellAt(t);
          for (let i = 0; i < 20; i++) {
            const a = -Math.PI * (i + 0.5) / 20, len = (30 + 90 * g) * (0.6 + 0.4 * Math.sin(t * 40 + i * 2.7)), j = i % C.length;
            p.line(L.x + Math.cos(a) * 20 * L.s * 0.5, L.y + Math.sin(a) * 14 * L.s * 0.5, L.x + Math.cos(a) * (20 * L.s * 0.5 + len * g), L.y + Math.sin(a) * (14 * L.s * 0.5 + len * g), C[j][4], 1);
          }
          if (g > 0.75) p.disc(L.x, L.y, 10 + 30 * (g - 0.75), WHITE, 1);
        }
      },
    };
    // A fire ribbon: hot head, cooling body, split in front of / behind the caster.
    function ribbons(p, layer) {
      if (t > B1) return;
      const fade = 1 - smooth(B0 + 0.2, B1, t);
      for (let j = 0; j < C.length; j++) {
        const N = 24;
        for (let i = N - 1; i >= 0; i--) {
          const s = orbit(j, t - i * 0.022);
          if (s.u <= 0 || s.front !== (layer === 'front')) continue;
          const v = i / N, k = fade * (1 - v) * smooth(0, 0.12, s.u);
          const c = C[j][v < 0.05 ? 5 : v < 0.3 ? 4 : v < 0.65 ? 3 : 2];
          p.disc(s.x, s.y, 1.9 * (1 - v) + 0.5, c, k * 0.9);
          if (i % 4 === 0) p.glow(s.x, s.y, 6, C[j][3], 0.2 * k);
        }
      }
    }
  },
};

// ------------------------------------------------------------------ part B: the explosion, local origin at the target
// Stateless: five-coloured clouds and dust (solid stepped puffs, no plain colours), five-colour rings and debris, and a
// five-colour twisting pillar born thin at the centre that widens to its limit, then breaks up and dissolves.
const hsh = (i, s = 0) => { const h = Math.sin(i * 91.7 + s * 47.3) * 43758.5453; return h - Math.floor(h); };
const out3 = (u) => 1 - (1 - u) ** 3;
const PR = 96, PTOP = -345;   // the pillar's final half-width, its top (the top of the canvas)
const pillarR = (τ) => 3 + (PR - 3) * out3(smooth(0.05, 2.4, τ)) + 10 * smooth(2.6, 4.2, τ);   // widens, then spreads a little as it goes
const PUFFS = Array.from({ length: 96 }, (_, i) => {
  const j = i % 5, ground = i % 3 !== 0, a = ground ? (i % 2 ? -0.08 : -Math.PI + 0.08) - (hsh(i, 1) * 0.35) * (i % 2 ? 1 : -1) : -Math.PI * (0.12 + 0.76 * hsh(i, 2));
  const v = ground ? 120 + 260 * hsh(i, 3) : 70 + 200 * hsh(i, 3);
  return { j, vx: Math.cos(a) * v, vy: Math.sin(a) * v * (ground ? 0.3 : 0.9), r0: 6 + 6 * hsh(i, 4), r1: (ground ? 16 : 22) + 18 * hsh(i, 5), life: 2.4 + 1.6 * hsh(i, 6), d: 0.02 + 0.12 * hsh(i, 7), front: hsh(i, 8) > 0.4 };
});
const CHUNKS = Array.from({ length: 50 }, (_, i) => ({ j: i % 5, vx: (hsh(i, 9) - 0.5) * 520, vy: -120 - 380 * hsh(i, 10), s: 1 + Math.floor(hsh(i, 11) * 3), spin: hsh(i, 12) * 6 }));
function puff(p, x, y, r, R, cool) {   // a billow: dark underside, body, lit top-left, a hot fleck
  const b = Math.max(1, 2 - cool), m = Math.max(1, 3 - cool);
  p.disc(x, y, r, R[b - 1], 1);
  p.disc(x - r * 0.18, y - r * 0.2, r * 0.78, R[m], 1);
  p.disc(x - r * 0.35, y - r * 0.4, r * 0.4, R[Math.min(6, m + 1)], 1);
}
function clouds(p, t, C) {
  // one billowing mass: a dome that swells out from the blast and a low surge that rolls far along the ground; every
  // patch takes one of the five fire colours (a slow hue field), hot at first, cooling, then thinning into tatters
  const Rx = 30 + 215 * out3(smooth(0, 1.3, t)), Hy = 18 + 120 * out3(smooth(0, 0.9, t)) * (1 - 0.35 * smooth(1.8, 3.8, t));
  const Sx = 40 + 220 * out3(smooth(0.05, 1.6, t)), thin = smooth(1.9, 4.2, t), cool = smooth(0.25, 2.5, t), hot = 1 - smooth(0, 0.3, t);
  if (thin >= 1) return;
  const x0 = Math.max(-256, -Math.max(Rx, Sx) - 10), x1 = Math.min(224, Math.max(Rx, Sx) + 10), y0 = -Hy - 14;
  const N = grid(x0, y0, x1, 0, 4, (x, y) => 0.5 + 0.3 * Math.sin(x * 0.09 + Math.sin(y * 0.07 + t) * 1.5 - t * 0.7) * Math.sin(y * 0.12 + t * 1.6 + Math.sin(x * 0.04) * 1.2) + 0.2 * Math.sin(x * 0.23 - t) * Math.sin(y * 0.29 + t * 2));
  const Hue = grid(x0, y0, x1, 0, 8, (x, y) => 0.5 + 0.5 * Math.sin(x * 0.011 + y * 0.006 + t * 0.25 + Math.sin(y * 0.02 - t * 0.4) * 1.2));
  p.shade(x0, y0, x1, 0, (x, y, o) => {
    const n = N(x, y), dome = Math.hypot(x / Rx, y / Hy) - (n - 0.5) * 0.45, surge = Math.hypot(x / Sx, y / 24) - (n - 0.5) * 0.4;   // lumpy billowed outline
    const env = Math.max(1 - smooth(0.75, 0.95, dome), 1 - smooth(0.7, 0.95, surge));
    if (env <= 0) return;
    const dens = env * (0.55 + 0.75 * n) - thin * 1.25;
    if (dens < 0.22) return;
    // smoky tints of the five fires: dark undersides, lit billow tops, a hot glow only at first
    const j = Math.min(4, Math.floor(Hue(x, y) * 5)), lit = -y / Math.max(Hy, 24), billow = (n - 0.5) * 3.2;
    o.c = C[j][Math.max(1, Math.min(5, Math.round(1 + billow + lit * 0.9 + dens * 0.6 + hot * 2.8 - cool * 0.8)))];
  });
}
function rings(p, t, C) {   // a white shock, then five coloured rings racing out along the ground one after another
  if (t < 0.15) { const u = t / 0.15, r = 20 + 240 * out3(u); p.polyline(Array.from({ length: 61 }, (_, k) => [Math.cos(k / 60 * TAU) * r, -2 + Math.sin(k / 60 * TAU) * r * 0.12]), WHITE, 1); }
  for (let j = 0; j < C.length; j++) {
    const u = (t - 0.05 - j * 0.07) / 0.9;
    if (u <= 0 || u >= 1) continue;
    const r = 30 + 260 * out3(u), pts = Array.from({ length: 61 }, (_, k) => [Math.cos(k / 60 * TAU) * r, -1 + Math.sin(k / 60 * TAU) * r * 0.11]);
    p.polyline(pts, C[j][u < 0.5 ? 5 : 3], 1);
    p.polyline(pts.map(([x, y]) => [x, y + 1]), C[j][2], 1);
  }
}
function debris(p, t, C) {
  for (const K of CHUNKS) {
    const tl = (2 * -K.vy) / 600, b = Math.min(t, tl), x = K.vx * b, y = Math.min(0, -6 + K.vy * b + 300 * b * b);
    if (t > 2.6 + K.spin * 0.1) continue;
    const R = C[K.j], hot = t < 1.2;
    p.rect(x - K.s, y - K.s, K.s * 2, K.s * 2, R[hot ? 3 : 1], 1);
    p.dot(x - K.s + 1, y - K.s, R[hot ? 5 : 2], 1);
  }
}
function pillar(p, t, C) {
  const Rp = pillarR(t), thin = smooth(2.6, 4.3, t);
  if (t < 0.02 || thin >= 1) return;
  const W = Math.ceil(Rp + 8), cols = 2 * W + 1, TH = new Float32Array(cols), LI = new Float32Array(cols);
  for (let i = 0; i < cols; i++) { const u = (i - W) / Rp; TH[i] = Math.abs(u) < 1 ? Math.asin(u) : 9; LI[i] = Math.sqrt(Math.max(0, 1 - u * u)); }
  const core = 1 - smooth(0.15, 1.2, t), top = PTOP + 20 * (1 - smooth(0, 0.2, t)) * 0;
  const N = thin > 0 ? grid(-W, top, W, 0, 4, (x, y) => 0.5 + 0.3 * Math.sin(x * 0.11 + t * 1.3) * Math.sin(y * 0.07 - t * 2.2) + 0.2 * Math.sin(x * 0.27 - y * 0.05 + t)) : null;
  const rise = top + (0 - top) * (1 - out3(smooth(0, 0.25, t)));   // shoots up in the first quarter second
  p.shade(-W, Math.max(top, rise), W, 0, (x, y, o) => {
    const i = Math.round(x) + W;
    if (i < 0 || i >= cols) return;
    const side = x < 0 ? 1 : 0, lick = 0.09 * Math.pow(Math.abs(Math.sin(y * 0.06 + t * 9 + side * 2)), 3) + 0.04 * Math.sin(y * 0.13 - t * 11 + side);   // flame tongues on the rim
    const wob = 1 + 0.06 * Math.sin(y * 0.045 - t * 3) + lick;
    const u = x / (Rp * wob), au = Math.abs(u);
    if (au >= 1) return;
    if (N && N(x, y) < thin * 1.3 - 0.45 + au * 1.1 * thin) return;   // tearing apart from the rim inward
    // ten thin strands (two per colour) twisting up a white-hot core
    const th = Math.asin(u), ph = (th * 2 + y * 0.05 - t * 9) / (TAU / 5), k = Math.floor(ph), j = ((k % 5) + 5) % 5, e = Math.abs(ph - k - 0.5) * 2;
    const li = Math.sqrt(1 - u * u), heat = li ** 4 * (1.05 - thin) + core;
    if (e < 0.5) o.c = C[j][Math.max(2, Math.min(6, Math.round(3 + li * 2.4 - e * 2 + core * 2)))];
    else o.c = heat > 0.75 ? C[j][6] : heat > 0.45 ? C[j][5] : C[(j + 1) % 5][Math.max(1, Math.round(1 + li * 3))];
  });
  p.glowLine(0, -4, 0, Math.max(top, rise) + 20, Math.min(60, 10 + Rp * 0.5), WHITE, 0.12 * (1 - thin));
}
function grid(x0, y0, x1, y1, S, fn) {
  const nx = Math.ceil((x1 - x0) / S) + 2, ny = Math.ceil((y1 - y0) / S) + 2, g = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) g[j * nx + i] = fn(x0 + i * S, y0 + j * S);
  return (x, y) => {
    const fx = Math.max(0, (x - x0) / S), fy = Math.max(0, (y - y0) / S), i = Math.min(nx - 2, fx | 0), j = Math.min(ny - 2, fy | 0);
    const u = Math.min(1, fx - i), v = Math.min(1, fy - j), q = j * nx + i;
    return (g[q] * (1 - u) + g[q + 1] * u) * (1 - v) + (g[q + nx] * (1 - u) + g[q + nx + 1] * u) * v;
  };
}
const impact = {
  meta: { duration: AFTER, loop: false, options: {} },
  create(o) {
    const C = ramps(o);
    let t = 0;
    return {
      update(dt) { t += dt; },
      drawBack(p) {
        if (t >= AFTER - 0.02) return;
        pillar(p, t, C);
      },
      draw(p) {
        if (t >= AFTER - 0.02) return;
        if (t < 1 / 30) { p.rect(-256, -342, 480, 380, WHITE, 1); return; }
        if (t < 0.12) flare(p, 0, -30, 130, 1 - t / 0.12, [C[0][2], C[2][4], C[4][5], WHITE]);
        rings(p, t, C);
        clouds(p, t, C);
        debris(p, t, C);
      },
    };
  },
};

export function create(o) {
  const common = { flames: o.flames ?? ALL5 };
  return chain([
    { fx: flight, t: 0, until: BOOM, ...common },
    { fx: impact, t: BOOM, x: TX, ...common },
  ])(o);
}
