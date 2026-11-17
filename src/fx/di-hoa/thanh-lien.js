// Di Hoa 1 — Thanh Lien Dia Tam Hoa, detailed v2 (Opus, 17/11/2026). Draft: thanh-lien-draft.js (approved, with the seed
// THROWN hard instead of tossed). Script: design/di-hoa/01-thanh-lien-dia-tam-hoa.md (project root).
// The lotus life cycle: a fire lotus seed is hurled into the ground -> a lava pond -> a bud breaks the earth -> bloom round
// the target -> the seed pod erupts like a volcano, the petals are blown off, the pond cools to cracked rock.
// Material: petals, pond and column are filled in ONE pass each (axis coordinates), hard colour bands and flowing veins,
// no soft blobs; particles only for licks, sparks and embers.
import { chain, READY, smooth, clamp, TAU, WHITE, Rng, P, PF, Particles, Lights, fit, hex, mix, band, poseAt } from '../../core/index.js';
import { FLAMES, drawColored } from '../ultimate/_lotus-lib.js';
import { createGroundBlast } from '../ultimate/_blast.js';
import { STONE } from '../ultimate/_lib.js';

const RAMP = FLAMES[0], TX = 150, END = 3.3;
const CHARGE = 0.05, THROW = 0.4, LAND = 0.55, BUD = 1.1, OPEN = 1.45, FULL = 1.9, BURST = 2.05;
const COOL = ['#0c0809', '#22140f', '#5a1c10', '#a8381a', '#f07a2a'].map(hex), DIRT = STONE.map(hex);
const sm = (u) => u * u * (3 - 2 * u), out3 = (u) => 1 - (1 - u) ** 3;
export const meta = {
  name: 'Thanh Lien Dia Tam Hoa',
  desc: 'A fire lotus seed is hurled into the ground; a lava pond grows a bud that blooms round the target, then the seed pod erupts like a volcano.',
  tags: ['di-hoa', 'fire', 'lotus', 'lava', 'volcano', 'move', 'one-shot'],
  size: [360, 260], origin: [60, 235], duration: END, loop: false, fps: 30, bg: 'ground', actor: 2,
  options: { palette: RAMP, seed: 5, petal: 'A' },
};
const WIND = { ...READY, crouch: 4, lean: -6, turn: 0.4, fx: -12, fy: -33, bx: 7, by: -21, ffx: 9, fbx: -8 };
const HURL = { ...READY, crouch: 6, lean: 9, fx: 24, fy: -24, bx: -6, by: -19, ffx: 12, fbx: -10 };
const MUDRA = { ...READY, crouch: 3, fx: 9, fy: -30, bx: 10, by: -31, armsFront: true };
export const act = {
  target: { x: TX },
  poses: [[-0.2, READY], [0.25, WIND], [THROW - 0.02, { ...WIND, lean: -8, fx: -14, fy: -35 }], [THROW + 0.05, HURL, 'snap'],
    [0.8, { ...HURL, crouch: 4, lean: 5 }], [1.05, MUDRA], [FULL, { ...MUDRA, crouch: 5 }],
    [BURST, { ...READY, crouch: 0, fx: 6, fy: -45, bx: 8, by: -45 }, 'snap'], [BURST + 0.5, { ...READY, crouch: 2, fx: 9, fy: -40, bx: 10, by: -38 }], [END, READY]],
  hits: [
    { t: THROW + 0.03, stop: 0.03, shake: 0.08, amp: 1, target: false },
    { t: LAND, stop: 0.06, shake: 0.22, amp: 2.5, push: 0.4, straw: 4 },
    { t: BUD + 0.12, shake: 0.25, amp: 2, push: 0.6, straw: 6 },
    { t: BURST, stop: 0.13, shake: 0.55, amp: 4.5, push: 3.2, straw: 32, flash: 0.1, skin: 'char' },
    { t: END - 0.35, push: 0, straw: 0, skin: null },
  ],
  dust: [{ t: THROW + 0.05, x: 6, n: 5, dir: -1 }],
};
const ramp = (o) => fit(o.palette ?? RAMP, 7);

