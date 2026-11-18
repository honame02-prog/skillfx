// The flame lotus on the target's chest, from first bloom to compression.
import { clamp, smooth } from '../../core/index.js';
import { L, APPEAR, OPENS, LOCK, BOOM, LC, out3, hsh } from './_tinhlien-common.js';
import { flameLotus } from './_tinhlien-lotus-lib.js';

const EMBERS = Array.from({ length: 6 }, (_, i) => [hsh(i, 6), hsh(i, 7)]);
const SPARKS = Array.from({ length: 7 }, (_, i) => {
  const a = -Math.PI / 2 + (i - 3) * 0.49 + (hsh(i, 15) - 0.5) * 0.2;
  return [Math.cos(a), Math.sin(a), i / 7, hsh(i, 16)];
});

function embers(p, t, cx, cy, scale, presence, crush) {
  for (let i = 0; i < EMBERS.length; i++) {
    const [seed, drift] = EMBERS[i];
    const age = (t * 1.5 + i / EMBERS.length) % 1;
    const size = presence * smooth(0, 0.1, age) * (1 - smooth(0.54, 1, age)) * (1 - crush);
    if (size < 0.5) continue;
    const side = i % 2 ? 1 : -1;
    const x = cx + side * (16 + 14 * seed - age * 5) * scale + Math.sin(t * 6 + i) * age * 3;
    const y = cy - (10 + 9 * drift + age * 30) * scale;
    const h = (4.5 + seed * 3) * size, w = (1.2 + drift * 0.7) * size;
    p.poly([[x, y], [x - w, y - h * 0.35], [x + side * w * 0.7, y - h],
      [x + w, y - h * 0.42], [x + w * 0.65, y - h * 0.12]], L[4]);
    p.line(x, y - h * 0.25, x + side * w * 0.55, y - h * 0.71, L[6]);
  }
}

export function lotus(p, t, layer) {
  if (t <= APPEAR || t >= BOOM) return;

  const bloom = out3(clamp((t - APPEAR) / 0.35));
  const k = out3(clamp((t - APPEAR) / 0.06));
  let pulse = 0;
  for (const at of OPENS) {
    pulse += smooth(at, at + 0.05, t) * (1 - smooth(at + 0.05, at + 0.15, t));
  }
  const crush = smooth(LOCK, BOOM, t);
  // The library's size is nominal. At this scale the open bloom peaks at 46 px.
  const size = (0.8 + 0.49 * bloom) * (1 + 0.06 * pulse);
  const [cx, chestY] = LC;
  const cy = chestY + 5;

  // Skip the empty margins in the library's padded petal shader boxes.
  const petals = {
    shade(x0, y0, x1, y1, shade) {
      p.shade(x0 + 5, y0 + 11, x1 - 5, y1 - 7, shade);
    },
    glow(x, y, r, color, strength) {
      p.glow(x, y, r, color, strength);
    },
  };
  flameLotus(petals, cx, cy, size, t, {
    open: 0.3 + 0.7 * bloom, crush: crush + 0.1 * pulse, k, layer, seed: 0,
  });

  if (layer === 'back') return;
  embers(p, t, cx, cy, (0.66 + 0.34 * bloom) * (1 - 0.45 * crush), k, crush);

  const flare = smooth(0.2, 1, crush);
  if (flare <= 0) return;
  p.glow(LC[0], LC[1], 7 + 8 * flare, L[5], 0.36 * flare);
  for (const [dx, dy, phase, seed] of SPARKS) {
    const age = ((t - LOCK) * 5 + phase) % 1;
    if (age > 0.45 + 0.37 * flare) continue;
    const r = 1 + age * (11 + 13 * flare), length = 1 + (1 - age) * (2 + seed * 2) * flare;
    p.line(LC[0] + dx * r, LC[1] + dy * r,
      LC[0] + dx * (r + length), LC[1] + dy * (r + length), L[age < 0.3 ? 6 : 4]);
  }
}
