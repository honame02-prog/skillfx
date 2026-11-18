// Tinh Lien v2 part: VORTEX — the white hole opening in the fox's chest (OPEN 3.05), its fire arms, the pinch-out and
// the final ring (GONE 4.9–5.3). Library: _whitehole-lib.js (horizon, flameArm). Stub from the draft; Codex fills it.
import { smooth, clamp } from '../../core/index.js';
import { L } from './_tinhlien-common.js';
import { horizon, flameArm } from './_whitehole-lib.js';
import { H, OPEN, GONE, coreR, armK } from './_tlv2-common.js';

export function vortex(p, t, layer) {
  if (layer !== 'front') return;
  const R = coreR(t), ak = armK(t);
  if (ak > 0) for (let i = 0; i < 3; i++) flameArm(p, H[0], H[1], R + 1, R + 75 * ak, (i / 3) * Math.PI * 2, 4.2, -t * 6, 4.5, t, ak, i * 11);
  horizon(p, H[0], H[1], R, t);
  if (t > GONE[1] - 0.05 && t < GONE[1] + 0.35) {
    const u = clamp((t - GONE[1] + 0.05) / 0.4);
    p.ring(H[0], H[1], 6 + 70 * smooth(0, 1, u), 2, L[6]);
  }
}
