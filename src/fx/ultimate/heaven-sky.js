import { Rng, fit, smooth, clamp, TAU, WHITE, hex, bolt, createFrame, Painter } from "../../core/index.js";
import { GOLD, SIZE, ORIGIN, INK, HIT, envelope, stroke } from "./_lib.js";

export const meta = {
  name: "Heaven's fingerprint", desc: "Ink clouds coil around a celestial fingerprint; star-filled fractures split the sky and gold lightning answers the falling finger.",
  tags: ["ultimate", "sky", "fingerprint", "lightning", "one-shot"], size: SIZE, origin: ORIGIN,
  duration: 3.8, fps: 30, loop: false, bg: "ground", options: { palette: GOLD, seed: 17 },
};

export function create(o) {
  const C = fit(o.palette, 8), R = new Rng(o.seed);
  const clouds = Array.from({ length: 20 }, (_, i) => ({ a: i / 20 * TAU, r: R.range(80, 132), s: R.range(11, 19), ph: R.range(0, TAU), w: R.range(0.16, 0.28) }));
  // Painter-built translucent puffs are static volumes; only their orbits and opacity change.
  // Cache their pixels once rather than resampling two soft discs on every tick.
  for (const q of clouds) {
    const f = createFrame(44, 44), cp = new Painter(f);
    cp.disc(22, 22, q.s, hex("#161520"), (d) => 0.5 * (1 - d * 0.65));
    cp.disc(22 - q.s * 0.18, 22 - q.s * 0.23, q.s * 0.55, hex("#49404b"), 0.2);
    q.pixels = [];
    f.color.forEach((c, i) => { if (c) q.pixels.push([i % 44 - 22, Math.floor(i / 44) - 22, c, (c >>> 24) / 255]); });
  }
  // One continuous double whorl, with asymmetrical recurving ridges around it: a dermal print,
  // deliberately distinct from the concentric ellipses of a summoning portal.
  const ridges = [];
  for (let side = 0; side < 2; side++) {
    const pts = [];
    for (let i = 0; i <= 430; i++) {
      const a = i / 430 * TAU * 7.4 + side * Math.PI, r = 2 + i / 430 * 55;
      const x = Math.cos(a) * r + Math.sin(a * 0.5) * 4;
      pts.push([x * 0.77, -145 + Math.sin(a) * r * 0.9 + 0.003 * x * x]);
    }
    ridges.push(pts);
  }
  for (let j = 0; j < 7; j++) {
    const pts = [], r = 60 + j * 4;
    for (let i = 0; i <= 150; i++) {
      const a = -2.83 + i / 150 * 5.58;
      pts.push([Math.sin(a) * r * 0.77 * (1 + 0.1 * Math.cos(a * 3)), -145 + Math.cos(a) * r * 0.78 + Math.sin(a * 2) * 4]);
    }
    ridges.push(pts);
  }
  const cracks = Array.from({ length: 9 }, (_, i) => {
    const a = i / 9 * TAU, x = Math.cos(a) * 65, y = -143 + Math.sin(a) * 47;
    const end = [clamp(x * 2.4, -205, 156), clamp(-143 + Math.sin(a) * 133, -207, -28)];
    const safe = ([xx, yy]) => [clamp(xx, -211, 164), clamp(yy, -207, -25)];
    const pts = bolt(R, x, y, ...end, { jag: 0.3, depth: 4 }).map(safe);
    const mid = pts[8], fork = bolt(R, ...mid, clamp(mid[0] + Math.sin(a) * 42, -209, 165), clamp(mid[1] - Math.cos(a) * 40, -207, -25), { jag: 0.26, depth: 3 }).map(safe);
    return { pts, fork, start: R.range(0.72, 1.3), stars: Array.from({ length: 10 }, () => R.next()) };
  });
  let t = 0;
  return {
    update(dt) { t += dt; },
    drawBack(p) {
      const k = envelope(t, 0, 0.65, 1.95, 2.3);
      if (k <= 0) return;
      // Translucent weather, never a solid black full-screen card.
      for (const q of clouds) {
      const a = q.a + t * q.w, rr = q.r - 6 * Math.sin(t * 0.8 + q.ph), x = Math.cos(a) * rr - 15, y = -143 + Math.sin(a) * rr * 0.42;
        for (const [dx, dy, c, a] of q.pixels) p.blend(x + dx, y + dy, c, a * k);
      }
      const reveal = smooth(0.08, 0.85, t), fade = k * (1 - smooth(0.95, 1.65, t));
      for (let j = 0; j < ridges.length; j++) {
        const pts = ridges[j], n = Math.max(2, Math.floor(pts.length * reveal));
        if (fade > 0.01) stroke(p, pts.slice(0, n), j < 2 ? C[6] : C[4], fade * 1.1, C[5], 3);
        const u = Math.floor(((t * 0.45 + j * 0.13) % 1) * (n - 1));
        if (pts[u]) p.glow(...pts[u], 8, C[6], fade * 0.45);
      }
      p.glow(0, -147, 57, C[4], fade * 0.18);
      for (const q of cracks) {
        const u = smooth(q.start, q.start + 0.28, t), heat = k * (0.5 + 0.5 * Math.max(0, Math.sin(t * 19 + q.start)));
        for (const path of [q.pts, q.fork]) {
          const n = Math.floor((path.length - 1) * u);
          for (let i = 0; i < n; i++) {
            const [x, y] = path[i], [xx, yy] = path[i + 1], w = (path === q.pts ? 4.5 : 1.8) * Math.sin((i + 1) / path.length * Math.PI);
            const length = Math.hypot(xx - x, yy - y) || 1, nx = -(yy - y) / length, ny = (xx - x) / length;
            p.beam(x, y, xx, yy, w * 2 + 1, INK, k);
            p.line(x - nx * w, y - ny * w, xx - nx * w, yy - ny * w, C[5], heat);
            p.line(x + nx * w, y + ny * w, xx + nx * w, yy + ny * w, C[3], k * 0.7);
            if (i % 3 === 0) p.glow(x - w, y, 5, C[4], heat * 0.25);
            if (i % 3 === 1 && w > 1.5) {
              const star = q.stars[i % q.stars.length], sx = x + nx * (star - 0.5) * w, sy = y + ny * (star - 0.5) * w;
              p.dot(sx, sy, star > 0.6 ? WHITE : hex("#9daed7"), k * 0.9);
              if (star > 0.8) p.glow(sx, sy, 3, hex("#9daed7"), k * 0.28);
            }
          }
        }
        // Unstable golden lightning flashes in short, uneven beats over the void seams.
        if (t > q.start + 0.2 && Math.sin(t * 29 + q.start * 31) > 0.9 && t < 2.35)
          stroke(p, q.pts, WHITE, k, C[5], 7);
      }
    },
    draw() {},
  };
}
