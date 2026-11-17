// Tam Thien part: the burning sky, an upside-down rolling SEA of black fire (IGNITE..FADE). Port of the draft; Codex details it.
import { smooth, clamp, TAU } from '../../core/index.js';
import { C, TX, END, IGNITE, RAIN, ORB, STARS, FADE, CLIMAX, R, SC, SKY, XC, sm, out3, hsh, orbState } from './_tamthien-common.js';

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
function skyDraw(p, t) {
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

export function sky(p, t, layer) { if (layer === 'back') skyDraw(p, t); }
