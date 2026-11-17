// Three rolling layers of black fire; all frame tables are local and deterministic.
import { smooth, clamp } from '../../core/index.js';
import { C, IGNITE, ORB, R, SC, SKY, XC, out3, hsh } from './_tamthien-common.js';

const LAYERS = [
  { base: 24, lobe: 30, h: 16, v: 9, dim: 2 },
  { base: 46, lobe: 44, h: 22, v: -16, dim: 1 },
  { base: 66, lobe: 58, h: 30, v: 26, dim: 0 },
];
const EMBERS = Array.from({ length: 32 }, (_, n) => [hsh(n, 14), -48 + 338 * hsh(n, 15), hsh(n, 16)]);
function lobeAt(x, L, t, ph) {
  const X = x + t * L.v + ph, f = X / L.lobe + 0.35 * Math.sin(X * 0.013);
  const j = Math.floor(f), u = f - j - 0.5;
  const size = 0.45 + 0.75 * hsh(j, 13 + ph), skew = (hsh(j, 21) - 0.5) * 0.6;
  const billow = L.h * size * Math.pow(Math.max(0, 1 - 4 * (u - skew * (0.5 - Math.abs(u))) ** 2), 0.7);
  const lick = Math.pow(Math.max(0, Math.sin(x * 0.19 + t * 5 + ph)), 3) * (4 + L.h * 0.3) * (0.6 + 0.4 * Math.sin(t * 7 + x * 0.05 + ph))
    + Math.pow(Math.max(0, Math.sin(x * 0.31 - t * 8 + ph * 2)), 4) * (2 + L.h * 0.15);
  return billow + lick * (0.4 + 0.6 * size);
}
function skyDraw(p, t) {
  if (t <= IGNITE || t >= ORB + 0.6) return;
  const spread = out3(clamp((t - IGNITE) / 0.8)), drain = smooth(ORB, ORB + 0.6, t);
  const width = 1 - drain, target = SC[0], mouth = SC[1] - R - SKY;
  const edges = LAYERS.map(() => new Float32Array(360));
  const grow = new Float32Array(360), limit = new Float32Array(360);
  const xs = LAYERS.map(() => new Float32Array(360));
  const xc = LAYERS.map(() => new Float32Array(360));
  const shimmer = new Float32Array(360);
  let maxD = 0;
  for (let i = 0; i < 360; i++) {
    const x = i - 59.5, source = target + (x - target) / width;
    if (source < -60 || source >= 300) continue;
    const g = smooth(0, 1, (spread - Math.abs(source - XC) / 200 + 0.15) * 3);
    if (g <= 0) continue;
    grow[i] = g;
    shimmer[i] = Math.sin(source * 0.17 - t * 7);
    const funnel = mouth * drain * Math.max(0, 1 - Math.pow(Math.abs(source - target) / 240, 0.7));
    for (let li = 0; li < 3; li++) {
      const L = LAYERS[li];
      const edge = (L.base + lobeAt(source, L, t, li * 17) + 4 * Math.sin(source * 0.05 + t * 1.3 + li)) * g;
      edges[li][i] = edge * width + funnel;
      limit[i] = Math.max(limit[i], edges[li][i]);
      const phase = source * 0.105 + L.v * t * 0.10 + li * 1.7;
      xs[li][i] = Math.sin(phase); xc[li][i] = Math.cos(phase);
    }
    maxD = Math.max(maxD, limit[i]);
  }
  // Row-only sway bends tongues; row-only phase warps rounded hot cells into curls.
  const rows = Math.ceil(maxD) + 2, sway = new Float32Array(rows);
  const ys = LAYERS.map(() => new Float32Array(rows));
  const yc = LAYERS.map(() => new Float32Array(rows));
  for (let d = 0; d < rows; d++) {
    sway[d] = (3.5 * Math.sin(d * 0.13 + t * 6) + 1.5 * Math.sin(d * 0.31 - t * 9)) * width;
    for (let li = 0; li < 3; li++) {
      const phase = d * 0.19 - t * 2.5 + li;
      ys[li][d] = Math.sin(phase);
      yc[li][d] = Math.cos(phase + 1.3 * Math.sin(phase));
    }
  }
  // Rasterize each column only to its lowest edge. Batch equal-colour vertical runs
  // into lines, avoiding shade callbacks and inverse transforms for every pixel.
  for (let col = 0; col < 360; col++) {
    let bottom = 0;
    for (let j = Math.max(0, col - 6); j <= Math.min(359, col + 6); j++) bottom = Math.max(bottom, limit[j]);
    if (bottom <= 0) continue;
    const x = col - 59.5;
    let run = 0, start = 0;
    const flush = row => { if (run) p.line(x, SKY + start, x, SKY + row - 1, C[run - 1]); };
    for (let row = 0; row <= Math.ceil(bottom); row++) {
      const d = row + 0.5;
      const i = Math.max(0, Math.min(359, Math.floor(x + 60 + sway[row])));
      if (d > limit[i]) { flush(row); run = 0; continue; }
      let li = 0;
      if (d > edges[0][i]) li = d <= edges[1][i] ? 1 : 2;
      const e = edges[li][i] - d;
      if (e < 0) { flush(row); run = 0; continue; }
      const roll = xs[li][i] * ys[li][row] + 0.55 * xc[li][i] * yc[li][row];
      const heat = roll - e * 0.012;
      let c = e < 1.2 ? 5 : e < 3.2 ? 4 : e < 7 ? 3 : heat > 0.78 ? 4 : heat > 0.25 ? 3 : heat > -0.42 ? 2 : 1;
      c = Math.max(0, c - LAYERS[li].dim);
      // Thin crest foam stays hot on all three layers, with broken white-pink tips.
      if (e < 1.15) c = shimmer[i] > 0.65 ? 5 : 4;
      if (t < 0.9 && grow[i] < 0.94 && (e < 2 || (grow[i] > 0.45 && grow[i] < 0.52))) c = e < 1 ? 6 : 5;
      if (c + 1 !== run) { flush(row); start = row; run = c + 1; }
    }
    flush(Math.ceil(bottom) + 1);
  }
  // Sparks thrown ahead of the two advancing ignition fronts.
  if (t < 0.9) for (let side = -1; side <= 1; side += 2) {
    const radius = (spread - 0.017) * 200;
    for (let n = 0; n < 9; n++) {
      const age = (t * 3 + EMBERS[n][0]) % 1;
      const x = XC + side * (radius + age * 17), y = SKY + 6 + EMBERS[n][2] * 48 + age * 13;
      if (x < -59 || x > 298) continue;
      p.line(x - side * 2, y - 1, x, y, C[n % 3 ? 5 : 6]);
    }
  }
  // Attached-source drips: a short swaying tail and a few heavier torn-off curls.
  for (let n = 0; n < EMBERS.length; n++) {
    const [seed, source, size] = EMBERS[n], age = (t * (0.65 + size * 0.25) + seed) % 1;
    const col = Math.max(0, Math.min(359, Math.floor(target + (source - target) * width + 60)));
    if (grow[col] < 0.9) continue;
    const x = target + (source - target) * width + Math.sin(t * 5 + n + age * 4) * 1.5 * width;
    const y = SKY + edges[2][col] + 4 + age * age * 55 * width;
    if (x < -58 || x > 297 || y > 22) continue;
    if (n % 7 === 0) {
      p.poly([[x - 2, y - 6], [x + 2, y - 4], [x + 3, y], [x, y + 3], [x - 2, y + 1]], C[4]);
      p.line(x - 1, y - 3, x + 1, y + 1, C[1]);
      p.dot(x + 1, y + 2, C[5]);
    } else {
      p.line(x - Math.sin(n + t * 4), y - 3, x, y, C[3]);
      p.dot(x, y, C[4 + n % 2]);
    }
  }
}
export function sky(p, t, layer) { if (layer === 'back') skyDraw(p, t); }
