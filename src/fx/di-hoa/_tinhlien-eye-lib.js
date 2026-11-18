// Tinh Lien shape library (Opus): the beast eye's fire and the darkness around it.
// 1. lidFlames: a DENSE crown of fire standing on a lid — two overlapping curtains of tongues (a taller, deeper back
//    curtain and a shorter white-hot front curtain), no gaps of sky between tongues, tallest at mid-lid / outer corner,
//    tips pulled in toward the pupil (the eye drinks its own fire), flickering upward.
// 2. shutBand: the shut eye — a lens-thin seam buried in that same fire, collapsing to a smouldering line.
// 3. veil: darkness that deepens smoothly (ordered dither over a wide seam) — never visible rings or bands.
import { clamp, hex } from '../../core/index.js';

export const FIRE = ['#3a0d14', '#7a1e10', '#c2410f', '#ec7a20', '#ffb238', '#ffd970', '#fff3c4'].map(hex);
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const bayer = (x, y) => BAYER[((y & 3) << 2) | (x & 3)];
const fireAt = (b, x, y) => { b = clamp(b, 0, 6); const i = Math.floor(b); return FIRE[Math.min(6, b - i > bayer(x, y) ? i + 1 : i)]; };

// height of one curtain at column x: a sum of travelling tongue profiles, sharpened so tongues read as separate
// licks but never drop below `floor` (that floor is what keeps the crown dense — no sky between tongues)
function curtain(x, t, ph, floor) {
  const a = 0.5 + 0.5 * Math.sin(x * 0.52 + ph - t * 3.1);
  const b = 0.5 + 0.5 * Math.sin(x * 0.23 - ph * 1.3 + t * 2.2);
  const c = 0.5 + 0.5 * Math.sin(x * 1.07 + ph * 2.1 + t * 7.5);
  const flick = 0.85 + 0.15 * Math.sin(t * 17 + x * 0.31 + ph);
  return (floor + (1 - floor) * (0.55 * a * a * a + 0.3 * b * b + 0.15 * c)) * flick;
}

/**
 * Fire standing on a lid from x0 to x1 (painter-local px). lidY(x) = the lid line; dir = -1 grows up (upper lid),
 * +1 grows down (lower lid). H(x) = crown height profile at x (0 at the corners). o: k (0..1), cx (pupil x the tips
 * lean toward), pull (0..1 inward lean), heat (0..1 brighter), seed.
 */
export function lidFlames(p, x0, x1, lidY, dir, H, t, o = {}) {
  const { k = 1, cx = (x0 + x1) / 2, pull = 0.6, heat = 0, seed = 0 } = o;
  if (k <= 0) return;
  const half = (x1 - x0) / 2;
  for (let pass = 0; pass < 2; pass++) {             // 0 = back curtain (taller, deeper), 1 = front curtain (white-hot)
    const tall = pass ? 0.62 : 1, ph = seed + pass * 2.7, floor = pass ? 0.3 : 0.42;
    for (let x = Math.ceil(x0); x <= x1; x++) {
      const h = H(x) * k * tall * curtain(x, t, ph, floor);
      if (h < 0.8) continue;
      const y0 = lidY(x), toward = (cx - x) / half;     // -1..1: which way the tips are drawn in
      for (let d = 0; d < h; d++) {
        const f = d / h;
        const lx = x + Math.round(toward * pull * h * 0.45 * f * f + Math.sin(t * 9 + x * 0.4 + ph) * f * 1.2);
        const y = Math.round(y0 + dir * d);
        // root hottest, tips cooling to deep red; front curtain stays white-yellow longer
        const b = (pass ? 6.4 : 5.6) - f * (pass ? 3.4 : 4.6) + heat * 0.8;
        p.dot(lx, y, fireAt(b, lx, y));
      }
    }
  }
}

/**
 * The shut eye (cx,cy), half width hw: the seam closes over 0..1 `shut`, its fire flares then dies with `k`.
 * Draw it in place of the open eye once the lids have met.
 */
export function shutBand(p, cx, cy, hw, t, o = {}) {
  const { k = 1, seed = 0 } = o;
  if (k <= 0) return;
  const lid = (x) => cy + 1.5 * (1 - ((x - cx) / hw) ** 2);   // the seam sags a little in the middle
  const prof = (x) => { const u = Math.abs(x - cx) / hw; return u >= 1 ? 0 : (1 - u * u) ** 0.7; };
  lidFlames(p, cx - hw, cx + hw, lid, -1, (x) => 13 * prof(x), t, { k, cx, pull: 0.3, heat: 0.4, seed });
  lidFlames(p, cx - hw, cx + hw, (x) => lid(x) + 1, 1, (x) => 5 * prof(x), t, { k: k * 0.9, cx, pull: 0.2, seed: seed + 5 });
  // the seam itself: a white-gold line, the last thing to fade
  for (let x = Math.ceil(cx - hw); x <= cx + hw; x++) if (prof(x) > 0.05) p.dot(x, Math.round(lid(x)), fireAt(4 + 2.5 * k * prof(x), x, 0));
}

/**
 * Darkness over a box: level(x, y) returns 0 (untouched) .. n-1+ (deepest) as a continuous number; DARK is the ramp
 * from lightest to deepest. Each step blends into the next over a whole level with the ordered dither, so no step is
 * ever a visible ring. Step `S` px: level is sampled on a coarse grid and interpolated (it must be smooth anyway).
 */
export function veil(p, x0, y0, x1, y1, level, DARK, S = 6) {
  const nx = Math.ceil((x1 - x0) / S) + 2, ny = Math.ceil((y1 - y0) / S) + 2, g = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) g[j * nx + i] = level(x0 + i * S, y0 + j * S);
  for (let y = Math.ceil(y0); y < y1; y++) {
    const fy = (y - y0) / S, j = Math.min(ny - 2, fy | 0), v = fy - j;
    for (let x = Math.ceil(x0); x < x1; x++) {
      const fx = (x - x0) / S, i = Math.min(nx - 2, fx | 0), u = fx - i, q = j * nx + i;
      const lv = (g[q] * (1 - u) + g[q + 1] * u) * (1 - v) + (g[q + nx] * (1 - u) + g[q + nx + 1] * u) * v;
      if (lv <= 0) continue;
      // half of each level is flat, half a dither seam (a full-level seam reads as a checkerboard over the sky);
      // callers should wobble level() with slow noise so iso-lines never form concentric rings
      const step = Math.floor(lv), frac = clamp((lv - step - 0.5) * 2 + 0.5);
      const idx = frac > bayer(x, y) ? step : step - 1;
      if (idx < 0) continue;
      p.dot(x, y, DARK[Math.min(DARK.length - 1, idx)]);
    }
  }
}
