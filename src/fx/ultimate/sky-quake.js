import { Particles, Bits, Lights, P, PF, B, Rng, fit, band, bolt, clamp, smooth, ease, TAU, WHITE, hex, flare, createFrame, Painter, rgb, clearFrame } from "../../core/index.js";
import { GOLD, STONE, SIZE, ORIGIN, INK, stroke, contain, drain } from "./_lib.js";

export const meta = {
  name: "Sky breaking quake", desc: "A negative impact frame, a sky-high eruption and two shock domes split the earth into molten branching faults, tumbling slabs and rolling dust.",
  tags: ["ultimate", "quake", "impact", "cracks", "one-shot"], size: SIZE, origin: ORIGIN,
  duration: 2.94, fps: 30, loop: false, bg: "ground", options: { palette: GOLD, seed: 31 },
};

export function create(o) {
  const C = fit(o.palette, 8), R = new Rng(o.seed), lip = hex(STONE[3]), ps = new Particles({ rng: R, ground: () => 2, sparks: [WHITE, C[6], C[5], C[3]] });
  const bits = new Bits({ ground: () => 1 }), lights = new Lights(), cracks = [];
  // Perspective lies in z, so forks widen towards camera and flatten towards the horizon.
  for (let j = 0; j < 13; j++) {
    const a = j / 13 * TAU + R.range(-0.12, 0.12), L = R.range(160, 240);
    const path = bolt(R, 0, 0, Math.cos(a) * L, Math.sin(a) * L, { jag: 0.21, depth: 5 });
    const project = ([x, z]) => [x, z * (z < 0 ? 0.11 : 0.15)];
    const pts = path.map(project).filter(([x, y]) => x > -221 && x < 167 && y > -27 && y < 31);
    if (pts.length < 3) continue;
    cracks.push({ pts, start: j * 0.006, fork: false });
    for (const f of [0.38, 0.68]) {
      const m = path[Math.floor((path.length - 1) * f)], aa = a + R.sign() * 0.65;
      const fork = bolt(R, ...m, m[0] + Math.cos(aa) * L * 0.34, m[1] + Math.sin(aa) * L * 0.34, { jag: 0.24, depth: 3 }).map(project).filter(([x, y]) => x > -221 && x < 167 && y > -27 && y < 31);
      if (fork.length > 1) cracks.push({ pts: fork, start: 0.07 + f * 0.08, fork: true });
    }
  }
  const vents = cracks.filter((c) => !c.fork).map((c) => c.pts[Math.floor(c.pts.length * 0.67)]);
  // Rasterize only the static fault geometry through the existing Painter. Per-pixel role/index
  // retains the fast propagation and cooling without shading hundreds of overlapping capsules every frame.
  const faultFrame = createFrame(...SIZE), fp = new Painter(faultFrame).place(...ORIGIN), faults = [];
  for (const c of cracks) {
    clearFrame(faultFrame);
    for (let i = 0; i < c.pts.length - 1; i++) {
      const [x, y] = c.pts[i], [xx, yy] = c.pts[i + 1], q = i / c.pts.length;
      const w = (c.fork ? 1.1 : 3.6) * (1 - q * 0.55) * (y > 0 ? 1.25 : 0.75);
      fp.beam(x, y, xx, yy, w * 2 + 1, rgb(1, i, 0));
      fp.line(x, y - w, xx, yy - w, rgb(2, i, 0));
      fp.line(x, y, xx, yy, rgb(3, i, 0));
    }
    const pixels = [];
    faultFrame.color.forEach((v, i) => {
      if (!v) return;
      const q = ((v >>> 8) & 255) / (c.pts.length - 1);
      pixels.push({ x: i % SIZE[0] - ORIGIN[0], y: Math.floor(i / SIZE[0]) - ORIGIN[1], role: v & 255, q,
        at: c.start + 0.25 * (1 - Math.cbrt(1 - q)) });
    });
    faults.push(pixels);
  }
  const merged = new Map();
  for (const pixels of faults) for (const q of pixels) {
    const key = (q.y + ORIGIN[1]) * SIZE[0] + q.x + ORIGIN[0], prev = merged.get(key);
    if (!prev) merged.set(key, q);
    else {
      const at = Math.min(prev.at, q.at);
      if (q.role >= prev.role) merged.set(key, { ...q, at });
      else prev.at = at;
    }
  }
  const faultPixels = [...merged.values()];
  // Several sizes and timings: heavy peeled slabs, then smaller ballistic fragments.
  for (let i = 0; i < 42; i++) {
    const heavy = i < 10, side = R.sign();
    bits.add({ kind: B.CHUNK, x: side * R.range(8, heavy ? 65 : 30), y: -1, vx: side * R.range(25, heavy ? 100 : 190), vy: -R.range(110, heavy ? 250 : 370),
      a: R.range(0, TAU), va: R.range(-11, 11), s: heavy ? R.range(5, 10) : R.range(1.5, 4), ramp: STONE, g: 0.8, drag: 0.6, bounce: 0.33, life: R.range(1.6, 2.4), pvy: 0 });
  }
  for (let i = 0; i < 105; i++) {
    const a = R.range(-Math.PI, 0), sp = R.range(90, 430);
    ps.spawn(P.SPARK, R.range(-12, 12), -3, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.3, 1), WHITE, 1, R.range(0, 0.12));
  }
  for (let i = 0; i < 85; i++) ps.spawn(P.GRIT, R.range(-28, 28), -2, R.range(-160, 160), -R.range(80, 360), R.range(0.7, 1.8), hex(R.pick(STONE.slice(1))), R.chance(0.3) ? 2 : 1, R.range(0, 0.16));
  for (let i = 0; i < 22; i++) {
    const a = R.range(0, TAU), sp = R.range(130, 320);
    ps.spawn(P.SMOKE, Math.cos(a) * 10, Math.sin(a) * 3 - 3, Math.cos(a) * sp, -R.range(4, 23), R.range(1.4, 2.4), hex("#87705f"), R.range(7, 12), R.range(0.05, 0.22), PF.BIG);
  }
  for (let i = 0; i < 8; i++) ps.spawn(P.SMOKE, R.range(-11, 11), -R.range(3, 22), R.range(-33, 33), -R.range(80, 190), R.range(1.3, 2.1), hex("#978476"), R.range(5, 9), R.range(0.03, 0.18), PF.BIG);
  lights.add(0, -35, 88, C[5], 0.85, 0.65);
  lights.add(0, -2, 52, WHITE, 1.1, 0.16);
  let t = 0, ventIndex = 0, dustAcc = 0;

  function floor(p) {
    const fade = 1 - smooth(2.1, 2.88, t), heat = clamp(1 - t / 1.9);
    if (fade <= 0) return;
    for (const q of faultPixels) {
      if (t < q.at) continue;
      const h = heat * (1 - q.q * 0.3), col = h > 0.75 ? C[7] : h > 0.5 ? C[5] : h > 0.25 ? C[3] : C[1];
      p.dot(q.x, q.y, q.role === 1 ? INK : q.role === 2 ? lip : col, fade);
    }
    for (const c of cracks) for (let i = 0; i < c.pts.length; i += 9) {
      const q = i / c.pts.length;
      if (q > ease.outCubic(clamp((t - c.start) / 0.25))) continue;
      const [x, y] = c.pts[i];
      if (heat > 0.1) p.glow(x, y, 9, C[4], heat * fade * 0.34);
    }
    band(p, 0, 2, 25, 0.22, 2, fade, [INK, hex(STONE[2]), C[3], C[5]], () => true);
    p.glowLine(-65, 2, 65, 2, 17, C[4], heat * 0.4);
  }

  function waves(p, back) {
    for (let j = 0; j < 2; j++) {
      const u = (t - 0.05 - j * 0.14) / 0.65;
      if (u <= 0 || u >= 1) continue;
      const r = 9 + 218 * ease.outCubic(u), k = (1 - u) ** 0.7;
      band(p, 0, 1, Math.min(163, r), 0.15, 2.7 * (1 - u) + 0.7, k, C.slice(3), (a) => Math.sin(a) < 0 === back);
      if (!back) {
        const pts = [];
        for (let i = 0; i <= 180; i++) {
          const a = -Math.PI + i / 180 * Math.PI, x = Math.cos(a) * r, y = Math.sin(a) * r * (j ? 0.62 : 0.75);
          if (x < -225 || x > 170 || y < -211) { if (pts.length > 1) stroke(p, pts, C[6], k, C[5], 5); pts.length = 0; continue; }
          pts.push([x, y]);
        }
        stroke(p, pts, u < 0.18 ? WHITE : C[6], k, C[5], 5);
      }
    }
  }

  return {
    update(dt) {
      t += dt;
      if (t > 0.1 && ventIndex < vents.length && t > 0.1 + ventIndex * 0.027) {
        const [x, y] = vents[ventIndex++];
        for (let i = 0; i < 7; i++) {
          ps.spawn(P.SPARK, x, y, R.range(-45, 45), -R.range(110, 230), R.range(0.25, 0.6));
          if (i < 3) ps.spawn(P.DUST, x, y, R.range(-25, 25), -R.range(40, 90), R.range(0.45, 0.9), hex("#9b8066"), R.range(2, 4));
          if (i < 2) bits.add({ kind: B.CHUNK, x, y: y - 2, vx: R.range(-40, 40), vy: -R.range(100, 210), s: R.range(2, 4), a: R.range(0, TAU), va: R.range(-10, 10), ramp: STONE, g: 0.8, drag: 0.8, bounce: 0.3, life: R.range(0.8, 1.6) });
        }
      }
      if (t < 0.6) for (dustAcc += dt * 65; dustAcc >= 1; dustAcc--) {
        const side = R.sign(), x = side * (12 + 195 * ease.outCubic(t / 0.65));
        ps.spawn(P.DUST, x, -R.range(1, 12), side * R.range(12, 40), -R.range(3, 18), R.range(0.5, 1.2), hex("#b49c80"), R.range(2.5, 5));
      }
      for (const b of bits.list) b.pvy = b.vy;
      bits.update(dt);
      for (const b of bits.list) if (b.pvy > 100 && b.vy <= 0) {
        for (let i = 0; i < 3; i++) ps.spawn(P.DUST, b.x, 0, R.range(-25, 25), -R.range(5, 15), R.range(0.3, 0.6), hex("#87766c"), 1 + b.s * 0.2);
      }
      ps.update(dt); contain(ps, bits); lights.update(dt);
    },
    drawBack(p) { if (t >= meta.duration) return; floor(p); waves(p, true); ps.draw(p, "back"); },
    draw(p) {
      if (t >= meta.duration) return;
      waves(p, false); bits.draw(p); ps.draw(p, "front");
      // A narrow white core shoots from earth all the way to the ruptured sky.
      if (t < 0.48) {
        const h = 211 * ease.outExpo(clamp(t / 0.085)), k = 1 - smooth(0.12, 0.48, t), w = 1 + 9 * (1 - t / 0.48);
        p.beam(0, -h, 0, -1, w, (u, v) => v < 0.12 ? WHITE : v < 0.45 ? C[6] : C[4], k);
        p.glowLine(0, -h + 6, 0, -4, 18, C[5], k * 0.65);
        for (const side of [-1, 1]) p.line(side * (w + 5), -h + 8, side * (w + 5), -7, C[5], k * 0.5);
      }
      if (t < 0.18) flare(p, 0, -2, 64 * (1 - t / 0.18), 1 - t / 0.18, C);
      lights.draw(p);
      // Two graphic frames, opposite polarities; the light remains localized to the impact.
      if (t < 2 / 30) {
        if (t < 1 / 30) drain(p, true); else drain(p);
        for (let i = 0; i < 26; i++) {
          const a = i / 26 * TAU, r = 28 + (i % 4) * 12, L = 35 + (i % 5) * 13;
          const x = Math.cos(a) * r, y = -4 + Math.sin(a) * r * 0.7, xx = Math.cos(a) * (r + L), yy = -4 + Math.sin(a) * (r + L) * 0.7;
          if (xx < -226 || xx > 173 || yy > 31) continue;
          p.line(x, y, xx, yy, t < 1 / 30 ? INK : WHITE);
        }
      }
    },
  };
}
