import { smooth } from '../../core/index.js';
import { DUST, CLOUD, hsh } from './_tinhlien-common.js';
import { crack, rock } from './_whitehole-lib.js';
import { TX, H, OPEN, DEVOUR, HOLE, AFTER, coreR } from './_tlv2-common.js';

// The first two fissures run just behind the ground line, where the debris lifts off.
const FISSURES = [
  [110, -0.08, 7], [106, Math.PI + 0.08, 12],
  [94, 0.23, 23], [89, Math.PI - 0.23, 32],
  [75, -0.45, 43], [68, Math.PI + 0.48, 51],
  [52, 0.64, 64], [44, Math.PI - 0.67, 78],
];
const RIM = [[-40, 0], [-30, -3], [-13, -4], [15, -4], [33, -2], [40, 0],
  [30, 3], [12, 5], [-10, 5], [-28, 3]];
const BOWL = [[-34, 0], [-27, -2], [-12, -3], [14, -3], [30, -2], [35, 0],
  [23, 2], [6, 3], [-14, 3], [-28, 2]];

const TEAR_START = OPEN + 0.05;
const TEAR_END = HOLE[1] - 0.2;
const LAST_CAPTURE = HOLE[1] + 0.15;
const CRATER_END = AFTER[1] - 0.24;
const DEBRIS = Array.from({ length: 36 }, (_, i) => {
  const [length, direction] = FISSURES[i % 2];
  const x = TX + Math.cos(direction) * length * (0.23 + 0.77 * hsh(i, 5));
  const y = -1 - 3 * hsh(i, 6);
  const lift = 4 + 6 * hsh(i, 8);
  const dx = x - H[0], dy = y - lift - H[1];
  const start = TEAR_START + (i + hsh(i, 1)) / 36 * (TEAR_END - TEAR_START);
  const jump = 0.09 + 0.04 * hsh(i, 2);
  const capture = Math.min(LAST_CAPTURE, start + jump + 0.46 + 0.24 * hsh(i, 4));
  // On either side, the first part of the turn carries the chunk up off the floor.
  return {
    x, y, lift, start, jump, capture, dust: 1.8 + 0.8 * hsh(i, 3),
    radius: Math.hypot(dx, dy), angle: Math.atan2(dy, dx),
    turn: Math.sign(TX - x) * (2.5 + hsh(i, 9)), size: 2.6 + 2.8 * hsh(i, 7),
  };
});

export function ground(p, t, layer) {
  if (t <= OPEN || t >= CRATER_END) return;

  if (layer === 'back') {
    const k = smooth(OPEN, OPEN + 0.22, t) * (1 - smooth(CRATER_END - 0.36, CRATER_END, t));
    if (k * 110 < 1) return;
    const hot = 1 - smooth(DEVOUR[1] + 0.08, DEVOUR[1] + 0.34, t);
    for (const [length, direction, seed] of FISSURES) {
      crack(p, TX, 0, length, direction, seed, k, hot);
    }
    if (k * 40 >= 1) {
      p.poly(RIM.map(([x, y]) => [TX + x * k, y * k]), DUST[0]);
      p.poly(BOWL.map(([x, y]) => [TX + x * k, y * k]), CLOUD[0]);
    }
    return;
  }

  if (layer !== 'front' || t < TEAR_START || t >= LAST_CAPTURE) return;
  const cutoff = coreR(t) + 2;
  for (let i = 0; i < DEBRIS.length; i++) {
    const { x, y, lift, start, jump, capture, radius, angle, turn, size, dust } = DEBRIS[i];
    const age = t - start;
    if (age < 0) break;
    if (t >= capture) continue;

    if (age < 0.26) {
      const u = age / 0.26;
      const r = dust * (1 - u);
      const drift = Math.sign(turn) * u;
      const color = DUST[u < 0.35 ? 3 : 2];
      if (r >= 0.6) p.disc(x + 6 * drift, y - 6 * u, r, color, 1);
      if (r >= 1) p.dot(x - 2 - 4 * drift, y - 1 - 8 * u, color);
    }

    if (age < jump) {
      const u = age / jump;
      rock(p, x, y - lift * u * (2 - u), size, angle + turn * u * 0.15, i);
      continue;
    }

    const u = (age - jump) / (capture - start - jump);
    const e = u * u;
    const r = radius + (cutoff - 1 - radius) * e;
    if (r <= cutoff) continue;
    const a = angle + turn * e;
    rock(p, H[0] + Math.cos(a) * r, H[1] + Math.sin(a) * r,
      size + (1 - size) * e, a + turn * 0.15, i);
  }
}
