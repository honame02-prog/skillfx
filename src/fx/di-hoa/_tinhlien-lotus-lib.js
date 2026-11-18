// Tinh Lien shape library (Opus): the white flame-lotus.
// A real lotus (Nelumbo) petal — elliptic, widest above the middle, BLUNT rounded tip, cupped — made of white fire:
// the outline breathes with slow waves that travel up the petal (a candle flame, never a spike), the tip melts into one
// soft curling wisp, the body is white-hot over a warm gold root, the rim a pale gold line. No dark outline, no hard
// bands: steps blend with a 4x4 ordered dither. Everything is a pure function of (t, seed).
import { smooth, clamp } from '../../core/index.js';
import { L } from './_tinhlien-common.js';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
// white-fire ramp: 0 deep gold .. 6 white (the shared L palette without its brown)
const R = [L[1], L[2], L[3], L[4], L[5], L[6], L[6]];
const tone = (x, sx, sy) => {
  x = clamp(x, 0, 6);
  const i = Math.floor(x), f = clamp((x - i - 0.5) * 2.2 + 0.5);
  return R[Math.min(6, f > BAYER[(sy & 3) * 4 + (sx & 3)] ? i + 1 : i)];
};

/**
 * One flame petal from its root (bx,by) toward (tx,ty), half-width W at the widest.
 * o: k (0..1 presence), dim (back petals, 0..1.5), side (+1/-1: which rim shows the cup), wisp (0..1 tip flame),
 *    heat (0..1: whole petal pushed toward white, used when the lotus is compressed), sway (tip flame lean, px).
 */
export function flamePetal(p, bx, by, tx, ty, W, t, seed, o = {}) {
  const { k = 1, dim = 0, side = 1, wisp = 1, heat = 0, sway = 0 } = o;
  const dx = tx - bx, dy = ty - by, Ln = Math.hypot(dx, dy);
  if (Ln < 2 || k <= 0) return;
  const ux = dx / Ln, uy = dy / Ln, nx = -uy, ny = ux;
  const M = 0.55, WH = 5 + Ln * 0.13;   // widest point; wisp height (short: a flame bead, not a spike)
  // half-width along the petal: round shoulder, blunt rounded tip (cos cap, not a power spike)
  const hw = (u) => u < M ? W * (0.2 + 0.8 * Math.sqrt(1 - ((M - u) / M) ** 2)) : W * Math.sqrt(Math.max(0, 1 - ((u - M) / (1 - M)) ** 2)) * (0.35 + 0.65 * Math.cos((u - M) / (1 - M) * 1.2));
  const pad = W * 1.4 + 6, x0 = Math.min(bx, tx) - pad, x1 = Math.max(bx, tx) + pad, y0 = Math.min(by, ty) - pad - WH, y1 = Math.max(by, ty) + pad;
  const ph = seed * 1.7;
  p.shade(x0, y0, x1, y1, (x, y, out) => {
    const ex = x - bx, ey = y - by, u = (ex * ux + ey * uy) / Ln;
    let v = (ex * nx + ey * ny) * side;
    if (u < -0.02) return;
    // tip wisp: a soft tongue continuing the petal's centre line, curling with the sway, tapering smoothly
    if (u > 0.93) {
      if (wisp <= 0) return;
      const f = (u - 0.93) * Ln / (WH * wisp * (0.8 + 0.2 * Math.sin(t * 11 + ph)));
      if (f > 1) return;
      const c = sway * f * f + 1.2 * Math.sin(t * 8 + f * 3 + ph) * f;
      const w = W * 0.42 * Math.sqrt(Math.max(0, 1 - f * f)) * (1 - 0.35 * f) + 0.4;   // round-topped, like a candle flame
      if (Math.abs(v - c) > w) return;
      out.c = tone(4.6 - f * 1.6 + heat, x, y); out.a = k; out.l = L[6]; out.k = 0.12 * k * (1 - f);
      return;
    }
    // breathing outline: two slow waves travelling root -> tip, stronger toward the tip; the two rims out of phase
    const breathe = 1 + (0.07 * Math.sin(u * 5.5 - t * 6.5 + ph + (v > 0 ? 0 : 1.9)) + 0.04 * Math.sin(u * 11 - t * 10 + ph * 2)) * smooth(0.15, 0.8, u);
    const w = Math.max(0.6, hw(Math.max(0, u)) * breathe), s = v / w, as = Math.abs(s);
    if (as > 1) return;
    // rim: one pale-gold pixel line, a little deeper on the shadow side; root stays warm
    const edge = (1 - as) * w;
    if (edge < 1 && u > 0.05) { out.c = R[clamp(Math.round((s < 0 ? 0.6 : 1.6) - dim * 0.4 + heat * 2.5), 0, 6)]; out.a = k; return; }
    // cup: the inner face shows as a lit crescent along one rim, widening toward the tip; a soft fold line under it
    const lip = 1 - 0.4 * smooth(0.25, 0.95, u), inner = s > lip;
    // white fire: gold root -> white body -> white tip; edges a touch warmer; flames flow up as soft bands
    const flow = 0.35 * Math.sin(u * 8 - t * 9 + ph + s * 1.3) * Math.sin(s * 2.4 + t * 2.1 + ph);
    // body sits on cream (3..4), only the cup's inner face and the hot core reach white; root and edges warm gold
    let b = 1.6 + 2.1 * smooth(0, 0.45, u) - 1.2 * as ** 2.5 + 0.6 * (1 - as) * smooth(0.3, 0.7, u) + flow - dim * 1.2 + heat * 2.8;
    if (inner) b = 4.9 - 0.5 * smooth(0.5, 1, u) - dim * 0.6 + heat;
    else if (s > lip - 0.14 && u > 0.3) b -= 1.1;
    // veins: three fine lines meeting at root and tip, a half step warmer
    const vs = s / (inner ? 1 : lip);
    if (!inner && u > 0.1 && u < 0.86 && Math.abs(Math.sin(vs * Math.PI * 1.5)) < 0.13) b -= 0.6;
    out.c = tone(b, x, y); out.a = k;
    if (u > 0.2) { out.l = L[6]; out.k = 0.06 * k * (1 - as); }   // a breath of glow from inside
  });
}

