// Tinh Lien v2: wind, two fire-heart beats and a lotus seal in the fox's chest.
import { clamp, smooth } from '../../core/index.js';
import { L, DUST, hsh } from './_tinhlien-common.js';
import { IV, rock } from './_whitehole-lib.js';
import { flamePetal } from './_tinhlien-lotus-lib.js';
import { TX, H, INHALE, BEATS, SEAL, OPEN } from './_tlv2-common.js';

const [HX, HY] = H;
const TAU = Math.PI * 2;
const CUTOFF = OPEN + 0.15;
const SEAL_GROW = 0.2;
const SEAL_CLOSE = 0.12;
const PETAL_TONES = new Map([[L[3], L[1]], [L[4], L[2]], [L[5], L[3]], [L[6], L[5]]]);

const WIND = Array.from({ length: 36 }, (_, i) => {
  const side = i < 18 ? -1 : 1;
  const row = i % 18;
  const dust = row < 4;
  const sky = row >= 12;
  const x = dust ? TX + side * (128 + 12 * hsh(i, 1))
    : sky ? HX + side * (15 + (row - 12 + hsh(i, 1)) * 20)
      : side < 0 ? -56 + 27 * hsh(i, 1) : 296 - 17 * hsh(i, 1);
  const y = dust ? -1 - 2 * hsh(i, 2)
    : sky ? -290 + 38 * hsh(i, 2)
      : -15 - (row - 4 + hsh(i, 2)) * 29;
  const dx = x - HX, dy = y - HY;
  return { dx, dy, reach: Math.hypot(dx, dy), dust, phase: hsh(i, 3), speed: 1 + 0.4 * hsh(i, 4) };
});
const windTone = (u) => u < 0.2 ? L[6] : u < 0.65 ? L[4] : DUST[4];
const dustTone = (u) => u < 0.35 ? DUST[3] : DUST[2];

function wind(p, t) {
  const u = clamp((t - INHALE[0]) / (INHALE[1] - INHALE[0]));
  const pull = 0.55 * u + 1.15 * u * u; // rate rises across the inhale
  const strength = smooth(INHALE[0], INHALE[0] + 0.16, t) * (1 - smooth(SEAL, INHALE[1], t));
  if (strength <= 0) return;
  for (let i = 0; i < WIND.length; i++) {
    const { dx, dy, reach, dust, phase, speed } = WIND[i];
    const f = (pull * speed + phase) % 1;
    const head = 1 - f;
    const tail = Math.min(1, head + (5 + 12 * u + 6 * f) * strength / reach);
    const x = HX + dx * head, y = HY + dy * head;
    if ((tail - head) * reach >= 1) {
      p.line(x, y, HX + dx * tail, HY + dy * tail, dust ? dustTone : windTone);
    }
    if (dust && head * strength > 0.12) {
      rock(p, x, y, (2 + 1.5 * strength) * Math.sqrt(head), pull * 3 + i, i);
      if (head * strength > 0.25) p.dot(HX + dx * tail, HY + dy * tail - 1, DUST[4]);
    }
  }

  for (let arm = 0; arm < 3; arm++) {
    const turns = 2 + arm * 0.5;
    for (let j = 0; j < 8; j++) {
      const f = (pull * 0.84 + (j + 0.3 * arm) / 8) % 1;
      if (strength * Math.min(f * 6, (1 - f) * 8, 1) <= hsh(j, arm + 10) * 0.65) continue;
      const a = TAU * (arm / 3 + turns * f);
      const r = (55 + arm * 8) * (1 - f) ** 1.45;
      p.dot(HX + Math.cos(a) * r, HY + Math.sin(a) * r * 0.78, j % 3 === 0 ? L[6] : L[5]);
    }
  }
}

function fireHeart(p, petals, t) {
  let pulse = 0;
  for (const beat of BEATS) {
    const dt = t - beat;
    // Peak on the beat, with 20 ms of anticipation and an 80 ms release.
    const swell = smooth(-0.02, 0, dt) * (1 - smooth(0, 0.08, dt));
    pulse += swell;

    const u = dt / 0.35;
    if (u >= 0 && u < 1) {
      const r = 6 + 46 * (1 - (1 - u) ** 2);
      p.ring(HX, HY, r, u < 0.5 ? 2 : 1, u < 0.4 ? L[6] : u < 0.8 ? L[4] : DUST[4]);
    }
    if (swell <= 0.05) continue;
    for (let i = 0; i < 8; i++) {
      const a = TAU * (i + 0.25) / 8;
      const dx = Math.cos(a), dy = Math.sin(a);
      const root = 5 + 22 * Math.max(0, dt);
      const tip = root + (6 + 3 * hsh(i, beat)) * swell;
      flamePetal(petals, HX + dx * root, HY + dy * root, HX + dx * tip, HY + dy * tip,
        1.8 * swell, t, i, { heat: 0.8, dim: 1, wisp: 0 });
    }
  }
  const life = 1 - smooth(OPEN, INHALE[1] + 0.05, t);
  const idle = 0.25 * Math.sin((t - INHALE[0]) * 24) * (1 - pulse);
  const r = life * (2 + 4 * smooth(INHALE[0], SEAL, t) + idle) * (1 + 0.6 * pulse);
  if (r < 0.65) return;
  p.circle(HX, HY, r + life * 1.5, L[3]);
  p.circle(HX, HY, r, L[6]);
}

function lotusSeal(p, petals, t) {
  const age = t - SEAL;
  if (age < 0) return;
  const spread = smooth(0, SEAL_GROW, age);
  // The culling radius is reached before the cutoff, with subpixel petal widths.
  const size = (1 - clamp((age - SEAL_GROW) / SEAL_CLOSE)) ** 2;
  const r = (26 + 10 * spread) * size;
  if (r < 2) return;
  p.ring(HX, HY, 30 * size, 1, IV[3]);
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.62;
    const dx = Math.cos(a), dy = Math.sin(a);
    const x = HX + dx * r, y = HY + dy * r;
    flamePetal(petals, HX + dx * 4 * size, HY + (dy * 4 + 2) * size,
      x, y, (4.5 + spread) * size, t, i * 3.3,
      { heat: 1, dim: 1.5, wisp: 0.35 * size });
    if (size > 0.5) p.circle(x, y, 1.6 * size, L[2]);
    p.dot(x, y, L[6]);
  }
}

export function inhale(p, t, layer) {
  if (layer !== 'front' || t < INHALE[0] || t >= CUTOFF) return;
  wind(p, t);
  // Use warm, opaque petal tiers so the fan reads against the white chest.
  const petals = {
    shade(x0, y0, x1, y1, paint) {
      p.shade(x0, y0, x1, y1, (x, y, out) => {
        paint(x, y, out);
        out.c = PETAL_TONES.get(out.c) ?? out.c;
        out.k = 0;
      });
    },
  };
  fireHeart(p, petals, t);
  lotusSeal(p, petals, t);
}
