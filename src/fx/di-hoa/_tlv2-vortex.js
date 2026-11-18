// Tinh Lien v2 part: DEVOURING (4.35-7.1): tilted accretion disk of ivory fire round the white core, photon ring,
// lensed arc, ribbons of the devoured (the target, pieces of the fox), the squash to a line, flash and shock rings.
// Library: _devour-lib.js (accretion, core, ribbon). Stub = approved draft code; Codex details it.
import { clamp, hex } from '../../core/index.js';
import { L, sm } from './_tinhlien-common.js';
import { accretion, core, ribbon } from './_devour-lib.js';
import { TX, H, OPEN, DEVOUR, SQUASH, coreR, diskK, flat } from './_tlv2-common.js';

const WOOD = ['#4a2c14', '#8a5a2a', '#c08a4a'].map(hex), IVR = [hex('#b3a490'), L[4], L[6]];
export function vortex(p, t, layer) {
  if (layer !== 'front') return;
  const DEV = DEVOUR, R = coreR(t), dk = diskK(t) * (1 - 0.3 * flat(t));
  if (t > OPEN && t < SQUASH[1]) {
    accretion(p, H[0], H[1], R, t, dk, 'back', flat(t));
    ribbon(p, H[0], H[1], TX + 6, -22, sm(clamp((t - DEV[0] - 0.3) / 1.3)), 4.5, 7, WOOD, t, 1);
    for (let i = 0; i < 4; i++) ribbon(p, H[0], H[1], H[0] + [-26, 24, -6, 12][i], H[1] + [-30, -22, -48, 10][i], sm(clamp((t - DEV[0] - i * 0.15) / 0.9)), 3.4, 6 + i, IVR, t, 3 + i);
    core(p, H[0], H[1], R * (1 - 0.6 * flat(t)), t);
    accretion(p, H[0], H[1], R, t, dk, 'front', flat(t));
  }
  const u = (t - SQUASH[1]) / 0.45;
  if (u >= 0 && u < 1) {
    if (u < 0.08) p.disc(H[0], H[1], 12, L[6], 1);
    p.ring(H[0], H[1], 8 + 110 * sm(u), u < 0.5 ? 2 : 1, u < 0.5 ? L[6] : L[4]);
    p.ring(H[0], H[1], 4 + 70 * sm(u), 1, L[5]);
    p.line(H[0] - 140 * (1 - u), H[1], H[0] + 140 * (1 - u), H[1], u < 0.4 ? L[6] : L[4]);
  }
}
