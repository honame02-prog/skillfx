import { Rng, fit, smooth, clamp, TAU, WHITE, hex, mix, bolt, createFrame, Painter } from "../../core/index.js";
import { GOLD, SIZE, ORIGIN, BOX, INK, EMERGE, REVEALED, RELEASE, HIT, DURATION, CLOUD_BASE, rune, stroke } from "./_lib.js";

export const meta = {
  name: "Imprisoned heaven", desc: "Ink storms spiral inward, part around a golden wrist, then freeze with suspended lightning. The impact tears the clouds apart and daylight returns.",
  tags: ["ultimate", "sky", "storm", "vortex", "lightning", "one-shot"], size: SIZE, origin: ORIGIN,
  duration: DURATION, fps: 30, loop: false, bg: "ground", options: { palette: GOLD, seed: 17 },
};

// Cache true translucent discs with uneven scalloped undersides; never dithered smoke.
function puff(size, layer) {
  const w = Math.ceil(size * 3.5), h = Math.ceil(size * 2.5), f = createFrame(w, h), p = new Painter(f);
  p.place(w / 2, h / 2);
  const dark = hex(layer === 0 ? "#0c0d15" : "#171820"), rim = hex(layer === 0 ? "#292c35" : layer === 1 ? "#43454e" : "#63636b");
  p.disc(0, -size * 0.12, size, dark, (d) => 0.58 * (1 - d) ** 0.65);
  for (const [dx, dy, s] of [[-0.64, 0.1, 0.68], [0.56, 0.05, 0.76], [0.05, 0.36, 0.7]]) {
    p.disc(dx * size, dy * size, size * s, rim, (d) => 0.24 * (1 - d) ** 1.2);
    p.disc(dx * size, (dy - 0.18) * size, size * s * 0.87, dark, (d) => 0.49 * (1 - d) ** 0.55);
  }
  const pixels = [];
  f.color.forEach((c, i) => {
    if ((c >>> 24) > 10) pixels.push(i % w - Math.floor(w / 2), Math.floor(i / w) - Math.floor(h / 2), c, (c >>> 24) / 255, mix(c, hex("#191919"), 0.78));
  });
  return new Float64Array(pixels);
}

