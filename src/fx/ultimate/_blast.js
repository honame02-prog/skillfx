// Shared ground-blast kit for the ultimates (Tu Thien Chi and Phat No Hoa Lien).
// API contract fixed by Opus; implementation by Codex task A. Callers (sky-quake.js, hoa-lien-burst.js) only use this API.
//
// createGroundBlast(o) -> { update(dt), drawBack(p), draw(p), done() }
//   Local coordinates: (0, 0) is the impact point on the floor, y up is negative. Starts at t = 0 when created/updated.
//   o.seed      number   seeded Rng (never Math.random)
//   o.scale     number   1 = Tu Thien Chi size (debris up to ~260 px high, dust ring to the canvas edges ~240 px each side)
//   o.hot       string[] ramp dark -> bright for the glowing core / embers / lit dust (e.g. GOLD, or one flame ramp)
//   o.dirt      string[] ramp dark -> bright for soil, rocks and dust (e.g. STONE)
//   o.haze      string   tint of the lingering smoke haze (hex)
//   o.halfWidth number   how far the ground damage reaches each side, px at scale 1 (default 230)
//   o.duration  number   seconds until everything is gone and the blast draws nothing (default 3.2)
//   o.outward   number   0 = debris thrown up (default), 1 = debris and grit hurled low and far sideways
//   o.jet       number   height multiplier for the dirt geysers (default 1)
//
// What it draws (all deterministic, contained to its own box, ends empty):
//   - ground burst: a crater flash, dirt geysers and soil columns thrown up
//   - debris: big rocks and clods (Bits) flying HIGH on parabolas, tumbling, landing with dust puffs
//   - ground shockwave: a dense dust surge racing along the floor in perspective (near half in front, far half behind)
//   - lingering haze: low translucent smoke that rolls and drifts and slowly thins (no checkerboard)

import { Particles, Bits, Lights, P, B, Rng, fit, hex, mix, clamp, smooth, ease, TAU, WHITE } from "../../core/index.js";