// ---------------------------------------------------------------- petal material (one pass)
// heat bands: 0 dark rim .. 5 white-hot; dim shifts the whole petal darker (back petals), cool turns it to cinders
function petalFire(p, C, bx, by, tx, ty, W, t, seed, { k = 1, dim = 0, crack = 0, cool = 0 } = {}) {
  const dx = tx - bx, dy = ty - by, L = Math.hypot(dx, dy);
  if (L < 2 || k <= 0) return;
  const ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const hw = (u) => u < 0.68 ? W * (0.22 + 0.78 * Math.pow(Math.sin(Math.PI * 0.5 * u / 0.68), 0.75)) : W * Math.pow((1 - u) / 0.32, 1.15);
  const pad = W * 1.5 + 4, x0 = Math.min(bx, tx) - pad, x1 = Math.max(bx, tx) + pad, y0 = Math.min(by, ty) - pad, y1 = Math.max(by, ty) + pad;
  const pal = cool > 0 ? C.map((c, i) => mix(c, COOL[Math.min(4, i)], cool)) : C;
  p.shade(x0, y0, x1, y1, (x, y, o) => {
    const ex = x - bx, ey = y - by, u = (ex * ux + ey * uy) / L, v = ex * nx + ey * ny;
    if (u < 0 || u > 1.12) return;
    // tongues of flame lick off the upper rim and the tip, flickering upward
    const lick = Math.pow(Math.max(0, Math.sin(u * 19 - t * 17 + seed * 1.7 + (v > 0 ? 0 : 2.1))), 3) * 0.45 * smooth(0.35, 0.9, u);
    const tipLick = u > 1 ? Math.max(0, 1 - (u - 1) / (0.12 * (0.6 + 0.4 * Math.sin(t * 23 + seed)))) : 1;
    const w = u <= 1 ? hw(Math.min(1, u)) : W * 0.12 * tipLick, r = Math.abs(v) / Math.max(0.5, w);
    if (u > 1 && tipLick <= 0) return;
    if (r > 1 + lick) return;
    let b;
    if (r > 1) b = lick > 0.3 ? 4 : 3;                    // the licking tongues: bright, no dark rim
    else if (r > 0.86 || u < 0.04) b = 0;                // dark rim
    else {
      // fire flowing up the petal: travelling waves bend the bands into tongues; root dark, tip hot
      const flow = 0.24 * Math.sin(u * 7 - t * 9 + seed) * Math.cos(v * 0.42 + t * 3 + seed) + 0.08 * Math.sin(u * 16 - t * 15 + v * 0.3);
      const heat = (1 - Math.pow(r, 1.6)) * (0.12 + 1.0 * u) + flow - dim;
      b = heat < 0.16 ? 1 : heat < 0.36 ? 2 : heat < 0.56 ? 3 : heat < 0.76 ? 4 : 5;
      if (u > 0.9 && b > 3) b = 6;                                           // white-hot tip
    }
    if (crack > 0 && r < 0.8 && Math.abs(v - 2.5 * Math.sin(u * 9 + seed)) < 0.6 && u > 0.15 && u < 0.85) { o.c = WHITE; o.a = k * crack; return; }
    o.c = pal[b];
    o.a = k;
  });
}
// ---------------------------------------------------------------- lotus petal v3 (real lotus morphology)
// Nelumbo petal: elliptic, widest a little above the middle, blunt-pointed (subacute) tip, concave (cupped).
// Colour like a real lotus: pale at the base, saturation rising toward the tip and edges; fine veins that meet at
// base and tip; the cup shows as a lighter inner-face crescent along one rim. No dark outline, no hard bands
// (that is what read as crystal): steps are blended with a 4x4 ordered dither. Fire shows as glow + slow heat
// shimmer rising, and (style 'B') a small flame wisp on the tip.
const MELT = 0.14;   // petals burn away this fast at the burst
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const hash = (x, y, s) => { const h = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return h - Math.floor(h); };
function lotusPetal(p, C, bx, by, tx, ty, W, t, seed, { k = 1, dim = 0, side = 1, style = 'A', melt = 0 } = {}) {
  const dx = tx - bx, dy = ty - by, L = Math.hypot(dx, dy);
  if (L < 2 || k <= 0 || melt >= 1) return;
  const ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const M = 0.56;   // widest point
  const Wn = W * 0.74, hw = (u) => u < M ? Wn * (0.18 + 0.82 * Math.sqrt(1 - ((M - u) / M) ** 2)) : Wn * Math.pow(Math.max(0, 1 - ((u - M) / (1 - M)) ** 2), 1.15);
  const pad = W + 8, x0 = Math.min(bx, tx) - pad, x1 = Math.max(bx, tx) + pad, y0 = Math.min(by, ty) - pad - 8, y1 = Math.max(by, ty) + pad;
  const ramp = (x, sx, sy) => {   // continuous position on the palette, dithered between neighbours
    x = clamp(x, 0, 6);
    const i = Math.floor(x), f = clamp((x - i - 0.5) * 2.4 + 0.5);   // narrow dithered seam between flat steps
    return C[Math.min(6, f > BAYER[(sy & 3) * 4 + (sx & 3)] ? i + 1 : i)];
  };
  p.shade(x0, y0, x1, y1, (x, y, o) => {
    const ex = x - bx, ey = y - by, u = (ex * ux + ey * uy) / L, v = (ex * nx + ey * ny) * side;
    // tip flame wisp (style B): a thin flickering tongue above the tip
    if (u > 0.97) {
      if (style !== 'B' || melt > 0) return;
      const fl = (u - 0.97) * L, hgt = 7 + 3 * Math.sin(t * 13 + seed), sway = 1.4 * Math.sin(t * 9 + fl * 0.5 + seed);
      if (fl > hgt || Math.abs(v - sway) > 1.6 * (1 - fl / hgt) + 0.2) return;
      o.c = fl < hgt * 0.5 ? C[5] : C[4]; o.a = k * (1 - fl / hgt * 0.6); return;
    }
    if (u < 0) return;
    const w = hw(u), s = v / Math.max(0.6, w);
    if (Math.abs(s) > 1) return;
    if (melt > 0) {   // burning away from the edges in: holes open, their rims flash white
      const n = hash(Math.floor(x / 2), Math.floor(y / 2), seed) * 0.7 + (Math.abs(s) * 0.5 + Math.abs(u - 0.5)) * 0.6;
      if (n < melt * 1.3 - 0.05) return;
      if (n < melt * 1.3 + 0.12) { o.c = WHITE; o.a = k; return; }
    }
    // the cup: the inner face shows as a crescent along the far rim, widest toward the tip
    const lip = 1 - 0.42 * smooth(0.25, 0.95, u);
    const inner = s > lip;
    // base pale -> tip saturated; edges a little more saturated; back petals dimmer
    let tone = 5.15 - 2.2 * smooth(0.1, 1, u) - 1.0 * Math.pow(Math.abs(s), 3) - dim;
    if (inner) tone = 5.2 - 1.2 * smooth(0.4, 1, u) - dim * 0.6;   // lit inner face
    else if (s > lip - 0.12 && u > 0.3) tone -= 0.9;            // the fold: a soft shadow line under the rolled rim
    // the outline is the same hue, two steps deeper: separates overlapping petals without a crystal edge
    const edgePx = (1 - Math.abs(s)) * w;
    if (edgePx < 1 && u > 0.06) { o.c = C[clamp(Math.round(2.6 - dim * 0.5), 1, 6)]; o.a = k; return; }
    // fine veins, converging at base and tip
    const vs = s / Math.max(0.3, inner ? 1 : lip);
    if (!inner && u > 0.08 && u < 0.88 && Math.abs(Math.sin(vs * Math.PI * 3.5)) < 0.16) tone += 0.55;
    // heat shimmer drifting up the petal (slow, low)
    tone += 0.15 * Math.sin(u * 6 - t * 4.5 + seed) * Math.sin(s * 2.1 + t * 1.3);
    o.c = ramp(tone + melt * 2, x, y);
    o.a = k;
  });
}
// three rings round the seed pod; open 0 = closed bud (tips lean in), 1 = full bloom. Local to the target.
const RINGS = [{ n: 6, r: 24, L: 38, W: 13, th: 1.18, off: 0.26 }, { n: 5, r: 14, L: 40, W: 12.5, th: 0.72, off: 0.9 }, { n: 4, r: 6, L: 36, W: 11, th: 0.26, off: 0.4 }];
function layout(t) {
  const rise = sm(clamp((t - BUD) / (OPEN - BUD))), open = sm(clamp((t - OPEN) / (FULL - OPEN)));
  const squeeze = 1 - 0.1 * smooth(FULL, BURST, t), jit = smooth(FULL, BURST, t) * Math.sin(t * 97) * 0.8, list = [];
  RINGS.forEach((R, ring) => {
    const o = sm(clamp(open * 1.5 - ring * 0.25));
    for (let i = 0; i < R.n; i++) {
      const a = i * TAU / R.n + R.off, th = (-0.18 + (R.th + 0.18) * o) * squeeze;
      const L = R.L * rise * (0.92 + 0.08 * squeeze), W = R.W * (0.55 + 0.45 * rise);
      const bx = Math.cos(a) * R.r + jit, by = -3 + Math.sin(a) * R.r * 0.3;
      list.push({ ring, i, a, bx, by, tx: bx + Math.cos(a) * Math.sin(th) * L, ty: by - Math.cos(th) * L + Math.sin(a) * Math.sin(th) * L * 0.3, W, front: Math.sin(a) >= 0 });
    }
  });
  return list;
}

