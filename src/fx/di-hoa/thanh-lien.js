// Di Hoa 1 — Thanh Lien Dia Tam Hoa (Opus, 17/11/2026). Motion approved from thanh-lien-draft.js;
// script: design/di-hoa/01-thanh-lien-dia-tam-hoa.md (project root).
//   CAST  (at the caster)  palm pressed to the ground; a lava crack races underground to the target, licking flames
//   BLOOM (at the target)  the cracks open into a floor lotus, green lava erupts (shared ground blast, small scale),
//                          eight fire petals rise, fold over the target and burn twice, then fall to embers; cracks cool
import { chain, READY, smooth, clamp, TAU, WHITE, Rng, P, PF, Particles, Lights, fit, hex } from '../../core/index.js';
import { FLAMES, petal, drawColored } from '../ultimate/_lotus-lib.js';
import { createGroundBlast } from '../ultimate/_blast.js';
import { STONE } from '../ultimate/_lib.js';

const RAMP = FLAMES[0], TX = 150, HAND = 18, BLOOM = 0.8, END = 2.9;
const COOL = ['#120807', '#3a140c', '#7a2c12', '#b8501c'].map(hex);
const sm = (u) => u * u * (3 - 2 * u);
export const meta = {
  name: 'Thanh Lien Dia Tam Hoa',
  desc: 'A palm on the ground sends a green lava crack to the target; a lotus of cracks erupts into fire petals that fold over it and burn.',
  tags: ['di-hoa', 'fire', 'ground', 'lotus', 'lava', 'move', 'one-shot'],
  size: [320, 240], origin: [60, 215], duration: END, loop: false, fps: 30, bg: 'ground', actor: 2,
  options: { palette: RAMP, seed: 5 },
};
const KNEEL = { ...READY, crouch: 10, lean: 10, fx: 17, fy: -4, bx: 5, by: -15, ffx: 9, fbx: -9 };
export const act = {
  target: { x: TX },
  poses: [[-0.2, READY], [0.18, KNEEL, 'snap'], [1.0, { ...KNEEL, crouch: 9 }], [1.15, { ...KNEEL, crouch: 5, lean: 3, fx: 15, fy: -14 }],
    [1.9, { ...READY, crouch: 4 }], [END, READY]],
  hits: [
    { t: 0.18, stop: 0.04, shake: 0.12, amp: 1, target: false },
    { t: 1.05, shake: 0.35, amp: 2.5, push: 0.6, straw: 6 },
    { t: 1.62, stop: 0.07, shake: 0.25, amp: 3, push: 1.6, straw: 14, flash: 0.08 },
    { t: 1.84, stop: 0.05, shake: 0.2, amp: 2, push: 1.2, straw: 10, skin: 'char' },
    { t: END - 0.4, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: 0.18, x: 14, n: 6, dir: 1 }, { t: 0.18, x: 14, n: 6, dir: -1 }],
};
const ramp = (o) => fit(o.palette ?? RAMP, 7);
// a crack drawn as hot core + darker rim; heat 1 = white-hot, 0 = cooled to embers, alpha k
function crack(p, pts, C, heat, k) {
  if (k <= 0 || pts.length < 2) return;
  const cool = 1 - heat, core = cool < 0.35 ? C[heat > 0.85 ? 6 : 5] : COOL[3 - Math.min(3, Math.floor((cool - 0.35) * 6))];
  const rim = cool < 0.35 ? C[3] : COOL[1];
  p.polyline(pts.map(([x, y]) => [x, y + 1]), rim, k * 0.8);
  p.polyline(pts, core, k);
  if (cool < 0.5) for (let i = 0; i < pts.length; i += 3) p.glow(pts[i][0], pts[i][1], 4, C[3], 0.1 * k * (1 - cool));
}
const heatAt = (t) => 1 - smooth(1.9, 2.6, t);

