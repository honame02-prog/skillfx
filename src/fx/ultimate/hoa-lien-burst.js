// Rolling cloud lobes, cooling fire, brands and their floor fires use Sprite Fusion's explosion techniques
// (https://www.spritefusion.com/pixel-art-vfx/explosion), MIT License, Copyright (c) 2026 Hugo Duprez.
import { Particles, Blazes, Lights, P, PF, Rng, fit, band, smooth, clamp, ease, TAU, WHITE, hex, mix, flare } from '../../core/index.js';
import { Plume, draft, cull, fadeEdges, pool } from '../explosions/_lib.js';
import { noiseFor, smokePuff } from '../fire/_lib.js';
import { FLAMES, flames, lotus, petal } from './_lotus-lib.js';
import { createGroundBlast } from './_blast.js';
import { STONE } from './_lib.js';

export const BREAK = 0.42;
const QUIET = BREAK - 0.1;
export const meta = {
  name: 'Hoa Lien Burst',
  desc: 'A cracking lotus ruptures into separate whorls of alien fire, a petal shock front, a rolling mushroom crown and a rain of burning petals and brands.',
  tags: ['ultimate', 'lotus', 'explosion', 'mushroom', 'fire', 'one-shot'],
  size: [480, 380], origin: [240, 342], duration: 4.2, loop: false, fps: 30, bg: 'ground',
  options: { flames: FLAMES, seed: 17 },
};
const SM = ['#66636b', '#514e58', '#3d3944', '#2a2632', '#18151f'].map(hex);
const LEAD = hex('#fff1bd');
const noise = noiseFor(0);
const WIDTH = Array.from({ length: 129 }, (_, i) => Math.pow(1 - i / 128, 0.85));

// Fixed polar samples keep the expanding thermal volume free of per-pixel trig at runtime.
const FIRE_FIELD = Array.from({ length: 179 }, (_, row) => {
  const y = row - 89, cells = [], width = Math.floor(Math.sqrt(89 * 89 - y * y));
  for (let x = -width; x <= width; x++) {
    const d = Math.hypot(x, y) / 89, a = Math.atan2(y, x), roll = d * 22 - a * 3;
    cells.push([x, d, a, Math.sin(a * 7), Math.cos(a * 7), Math.sin(a * 13), Math.cos(a * 13),
      Math.sin(roll), Math.cos(roll), Math.sin(y * 0.23 + x * 0.12) * 0.08]);
  }
  return { y, cells };
});