// ---------------------------------------------------------------- part A: charge and hurl (at the caster)
const hurl = {
  meta: { duration: LAND + 0.3, loop: false, options: {} },
  create(o) {
    const C = ramp(o), R = new Rng(o.seed);
    const ps = new Particles({ rng: new Rng(o.seed + 1), sparks: [C[6], C[5], C[3], C[1]] });
    let t = 0, acc = 0, thrown = false;
    const hand = (tt) => { const q = poseAt(act.poses, tt); return [q.fx ?? 11, q.fy ?? -21]; };
    const flight = (tt) => {
      const u = clamp((tt - THROW) / (LAND - THROW)), [hx, hy] = hand(THROW + 0.05);
      return [hx + (TX - hx) * u, hy + (-1 - hy) * u * u - 2 * Math.sin(Math.PI * u)];
    };
    return {
      update(dt) {
        t += dt;
        if (t < THROW) {
          // sparks drawn into the palm
          const [x, y] = hand(t);
          if (R.chance(40 * dt * smooth(CHARGE, THROW, t))) {
            const a = R.range(0, TAU), d = R.range(10, 18);
            ps.spawn(P.SPARK, x + Math.cos(a) * d, y + Math.sin(a) * d, -Math.cos(a) * d * 6, -Math.sin(a) * d * 6, 0.16);
          }
        } else if (t < LAND) {
          if (!thrown) { thrown = true; const [x, y] = hand(THROW + 0.05); for (let i = 0; i < 8; i++) ps.spawn(P.SPARK, x, y, R.range(40, 140), R.range(-60, 40), R.range(0.1, 0.22)); }
          const [x, y] = flight(t);
          for (acc += dt * 160; acc >= 1; acc--) ps.spawn(P.FIRE, x + R.range(-2, 2), y + R.range(-1, 1), -R.range(40, 90), -R.range(10, 40), R.range(0.1, 0.18), 0, R.range(1.4, 2.6));
        }
        ps.update(dt);
      },
      draw(p) {
        drawColored(ps, p, C, 'front');
        if (t >= LAND) return;
        if (t < THROW) {
          const [x, y] = hand(t), k = smooth(CHARGE, 0.2, t), pulse = 0.8 + 0.2 * Math.sin(t * 40);
          p.glow(x, y, 8 + 4 * k, C[4], 0.35 * k * pulse);
          p.ellipse(x, y, 2.6 * k, 2 * k, C[4], k);
          p.ellipse(x - 0.5, y - 0.5, 1.4 * k, 1 * k, C[6], k);
          return;
        }
        // hurled: a tight bright streak with the seed at its head
        const [x, y] = flight(t), [x0, y0] = flight(Math.max(THROW, t - 0.07));
        p.glowLine(x0, y0, x, y, 4, C[3], 0.4);
        p.line(x0, y0, x, y, C[4], 0.9);
        p.line(x0 + (x - x0) * 0.5, y0 + (y - y0) * 0.5, x, y, C[6], 1);
        p.ellipse(x, y, 2.6, 2, C[5], 1);
        p.dot(x, y, WHITE, 1);
      },
    };
  },
};