export function create(o) {
  const C = fit(o.palette, 8), R = new Rng(o.seed), [x0, y0, x1, y1] = BOX;
  const stamps = Array.from({ length: 3 }, (_, layer) => [puff(8 + layer, layer), puff(12 + layer, layer)]);
  const clouds = [];
  for (let layer = 0; layer < 3; layer++) for (let arm = 0; arm < 2; arm++) for (let i = 0; i < 12; i++) {
    const u = (i + R.range(0.1, 0.9)) / 12;
    clouds.push({ layer, arm, u, ph: R.range(-0.14, 0.14), s: R.int(0, 1), delay: R.range(0, 0.2), tear: R.range(0.7, 1.3) });
  }
  // A soft ink wash and a tightening side vignette, feathered inside the shared canvas.
  const veilSamples = [];
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const edge = smooth(0.46, 1.04, Math.hypot((x + 50) / 262, (y + 190) / 224));
    const sky = 1 - smooth(CLOUD_BASE + 45, -70, y), feather = Math.min(1, (x - x0) / 9, (x1 - x) / 9, (y - y0) / 9, (y1 - y) / 9);
    if (feather > 0 && sky * 0.24 + edge * 0.55 > 0.015) veilSamples.push(x, y, sky * feather, edge * feather);
  }
  const veil = new Float32Array(veilSamples);
  const bolts = [-1, 1].map((side) => {
    const path = bolt(R, side * 104, CLOUD_BASE + 18, side * 160, CLOUD_BASE + 121, { jag: 0.28, depth: 4 });
    const mid = path[7], fork = bolt(R, ...mid, mid[0] - side * 33, mid[1] + 35, { jag: 0.35, depth: 3 });
    return { path, fork };
  });
  const runes = Array.from({ length: 12 }, (_, i) => {
    const a = i / 12 * TAU;
    return rune(Math.cos(a) * 65, CLOUD_BASE + Math.sin(a) * 32, 0.75, i % 3);
  });
  let t = 0;
  const wash = new Uint32Array(SIZE[0] * SIZE[1]);
  let washTick = -1;
  function updateWash() {
    // Rasterize the slowly changing, seed-independent wash once per display frame.
    // The usual empty back buffer then needs only native row copies, not 200k blends.
    const tick = Math.floor(t * meta.fps + 1e-6);
    if (tick === washTick) return;
    washTick = tick;
    const tt = tick / meta.fps, gather = smooth(0, EMERGE, tt);
    const dark = smooth(0, EMERGE + 0.35, Math.min(tt, REVEALED)) * (1 - smooth(HIT + 0.15, DURATION - 0.2, tt));
    for (let i = 0; i < veil.length; i += 4) {
      const a = dark * (veil[i + 2] * 0.23 + veil[i + 3] * (0.18 + gather * 0.38));
      wash[(veil[i + 1] + ORIGIN[1]) * SIZE[0] + veil[i] + ORIGIN[0]] = a > 0.004 ? (INK & 0xffffff) | ((a * 255) << 24) : 0;
    }
  }

  function weather(p) {
    if (t <= 0 || t >= DURATION - 0.12) return;
    const locked = t >= REVEALED && t < RELEASE, silent = t >= RELEASE - 0.15 && t < RELEASE;
    // Hold precisely the reveal pose through imprisonment; no hidden time-dependent wobble.
    const clock = t >= REVEALED && t < HIT ? REVEALED : t >= HIT ? REVEALED + (t - HIT) * 0.28 : t;
    const gather = smooth(0, EMERGE, Math.min(t, EMERGE)), opening = smooth(EMERGE, REVEALED, t);
    const aftermath = Math.max(0, t - HIT), clear = 1 - smooth(HIT + 0.15, DURATION - 0.2, t);
    const dark = smooth(0, EMERGE + 0.35, Math.min(t, REVEALED)) * clear;
    const straight = p.sn === 0 && p.cs === 1, sx0 = p.cellX(0, 0), sy0 = p.cellY(0, 0);
    const left = sx0 - ORIGIN[0] - p.ox, top = sy0 - ORIGIN[1] - p.oy;
    let empty = straight && p.fx === 1 && p.fade === 1 && left >= 0 && top >= 0 && left + SIZE[0] <= p.w && top + SIZE[1] <= p.h;
    if (empty) for (let i = 0; i < p.C.length; i++) if (p.C[i]) { empty = false; break; }
    if (empty) for (let y = 0; y < SIZE[1]; y++) p.C.set(wash.subarray(y * SIZE[0], (y + 1) * SIZE[0]), (top + y) * p.w + left);
    else for (let i = 0; i < veil.length; i += 4) {
      const x = veil[i], y = veil[i + 1], a = dark * (veil[i + 2] * 0.23 + veil[i + 3] * (0.18 + gather * 0.38));
      if (a <= 0.004) continue;
      if (straight) {
        const sx = sx0 + x * p.fx, sy = sy0 + y, index = (sy - p.oy) * p.w + sx - p.ox;
        if (sx < p.ox || sx >= p.ox + p.w || sy < p.oy || sy >= p.oy + p.h) continue;
        // Empty back-buffer pixels can receive the cached translucent wash directly.
        if (!p.C[index] && p.fade === 1) p.C[index] = (INK & 0xffffff) | ((a * 255) << 24);
        else p.blendPx(sx, sy, INK, a);
      } else p.blend(x, y, INK, a);
    }

    // Accelerating double beat. The freeze retains the bolts, never the thunder flash.
    const phase = t * 0.95 + t * t * 0.59, beat = phase % 1;
    const pulse = Math.exp(-(((beat - 0.04) / 0.046) ** 2)) + 0.52 * Math.exp(-(((beat - 0.19) / 0.04) ** 2));
    const flash = !locked && !silent && t < RELEASE ? pulse * smooth(0.2, 0.65, t) : 0;
    const core = opening * clear;
    if (core > 0) {
      p.glow(0, CLOUD_BASE + 7, 40, C[4], core * (0.32 + flash * 0.2));
      p.glow(0, CLOUD_BASE + 8, 18, C[6], core * 0.36);
    }

    for (const q of clouds) {
      const enter = smooth(q.delay, EMERGE - 0.12, Math.min(t, EMERGE));
      const a = q.arm * Math.PI + q.u * TAU * 0.76 + clock * (0.18 + q.layer * 0.16) * (1 - q.u * 0.35) + q.ph;
      const radius = 18 + q.u * (166 + q.layer * 7) + opening * (1 - q.u) * 50;
      const cx = Math.cos(a) * radius, cy = CLOUD_BASE + Math.sin(a) * radius * 0.31;
      let x = (q.arm ? 182 : -280) * (1 - enter) + cx * enter;
      let y = (CLOUD_BASE - 42 + q.u * 14) * (1 - enter) + cy * enter;
      // The wrist pushes the inner banks aside, leaving low hanging curls on each side.
      x += Math.sign(cx || 1) * opening * (1 - q.u) * 12;
      y += opening * (1 - q.u) * Math.max(0, Math.sin(a)) * 11;
      const wave = aftermath * 410, distance = Math.hypot(x, (y - CLOUD_BASE) * 2);
      const swept = t >= HIT ? smooth(distance - 24, distance + 24, wave) : 0;
      const drift = swept * Math.log1p(aftermath * 4) * 36 * q.tear;
      x += Math.cos(a) * drift;
      y += Math.sin(a) * drift * 0.5 - swept * aftermath * 6;
      const alpha = smooth(q.delay, q.delay + 0.35, t) * clear * (1 - swept * 0.84) * (0.83 + q.layer * 0.08);
      if (alpha < 0.012) continue;
      const pixels = stamps[q.layer][q.s];
      const contained = x > x0 + 38 && x < x1 - 38 && y > y0 + 38 && y < y1 - 38;
      const bx = p.cellX(x, y), by = p.cellY(x, y);
      for (let i = 0; i < pixels.length; i += 5) {
        const xx = x + pixels[i], yy = y + pixels[i + 1];
        const boundary = contained ? 1 : clamp(Math.min(xx - x0, x1 - xx, yy - y0, y1 - yy) / 12);
        if (boundary <= 0) continue;
        const color = pixels[i + (locked ? 4 : 2)], opacity = pixels[i + 3] * alpha * boundary;
        if (straight) p.blendPx(bx + pixels[i] * p.fx, by + pixels[i + 1], color, opacity);
        else p.blend(xx, yy, color, opacity);
      }
      // Buried lightning illuminates the underside through the light buffer only.
      if (flash > 0.06 && q.layer === 2 && q.u > 0.3 && q.u < 0.48)
        p.glow(x, y + 9, 24, hex("#c1c4d1"), flash * 0.7 * alpha);
    }

    if (core > 0.005) {
      const k = core * (locked || t >= RELEASE ? 0.33 : 0.21 + flash * 0.17);
      // Broken rune orbit, never a dermal print or stacked concentric ellipses.
      for (const pts of runes) p.polyline(pts, C[5], k);
      for (let i = 0; i < 64; i++) {
        const a = i / 64 * TAU;
        if (i % 8 < 5) p.blend(Math.cos(a) * 65, CLOUD_BASE + Math.sin(a) * 32, C[4], k * 0.6);
      }
    }
    if (locked || flash > 0.36) {
      for (let i = 0; i < bolts.length; i++) {
        if (!locked && i === 1 && flash < 0.72) continue;
        const k = locked ? 1 : Math.min(1, flash);
        for (const path of [bolts[i].path, bolts[i].fork]) stroke(p, path, locked ? hex("#707175") : WHITE, k, locked ? hex("#55565a") : hex("#c5c6df"), locked ? 2 : 5);
      }
    }
    // One outward shock front. Each bank shreds when the same front reaches it.
    if (t >= HIT && aftermath < 0.65) {
      const r = aftermath * 410, k = 1 - smooth(0.12, 0.65, aftermath);
      for (let i = 0; i < 144; i++) {
        const a = i / 144 * TAU, x = Math.cos(a) * r, y = CLOUD_BASE + Math.sin(a) * r * 0.5;
        if (x < x0 + 10 || x > x1 - 10 || y < y0 + 10 || y > y1 - 10) continue;
        p.blend(x, y, C[6], k * 0.7);
        if (i % 6 === 0) p.glow(x, y, 8, C[4], k * 0.2);
      }
    }
  }

  return { update(dt) { t += dt; updateWash(); }, drawBack: weather, draw() {} };
}
