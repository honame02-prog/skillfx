// Rolling cloud lobes, cooling fire, brands and their floor fires use Sprite Fusion's explosion techniques
// (https://www.spritefusion.com/pixel-art-vfx/explosion), MIT License, Copyright (c) 2026 Hugo Duprez.
import { Particles, Blazes, Lights, P, PF, Rng, fit, band, smooth, clamp, ease, TAU, WHITE, hex, flare } from '../../core/index.js';
import { Plume, Column, lobe, draft, cull, fadeEdges, pool } from '../explosions/_lib.js';
import { FLAMES, flames, lotus, petal, drawColored } from './_lotus-lib.js';

export const BREAK = 0.22;
export const meta = {
  name: 'Hoa Lien Burst',
  desc: 'A cracking lotus ruptures into separate whorls of alien fire, a petal shock front, a rolling mushroom crown and a rain of burning petals and brands.',
  tags: ['ultimate', 'lotus', 'explosion', 'mushroom', 'fire', 'one-shot'],
  size: [420, 260], origin: [210, 222], duration: 3.4, loop: false, fps: 30, bg: 'ground',
  options: { flames: FLAMES, seed: 17 },
};
const SM = ['#a9a1b9', '#80768d', '#5b516a', '#3b324d', '#201b2e'].map(hex);

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
  const plume = new Plume(R, { y: -27, rise: 112, tau: 0.55, drift: 1.5, tube: [10, 24], ring: [5, 49],
    grow: 0.5, n: 36, size: [10, 15], swell: 0.4, spin: 6, spinTau: 1.1, heat: 1.3, cool: 1.15,
    under: 0.4, tilt: 0.18, squash: 0.65, fade: [1.65, 2.95], spread: 24, inner: true, hollow: true });
  plume.lobes.forEach((q, i) => { q.color = Math.floor(i / 3) % C.length; q.f *= 0.4; });
  const column = new Column(R, { w: 5.5, foot: 21, speed: 210, size: [6, 10], n: 26, sway: 2.1, fade: 0.5 });
  const rain = Array.from({ length: 32 }, (_, i) => ({
    born: R.range(0.6, 1.35), x: R.range(-75, 75), y: -R.range(70, 155),
    vx: R.range(-24, 24), vy: R.range(8, 25), w: R.range(1.3, 3.2), len: R.range(6, 12),
    a: R.range(0, TAU), va: R.range(-5, 5), color: i % C.length, life: R.range(0.75, 1.2),
  }));
  let t = 0, boom = false;
  function explode() {
    lights.add(0, -58, 120, WHITE, 1.1, 0.12);
    C.forEach((r, j) => lights.add((j - (C.length - 1) / 2) * 24, -40, 90, r[4], 0.45, 0.65));
    for (let i = 0; i < 150; i++) {
      const j = i % C.length, { ps } = systems[j], a = R.range(-Math.PI - 0.08, 0.08), v = R.range(130, 440);
      ps.spawn(P.SPARK, 0, -22, Math.cos(a) * v, Math.sin(a) * v - 30, R.range(0.22, 0.62));
    }
    for (let i = 0; i < 60; i++) {
      const { ps } = systems[i % C.length], a = R.range(-Math.PI, 0), d = R.range(8, 32), v = R.range(30, 155);
      ps.spawn(P.FIRE, Math.cos(a) * d, -26 + Math.sin(a) * d, Math.cos(a) * v, Math.sin(a) * v - 30,
        R.range(0.38, 0.74), 0, R.range(5, 10), R.range(0, 0.12), i % 6 ? 0 : PF.SMOKES | PF.BIG);
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
    const u = (t - BREAK) / 0.65;
    if (u <= 0 || u >= 1) return;
    const radius = 180 * ease.outCubic(u), alpha = 1 - u;
    const keep = a => (Math.sin(a) < 0) === back;
    band(p, 0, 1, radius, 0.16, Math.max(1, 5 * (1 - u)), alpha,
      [C[0][1], C[0][3], C[0][5], WHITE], keep, u < 0.12);
    // Sharp scallops: each shock petal has two flanks and a pointed outer lip on the tilted floor.
    for (let i = 0; i < 28; i++) {
      const a = i * TAU / 28, cc = C[i % C.length];
      if (!keep(a)) continue;
      const pts = [-1, 0, 1].map(v => {
        const g = a + v * TAU / 56, r = radius + (v ? -3 : 8) * (1 - u);
        return [Math.cos(g) * r, 1 + Math.sin(g) * r * 0.16];
      });
      p.polyline(pts, cc[5], alpha);
      if (i % 2 === 0) p.glow(pts[1][0], pts[1][1], 5, cc[4], 0.25 * alpha);
    }
  }
  function cloud(p) {
    const age = t - BREAK;
    if (age < 0.09) return;
    const S = plume.shape(), E = plume.ember();
    column.draw(p, S.y + S.tube * 0.4, FR[Math.floor(t * 9) % C.length], SM,
      1 - smooth(0.7, 1.3, age), E * 0.5);
    for (const e of plume.lobesAt(plume.t)) {
      const j = e.q.color, fire = clamp((e.heat - 0.2) / 0.75);
      lobe(p, e.x, e.y, e.r, FR[j], SM, fire, E * (0.4 + 0.4 * Math.max(0, -e.up)),
        e.fade * 0.94, e.z, e.up < -0.35 ? 1 : 0, 1);
      if (fire > 0.2) p.glow(e.x, e.y, e.r * 1.4, C[j][4], fire * 0.06);
    }
    // Broken luminous seams describe the toroidal roll without painting over the dark cloud underside.
    const k = (1 - smooth(1.2, 2, age)) * smooth(0.2, 0.5, age);
    if (k > 0) for (let j = 0; j < C.length; j++) {
      const start = j * TAU / C.length + age * 0.65;
      const pts = Array.from({ length: 22 }, (_, i) => {
        const a = start + i / 21 * TAU / C.length * 0.8;
        return [Math.cos(a) * (S.ring + 4), S.y + 9 + Math.sin(a) * S.tube * 0.55];
      });
      p.polyline(pts, C[j][4], k * 0.7);
    }
  }
  return {
    update(dt) {
      t += dt;
      if (!boom && t >= BREAK) { boom = true; explode(); }
      if (t >= BREAK) {
        plume.update(dt);
        const age = t - BREAK, S = plume.shape();
        column.update(dt, S.y + S.tube * 0.4, age > 0.1 && age < 1.5 ? 1 : 0);
        for (let j = 0; j < C.length; j++) {
          const { ps, blazes } = systems[j];
          if (age > 0.1 && age < 0.85 && R.chance(12 * dt)) ps.spawn(P.FIRE, R.range(-8, 8), -8,
            R.range(-15, 15), -R.range(120, 210), R.range(0.35, 0.55), 0, R.range(4, 7), 0, R.chance(0.2) ? PF.SMOKES | PF.BIG : 0);
          if (age > 1.2 && age < 2.25 && R.chance(8 * dt)) ps.spawn(P.EMBER, R.range(-70, 70), -R.range(50, 130),
            R.range(-20, 20), -R.range(5, 20), R.range(0.3, 0.6), C[j][3]);
          blazes.update(dt);
          draft(ps, dt, { top: S.y, w: 11, up: 110, pull: 50, low: 12, reach: 120, k: 1 - smooth(0.9, 1.6, age) });
          ps.update(dt);
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
          drawColored(systems[j].ps, p, C[j], 'back'); systems[j].blazes.drawBack(p);
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
        p.glow(0, -55, 125, WHITE, 1.5 * (1 - age / 0.08));
        lotus(p, t, C.map(() => Array(7).fill(WHITE)), { y: -24, size: 1.5, halo: false });
        flare(p, 0, -35, 90, 1 - age / 0.08, [C[0][2], C[0][4], C[0][5], WHITE]);
      } else if (age < 0.57) {
        const u = (age - 0.067) / 0.5, r = 24 + 37 * ease.outCubic(u), cy = -32 - u * 26;
        // Distinct, winding flame ribbons separated by a deep edge; heat never averages hue.
        p.shade(-r - 3, cy - r - 3, r + 3, Math.min(0, cy + r + 3), (x, y, out) => {
          const d = Math.hypot(x, y - cy), a = Math.atan2(y - cy, x), rim = r + Math.sin(a * 11 + age * 19) * 2;
          if (d > rim) return;
          const turn = a + d / r * 2.6 - age * 4, sector = ((turn / TAU * C.length * 2) % (C.length * 2) + C.length * 2) % (C.length * 2);
          const j = Math.floor(sector) % C.length, f = sector % 1, edge = Math.min(f, 1 - f);
          const rib = Math.sin(a * 15 + d * 0.28 - age * 24) * 0.13 + Math.sin(a * 9 - d * 0.4 + age * 11) * 0.09;
          const heat = 0.78 - d / rim * 0.65 + rib;
          out.c = edge < 0.045 ? C[j][0] : d > rim - 1 ? C[j][4] :
            C[j][heat > 0.83 ? 6 : heat > 0.68 ? 5 : heat > 0.48 ? 4 : heat > 0.28 ? 3 : heat > 0.14 ? 2 : 1];
        });
        p.glow(0, cy, r * 1.4, C[0][3], 0.25 * (1 - u));
      }
      for (let j = 0; j < C.length; j++) drawColored(systems[j].ps, p, C[j], 'front');
      shock(p, false);
      for (const q of rain) {
        const a = age - q.born;
        if (a <= 0 || a >= q.life) continue;
        const k = a / q.life, x = q.x + q.vx * a + Math.sin(a * 7 + q.a) * 7;
        const y = q.y + q.vy * a + a * a * 85, rot = q.a + q.va * a;
        if (y > -4) continue;
        petal(p, x, y, Math.cos(rot) * q.len, Math.sin(rot) * q.len * 0.55,
          q.w * (0.8 + Math.sin(a * 5 + q.a) * 0.2), C[q.color], t, q.a, Math.min(1, (1 - k) * 4), 0, false);
      }
      lights.draw(p);
      p.fade = saved;
    },
  };
}