// ---------------------------------------------------------------- part B: everything at the target (local time from LAND)
const L_END = END - LAND;
const bloom = {
  meta: { duration: L_END, loop: false, options: {} },
  create(o) {
    const C = ramp(o), R = new Rng(o.seed + 3), lights = new Lights(), STYLE = o.petal ?? 'A', V2 = STYLE === 'v2';
    const ps = new Particles({ rng: new Rng(o.seed + 7), ground: () => 0, sparks: [C[6], C[5], C[3], C[1]] });
    const roots = Array.from({ length: 11 }, (_, i) => {
      const a = i * TAU / 11 + R.range(-0.15, 0.15), len = R.range(16, 40), pts = [];
      for (let s = 0; s <= 5; s++) pts.push([a + R.range(-0.08, 0.08), s / 5]);
      return { len, pts };
    });
    const bubbles = Array.from({ length: 7 }, () => ({ a: R.range(0, TAU), d: R.range(0.1, 0.7), ph: R.range(0, 1), per: R.range(0.35, 0.6) }));
    let t = 0, ground = null, boom = false, acc = 0, landed = false;
    const G = () => t + LAND;   // the move's clock, shared with layout()
    function impactSeed() {
      lights.add(0, -4, 34, C[4], 0.8, 0.25);
      for (let i = 0; i < 22; i++) { const a = R.range(-Math.PI, 0); ps.spawn(P.SPARK, 0, -1, Math.cos(a) * R.range(60, 180), Math.sin(a) * R.range(40, 150), R.range(0.15, 0.4)); }
      for (let i = 0; i < 12; i++) ps.spawn(P.GRIT, R.range(-3, 3), -1, R.range(-80, 80), -R.range(60, 160), R.range(0.5, 0.8), DIRT[R.int(2, 4)], R.chance(0.3) ? 2 : 1);
    }
    function erupt() {
      ground = createGroundBlast({ seed: o.seed, scale: 0.45, hot: RAMP, dirt: STONE, haze: '#22312f', halfWidth: 170,
        outward: 0.75, jet: 0.45, duration: L_END - (BURST - LAND) - 0.05, bounds: [-208, -232, 148, 24] });
      lights.add(0, -30, 80, C[4], 0.6, 0.35);
      for (let i = 0; i < 30; i++) {
        const a = -Math.PI * (0.12 + 0.76 * R.next()), v = R.range(120, 260);
        ps.spawn(P.EMBER, R.range(-4, 4), -6, Math.cos(a) * v, Math.sin(a) * v, R.range(0.6, 1.0), C[R.int(3, 5)], R.chance(0.4) ? 2 : 1);
      }
      // the petals burn away at once: each one breaks into a puff of motes flung outward along it
      if (!V2) for (const q of layout(BURST - 0.001)) for (let j = 0; j < 7; j++) {
        const u = R.range(0.15, 1), x = q.bx + (q.tx - q.bx) * u, y = q.by + (q.ty - q.by) * u, dx = q.tx - q.bx, dy = q.ty - q.by, d = Math.hypot(dx, dy) || 1, v = R.range(40, 110);
        ps.spawn(R.chance(0.5) ? P.SPARK : P.FIRE, x + R.range(-3, 3), y, dx / d * v + R.range(-20, 20), dy / d * v - R.range(10, 50), R.range(0.12, 0.3), C[R.int(4, 6)], R.chance(0.3) ? 2 : 1, R.range(0, 0.08), q.front ? 0 : PF.BACK);
      }
    }
    return {
      update(dt) {
        t += dt;
        const g = G();
        if (!landed) { landed = true; impactSeed(); }
        if (!boom && g >= BURST) { boom = true; erupt(); }
        if (ground) ground.update(dt);
        // small flames licking off the pond, then off the petal edges and tips
        if (t > 0.15 && g < BURST && R.chance(16 * dt)) { const a = R.range(0, TAU), d = R.range(0, 50); ps.spawn(P.FIRE, Math.cos(a) * d, Math.sin(a) * d * 0.2 - 1, R.range(-4, 4), -R.range(18, 40), R.range(0.12, 0.22), 0, R.range(1.2, 2.2), 0, Math.sin(a) < 0 ? PF.BACK : 0); }
        if (g > BUD + 0.1 && g < BURST) for (const q of layout(g)) if (R.chance(3.2 * dt)) {
          const u = R.range(0.55, 1);
          ps.spawn(P.FIRE, q.bx + (q.tx - q.bx) * u, q.by + (q.ty - q.by) * u, R.range(-5, 5), -R.range(18, 45), R.range(0.1, 0.2), 0, R.range(1.1, 2), 0, q.front ? 0 : PF.BACK);
        }
        // the volcano throat: big tongues straight up while the column stands
        if (g > BURST && g < BURST + 0.45) for (acc += dt * 120; acc >= 1; acc--) {
          const w = R.range(-1, 1);
          ps.spawn(P.FIRE, w * 7, -4, w * 25, -R.range(260, 400), R.range(0.12, 0.2), 0, R.range(3, 6), 0, 0);
        }
        if (g > BURST + 0.4 && g < END - 0.4 && R.chance(14 * dt)) ps.spawn(P.EMBER, R.range(-40, 40), -R.range(4, 60), R.range(-10, 10), -R.range(15, 45), R.range(0.5, 0.9), C[R.int(3, 5)]);
        ps.update(dt);
        lights.update(dt);
      },
      drawBack(p) {
        if (t >= L_END) return;
        const saved = p.fade; p.fade *= 1 - smooth(L_END - 0.3, L_END - 0.02, t);
        pond(p);
        if (ground) ground.drawBack(p);
        flower(p, 'back');
        shock(p, true);
        blown(p, 'back');
        drawColored(ps, p, C, 'back');
        p.fade = saved;
      },
      draw(p) {
        if (t >= L_END) return;
        const saved = p.fade; p.fade *= 1 - smooth(L_END - 0.3, L_END - 0.02, t);
        if (ground) ground.draw(p);
        flower(p, 'front');
        column(p);
        shock(p, false);
        blown(p, 'front');
        drawColored(ps, p, C, 'front');
        lights.draw(p);
        p.fade = saved;
      },
    };

    // the lava pond: jagged dark crust, banded molten surface with turning swirls, bubbles; roots of fire; cools after the burst
    function pond(p) {
      const g = G(), cool = smooth(BURST + 0.25, BURST + 1.0, g);
      for (let i = 0; i < 3; i++) {   // the earth ripples like water as the seed sinks
        const u = clamp((t - i * 0.07) / 0.32);
        if (u > 0 && u < 1) p.polyline(Array.from({ length: 41 }, (_, k) => [Math.cos(k * TAU / 40) * (6 + 54 * u), Math.sin(k * TAU / 40) * (6 + 54 * u) * 0.2]), C[5], (1 - u) * 0.9);
      }
      const rx = 62 * out3(clamp((t - 0.06) / 0.35)), ry = rx * 0.22;
      if (rx < 2) return;
      const pal = C.map((c, i) => mix(c, COOL[Math.min(4, i)], cool));
      p.shade(-rx - 5, -ry - 3, rx + 5, ry + 3, (x, y, o) => {
        const ex = x / rx, ey = y / ry, d = Math.sqrt(ex * ex + ey * ey), ang = Math.atan2(ey, ex);
        const edge = 1 + 0.06 * Math.sin(ang * 7 + 1.3) + 0.04 * Math.sin(ang * 13);
        if (d > edge) return;
        o.a = 1;
        if (d > edge - 0.16) { o.c = d > edge - 0.07 ? COOL[0] : mix(pal[1], COOL[1], 0.5); return; }   // crust lip
        const swirl = 0.16 * Math.sin(ang * 3 + d * 9 - g * 2.4) + 0.08 * Math.sin(ang * 7 - d * 14 + g * 4);
        const heat = 1 - d + swirl;
        o.c = pal[heat < 0.3 ? 1 : heat < 0.52 ? 2 : heat < 0.72 ? 3 : heat < 0.88 ? 4 : 5];
        if (cool > 0.4 && Math.abs(Math.sin(ang * 5 + d * 6)) < 0.08) o.c = COOL[cool < 0.8 ? 4 : 3];   // cracks in the crust
      });
      if (cool < 0.6) for (const b of bubbles) {   // bubbles swell and pop
        const ph = ((g / b.per) + b.ph) % 1, bx = Math.cos(b.a) * b.d * rx, by = Math.sin(b.a) * b.d * ry;
        if (ph < 0.8) p.circle(bx, by - 0.5, 0.5 + ph * 2, C[5], 0.9 * (1 - cool));
        else p.dot(bx, by - 2, C[6], 1 - cool);
      }
      const rk = smooth(0.1, 0.5, t) * (1 - smooth(BURST + 0.6, BURST + 1.1, g));
      for (const r of roots) {   // fire roots creeping out under the floor
        const grow = smooth(0.1, 0.55, t), pts = r.pts.filter(([, s]) => s <= grow).map(([a, s]) => { const d = rx + r.len * s; return [Math.cos(a) * d, Math.sin(a) * d * 0.22]; });
        if (pts.length > 1) { p.polyline(pts.map(([x, y]) => [x, y + 1]), C[1], rk); p.polyline(pts, cool < 0.5 ? C[4] : COOL[3], rk); }
      }
      if (cool < 0.7) p.glow(0, -2, rx * 0.8, C[3], 0.12 * (1 - cool));
    }
    function flower(p, layer) {
      const g = G();
      if (g < BUD || g >= BURST + (V2 ? 0 : MELT)) return;
      const crack = smooth(FULL, BURST, g), all = layout(Math.min(g, BURST - 0.001)).filter((q) => q.front === (layer === 'front'));
      all.sort((a, b) => layer === 'front' ? b.ring - a.ring : a.ring - b.ring);
      if (!V2 && layer === 'back') p.glow(0, -18, 46, C[3], 0.08 * smooth(BUD, OPEN, g));
      const melt = clamp((g - BURST) / MELT);
      for (const q of all) {
        if (V2) petalFire(p, C, q.bx, q.by, q.tx, q.ty, q.W, g, q.ring * 7 + q.i, { dim: q.front ? 0 : 0.18, crack: crack * 0.9 });
        else lotusPetal(p, C, q.bx, q.by, q.tx, q.ty, q.W, g, q.ring * 7 + q.i, { dim: (q.front ? 0 : 0.7) + q.ring * -0.15 + 0.15, side: Math.cos(q.a) >= 0 ? -1 : 1, style: STYLE, melt });
      }
      if (g >= BURST) return;
      if (layer === 'back' && g > OPEN) {   // the seed pod, its holes glowing brighter before the burst
        const k = smooth(OPEN, OPEN + 0.2, g), hot = 0.3 + 0.7 * crack;
        p.ellipse(0, -9, 9, 3, C[2], k);
        p.ellipse(0, -10, 8, 2.2, C[3], k);
        for (let i = 0; i < 7; i++) { const a = i * TAU / 7; p.dot(Math.cos(a) * 5, -10 + Math.sin(a) * 1.4, i % 2 ? C[6] : C[5], k * hot); }
        if (crack > 0) p.glow(0, -12, 16, C[5], 0.35 * crack);
      }
    }
    // the volcano column: wavy flame edges, hard bands, rising flicker; it lifts off the ground and thins away
    function column(p) {
      const τ = G() - BURST;
      if (τ < 0 || τ > 1.1) return;
      const top = -230 * out3(clamp(τ / 0.16)), w0 = 15 * (1 - smooth(0.3, 0.95, τ)), bot = -2 - 210 * smooth(0.4, 1.0, τ);
      if (w0 < 0.6 || bot <= top) return;
      p.shade(-w0 * 1.3 - 2, top, w0 * 1.3 + 2, bot, (x, y, o) => {
        const h = clamp((bot - y) / Math.max(1, bot - top)), wave = 1 + 0.12 * Math.sin(y * 0.09 + τ * 30) + 0.1 * Math.sin(y * 0.31 - τ * 47 + x * 0.2);
        const w = w0 * (1 - 0.55 * h) * wave, r = Math.abs(x) / Math.max(0.5, w);
        if (r > 1) return;
        const heat = (1 - r * r) + 0.16 * Math.sin(y * 0.13 + x * 0.55 + τ * 40) * Math.sin(y * 0.06 - τ * 23 + x * 0.2) - 0.25 * h;
        o.c = C[r > 0.85 ? 1 : heat < 0.2 ? 2 : heat < 0.45 ? 3 : heat < 0.68 ? 4 : heat < 0.88 ? 5 : 6];
        o.a = 1;
      });
    }
    function shock(p, back) {
      const τ = G() - BURST;
      if (τ <= 0 || τ > 0.7) return;
      const u = τ / 0.7, r = 18 + 230 * out3(u), keep = (a) => (Math.sin(a) < 0) === back;
      band(p, 0, 0, r, 0.2, 2 + 6 * (1 - u), (1 - u) * 0.9, [C[1], C[3], C[5], WHITE], keep);
    }
    // petals torn off by the blast, tumbling, burning and cooling as they fall
    function blown(p, layer) {
      const τ = G() - BURST;
      if (!V2 || τ < 0 || τ > 1.15) return;
      const fade = 1 - smooth(0.55, 0.85, τ);
      if (fade <= 0) return;
      for (const q of layout(BURST - 0.001)) {
        if (q.front !== (layer === 'front')) continue;
        const d = (130 - 25 * q.ring) * (1 - Math.exp(-3 * τ)), sign = Math.cos(q.a) < 0 ? -1 : 1;
        const ox = Math.cos(q.a) * d, oy = Math.sin(q.a) * d * 0.3 - (70 - q.ring * 10) * τ + 170 * τ * τ;
        const L = Math.hypot(q.tx - q.bx, q.ty - q.by) * 0.72, ang = Math.atan2(q.ty - q.by, q.tx - q.bx) + sign * τ * (5 + q.ring);
        const bx = q.bx + ox, by = Math.min(-2, q.by + oy);
        petalFire(p, C, bx, by, bx + Math.cos(ang) * L, by + Math.sin(ang) * L, q.W * 0.8, G(), q.ring * 7 + q.i, { k: fade, dim: -0.1, cool: smooth(0, 0.3, τ) });
      }
    }
  },
};

export function create(o) {
  const common = { palette: o.palette ?? RAMP, petal: o.petal ?? 'A' };
  return chain([
    { fx: hurl, t: 0, until: LAND + 0.3, ...common },
    { fx: bloom, t: LAND, x: TX, ...common },
  ])(o);
}