export function create(o) {
  const C = flames(o), FR = C.map(r => fit(r, 9).reverse()), R = new Rng(o.seed);
  const cooled = FR.map(r => Array.from({ length: 5 }, (_, k) => r.map((_, i) => r[Math.min(8, i + k)])));
  const shockRamps = C.map(r => [mix(r[0], SM[4], 0.35), mix(r[2], SM[2], 0.45), mix(r[4], SM[0], 0.3), LEAD]);
  const mistColors = C.map(r => mix(SM[0], r[2], 0.13));
  const mist = Array.from({ length: 8 }, (_, i) => ({
    x: R.range(-90, 75), y: R.range(-255, -180), r: R.range(13, 24),
    phase: R.range(0, TAU), speed: R.range(10, 25), color: i % C.length,
  }));
  let ground;
  const lights = new Lights();
  const systems = C.map((r, i) => {
    let blazes;
    const ps = new Particles({ rng: new Rng(o.seed + i * 173), ground: () => 0,
      sparks: [r[5], r[4], r[3], r[1]], onLand: (x, y) => blazes.add(x, y - 0.4, R.range(0.35, 0.65), R.range(0.4, 0.8)) });
    blazes = new Blazes(ps);
    return { ps, blazes };
  });
  const plume = new Plume(R, { y: -48, rise: 194, tau: 0.58, drift: 2, tube: [18, 33], ring: [8, 65],
    grow: 0.48, n: 18, size: [15, 22], swell: 0.25, spin: 5, spinTau: 0.9, heat: 1.55, cool: 0.68,
    under: 0.65, tilt: 0.16, squash: 0.62, fade: [1.6, 2.4], spread: 24, inner: true });
  plume.lobes.forEach((q, i) => { q.color = Math.floor(i * C.length / plume.lobes.length); q.f *= 0.12; });
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
    ground = createGroundBlast({ seed: o.seed, scale: 0.85, hot: o.palette ?? o.flames?.[0] ?? FLAMES[0], dirt: STONE, haze: '#3d3346' });
    lights.add(0, -68, 122, WHITE, 1.1, 0.12);
    for (let i = 0; i < 28; i++) {
      systems[i % C.length].blazes.add(R.range(-146, 146), R.range(-3, 4), R.range(1.3, 2.65), R.range(0.8, 1.5));
    }
    C.forEach((r, j) => lights.add((j - (C.length - 1) / 2) * 20, -55, 70, r[3], 0.3, 0.65));
    for (let i = 0; i < 110; i++) {
      const j = i % C.length, { ps } = systems[j], a = R.range(-Math.PI - 0.08, 0.08), v = R.range(130, 440);
      ps.spawn(P.SPARK, 0, -22, Math.cos(a) * v, Math.sin(a) * v - 30, R.range(0.22, 0.62));
    }
    for (let i = 0; i < 28; i++) {
      const j = i % C.length, { ps } = systems[j], a = -Math.PI + (j + 0.5) / C.length * Math.PI + R.range(-0.2, 0.2);
      const d = R.range(3, 24), v = R.range(50, 150);
      ps.spawn(P.FIRE, Math.cos(a) * d, -30 + Math.sin(a) * d, Math.cos(a) * v, Math.sin(a) * v - 25,
        R.range(0.3, 0.5), 0, R.range(11, 17), R.range(0, 0.06), PF.BIG | (i % 8 === 0 ? PF.SMOKES : 0));
    }
    for (let i = 0; i < 40; i++) {
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
      const radius = (207 - beat * 20) * ease.outCubic(u), alpha = Math.pow(1 - u, 0.65);
      const thick = 3 + 9 * (1 - u), ramp = shockRamps[beat % C.length];
      band(p, 0, 1, radius, 0.13, thick, alpha * 0.8, ramp, keep);
      // One hue per front: pale hot tips trail into the same flame's smoky wake.
      for (let i = 0; i < 24; i++) {
        const a = (i + beat * 0.5) * TAU / 24;
        if (!keep(a)) continue;
        for (let w = 4; w >= 0; w--) {
          const pts = [-1, 0, 1].map(v => {
            const g = a + v * TAU / 48, r = radius - w + (v ? -2 : 8) * (1 - u);
            return [Math.cos(g) * r, 1 + Math.sin(g) * r * 0.13];
          });
          p.polyline(pts, ramp[w === 0 ? 3 : w < 3 ? 2 : 0], alpha * (w === 0 ? 0.85 : 0.55));
        }
      }
    }
  }
  // Cache continuous smoke coverage and eroded curls once, rather than shade overlapping discs each frame.
  function bakeSmoke(r, tint, pale = false) {
    const pixels = [];
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      const u = x / r, v = y / r;
      const warped = u + Math.sin(v * 4) * 0.14;
      const d = 1 - warped * warped - v * v;
      const density = d - 0.055 * (Math.sin(u * 17 + v * 9) + Math.sin(v * 22 - u * 5));
      if (density < 0.025) continue;
      const alpha = smooth(0, 0.35, density) * (0.35 + density * 0.32);
      const lit = clamp(0.45 - v * 0.32 - u * 0.15 + Math.sin(u * 5 + v * 4) * 0.1);
      const col = pale ? tint : mix(SM[3], SM[0], lit);
      pixels.push([x, y, col, alpha]);
    }
    return pixels;
  }
  const smokeStamps = [12, 18, 24, 30].map(r => bakeSmoke(r));
  const mistStamps = mistColors.map(c => bakeSmoke(25, c, true));
  function stamp(p, pixels, x, y, alpha, curl = 0) {
    if (alpha * p.fade < 0.012) return;
    if (p.cs !== 1 || p.sn !== 0) {
      for (const q of pixels) p.blend(x + q[0] + q[1] * curl, y + q[1], q[2], q[3] * alpha);
      return;
    }
    // Axis-aligned alpha stamps avoid transforms and temporary closures per smoke pixel.
    const bx = p.tx + x * p.fx - p.ox, by = Math.floor(p.ty + y) - p.oy;
    const opacity = alpha * p.fade;
    for (const q of pixels) {
      const sx = Math.floor(bx + (q[0] + q[1] * curl) * p.fx), sy = by + q[1];
      const a = q[3] * opacity;
      if (sx < 0 || sx >= p.w || sy < 0 || sy >= p.h || a <= 0.004) continue;
      const i = sy * p.w + sx, d = p.C[i], c = q[2];
      const oa = a + (d >>> 24) / 255 * (1 - a), k = a / oa;
      const r = ((c & 255) * k + (d & 255) * (1 - k)) | 0;
      const g = (((c >>> 8) & 255) * k + ((d >>> 8) & 255) * (1 - k)) | 0;
      const b = (((c >>> 16) & 255) * k + ((d >>> 16) & 255) * (1 - k)) | 0;
      p.C[i] = ((oa * 255) << 24) | (b << 16) | (g << 8) | r;
    }
  }
  function stem(p, S, age, alpha) {
    const top = S.y + S.tube * 0.4, heat = 1 - smooth(1.05, 2.15, age);
    const base = alpha * (1 - smooth(2, 2.65, age));
    if (base <= 0) return;
    const saved = p.fade; p.fade *= base;
    const edges = C.map(r => mix(SM[3], r[1], heat * 0.6));
    for (let y = Math.ceil(top); y < -3; y++) {
      const u = (y - top) / -top;
      const w = 10 + 18 * Math.pow(u, 5) + Math.sin(y * 0.13 - age * 8) * 2, sway = Math.sin(y * 0.045 + age * 3) * 4;
      for (let x = -w; x <= w; x++) {
        const j = ((Math.floor((x / w + 1) * C.length / 2 + y * 0.018 - age) % C.length) + C.length) % C.length;
        const f = (1 - Math.abs(x) / w) * heat * (0.8 + Math.sin(y * 0.12 + x * 0.18 - age * 9) * 0.2);
        const col = f > 0.64 ? C[j][4] : f > 0.24 ? C[j][3] : edges[j];
        p.blend(x + sway, y, col, Math.min(1, u * 8) * (0.75 + heat * 0.25));
      }
    }
    p.fade = saved;
  }
  function fireball(p) {
    const age = t - BREAK;
    if (age <= 0 || age >= 1.05) return;
    const r = 28 + 61 * ease.outCubic(clamp(age / 0.42)), cy = -60 - age * 72;
    const alpha = 1 - smooth(0.62, 1.05, age), saved = p.fade; p.fade *= alpha;
    const scale = r / 89, s7 = Math.sin(age * 10), c7 = Math.cos(age * 10);
    const s13 = Math.sin(age * 12), c13 = Math.cos(age * 12);
    const sr = Math.sin(age * 14), cr = Math.cos(age * 14);
    for (const row of FIRE_FIELD) {
      const y = row.y * scale, warp = Math.sin(y * 0.09 + age * 9) * 3;
      for (const q of row.cells) {
        const d = q[1], theta = q[2];
        const edge = 0.87 + (q[3] * c7 + q[4] * s7) * 0.06 + (q[5] * c13 - q[6] * s13) * 0.035;
        if (d > edge) continue;
        const a = theta + d * 3.2 - age * 4;
        const j = ((Math.floor(a / TAU * C.length) % C.length) + C.length) % C.length;
        const roll = (q[7] * cr - q[8] * sr) * 0.5 + 0.5;
        const heat = (1 - d) * 0.43 + roll * 0.4 + q[9];
        const k = heat > 0.7 ? 5 : heat > 0.55 ? 4 : heat > 0.35 ? 3 : heat > 0.19 ? 2 : 1;
        p.blend(q[0] * scale + warp, cy + y * 0.96, age < 0.1 && d < 0.55 ? WHITE : C[j][k], Math.min(1, (edge - d) * 18));
      }
    }
    p.fade = saved;
  }
  function air(p) {
    const age = t - BREAK;
    const x0 = Math.max(-236, 3 - p.tx), x1 = Math.min(236, 476 - p.tx);
    const u = age / 0.72;
    if (u > 0 && u < 1) {
      const r = 24 + 405 * ease.outCubic(u), alpha = (1 - u) * 0.22;
      // A translucent pressure volume with a bright leading shell, cut at the floor.
      for (let y = Math.max(-334, Math.ceil(-r)); y < 0; y++) {
        const xx = Math.sqrt(Math.max(0, r * r - y * y));
        for (let x = Math.max(x0, Math.ceil(-xx)); x <= Math.min(x1, xx); x++) {
          const d = r - Math.sqrt(x * x + y * y);
          const edge = Math.min(1, (x - x0) / 5, (x1 - x) / 5);
          if (d < 13) p.blend(x, y, LEAD, alpha * edge * (0.2 + 0.8 * (1 - d / 13)));
          else if (d < 46) p.blend(x, y, SM[0], alpha * edge * 0.14 * (1 - (d - 13) / 33));
          if (d < 1.7) p.dot(x, y, WHITE, (1 - u) * edge * 0.8);
        }
      }
    }
    // Paired dark/light refractive ripples trail the compressed shell.
    for (let beat = 0; beat < 3; beat++) {
      const v = (age - beat * 0.12) / 0.95;
      if (v <= 0 || v >= 1) continue;
      const r = 32 + 360 * ease.outCubic(v), a = Math.sin(v * Math.PI) * 0.36;
      let prev;
      for (let i = 0; i <= 128; i++) {
        const ang = -Math.PI + i * Math.PI / 128;
        const rr = r + Math.sin(ang * 9 + age * 18) * 2.5;
        const x = Math.cos(ang) * rr, y = Math.sin(ang) * rr;
        if (x < x0 + 2 || x > x1 - 2 || y < -331) { prev = undefined; continue; }
        if (prev) {
          p.line(prev[0], prev[1], x, y, SM[4], a);
          p.line(prev[0], prev[1] - 2, x, y - 2, LEAD, a * 0.6);
        }
        prev = [x, y];
      }
    }
  }
  function lingeringMist(p) {
    const age = t - BREAK;
    const alpha = smooth(1.4, 2.05, age) * (1 - smooth(3.05, 3.72, age));
    if (alpha <= 0) return;
    const saved = p.fade; p.fade *= alpha * 0.16;
    for (const q of mist) {
      const drift = Math.max(0, age - 1.4), x = q.x + drift * q.speed;
      const y = q.y + Math.sin(age * 1.5 + q.phase) * 9;
      stamp(p, mistStamps[q.color], x, y, 1, Math.sin(age * 1.6 + q.phase) * 0.35);
    }
    p.fade = saved;
  }
  // Draw simulated FIRE as ragged tongues, never as concentric round puffs.
  function tongue(p, q, H, ux, uy, size, N) {
    const nx = -uy, ny = ux, len = size * 2.4, width = size * 0.65;
    const bend = N(7, q.seed) * size * 0.6;
    // One thermal pass replaces six overlapping half-pixel layers per tongue.
    for (let r = 0; r <= len; r += 1) {
      const u = r / len, half = width * WIDTH[Math.round(u * 128)] * Math.min(1, (r + 1.5) / 3.5)
        + N(9, q.seed, r * 0.45) * 0.75;
      if (half < 0.3) continue;
      const off = bend * u * u + N(4, q.seed + 7, r * 0.2) * u * 1.8;
      const x = q.x + ux * r + nx * off, y = q.y + uy * r + ny * off;
      for (let v = -half; v <= half; v++) {
        const heat = (1 - Math.abs(v) / half) * (1 - u);
        p.px(x + nx * v, y + ny * v, H[heat > 0.8 ? 0 : heat > 0.65 ? 1 : heat > 0.45 ? 3 : heat > 0.22 ? 4 : 6]);
      }
    }
  }
  function drawFire(ps, p, j, layer) {
    const all = ps.list, fire = [], smoke = [], rest = [];
    for (const q of all) (q.k === P.FIRE ? fire : q.k === P.SMOKE ? smoke : rest).push(q);
    ps.list = rest; ps.draw(p, layer); ps.list = all;
    // The same smoke model in direct screen spans avoids per-pixel angle calculations.
    if (layer === 'back') for (const q of smoke) {
      if (q.delay <= 0) smokePuff(p, q.x, q.y, q.life / q.max, q.size, q.col, !!(q.flag & PF.BIG));
    }
    const N = (rate, seed = 0, off = 0) => noise(t, rate, seed, off);
    for (const q of fire) {
      if (q.delay > 0 || !!(q.flag & PF.BACK) !== (layer === 'back')) continue;
      const k = q.life / q.max, cooling = Math.floor((1 - k) * 4);
      const H = cooled[j][cooling];
      const speed = Math.hypot(q.vx, q.vy) || 1, dx = q.vx / speed * 0.65, dy = Math.min(-0.3, q.vy / speed);
      const norm = Math.hypot(dx, dy), size = q.size * (0.55 + k * 0.45);
      const saved = p.fade; p.fade *= Math.min(1, k * 4);
      tongue(p, q, H, dx / norm, dy / norm, size, N);
      // Shared stream lights replace a radial light evaluation for every tongue.
      p.fade = saved;
    }
  }
  function cloud(p) {
    const age = t - BREAK;
    if (age < 0.18 || age > 2.5) return;
    const S = plume.shape(), E = plume.ember();
    const alpha = smooth(0.18, 0.42, age) * (1 - smooth(1.6, 2.4, age));
    stem(p, S, age, alpha);
    // PF.BIG smoke follows the toroidal roll: out over the crown, inward beneath the rim.
    const lobes = plume.lobesAt(plume.t);
    for (const e of lobes) {
      const size = Math.min(3, Math.max(0, Math.round((e.r - 12) / 6)));
      stamp(p, smokeStamps[size], e.x, e.y, alpha * e.fade * 0.8,
        Math.sin(age * 1.8 + e.q.th) * 0.18);
      if (e.z < -0.15 || e.up > 0.3) continue;
      const underside = clamp((e.y - S.y + 8) / 23);
      const tint = C[e.q.color][3], strength = E * alpha * e.fade * underside * 0.6;
      // Warm rolling undersides remain separate from the neutral crown.
      pool(p, e.x, e.y + e.r * 0.45, e.r * 0.75, e.r * 0.25, tint, strength);
    }
  }
  function pressure(p) {
    const still = t >= QUIET, tt = Math.min(t, QUIET), u = tt / QUIET;
    const saved = p.fade;
    if (still) p.fade *= 0.48;
    lotus(p, tt, C, { y: -22, size: 0.75 * (1 - u * 0.38), instability: still ? 0 : u * 1.8,
      halo: false, seed: o.seed });
    p.fade = saved;
    if (still) return; // A held, dim silhouette for exactly 0.1 s before rupture.
    for (let j = 0; j < C.length; j++) {
      const a = j * TAU / C.length + tt * (j & 1 ? -12 : 12), reach = 9 + 9 * u;
      const x = Math.cos(a) * reach, y = -30 + Math.sin(a) * reach * 0.55;
      petal(p, x, y, -x * 0.9, -30 - y - 5, 2 + u * 2, C[j], tt, j + o.seed,
        u * 0.8, u, false);
      const crack = [[x * 0.75, y], [x * 0.4 + Math.sin(j * 7 + tt * 60) * 2, -31], [0, -29]];
      p.polyline(crack, C[j][4], u * 0.8);
      p.polyline(crack.slice(1), LEAD, smooth(0.35, 1, u));
    }
    // Paired dark/light ripples make compressed air readable against the scene.
    for (let i = 0; i < 3; i++) {
      const q = (u * 1.4 + i / 3) % 1, r = 17 + (1 - q) * 32;
      const pts = Array.from({ length: 49 }, (_, k) => {
        const a = k / 48 * TAU, warp = Math.sin(a * 5 + tt * 35) * u;
        return [Math.cos(a) * (r + warp), -29 + Math.sin(a) * r * 0.46];
      });
      p.polyline(pts, SM[4], Math.sin(q * Math.PI) * u * 0.5);
      p.polyline(pts.map(([x, y]) => [x, y - 1]), SM[0], Math.sin(q * Math.PI) * u * 0.25);
    }
  }
  return {
    update(dt) {
      t += dt;
      if (!boom && t >= BREAK) { boom = true; explode(); }
      if (t >= BREAK) {
        ground.update(dt);
        plume.update(dt);
        const age = t - BREAK, S = plume.shape();
        // Emission follows eight climbing, turning paths. A hue stays attached to its stream.
        if (age < 0.92) for (let i = 0; i < streamAcc.length; i++) {
          const j = i % C.length, a = i * TAU / streamAcc.length + age * 3.8;
          const radius = 12 + 58 * (1 - Math.exp(-age * 7));
          const x = Math.cos(a) * radius, y = -58 - age * 70 + Math.sin(a) * radius * 0.65;
          for (streamAcc[i] += dt * 9; streamAcc[i] >= 1; streamAcc[i]--) {
            systems[j].ps.spawn(P.FIRE, x + R.range(-3, 3), y + R.range(-3, 3),
              -Math.sin(a) * 75 + Math.cos(a) * 25, Math.cos(a) * 45 - 55,
              R.range(0.24, 0.42), 0, R.range(10, 16), 0, PF.BIG | (R.chance(0.07) ? PF.SMOKES : 0));
            // Broad inner tongues join the whorls into a fireball instead of a hollow wheel.
            if (age < 0.65) systems[j].ps.spawn(P.FIRE, x * 0.42, -59 - age * 63 + Math.sin(a) * radius * 0.25,
              -Math.sin(a) * 30, -45 + Math.cos(a) * 20, R.range(0.24, 0.38), 0, R.range(15, 21), 0, PF.BIG);
          }
        }
        for (const q of petals) {
          const [x, y] = petalPos(q, age);
          if (age < Math.min(0.95, q.life) && y < -5 && R.chance(15 * dt)) {
            systems[q.color].ps.spawn(P.FIRE, x, y, -q.vx * 0.1, -20, 0.2, 0, R.range(2, 4), 0, PF.BIG);
          }
        }
        for (let j = 0; j < C.length; j++) {
          const { ps, blazes } = systems[j];
          if (age > 0.1 && age < 1.45 && R.chance(12 * dt)) ps.spawn(P.FIRE, R.range(-14, 14), -8,
            R.range(-15, 15), -R.range(180, 280), R.range(0.35, 0.55), 0, R.range(6, 10), 0, R.chance(0.2) ? PF.SMOKES | PF.BIG : 0);
          if (age > 1.2 && age < 2.25 && R.chance(8 * dt)) ps.spawn(P.EMBER, R.range(-70, 70), -R.range(50, 130),
            R.range(-20, 20), -R.range(5, 20), R.range(0.3, 0.6), C[j][3]);
          blazes.update(dt);
          draft(ps, dt, { top: S.y, w: 11, up: 110, pull: 50, low: 12, reach: 120, k: 1 - smooth(0.9, 1.6, age) });
          ps.update(dt);
          // The late haze has its own slow advection; keep hot particle smoke local.
          for (const q of ps.list) if (q.k === P.SMOKE) q.life = Math.min(q.life, 0.5);
          cull(ps, -202, -315, 202, 16);
          fadeEdges(ps, -210, 210, 30, 28);
        }
      }
      lights.update(dt);
    },
    drawBack(p) {
      if (t >= 4.16) return;
      const saved = p.fade; p.fade *= 1 - smooth(3.65, 4.16, t);
      if (t >= BREAK) {
        const age = t - BREAK;
        ground.drawBack(p);
        pool(p, 0, 1, 174, 17, C[0][3], 0.25 * (1 - smooth(0.5, 2.6, age)));
        p.ellipse(0, 1, 133, 11, hex('#100e1b'), (1 - smooth(2.65, 3.7, age)) * 0.65);
        for (let j = 0; j < C.length; j++) {
          drawFire(systems[j].ps, p, j, 'back');
          // Blazes supply fuel; ground coals retain their own flame's hue.
          for (const b of systems[j].blazes.list) {
            const k = b.life / b.max;
            p.dot(b.x, b.y, C[j][k > 0.45 ? 4 : 2], Math.min(1, k * 4));
            p.glow(b.x, b.y, 6, C[j][3], k * 0.22);
          }
        }
        shock(p, true);
        cloud(p);
        fireball(p);
        lingeringMist(p);
      }
      p.fade = saved;
    },
    draw(p) {
      if (t >= 4.16) return;
      const saved = p.fade; p.fade *= 1 - smooth(3.65, 4.16, t);
      if (t < BREAK) {
        pressure(p);
        p.fade = saved; return;
      }
      const age = t - BREAK;
      ground.draw(p);
      air(p);
      if (age < 0.12) {
        // The flash already has a timed light; avoid redrawing an oversized white lotus.
        p.ellipse(0, -62, 35 + age * 260, 30 + age * 180, WHITE, 1 - age / 0.12);
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
