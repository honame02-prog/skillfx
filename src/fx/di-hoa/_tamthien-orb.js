// Tam Thien part: the sphere SHELL of black fire (ORB..END): forming sweep, pulsing rim, violet interior, streams from the
// draining sky, the climax flare glow, the peel from the top and its motes. Port of the draft; Codex details it.
import { smooth, clamp, TAU } from '../../core/index.js';
import { C, TX, END, IGNITE, RAIN, ORB, STARS, FADE, CLIMAX, R, SC, SKY, XC, sm, out3, hsh, orbState } from './_tamthien-common.js';

export function orb(p, t, layer) {
  if (t < ORB || t > END - 0.05) return;
  const { form, inten, Rr, peel, flare } = orbState(t);
  p.shade(SC[0] - Rr - 3, SC[1] - Rr - 3, SC[0] + Rr + 3, SC[1] + Rr + 3, (x, y, o) => {
    const dx = x - SC[0], dy = y - SC[1], d = Math.hypot(dx, dy);
    if (d > Rr + 1 || y < peel || y > -0.5) return;
    const ang = (Math.atan2(dx, -dy) + TAU) % TAU;   // 0 at the top, clockwise
    const swept = !(ang > form * Math.PI && TAU - ang > form * Math.PI), e = Rr - d;
    if (!swept && e < 4) return;
    if (e < 1.5 + inten) { if (layer === 'front') { o.c = C[inten > 0.6 && Math.sin(ang * 13 - t * 40) > 0.3 ? 6 : 4]; o.a = 1; } return; }
    if (e < 4) { if (layer === 'back') { o.c = (Math.sin(ang * 9 + t * 6) > 0.4 ? C[3] : C[2]); o.a = 1; } return; }
    if (layer === 'back') { o.l = C[2 + (inten > 0.5 ? 1 : 0)]; o.k = (0.2 + 0.15 * inten) * form; }
  });
  if (layer !== 'front') return;
  if (t < ORB + 0.5) for (let i = 0; i < 6; i++) {   // streams from the draining sky into the top of the sphere
    const x0 = TX + (i - 2.5) * 34, k = 1 - smooth(ORB + 0.3, ORB + 0.5, t);
    p.line(x0, SKY + 50, SC[0] + (i - 2.5) * 6, SC[1] - R, C[3], 0.8 * k);
  }
  if (flare > 0.05) p.glow(SC[0], SC[1], R * 0.6, C[5], 0.35 * flare);
  if (t > FADE + 0.1) for (let i = 0; i < 24; i++) {   // the peeling edge sheds violet motes that drift up
    const s = ((t - FADE) * 0.9 + hsh(i, 10)) % 1, a = hsh(i, 11) * Math.PI, x = SC[0] + Math.cos(a) * R * (hsh(i, 12) * 2 - 1);
    p.dot(x, peel - s * 30, C[3 + (i % 3)], (1 - s) * (1 - smooth(END - 0.5, END - 0.1, t)));
  }
}
