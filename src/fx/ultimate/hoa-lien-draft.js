// DRAFT (motion blocking) for Phat No Hoa Lien v3. Shapes are deliberately simple: this file exists to judge
// trajectories and timing only. The approved lotus look is reused as-is from _lotus-lib.
//
// Beats (seconds):
//   0.00 - 1.55  GATHER  five qi streams rise from the ground and spiral AROUND the caster (behind/in front),
//                        tightening and climbing until they meet above the head
//   1.30 - 2.10  BLOOM   the streams fold into the lotus above the head
//   2.10 - 2.95  RISE    the lotus climbs high (slow start, gaining speed, then easing to the apex)
//   2.95 - 3.20  HANG    hold at the apex: it compresses and shakes (anticipation)
//   3.20 - 3.40  DIVE    it falls almost instantly onto the target point
//   3.40 ...     IMPACT  flash; the lotus loses its shape, unwinds into five streams that wrap into each other and
//                        shoot up as a pillar; dust, smoke and rocks race outward as a far-reaching shock wave
import { fit, smooth, clamp, TAU, WHITE, Rng, READY } from '../../core/index.js';
import { FLAMES, lotus } from './_lotus-lib.js';
import { STONE } from './_lib.js';

const GOLD5 = ['#2a1805', '#6e4a08', '#b8860f', '#e9c12c', '#ffe27a', '#fff5c4', '#ffffff'];
const C5 = [...FLAMES, GOLD5].map(r => fit(r, 7));
const DIRT = fit(STONE, 5), SMOKE = fit(['#1b1820', '#2e2a33', '#47414a', '#6a6268', '#8f8687'], 5);

const G1 = 1.55, B0 = 1.3, B1 = 2.1, R1 = 2.95, H1 = 3.2, TI = 3.4, END = TI + 3.4;
const HEAD = [0, -64], APEX = [36, -262], TX = 168;
const ease = (u) => u * u * (3 - 2 * u);

export const meta = {
  name: 'Hoa Lien Draft',
  desc: 'Motion draft: qi streams spiral round the caster into a lotus overhead, it soars, then slams down and unwinds into a five-colour pillar with a far-reaching shock wave.',
  tags: ['ultimate', 'draft', 'lotus', 'move', 'one-shot'],
  size: [480, 380], origin: [88, 342], duration: END, loop: false, fps: 30, bg: 'ground', actor: 2,
  options: { seed: 17 },
};

export const act = {
  target: { x: TX },
  poses: [
    [0, { ...READY, crouch: 2, fx: 8, fy: -22, bx: -6, by: -22 }],
    [0.8, { ...READY, crouch: 4, fx: 12, fy: -30, bx: -10, by: -30 }],
    [B0, { ...READY, crouch: 1, fx: 4, fy: -44, bx: -2, by: -44, hy: -1 }],
    [R1, { ...READY, crouch: 0, fx: 6, fy: -46, bx: 0, by: -46, hy: -1, lean: -3 }],
    [H1, { ...READY, crouch: 2, fx: 10, fy: -46, bx: 2, by: -46, lean: -4 }],
    [TI - 0.05, { ...READY, x: 6, crouch: 5, lean: 6, fx: 20, fy: -24, bx: 4, by: -28 }, 'snap'],
    [TI + 0.1, { ...READY, x: 2, crouch: 7, lean: -5, fx: -4, fy: -34, bx: 8, by: -34 }, 'snap'],
    [TI + 1.4, { ...READY, crouch: 4, fx: -2, fy: -30, bx: 6, by: -30 }],
    [END, { ...READY,}],
  ],
  hits: [
    { t: TI, stop: 0.12, shake: 0.7, amp: 6, push: 5, flash: 0.15 },
    { t: TI + 2.6, push: 0, flash: 0 },
  ],
};

