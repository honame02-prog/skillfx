import { chain, READY, smooth, clamp, TAU, WHITE, Rng, P, Particles } from '../../core/index.js';
import { FLAMES, flames, lotus, orbitEmbers, drawColored } from './_lotus-lib.js';
import * as burst from './hoa-lien-burst.js';

// One presentation frame lets the rupture become visible before the shared hit-stop freezes it.
// Opus: the lotus is the star of an ultimate, so it charges longer and grows big above the head before the throw.
const THROW = 1.75, ARRIVE = THROW + 0.41, HIT = ARRIVE + burst.BREAK + 1 / 60, TX = 176;
// Opus: the caster first spins a full turn on the spot (gathering the flames), then the charge begins. Times below
// without "A" are relative to the charge; act and chain use absolute move time = SPIN + relative.
const SPIN = 0.6, A = (x) => SPIN + x;
export const meta = {
  name: 'Phat No Hoa Lien',
  desc: 'Two hands fuse alien flames into a lotus, lift it, then hurl it into a distant target; its broken balance releases a petal shock and a towering crown of fire.',
  tags: ['ultimate', 'move', 'lotus', 'fire', 'spell', 'projectile', 'explosion', 'one-shot'],
  size: [480, 380], origin: [88, 342], duration: +(SPIN + ARRIVE + burst.meta.duration).toFixed(3),
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
    [-0.3, READY],
    // a full spin about the feet, arms flung out, crouched low; yaw keys every quarter turn so it really turns
    [0, { ...READY, crouch: 3, fx: 12, fy: -26, bx: -10, by: -26 }],
    [0.15, { ...READY, yaw: 1.57, crouch: 5, fx: 13, fy: -27, bx: -11, by: -27 }],
    [0.3, { ...READY, yaw: 3.14, crouch: 6, fx: 14, fy: -28, bx: -12, by: -28 }],
    [0.45, { ...READY, yaw: 4.71, crouch: 5, fx: 13, fy: -27, bx: -11, by: -27 }],
    [SPIN, { ...CUP, yaw: 6.28, crouch: 6 }, 'out'],
    [A(0.6), { ...CUP, yaw: 6.28, crouch: 5 }], [A(1.2), { ...UP, yaw: 6.28 }],
    [A(1.45), { ...UP, yaw: 6.28, crouch: -1 }], [A(1.66), { ...UP, yaw: 6.28, lean: -3, x: -5 }], [A(THROW), { ...CAST, yaw: 6.28 }, 'snap'],
    [A(ARRIVE), { ...CAST, yaw: 6.28, lean: 3 }], [A(HIT), { ...BRACE, yaw: 6.28 }, 'snap'],
    [A(HIT + 0.4), { ...BRACE, yaw: 6.28, crouch: 4 }], [A(HIT + 1), { ...READY, yaw: 6.28, x: 3 }],
    [A(HIT + 1.7), { ...READY, yaw: 6.28 }], [meta.duration, { ...READY, yaw: 6.28 }],
  ],
  hits: [
    { t: A(THROW), stop: 0.035, shake: 0.12, amp: 1.5, target: false },
    { t: A(HIT), stop: 0.2, shake: 0.65, amp: 5, push: 4.3, straw: 45, flash: 0.2, skin: 'char' },
    { t: A(HIT + 2.75), push: 0, straw: 0, flash: 0, skin: null },
  ],
  dust: [{ t: SPIN, x: 0, n: 10, dir: 1 }, { t: SPIN, x: 0, n: 10, dir: -1 }, { t: A(THROW), x: 10, n: 8, dir: 1 }, { t: A(HIT), x: 4, n: 7, dir: -1 }],
};

const hand = t => {
  const up = smooth(0.6, 1.2, t);
  return [-1, -27 - up * 17];
};
// How far the lotus floats above the hands once they are raised, so the big flower clears the head.
const lift = t => smooth(0.7, 1.3, t) * 22;
const charge = {
  meta: { duration: THROW, loop: false, options: {} },
  draw(p, t, o) {
    if (t >= THROW) return;
    const C = flames(o), [x, hy] = hand(t), y = hy - lift(t), open = smooth(0.1, 1.3, t);
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
    lotus(p, t, C, { x, y: y - 3, size: 0.12 + open * 0.83, halo: t > 0.5, seed: o.seed });
    orbitEmbers(p, t, C, o.seed, x, y, 0.65 + open * 0.5);
    p.glow(x, y, 22 + open * 20, WHITE, 0.08 + 0.08 * open);
  },
};
// Opus: during the spin each flame trails a fiery arc round the caster's waist, tightening as the turn ends.
const spin = {
  meta: { duration: SPIN, loop: false, options: {} },
  draw(p, t, o) {
    if (t >= SPIN) return;
    const C = flames(o), u = t / SPIN, k = smooth(0, 0.12, t) * (1 - smooth(0.8, 1, u));
    for (let j = 0; j < C.length; j++) {
      const a0 = u * TAU * 1.05 + j * TAU / C.length, r = 22 - 8 * u, pts = [];
      for (let i = 0; i <= 14; i++) {
        const a = a0 - i * 0.11;
        pts.push([Math.cos(a) * r, -20 + Math.sin(a) * r * 0.32 - j * 2]);
      }
      p.polyline(pts, (v) => C[j][v < 0.15 ? 5 : v < 0.6 ? 4 : 3], (v) => k * (1 - v * 0.8));
      p.glow(pts[0][0], pts[0][1], 6, C[j][5], 0.3 * k);
    }
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
        lotus(p, t, C, { y: 0, size: 0.95 - clamp(t / (ARRIVE - THROW)) * 0.4, halo: false, seed: o.seed });
      },
    };
  },
};
export function create(o) {
  // chain intentionally keeps cue options explicit, including all caller-provided flame ramps.
  const common = { flames: o.flames ?? FLAMES, ...(o.palette ? { palette: o.palette } : {}) };
  return chain([
    { fx: spin, t: 0, until: SPIN, ...common },
    { fx: charge, t: SPIN, until: A(THROW), ...common },
    { fx: projectile, t: A(THROW), until: A(ARRIVE), ...common,
      x: t => 24 + (TX - 24) * clamp((t - A(THROW)) / (ARRIVE - THROW)),
      y: t => -66 + 44 * clamp((t - A(THROW)) / (ARRIVE - THROW)) - 12 * Math.sin(clamp((t - A(THROW)) / (ARRIVE - THROW)) * Math.PI) },
    { fx: burst, t: A(ARRIVE), x: TX, ...common },
  ])(o);
}
