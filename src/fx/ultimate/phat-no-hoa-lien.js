// Phat No Hoa Lien (v3, Opus, 17/11/2026; replaces the v2 throw + mushroom version, see git history). Motion from hoa-lien-draft.js; see records/ultimate/DESIGN-hoa-lien-v3.md.
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
const G1 = 1.55, B0 = 1.3, B1 = 2.1, R1 = 2.95, H1 = 3.2, TI = 3.4, AFTER = 3.6;
const HEAD = [0, -64], APEX = [36, -262], TX = 168;
const sm = (u) => u * u * (3 - 2 * u);
const SMK = ['#66636b', '#514e58', '#3d3944', '#2a2632', '#18151f'].map(hex);

export const meta = {
  name: 'Phat No Hoa Lien',
  desc: 'Five fire streams spiral round the caster into a lotus that soars, then slams down and unwinds into a twisting five-colour pillar with a far-reaching ground shock.',
  tags: ['ultimate', 'move', 'lotus', 'fire', 'spell', 'explosion', 'pillar', 'one-shot'],
  size: [480, 380], origin: [88, 342], duration: TI + AFTER, loop: false, fps: 30, bg: 'ground', actor: 2,
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
    [TI + 0.1, { ...READY, x: 2, crouch: 7, lean: -5, fx: -4, fy: -34, bx: 8, by: -34 }, 'snap'],
    [TI + 1.4, { ...READY, crouch: 4, fx: -2, fy: -30, bx: 6, by: -30 }],
    [TI + AFTER, READY],
  ],
  hits: [
    { t: H1, stop: 0.04, shake: 0.1, amp: 1.5, target: false },
    { t: TI, stop: 0.13, shake: 0.75, amp: 6, push: 5, straw: 45, flash: 0.15, skin: 'char' },
    { t: TI + 2.8, push: 0, straw: 0, flash: 0, skin: null },
  ],
  dust: [{ t: 0.1, x: 0, n: 8, dir: 1 }, { t: 0.1, x: 0, n: 8, dir: -1 }, { t: TI + 0.05, x: 4, n: 9, dir: -1 }],
};

// ------------------------------------------------------------------ part A: gather, lotus, flight
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
  const u = clamp((t - H1) / (TI - H1)), e = u ** 2.2;
  return { x: APEX[0] + (TX - APEX[0]) * e, y: APEX[1] - 6 + (-14 - APEX[1] + 6) * e, s: 0.65 - 0.12 * u, shake: 1.4 };
}

