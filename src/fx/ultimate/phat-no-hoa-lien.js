import { chain, READY, smooth, clamp, TAU, WHITE, Rng, P, Particles } from '../../core/index.js';
import { FLAMES, flames, lotus, orbitEmbers, drawColored } from './_lotus-lib.js';
import * as burst from './hoa-lien-burst.js';

// One presentation frame lets the rupture become visible before the shared hit-stop freezes it.
const THROW = 1.12, ARRIVE = 1.53, HIT = ARRIVE + burst.BREAK + 1 / 60, TX = 176;
export const meta = {
  name: 'Phat No Hoa Lien',
  desc: 'Two hands fuse alien flames into a lotus, lift it, then hurl it into a distant target; its broken balance releases a petal shock and a towering crown of fire.',
  tags: ['ultimate', 'move', 'lotus', 'fire', 'spell', 'projectile', 'explosion', 'one-shot'],
  size: [480, 280], origin: [88, 242], duration: ARRIVE + burst.meta.duration,
  loop: false, fps: 30, bg: 'ground', actor: 2,
  options: { flames: FLAMES, seed: 17 },
};
const CUP = { ...READY, turn: 1, x: -3, crouch: 3, lean: 0, fx: -5, fy: -25, bx: 9, by: -26, ffx: -6, fbx: 7, armsFront: true };
const UP = { ...CUP, crouch: 0, fx: -5, fy: -42, bx: 7, by: -42, hy: -1 };
const CAST = { ...READY, x: 7, crouch: 3, lean: 5, fx: 17, fy: -29, bx: 4, by: -30, ffx: 11, fbx: -8, toeB: true };
const BRACE = { ...READY, x: 4, turn: 0.9, crouch: 6, lean: -4, fx: -5, fy: -34, bx: 7, by: -34, ffx: 8, fbx: -6 };
export const act = {
  target: { x: TX },
  poses: [
    [-0.3, READY], [0, CUP], [0.45, { ...CUP, crouch: 5 }], [0.86, UP],
    [1.04, { ...UP, lean: -2, x: -4 }], [THROW, CAST, 'snap'],
    [ARRIVE, { ...CAST, lean: 3 }], [HIT, BRACE, 'snap'],
    [HIT + 0.4, { ...BRACE, crouch: 4 }], [HIT + 1, { ...READY, x: 3 }],
    [HIT + 1.7, READY], [meta.duration, READY],
  ],
  hits: [
    { t: THROW, stop: 0.035, shake: 0.12, amp: 1.5, target: false },
    { t: HIT, stop: 0.2, shake: 0.65, amp: 5, push: 4.3, straw: 45, flash: 0.2, skin: 'char' },
    { t: HIT + 2.75, push: 0, straw: 0, flash: 0, skin: null },
  ],
  dust: [{ t: THROW, x: 10, n: 8, dir: 1 }, { t: HIT, x: 4, n: 7, dir: -1 }],
};

const hand = t => {
  const up = smooth(0.45, 0.86, t);
  return [-1, -27 - up * 17];
};
const charge = {
  meta: { duration: THROW, loop: false, options: {} },
  draw(p, t, o) {
    if (t >= THROW) return;
    const C = flames(o), [x, y] = hand(t), open = smooth(0.08, 0.64, t);
    // One double helix per flame. Their shrinking paths lead from either hand to the same stamen.
    for (let j = 0; j < C.length; j++) {
      for (const side of [-1, 1]) {
        const pts = [];
        for (let i = 0; i <= 24; i++) {
          const u = i / 24, r = (1 - u) * (24 + 8 * j / C.length), a = j * TAU / C.length + t * 10 + u * 4;
          pts.push([x + side * r * (0.7 + 0.2 * Math.cos(a)), y + 8 * (1 - u) + Math.sin(a) * r * 0.42]);
        }
        p.polyline(pts, (u) => C[j][u > 0.7 ? 5 : 3], smooth(0, 0.15, t) * (1 - smooth(0.76, 1.1, t)));
        for (let i = 4; i < 24; i += 6) p.glow(pts[i][0], pts[i][1], 4, C[j][4], 0.16);
      }
    }
    lotus(p, t, C, { x, y: y - 3, size: 0.12 + open * 0.48, halo: t > 0.4, seed: o.seed });
    orbitEmbers(p, t, C, o.seed, x, y, 0.65);
    p.glow(x, y, 22, WHITE, 0.1 * open);
  },
};
const projectile = {
  meta: { duration: ARRIVE - THROW, loop: false, options: {} },
  create(o) {
    const C = flames(o), R = new Rng(o.seed);
    const ps = C.map((r, i) => new Particles({ rng: new Rng(o.seed + i), sparks: [r[5], r[4], r[3], r[1]] }));
    let t = 0;
    return {
      update(dt) {
        t += dt;
        for (let j = 0; j < C.length; j++) {
          if (R.chance(65 * dt)) ps[j].spawn(P.FIRE, -R.range(4, 16), Math.sin(t * 28 + j * TAU / C.length) * 5,
            -R.range(90, 170), R.range(-15, 8), R.range(0.15, 0.28), 0, R.range(1.8, 3.4));
          if (R.chance(25 * dt)) ps[j].spawn(P.EMBER, -4, R.range(-4, 4), -R.range(130, 240), -R.range(0, 25), 0.22, C[j][3]);
          ps[j].update(dt);
        }
      },
      draw(p) {
        for (let j = 0; j < C.length; j++) drawColored(ps[j], p, C[j]);
        lotus(p, t, C, { y: 0, size: 0.48 - clamp(t / (ARRIVE - THROW)) * 0.18, halo: false, seed: o.seed });
      },
    };
  },
};
export function create(o) {
  // chain intentionally keeps cue options explicit, including all caller-provided flame ramps.
  const common = { flames: o.flames ?? FLAMES, ...(o.palette ? { palette: o.palette } : {}) };
  return chain([
    { fx: charge, t: 0, until: THROW, ...common },
    { fx: projectile, t: THROW, until: ARRIVE, ...common,
      x: t => 24 + (TX - 24) * clamp((t - THROW) / (ARRIVE - THROW)),
      y: t => -32 + 10 * clamp((t - THROW) / (ARRIVE - THROW)) - 12 * Math.sin(clamp((t - THROW) / (ARRIVE - THROW)) * Math.PI) },
    { fx: burst, t: ARRIVE, x: TX, ...common },
  ])(o);
}
