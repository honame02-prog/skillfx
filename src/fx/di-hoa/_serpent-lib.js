// The invisible flame serpent of Di Hoa 3, Van Lac Tam Viem. Script: design/di-hoa/03-van-lac-tam-viem.md.
// Near-colourless: you see it by its rims, by refraction streaks running along the body and by flickering clear fins on
// its back; the only colour is the rose-red heart glowing through the neck.
//
// Anatomy (s = arc length from the snout, px; L = body length):
//   0..9      head: a wedge, snout to jaw hinge; one eye (rose point), jaw line; two flame crests swept back from the skull
//   9..14     neck: pinched; the HEART sits here (u ~ 0.16), with rose veins spreading a little way along the body
//   14..0.6L  body: full width, dorsal fins (clear tongues, pink tips) flicker backward; belly line
//   0.6L..L   tail: tapers to a point that frays into two thin wisps
import { clamp, smooth, hex, WHITE } from '../../core/index.js';

export const HEART = ['#140c12', '#4a1428', '#a8204a', '#ff4f7a', '#ffb3c6', '#efe9ee', '#ffffff'].map(hex);
const RIM = hex('#f4eef4'), SHADE = hex('#b9b3c4'), TINT = hex('#d8d0e0');

// Sample the spine from the head's path: walk back in time until the body length is used up. headAt(time) -> [x, y].
// Returns [{x, y, s, time}] from the snout (s = 0) to the tail; samples older than t0 (not yet launched) are dropped.
export function spine(headAt, t, L, t0 = -Infinity, dt = 0.004) {
  const out = [];
  let [px, py] = headAt(t), s = 0;
  out.push({ x: px, y: py, s: 0, time: t });
  for (let tt = t - dt; s < L && tt > t0; tt -= dt) {
    const [x, y] = headAt(tt), d = Math.hypot(x - px, y - py);
    if (d < 0.8) continue;
    s += d; out.push({ x, y, s: Math.min(s, L), time: tt }); px = x; py = y;
  }
  return out;
}
// half-width along the body
export function bodyWidth(s, L, W = 5.5) {
  if (s < 3) return 1.4 + 1.6 * (s / 3);                                   // snout
  if (s < 9) return 3 + (W * 1.35 - 3) * Math.sin(Math.PI / 2 * (s - 3) / 6); // viper head, widest at the temples
  if (s < 12) return W * (1.35 - 0.6 * (s - 9) / 3);                       // jaw hinge into the neck
  if (s < 18) return W * (0.75 + 0.25 * (s - 12) / 6);                     // neck
  const u = s / L;
  return u < 0.55 ? W * (1 - 0.15 * u) : W * 0.92 * Math.pow(Math.max(0, (1 - u) / 0.45), 1.1);   // long body, long tail taper
}
// nearest spine point to (x, y): arc length s, signed side distance d (+ = left of the head's travel), sample time, normal
function nearest(sp, x, y) {
  let best = Infinity, S = 0, D = 0, T = 0, N = [0, -1];
  for (let i = 0; i < sp.length - 1; i++) {
    const a = sp[i], b = sp[i + 1], ex = b.x - a.x, ey = b.y - a.y, l2 = ex * ex + ey * ey || 1;
    const f = clamp(((x - a.x) * ex + (y - a.y) * ey) / l2), qx = a.x + ex * f - x, qy = a.y + ey * f - y, d2 = qx * qx + qy * qy;
    if (d2 < best) {
      best = d2; S = a.s + (b.s - a.s) * f; T = a.time + (b.time - a.time) * f;
      const l = Math.sqrt(l2), side = ((x - a.x) * ey - (y - a.y) * ex) >= 0 ? 1 : -1; D = side * Math.sqrt(d2); N = [ey / l, -ex / l];
    }
  }
  return { s: S, d: D, time: T, n: N };
}

