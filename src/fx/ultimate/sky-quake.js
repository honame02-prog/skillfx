import { Particles, Lights, P, Rng, fit, band, clamp, smooth, ease, TAU, WHITE, hex, flare, createFrame, Painter, rgb, mix } from "../../core/index.js";
import { createGroundBlast } from "./_blast.js";
import { GOLD, STONE, SIZE, ORIGIN, INK, stroke, contain, rune, drain, DURATION, HIT } from "./_lib.js";

export const meta = {
  name: "Sky breaking quake",
  desc: "An inverted impact pins the earth with a tightening rune seal; molten faults heave slabs, staggered geysers erupt and a second quake widens the sinking crater.",
  tags: ["ultimate", "quake", "impact", "cracks", "one-shot"], size: SIZE, origin: ORIGIN,
  duration: +(DURATION - HIT).toFixed(2), fps: 30, loop: false, bg: "ground", options: { palette: GOLD, seed: 31 },
};

export function create(o) {
  const C = fit(o.palette, 8), R = new Rng(o.seed), S = STONE.map(hex), dust = hex("#958371");
  const orange = mix(C[3], hex("#c75c24"), 0.65), red = mix(C[1], hex("#631b18"), 0.7);
  const X0 = -ORIGIN[0], X1 = SIZE[0] - ORIGIN[0] - 1, TOP = -ORIGIN[1], Y1 = SIZE[1] - ORIGIN[1] - 1;
  const ps = new Particles({ rng: R, ground: () => 1, sparks: [WHITE, C[6], C[4], C[2]] });
  const lights = new Lights(), cracks = [];
  const fadeAt = meta.duration - 0.12;
  const blast = createGroundBlast({ seed: o.seed, scale: 1, hot: C, dirt: STONE, haze: "#4a4552",
    halfWidth: 230, duration: fadeAt, bounds: [X0 + 3, TOP + 3, X1 - 3, Y1 - 3] });
  let t = 0, aftershock = false;

  // Short, fine far faults and broad near faults are projected onto the ground.
  // The two lateral trunks reach the actual canvas edges, rather than an old box.
  const targets = [[X0, 9], [X1, -5], [-186, 32], [-78, 35], [112, 33], [192, 20], [-152, -24], [-42, -31], [98, -27]];
  function fault(x0, y0, x1, y1, depth, start = 0, reach = 1) {
    const n = depth ? 7 : 17, dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy), pts = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, jitter = i && i < n ? R.range(-1, 1) * Math.sin(u * Math.PI) : 0;
      pts.push([clamp(x0 + dx * u - dy / len * jitter * 12, X0, X1),
        clamp(y0 + dy * u + dx / len * jitter * (y1 > 0 ? 6 : 2.5), -35, Y1 - 4)]);
    }
    const c = { pts, depth, start, reach };
    cracks.push(c);
    if (depth < 2) for (const u of (depth ? [0.56] : [0.36, 0.68])) {
      const q = pts[Math.floor(u * n)], side = R.sign(), k = depth ? 0.24 : 0.36;
      fault(...q, q[0] + dx * k + side * 14, q[1] + dy * k + side * (y1 > 0 ? 8 : 4),
        depth + 1, start + reach * u, reach * (1 - u) * 0.7);
    }
    return c;
  }
  const mains = targets.map(([x, y]) => fault(0, 0, x, y, 0));

  // Bake geometry ONCE, including shoulders exposed by the aftershock. Channels
  // encode material, propagation distance and perspective, not final colors.
  // Each draw only replays sparse pixels, with no bolt/beam rasterization.
  const faultFrame = createFrame(...SIZE), fp = new Painter(faultFrame).place(...ORIGIN);
  for (const c of [...cracks].sort((a, b) => b.depth - a.depth)) {
    for (let i = 1; i < c.pts.length; i++) {
      const [x, y] = c.pts[i - 1], [xx, yy] = c.pts[i], u = i / (c.pts.length - 1);
      const q = clamp(c.start + c.reach * u), near = y >= 0;
      const w = (c.depth ? 2.6 / c.depth : 6.2) * (1 - u * 0.52) * (near ? 1.12 : 0.56);
      const code = (role) => rgb(role, Math.round(q * 255), near ? 255 : 135);
      fp.beam(x, y, xx, yy, w + 2.2, code(1));
      fp.beam(x, y, xx, yy, w, code(2));
      fp.line(x, y - w * 0.5, xx, yy - w * 0.5, code(3));
      fp.beam(x, y, xx, yy, near && !c.depth ? 1.6 : 0.9, code(4));
    }
  }
  const faultPixels = [];
  faultFrame.color.forEach((v, i) => {
    if (!v) return;
    faultPixels.push({ x: i % SIZE[0] - ORIGIN[0], y: Math.floor(i / SIZE[0]) - ORIGIN[1],
      role: v & 255, at: ((v >>> 8) & 255) / 255 * 0.19, far: ((v >>> 16) & 255) < 200 });
  });
  const vents = mains.slice(0, 7).map((c, i) => {
    const [x, y] = c.pts[6 + i % 4];
    return { x, y, at: 0.12 + i * 0.043 };
  });
  const glyphs = Array.from({ length: 16 }, (_, i) => ({ a: i / 16 * TAU, pts: rune(0, 0, 1.5, i) }));
  const nails = Array.from({ length: 8 }, (_, i) => {
    const a = (i + 0.35) / 8 * TAU;
    return { x: Math.cos(a) * 67, y: Math.sin(a) * 12, at: 0.085 + i * 0.018, hit: false };
  });
  for (let i = 0; i < 16; i++) {
    const a = R.range(-Math.PI, 0), speed = R.range(110, 380);
    ps.spawn(P.SPARK, R.range(-8, 8), -3, Math.cos(a) * speed, Math.sin(a) * speed,
      R.range(0.25, 0.7), WHITE, 1, R.range(0, 0.06));
  }
  lights.add(0, -52, 138, C[5], 0.95, 0.58);
  lights.add(0, -12, 64, WHITE, 1.25, 0.13);

  function floor(p) {
    const fade = 1 - smooth(2.15, fadeAt, t), heat = clamp(1 - t / 2.4);
    if (fade <= 0) return;
    const sink = ease.outCubic(clamp(t / 0.4)), cy = 1 + 7 * sink, rx = 20 + 32 * sink;
    p.ellipse(0, cy, rx, 3 + 7 * sink, (d) => d > 0.87 ? S[1] : INK, fade * 0.85);
    const heatColor = (h) => h > 0.8 ? C[6] : h > 0.56 ? C[4] : h > 0.3 ? orange : red;
    const nearColor = heatColor(heat), farColor = heatColor(heat - 0.13);
    for (const q of faultPixels) {
      if (t + 1e-7 < q.at || (q.role === 1 && t < 0.3)) continue;
      p.dot(q.x, q.y, q.role < 3 ? INK : q.role === 3 ? S[2] : q.far ? farColor : nearColor, fade);
    }
    band(p, 0, cy - 3, rx + 1, 0.19, 1.5, fade * 0.7, [INK, S[1], S[2], S[3]], () => true);
    for (const v of vents) if (t > v.at && heat > 0.1) p.glow(v.x, v.y - 2, 10, C[4], heat * fade * 0.28);
  }

  function seal(p, back) {
    const k = (1 - smooth(0.5, 1.05, t)) * (back ? 0.7 : 1);
    if (k <= 0) return;
    const r = 165 - 109 * ease.outCubic(clamp(t / 0.4)), keep = (a) => (Math.sin(a) < 0) === back;
    band(p, 0, 0, r, 0.16, 2, k, C.slice(3), keep, t < 0.1);
    band(p, 0, 0, r - 12, 0.16, 0.7, k * 0.55, C.slice(2, 6), keep);
    for (const g of glyphs) {
      if (!keep(g.a)) continue;
      const ca = Math.cos(g.a), sa = Math.sin(g.a), rr = r - 6;
      const pts = g.pts.map(([x, y]) => [ca * (rr + y) - sa * x, (sa * (rr + y) + ca * x) * 0.16]);
      stroke(p, pts, C[6], k, C[4], 3);
    }
    for (const n of nails) {
      if ((n.y < 0) !== back || t < n.at - 0.045) continue;
      const fall = 1 - ease.inCubic(clamp((t - n.at + 0.045) / 0.045)), tip = n.y - 92 * fall, h = 26;
      p.tri(n.x - 3, tip - h, n.x + 3, tip - h, n.x, tip + 3, C[2], k);
      p.line(n.x - 2, tip - h, n.x, tip + 2, C[6], k);
      p.line(n.x, tip - h + 2, n.x, tip - 2, WHITE, k);
      for (let j = 0; j < 3; j++) p.line(n.x - 4, tip - h + 5 + j * 6, n.x + 3, tip - h + 3 + j * 6, C[5], k);
      if (t > n.at) p.glow(n.x, n.y - 3, 16, C[5], k * 0.5);
    }
  }

  function waves(p, back) {
    for (let j = 0; j < 2; j++) {
      const u = (t - 0.025 - j * 0.115) / 0.65;
      if (u <= 0 || u >= 1) continue;
      const r = 12 + 440 * ease.outCubic(u), k = (1 - u) ** 0.7;
      const keep = (a) => (Math.sin(a) < 0) === back && Math.cos(a) * r > X0 + 2 && Math.cos(a) * r < X1 - 2
        && Math.sin(a) * r * 0.065 < Y1 - 3;
      band(p, 0, 0, r, 0.065, 1.7, k, C.slice(3), keep);
      if (back) continue;
      // Sample the thin shell instead of scanning a dome-sized rectangle.
      let prev = null;
      for (let i = 0; i <= 160; i++) {
        const a = -Math.PI + i / 160 * Math.PI, x = Math.cos(a) * r, y = Math.sin(a) * r * (j ? 0.74 : 0.84);
        if (x < X0 + 2 || x > X1 - 2 || y < TOP + 3) { prev = null; continue; }
        if (prev) {
          p.line(...prev, x, y, u < 0.2 ? WHITE : C[6], k);
          p.line(prev[0] * 0.994, prev[1] * 0.994, x * 0.994, y * 0.994, C[4], k * 0.65);
        }
        if (i % 16 === 0) p.glow(x, y, 7, C[5], k * 0.28);
        prev = [x, y];
      }

    }
    if (t >= 0.3 && t < 0.61) {
      const u = (t - 0.3) / 0.31;
      band(p, 0, 2, 28 + 138 * ease.outCubic(u), 0.12, 1.2, 0.6 * (1 - u), C.slice(3), (a) => (Math.sin(a) < 0) === back);
    }
  }

  function impact(p) {
    if (t >= 2 / 30 - 1e-7) return false;
    const negative = t < 1 / 30 - 1e-7, bg = negative ? INK : WHITE, fg = negative ? WHITE : INK;
    p.rect(X0, TOP, SIZE[0], SIZE[1], bg);
    p.beam(0, TOP + 16, 0, -3, 32, fg);
    p.ellipse(0, 0, 68, 14, fg);
    for (let i = 0; i < 24; i++) {
      const a = -Math.PI + i / 23 * Math.PI, r = 28 + i % 4 * 7, len = 54 + i % 5 * 17;
      p.line(Math.cos(a) * r, -3 + Math.sin(a) * r, Math.cos(a) * (r + len), -3 + Math.sin(a) * (r + len), fg);
    }
    lights.draw(p);
    drain(p);
    return true;
  }

  return {
    update(dt) {
      t += dt;
      blast.update(dt);
      for (const n of nails) if (!n.hit && t >= n.at) {
        n.hit = true;
        for (let i = 0; i < 4; i++) ps.spawn(P.SPARK, n.x, n.y - 1, R.range(-55, 55), -R.range(45, 100), R.range(0.18, 0.34));
        ps.spawn(P.DUST, n.x, n.y - 2, R.range(-10, 10), -14, 0.45, dust, 3);
      }
      if (!aftershock && t >= 0.3) {
        aftershock = true;
        lights.add(0, -10, 76, C[4], 0.4, 0.23);
        for (const v of vents) {
          for (let i = 0; i < 3; i++) ps.spawn(P.SPARK, v.x, v.y, R.range(-35, 35), -R.range(60, 110), 0.4);
        }
      }
      ps.update(dt); contain(ps); lights.update(dt);
    },
    drawBack(p) {
      if (t >= fadeAt) return;
      const ty = p.ty;
      if (t > 0.3 && t < 0.47) p.ty += Math.sin((t - 0.3) * 110) * 1.6 * (1 - (t - 0.3) / 0.17);
      floor(p); blast.drawBack(p); seal(p, true); waves(p, true); ps.draw(p, "back");
      p.ty = ty;
    },
    draw(p) {
      if (t >= fadeAt || impact(p)) return;
      const ty = p.ty;
      if (t > 0.3 && t < 0.47) p.ty += Math.sin((t - 0.3) * 110) * 1.6 * (1 - (t - 0.3) / 0.17);
      waves(p, false); blast.draw(p); seal(p, false); ps.draw(p, "front");
      if (t < 0.32) {
        const k = 1 - smooth(0.085, 0.32, t), w = 32 * (1 - t / 0.35);
        p.beam(0, TOP + w / 2, 0, -w / 2, w, (u, v) => v < 0.24 ? WHITE : v < 0.62 ? C[6] : C[4], k);
        p.glowLine(0, TOP + 22, 0, -8, 20, C[5], k * 0.65);
      }
      if (t < 0.18) {
        const k = 1 - t / 0.18;
        flare(p, 0, -5, 76 * k, k, C);
        if (t < 0.1) p.ellipse(0, -3, 35, 10, (d) => d < 0.55 ? WHITE : C[6]);
      }
      lights.draw(p);
      p.ty = ty;
    },
  };
}
