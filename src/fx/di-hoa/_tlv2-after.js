import { clamp, smooth } from '../../core/index.js';
import { DUST, L, hsh } from './_tinhlien-common.js';
import { flamePetal } from './_tinhlien-lotus-lib.js';
import { TX, H, AFTER } from './_tlv2-common.js';

const MARK_START = AFTER[0] - 0.05;
const EMBERS = Array.from({ length: 15 }, (_, i) => {
  const start = AFTER[0] + 0.26 * hsh(i, 8);
  return {
    start, land: start + 0.52 + 0.15 * hsh(i, 9),
    x: H[0] + (hsh(i, 10) - 0.5) * 90,
    y: H[1] - 8 - 21 * hsh(i, 11),
    floorX: TX + (hsh(i, 10) - 0.5) * 43,
    floorY: -2 + 4 * hsh(i, 12),
    size: 3.5 + 1.8 * hsh(i, 13),
  };
});

// Rotate each ellipse on the ground plane before applying the vertical squash.
const PETALS = [-1.29, 1.29, -0.66, 0.66, 0].map((angle, i) => {
  const len = [23, 23, 24, 24, 26][i];
  const c = Math.cos(angle), s = Math.sin(angle);
  return Array.from({ length: 12 }, (_, j) => {
    const a = j * Math.PI / 6;
    const along = len * (0.56 + 0.44 * Math.cos(a));
    const across = 3.7 * Math.sin(a);
    return [along * s + across * c, (across * s - along * c) * 0.28];
  });
});

export function after(p, t, layer) {
  if (t < MARK_START || t >= AFTER[1]) return;
  if (layer === 'back') lotusMark(p, t);
  if (layer === 'front' && t >= AFTER[0]) embers(p, t);
}

function embers(p, t) {
  for (let i = 0; i < EMBERS.length; i++) {
    const { start, land, x, y, floorX, floorY, size } = EMBERS[i];
    if (t < start || t > land + 0.07 + 0.09 * hsh(i, 14)) continue;
    const u = clamp((t - start) / (land - start));
    const sway = Math.sin(u * 8 + i) * Math.sin(u * Math.PI);
    const px = x + (floorX - x) * u + 10 * sway;
    const py = y + (floorY - y) * u * (0.7 + 0.3 * u);
    const s = size * (1 - u);
    if (s < 1.15) {
      p.dot(px, py, t >= land ? DUST[3] : L[4]);
      continue;
    }
    const a = Math.sin(u * 5 + i) * 0.8;
    flamePetal(p, px, py, px + Math.sin(a) * s * 2, py - Math.cos(a) * s * 2,
      s * 0.65, t, i * 2.7, { wisp: 0.28, heat: 0.36 });
  }
}

function lotusMark(p, t) {
  const glow = smooth(MARK_START, MARK_START + 0.19, t);
  const cool = smooth(AFTER[0] + 0.34, AFTER[1] - 0.06, t);
  const k = glow * (1 - smooth(AFTER[1] - 0.52, AFTER[1], t));
  if (k < 0.08) return;

  const edge = cool < 0.65 ? L[3] : DUST[cool < 0.9 ? 4 : 2];
  const face = cool < 0.38 && glow > 0.6 ? L[4] : edge;
  for (const petal of PETALS) {
    p.poly(petal.map(([x, y]) => [TX + x * k, 2 + y * k]), edge);
    if (face !== edge) p.poly(petal.map(([x, y]) => [TX + x * k * 0.88, 2 + y * k * 0.73]), face);
  }
  p.ellipse(TX, 2, 4 * k, 1.3 * k, face === edge ? edge : L[5]);
}
