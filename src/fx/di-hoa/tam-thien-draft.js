// DRAFT v2 (motion + shape blocking) — Di Hoa 4: Tam Thien Diem Viem Hoa. Script: design/di-hoa/04-tam-thien-diem-viem-hoa.md (v2).
// The sky catches black fire; fire rains down, thicker and closing on the target; the rain is drawn into a sphere of
// black fire round the target, every drop becoming a star that ricochets inside; then it all dies away quietly.
// "Black fire": near-black core, bright violet-pink edge.
import { smooth, clamp, TAU, WHITE, READY, hex } from '../../core/index.js';

const C = ['#0a0610', '#1e0f2e', '#5a2a8c', '#9b4dd6', '#e07af0', '#f6d6ff', '#ffffff'].map(hex);
const TX = 150, END = 5.0, IGNITE = 0.1, RAIN = 0.9, ORB = 2.3, STARS = 2.7, FADE = 3.9;
const R = 70, SC = [TX, -R - 1], SKY = -232;   // sphere radius / centre; top of the canvas
const sm = (u) => u * u * (3 - 2 * u), out3 = (u) => 1 - (1 - u) ** 3;
const hsh = (i, s = 0) => { const h = Math.sin(i * 91.7 + s * 47.3) * 43758.5453; return h - Math.floor(h); };
export const meta = {
  name: 'Tam Thien Draft',
  desc: 'Motion draft v2: the sky catches black fire, fire rains onto the target, gathers into a sphere where stars ricochet, then fades away.',
  tags: ['di-hoa', 'draft', 'fire', 'star', 'one-shot'],
  size: [360, 260], origin: [60, 235], duration: END, loop: false, fps: 30, bg: 'ground', actor: 2,
  options: { seed: 5 },
};
const UP = { ...READY, crouch: 0, lean: -2, fx: 9, fy: -40, bx: 8, by: -39 };
const SWEEP = { ...READY, crouch: 6, lean: 7, fx: 21, fy: -14, bx: -6, by: -19 };
const CLENCH = { ...READY, crouch: 4, fx: 14, fy: -30, bx: 8, by: -28, armsFront: true };
// rain hits: ticks speeding up; star hits: dense ticks
const ticks = [];
for (let t = 1.25, g = 0.16; t < ORB; t += g, g = Math.max(0.07, g * 0.9)) ticks.push({ t, shake: 0.08, amp: 1, push: 0.15, straw: 2, flash: 0 });
for (let t = STARS + 0.1, g = 0.11; t < FADE - 0.2; t += g, g = Math.max(0.045, g * 0.92)) ticks.push({ t, shake: 0.06, amp: 1, push: 0.08, straw: 1, flash: 0 });
ticks.push({ t: FADE - 0.12, stop: 0.1, shake: 0.5, amp: 4, push: 1.5, straw: 20, flash: 0.06 });
export const act = {
  target: { x: TX },
  poses: [[-0.2, READY], [0.35, UP], [RAIN - 0.03, UP], [RAIN + 0.04, SWEEP, 'snap'], [ORB - 0.08, { ...SWEEP, crouch: 5 }], [ORB, CLENCH, 'snap'],
    [FADE, { ...CLENCH, crouch: 5 }], [FADE + 0.5, { ...READY, crouch: 2, fx: 12, fy: -26, bx: 6, by: -24 }], [END, READY]],
  hits: [
    { t: RAIN + 0.03, stop: 0.03, shake: 0.08, amp: 1, target: false },
    ...ticks,
    { t: ORB + 0.1, stop: 0.08, shake: 0.3, amp: 2.5, push: 0.6, straw: 8, flash: 0.05, skin: 'shadow' },
    { t: END - 0.35, push: 0, straw: 0, skin: null },
  ],
};

