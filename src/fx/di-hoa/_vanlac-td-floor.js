// Van Lac Tam Viem (top-down), floor part: the sealing ring that cracks open, the two break-out spots, rising dust.
import { smooth, TAU } from '../../core/index.js';
import { C, SHADE } from './_vanlac-common.js';
import { hash } from './_cold-lib.js';
import { END, SEAL, EMERGE, COIL, DIVE, BEATS, BURN, SQ, SPOT, SEAL_RX, pk, fr } from './_vanlac-td-common.js';

const CRACKS = Array.from({ length: 6 }, (_, k) => (k + 0.5) / 12 * TAU).flatMap((a) => [a, Math.PI - a]);   // 12, mirror pairs
function sealGlow(t) {
  let g = smooth(SEAL, 0.35, t) * (1 - 0.5 * smooth(COIL, DIVE, t));
  for (const b of BEATS) g += 0.8 * Math.exp(-(((t - b) / 0.06) ** 2));
  return g + 1.2 * Math.exp(-(((t - BURN) / 0.08) ** 2));
}
export function seal(p, t, sd) {
  if (t > END) return;
  const grow = smooth(0, 0.30, t), g = sealGlow(t), rot = t * 0.6;
  const decay = smooth(BURN + 0.05, END - 0.05, t);
  p.shade(-SEAL_RX - 4, -SEAL_RX * SQ - 3, SEAL_RX + 4, SEAL_RX * SQ + 3, (x, y, o) => {
    const ax = Math.abs(x), ex = ax / SEAL_RX, ey = y / (SEAL_RX * SQ), r = Math.hypot(ex, ey);
    if (r > 1.08) return;
    if (decay > 0 && hash(Math.floor(ax), Math.floor(y) + 99, sd) < decay * 1.1) return;   // dissolves by noise
    const ang = Math.atan2(ey, ex);                                                          // 0..PI, mirror-invariant
    const sweep = Math.PI * (0.5 + 0.5 * grow) + 0.2;                                        // drawn from the back, both ways at once
    const fromBack = Math.abs(ang + Math.PI / 2) <= sweep || Math.abs(ang - 3 * Math.PI / 2) <= sweep;
    if (Math.abs(r - 1) < 0.045 && fromBack && grow > 0) { o.c = g > 0.9 ? C[4] : C[3]; o.a = 1; return; }
    if (Math.abs(r - 0.66) < 0.035 && grow > 0.4) {                                          // inner ring: dashed, turning
      const d = (Math.atan2(ey, ex * (x < 0 ? -1 : 1)) + rot) / TAU * 16; if (d - Math.floor(d) < 0.55) { o.c = C[2]; o.a = 1; return; }
    }
    if (r < 0.98 && r > 0.70 && grow > 0.6) {                                                // seal glyph marks between the rings
      const q = Math.abs(Math.atan2(ey, ex)) / TAU * 24 + 0.5, f = q - Math.floor(q);
      if (f < 0.08 && Math.abs(r - 0.84) < 0.09) { o.c = C[1 + (g > 0.6 ? 1 : 0)]; o.a = 1; return; }
    }
  });
  // 12 cracks out of the centre (mirror pairs), jagged, hot core
  const open = smooth(0.08, 0.38, t);
  if (open > 0) for (const a of CRACKS) {
    const key = pk(a), len = (0.7 + 0.35 * hash(key, 3, sd)) * SEAL_RX * open;
    let px = 0, py = 0;
    for (let s = 3; s <= len; s += 3) {
      const j = (hash(key, s, sd) - 0.5) * 2.4, x = Math.cos(a) * s - Math.sin(a) * j, y = (Math.sin(a) * s + Math.cos(a) * j) * SQ;
      if (s > 3) {
        if (decay > 0 && hash(key, s, 7) < decay * 1.2) { px = x; py = y; continue; }
        const hot = g > 0.9 && s < len * 0.6;
        p.line(px, py, x, y, hot ? C[4] : (s < len * 0.5 ? C[3] : C[2]));
      }
      px = x; py = y;
    }
  }
  // the two spots the serpents break out of
  for (const m of [1, -1]) {
    const k = smooth(0.18, 0.40, t) * (1 - smooth(0.55, 0.9, t));
    if (k > 0) { p.disc(m * SPOT, 0, 3 + 2 * k, C[2], 1); p.disc(m * SPOT, 0, 1.5 + 1.5 * k, C[k > 0.6 ? 6 : 4], 1); }
    const sc = smooth(0.40, 0.55, t) * (1 - smooth(BURN, END, t));
    if (sc > 0) p.ellipse(m * SPOT, 0, 4, 2, C[1], 1);   // the broken seal left behind
  }
}
export function dust(p, t) {   // rose grit swept round in two counter-turning swirls while the serpents rise
  if (t < EMERGE || t > COIL + 0.3) return;
  const k = smooth(EMERGE, EMERGE + 0.15, t) * (1 - smooth(COIL, COIL + 0.3, t));
  for (let i = 0; i < 14; i++) {
    const a0 = hash(i, 11, 3) * TAU, r = 16 + 22 * hash(i, 12, 3), a = a0 + (t - EMERGE) * (2.4 + hash(i, 13, 3) * 2);
    if (hash(i, fr(t), 5) > k) continue;
    const x = Math.abs(Math.cos(a) * r), y = Math.sin(a) * r * SQ;
    for (const m of [1, -1]) p.dot(m * x, y, i % 3 ? SHADE : C[4]);
  }
}
