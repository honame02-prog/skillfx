// DRAFT 2 (user 18/11: the lotus was a monotonous fan of blades, the devouring crude) — compare with tinh-lien-v2.js.
// Changes only: (1) the lotus behind the fox is a REAL burning lotus (_holylotus-lib.js: 3 rings, drooping outer petals,
// cupped bowl, bud, fierce tongues on every rim and tip); (2) the devouring (_devour-lib.js): the white hole has depth —
// a tilted accretion disk of ivory fire (far half behind the core, near half in front), photon ring and a lensed arc;
// the fox is twisted into the core, the target and pieces of the fox are stretched into ribbons winding onto the disk;
// at the end the disk squashes to a line, flash, shock ring. Intro and ground parts are the current ones.
import { smooth, clamp, hex, READY } from '../../core/index.js';
import { L, CLOUD, sm } from './_tinhlien-common.js';
import { holyFox } from './_holyfox-lib.js';
import { holyLotus } from './_holylotus-lib.js';
import { accretion, core, ribbon } from './_devour-lib.js';
import { TX, END, FORM, PRESS, OPEN, DEVOUR, GONE, F, H, foxS, devourAt, coreR, armK } from './_tlv2-common.js';
import { intro } from './_tlv2-intro.js';
import { ground } from './_tlv2-ground.js';
export { act } from './tinh-lien-v2.js';

export const meta = {
  name: 'Tinh Lien v2 Draft 2',
  desc: 'Draft 2: a real burning lotus behind the white fox; the devouring white hole gets a tilted fire disk, photon ring and stretched ribbons.',
  tags: ['di-hoa', 'draft', 'fire', 'fox', 'lotus', 'vortex', 'one-shot'],
  size: [360, 320], origin: [60, 295], duration: END, loop: false, fps: 30, bg: 'ground', actor: 2,
  options: { seed: 5 },
};
const WOOD = ['#4a2c14', '#8a5a2a', '#c08a4a'].map(hex), IVR = [hex('#b3a490'), L[4], L[6]];
const lotusFn = (p, x, y, s, t, devour, open) => holyLotus(p, x, y + 2 * s, s * 1.05, t, { open, crush: devour, k: 1.2, seed: 5 });
const diskK = (t) => armK(t) > 0 ? smooth(OPEN, OPEN + 0.4, t) : 0;
const flat = (t) => smooth(GONE[0], GONE[1] - 0.05, t);

function fox(p, t, layer) {
  const dv = devourAt(t);
  if (dv >= 1) return null;
  return holyFox(p, t, { F, S: foxS(t), reveal: smooth(FORM[0], FORM[1], t), eye: smooth(FORM[1] - 0.15, FORM[1] + 0.1, t), lotus: smooth(0.3, 0.9, t), devour: dv, layer, lotusFn, twist: 7, twistR: 26 });
}
export function drawBack(p, t) {
  if (t > OPEN - 0.02 && t < OPEN + 0.04) p.rect(-60, -295, 360, 320, CLOUD[0]);
  ground(p, t, 'back');
  const r = fox(p, t, 'back');
  intro(p, t, 'back', r);
}
export function draw(p, t) {
  const r = fox(p, t, 'front');
  intro(p, t, 'front', r);
  const R = coreR(t), dk = t < GONE[1] ? Math.max(diskK(t), 0) * (1 - 0.3 * flat(t)) : 0;
  if (t > OPEN && t < GONE[1]) {
    accretion(p, H[0], H[1], R, t, dk, 'back', flat(t));
    // the devoured: the target stretched into a wood-brown ribbon, three ivory ribbons torn from the fox
    ribbon(p, H[0], H[1], TX + 6, -22, sm(clamp((t - 3.25) / 1.0)), 4, 7, WOOD, t, 1);
    for (let i = 0; i < 3; i++) ribbon(p, H[0], H[1], H[0] + [-26, 24, -6][i], H[1] + [-30, -22, -48][i], sm(clamp((t - 3.12 - i * 0.12) / 0.8)), 3.2, 6 + i, IVR, t, 3 + i);
    core(p, H[0], H[1], R * (1 - 0.6 * flat(t)), t);
    accretion(p, H[0], H[1], R, t, dk, 'front', flat(t));
  }
  ground(p, t, 'front');
  // the end: the squashed disk snaps; flash, shock ring
  const u = (t - GONE[1]) / 0.4;
  if (u >= 0 && u < 1) {
    if (u < 0.1) p.disc(H[0], H[1], 10, L[6], 1);
    p.ring(H[0], H[1], 8 + 90 * sm(u), u < 0.5 ? 2 : 1, u < 0.5 ? L[6] : L[4]);
    p.line(H[0] - 120 * (1 - u), H[1], H[0] + 120 * (1 - u), H[1], u < 0.4 ? L[6] : L[4]);
  }
}