// ---------------------------------------------------------------- the burning sky: an upside-down SEA of fire
// Three rolling layers (far, mid, near), each a row of billowing lobes hanging down with bright rims, rolling sideways
// at its own speed (far slow, near fast, alternating direction); the near layer licks tongues of fire downward.
const XC = 120;   // middle of the canvas, local
const LAYERS = [
  { base: 24, lobe: 30, h: 16, v: 9, dim: 2 },     // far: high, small lobes, darker
  { base: 46, lobe: 44, h: 22, v: -16, dim: 1 },   // mid
  { base: 66, lobe: 58, h: 30, v: 26, dim: 0 },    // near: low, big rolling crests, brightest
];
function lobeAt(x, L, t, ph) {   // rounded billows: each lobe a half-ellipse hanging down
  const X = x + t * L.v + ph, f = X / L.lobe + 0.35 * Math.sin(X * 0.013), u = f - Math.floor(f) - 0.5, j = Math.floor(f);
  const size = 0.45 + 0.75 * hsh(j, 13 + ph), skew = (hsh(j, 21) - 0.5) * 0.6;
  const billow = L.h * size * Math.pow(Math.max(0, 1 - 4 * (u - skew * (0.5 - Math.abs(u))) ** 2), 0.7);
  // flame tongues licking off the billows: sharp, flickering, two frequencies
  const lick = Math.pow(Math.max(0, Math.sin(x * 0.19 + t * 5 + ph)), 3) * (4 + L.h * 0.3) * (0.6 + 0.4 * Math.sin(t * 7 + x * 0.05 + ph)) + Math.pow(Math.max(0, Math.sin(x * 0.31 - t * 8 + ph * 2)), 4) * (2 + L.h * 0.15);
  return billow + lick * (0.4 + 0.6 * size);
}
function sky(p, t) {
  const spread = out3(clamp((t - IGNITE) / 0.8)), drain = smooth(ORB, ORB + 0.6, t), k = 1 - smooth(FADE - 0.3, FADE + 0.3, t);
  if (spread <= 0 || k <= 0) return;
  const E = LAYERS.map((L, li) => {   // lower edge of each layer, per column
    const e = new Float32Array(362);
    for (let i = 0; i < 362; i++) {
      const x = i - 60.5, grow = smooth(0, 1, (spread - Math.abs(x - XC) / 200 + 0.15) * 3);
      e[i] = (L.base + lobeAt(x, L, t, li * 17) + 4 * Math.sin(x * 0.05 + t * 1.3 + li)) * grow * (1 - drain);
      if (li === 2) e[i] += 18 * Math.pow(Math.max(0, Math.sin(x * 0.23 - t * 6)), 8) * grow * (1 - drain);   // tongues licking down
    }
    return e;
  });
  let maxD = 0; for (const v of E[2]) maxD = Math.max(maxD, v); for (const v of E[1]) maxD = Math.max(maxD, v);
  p.shade(-60, SKY, 300, SKY + maxD + 2, (x, y, o) => {
    const d = y - SKY, sway = 3.5 * Math.sin(d * 0.13 + t * 6 + x * 0.02) + 1.5 * Math.sin(d * 0.31 - t * 9);   // tongues bend and sway
    const i = Math.max(0, Math.min(361, Math.round(x + 60.5 + sway)));
    // the lowest layer that still covers this pixel is the one in front
    let li = -1;
    for (let l = 2; l >= 0; l--) if (d <= E[l][i] && (l === 0 || d > E[l - 1][i])) { li = l; break; }
    if (li < 0) return;
    const L = LAYERS[li], e = E[li][i] - d;   // depth inside the layer from its lower edge
    const roll = Math.sin(x * 0.07 + L.v * t * 0.08 + 2 * Math.sin(d * 0.18 - t * 2.5 + li)) * Math.sin(d * 0.21 - x * 0.04 + t * 1.9 + li * 2);
    // burning: bright rim, a hot band behind it, then rolling bright patches in a dark-violet body (not black)
    const heat = roll + 0.5 * Math.sin(x * 0.11 - d * 0.09 + t * 3.3 + li) - e * 0.012;
    let c = e < 1.2 ? 5 : e < 4 ? 4 : e < 9 ? 3 : heat > 0.75 ? 4 : heat > 0.3 ? 3 : heat > -0.3 ? 2 : 1;
    c = Math.max(0, c - L.dim);
    o.c = C[c]; o.a = k;
  });
  // embers dripping from the sea of fire
  for (let n = 0; n < 26; n++) {
    const s = ((t * 0.8 + hsh(n, 14)) % 1), x = -40 + 320 * hsh(n, 15), y = SKY + 60 + s * 90;
    if (Math.abs(x - XC) < (1 - spread) * 200) continue;
    p.dot(x, y, C[3 + (n % 3)], (1 - s) * k * (1 - drain));
  }
}

