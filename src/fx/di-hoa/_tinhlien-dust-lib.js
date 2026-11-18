// Tinh Lien shape library (Opus): billowing dust.
// Dust is ONE surface, not a bag of balls: every billow writes a height into a shared field (front billows stand
// higher), then one shading pass lights the whole mass from the upper left. Billows have lumpy cauliflower rims (no
// perfect circles), the seams where billows meet sink into soft creases, the outer silhouette gets a lit rim on top
// and a deep shadow underneath, earth-brown at the bottom grading to ash-grey on top, grit specks that ride with each
// billow, optional light from inside (the lotus seen through the dust) and erosion that opens holes from the thin
// edges inward (dust thins out — it never shrinks like a balloon).
import { clamp, hex } from '../../core/index.js';

export const EARTH = ['#22180f', '#3b2a1b', '#5a4029', '#7d5c3c', '#a07e57', '#c2a57c'].map(hex);
export const ASH = ['#26221f', '#3d3732', '#5a524a', '#7c7166', '#a09484', '#c4b8a6'].map(hex);
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const bayer = (x, y) => BAYER[((y & 3) << 2) | (x & 3)];
const hash = (x, y, s) => { const h = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return h - Math.floor(h); };
const LX = -0.62, LY = -0.78;   // toward the light: upper left

let HB = new Float32Array(0), SB = new Float32Array(0), IB = new Int16Array(0);
const grow = (n) => { if (HB.length < n) { HB = new Float32Array(n); SB = new Float32Array(n); IB = new Int16Array(n); } };

/**
 * blobs: [{ x, y, r, z = 0, seed, ash = 0..1 (0 earth .. 1 ash; default from height in the mass) }] painter-local.
 * o: k (presence 0..1, below 1 erodes too), erode (0..1 thin out), glow ({ x, y, r, k, c } light from inside),
 *    top / bottom (y of the mass's top and bottom, for the earth->ash grade), seed.
 */
