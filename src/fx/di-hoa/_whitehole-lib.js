// White-hole / ground shape library (Opus, aesthetic design 18/11) for Tinh Lien v2 "Ho Ly May Lien Hoa".
// Card: design/di-hoa/tinh-lien-v2-ho-ly.md. All solid tiers (no alpha), stateless, pure in (t, seed).
// - horizon(): the white hole: ivory-white core in 3 steps, a 1–2 px dark event ring, a flickering ring of fire teeth.
// - flameArm(): one spiral arm of the vortex made of ivory fire (dark outer edge, bright spine, tongues licking
//   inward along it), thick near the core and tapering outward; it rotates and flows INTO the core.
// - rock(): a torn chunk of ground: irregular polygon, dark body, lit top facet, 1 px highlight.
// - crack(): a jagged ground crack that grows with k, with 1–2 short branches; glowing ivory inside while fresh.
// - wisp(): a curl of mist (for the gathering): a thinning comma of dots.
import { clamp, hex, TAU } from '../../core/index.js';
import { L, DUST, CLOUD } from './_tinhlien-common.js';

export const IV = [DUST[2], DUST[4], hex('#d9d0bd'), L[4], L[5], L[6]];   // ivory fire ramp, dark -> white
const h1 = (x) => { const s = Math.sin(x * 91.7 + 13.1) * 43758.5453; return s - Math.floor(s); };

/** The white hole at (cx,cy), radius R. k (0..1) extra brightness/pulse. */
export function horizon(p, cx, cy, R, t, k = 1) {
  if (R < 0.6) return;
  const R2 = R + 6;
  p.shade(cx - R2 - 1, cy - R2 - 1, cx + R2 + 1, cy + R2 + 1, (x, y, out) => {
    const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
    if (d > R2) return;
    if (d < R) { out.c = d < R * 0.55 ? L[6] : d < R * 0.82 ? L[5] : L[4]; out.a = 1; out.l = L[6]; out.k = 0.18 * k; return; }
    if (d < R + 1.5) { out.c = CLOUD[0]; out.a = 1; return; }
    // teeth of fire around the ring, flickering at 20 Hz, licking inward (toward the core)
    const a = Math.atan2(dy, dx), n = 14 + Math.round(R * 0.6), seg = Math.floor(((a / TAU + 1) % 1) * n);
    const hgt = 1.5 + 4.5 * h1(seg * 3.1 + Math.floor(t * 20 + seg * 0.37) * 7.7);
    const f = (d - R - 1.5) / hgt;
    if (f < 1 && Math.abs(Math.sin(((a / TAU + 1) % 1) * n * Math.PI)) > f * 0.8) { out.c = f < 0.4 ? L[6] : f < 0.75 ? L[5] : L[3]; out.a = 1; }
  });
}

/**
 * One fire arm of the vortex, as a spiral from Rout (outer tip) to Rin (at the core).
 * a0: angle of the outer tip; turns: how far it winds (rad) before the core; spin: current rotation (rad);
 * width: max half-width (px) near the core; k: presence (0..1) shortens it from the outside.
 */
export function flameArm(p, cx, cy, Rin, Rout, a0, turns, spin, width, t, k = 1, seed = 0) {
  if (k <= 0 || Rout <= Rin) return;
  const n = Math.max(12, Math.ceil((Rout - Rin) * 1.4)), s0 = 1 - k;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const s = s0 + (1 - s0) * (i / n);          // 0 = outer tip .. 1 = core
    const r = Rout + (Rin - Rout) * s, a = a0 + spin + turns * s * s;
    const w = Math.max(0.6, width * Math.pow(s, 0.7) * (0.8 + 0.2 * Math.sin(t * 17 + i * 0.9 + seed)));
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, w, s, a]);
  }
  for (const [x, y, w] of pts) p.disc(x, y, w + 0.8, IV[0], 1);                       // dark outer edge
  for (const [x, y, w, s] of pts) p.disc(x, y, w * 0.75, IV[s > 0.5 ? 3 : 2], 1);    // body
  for (const [x, y, w, s] of pts) if (w > 1.4) p.disc(x, y, w * 0.35, IV[s > 0.6 ? 5 : 4], 1);   // bright spine
  // tongues licking off the arm toward the core, jumping every ~1/18 s
  for (let i = 2; i < pts.length; i += 3) {
    const [x, y, w, s, a] = pts[i], g = h1(i * 5.3 + seed + Math.floor(t * 18 + i * 0.41) * 3.7);
    if (g < 0.35) continue;
    const len = (2 + 6 * g) * (0.4 + s), ix = -Math.cos(a), iy = -Math.sin(a);
    for (let j = 1; j <= len; j++) p.dot(x + ix * (w + j), y + iy * (w + j), j < len * 0.5 ? IV[5] : IV[3]);
  }
}

/** A torn chunk of ground at (x,y), size s px, rotation rot, seed picks the shape. */
export function rock(p, x, y, s, rot, seed) {
  if (s < 1) return;
  if (s < 2.2) { p.dot(x, y, DUST[2]); return; }
  const n = 5 + Math.floor(h1(seed) * 3), pts = [];
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * TAU, r = s * (0.7 + 0.45 * h1(seed * 3.3 + i));
    pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r * 0.8]);
  }
  p.poly(pts, DUST[1]);
  const top = pts.map(([px, py]) => [x + (px - x) * 0.7, y + (py - y) * 0.6 - s * 0.25]);
  p.poly(top, DUST[3]);
  p.dot(x - s * 0.2, y - s * 0.55, DUST[4]);
}

/** A ground crack from (x0,y0) heading dir (rad), max length len; k (0..1) growth; hot (0..1) ivory glow inside. */
export function crack(p, x0, y0, len, dir, seed, k, hot = 0) {
  if (k <= 0) return;
  const L1 = len * k, steps = Math.max(2, Math.ceil(L1 / 4));
  let x = x0, y = y0;
  for (let i = 0; i < steps; i++) {
    const a = dir + (h1(seed + i * 1.7) - 0.5) * 0.9, l = L1 / steps;
    const nx = x + Math.cos(a) * l, ny = y + Math.sin(a) * l * 0.35;   // flattened: cracks lie on the floor
    p.line(x, y, nx, ny, CLOUD[0]);
    if (hot > 0.2) p.line(x, y - 1, nx, ny - 1, hot > 0.6 ? L[5] : L[3]);
    if (i === 1 && h1(seed * 7) > 0.4) crack(p, nx, ny, len * 0.35, dir + (h1(seed * 9) > 0.5 ? 0.7 : -0.7), seed + 17, k, hot * 0.6);
    x = nx; y = ny;
  }
}

/** A curl of ivory mist at (x,y) heading ang, length len px; k (0..1) presence (thins it from the tail). */
export function wisp(p, x, y, len, ang, t, k = 1, seed = 0) {
  if (k <= 0) return;
  const n = Math.ceil(len), curl = 1.8 + h1(seed) * 1.5;
  for (let i = 0; i < n; i++) {
    const s = i / n;
    if (s < 1 - k) continue;
    const a = ang + curl * s * s + 0.3 * Math.sin(t * 3 + seed + s * 4);
    x += Math.cos(a); y += Math.sin(a);
    const w = (1 - Math.abs(s - 0.6) / 0.6) * 2.2;
    if (w > 1.2) p.disc(x, y, w * 0.6, IV[s > 0.5 ? 4 : 3], 1); else p.dot(x, y, IV[2]);
  }
}