// ------------------------------------------------------------------ CAST: palm and the underground vein
const cast = {
  meta: { duration: END, loop: false, options: {} },
  create(o) {
    const C = ramp(o), R = new Rng(o.seed), lights = new Lights();
    const ps = new Particles({ rng: new Rng(o.seed + 1), ground: () => 0, sparks: [C[6], C[5], C[3], C[1]] });
    const vein = [];
    for (let x = HAND; x <= TX - 4; x += 3) vein.push([x, 1 + Math.round(R.range(-1.4, 1.4) + Math.sin(x * 0.21) * 0.8)]);
    const branches = Array.from({ length: 9 }, (_, i) => {
      const k = 2 + Math.floor((i + R.range(0, 0.8)) * (vein.length - 5) / 9), [x, y] = vein[k], s = i % 2 ? 1 : -1;
      const pts = [[x, y]];
      for (let j = 1; j <= 3; j++) pts.push([x + j * R.range(3, 5), y + s * j * R.range(0.6, 1.6)]);
      return { x, pts };
    });
    let t = 0, slam = false, acc = 0;
    const head = (tt) => HAND + (TX - 4 - HAND) * smooth(0.3, 0.85, tt);
    return {
      update(dt) {
        t += dt;
        if (!slam && t >= 0.18) {
          slam = true;
          lights.add(HAND, -2, 30, C[4], 0.6, 0.3);
          for (let i = 0; i < 16; i++) { const a = R.range(-Math.PI, 0); ps.spawn(P.SPARK, HAND, -1, Math.cos(a) * R.range(40, 110), Math.sin(a) * R.range(30, 90), R.range(0.15, 0.35)); }
          for (let i = 0; i < 10; i++) ps.spawn(P.GRIT, HAND + R.range(-4, 4), -1, R.range(-60, 60), -R.range(40, 110), R.range(0.4, 0.7), hex(STONE[R.int(2, 4)]), 1);
        }
        const h = head(t);
        if (t > 0.3 && t < 0.86) {
          // the racing head: sparks, chips of floor and short tongues of flame
          for (acc += dt * 70; acc >= 1; acc--) {
            ps.spawn(P.FIRE, h + R.range(-2, 2), -1, R.range(-15, 5), -R.range(30, 80), R.range(0.12, 0.22), 0, R.range(1.4, 2.8));
            if (R.chance(0.4)) ps.spawn(P.SPARK, h, -1, R.range(-40, 50), -R.range(40, 120), R.range(0.12, 0.3));
            if (R.chance(0.25)) ps.spawn(P.GRIT, h, -1, R.range(-30, 30), -R.range(50, 110), R.range(0.35, 0.6), hex(STONE[R.int(2, 4)]), 1);
          }
        }
        // the opened crack keeps breathing small flames until it cools
        if (t > 0.4 && t < 1.95 && R.chance(28 * dt)) {
          const x = R.range(HAND + 4, Math.min(h, TX - 10));
          ps.spawn(P.FIRE, x, -1, R.range(-5, 5), -R.range(20, 50), R.range(0.14, 0.26), 0, R.range(1.2, 2.4));
        }
        ps.update(dt);
        lights.update(dt);
      },
      drawBack(p) { drawColored(ps, p, C, 'back'); },
      draw(p) {
        if (t >= END) return;
        const k = 1 - smooth(2.55, 2.85, t), h = head(t), heat = heatAt(t);
        // palm print on the floor
        const pk = smooth(0.12, 0.2, t) * (1 - smooth(0.5, 0.9, t));
        if (pk > 0) {
          p.glow(HAND, -1, 16, C[4], 0.45 * pk);
          p.ellipse(HAND, 0, 6 + 14 * smooth(0.18, 0.5, t), 1.5 + 2 * smooth(0.18, 0.5, t), C[5], 0.5 * pk * (1 - smooth(0.3, 0.5, t)));
        }
        if (t > 0.3) {
          const pts = vein.filter(([x]) => x <= h);
          crack(p, pts, C, heat, k);
          for (const b of branches) if (b.x < h - 8) crack(p, b.pts, C, heat * 0.85, k * smooth(b.x + 8, b.x + 20, h));
          if (t < 0.86) { p.glow(h, -1, 9, C[4], 0.55); p.disc(h, -1, 1.6, WHITE, 1); }
        }
        drawColored(ps, p, C, 'front');
        lights.draw(p);
      },
    };
  },
};