// Draw it. o.keep(time, layer) -> false hides that part of the body (coiling behind the target, already inside the chest).
// o.mouth 0..1 opens the jaw; o.k fades everything; o.heart = heart brightness 0..1.
export function drawSerpent(p, sp, t, { L = 70, W = 5.5, k = 1, mouth = 0, heart = 0.7, layer = 'front', keep = null, seed = 0, offset = 0 } = {}) {
  if (sp.length < 2 || k <= 0) return;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const q of sp) { x0 = Math.min(x0, q.x); y0 = Math.min(y0, q.y); x1 = Math.max(x1, q.x); y1 = Math.max(y1, q.y); }
  const pad = W * 2.2 + 6, C = HEART, coarse = sp.filter((_, i) => i % 3 === 0 || i === sp.length - 1);   // ~3 px segments: 3x cheaper
  // which side of the spine is "up" (the back): the side whose normal points more upward, per sample
  p.shade(x0 - pad, y0 - pad, x1 + pad, y1 + pad, (x, y, o) => {
    const q0 = nearest(coarse, x, y), d = q0.d, time = q0.time, n = q0.n, s = q0.s + offset;
    if (s < offset + 0.5 && offset > 0) return;   // the part already inside
    if (keep && !keep(time, layer)) return;
    if (s < 11 && offset < 2) return;   // the head is drawn as its own shape below
    const w = bodyWidth(s, L, W), back = (n[1] < 0) === (d > 0), r = Math.abs(d) / w, u = s / L;
    // NOTE low alpha renders as a stipple, so every mark here is (nearly) opaque and the body between marks is empty:
    // that emptiness IS the invisibility.
    // dorsal fins: outlined clear flame tongues flickering backward along the back
    if (r > 1) {
      if (s < 11 && offset < 2) return;
      const out0 = Math.abs(d) - w;
      // flame aura licking off the whole body: short clear tongues streaming backward, rose tips here and there
      const pa = s / 4.2 + t * 3.2 + (back ? 0 : 0.5) + seed, sa = pa - Math.floor(pa);
      const aura = (1.6 + 1.4 * Math.sin(s * 0.53 - t * 11 + (back ? 0 : 2))) * Math.pow(sa, 1.3) * (1 - smooth(0.85, 1, u)) + 0.6;
      if (out0 <= aura && !(back && s >= 14 && u <= 0.9)) {
        if (out0 > aura - 1) { o.c = sa > 0.85 && (Math.floor(pa) % 3 === 0) ? C[4] : RIM; o.a = k; return; }
        o.l = TINT; o.k = 0.14 * k; return;
      }
      if (!back || s < 14 || u > 0.9) return;
      const ph = s / 6 + t * 3 + seed, saw = ph - Math.floor(ph), fin = Math.max(aura, (3.5 + 2.5 * Math.sin(s * 0.7 - t * 9)) * Math.pow(saw, 1.4) * (1 - smooth(0.7, 0.9, u)));
      const out = Math.abs(d) - w;
      if (out > fin + 0.5 || fin < 1) return;
      if (out > fin - 1) { o.c = saw > 0.75 ? C[4] : RIM; o.a = k; return; }          // fin edge, pink near its tip
      o.l = TINT; o.k = 0.16 * k; return;                                                     // the fin's clear body

    }
    // the open jaw: a wedge cut into the head from the snout
    if (mouth > 0 && s < 10 && !back && r < 0.95 && r > 0.95 - 0.8 * mouth * (1 - s / 10)) {   // open jaw: pink maw, fangs
      o.c = (Math.abs(s - 2) < 0.7 || Math.abs(s - 5) < 0.7) && r > 0.95 - 0.8 * mouth * (1 - s / 10) - 0 && r < 0.95 - 0.8 * mouth * (1 - s / 10) + 0.3 ? C[6] : C[2]; o.a = k; return;
    }
    const edge = (1 - r) * w;
    if (edge < 1 || (edge < 2 && back && s > 4 && s < 10)) { o.c = back ? RIM : SHADE; o.a = k; return; }   // rims; a heavy brow on the head
    if (s < 12) {   // head: eye with a glint, jaw line
      if (Math.abs(s - 6.5) < 1.3 && back && r > 0.3 && r < 0.75) { o.c = Math.abs(s - 6) < 0.5 && r > 0.55 ? C[6] : C[3]; o.a = k; return; }
      if (!back && Math.abs(r - 0.4) < 0.15 && s > 2) { o.c = SHADE; o.a = k; return; }
      o.l = TINT; o.k = (0.14 + 0.25 * r * r * r) * k; return;
    }
    // the heart through the neck, and a few rose veins along the first stretch of body
    const hs = 17, dh = Math.hypot(s - hs, d * 1.3);
    if (dh < 2.8) { o.c = dh < 1.3 ? C[6] : C[3]; o.a = k; return; }
    if (s > hs + 2 && s < hs + 16 * heart && Math.abs(d - 1.8 * Math.sin(s * 0.55 + seed)) < 0.45) { o.c = C[2]; o.a = k; return; }
    // refraction streaks travelling down the body (thin, sparse) and scale chevrons on the back
    const streak = Math.abs(Math.sin(s * 0.33 - t * 7 + d * 0.9 + seed));
    if (streak < 0.09 && r < 0.65 && s > 18) { o.c = RIM; o.a = k * 0.85; return; }
    const ph = s / 4.5 - Math.abs(d) / w * 0.6, f = ph - Math.floor(ph);
    if (back && r > 0.35 && r < 0.85 && f < 0.13 && u < 0.88) { o.c = SHADE; o.a = k * 0.8; return; }
    // glass: the background shows through, brightened, more toward the rims (like a lens)
    o.l = TINT; o.k = (0.1 + 0.28 * r * r * r) * k;
  });
  // ---- the head: a viper's head as its own shape, turned along the neck
  const at = (q) => { for (let i = 1; i < sp.length; i++) if (sp[i].s >= q) return sp[i]; return sp[sp.length - 1]; };
  const h0 = sp[0], hb = at(12);
  if (offset < 2 && (!keep || keep(h0.time, layer))) {
    let fx = h0.x - hb.x, fy = h0.y - hb.y; const fl = Math.hypot(fx, fy) || 1; fx /= fl; fy /= fl;
    let sx = -fy, sy = fx; if (sy > 0) { sx = -sx; sy = -sy; }   // "up" side of the head is the screen-up side
    const S = Math.max(W, 5.2) / 6.5 * 1.05, toW = ([a, b]) => [h0.x + (fx * a + sx * b) * S, h0.y + (fy * a + sy * b) * S];
    // local: a = forward (snout at 0, back negative), b = up
    const jaw = mouth * 0.55, rot = ([a, b]) => { const ca = Math.cos(jaw), sa = Math.sin(jaw), A = a + 13, B = b + 1; return [-13 + A * ca - B * sa * -1, -1 + B * ca + A * sa * -1]; };
    const upper = [[0, 0.5], [-3, 2.8], [-7, 4.8], [-11, 6.8], [-14.5, 6.2], [-17, 4.2], [-17, -1], [-12, -1.4], [-6, -0.6]];
    const lower = [[-1, -0.2], [-6, -1.6], [-12, -2.4], [-17, -1], [-17, -4.2], [-13.5, -5.6], [-9, -4.8], [-4, -2.6]].map((q) => mouth > 0 ? rot(q) : q);
    const fill = (poly, glassK) => {
      const P = poly.map(toW); let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const [x, y] of P) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
      const inside = (x, y) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
      p.shade(x0 - 1, y0 - 1, x1 + 1, y1 + 1, (x, y, o) => {
        if (!inside(x, y)) return;
        const edge = !inside(x + 1, y) || !inside(x - 1, y) || !inside(x, y + 1) || !inside(x, y - 1);
        if (edge) { o.c = y < h0.y + (y1 - y0) * 0 && glassK > 0.2 ? RIM : RIM; o.a = k; return; }
        o.l = TINT; o.k = glassK * k;
      });
      return P;
    };
    if (mouth > 0) {   // the maw between the jaws: rose
      const M = [[-1, 0], [-12, -1], ...[[-12, -1.4], [-6, -0.6], [0, 0.5]].map((q) => q)].map(toW);
      const L2 = [[-1, -0.2], [-12, -2.4]].map((q) => rot(q)).map(toW);
      p.poly([toW([0, 0.2]), toW([-12, -1]), L2[1], L2[0]], C[2], k);
      for (const a of [-2.5, -5.5]) { const [x, y] = toW([a, -0.2]); p.dot(x, y + 1, C[6], k); }
    }
    if (mouth > 0.02) { fill(lower, 0.16); fill(upper, 0.2); }
    else fill([[0, 0.5], [-3, 2.8], [-7, 4.8], [-11, 6.8], [-14.5, 6.2], [-17, 4.2], [-17, -4.2], [-13.5, -5.6], [-9, -4.8], [-4, -2.6], [-1, -0.2]], 0.18);
    // brow ridge, eye with a glint
    const brow = [[-5, 4.6], [-9, 6.4], [-13, 6.4]].map(toW);
    p.polyline(brow, RIM, k);
    const [ex, ey] = toW([-8.5, 3]); p.disc(ex, ey, 1.4 * S, C[3], k); p.dot(ex + fx * 0.6, ey + fy * 0.6 - 0.6, C[6], k);
    // two flame crests swept back from the skull: thin clear tongues, rose tips, flickering
    for (let c = 0; c < 2; c++) {
      const len = 12 + c * 5 + 2 * Math.sin(t * 13 + c * 2), base = toW([-12 - c * 2, 6.2 - c * 0.8]), tip = toW([-12 - c * 2 - len, 9 + c * 5 + Math.sin(t * 9 + c)]);
      const mid = toW([-12 - c * 2 - len * 0.5, 9.5 + c * 2]);
      p.polyline([base, mid, tip], RIM, k);
      p.dot(tip[0], tip[1], C[4], k);
    }
  }
  const tl = sp[sp.length - 1], tp = at(tl.s - 4);
  if (tl.s + offset > L * 0.95 && (!keep || keep(tl.time, layer))) for (const sg of [-1, 1]) {
    const ex = tl.x + (tl.x - tp.x) * 1.4 + sg * 3 * Math.sin(t * 11 + sg), ey = tl.y + (tl.y - tp.y) * 1.4 + sg * 2;
    p.line(tl.x, tl.y, ex, ey, RIM, 0.8 * k);
  }
}
