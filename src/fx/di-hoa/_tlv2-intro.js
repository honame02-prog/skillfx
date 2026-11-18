// Tinh Lien v2 part: INTRO — mist gathering into the fox (0–0.8 s) and the burning petals shed onto the target (0.9–2.9 s)
// with their impacts. Library: _whitehole-lib.js (wisp), _tinhlien-lotus-lib.js (flamePetal). Stub from the draft; Codex fills it.
import { flamePetal } from './_tinhlien-lotus-lib.js';
import { hsh } from './_tinhlien-common.js';
import { TX, SHEDN, FLY, PRESS, shedT } from './_tlv2-common.js';

/** r: the fox return value ({ lotusTop, size }) or null; layer 'back' | 'front' */
export function intro(p, t, layer, r) {
  if (layer !== 'front' || !r || t >= PRESS[0]) return;
  for (let i = 0; i < SHEDN; i++) {
    const u = (t - shedT(i)) / FLY;
    if (u < 0 || u > 1) continue;
    const side = i & 1 ? 1 : -1;
    const sx = r.lotusTop[0] + side * (18 + hsh(i, 2) * 22) * r.size * 0.4, sy = r.lotusTop[1] + 10, ex = TX + (hsh(i, 3) - 0.5) * 12, ey = -24;
    const x = sx + (ex - sx) * u + side * Math.sin(u * Math.PI) * 26, y = sy + (ey - sy) * u * u;
    const vx = ex - sx + side * Math.cos(u * Math.PI) * 26 * Math.PI, vy = (ey - sy) * 2 * u + 1, l = Math.hypot(vx, vy) || 1;
    flamePetal(p, x - vx / l * 13, y - vy / l * 13, x, y, 4.5, t, i * 5.3, { wisp: 0.8, heat: 0.4, side });
  }
}