const flight = {
  meta: { duration: TI, loop: false, options: {} },
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
          } else if (t > B1 && t < TI) {
            const L = lotusAt(t), dive = t > H1, rate = dive ? 160 : t > R1 ? 25 : 70;
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
        if (t >= TI) return;
        for (let j = 0; j < C.length; j++) drawColored(ps[j], p, C[j], 'back');
        ribbons(p, 'back');
      },
      draw(p) {
        if (t >= TI) return;
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
        if (t > H1) {
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
        p.glow(L.x, L.y - 5, 40 * L.s, WHITE, 0.06 + 0.1 * smooth(R1, H1, t));
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

// ------------------------------------------------------------------ part B: impact at the target, local origin
const impact = {
  meta: { duration: AFTER, loop: false, options: {} },
  create(o) {
    const C = ramps(o), n = C.length, R = new Rng(o.seed + 7);
    const lights = new Lights();
    const sys = C.map((r, i) => {
      let blazes;
      const ps = new Particles({ rng: new Rng(o.seed + 97 * i), ground: () => 0, sparks: [r[5], r[4], r[3], r[1]],
        onLand: (x, y) => blazes.add(x, y - 0.4, R.range(0.3, 0.6), R.range(0.4, 0.8)) });
      blazes = new Blazes(ps);
      return { ps, blazes };
    });
    const ground = createGroundBlast({ seed: o.seed, scale: 1.15, hot: GOLD5, dirt: STONE, haze: '#3d3346',
      halfWidth: 250, outward: 1, jet: 0.45, duration: AFTER, bounds: [-268, -360, 236, 40] });
    const shockRamps = C.map(r => [mix(r[0], SMK[4], 0.35), mix(r[2], SMK[2], 0.45), mix(r[4], SMK[0], 0.3), hex('#fff1bd')]);
    let t = 0, boom = false;
    const acc = C.map(() => 0);
    // pillar geometry, shared by emission and drawing
    const top = (τ) => -14 - 400 * ease.outCubic(smooth(0.03, 0.45, τ));
    const life = (τ) => 1 - smooth(2.1, 3.1, τ);
    const cut = (τ) => -14 - 360 * smooth(2.0, 3.0, τ);
    // turbulence: three sine octaves per strand, so no two strands or turns repeat
    const nz = (y, τ, j, f = 1) => Math.sin(y * 0.13 * f + τ * 7 + j * 1.7) * 0.5 + Math.sin(y * 0.051 * f - τ * 4.3 + j * 3.1) * 0.35
      + Math.sin(y * 0.31 * f + τ * 13 + j * 0.6) * 0.15;
    const SPD = [14, 11.5, 16, 12.5, 13.2], PITCH = [0.045, 0.039, 0.051, 0.042, 0.048];
    const helix = (j, y, τ) => {
      const h = clamp((-14 - y) / 360), wrap = smooth(0, 0.5, τ), T = top(τ);
      const crown = smooth(T + 70, T, y) * smooth(0.35, 0.6, τ);
      const r = (9 + 38 * (1 - wrap) * (1 - h) + 4 * h + 22 * crown) * (1 + 0.32 * nz(y, τ, j)) + 2 * Math.sin(j * 2.3);
      const a = j * TAU / n + y * PITCH[j % 5] - τ * SPD[j % 5] + 0.6 * nz(y, τ, j + 9, 0.5);
      return { x: Math.cos(a) * r, a, front: Math.sin(a) > 0, h, crown };
    };
    function explode() {
      lights.add(0, -40, 150, WHITE, 1.2, 0.14);
      C.forEach((r, j) => lights.add((j - (n - 1) / 2) * 22, -40, 90, r[3], 0.35, 0.9));
      for (let j = 0; j < n; j++) {
        const { ps, blazes } = sys[j];
        // fireball: each colour owns its own sector so hues stay separate (no muddy mix)
        for (let i = 0; i < 12; i++) {
          const a = -Math.PI + (j + R.range(0.1, 0.9)) / n * Math.PI, d = R.range(4, 26), v = R.range(60, 170);
          ps.spawn(P.FIRE, Math.cos(a) * d, -16 + Math.sin(a) * d * 0.8, Math.cos(a) * v, Math.sin(a) * v - 30,
            R.range(0.32, 0.55), 0, R.range(11, 18), R.range(0, 0.05), PF.BIG | (i % 4 === 0 ? PF.SMOKES : 0));
        }
        for (let i = 0; i < 22; i++) {
          const a = R.range(-Math.PI - 0.1, 0.1), v = R.range(160, 460);
          ps.spawn(P.SPARK, 0, -14, Math.cos(a) * v, Math.sin(a) * v - 40, R.range(0.25, 0.7));
        }
        for (let i = 0; i < 4; i++) ps.spawn(P.BRAND, R.range(-8, 8), -8, R.range(-170, 170), -R.range(140, 280), R.range(0.7, 1.1));
        for (let i = 0; i < 6; i++) blazes.add(R.range(-200, 200), R.range(-2, 3), R.range(1.2, 2.4), R.range(0.8, 1.4));
      }
    }
    function shock(p, back) {
      const keep = a => (Math.sin(a) < 0) === back;
      for (let beat = 0; beat < 3; beat++) {
        const u = (t - 0.02 - beat * 0.1) / (0.95 - beat * 0.08);
        if (u <= 0 || u >= 1) continue;
        const radius = (330 - beat * 40) * ease.outCubic(u), alpha = Math.pow(1 - u, 0.7);
        band(p, 0, 1, radius, 0.11, 3 + 10 * (1 - u), alpha * 0.8, shockRamps[(beat * 2) % n], keep);
      }
    }
    function ripple(p) {
      // air dome: a pale and a dark arc racing out above the ground
      for (let beat = 0; beat < 2; beat++) {
        const u = clamp((t - beat * 0.12) / 0.8);
        if (u <= 0 || u >= 1) continue;
        const r = 30 + 300 * ease.outCubic(u), k = (1 - u) * 0.5;
        const pts = Array.from({ length: 73 }, (_, i) => { const a = -Math.PI + i / 72 * Math.PI; return [Math.cos(a) * r, -2 + Math.sin(a) * r * 0.82]; });
        p.polyline(pts, SMK[0], k * 0.7);
        p.polyline(pts.map(([x, y]) => [x, y + 2]), SMK[4], k * 0.6);
      }
    }
    function pillar(p, layer) {
      const L = life(t), T = top(t), Cy = cut(t);
      if (L <= 0 || t < 0.02) return;
      for (let j = 0; j < n; j++) {
        for (let y = -6; y >= T; y -= 2) {
          const s = helix(j, y, t);
          if (s.front !== (layer === 'front')) continue;
          const g = nz(y, t * 1.7, j + 4, 1.6);           // gaps and hot spots travel up the strand
          if (g < -0.5) continue;
          const above = y < Cy, tip = clamp((y - T) / 30);
          const k = L * (above ? 1 : 0.18) * tip * (s.front ? 1 : 0.65) * (1 - 0.6 * s.crown) * smooth(-0.5, -0.2, g);
          if (k <= 0.02) continue;
          const heat = clamp(0.5 + 0.6 * g), w = (5 - 2.2 * s.h) * (0.6 + 0.6 * heat) * (s.front ? 1 : 0.8);
          p.glow(s.x, y, w + 3, C[j][3], 0.05 * k);
          p.disc(s.x, y, w, C[j][s.front ? 2 + Math.round(heat * 2) : 2], k * 0.8);
          if (heat > 0.45) p.disc(s.x, y, w * 0.45, C[j][s.front ? (heat > 0.8 ? 6 : 5) : 4], k * (s.front ? 0.9 : 0.5));
        }
      }
      if (layer === 'front') {
        const y0 = Math.min(-6, Cy);
        const fl = 0.75 + 0.25 * Math.sin(t * 47);
        p.glowLine(0, y0, 0, T + 20, 14, WHITE, 0.16 * L * fl);
        p.glowLine(0, y0, 0, T + 20, 5, C[n - 1][5], 0.35 * L * fl);
        p.beam(0, y0, 0, T + 40, 1.4, C[n - 1][6], 0.55 * L * fl);
        p.glow(0, -10, 34, WHITE, 0.25 * L * (1 - smooth(0.3, 1.5, t)));
      }
    }
    return {
      update(dt) {
        t += dt;
        if (!boom) { boom = true; explode(); }
        ground.update(dt);
        const L = life(t), T = top(t);
        for (let j = 0; j < n; j++) {
          const { ps, blazes } = sys[j];
          // licking tongues ride up the pillar on each colour's helix
          if (L > 0.05 && t > 0.03) for (acc[j] += dt * 110 * L; acc[j] >= 1; acc[j]--) {
            const y = R.range(Math.max(T, -330), Math.min(-10, cut(t))), s = helix(j, y, t);
            ps.spawn(P.FIRE, s.x + R.range(-2, 2), y, -Math.sin(s.a) * 40, -R.range(200, 360), R.range(0.1, 0.2), 0, R.range(1.6, 3.4), 0, s.front ? 0 : PF.BACK);
          }
          // a burning base where the pillar meets the ground
          if (t > 0.05 && t < 2.4 && R.chance(14 * dt)) ps.spawn(P.FIRE, R.range(-16, 16), -4, R.range(-20, 20), -R.range(60, 140),
            R.range(0.25, 0.42), 0, R.range(4, 7), 0, R.chance(0.25) ? PF.SMOKES : 0);
          if (t > 2.0 && t < 3.0 && R.chance(10 * dt)) ps.spawn(P.EMBER, R.range(-12, 12), R.range(-320, -40), R.range(-25, 25), -R.range(10, 50), R.range(0.5, 1), C[j][4]);
          blazes.update(dt);
          ps.update(dt);
          for (const q of ps.list) if (q.k === P.SMOKE) q.life = Math.min(q.life, 0.6);
        }
        lights.update(dt);
      },
      drawBack(p) {
        if (t >= AFTER - 0.04) return;
        const saved = p.fade; p.fade *= 1 - smooth(AFTER - 0.6, AFTER - 0.05, t);
        ground.drawBack(p);
        shock(p, true);
        for (let j = 0; j < n; j++) {
          drawColored(sys[j].ps, p, C[j], 'back');
          for (const b of sys[j].blazes.list) {
            const k = b.life / b.max;
            p.dot(b.x, b.y, C[j][k > 0.45 ? 4 : 2], Math.min(1, k * 4));
            p.glow(b.x, b.y, 6, C[j][3], k * 0.22);
          }
        }
        pillar(p, 'back');
        p.fade = saved;
      },
      draw(p) {
        if (t >= AFTER - 0.04) return;
        const saved = p.fade; p.fade *= 1 - smooth(AFTER - 0.6, AFTER - 0.05, t);
        if (t < 1 / 30) { p.rect(-256, -342, 480, 380, WHITE, 1); p.fade = saved; return; }
        if (t < 0.1) p.rect(-256, -342, 480, 380, hex('#07040c'), 0.6 * (1 - smooth(0.05, 0.1, t)));
        ground.draw(p);
        ripple(p);
        pillar(p, 'front');
        for (let j = 0; j < n; j++) drawColored(sys[j].ps, p, C[j], 'front');
        shock(p, false);
        if (t < 0.14) flare(p, 0, -20, 110, 1 - t / 0.14, [C[0][2], C[0][4], C[0][5], WHITE]);
        lights.draw(p);
        p.fade = saved;
      },
    };
  },
};

export function create(o) {
  const common = { flames: o.flames ?? ALL5 };
  return chain([
    { fx: flight, t: 0, until: TI, ...common },
    { fx: impact, t: TI, x: TX, ...common },
  ])(o);
}