// Optional bounds: local [left, top, right, bottom], useful for an off-centre impact.
// Soil fountain / landing physics adapted from Sprite Fusion's open-source explosion
// (https://www.spritefusion.com/pixel-art-vfx/explosion), MIT, Copyright (c) 2026 Hugo Duprez.
export function createGroundBlast(o = {}) {
  const s = o.scale ?? 1, out = o.outward ?? 0, jetK = o.jet ?? 1, duration = o.duration ?? 3.2, reach = (o.halfWidth ?? 230) * s;
  const R = new Rng(o.seed ?? 1);
  const D = fit(o.dirt ?? ["#191622", "#342b3a", "#514353", "#81706d", "#c4ae8c"], 5);
  const H = fit(o.hot ?? ["#352536", "#a57440", "#d8a750", "#ffe8ae", "#fff8dc"], 7);
  const haze = hex(o.haze ?? "#4a4552"), cap = mix(D[4], H[5], 0.18);
  const box = o.bounds ?? [-reach - 8 * s, -360 * s, reach + 8 * s, 36 * s];
  const ps = new Particles({ rng: R, ground: () => -2 * s, sparks: [H[6], H[5], H[3], H[1]] });
  const rocks = new Bits({ ground: () => -4 * s }), lights = new Lights();
  let t = 0, next = 0;

  // Bake irregular, interlocking rolls once. Continuous alpha and eroded edges,
  // with a raised lit shoulder and shaded underside; no dithered circles.
  function cloud(w, h, colors, phase) {
    const pixels = [], lobes = Array.from({ length: 5 }, (_, i) => ({
      x: (i - 2) * 0.31, y: R.range(-0.22, 0.12), rx: R.range(0.3, 0.48), ry: R.range(0.48, 0.8),
    }));
    for (let y = -Math.ceil(h); y <= h; y++) for (let x = -Math.ceil(w); x <= w; x++) {
      const u = x / w, v = y / h;
      let density = 0, lighting = 0;
      for (const l of lobes) {
        const dx = (u - l.x - v * 0.14) / l.rx, dy = (v - l.y) / l.ry;
        const d = 1 - dx * dx - dy * dy;
        if (d > density) { density = d; lighting = -dy * 0.65 - dx * 0.22; }
      }
      density -= 0.07 * (Math.sin(u * 19 + v * 11 + phase) + Math.sin(v * 23 - u * 9));
      if (density <= 0.025) continue;
      const alpha = smooth(0, 0.48, density) * (0.24 + 0.3 * density);
      const c = lighting > 0 ? mix(colors[1], colors[2], smooth(0, 0.65, lighting))
        : mix(colors[1], colors[0], smooth(0, 0.55, -lighting));
      pixels.push([x, y, c, alpha]);
    }
    return pixels;
  }
  const soilStamps = [0, 1, 2, 3].map(i => cloud((12 + i * 2) * s, (16 + i * 2) * s, [D[1], D[3], cap], i));
  const waveStamps = [0, 1, 2].map(i => cloud((19 + i * 3) * s, (12 + i * 2) * s, [D[2], D[3], cap], i + 4));
  const mistStamps = [0, 1, 2].map(i => cloud((38 + i * 8) * s, (15 + i * 4) * s,
    [mix(haze, D[1], 0.2), haze, mix(haze, D[4], 0.32)], i + 8));
  function stamp(p, pixels, x, y, alpha, curl = 0) {
    if (alpha < 0.012) return;
    for (const q of pixels) {
      const xx = Math.floor(x + q[0] + q[1] * curl), yy = Math.floor(y + q[1]);
      const edge = clamp(Math.min(xx - box[0], box[2] - xx, yy - box[1], box[3] - yy) / (9 * s));
      if (edge > 0) p.blend(xx, yy, q[2], q[3] * alpha * edge);
    }
  }
  const jets = Array.from({ length: 8 }, (_, i) => ({
    at: 0.025 + [5, 2, 0, 3, 1, 4, 6, 7][i] * 0.022 + R.range(0, 0.02), x: (i - 3.5) * 12 * s,
    vx: (i - 3.5) * R.range(25, 36) * s, speed: R.range(565, 685) * s * jetK,
    phase: R.range(0, TAU),
  }));
  const wave = Array.from({ length: 30 }, (_, i) => {
    const a = (i + 0.15) / 30 * TAU;
    return { ca: Math.cos(a), sa: Math.sin(a), size: i % 3, phase: R.range(0, TAU) };
  });
  const mist = Array.from({ length: 10 }, (_, i) => ({
    x: (i - 4.5) * reach / 5.5, y: -R.range(14, 51) * s,
    phase: R.range(0, TAU), drift: R.range(6, 14) * s, at: R.range(0.5, 0.8), back: i % 3 !== 0,
  }));
  const launches = Array.from({ length: 34 }, (_, i) => {
    const side = i % 2 ? 1 : -1;
    return { at: 0.035 + (i % 8) * 0.026, b: {
      kind: i % 7 === 0 ? B.SHARD : B.CHUNK, x: R.range(-28, 28) * s, y: -6 * s,
      vx: side * ((a, k) => a * (1 - k) + (150 + a * 1.6) * k)(R.range(38, 132), out) * s, vy: -R.range(515, 675) * (1 - 0.62 * out) * s,
      g: 0.9 * s, drag: 0.055, bounce: R.range(0.18, 0.28),
      s: (i < 9 ? R.range(4, 5.5) : R.range(1.5, 3.8)) * s,
      a: R.range(0, TAU), va: R.range(-11, 11), ramp: D, c: D[3],
      life: Math.max(0.1, Math.min(duration - 0.3, R.range(2.55, 3.02))),
    } };
  }).sort((a, b) => a.at - b.at);
  for (let i = 0; i < 110; i++) ps.spawn(P.GRIT, R.range(-22, 22) * s, -4 * s,
    R.range(-205, 205) * (1 + 1.6 * out) * s, -R.range(220, 670) * (1 - 0.6 * out) * s, R.range(1.1, 1.9), R.pick(D.slice(1)), i % 4 === 0 ? 2 * s : s, R.range(0.025, 0.24));
  for (let i = 0; i < 28; i++) ps.spawn(P.SPARK, R.range(-18, 18) * s, -3 * s,
    R.range(-240, 240) * s, -R.range(80, 350) * s, R.range(0.18, 0.5), H[5], s);
  for (let i = 0; i < 12; i++) ps.spawn(P.EMBER, R.range(-18, 18) * s, -5 * s,
    R.range(-45, 45) * s, -R.range(25, 85) * s, R.range(0.6, 1.2), H[3], s);
  lights.add(0, -20 * s, 84 * s, H[4], 0.9, 0.32);
  lights.add(0, -4 * s, 38 * s, WHITE, 0.8, 0.09);

  function surge(p, back) {
    const u = clamp((t - 0.035) / 0.83), radius = 12 * s + (reach - 24 * s) * ease.outCubic(u);
    const alpha = smooth(0.025, 0.13, t) * (1 - smooth(0.65, 1.65, t));
    if (alpha <= 0) return;
    for (const q of wave) {
      if ((q.sa < 0) !== back) continue;
      const x = q.ca * radius, y = q.sa * radius * 0.095 - (8 + 3 * Math.sin(q.phase + t * 5)) * s;
      stamp(p, waveStamps[q.size], x, y, alpha * (back ? 0.64 : 0.94), q.ca * 0.25);
      if (t < 0.7 && Math.abs(x) < reach - 15 * s && x > box[0] + 20 * s && x < box[2] - 20 * s)
        p.line(x - 5 * s, y - 9 * s, x + 4 * s, y - 10 * s, H[4], alpha * 0.55);
    }
  }
  function fog(p, back) {
    for (let i = 0; i < mist.length; i++) {
      const q = mist[i];
      if (q.back !== back) continue;
      const age = t - q.at;
      const alpha = smooth(0, 0.5, age) * (1 - smooth(duration * 0.54, duration, t)) * 0.87;
      stamp(p, mistStamps[i % 3], q.x + age * q.drift + Math.sin(t * 1.8 + q.phase) * 8 * s,
        q.y - age * 3 * s + Math.cos(t * 2 + q.phase) * 4 * s, alpha, Math.sin(t * 1.5 + q.phase) * 0.22);
    }
  }
  function fountain(p) {
    for (let i = 0; i < jets.length; i++) {
      const j = jets[i], age = t - j.at, fade = smooth(0, 0.06, age) * (1 - smooth(0.56, 1.24, age));
      if (fade <= 0) continue;
      // Successive soil rolls follow the head; the foot tears loose as gravity wins.
      for (let k = 5; k >= 0; k--) {
        const a = Math.max(0, age - k * 0.062), h = Math.max(0, j.speed * a - 550 * s * a * a);
        const x = j.x + j.vx * a + Math.sin(j.phase + k * 1.7 + t * 4) * 4 * s;
        const y = -6 * s - h;
        stamp(p, soilStamps[(i + k) % 4], x, y, fade * (0.78 - k * 0.045), Math.sin(j.phase + a * 4) * 0.3);
        if (age < 0.52 && k % 2 === 0) {
          const w = (3 + k % 3) * s;
          p.tri(x - w, y + 7 * s, x + w * 0.5, y + 5 * s, x + w, y - 9 * s, D[1], fade);
          p.line(x - w, y + 6 * s, x + w, y - 8 * s, D[3], fade);
        }
      }
    }
  }
  return {
    update(dt) {
      t += dt;
      if (t >= duration) return;
      while (next < launches.length && t >= launches[next].at) rocks.add(launches[next++].b);
      for (const b of rocks.list) b.pvy = b.vy;
      rocks.update(dt);
      for (const b of rocks.list) {
        if (b.pvy > 0 && (b.vy <= 0 || b.rest)) {
          for (let i = 0; i < 3; i++) ps.spawn(P.DUST, b.x, -4 * s, R.range(-25, 25) * s,
            -R.range(8, 20) * s, 0.3, D[3], R.range(1.5, 3) * s);
        }
        const edge = Math.min(b.x - box[0], box[2] - b.x, b.y - box[1], box[3] - b.y);
        if (edge < b.s * 2 + 3 * s) b.life = Math.min(b.life, 0.4 * clamp((edge - b.s * 1.5) / (8 * s)));
      }
      ps.update(dt);
      ps.list = ps.list.filter(q => q.x > box[0] + q.size * 2 && q.x < box[2] - q.size * 2
        && q.y > box[1] + q.size * 2 && q.y < box[3] - q.size * 2);
      lights.update(dt);
    },
    drawBack(p) {
      if (t >= duration) return;
      surge(p, true); fountain(p); fog(p, true); ps.draw(p, "back");
    },
    draw(p) {
      if (t >= duration) return;
      rocks.draw(p); surge(p, false); fog(p, false); ps.draw(p, "front");
      if (t < 0.14) {
        const k = 1 - t / 0.14;
        p.ellipse(0, -2 * s, (20 + 52 * (1 - k)) * s, (3 + 6 * k) * s, H[5], k);
        p.ellipse(0, -3 * s, 30 * s * k, 5 * s * k, WHITE, k);
      }
      lights.draw(p);
    },
    done() { return t >= duration; },
  };
}
