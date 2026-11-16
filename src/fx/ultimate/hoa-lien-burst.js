// Rolling cloud lobes, cooling fire, brands and their floor fires use Sprite Fusion's explosion techniques
// (https://www.spritefusion.com/pixel-art-vfx/explosion), MIT License, Copyright (c) 2026 Hugo Duprez.
import { Particles, Blazes, Lights, P, PF, Rng, fit, band, smooth, clamp, ease, TAU, WHITE, hex, flare } from '../../core/index.js';
import { Plume, Column, lobe, draft, cull, fadeEdges, pool } from '../explosions/_lib.js';
import { flameBlade, noiseFor, BIG_LAYERS } from '../fire/_lib.js';
import { FLAMES, flames, lotus, petal } from './_lotus-lib.js';

export const BREAK = 0.22;
export const meta = {
  name: 'Hoa Lien Burst',
  desc: 'A cracking lotus ruptures into separate whorls of alien fire, a petal shock front, a rolling mushroom crown and a rain of burning petals and brands.',
  tags: ['ultimate', 'lotus', 'explosion', 'mushroom', 'fire', 'one-shot'],
  size: [420, 260], origin: [210, 222], duration: 3.4, loop: false, fps: 30, bg: 'ground',
  options: { flames: FLAMES, seed: 17 },
};
const SM = ['#625869', '#514657', '#3d3247', '#2a2135', '#181321'].map(hex);
const noise = noiseFor(0);