// three rings round the seed pod (6 outer, 5 middle, 3 bud), seen a little from the side. Units at size 1 ~ 46 px tall.
const RINGS = [
  { n: 6, len: 25, W: 7.2, spread: 1.4, lift: 0.42, dim: 1.1 },
  { n: 5, len: 27, W: 6.8, spread: 0.85, lift: 0.62, dim: 0.55 },
  { n: 3, len: 22, W: 6.4, spread: 0.34, lift: 0.86, dim: 0 },
];
/**
 * The whole lotus at (cx, cy) = root of the flower (petals rise from here), scaled by size.
 * o: open (0 bud .. 1 bloom), crush (0..1: petals close in, flower shrinks, everything goes white-hot),
 *    k (presence), layer ('back' draws the far half of each ring, 'front' the near half; omit for both).
 */
export function flameLotus(p, cx, cy, size, t, o = {}) {
  const { open = 1, crush = 0, k = 1, layer, seed = 0 } = o;
  if (size <= 0 || k <= 0) return;
  const sz = size * (1 - 0.45 * crush) * (1 + 0.05 * Math.sin(t * 3.1 + seed));   // slow breath
  const lean = 0.08 * Math.sin(t * 1.7 + seed);                                      // the whole flower sways
  const opn = open * (1 - 0.75 * crush);
  RINGS.forEach((ring, ri) => {
    for (let j = 0; j < ring.n; j++) {
      // fan angle from vertical; outer ring spreads widest. Even counts straddle the centre.
      const a0 = ((j + 0.5) / ring.n - 0.5) * 2 * ring.spread * (0.35 + 0.65 * opn) + lean;
      const wob = 0.07 * Math.sin(t * (2.3 + j * 0.37) + ri * 2 + j * 1.3 + seed);       // each petal its own phase
      const a = a0 + wob;
      const far = Math.cos(((j + 0.5) / ring.n) * Math.PI * 2 + ri) > 0;                 // half the ring is behind
      if (layer === 'back' && !far && ri < 2) continue;
      if (layer === 'front' && (far && ri < 2)) continue;
      const len = ring.len * sz * (0.92 + 0.08 * Math.sin(t * 4 + j * 2.1 + ri));
      const bx = cx + Math.sin(a) * 3 * sz * (1 - ri * 0.3), by = cy - ring.lift * 4 * sz;
      const tx = bx + Math.sin(a) * len, ty = by - Math.cos(a) * len * (0.8 + 0.2 * ring.lift);
      flamePetal(p, bx, by, tx, ty, ring.W * sz, t, seed + ri * 7 + j * 3.1, {
        k, dim: ring.dim * (far ? 1.2 : 0.7) * (1 - crush), side: a >= 0 ? 1 : -1,
        wisp: 0.6 + 0.4 * opn, heat: crush, sway: -Math.sin(a) * 4 * sz,
      });
    }
  });
  // seed pod glow at the heart: warm gold, never a hard disc
  if (layer !== 'back') p.glow(cx, cy - 6 * sz, 7 * sz * (1 + crush), L[4], 0.35 * k * (0.6 + crush));
}
