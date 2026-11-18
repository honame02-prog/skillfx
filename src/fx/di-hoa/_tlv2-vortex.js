// Tinh Lien v2: the white hole in the fox's chest.
import { clamp, TAU } from '../../core/index.js';
import { hsh, L, out3 } from './_tinhlien-common.js';
import { flameArm, horizon, IV } from './_whitehole-lib.js';
import { armK, coreR, devourAt, GONE, H, OPEN } from './_tlv2-common.js';

const [CX, CY] = H;
const FLASH_TIME = 1 / 30;
const FRAME_EPSILON = 1e-9; // Act time accumulates fractional frame steps.
const MAX_REACH = 83; // Leaves room for arm widths and streak tips above y = 25.

const streams = Array.from({ length: 28 }, (_, i) => ({
  angle: hsh(i, 2) * TAU,
  phase: hsh(i, 3),
  rate: 0.85 + hsh(i, 4) * 0.7,
  reach: 0.65 + hsh(i, 5) * 0.35,
  length: 2 + hsh(i, 6) * 4,
}));

function inflow(p, t, front, inner, span, turns, spin) {
  for (let i = front ? 1 : 0; i < streams.length; i += 2) {
    const stream = streams[i];
    const cycle = stream.phase + (t - OPEN) * stream.rate;
    const phase = cycle - Math.floor(cycle);
    if (phase < 0.025 || phase > 0.975) continue; // Leave a gap when the streak recycles.
    const s = phase * phase; // The radial speed increases as the streak approaches the core.
    const reach = span * stream.reach;
    const radius = inner + reach * (1 - s);
    const angle = stream.angle + spin + turns * s * s;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const x = CX + cos * radius, y = CY + sin * radius;

    const tangent = 2 * turns * s * radius;
    const scale = stream.length / Math.hypot(reach, tangent);
    const tipX = x + scale * (-reach * cos - tangent * sin);
    const tipY = y + scale * (-reach * sin + tangent * cos);
    const tone = front ? (s > 0.55 ? 5 : 4) : (s > 0.55 ? 3 : 2);
    p.line(x, y, tipX, tipY, IV[tone]);
  }
}

function burstRing(p, radius, color, coverage) {
  const outer = radius * radius, inner = Math.max(0, radius - 2) ** 2;
  const tile = 16;
  for (let y = -radius; y < radius; y += tile) {
    const bottom = Math.min(y + tile, radius);
    const nearY = Math.max(y, -bottom, 0), farY = Math.max(-y, bottom);
    for (let x = -radius; x < radius; x += tile) {
      const right = Math.min(x + tile, radius);
      const nearX = Math.max(x, -right, 0), farX = Math.max(-x, right);
      if (nearX ** 2 + nearY ** 2 > outer || farX ** 2 + farY ** 2 < inner) continue;
      p.shade(CX + x, CY + y, CX + right, CY + bottom, (px, py) => {
        const dx = px - CX, dy = py - CY;
        if (dx < x || dx >= right || dy < y || dy >= bottom) return;
        const distance = dx * dx + dy * dy;
        if (distance < inner || distance > outer) return;
        if (coverage === 1 || hsh(Math.floor(px) + 367 * Math.floor(py), 14) < coverage) return color;
      });
    }
  }
}

function pinchBurst(p, age) {
  const u = age / 0.4, travel = out3(u);
  burstRing(p, 6 + 74 * travel, u < 0.35 ? L[6] : L[4], clamp((1 - u) / 0.2));
  for (let i = 0; i < 8; i++) {
    const angle = (i + hsh(i, 11) * 0.6) * TAU / 8;
    const radius = 6 + (48 + hsh(i, 12) * 24) * travel;
    const size = (1.4 + hsh(i, 13) * 0.7) * (1 - u);
    if (size < 0.5) continue;
    p.disc(CX + Math.cos(angle) * radius, CY + Math.sin(angle) * radius, size, IV[u < 0.35 ? 5 : 3], 1);
  }
  if (age < FLASH_TIME - FRAME_EPSILON) p.disc(CX, CY, 10, L[6], 1);
}

export function vortex(p, t, layer) {
  const front = layer === 'front';
  if (t < OPEN || (layer !== 'back' && !front)) return;
  if (t >= GONE[1] - FRAME_EPSILON) {
    const age = Math.max(0, t - GONE[1]);
    if (front && age < 0.4) pinchBurst(p, age);
    return;
  }

  const radius = coreR(t), presence = armK(t);
  const turns = 4.2 + 1.3 * devourAt(t), spin = -t * 6;
  const inner = radius + 1;
  const span = Math.min(75 * presence, MAX_REACH - inner);
  if (presence > 0.2) inflow(p, t, front, inner, span, turns, spin);
  if (!front) return;

  if (presence > 0) {
    for (let i = 0; i < 3; i++) {
      const angle = i * TAU / 3;
      flameArm(p, CX, CY, inner, inner + span, angle, turns, spin, 4.5, t, presence, i * 11);
      flameArm(p, CX, CY, inner, inner + span * 0.7, angle + TAU / 6, turns, spin, 2.5, t, presence, i * 11 + 5);
    }
  }

  if (t >= GONE[0] && radius <= 2) p.disc(CX, CY, 2, L[6], 1);
  else horizon(p, CX, CY, radius, t);

  const opening = t - OPEN;
  const flash = opening < 0.06 ? 2 + 3 * opening / 0.06 : 5 * clamp(1 - (opening - 0.06) / 0.05);
  if (flash >= 0.5) p.disc(CX, CY, flash, L[6], 1);
}
