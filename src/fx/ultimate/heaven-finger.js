import { Rng, fit, smooth, ease, clamp, lerp, band, TAU, hex } from "../../core/index.js";
import { HAND_ROWS, HAND_W, HAND_H, HAND_TIP } from "./_hand-hi.js";
import { SIZE, ORIGIN, EMERGE, REVEALED, RELEASE, HIT, DURATION, HOVER_TIP, CLOUD_BASE, STONE, stroke, rune, drain } from "./_lib.js";

const GOLD = ["#21130e", "#422516", "#69401e", "#925f26", "#b78432", "#d7a748", "#edc166", "#f7d98a", "#ffe7aa", "#fff6d7"];
export const meta = {
  name: "Heaven imprisoning finger", desc: "A carved golden hand emerges slowly, locks heaven in a cage of runes, then plunges into the earth and unravels upward into golden glyphs.",
  tags: ["ultimate", "finger", "hand", "seal", "one-shot"], size: SIZE, origin: ORIGIN,
  duration: DURATION, fps: 30, loop: false, bg: "ground", options: { palette: GOLD, seed: 21 },
};

// Reference pixels, their carved highlights and the outside-only 1 px rim are decoded once.
// No invented strokes cover the runes in the supplied image. The sprite stays at 1x.
const skin = [], rim = [], chips = [];
const inside = (x, y) => x >= 0 && x < HAND_W && y >= 0 && y < HAND_H && HAND_ROWS[y][x] !== ".";
const levels = [0, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 9];
for (let y = 0; y < HAND_H; y++) for (let x = -1; x <= HAND_W; x++) {
  if (inside(x, y)) {
    const v = parseInt(HAND_ROWS[y][x], 16);
    const q = { x: x - HAND_TIP[0], y: y - HAND_TIP[1], row: y, c: levels[v], hot: v >= 13, a: smooth(0, 32, y) };
    skin.push(q);
    if (x % 5 === 0 && y % 5 === 0 && v >= 5) chips.push(q);
  } else if (inside(x - 1, y) || inside(x + 1, y) || inside(x, y - 1) || inside(x, y + 1)) {
    rim.push({ x: x - HAND_TIP[0], y: y - HAND_TIP[1], row: y, a: smooth(0, 32, y) });
  }
}
const HOLD_END = HIT + 0.8, MELT_SPAN = 1.5, QUIET = RELEASE - 0.15;
const birth = (row) => HOLD_END + (HAND_H - 1 - row) / HAND_H * MELT_SPAN;
const pulseStarts = [1.91, 2.54, 3.05, 3.46, 3.77];
const cageBars = Array.from({ length: 10 }, (_, i) => {
  const a = (i + 0.25) / 10 * TAU, x = Math.cos(a) * 128, y = Math.sin(a) * 22;
  const tx = Math.cos(a) * 12, ty = CLOUD_BASE - 62 + Math.sin(a) * 4;
  return { x, y, tx, ty, back: Math.sin(a) < 0, delay: ((i * 7) % 10) / 9 * 0.15,
    glyphs: Array.from({ length: 9 }, (_, j) => {
      const u = 0.1 + j * 0.098, gx = lerp(tx, x, u), gy = lerp(ty, y, u);
      const pts = rune(gx, gy, 0.64 + u * 0.18, i + j);
      return { x: gx, y: gy, halo: j % 3 === 0, pts: pts.filter((_, n) => n % 2 === 0 || n === pts.length - 1) };
    }),
    shards: Array.from({ length: 9 }, (_, j) => ({ u: 0.12 + j * 0.098,
      vx: Math.sin(i * 13 + j * 7) * 27, vy: 30 + ((i + j * 3) % 7) * 9,
      life: 0.32 + ((i * 3 + j) % 6) * 0.035, spin: i + j * 1.7 })) };
});
const far = (a) => Math.sin(a) < 0, near = (a) => Math.sin(a) >= 0;