export function create(o) {
  const C = flames(o), FR = C.map(r => fit(r, 9).reverse()), R = new Rng(o.seed);
  const lights = new Lights();
  const systems = C.map((r, i) => {
    let blazes;
    const ps = new Particles({ rng: new Rng(o.seed + i * 173), ground: () => 0,
      sparks: [r[5], r[4], r[3], r[1]], onLand: (x, y) => blazes.add(x, y - 0.4, R.range(0.35, 0.65), R.range(0.4, 0.8)) });
    blazes = new Blazes(ps);
    return { ps, blazes };
  });
  const plume = new Plume(R, { y: -34, rise: 100, tau: 0.48, drift: 2, tube: [12, 23], ring: [4, 45],
    grow: 0.42, n: 46, size: [8, 13], swell: 0.25, spin: 5, spinTau: 0.9, heat: 1.45, cool: 0.72,
    under: 0.65, tilt: 0.16, squash: 0.62, fade: [1.2, 1.95], spread: 18, inner: true });
  plume.lobes.forEach((q, i) => { q.color = Math.floor(i * C.length / plume.lobes.length); q.f *= 0.12; });
  const columns = C.map(() => new Column(R, { w: 3, foot: 10, speed: 200, size: [4, 7], n: 22, sway: 1.8 }));
  // The same ten petals leave the lotus radially, coast, then flutter down under gravity.
  const petals = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI + 0.12 + i / 9 * (Math.PI - 0.24), v = R.range(125, 190);
    return { vx: Math.cos(a) * v, vy: Math.sin(a) * v - 35, a, va: R.range(-5, 5),
      w: R.range(4, 6), len: R.range(20, 29), color: i % C.length, life: R.range(1.25, 1.7) };
  });
  const streamAcc = Array(C.length * 2).fill(0);
  const petalPos = (q, age) => {
    const drift = (1 - Math.exp(-age * 1.5)) / 1.5;
    return [q.vx * drift + Math.sin(age * 9 + q.a) * age * 3,
      -25 + q.vy * drift + 95 * age * age];
  };
  let t = 0, boom = false;
  function explode() {
    lights.add(0, -58, 92, WHITE, 1.1, 0.12);
    C.forEach((r, j) => lights.add((j - (C.length - 1) / 2) * 20, -55, 70, r[3], 0.3, 0.65));
    for (let i = 0; i < 150; i++) {
      const j = i % C.length, { ps } = systems[j], a = R.range(-Math.PI - 0.08, 0.08), v = R.range(130, 440);
      ps.spawn(P.SPARK, 0, -22, Math.cos(a) * v, Math.sin(a) * v - 30, R.range(0.22, 0.62));
    }
    for (let i = 0; i < 40; i++) {
      const j = i % C.length, { ps } = systems[j], a = -Math.PI + (j + 0.5) / C.length * Math.PI + R.range(-0.2, 0.2);
      const d = R.range(3, 24), v = R.range(50, 150);
      ps.spawn(P.FIRE, Math.cos(a) * d, -30 + Math.sin(a) * d, Math.cos(a) * v, Math.sin(a) * v - 25,
        R.range(0.3, 0.5), 0, R.range(7, 12), R.range(0, 0.06), PF.BIG | (i % 8 === 0 ? PF.SMOKES : 0));
    }
    for (let i = 0; i < 56; i++) {
      const j = i % C.length, { ps } = systems[j], a = R.range(0, TAU), v = R.range(30, 115);
      ps.spawn(P.EMBER, Math.cos(a) * 20, -35 + Math.sin(a) * 20, Math.cos(a) * v, -R.range(30, 120),
        R.range(0.7, 1.7), C[j][3], R.chance(0.2) ? 2 : 1);
    }
    for (let i = 0; i < 18; i++) {
      const { ps } = systems[i % C.length];
      ps.spawn(P.BRAND, R.range(-10, 10), -8, R.range(-150, 150), -R.range(130, 270), R.range(0.65, 1.1));
    }
    for (let i = 0; i < 32; i++) {
      const { ps } = systems[i % C.length], a = R.range(0, TAU);
      ps.spawn(P.SMOKE, Math.cos(a) * 12, Math.sin(a) * 2 - 2, Math.cos(a) * R.range(110, 320), -R.range(1, 7),
        R.range(0.65, 1.2), SM[2], R.range(4, 8), R.range(0, 0.12), PF.BIG);
    }
  }
  function shock(p, back) {
    const keep = a => (Math.sin(a) < 0) === back;
    for (let beat = 0; beat < 2; beat++) {
      const u = (t - BREAK - beat * 0.13) / (0.82 - beat * 0.08);
      if (u <= 0 || u >= 1) continue;
      const radius = (178 - beat * 16) * ease.outCubic(u), alpha = Math.pow(1 - u, 0.65);
      const thick = 4 + 13 * (1 - u), ramp = C[beat % C.length];
      band(p, 0, 1, radius, 0.16, thick, alpha, [ramp[0], ramp[2], ramp[4], ramp[5]], keep, u < 0.28);
      // Thick pointed lips overlap the pressure band, with a white leading edge and a colored wake.
      for (let i = 0; i < 24; i++) {
        const a = (i + beat * 0.5) * TAU / 24, cc = C[(i + beat) % C.length];
        if (!keep(a)) continue;
        for (let w = 7; w >= 0; w--) {
          const pts = [-1, 0, 1].map(v => {
            const g = a + v * TAU / 48, r = radius - w + (v ? -3 : 10) * (1 - u);
            return [Math.cos(g) * r, 1 + Math.sin(g) * r * 0.16];
          });
          p.polyline(pts, w === 0 ? (u < 0.4 ? WHITE : cc[5]) : cc[w < 3 ? 4 : 2], alpha);
        }
      }
    }
  }
  // Draw simulated FIRE as ragged tongues, never as concentric round puffs.
  function drawFire(ps, p, j, layer) {
    const all = ps.list, fire = [], rest = [];
    for (const q of all) (q.k === P.FIRE ? fire : rest).push(q);
    ps.list = rest; ps.draw(p, layer); ps.list = all;
    const N = (rate, seed = 0, off = 0) => noise(t, rate, seed, off);
    for (const q of fire) {
      if (q.delay > 0 || !!(q.flag & PF.BACK) !== (layer === 'back')) continue;
      const k = q.life / q.max, cooling = Math.floor((1 - k) * 4);
      const H = FR[j].map((_, i) => FR[j][Math.min(8, i + cooling)]);
      const speed = Math.hypot(q.vx, q.vy) || 1, dx = q.vx / speed * 0.65, dy = Math.min(-0.3, q.vy / speed);
      const norm = Math.hypot(dx, dy), size = q.size * (0.55 + k * 0.45);
      const saved = p.fade; p.fade *= Math.min(1, k * 4);
      flameBlade(p, q.x, q.y, dx / norm, dy / norm, size * 2.4, size * 0.65,
        N(7, q.seed) * size * 0.6, N, q.seed, H, BIG_LAYERS, 0.75, 1.8);
      p.glow(q.x, q.y - size * 0.5, size * 2.1, C[j][3], 0.07 * k);
      p.fade = saved;
    }
  }
  function cloud(p) {
    const age = t - BREAK;
    if (age < 0.18 || age > 2.05) return;
    const S = plume.shape(), E = plume.ember();
    const alpha = smooth(0.18, 0.42, age) * (1 - smooth(1.2, 1.98, age));
    for (let j = 0; j < C.length; j++) {
      const saved = p.fade; p.fade *= alpha;
      columns[j].draw(p, S.y + S.tube * 0.4, FR[j], SM, 1 - smooth(0.65, 1.25, age), E * 1.1);
      p.fade = saved;
    }
    for (const e of plume.lobesAt(plume.t)) {
      const j = e.q.color, underside = clamp((e.y - S.y + 9) / 22);
      const fire = Math.min(0.28, clamp((e.heat - 0.25) / 0.9) * (0.35 + underside * 0.65));
      const glow = E * (0.8 + underside * 0.65) * e.q.gv;
      lobe(p, e.x, e.y, e.r, FR[j], SM, fire, glow, e.fade * alpha * 0.92, e.z, underside < 0.2 ? 1 : 0);
      // The light buffer keeps the underside incandescent as the top turns to soot.
      p.glow(e.x, e.y + e.r * 0.3, e.r * 1.9, C[j][3], E * alpha * (0.08 + underside * 0.16));
      if (underside > 0.35 && e.z > -0.15 && age < 1.8) {
        const N = (rate, seed = 0, off = 0) => noise(t, rate, seed, off);
        const saved = p.fade; p.fade *= alpha * e.fade * 0.7;
        flameBlade(p, e.x, e.y + e.r * 0.7, Math.sin(e.q.ph) * 0.3, -1,
          e.r * (0.7 + E * 0.6), e.r * 0.35, N(6, e.q.th) * 4, N, e.q.th * 20, FR[j], BIG_LAYERS);
        p.fade = saved;
      }
    }
  }
  return {
    update(dt) {
      t += dt;
      if (!boom && t >= BREAK) { boom = true; explode(); }
      if (t >= BREAK) {
        plume.update(dt);
        const age = t - BREAK, S = plume.shape();
        for (const column of columns) column.update(dt, S.y + S.tube * 0.4, age > 0.1 && age < 1.05 ? 0.7 : 0);
        // Emission follows eight climbing, turning paths. A hue stays attached to its stream.
        if (age < 0.8) for (let i = 0; i < streamAcc.length; i++) {
          const j = i % C.length, a = i * TAU / streamAcc.length + age * 3.8;
          const radius = 8 + 35 * (1 - Math.exp(-age * 7));
          const x = Math.cos(a) * radius, y = -42 - age * 45 + Math.sin(a) * radius * 0.65;
          for (streamAcc[i] += dt * 26; streamAcc[i] >= 1; streamAcc[i]--) {
            systems[j].ps.spawn(P.FIRE, x + R.range(-3, 3), y + R.range(-3, 3),
              -Math.sin(a) * 75 + Math.cos(a) * 25, Math.cos(a) * 45 - 55,
              R.range(0.24, 0.42), 0, R.range(6, 11), 0, PF.BIG | (R.chance(0.07) ? PF.SMOKES : 0));
            // Broad inner tongues join the whorls into a fireball instead of a hollow wheel.
            if (age < 0.65) systems[j].ps.spawn(P.FIRE, x * 0.42, -43 - age * 38 + Math.sin(a) * radius * 0.25,
              -Math.sin(a) * 30, -45 + Math.cos(a) * 20, R.range(0.24, 0.38), 0, R.range(10, 15), 0, PF.BIG);
          }
        }
        for (const q of petals) {
          const [x, y] = petalPos(q, age);
          if (age < Math.min(0.95, q.life) && y < -5 && R.chance(24 * dt)) {
            systems[q.color].ps.spawn(P.FIRE, x, y, -q.vx * 0.1, -20, 0.2, 0, R.range(2, 4), 0, PF.BIG);
          }
        }
        for (let j = 0; j < C.length; j++) {
          const { ps, blazes } = systems[j];
          if (age > 0.1 && age < 0.85 && R.chance(12 * dt)) ps.spawn(P.FIRE, R.range(-8, 8), -8,
            R.range(-15, 15), -R.range(120, 210), R.range(0.35, 0.55), 0, R.range(4, 7), 0, R.chance(0.2) ? PF.SMOKES | PF.BIG : 0);
          if (age > 1.2 && age < 2.25 && R.chance(8 * dt)) ps.spawn(P.EMBER, R.range(-70, 70), -R.range(50, 130),
            R.range(-20, 20), -R.range(5, 20), R.range(0.3, 0.6), C[j][3]);
          blazes.update(dt);
          draft(ps, dt, { top: S.y, w: 11, up: 110, pull: 50, low: 12, reach: 120, k: 1 - smooth(0.9, 1.6, age) });
          ps.update(dt);
          // Secondary smoke must not outlive the short, still-glowing mushroom.
          for (const q of ps.list) if (q.k === P.SMOKE) q.life = Math.min(q.life, 0.5);
          cull(ps, -190, -195, 190, 16);
          fadeEdges(ps, -194, 194, 25, 22);
        }
      }
      lights.update(dt);
    },
    drawBack(p) {
      if (t >= 3.32) return;
      const saved = p.fade; p.fade *= 1 - smooth(2.85, 3.32, t);
      if (t >= BREAK) {
        const age = t - BREAK;
        pool(p, 0, 1, 125, 12, C[0][3], 0.25 * (1 - smooth(0.5, 2.6, age)));
        p.ellipse(0, 1, 56, 6, hex('#100e1b'), (1 - smooth(2.1, 3.05, age)) * 0.65);
        for (let j = 0; j < C.length; j++) {
          drawFire(systems[j].ps, p, j, 'back'); systems[j].blazes.drawBack(p);
        }
        shock(p, true);
        cloud(p);
      }
      p.fade = saved;
    },
    draw(p) {
      if (t >= 3.32) return;
      const saved = p.fade; p.fade *= 1 - smooth(2.85, 3.32, t);
      if (t < BREAK) {
        lotus(p, t, C, { y: -22, size: 0.75 * (1 - t / BREAK * 0.17), instability: t / BREAK, seed: o.seed });
        p.fade = saved; return;
      }
      const age = t - BREAK;
      if (age < 0.067) {
        p.glow(0, -55, 92, WHITE, 1.5 * (1 - age / 0.08));
        lotus(p, t, C.map(() => Array(7).fill(WHITE)), { y: -24, size: 1.5, halo: false });
        flare(p, 0, -35, 90, 1 - age / 0.08, [C[0][2], C[0][4], C[0][5], WHITE]);
      }
      for (let j = 0; j < C.length; j++) drawFire(systems[j].ps, p, j, 'front');
      shock(p, false);
      for (const q of petals) {
        if (age >= q.life) continue;
        const [x, y] = petalPos(q, age), rot = q.a + q.va * age * smooth(0.15, 0.65, age);
        if (y > -4) continue;
        const alpha = Math.min(1, (q.life - age) * 4), shrink = 1 - age / q.life * 0.5;
        petal(p, x, y, Math.cos(rot) * q.len * shrink, Math.sin(rot) * q.len * shrink,
          q.w * (0.65 + Math.sin(age * 9 + q.a) * 0.25), C[q.color], t, q.a, alpha, 0, true);
      }
      lights.draw(p);
      p.fade = saved;
    },
  };
}