// ---------- gather: a stream head is a point on a tightening, climbing orbit round the caster ----------
function orbit(j, t) {
  const t0 = j * 0.1, u = clamp((t - t0) / (G1 - t0));
  const a = j * TAU / 5 + u * TAU * 2.4;              // 2.4 turns round the body
  const r = 58 * (1 - ease(u)) ** 1.3 + 4 * (1 - u);  // wide at the ground, nothing at the meeting point
  const y = -4 + (HEAD[1] + 4) * (0.55 * u + 0.45 * ease(u)); // climbs steadily from the feet past the head
  return { x: HEAD[0] + Math.cos(a) * r, y: y + Math.sin(a) * r * 0.28, front: Math.sin(a) > 0, u };
}
function gather(p, t, layer) {
  if (t > B1) return;
  const fade = 1 - smooth(B0 + 0.2, B1, t);
  for (let j = 0; j < 5; j++) {
    const C = C5[j], N = 26;
    let prev = null;
    for (let i = 0; i < N; i++) {
      const s = orbit(j, t - i * 0.02);
      if (s.u <= 0) break;
      const k = fade * (1 - i / N) * smooth(0, 0.15, s.u);
      if (prev && (s.front === (layer === 'front'))) {
        const c = i < 4 ? C[5] : i < 12 ? C[4] : C[3];
        p.line(prev.x, prev.y, s.x, s.y, c, k);
        p.line(prev.x, prev.y - 1, s.x, s.y - 1, C[3], k * 0.6);
        if (i % 5 === 0) p.glow(s.x, s.y, 5, C[4], 0.22 * k);
      }
      prev = s;
    }
  }
}

// ---------- lotus path: above the head -> apex -> target ----------
function lotusAt(t) {
  if (t < B1) return { x: HEAD[0], y: HEAD[1] - 6, s: 0.1 + 0.8 * smooth(B0, B1, t), shake: 0 };
  if (t < R1) {
    const u = (t - B1) / (R1 - B1), e = u < 0.6 ? 0.5 * (u / 0.6) ** 2 : 0.5 + 0.5 * ease((u - 0.6) / 0.4);
    return { x: HEAD[0] + (APEX[0] - HEAD[0]) * e, y: HEAD[1] - 6 + (APEX[1] - HEAD[1] + 6) * e, s: 0.9 - 0.15 * e, shake: 0 };
  }
  if (t < H1) {
    const u = (t - R1) / (H1 - R1);
    return { x: APEX[0], y: APEX[1] - 6 * Math.sin(u * Math.PI / 2), s: 0.75 - 0.2 * u, shake: u };
  }
  const u = clamp((t - H1) / (TI - H1)), e = u ** 2.2;
  return { x: APEX[0] + (TX - APEX[0]) * e, y: APEX[1] - 6 + (-14 - APEX[1] + 6) * e, s: 0.55 - 0.1 * u, shake: 1 };
}
function drawLotus(p, t, o) {
  if (t < B0 || t >= TI) return;
  const L = lotusAt(t);
  // trail: five thin coloured wakes behind the flower while it moves
  if (t > B1) {
    for (let j = 0; j < 5; j++) {
      const pts = [];
      for (let i = 0; i < 14; i++) {
        const q = lotusAt(t - i * (t > H1 ? 0.012 : 0.03));
        pts.push([q.x + (j - 2) * 3 * q.s, q.y + 6]);
      }
      p.polyline(pts, (v) => C5[j][v < 0.3 ? 5 : 3], (v) => (1 - v) * 0.85);
    }
  }
  lotus(p, t, C5, { x: L.x, y: L.y, size: L.s, instability: L.shake, halo: t < R1, seed: o.seed });
  if (t > R1 && t < H1) p.glow(L.x, L.y - 5, 30, WHITE, 0.25 * smooth(R1, H1, t));
}

