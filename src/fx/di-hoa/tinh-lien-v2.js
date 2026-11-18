// Di Hoa 5 v2: Tinh Lien "Ho Ly May Lien Hoa", detail (8.4 s). Card: design/di-hoa/tinh-lien-v2-ho-ly.md; approved draft: tinh-lien-v2-draft3.js (nhap 7 v2).
// Frame (Opus) + libraries _holyfox-lib, _holylotus-lib, _devour-lib, _whitehole-lib (Opus) + parts _tlv2-{intro,inhale,vortex,ground,after}.js (Codex).
import { smooth, READY } from '../../core/index.js';
import { CLOUD } from './_tinhlien-common.js';
import { holyFox } from './_holyfox-lib.js';
import { holyLotus } from './_holylotus-lib.js';
import { TX, END, FORM, INHALE, BEATS, SEAL, DEVOUR, OPEN, SQUASH, SHEDN, FLY, F, shedT, foxS, devourAt, lotusOpen, lotusCrush } from './_tlv2-common.js';
import { intro } from './_tlv2-intro.js';
import { inhale } from './_tlv2-inhale.js';
import { vortex } from './_tlv2-vortex.js';
import { ground } from './_tlv2-ground.js';
import { after } from './_tlv2-after.js';

export const meta = {
  name: 'Tinh Lien v2',
  desc: 'The white fox inhales, its lotus folds shut, a fire-heart beats and a lotus seal flares before the white hole devours all.',
  tags: ['di-hoa', 'fire', 'fox', 'lotus', 'vortex', 'one-shot'],
  size: [360, 320], origin: [60, 295], duration: END, loop: false, fps: 30, bg: 'ground', actor: 2,
  options: { seed: 5 },
};
const RAISE = { ...READY, crouch: 0, lean: -2, fx: 10, fy: -44, bx: 7, by: -40 };
const PUSH = { ...READY, crouch: 3, lean: 3, fx: 16, fy: -34, bx: 8, by: -32, armsFront: true };
const BRACE = { ...READY, crouch: 6, lean: -5, fx: 8, fy: -26, bx: 2, by: -22, armsFront: true };
const ticks = [];
for (let i = 0; i < SHEDN; i++) ticks.push({ t: shedT(i) + FLY, stop: 0.03, shake: 0.12 + 0.02 * i, amp: 1.5 + 0.3 * i, push: 0.3, straw: 3, flash: 0.02 });
for (const b of BEATS) ticks.push({ t: b, stop: 0.05, shake: 0.25, amp: 2.5, push: -0.4, straw: 2, flash: 0.02 });
for (let t = DEVOUR[0] + 0.2; t < SQUASH[0]; t += 0.25) ticks.push({ t, shake: 0.12, amp: 1.4, push: -0.15, straw: 3, flash: 0 });
export const act = {
  target: { x: TX },
  poses: [[-0.2, READY], [0.5, RAISE], [INHALE[0], RAISE], [INHALE[0] + 0.3, BRACE], [SEAL, BRACE], [SEAL + 0.06, PUSH, 'snap'], [SQUASH[1], PUSH], [END, READY]],
  hits: [
    ...ticks,
    { t: SEAL, stop: 0.16, shake: 0.6, amp: 4, push: -0.8, straw: 10, flash: 0.06, skin: 'holy' },
    { t: OPEN, stop: 0.1, shake: 0.7, amp: 5, push: -1, straw: 16, flash: 0.04 },
    { t: DEVOUR[0] + 0.3, shake: 0.2, amp: 2, push: -0.6, straw: 12, flash: 0, erase: 1.1 },
    { t: SQUASH[1], stop: 0.1, shake: 0.6, amp: 5, push: 0, straw: 8, flash: 0.06 },
    { t: END - 0.02, push: 0, straw: 0, flash: 0, skin: null, erase: 0 },
  ],
};

const lotusFn = (p, x, y, s, t, dv, open, occ) => holyLotus(p, x, y + 2 * s, s * 1.05, t, { open: lotusOpen(t), crush: lotusCrush(t), k: 1.2, seed: 5, occ });
function fox(p, t, layer) {
  const dv = devourAt(t);
  if (dv >= 1) return null;
  return holyFox(p, t, { F, S: foxS(t), reveal: smooth(FORM[0], FORM[1], t), eye: smooth(FORM[1] - 0.2, FORM[1] + 0.1, t), lotus: 1, devour: dv, layer, lotusFn, twist: 7, twistR: 26 });
}
export function drawBack(p, t) {
  if ((t > SEAL - 0.01 && t < SEAL + 0.04) || (t > OPEN - 0.01 && t < OPEN + 0.03)) p.rect(-60, -295, 360, 320, CLOUD[0]);   // inverted beats
  ground(p, t, 'back');
  after(p, t, 'back');
  const r = fox(p, t, 'back');
  intro(p, t, 'back', r);
}
export function draw(p, t) {
  const r = fox(p, t, 'front');
  intro(p, t, 'front', r);
  inhale(p, t, 'front');
  vortex(p, t, 'front');
  ground(p, t, 'front');
  after(p, t, 'front');
}
