import { Rng, fit, smooth, clamp, TAU, WHITE, hex, fbm, bolt, createFrame } from "../../core/index.js";
import { GOLD, SIZE, ORIGIN, BOX, INK, EMERGE, REVEALED, RELEASE, HIT, DURATION, CLOUD_BASE, rune, stroke } from "./_lib.js";

export const meta = {
  name: "Imprisoned heaven", desc: "Opaque ink banks roll into a three-armed storm. Buried thunder lights their bellies; a golden eye opens, heaven freezes, and the impact shreds the sky outward.",
  tags: ["ultimate", "sky", "storm", "vortex", "lightning", "one-shot"], size: SIZE, origin: ORIGIN,
  duration: DURATION, fps: 30, loop: false, bg: "ground", options: { palette: GOLD, seed: 17 },
};

// The cloud field and its rip fragments live at half resolution. Each pixel's
// polar coordinates and billow texture are cached; only two rotating waves change.
export function create(o) {
  const C = fit(o.palette, 8), R = new Rng(o.seed), [x0, y0, x1, y1] = BOX;
  const W = SIZE[0] / 2, H = SIZE[1] / 2, low = createFrame(W, H);
  const cloud = new Uint32Array(W * H), frozen = new Uint32Array(W * H);
  const raster = new Uint32Array(SIZE[0] * SIZE[1]);
  const rasterRows = Array.from({ length: SIZE[1] }, (_, y) => raster.subarray(y * SIZE[0], (y + 1) * SIZE[0]));
  const veil = new Float32Array(W * H), feather = new Float32Array(W * H);
  const samples = [], phaseOffset = R.range(0, TAU);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const xx = x * 2 - ORIGIN[0], yy = y * 2 - ORIGIN[1], i = y * W + x;
    const edge = smooth(0.35, 1.1, Math.hypot((xx + 50) / 255, (yy + 175) / 205));
    feather[i] = clamp(Math.min(xx - x0, x1 - xx - 1, yy - y0, y1 - yy - 1) / 8);
    veil[i] = (0.6 + edge * 0.29) * feather[i];
    if (yy > CLOUD_BASE + 181 || feather[i] <= 0) continue;
    const dx = xx, dy = (yy - CLOUD_BASE) / 0.58, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    const texture = fbm(xx * 0.033, yy * 0.036, o.seed, 3) * 1.55
      + Math.sin(xx * 0.047 + yy * 0.065 + phaseOffset) * 0.26;
    const phase = a * 3 + r * 0.032 + texture * 0.92;
    const bottom = CLOUD_BASE + 153 + fbm(xx * 0.038, 0.4, o.seed + 9, 2) * 25 + Math.sin(xx * 0.065) * 7;
    const body = 1 - smooth(bottom - 21, bottom, yy);
    const belly = Math.exp(-(((yy - bottom + 17) / 15) ** 2));
    const near = 1 - smooth(45, 290, r), hole = Math.hypot(xx / 37, (yy - CLOUD_BASE) / 22);
    samples.push(i, xx, yy, Math.sin(phase), Math.cos(phase), near, texture, body * feather[i], belly, hole, a, r);
  }
  const field = new Float64Array(samples);
  const strikes = [1, 1.7, 2.3, 2.8, 3.2, 3.45].map((at, i) => {
    const x = (i % 2 ? 1 : -1) * R.range(65, 77), y = CLOUD_BASE + R.range(30, 52);
    const path = bolt(R, x, y, x + R.range(-24, 24), -R.range(9, 27), { jag: 0.18, depth: 5 });
    const mid = path[19], fork = bolt(R, ...mid, mid[0] + (i % 2 ? -46 : 46), mid[1] + 75, { jag: 0.26, depth: 4 });
    return { at, x, y, path, fork };
  });
  const runes = Array.from({ length: 12 }, (_, i) => {
    const a = i / 12 * TAU;
    return rune(Math.cos(a) * 52, CLOUD_BASE + Math.sin(a) * 29, 0.75, i % 3);
  });
  // Uneven Voronoi patches give the shock front torn cloud slabs, rather than
  // triangular spokes. The original field remains solid until each slab is hit.
  const scraps = Array.from({ length: 24 }, (_, i) => {
    const x = x0 + (i % 6 + 0.5) * (x1 - x0) / 6 + R.range(-23, 23);
    const y = y0 + (Math.floor(i / 6) + 0.5) * 214 / 4 + R.range(-16, 16);
    const a = Math.atan2((y - CLOUD_BASE) * 1.7, x);
    return { x, y, pixels: [], vx: Math.cos(a) * R.range(175, 310),
      vy: Math.sin(a) * R.range(110, 185) - 24, delay: Math.hypot(x, (y - CLOUD_BASE) * 1.6) / 540 };
  });
  for (let j = 0; j < field.length; j += 12) {
    const index = field[j], x = field[j + 1], y = field[j + 2], texture = field[j + 6];
    let nearest = 0, distance = Infinity;
    for (let i = 0; i < scraps.length; i++) {
      const q = scraps[i], d = (x + texture * 9 - q.x) ** 2 + (y + texture * 7 - q.y) ** 2;
      if (d < distance) { distance = d; nearest = i; }
    }
    scraps[nearest].pixels.push(index, index % W, Math.floor(index / W));
  }
  for (const q of scraps) q.pixels = new Uint32Array(q.pixels);
  const waveLight = Float32Array.from({ length: 513 }, (_, i) => {
    const wave = i / 256 - 1;
    return smooth(0.03, 0.83, wave) * (0.57 - smooth(0.8, 1, wave) * 0.19);
  });
  let t = 0, rasterTick = -1, rasterLocked = false, hasFrozen = false;
  function state() {
    return { locked: t + 1e-8 >= REVEALED && t + 1e-8 < RELEASE, clock: Math.min(t, REVEALED),
      opening: smooth(EMERGE, REVEALED, t), aftermath: Math.max(0, t - HIT),
      clear: 1 - smooth(HIT + 0.15, DURATION - 0.2, t) };
  }

  function paintCloud(clock, opening, locked, target) {
    target.fill(0);
    const enter = smooth(0, 1.2, clock), leftEdge = x0 + enter * 320, rightEdge = x1 - enter * 270;
    const nearC = Math.cos(clock * 0.87), nearS = Math.sin(clock * 0.87);
    const farC = Math.cos(clock * 0.32), farS = Math.sin(clock * 0.32), gain = smooth(0, 0.12, clock);
    for (let j = 0; j < field.length; j += 12) {
      const index = field[j], x = field[j + 1], y = field[j + 2], near = field[j + 5], texture = field[j + 6];
      const wave = field[j + 3] * (nearC * near + farC * (1 - near))
        - field[j + 4] * (nearS * near + farS * (1 - near));
      // Broad ridges coil into three arms; only their bellies carry pale light.
      const intrusion = enter === 1 ? 1 : Math.max(1 - smooth(leftEdge - 43, leftEdge + 10, x + texture * 14),
        smooth(rightEdge - 10, rightEdge + 43, x - texture * 14));
      const hole = opening > 0 && field[j + 9] < opening ? smooth(opening * 0.75, opening, field[j + 9]) : 1;
      const alpha = field[j + 7] * intrusion * hole * gain;
      if (alpha < 0.008) continue;
      const light = waveLight[Math.round((wave + 1) * 256)] + field[j + 8] * 0.29 + texture * 0.12;
      let red = 20 + light * 35, green = 18 + light * 30, blue = 30 + light * 39;
      if (locked) { const gray = red * 0.3 + green * 0.6 + blue * 0.1; red = green = blue = gray * 0.74; }
      target[index] = ((alpha * 255) << 24) | ((blue | 0) << 16) | ((green | 0) << 8) | (red | 0);
    }
  }
  function buildSky(s) {
    const tick = Math.floor(t * meta.fps + 1e-6);
    if (tick === rasterTick && s.locked === rasterLocked) return;
    if (s.locked && rasterLocked) return;
    rasterTick = tick;
    rasterLocked = s.locked;
    const dark = smooth(0, REVEALED, t) * s.clear;
    for (let i = 0; i < low.color.length; i++) low.color[i] = (INK & 0xffffff) | ((dark * veil[i] * 255) << 24);
    if (t < HIT) paintCloud(s.clock, s.opening, s.locked, cloud);
    else {
      if (!hasFrozen) { paintCloud(REVEALED, 1, false, frozen); hasFrozen = true; }
      cloud.fill(0);
      for (const q of scraps) {
        const age = Math.max(0, s.aftermath - q.delay), dx = Math.round(q.vx * age / 2), dy = Math.round(q.vy * age / 2);
        const opacity = 1 - smooth(1.2, 1.8, age);
        if (opacity <= 0) continue;
        for (let i = 0; i < q.pixels.length; i += 3) {
          const index = q.pixels[i], c = frozen[index];
          if (!(c >>> 24)) continue;
          const x = q.pixels[i + 1] + dx, y = q.pixels[i + 2] + dy;
          if (x < 0 || x >= W || y < 0 || y >= H) continue;
          const destination = y * W + x;
          const a = (c >>> 24) * opacity * feather[destination];
          if (a > (cloud[destination] >>> 24)) cloud[destination] = (c & 0xffffff) | (a << 24);
        }
      }
    }
    for (let i = 0; i < cloud.length; i++) {
      const c = cloud[i], a = (c >>> 24) / 255;
      if (a <= 0) continue;
      if (a === 1) { low.color[i] = c; continue; }
      const d = low.color[i], da = (d >>> 24) / 255, oa = a + da * (1 - a), k = a / oa, ik = 1 - k;
      low.color[i] = ((oa * 255) << 24) | (((((c >>> 16) & 255) * k + ((d >>> 16) & 255) * ik) | 0) << 16)
        | (((((c >>> 8) & 255) * k + ((d >>> 8) & 255) * ik) | 0) << 8) | (((c & 255) * k + (d & 255) * ik) | 0);
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const c = low.color[y * W + x], j = y * 2 * SIZE[0] + x * 2;
      raster[j] = c; raster[j + 1] = c; raster[j + SIZE[0]] = c; raster[j + SIZE[0] + 1] = c;
    }
  }

  function weather(p) {
    if (t <= 0 || t >= DURATION - 0.12) return;
    const s = state();
    buildSky(s);
    const straight = p.sn === 0 && p.cs === 1, sx0 = p.cellX(0, 0), sy0 = p.cellY(0, 0);
    const left = sx0 - ORIGIN[0] - p.ox, top = sy0 - ORIGIN[1] - p.oy;
    let empty = straight && p.fx === 1 && p.fade === 1 && left >= 0 && top >= 0 && left + SIZE[0] <= p.w && top + SIZE[1] <= p.h;
    if (empty) for (let i = 0; i < p.C.length; i++) if (p.C[i]) { empty = false; break; }
    if (empty) for (let y = 0; y < SIZE[1]; y++) p.C.set(rasterRows[y], (top + y) * p.w + left);
    else for (let y = 0; y < SIZE[1]; y++) for (let x = 0; x < SIZE[0]; x++) {
      const c = raster[y * SIZE[0] + x];
      if (c >>> 24) p.blend(x - ORIGIN[0], y - ORIGIN[1], c, (c >>> 24) / 255);
    }

    // Six explicit thunder events, then silence. Freeze keeps two dead bolts.
    if (!s.locked && t < REVEALED) for (const q of strikes) {
      const age = Math.max(0, t - q.at);
      if (t + 1e-8 < q.at || age > 0.14) continue;
      const flash = (1 - age / 0.14) ** 2;
      p.glow(q.x, q.y, 108, hex("#b1aabc"), flash * 1.1);
      for (const path of [q.path, q.fork]) stroke(p, path, WHITE, flash, hex("#c5c6df"), 5);
    }
    if (s.locked) for (const q of strikes.slice(-2)) for (const path of [q.path, q.fork])
      stroke(p, path, hex("#707175"), 1, hex("#55565a"), 2);

    const core = s.opening * s.clear * (1 - smooth(HIT, HIT + 0.6, t));
    if (core > 0.005) {
      p.glow(0, CLOUD_BASE, 54, C[4], core * 0.75);
      p.glow(0, CLOUD_BASE, 24, C[6], core * 0.75);
      // Light catches the cloud-facing lip; the hand can emerge through the interior.
      for (let i = 0; i < 100; i++) {
        const a = i / 100 * TAU, ripple = 1 + 0.045 * Math.sin(a * 7);
        const x = Math.cos(a) * 39 * s.opening * ripple, y = CLOUD_BASE + Math.sin(a) * 24 * s.opening * ripple;
        p.blend(x, y, C[5], core * 0.47);
        if (i % 10 === 0) p.glow(x, y, 9, C[4], core * 0.36);
      }
      for (const pts of runes) p.polyline(pts, C[5], core * (s.locked ? 0.3 : 0.2));
    }
    if (t >= HIT && s.aftermath < 0.65) {
      const r = s.aftermath * 540, k = 1 - smooth(0.12, 0.65, s.aftermath);
      for (let i = 0; i < 144; i++) {
        const a = i / 144 * TAU, x = Math.cos(a) * r, y = CLOUD_BASE + Math.sin(a) * r * 0.5;
        if (x < x0 + 10 || x > x1 - 10 || y < y0 + 10 || y > y1 - 10) continue;
        p.blend(x, y, C[6], k * 0.7);
        if (i % 6 === 0) p.glow(x, y, 8, C[4], k * 0.2);
      }
    }
  }
  return { update(dt) { t += dt; }, drawBack: weather, draw() {} };
}

