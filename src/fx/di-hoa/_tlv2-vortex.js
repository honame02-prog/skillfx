import { clamp, hex, TAU } from '../../core/index.js';
import { DUST, L, hsh, sm } from './_tinhlien-common.js';
import { accretion, core, ribbon, TILT } from './_devour-lib.js';
import { TX, H, OPEN, DEVOUR, SQUASH, coreR, diskK, flat } from './_tlv2-common.js';

const [HX, HY] = H;
const WOOD = ['#4a2c14', '#8a5a2a', '#c08a4a'].map(hex);
const IVORY = [DUST[4], L[4], L[6]];
const EARTH = [DUST[2], DUST[3], DUST[4]];
const FOX_OFFSETS = [[-26, -30], [24, -22], [-6, -48], [12, 10]];
const GROUND_OFFSETS = [-46, 82, -112, 52, -77, 118, -60, 98];
const TARGET_VANISH = DEVOUR[0] + 0.3;
const TWO_FRAMES = 2 / 30;
const FLASH_LENGTH = 0.45;
const FLOOR_LIMIT = 24;

function drawRibbons(p, t) {
  const wood = (t - TARGET_VANISH) / 1.3;
  if (wood > 0 && wood < 1) ribbon(p, HX, HY, TX + 6, -22, sm(wood), 4.5, 7, WOOD, t, 1);

  for (let i = 0; i < FOX_OFFSETS.length; i++) {
    const u = (t - DEVOUR[0] - i * 0.15) / 0.9;
    if (u <= 0 || u >= 1) continue;
    const [dx, dy] = FOX_OFFSETS[i];
    ribbon(p, HX, HY, HX + dx, HY + dy, sm(u), 3.4, 6 + i, IVORY, t, 3 + i);
  }

  for (let i = 0; i < GROUND_OFFSETS.length; i++) {
    const u = (t - 5 - i * 0.14) / 0.42;
    if (u <= 0 || u >= 1) continue;
    ribbon(p, HX, HY, TX + GROUND_OFFSETS[i], -2, u, 1.5 + hsh(i, 14), 5 + hsh(i, 15) * 3, EARTH, t, 16 + i);
  }
}

function diskFlares(p, R, k, age, front) {
  const phase = (age + 0.05) % 0.45;
  if (phase >= 0.33) return;
  const pulse = Math.sin(phase / 0.33 * Math.PI);
  const taper = Math.min(1, phase / 0.04, (0.33 - phase) / 0.04);
  if (taper <= 0) return;
  const span = (10 + pulse * 10) * taper * TAU / 360;
  const count = pulse > 0.45 ? 3 : 2;
  for (let i = 0; i < count; i++) {
    const radius = R * (1.34 + k * (0.62 + i * 0.26));
    // Follow the main accretion band (5a - 13t) on the same tilted ellipse.
    const angle = age * (13 / 5) + i * (TAU / 3);
    for (let j = 0; j < 6; j++) {
      const a = angle + span * (j / 6 - 0.5), b = a + span / 6;
      if ((Math.sin((a + b) / 2) > 0) !== front) continue;
      p.line(HX + radius * Math.cos(a), HY + radius * TILT * Math.sin(a),
        HX + radius * Math.cos(b), HY + radius * TILT * Math.sin(b), L[6]);
    }
  }
}

function drawDisk(p, radius, t, k, half, squash) {
  if (radius < 1 || k <= 0) return;
  // Cull the disk's empty center and corners before invoking the library shader.
  const innerSq = (radius * 1.3) ** 2;
  const outer = radius * (1.5 + 1.7 * k) + 3;
  const outerSq = outer * outer;
  const tilt = TILT * (1 - 0.92 * squash);
  const front = half === 'front';
  const clipped = {
    shade(_x0, _y0, _x1, _y1, shadePixel) {
      p.shade(HX - outer, front ? HY : HY - outer * tilt, HX + outer, front ? HY + outer * tilt : HY, (x, y, out) => {
        const dy = (y - HY) / tilt;
        const distanceSq = (x - HX) ** 2 + dy * dy;
        if (distanceSq >= innerSq && distanceSq <= outerSq) return shadePixel(x, y, out);
      });
    },
  };
  accretion(clipped, HX, HY, radius, t, k, half, squash);
}

function shockRing(p, radius, width, color) {
  const outerSq = radius * radius, innerSq = (radius - width) ** 2;
  p.shade(HX - radius, HY - radius, HX + radius, Math.min(FLOOR_LIMIT, HY + radius), (x, y) => {
    const distanceSq = (x - HX) ** 2 + (y - HY) ** 2;
    if (y <= FLOOR_LIMIT && distanceSq >= innerSq && distanceSq <= outerSq) return color;
  });
}

function flash(p, age) {
  const u = age / FLASH_LENGTH;
  const spread = sm(u);
  const taper = clamp((1 - u) * 4);
  if (age < TWO_FRAMES) p.circle(HX, HY, 12, L[6]);
  shockRing(p, 8 + 110 * spread, u < 0.5 ? 2 : taper, u < 0.5 ? L[6] : L[4]);
  shockRing(p, 4 + 70 * spread, taper, L[5]);
  const reach = 140 * (1 - u);
  p.line(HX - reach, HY, HX + reach, HY, u < 0.4 ? L[6] : L[4]);

  for (let i = 0; i < 12; i++) {
    const angle = (i + 0.6 * hsh(i, 21)) * TAU / 12;
    const radius = 13 + (45 + 34 * hsh(i, 22)) * (1 - (1 - u) ** 2);
    const size = (1.2 + hsh(i, 23)) * (1 - u);
    if (size < 0.6) continue;
    p.circle(HX + Math.cos(angle) * radius, HY + Math.sin(angle) * radius * 0.65,
      size, i % 3 === 0 ? L[4] : L[5]);
  }
}

export function vortex(p, t, layer) {
  if (layer !== 'front' || t < OPEN || t >= SQUASH[1] + FLASH_LENGTH) return;
  if (t >= SQUASH[1]) {
    flash(p, t - SQUASH[1]);
    return;
  }

  const squash = flat(t), radius = coreR(t);
  const k = diskK(t) * (1 - 0.3 * squash);
  const diskAge = t - TARGET_VANISH;
  const alive = diskAge >= 0 && t < SQUASH[0];
  drawDisk(p, radius, t, k, 'back', squash);
  if (alive) diskFlares(p, radius, k, diskAge, false);
  drawRibbons(p, t);
  core(p, HX, HY, radius * (1 - 0.6 * squash), t);
  if (alive && diskAge % 0.5 < 0.12) p.ring(HX, HY, radius + 3.4, 1.1, L[6]);
  drawDisk(p, radius, t, k, 'front', squash);
  if (alive) diskFlares(p, radius, k, diskAge, true);

  const opening = t - OPEN;
  if (opening < TWO_FRAMES) {
    p.circle(HX, HY, 2 + 4 * clamp(opening * 30), L[6]);
  }
}