export function dustMass(p, blobs, t, o = {}) {
  const { erode = 0, glow = null, seed = 0 } = o;
  if (!blobs.length || erode >= 1) return;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const b of blobs) { x0 = Math.min(x0, b.x - b.r * 1.2); x1 = Math.max(x1, b.x + b.r * 1.2); y0 = Math.min(y0, b.y - b.r * 1.2); y1 = Math.max(y1, b.y + b.r * 1.2); }
  x0 = Math.floor(x0) - 1; y0 = Math.floor(y0) - 1; x1 = Math.ceil(x1) + 1; y1 = Math.ceil(y1) + 1;
  const W = x1 - x0 + 1, Hh = y1 - y0 + 1, N = W * Hh;
  grow(N); HB.fill(0, 0, N); SB.fill(0, 0, N); IB.fill(-1, 0, N);
  const top = o.top ?? y0, bottom = o.bottom ?? y1;
  // 1. heights: lumpy domes; the lump pattern turns slowly so billows roll
  blobs.forEach((b, bi) => {
    const s = b.seed ?? bi * 3.7 + seed, rr = b.r * 1.16, spin = t * (0.6 + 0.25 * Math.sin(s));
    for (let y = Math.max(y0, Math.floor(b.y - rr)); y <= Math.min(y1, Math.ceil(b.y + rr)); y++) {
      for (let x = Math.max(x0, Math.floor(b.x - rr)); x <= Math.min(x1, Math.ceil(b.x + rr)); x++) {
        const dx = x - b.x, dy = y - b.y, d2 = dx * dx + dy * dy;
        if (d2 > rr * rr) continue;
        const a = Math.atan2(dy, dx);
        const R = b.r * (1 + 0.07 * Math.sin(a * 5 + s + spin) + 0.035 * Math.sin(a * 9 - s * 2 + spin * 1.6));
        if (d2 >= R * R) continue;
        // the dome stays round (lumps only shape the rim): lumpy heights shade as star-shaped facets
        const h = Math.sqrt(Math.max(0.6, b.r * b.r - d2)) + (b.z ?? 0), q = (y - y0) * W + (x - x0);
        // soft union: where two billows meet the surface rounds into a shallow valley instead of a cut
        const o0 = HB[q], m = Math.max(o0, h), j = Math.max(0, 5 - Math.abs(o0 - h));
        if (h > o0) { SB[q] = o0; IB[q] = bi; } else if (h > SB[q]) SB[q] = h;
        HB[q] = o0 > 0 ? m + j * j / 20 : h;
      }
    }
  });
  // 2. one shading pass over the whole mass
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const q = (y - y0) * W + (x - x0), bi = IB[q];
      if (bi < 0) continue;
      const b = blobs[bi], h = HB[q];
      const thin = clamp(h / (b.r * 0.9));                                // 0 at the billow's edge, 1 at its crown
      if (erode > 0) {                                                    // holes open in thin parts first
        const n = hash(Math.floor(x / 3), Math.floor(y / 3), seed) * 0.6 + hash(Math.floor(x / 7), Math.floor(y / 7), seed + 1) * 0.4;
        if (n < erode * 1.25 - thin * 0.35) continue;
      }
      // light: the dome's normal against the upper-left light; an occluding billow above-left casts shade
      // normal from the shared height field (so billows shade as one surface), lit from the upper left
      const hl = x > x0 ? HB[q - 1] : 0, hr = x < x1 ? HB[q + 1] : 0, hu = y > y0 ? HB[q - W] : 0, hd = y < y1 ? HB[q + W] : 0;
      const gx = (hr - hl) * 0.5, gy = (hd - hu) * 0.5, nl = Math.hypot(gx, gy, 1.6);
      let lum = 0.08 + 0.95 * ((-gx * LX - gy * LY) * 0.9 + 0.5) / nl + 0.1 * thin;
      if (SB[q] > 0 && h - SB[q] < 1.2 && thin < 0.8) lum -= 0.12;        // only a faint valley where billows meet
      // silhouette: lit rim on the light side, deep edge on the shadow side
      const outR = x === x1 || IB[q + 1] < 0, outD = y === y1 || IB[q + W] < 0, outL = x === x0 || IB[q - 1] < 0, outU = y === y0 || IB[q - W] < 0;
      if (outR || outD) lum -= 0.35; else if (outL || outU) lum += 0.2;
      // grit specks riding with the billow
      if (hash(Math.floor(x - b.x), Math.floor(y - b.y), (b.seed ?? bi) + 9) < 0.012) lum -= 0.2;
      // earth -> ash by height in the mass (dithered seam), or per billow
      const ashK = b.ash ?? clamp((bottom - y) / Math.max(1, bottom - top) * 1.3 - 0.15);
      const R = ashK > bayer(x + 1, y) ? ASH : EARTH;
      const v = clamp(lum, 0, 1) * 5.4, i = Math.floor(v);
      const c = R[Math.min(5, clamp((v - i - 0.5) * 2.2 + 0.5) > bayer(x, y) ? i + 1 : i)];
      p.dot(x, y, c);
      if (glow) {                                                         // light from inside: thin dust lets it through
        const gd = Math.hypot(x - glow.x, y - glow.y) / glow.r;
        if (gd < 1) p.light(x, y, glow.c, glow.k * (1 - gd) * (1 - gd) * (1.1 - 0.6 * thin));
      }
    }
  }
}

/** A ready-made billow cluster: n billows packed round (cx, cy) with radius ~R, biggest in the middle, for cards/tests. */
export function cluster(cx, cy, R, n, seed, t = 0) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = i * 2.39996 + seed, d = R * Math.sqrt(i / n) * 0.85;
    out.push({ x: cx + Math.cos(a + t * 0.3) * d, y: cy + Math.sin(a + t * 0.3) * d * 0.8, r: R * (0.55 - 0.3 * i / n) * (0.85 + 0.3 * hash(i, 1, seed)), z: (n - i) * 0.6, seed: seed + i * 1.3 });
  }
  return out;
}
