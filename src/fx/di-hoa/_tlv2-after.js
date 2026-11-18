// Tinh Lien v2 part: AFTERMATH (7.1-8.3): ember petals drifting down, the lotus mark glowing in the crater, fading.
// Stub = approved draft code; Codex details it.
import { smooth } from '../../core/index.js';
import { L, hsh } from './_tinhlien-common.js';
import { flamePetal } from './_tinhlien-lotus-lib.js';
import { TX, H, SQUASH, AFTER } from './_tlv2-common.js';

export function after(p, t, layer) {
  if (layer === 'back') lotusMark(p, t); else embers(p, t);
}
function embers(p, t) {
  if (t < SQUASH[1] || t > AFTER[1]) return;
  for (let i = 0; i < 12; i++) {
    const t0 = SQUASH[1] + hsh(i, 8) * 0.4, u = (t - t0) / (0.9 + hsh(i, 9) * 0.5);
    if (u < 0 || u >= 1) continue;
    const x = H[0] + (hsh(i, 10) - 0.5) * 160 + Math.sin(u * 6 + i) * 8, y = H[1] - 30 + u * (H[1] < 0 ? -H[1] + 26 : 60);
    const s = 5 * (1 - u), a = Math.sin(u * 5 + i) * 0.8;
    if (s < 1) { p.dot(x, y, L[4]); continue; }
    flamePetal(p, x, y, x + Math.sin(a) * s * 2, y - Math.cos(a) * s * 2, s * 0.8, t, i * 2.7, { wisp: 0.5, heat: 0.3 });
  }
}
function lotusMark(p, t) {
  const k = smooth(SQUASH[1], SQUASH[1] + 0.3, t) * (1 - smooth(AFTER[1] - 0.6, AFTER[1], t));
  if (k <= 0) return;
  for (let i = 0; i < 5; i++) {
    const a = Math.PI + (i + 0.5) / 5 * Math.PI, len = 26 * k;
    p.line(TX, -1, TX + Math.cos(a) * len * 1.4, -1 + Math.sin(a) * len * 0.18, k > 0.6 ? L[4] : L[3]);
  }
  p.ellipse(TX, -1, 6 * k, 1.5 * k, L[5]);
}
