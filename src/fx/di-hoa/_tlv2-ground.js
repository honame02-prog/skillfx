// Tinh Lien v2 part: GROUND — cracks radiating under the fox as the vortex opens, the crater, rocks torn up and
// spiralling into the white hole (DEVOUR 3.1 .. HOLE end 4.9), settling dust. Library: _whitehole-lib.js (rock, crack).
// Stub from the draft; Codex fills it.
import { smooth } from '../../core/index.js';
import { DUST, CLOUD, hsh } from './_tinhlien-common.js';
import { rock } from './_whitehole-lib.js';
import { TX, END, H, DEVOUR, coreR } from './_tlv2-common.js';

export function ground(p, t, layer) {
  if (layer === 'back') {
    const ck = smooth(DEVOUR[0], DEVOUR[0] + 0.8, t) * (1 - smooth(END - 0.6, END - 0.15, t));
    if (ck > 0) { p.ellipse(TX, 1, 42 * ck, 5 * ck, DUST[0]); p.ellipse(TX, 0, 34 * ck, 3 * ck, CLOUD[0]); }
    return;
  }
  for (let i = 0; i < 28; i++) {
    const t0 = DEVOUR[0] + 0.1 + hsh(i, 1) * 1.1, u = (t - t0) / (0.7 + hsh(i, 4) * 0.5);
    if (u < 0 || u >= 1) continue;
    const x0 = TX + (hsh(i, 5) - 0.5) * 230, y0 = -1 - hsh(i, 6) * 4;
    const dx = x0 - H[0], dy = y0 - H[1], r0 = Math.hypot(dx, dy), a0 = Math.atan2(dy, dx);
    const e = u * u, r = r0 * (1 - e), a = a0 - 2.6 * e;
    if (r < coreR(t)) continue;
    rock(p, H[0] + Math.cos(a) * r, H[1] + Math.sin(a) * r, (2 + hsh(i, 7) * 4) * (1 - 0.8 * e), a * 2, i);
  }
}
