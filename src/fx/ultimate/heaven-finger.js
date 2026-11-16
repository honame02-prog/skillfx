import { Rng, fit, smooth, ease, clamp, lerp, band, TAU, WHITE, hex, rgb, luma } from "../../core/index.js";
import { HAND_ROWS, HAND_W, HAND_H } from "./_hand-data.js";
import { GOLD, SIZE, ORIGIN, HIT, RELEASE, STONE, envelope, stroke, rune, drain } from "./_lib.js";

export const meta = {
  name: "Heaven imprisoning finger", desc: "A colossal rune-carved golden fist points downward, seals the world inside standing glyphs, then accelerates into the bound earth.",
  tags: ["ultimate", "finger", "hand", "seal", "one-shot"], size: SIZE, origin: ORIGIN,
  duration: 2.95, fps: 30, loop: false, bg: "ground", options: { palette: GOLD, seed: 21 },
};

export function create(o) {
  const C = fit(o.palette, 8), G = C.map((c) => { const v = luma(c) * 255; return rgb(v, v, v); });
  const R = new Rng(o.seed), S = 1.45, AX = 26, AY = 105;
  const inside = (x, y) => x >= 0 && x < HAND_W && y >= 0 && y < HAND_H && HAND_ROWS[y][x] !== ".";
  const skin = [], rim = [];
  for (let y = 0; y < Math.ceil(HAND_H * S); y++) for (let x = 0; x < Math.ceil(HAND_W * S); x++) {
    const u = Math.floor(x / S), v = Math.floor(y / S);
    if (inside(u, v)) skin.push({ x: x - AX * S, y: y - AY * S, v: +HAND_ROWS[v][u], a: smooth(2, 19, v) });
    else if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => inside(Math.floor((x + dx) / S), Math.floor((y + dy) / S))))
      rim.push([x - AX * S, y - AY * S, smooth(2, 18, v)]);
  }
  const toHand = (pts) => pts.map(([x, y]) => [(x - AX) * S, (y - AY) * S]);
  // Anatomical cuts: folded phalanges, thumb pad and two index creases.
  const creases = [
    [[32, 27], [35, 29], [36, 39], [34, 48]], [[41, 23], [45, 29], [45, 42], [43, 50]],
    [[49, 27], [53, 35], [52, 47], [47, 56]], [[33, 52], [39, 56], [43, 53], [46, 46]],
    [[20, 69], [24, 71], [29, 71], [32, 69]], [[20, 87], [25, 89], [31, 87]],
    [[23, 96], [24, 93], [29, 93], [31, 96], [30, 101], [25, 102], [23, 96]],
  ].map(toHand);
  const runes = [];
  for (let y = 17; y < 96; y += 10) for (let x = 16; x < 54; x += 9) {
    if (!inside(x, y) || !inside(x + 3, y + 4) || !inside(x - 3, y)) continue;
    runes.push(toHand(rune(x, y, 0.72, (x + y) % 3)));
  }
  const stones = Array.from({ length: 18 }, () => ({ a: R.range(0, TAU), r: R.range(62, 103), h: R.range(7, 35), s: R.range(1, 3), ph: R.range(0, TAU) }));
  let t = 0;
  const tip = () => t < RELEASE ? -59 - 4 * Math.sin(t * 3) : lerp(-59, 0, ease.inCubic(clamp((t - RELEASE) / (HIT - RELEASE))));

  function seal(p, back) {
    const k = envelope(t, 0.16, 0.72, HIT + 0.04, 2.25), r = 94 * ease.outCubic(smooth(0.16, 0.9, t));
    if (k <= 0 || r < 2) return;
    const frozen = t >= HIT - 0.06 && t < HIT + 0.035, K = frozen ? G : C, tt = frozen ? HIT - 0.06 : t;
    for (const rr of [r, r - 5, r * 0.64]) band(p, 0, 1, rr, 0.21, 1.3, k * (back ? 0.65 : 0.95), K.slice(2), (g) => Math.sin(g) < 0 === back);
    for (let i = 0; i < 18; i++) {
      const a = i / 18 * TAU + tt * 0.13;
      if (Math.sin(a) < 0 !== back) continue;
      const x = Math.cos(a) * (r - 10), y = Math.sin(a) * (r - 10) * 0.21;
      stroke(p, rune(x, y - 3, 0.66, i % 3), K[6], k * (back ? 0.6 : 1), K[5], 4);
      if (i % 3 === 0) {
        const h = 31 * smooth(0.55, 1.2, t);
        p.glowLine(x, y - h, x, y, 7, K[5], k * 0.16);
        p.line(x, y - h, x, y - 10, K[4], k * 0.5);
        for (let j = 0; j < 3; j++) stroke(p, rune(x, y - h + j * 8, 0.7, j + i), K[6], k * 0.8, K[5], 3);
      }
    }
    for (const q of stones) {
      if (Math.sin(q.a) < 0 !== back || t > HIT + 0.1) continue;
      const x = Math.cos(q.a) * q.r, y = Math.sin(q.a) * q.r * 0.2 - q.h * smooth(0.5, 1.2, t) + Math.sin(tt * 2 + q.ph) * 2;
      p.poly([[x - q.s, y], [x, y - q.s * 1.3], [x + q.s, y - 1], [x + 1, y + q.s]], hex(STONE[2]), k);
      p.line(x - q.s, y, x, y - q.s * 1.3, K[5], k * 0.7);
    }
    p.glowLine(-65, 0, 65, 0, 15, K[4], k * 0.2);
  }

  function hand(p) {
    const k = envelope(t, 0.45, 1, HIT + 0.1, 2.3);
    if (k <= 0) return;
    const y = tip(), frozen = t >= HIT - 0.06 && t < HIT + 0.035, K = frozen ? G : C;
    for (const q of skin) {
      const c = K[Math.min(6, 1 + Math.floor(q.v * 0.6))];
      p.blend(q.x, y + q.y, c, q.a * k * 0.94);
      if (q.v >= 7) p.light(q.x, y + q.y, K[4], q.a * k * 0.13);
    }
    for (const [x, yy, a] of rim) {
      p.dot(x, y + yy, K[6], k * a);
      p.light(x, y + yy, K[5], k * a * 0.48);
    }
    for (let i = 0; i < rim.length; i += 13) { const [x, yy, a] = rim[i]; p.glow(x, y + yy, 5, K[5], a * k * 0.24); }
    for (let j = 0; j < creases.length; j++) {
      const path = creases[j];
      const pts = path.map(([x, yy]) => [x, yy + y]);
      p.polyline(pts, K[0], k * 0.9);
      p.polyline(pts.map(([x, yy]) => [x - 1, yy - 1]), j === 6 ? K[6] : K[4], k * 0.85);
    }
    for (let j = 0; j < runes.length; j++) {
      const pts = runes[j].map(([x, yy]) => [x, yy + y]), pulse = 0.55 + 0.45 * Math.max(0, Math.sin((frozen ? HIT : t) * 7 - j * 0.62));
      stroke(p, pts, pulse > 0.88 ? K[7] : K[5], k * pulse, K[5], 3);
    }
    p.glow(0, y - 7, 20, K[5], k * 0.24);
    // A helical energy thread wraps the finger; far coil vanishes into its silhouette.
    for (let j = 0; j < 3; j++) {
      const pts = [];
      for (let i = 0; i < 90; i++) {
        const a = i / 89 * TAU + t * 2.2 + j * 1.5;
        if (Math.sin(a) < 0) { if (pts.length > 1) stroke(p, pts, K[5], k * 0.65, K[4], 3); pts.length = 0; continue; }
        pts.push([Math.cos(a) * (24 + j * 7), y - 28 - j * 35 + Math.sin(a) * 7 - i / 89 * 17]);
      }
      stroke(p, pts, K[6], k * 0.7, K[4], 3);
    }
    if (t > RELEASE && t < HIT) for (let i = 0; i < 9; i++) {
      const x = -42 + i * 11, yy = y - 10 - (i % 3) * 15;
      p.line(x, Math.max(-211, yy - 42), x, yy, K[5], (u) => u * k * 0.65);
    }
  }

  return {
    update(dt) { t += dt; },
    drawBack(p) { seal(p, true); hand(p); },
    draw(p) { seal(p, false); if (t >= HIT - 0.065 && t < HIT) drain(p); },
  };
}