// ---------------------------------------------------------------- the rain
const N = 90;
const DROPS = Array.from({ length: N }, (_, i) => {
  const tf = RAIN + (ORB - RAIN - 0.3) * Math.sqrt((i + hsh(i, 1)) / N), focus = (tf - RAIN) / (ORB - RAIN);
  const x1 = TX + (hsh(i, 2) - 0.5) * 230 * (1 - focus * 0.88), hitsTarget = Math.abs(x1 - TX) < 10;
  return { i, tf, x0: x1 + 26, x1, y1: hitsTarget ? -14 - 44 * hsh(i, 3) : -1, hitsTarget };
});
const FALL = 0.32;
function rain(p, t) {
  if (t > ORB + 0.05) return;
  for (const d of DROPS) {
    const u = (t - d.tf) / FALL;
    if (u < 0 || u > 1) continue;
    const yTop = SKY + 60, x = d.x0 + (d.x1 - d.x0) * u, y = yTop + (d.y1 - yTop) * u * u, v = Math.max(0, u - 0.25);
    const xa = d.x0 + (d.x1 - d.x0) * v, ya = yTop + (d.y1 - yTop) * v * v;
    for (const o of [-2, 2]) p.line(xa + o * 0.4, ya, x + o * 0.8, y, C[3], 0.9);
    p.line(xa - 1, ya, x - 1, y, C[4], 0.9); p.line(xa, ya, x, y, C[0], 1); p.line(xa + 1, ya, x + 1, y, C[1], 1);
    p.disc(x, y, 2.4, C[4], 1); p.disc(x, y, 1.4, C[0], 1); p.dot(x, y - 2, C[5], 1);
  }
}
function splashes(p, t) {
  if (t > ORB + 0.4) return;
  const pull = sm(clamp((t - ORB) / 0.35));   // pools are sucked into the sphere
  for (const d of DROPS) {
    const τ = t - d.tf - FALL;
    if (τ < 0) continue;
    if (τ < 0.12) for (let j = 0; j < 4; j++) {
      const a = -Math.PI * (0.1 + 0.8 * j / 3) + (d.hitsTarget ? (j - 1.5) * 0.3 : 0), r = 3 + 9 * τ / 0.12;
      p.line(d.x1, d.y1, d.x1 + Math.cos(a) * r, d.y1 + Math.sin(a) * r * 0.8, C[4], 1 - τ / 0.12);
    }
    if (!d.hitsTarget && pull < 1) {   // a small pool of black fire where it landed
      const x = d.x1 + (SC[0] - d.x1) * pull, y = -1 + (SC[1] + 1) * pull, h = (3 + 2 * Math.sin(t * 14 + d.i)) * (1 - pull);
      p.poly([[x - 2, y], [x + 2, y], [x, y - h]], C[3], 1);
      p.dot(x, y - 1, C[0], 1);
    }
  }
}