// ---------- impact ----------
function rocks(seed) {
  const R = new Rng(seed + 99);
  return Array.from({ length: 46 }, () => {
    const side = R.chance(0.5) ? 1 : -1, big = R.chance(0.3);
    return { x: R.range(-14, 14), vx: side * R.range(60, 330), vy: -R.range(90, 300), d: R.range(0, 0.12),
      w: big ? R.int(3, 5) : R.int(1, 2) };
  });
}
let ROCKS = null;
function impact(p, t, o, layer) {
  const τ = t - TI;
  if (τ < 0) return;
  const W = 480, x0 = -88;
  // flash: white, then a dark negative frame
  if (τ < 0.034) { if (layer === 'front') p.rect(x0, -342, W, 380, WHITE, 0.85); return; }
  if (τ < 0.1 && layer === 'front') p.rect(x0, -342, W, 380, fit(['#0a0610'], 1)[0], 0.55);

  // low smoke haze that lingers and drifts out
  if (layer === 'back') {
    const k = smooth(0.15, 0.6, τ) * (1 - smooth(2.4, 3.4, τ));
    for (let i = 0; i < 22; i++) {
      const s = i % 2 ? 1 : -1, d = 20 + i * 11 + τ * 26;
      p.disc(TX + s * d, -10 - (i % 3) * 7 - τ * 4, 16 + (i % 4) * 4, SMOKE[2 + (i % 2)], 0.35 * k);
    }
  }

  // ground fireball: five coloured lobes that bloom then sink (kept separate, no muddy mix)
  if (layer === 'front') {
    const b = smooth(0, 0.18, τ) * (1 - smooth(0.35, 0.9, τ));
    for (let j = 0; j < 5; j++) {
      const a = j * TAU / 5 + τ * 3, r = 26 + 22 * smooth(0, 0.3, τ);
      p.disc(TX + Math.cos(a) * r * 0.5, -18 + Math.sin(a) * r * 0.3 - 10 * smooth(0, 0.3, τ), r * 0.75, C5[j][4], 0.6 * b);
      p.glow(TX + Math.cos(a) * r * 0.5, -18, r, C5[j][3], 0.18 * b);
    }
    p.disc(TX, -16, 8 * b, WHITE, b);
  }

  // pillar: the five streams first fan out wide, then wrap into one twisting column that shoots to the sky
  const grow = smooth(0.04, 0.42, τ), top = -14 - 340 * grow;
  const life = 1 - smooth(1.9, 2.8, τ), bottomCut = -14 - 300 * smooth(2.0, 2.9, τ);
  if (life > 0) {
    const wrap = smooth(0.0, 0.5, τ);
    for (let j = 0; j < 5; j++) {
      const C = C5[j];
      let prev = null;
      for (let y = -14; y >= top; y -= 3) {
        const h = (-14 - y) / 340;
        const r = (6 + 36 * (1 - wrap) * (1 - h) + 4 * h) * (1 + 0.15 * Math.sin(y * 0.1 + τ * 9));
        const a = j * TAU / 5 + y * 0.045 - τ * 14;
        const x = TX + Math.cos(a) * r, front = Math.sin(a) > 0;
        const k = life * (y > bottomCut ? 0.25 : 1) * (0.55 + 0.45 * (1 - h));
        if (prev && front === (layer === 'front')) {
          p.line(prev[0], prev[1], x, y, C[front ? 5 : 3], k);
          p.line(prev[0] + 1, prev[1], x + 1, y, C[front ? 4 : 2], k);
        }
        prev = [x, y];
      }
    }
    if (layer === 'front') {
      p.glowLine(TX, -14, TX, top, 10, WHITE, 0.3 * life * grow);
      p.line(TX, Math.min(-14, bottomCut), TX, top, WHITE, 0.8 * life);
    }
  }

  // shock wave: a ground ring and a dust wall racing outward far past the frame edges, rocks thrown wide
  if (layer === 'front') {
    const R = 420 * (1 - (1 - clamp(τ / 1.1)) ** 3), k = 1 - smooth(0.6, 1.4, τ);
    const oval = (rx, ry, c, a) => p.polyline(Array.from({ length: 65 }, (_, i) =>
      [TX + Math.cos(i * TAU / 64) * rx, -2 + Math.sin(i * TAU / 64) * ry]), c, a);
    oval(R, R * 0.1, SMOKE[4], 0.6 * k);
    oval(R * 0.93, R * 0.093, C5[3][4], 0.45 * k);
    for (const s of [-1, 1]) {
      for (let i = 0; i < 9; i++) {
        const d = R - i * 9, h = (26 - i * 2) * (1 - 0.5 * smooth(0.4, 1.4, τ));
        if (d < 10) continue;
        p.disc(TX + s * d, -h * 0.45, h * 0.55, DIRT[2 + (i % 2)], 0.6 * k * (1 - i / 10));
      }
    }
    // air ripple above the ground
    p.ring(TX, -14, R * 0.75, 1, WHITE, 0.18 * k);
    ROCKS = ROCKS || rocks(o.seed);
    for (const r of ROCKS) {
      const s = τ - r.d;
      if (s <= 0 || s > 2.6) continue;
      let x = TX + r.x + r.vx * s, y = -10 + r.vy * s + 420 * s * s;
      if (y > 0) y = 0;
      p.rect(x, y - r.w, r.w, r.w, DIRT[y === 0 ? 2 : 4], 1 - smooth(1.8, 2.6, s));
    }
  }
}

export function drawBack(p, t, o) {
  gather(p, t, 'back');
  impact(p, t, o, 'back');
}
export function draw(p, t, o) {
  gather(p, t, 'front');
  drawLotus(p, t, o);
  impact(p, t, o, 'front');
}