export function create(o) {
  const C = fit(o.palette, 10), R = new Rng(o.seed), ink = hex("#08080e"), dust = hex(STONE[2]);
  const ringRamp = C.slice(4, 9), fragments = chips.map((q) => ({ ...q, born: birth(q.row) + R.range(0, 0.06),
    vx: q.x * 0.23 + R.range(-13, 13), vy: -R.range(32, 66), life: R.range(0.48, 0.78), size: R.range(1.1, 2.6), phase: R.range(0, TAU) }));
  const grit = Array.from({ length: 24 }, (_, i) => ({ a: i / 24 * TAU, r: R.range(37, 94), h: R.range(3, 10), ph: R.range(0, TAU) }));
  const rowAlpha = new Float32Array(HAND_H), rowPulse = new Float32Array(HAND_H);
  let t = 0;
  const emerging = () => clamp((t - EMERGE) / (REVEALED - EMERGE));
  function tipAt(tt) {
    if (tt < RELEASE) return lerp(CLOUD_BASE, HOVER_TIP, ease.outCubic(clamp((tt - EMERGE) / (REVEALED - EMERGE))));
    if (tt < HIT) return lerp(HOVER_TIP, 0, ease.inQuart(clamp((tt - RELEASE) / (HIT - RELEASE))));
    return 3 * smooth(HIT, HIT + 0.07, tt);
  }
  const quiet = () => t >= QUIET && t < RELEASE;
  const shake = () => quiet() ? 0 : t < HIT ? (Math.sin(t * 29) > 0.78 ? 1 : 0) : Math.round(Math.sin((t - HIT) * 49) * Math.exp(-(t - HIT) * 3));

  function shadow(p) {
    if (t < EMERGE || t >= HOLD_END + MELT_SPAN) return;
    const u = ease.outCubic(emerging()), slam = smooth(RELEASE, HIT, t), k = smooth(EMERGE, EMERGE + 0.3, t) * (1 - smooth(HOLD_END, HOLD_END + MELT_SPAN, t));
    const rx = 35 + u * 46 + slam * 15, ry = 5 + u * 8 + slam * 3;
    const strength = k * (0.16 + u * 0.34 + slam * 0.12);
    for (let y = Math.floor(3 - ry); y <= 3 + ry; y++) for (let x = Math.floor(3 - rx); x <= 3 + rx; x++) {
      const d = ((x - 3) / rx) ** 2 + ((y - 3) / ry) ** 2;
      if (d < 1) p.blend(x, y, ink, strength * (1 - d));
    }
  }

  function pressure(p, back) {
    if (t < EMERGE || t >= RELEASE) return;
    const cut = quiet() ? QUIET : t, keep = back ? far : near;
    for (const start of pulseStarts) {
      const u = (cut - start) / 0.34;
      if (u < 0 || u > 1.55) continue;
      if (u < 1) {
        const y = lerp(tipAt(start) + 5, 0, ease.inQuad(u)), r = 19 + u * 42, k = Math.sin(Math.PI * Math.min(1, u * 1.3)) * 0.55;
        band(p, 0, y, r, 0.16, 1, k, ringRamp, keep);
        for (let i = back ? 4 : 0; i < (back ? 8 : 4); i++) {
          const a = (i + 0.5) / 8 * TAU;
          const x = Math.cos(a) * r, yy = y + Math.sin(a) * r * 0.16;
          p.line(x - 1, yy - 2, x + 1, yy + 1, C[7], k);
          p.light(x, yy, C[6], k * 0.3);
        }
      } else {
        const v = (u - 1) / 0.55, r = 61 + v * 28;
        band(p, 0, 1, r, 0.13, 1.3, (1 - v) * 0.35, C.slice(2, 7), keep);
        for (const q of grit) {
          if ((Math.sin(q.a) < 0) !== back) continue;
          const x = Math.cos(q.a) * r, y = Math.sin(q.a) * r * 0.13;
          // Falling pressure flattens suspended dust into low, translucent fans.
          p.ellipse(x, y, 3 + v * 6, 0.6 + (1 - v) * 1.4, dust, (d) => (1 - d) * (1 - v) * 0.18);
        }
      }
    }
    if (!quiet()) for (const q of grit) {
      if ((Math.sin(q.a) < 0) !== back) continue;
      const x = Math.cos(q.a) * q.r, z = Math.sin(q.a) * q.r * 0.2;
      const y = z - q.h * smooth(EMERGE, REVEALED, t) * (0.7 + 0.3 * Math.sin(t * 9 + q.ph));
      p.dot(x, y, dust, 0.65); p.light(x, y - 1, C[4], 0.12);
    }
  }

  function cage(p, back) {
    const shatter = HIT + 0.15;
    if (t < REVEALED || t >= HIT + 0.7) return;
    const plunge = 150 * ease.inQuart(clamp((t - RELEASE) / (HIT - RELEASE)));
    const depth = back ? 0.52 : 0.88;
    for (const q of cageBars) {
      if (q.back !== back) continue;
      if (t >= shatter) {
        const age = t - shatter;
        for (const s of q.shards) {
          if (age >= s.life) continue;
          // The buried ends stay underground; only exposed rune splinters fall.
          const sy = lerp(q.ty, q.y, s.u) + 150;
          if (sy > q.y - 3) continue;
          const x = lerp(q.tx, q.x, s.u) + s.vx * age;
          const y = sy + s.vy * age + 180 * age * age;
          const k = depth * (1 - smooth(0.12, s.life, age)) * (1 - smooth(q.y - 8, q.y + 3, y));
          if (k < 0.004) continue;
          const angle = s.spin + age * 12, dx = Math.cos(angle) * 2, dy = Math.sin(angle) * 3;
          p.line(x - dx, y - dy, x + dx, y + dy, C[8], k);
          p.light(x, y, C[6], k * 0.6);
          p.glow(x, y, 3, C[6], k * 0.2);
        }
        continue;
      }
      const local = t - REVEALED - q.delay;
      if (local <= 0) continue;
      const u = ease.inQuad(clamp(local / 0.14)), top = q.ty + plunge;
      const bottom = Math.min(q.y + 2, lerp(q.ty, q.y, u) + plunge);
      const endX = lerp(q.tx, q.x, (bottom - plunge - q.ty) / (q.y - q.ty));
      p.line(q.tx, top, endX, bottom, C[9], depth);
      // Sample the halo along the converging one-pixel core, without a wide beam.
      for (let yy = Math.ceil(top); yy <= bottom; yy += 2) {
        const x = lerp(q.tx, q.x, (yy - plunge - q.ty) / (q.y - q.ty));
        p.light(x - 1, yy, C[6], depth * 0.2);
        p.light(x + 1, yy, C[6], depth * 0.2);
      }
      for (const g of q.glyphs) {
        if (g.y + plunge > bottom - 5) break;
        for (let n = 1; n < g.pts.length; n++) p.line(g.pts[n - 1][0], g.pts[n - 1][1] + plunge, g.pts[n][0], g.pts[n][1] + plunge, C[8], depth);
        p.light(g.x, g.y + plunge, C[6], depth * 0.3);
        if (g.halo) p.glow(g.x, g.y + plunge, 3, C[6], depth * 0.19);
      }
      const landAge = local - 0.14;
      if (landAge >= 0 && landAge < 0.21) {
        const v = landAge / 0.21, k = (1 - v) * depth;
        p.line(q.x - 4 * (1 - v), q.y, q.x + 4 * (1 - v), q.y, C[9], k);
        p.line(q.x, q.y - 5 * (1 - v), q.x, q.y + 2, C[8], k);
        p.glow(q.x, q.y - 1, 8, C[6], k * 0.5);
        for (const side of [-1, 1]) p.ellipse(q.x + side * (2 + v * 8), q.y - Math.sin(v * Math.PI) * 3,
          2 + v * 4, 1 + v * 1.7, dust, (d) => (1 - d) * k * 0.36);
      }
    }
    if (t >= shatter) return;
    // A few sagging, broken rune ties; never a complete horizontal hoop.
    for (const i of [0, 2, 3, 5, 7, 8]) {
      const q = cageBars[i], next = cageBars[(i + 1) % 10];
      if (q.back !== back || next.back !== back) continue;
      const k = smooth(REVEALED + Math.max(q.delay, next.delay) + 0.14, REVEALED + 0.35, t) * depth * 0.35;
      if (k <= 0) continue;
      const u = 0.56 + (i % 3) * 0.14, v = u + (i % 2 ? -0.035 : 0.025);
      const x0 = lerp(q.tx, q.x, u), y0 = lerp(q.ty, q.y, u) + plunge;
      const x1 = lerp(next.tx, next.x, v), y1 = lerp(next.ty, next.y, v) + plunge;
      if (Math.max(y0, y1) > Math.min(q.y, next.y) - 5) continue;
      for (let j = 0; j < 7; j++) {
        const a = j / 7, b = (j + 0.68) / 7;
        p.line(lerp(x0, x1, a), lerp(y0, y1, a) + Math.sin(a * Math.PI) * 5,
          lerp(x0, x1, b), lerp(y0, y1, b) + Math.sin(b * Math.PI) * 5, C[7], k);
      }
    }
  }

  function hand(p) {
    if (t < EMERGE || t >= HOLD_END + MELT_SPAN + 0.15) return;
    const y = Math.round(tipAt(t)), dx = shake(), e = emerging(), reveal = smooth(EMERGE, EMERGE + 0.13, t);
    const lit = smooth(EMERGE + 0.12, REVEALED, t), blaze = smooth(REVEALED, QUIET, t) * (1 - smooth(HIT, HIT + 0.22, t));
    const clock = quiet() ? QUIET : t;
    for (let row = 0; row < HAND_H; row++) {
      const yy = y + row - HAND_TIP[1], cloud = lerp(smooth(CLOUD_BASE - 16, CLOUD_BASE + 9, yy), 1, smooth(0.45, 1, e));
      rowAlpha[row] = reveal * cloud * (1 - smooth(birth(row), birth(row) + 0.13, t));
      rowPulse[row] = (0.08 + lit * 0.14 + Math.pow(Math.max(0, Math.sin(clock * 10 - row * 0.064)), 5) * lit * 0.24 + blaze * 0.32);
    }
    // Only the last two 30 fps frames stretch: the fingertip stays anchored while the wrist trails.
    const falling = clamp((t - RELEASE) / (HIT - RELEASE)), stretch = t < HIT && falling > 0.63 ? 0.21 * ease.inQuart(falling) : 0;
    for (const q of skin) {
      const a = q.a * rowAlpha[q.row];
      if (a <= 0.004) continue;
      const yy = y + q.y * (1 + stretch);
      if (yy < -374) continue;
      if (a > 0.995) p.px(q.x + dx, yy, C[q.c]);
      else p.blend(q.x + dx, yy, C[q.c], a);
      if (q.hot) p.light(q.x + dx, yy, C[6], a * rowPulse[q.row]);
    }
    for (let i = 0; i < rim.length; i++) {
      const q = rim[i], a = q.a * rowAlpha[q.row], yy = y + q.y * (1 + stretch);
      if (a <= 0.004 || yy < -373) continue;
      p.blend(q.x + dx, yy, C[8], a * 0.92);
      p.light(q.x + dx, yy, C[6], a * 0.28);
      if (i % 9 === 0) p.glow(q.x + dx, yy, 4, C[6], a * 0.16);
    }
    p.glow(dx, y - 5, 13, C[6], rowAlpha[HAND_H - 1] * lit * 0.22);
    if (t >= RELEASE && t < HIT) for (let i = 0; i < 12; i++) {
      const x = -45 + i * 9, end = y - 16 - (i % 4) * 16;
      p.line(x, Math.max(-369, end - 35 - falling * 65), x, end, C[i % 3 ? 6 : 8], (u) => u * falling * 0.7);
    }
  }

  function dissolve(p) {
    if (t < HOLD_END || t >= DURATION - 0.1) return;
    for (const q of fragments) {
      const age = t - q.born, u = age / q.life;
      if (u < 0 || u >= 1) continue;
      const x = q.x + q.vx * age, y = 3 + q.y + q.vy * age - 12 * age * age;
      const k = (1 - smooth(0.25, 1, u)) * q.a * smooth(-373, -352, y), s = q.size * (1 - u);
      if (k <= 0.004) continue;
      if (u < 0.35 && q.row % 15 === 0) stroke(p, rune(x, y, s * 0.5, q.phase), C[8], k * 0.8, C[6], 3);
      else if (s > 0.9) {
        p.poly([[x - s, y], [x + s * 0.4, y - s * 1.6], [x + s, y - s * 0.4], [x, y + s]], C[5], k);
        p.line(x, y - s, x + s * 0.4, y - s * 1.6, C[8], k);
      } else p.dot(x, y, C[7], k);
      p.light(x, y, C[6], k * 0.32);
      if (q.row % 10 === 0) p.glow(x, y, 3, C[6], k * 0.16);
    }
  }

  return {
    update(dt) { t += dt; },
    drawBack(p) { shadow(p); pressure(p, true); cage(p, true); hand(p); dissolve(p); },
    draw(p) {
      pressure(p, false); cage(p, false);
      // Two drained frames at the moment heaven locks, followed by 0.15 s of stillness.
      if (t >= QUIET && t < QUIET + 2 / meta.fps) drain(p);
    },
  };
}