// ---------------------------------------------------------------- the sphere and the stars inside
// star paths: simulated once (deterministic), bouncing off the inner wall; the clock slows after FADE
const M = 100, DT = 1 / 240, SIM = 3.2, RS = R - 4, CLIMAX = FADE - 0.12;
const PATHS = Array.from({ length: M }, (_, i) => {
  const a = hsh(i, 4) * TAU, r = RS * Math.sqrt(hsh(i, 5)) * 0.8;
  let x = Math.cos(a) * r, y = Math.sin(a) * r;
  const sp = 200 + 150 * hsh(i, 6), b = hsh(i, 7) * TAU;
  let vx = Math.cos(b) * sp, vy = Math.sin(b) * sp;
  const pts = [], bounces = [];
  for (let s = 0; s * DT < SIM; s++) {
    x += vx * DT; y += vy * DT;
    const d = Math.hypot(x, y);
    if (d > RS) {   // reflect off the wall, a little scatter
      const nx = x / d, ny = y / d, dot = vx * nx + vy * ny;
      vx -= 2 * dot * nx; vy -= 2 * dot * ny;
      const j = (hsh(i * 31 + s, 8) - 0.5) * 0.5, c = Math.cos(j), sn = Math.sin(j);
      [vx, vy] = [vx * c - vy * sn, vx * sn + vy * c];
      x = nx * RS; y = ny * RS; bounces.push({ s, a: Math.atan2(ny, nx) });
    }
    pts.push(x, y);
  }
  return { pts, bounces, big: i % 4 === 0, born: STARS + 0.006 * i, dies: FADE + 0.15 + 0.9 * hsh(i, 9) };
});
const KACC = 1.6 / (FADE - STARS), ramp = (d) => d + 0.5 * KACC * d * d;   // the stars speed up to the climax
const clock = (t) => t < FADE ? ramp(t - STARS) : ramp(FADE - STARS) + 2.6 * (1 - Math.exp(-2.2 * (t - FADE))) / 2.2;   // then slow
const at = (P, τ) => { const s = Math.max(0, Math.min(P.pts.length / 2 - 1, Math.floor(τ / DT))); return [P.pts[s * 2], P.pts[s * 2 + 1]]; };
function sphere(p, t, layer) {
  if (t < ORB || t > END - 0.05) return;
  const form = out3(clamp((t - ORB) / 0.35)), peel = SC[1] - R + 2 * R * sm(clamp((t - FADE - 0.1) / 0.9));   // shell gone above this line
  const inten = smooth(STARS, CLIMAX, t) * (1 - smooth(CLIMAX, CLIMAX + 0.3, t)), squeeze = 1 - 0.07 * Math.exp(-(((t - CLIMAX) / 0.05) ** 2));
  const pulse = (1 + 0.05 * inten * Math.sin(t * (20 + 30 * inten))) * squeeze, Rr = R * pulse;
  // shell: back half behind the target, front half in front; it forms by sweeping round from the top
  p.shade(SC[0] - Rr - 3, SC[1] - Rr - 3, SC[0] + Rr + 3, SC[1] + Rr + 3, (x, y, o) => {
    const dx = x - SC[0], dy = y - SC[1], d = Math.hypot(dx, dy);
    if (d > Rr + 1 || y < peel || y > -0.5) return;
    const ang = (Math.atan2(dx, -dy) + TAU) % TAU;   // 0 at the top, clockwise
    const swept = !(ang > form * Math.PI && TAU - ang > form * Math.PI), e = Rr - d;
    if (!swept && e < 4) return;
    if (e < 1.5 + inten) { if (layer === 'front') { o.c = C[inten > 0.6 && Math.sin(ang * 13 - t * 40) > 0.3 ? 6 : 4]; o.a = 1; } return; }
    if (e < 4) { if (layer === 'back') { o.c = (Math.sin(ang * 9 + t * 6) > 0.4 ? C[3] : C[2]); o.a = 1; } return; }
    if (layer === 'back') { o.l = C[2 + (inten > 0.5 ? 1 : 0)]; o.k = (0.2 + 0.15 * inten) * form; }   // the inside: a violet tint over whatever is behind
  });
  if (layer !== 'front') return;
  // streams from the draining sky into the top of the sphere
  if (t < ORB + 0.5) for (let i = 0; i < 6; i++) {
    const x0 = TX + (i - 2.5) * 34, k = 1 - smooth(ORB + 0.3, ORB + 0.5, t);
    p.line(x0, SKY + 50, SC[0] + (i - 2.5) * 6, SC[1] - R, C[3], 0.8 * k);
  }
  // the stars: trail, head, flashes and cracks on the shell where they bounce; all flare white at the climax
  const flare = Math.exp(-(((t - CLIMAX) / 0.06) ** 2));
  for (const P of PATHS) {
    if (t < P.born || t > P.dies) continue;
    const τ = clock(t) - ramp(P.born - STARS) * 0.5, k = 1 - smooth(P.dies - 0.2, P.dies, t);
    if (τ < 0) continue;
    const TL = P.big ? 16 : 10;
    for (let j = TL; j >= 1; j--) { const [x, y] = at(P, τ - j * 0.006); p.dot(SC[0] + x * squeeze, SC[1] + y * squeeze, j > TL * 0.66 ? C[2] : j > TL * 0.33 ? C[3] : C[4], k); }
    const [x, y] = at(P, τ), X = SC[0] + x * squeeze, Y = SC[1] + y * squeeze;
    p.dot(X, Y, C[6], k);
    if (P.big || flare > 0.3) for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) p.dot(X + ox, Y + oy, flare > 0.3 ? C[6] : C[5], k);
    if (P.big) for (const [ox, oy] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) p.dot(X + ox, Y + oy, C[4], k * (0.6 + 0.4 * Math.sin(t * 30 + P.born * 50)));
    for (let bi = P.bounces.length - 1; bi >= 0; bi--) {
      const b = P.bounces[bi], age = τ - b.s * DT;
      if (age < 0) continue;
      if (age > 0.25) break;
      const f = 1 - age / 0.25;
      if (age < 0.1) for (let j = -3; j <= 3; j++) { const a2 = b.a + j * 0.04; p.dot(SC[0] + Math.cos(a2) * Rr, SC[1] + Math.sin(a2) * Rr, C[6], (1 - age / 0.1) * k); }
      if (P.big) {   // a crack on the shell, branching inward
        const cx = SC[0] + Math.cos(b.a) * Rr, cy = SC[1] + Math.sin(b.a) * Rr, l = 6 + 4 * hsh(b.s, 3);
        p.line(cx, cy, cx - Math.cos(b.a + 0.4) * l, cy - Math.sin(b.a + 0.4) * l, C[5], f * k);
        p.line(cx, cy, cx - Math.cos(b.a - 0.5) * l * 0.7, cy - Math.sin(b.a - 0.5) * l * 0.7, C[4], f * k);
      }
    }
  }
  if (flare > 0.05) p.glow(SC[0], SC[1], R * 0.6, C[5], 0.35 * flare);
  // the peeling edge sheds violet motes that drift up
  if (t > FADE + 0.1) for (let i = 0; i < 24; i++) {
    const s = ((t - FADE) * 0.9 + hsh(i, 10)) % 1, a = hsh(i, 11) * Math.PI, x = SC[0] + Math.cos(a) * R * (hsh(i, 12) * 2 - 1);
    p.dot(x, peel - s * 30, C[3 + (i % 3)], (1 - s) * (1 - smooth(END - 0.5, END - 0.1, t)));
  }
}

export function drawBack(p, t) {
  sky(p, t);
  sphere(p, t, 'back');
}
export function draw(p, t) {
  rain(p, t);
  splashes(p, t);
  sphere(p, t, 'front');
}
