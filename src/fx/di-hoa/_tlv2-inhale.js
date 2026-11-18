// Tinh Lien v2 part: INHALE (3.6-4.4, the climax): wind and embers drawn into the fox's chest, the fire-heart beats
// twice (BEATS), the lotus seal flares at SEAL. Stub = approved draft code; Codex details it.
import { smooth } from '../../core/index.js';
import { L, DUST, sm, hsh } from './_tinhlien-common.js';
import { flamePetal } from './_tinhlien-lotus-lib.js';
import { H, INHALE, BEATS, SEAL, OPEN } from './_tlv2-common.js';

export function inhale(p, t, layer) {
  if (layer === 'front') inhaleFront(p, t);
}
function inhaleFront(p, t) {
  if (t < INHALE[0] || t > OPEN + 0.1) return;
  const k = smooth(INHALE[0], INHALE[0] + 0.3, t);
  for (let i = 0; i < 26; i++) {
    const ph = ((t - INHALE[0]) * (1.6 + hsh(i, 1)) + hsh(i, 2)) % 1;        // each streak loops inward
    const a = hsh(i, 3) * Math.PI * 2, r = (150 - 135 * ph * ph) * (0.7 + 0.3 * hsh(i, 4));
    const x = H[0] + Math.cos(a) * r, y = H[1] + Math.sin(a) * r * 0.75, len = (4 + 10 * ph) * k;
    if (y > -1) continue;
    const ux = (H[0] - x) / (r || 1), uy = (H[1] - y) / (r || 1);
    for (let j = 0; j < len; j++) p.dot(x - ux * j, y - uy * j, j < 2 ? L[6] : j < len * 0.6 ? L[4] : DUST[4]);
  }
  // fire-heart in the chest: grows, beats
  const beat = BEATS.reduce((s, b) => s + Math.exp(-(((t - b) / 0.05) ** 2)), 0);
  const hr = (2 + 3 * smooth(INHALE[0], SEAL, t)) * (1 + 0.6 * beat);
  p.disc(H[0], H[1], hr + 1.5, L[4], 1); p.disc(H[0], H[1], hr, L[6], 1);
  for (const b of BEATS) {
    const u = (t - b) / 0.35;
    if (u > 0 && u < 1) p.ring(H[0], H[1], 6 + 46 * sm(u), u < 0.5 ? 2 : 1, u < 0.4 ? L[6] : L[4]);
  }
  // the seal: five flame petals flare round the chest for 0.18 s
  const su = (t - SEAL) / 0.18;
  if (su >= 0 && su < 1) {
    const s = 1 + 0.5 * su;
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i - 2) * 0.62;
      flamePetal(p, H[0], H[1] + 4, H[0] + Math.cos(a) * 26 * s, H[1] + 4 + Math.sin(a) * 26 * s, 7 * s, t, i * 3.3, { heat: 1, wisp: 1 });
    }
  }
}