// ------------------------------------------------------------------ BLOOM: at the target, local time from BLOOM
const ERUPT = 1.05 - BLOOM, HIT1 = 1.62 - BLOOM, HIT2 = 1.84 - BLOOM, WILT = 1.9 - BLOOM, LOCAL_END = END - BLOOM;
const bloom = {
  meta: { duration: LOCAL_END, loop: false, options: {} },
  create(o) {
    const C = ramp(o), R = new Rng(o.seed + 3), lights = new Lights();
    const ps = new Particles({ rng: new Rng(o.seed + 7), ground: () => 0, sparks: [C[6], C[5], C[3], C[1]] });
    let ground = null, t = 0, n1 = false, n2 = false, acc = 0;
    const petalGeo = (i) => {
      const g = smooth(ERUPT + 0.03, ERUPT + 0.3, t), close = sm(clamp((t - (1.35 - BLOOM)) / 0.3));
      const a = i * TAU / 8 + 0.2, bx = Math.cos(a) * 30, by = Math.sin(a) * 6;
      const open = [Math.cos(a) * 22, -62 * g], shut = [Math.cos(a) * 3 - bx, -72 - by];
      return { a, bx, by, dx: open[0] + (shut[0] - open[0]) * close, dy: open[1] + (shut[1] - open[1]) * close, g, back: Math.sin(a) < 0 };
    };
    const burst = (big) => {
      lights.add(0, -36, big ? 70 : 50, C[4], big ? 0.55 : 0.4, 0.25);
      lights.add(0, -36, 14, WHITE, 0.3, 0.08);
      for (let i = 0; i < (big ? 26 : 16); i++) {
        const a = R.range(-Math.PI, 0), v = R.range(70, 190);
        ps.spawn(P.SPARK, R.range(-8, 8), -36 + R.range(-14, 14), Math.cos(a) * v, Math.sin(a) * v, R.range(0.2, 0.45));
      }
      for (let i = 0; i < 8; i++) ps.spawn(P.FIRE, R.range(-14, 14), -30 - R.range(0, 30), R.range(-40, 40), -R.range(40, 100), R.range(0.2, 0.32), 0, R.range(4, 7), 0, 0);
    };
    return {
      update(dt) {
        t += dt;
        if (!ground && t >= ERUPT) {
          ground = createGroundBlast({ seed: o.seed, scale: 0.42, hot: RAMP, dirt: STONE, haze: '#263a38', halfWidth: 150,
            outward: 0.6, jet: 0.75, duration: LOCAL_END - ERUPT - 0.05, bounds: [-208, -212, 108, 24] });
          lights.add(0, -20, 60, C[4], 0.9, 0.35);
          lights.add(0, -6, 20, WHITE, 0.8, 0.08);
          for (let i = 0; i < 26; i++) {   // lava droplets on arcs
            const a = R.range(-Math.PI * 0.85, -Math.PI * 0.15), v = R.range(110, 240);
            ps.spawn(P.EMBER, R.range(-4, 4), -4, Math.cos(a) * v, Math.sin(a) * v, R.range(0.5, 0.9), C[R.int(3, 5)], R.chance(0.35) ? 2 : 1);
          }
        }
        if (ground) ground.update(dt);
        if (t > ERUPT && t < ERUPT + 0.26) {
          // the lava column: a throat of big tongues shooting straight up
          for (acc += dt * 140; acc >= 1; acc--) { const w = R.range(-1, 1); ps.spawn(P.FIRE, w * 9, -2, w * 30 + R.range(-10, 10), -R.range(200, 380), R.range(0.22, 0.36), 0, R.range(6, 11), 0, PF.BIG); }
        }
        if (!n1 && t >= HIT1) { n1 = true; burst(true); }
        if (!n2 && t >= HIT2) { n2 = true; burst(false); }
        // petal tips lick and, once they wilt, shed embers
        if (t > ERUPT + 0.05 && t < WILT + 0.35) for (let i = 0; i < 8; i++) {
          const q = petalGeo(i);
          if (R.chance((t < WILT ? 6 : 18) * dt)) {
            const u = R.range(0.5, 1), x = q.bx + q.dx * u, y = q.by + q.dy * u;
            if (t < WILT) ps.spawn(P.FIRE, x, y, R.range(-6, 6), -R.range(20, 50), R.range(0.12, 0.22), 0, R.range(1.5, 3), 0, q.back ? PF.BACK : 0);
            else ps.spawn(P.EMBER, x, y, R.range(-15, 15), -R.range(20, 60), R.range(0.5, 1.0), C[R.int(3, 5)], 1, 0, q.back ? PF.BACK : 0);
          }
        }
        ps.update(dt);
        lights.update(dt);
      },
      drawBack(p) {
        if (t >= LOCAL_END) return;
        const saved = p.fade; p.fade *= 1 - smooth(LOCAL_END - 0.35, LOCAL_END - 0.03, t);
        floor(p);
        if (ground) ground.drawBack(p);
        petals(p, true);
        drawColored(ps, p, C, 'back');
        p.fade = saved;
      },
      draw(p) {
        if (t >= LOCAL_END) return;
        const saved = p.fade; p.fade *= 1 - smooth(LOCAL_END - 0.35, LOCAL_END - 0.03, t);
        if (ground) ground.draw(p);
        if (t > ERUPT && t < ERUPT + 0.4) {
          const k = 1 - smooth(ERUPT + 0.15, ERUPT + 0.4, t), h = 120 * sm(clamp((t - ERUPT) / 0.15));
          p.glowLine(0, -2, 0, -h, 14, C[3], 0.3 * k);
          p.glowLine(0, -2, 0, -h * 0.6, 6, C[5], 0.35 * k);
        }
        petals(p, false);
        drawColored(ps, p, C, 'front');
        const fl = Math.max(0, 1 - Math.abs(t - HIT1) / 0.07) + 0.8 * Math.max(0, 1 - Math.abs(t - HIT2) / 0.07);
        if (fl > 0) p.glow(0, -36, 18, C[5], 0.3 * fl);
        lights.draw(p);
        p.fade = saved;
      },
    };
    // floor lotus: eight petal-shaped cracks in perspective, with a bulge of light before the eruption
    function floor(p) {
      if (t < 0) return;
      const grow = sm(clamp(t / 0.25)), heat = heatAt(t + BLOOM), k = 1 - smooth(LOCAL_END - 0.4, LOCAL_END - 0.05, t);
      if (t < ERUPT + 0.1) p.glow(0, -2, 10 + 26 * grow, C[3], 0.25 * grow);
      for (let i = 0; i < 8; i++) {
        const a = i * TAU / 8 + 0.2, a1 = a - 0.28, a2 = a + 0.28, R0 = 38 * grow;
        crack(p, [[0, 0], [Math.cos(a1) * R0 * 0.6, Math.sin(a1) * R0 * 0.12], [Math.cos(a) * R0, Math.sin(a) * R0 * 0.2],
          [Math.cos(a2) * R0 * 0.6, Math.sin(a2) * R0 * 0.12], [0, 0]], C, heat * 0.9, k);
      }
    }
    function petals(p, back) {
      const fade = 1 - smooth(WILT, WILT + 0.4, t);
      if (t < ERUPT || fade <= 0) return;
      const crackK = smooth(HIT1 - 0.1, HIT1, t) * (1 - smooth(WILT, WILT + 0.3, t));
      for (let i = 0; i < 8; i++) {
        const q = petalGeo(i);
        if (q.back !== back || q.g <= 0) continue;
        petal(p, q.bx, q.by, q.dx, q.dy, 9, C, t + BLOOM, 50 + i, fade * (back ? 0.75 : 1), crackK * 0.6, true);
      }
    }
  },
};

export function create(o) {
  const common = { palette: o.palette ?? RAMP };
  return chain([
    { fx: cast, t: 0, ...common },
    { fx: bloom, t: BLOOM, x: TX, ...common },
  ])(o);
}
