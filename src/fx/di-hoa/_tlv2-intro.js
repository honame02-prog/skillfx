// Tinh Lien v2 intro: ivory mist gathers into the fox, then the flame-lotus sheds six petals.
import { TAU } from '../../core/index.js';
import { flamePetal } from './_tinhlien-lotus-lib.js';
import { hsh, sm } from './_tinhlien-common.js';
import { IV, wisp } from './_whitehole-lib.js';
import { F, TX, FORM, SHED0, SHEDN, FLY, PRESS, shedT } from './_tlv2-common.js';

const WISP_COUNT = 12;
const IMPACT_TIME = 0.12;
const FLASH_TIME = 1 / 30;

function gather(p, t, [chestX, chestY]) {
  for (let i = 0; i < WISP_COUNT; i++) {
    const delay = FORM[0] + i * 0.018;
    const end = FORM[1] - 0.13 * hsh(i, 11);
    const u = (t - delay) / (end - delay);
    if (u <= 0 || u >= 1) continue;

    const spin = (i + hsh(i, 12) * 0.8) * TAU / WISP_COUNT + u * 3.8;
    const radius = (53 + 37 * hsh(i, 13)) * (1 - u * u);
    const rise = sm(u);
    const cx = F[0] + (chestX - F[0]) * rise;
    const cy = F[1] - 14 + (chestY - F[1] + 14) * rise;
    const x = cx + Math.cos(spin) * radius;
    const sin = Math.sin(spin);
    const y = cy + sin * radius * (sin > 0 ? 0.2 : 0.75);
    const k = Math.min(u * 12, 1) * (1 - u * u);
    const len = (12 + 7 * hsh(i, 14)) * (1 - 0.45 * u);
    wisp(p, x, y, len, Math.atan2(cy - y, cx - x) - 1.1, t, k, i * 3.1);

    if (i % 3 === 0 && hsh(i, 15) < k) p.dot(x - 3 * sin, y - 3, IV[4]);
  }
}

function impact(p, t, x, y, age, seed) {
  const u = age / IMPACT_TIME;
  for (let j = 0; j < 7; j++) {
    const angle = (j + 0.5 * hsh(j, seed)) * TAU / 7 + seed;
    const spread = 2 + u * (6 + 5 * hsh(j, seed + 1));
    const len = (8 + 5 * hsh(j, seed + 2)) * (1 - u);
    if (len < 1) continue;
    const bx = x + Math.cos(angle) * spread, by = y + Math.sin(angle) * spread;
    if (len > 3) p.dot(bx, by, IV[0]);
    wisp(p, bx, by, len, angle - 0.7, t, 1, j + seed);
  }
  if (age < FLASH_TIME) p.disc(x, y, 3, IV[5], 1);
}

/** r: the fox return value ({ chest, lotusTop, size }) or null; layer 'back' | 'front' */
export function intro(p, t, layer, r) {
  if (!r || t >= PRESS[0]) return;
  if (layer === 'back') {
    if (t >= FORM[0] && t < FORM[1]) gather(p, t, r.chest);
    return;
  }
  if (layer !== 'front' || t < SHED0) return;

  for (let i = 0; i < SHEDN; i++) {
    const start = shedT(i);
    if (t < start) break;
    const age = t - (start + FLY);
    if (age >= IMPACT_TIME) continue;

    const ex = TX + (hsh(i, 3) - 0.5) * 12, ey = -24;
    if (age >= 0) {
      impact(p, t, ex, ey, age, i * 5.3);
      continue;
    }

    const u = (t - start) / FLY;
    const side = i & 1 ? 1 : -1;
    const sx = r.lotusTop[0] + side * (18 + hsh(i, 2) * 22) * r.size * 0.4;
    const sy = r.lotusTop[1] + 10;
    const arc = side * 38;
    const x = sx + (ex - sx) * u + arc * Math.sin(u * Math.PI);
    const y = sy + (ey - sy) * u * u;
    const vx = ex - sx + arc * Math.cos(u * Math.PI) * Math.PI;
    const vy = (ey - sy) * 2 * u + 1;
    const heading = Math.atan2(vy, vx);
    const angle = heading + 0.9 * Math.sin(u * TAU * 1.25 + i * 0.9);
    const bx = x - Math.cos(angle) * 13, by = y - Math.sin(angle) * 13;

    const dx = Math.cos(heading), dy = Math.sin(heading);
    const trail = 5 - Math.floor(u * 3);
    for (let j = 1; j <= trail; j++) {
      const drift = (hsh(j, i + 21) - 0.5) * j * 0.55;
      p.dot(bx - dx * j - dy * drift, by - dy * j + dx * drift, IV[j < 3 ? 5 : j < 5 ? 3 : 2]);
    }
    flamePetal(p, bx, by, x, y, 4.5, t, i * 5.3, { wisp: 0.8, heat: 0.5, side });
  }
}
