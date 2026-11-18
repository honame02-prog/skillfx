// Tinh Lien v2 intro: ivory mist gathers into the fox, then the flame-lotus sheds eight petals.
import { TAU } from '../../core/index.js';
import { flamePetal } from './_tinhlien-lotus-lib.js';
import { hsh, sm } from './_tinhlien-common.js';
import { IV, wisp } from './_whitehole-lib.js';
import { F, TX, FORM, SHED0, SHEDN, FLY, PRESS, shedT } from './_tlv2-common.js';

const WISP_COUNT = 12;
const FLICKER_COUNT = 7;
const FLICKER_TIME = 0.07;
const IMPACT_TIME = 0.12;
const FLASH_TIME = 1 / 30;
const LAST_HIT = shedT(SHEDN - 1) + FLY;

function gather(p, t, layer, [chestX, chestY]) {
  const front = layer === 'front';
  for (let i = 0; i < (front ? FLICKER_COUNT : WISP_COUNT); i++) {
    const delay = FORM[0] + i * 0.018;
    const end = i < FLICKER_COUNT ? FORM[1] - 0.53 + i * 0.075 : FORM[1] - 0.05 * hsh(i, 11);
    if (front ? t < end || t >= end + FLICKER_TIME : t <= delay || t >= end) continue;

    const phase = ((i * 5) % WISP_COUNT + hsh(i, 12) * 0.8) * TAU / WISP_COUNT;
    const arrival = phase + 3.8;
    const ax = chestX + 9 * Math.cos(arrival);
    const ay = chestY + 6 * Math.sin(arrival);
    if (front) {
      const left = 1 - (t - end) / FLICKER_TIME;
      const angle = -Math.PI / 2 + 0.5 * Math.cos(arrival);
      wisp(p, ax, ay, (5 + 3 * hsh(i, 16)) * left, angle, t, 1, i * 3.1);
      if (left > 0.4) p.disc(ax, ay, 1.5 * left, IV[5], 1);
      continue;
    }

    const u = (t - delay) / (end - delay);
    const spin = phase + u * 3.8;
    const radius = (53 + 37 * hsh(i, 13)) * (1 - u * u);
    const rise = sm(u);
    const cx = F[0] + (ax - F[0]) * rise;
    const cy = F[1] - 14 + (ay - F[1] + 14) * rise;
    const x = cx + Math.cos(spin) * radius;
    const sin = Math.sin(spin);
    const y = cy + sin * radius * (sin > 0 ? 0.2 : 0.75);
    const k = Math.min(u * 12, 1) * (1 - u * u);
    const len = (12 + 7 * hsh(i, 14)) * (1 - 0.45 * u);
    wisp(p, x, y, len, Math.atan2(cy - y, cx - x) - 1.1, t, k, i * 3.1);

    if (i % 3 === 0 && hsh(i, 15) < k) p.dot(x - 3 * sin, y - 3, IV[4]);
  }
}

function impact(p, t, x, y, age, seed, heavy, side) {
  const u = age / IMPACT_TIME;
  const splash = heavy && age < 2 * FLASH_TIME;
  const count = heavy ? 10 : 7;
  if (splash) p.disc(x, y, 6 - 2 * u, IV[0], 1);
  for (let j = 0; j < count; j++) {
    if (heavy && !splash && hsh(j, seed + 3) > 1 - u) continue;
    const angle = (j + 0.5 * hsh(j, seed)) * TAU / count + seed;
    const spread = (heavy ? 5 : 2) + u * (6 + 5 * hsh(j, seed + 1));
    const len = ((heavy ? 13 : 8) + 5 * hsh(j, seed + 2)) * (1 - u);
    if (len < 1) continue;
    const bx = x + Math.cos(angle) * spread, by = y + Math.sin(angle) * spread;
    if (len > 3) p.dot(bx, by, IV[0]);
    wisp(p, bx, by, len, angle - (heavy ? 1.1 : 0.7), t, 1, j + seed);
    if (splash) p.disc(bx, by, 1.7 - u, IV[5], 1);
  }
  if (splash || age < FLASH_TIME) p.disc(x, y, heavy ? 4.5 - 2 * u : 3, IV[5], 1);

  if (!heavy) return;
  for (let j = 0; j < 4; j++) {
    if (hsh(j, seed + 8) > 1 - u * u) continue;
    const a = -Math.PI / 2 + side * 0.32 + (j - 1.5) * 0.3;
    const d = 9 + u * (18 + 20 * hsh(j, seed + 9));
    p.disc(x + Math.cos(a) * d, y + Math.sin(a) * d, 1.65 - u, IV[u < 0.45 ? 5 : 3], 1);
  }
}

/** r: the fox return value ({ chest, lotusTop, size }) or null; layer 'back' | 'front' */
export function intro(p, t, layer, r) {
  if (!r || t < FORM[0] || t >= LAST_HIT + IMPACT_TIME) return;
  if (t < FORM[1]) {
    if (layer === 'front' || layer === 'back') gather(p, t, layer, r.chest);
    return;
  }
  if (layer !== 'front' || t < SHED0) return;

  for (let i = 0; i < SHEDN; i++) {
    const start = shedT(i);
    if (t < start) break;
    const age = t - (start + FLY);
    if (age >= IMPACT_TIME) continue;

    const heavy = i % 3 === 1;
    const side = i & 1 ? 1 : -1;
    const ex = TX + (hsh(i, 3) - 0.5) * 12, ey = -24;
    if (age >= 0) {
      impact(p, t, ex, ey, age, i * 5.3, heavy, side);
      continue;
    }
    if (t >= PRESS[0]) continue;

    const u = (t - start) / FLY;
    // The outer petals sit lower and farther out than the upright bud.
    const rim = hsh(i, 2);
    const sx = r.lotusTop[0] + side * (19 + 8 * rim) * r.size;
    const sy = r.lotusTop[1] + (13 + 12 * rim) * r.size;
    const arc = side * 52;
    const x = sx + (ex - sx) * u + arc * Math.sin(u * Math.PI);
    const y = sy + (ey - sy) * u * u;
    const vx = ex - sx + arc * Math.cos(u * Math.PI) * Math.PI;
    const vy = (ey - sy) * 2 * u + 1;
    const heading = Math.atan2(vy, vx);
    const angle = heading + side * u * TAU + 0.45 * Math.sin(u * TAU * 1.25 + i * 0.9);
    const scale = heavy ? 1.3 : 1;
    const length = 13 * scale;
    const bx = x - Math.cos(angle) * length, by = y - Math.sin(angle) * length;

    const dx = Math.cos(heading), dy = Math.sin(heading);
    const trail = 5 - Math.floor(u * 3);
    for (let j = 1; j <= trail; j++) {
      const drift = (hsh(j, i + 21) - 0.5) * j * 0.55;
      p.dot(bx - dx * j - dy * drift, by - dy * j + dx * drift, IV[j < 3 ? 5 : j < 5 ? 3 : 2]);
    }
    flamePetal(p, bx, by, x, y, 4.5 * scale, t, i * 5.3, { wisp: 0.8, heat: 0.5, side });
  }
}
