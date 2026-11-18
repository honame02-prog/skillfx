// Di Hoa 5 v2: Tinh Lien "Ho Ly May Lien Hoa" — detail. Card: design/di-hoa/tinh-lien-v2-ho-ly.md; approved draft: tinh-lien-v2-draft.js (nhap 6).
// Frame (Opus) + fox library _holyfox-lib.js (Opus) + parts _tlv2-{intro,vortex,ground}.js (Codex) on the shape library _whitehole-lib.js (Opus).
import { smooth, READY } from '../../core/index.js';
import { CLOUD } from './_tinhlien-common.js';
import { holyFox } from './_holyfox-lib.js';
import { TX, END, FORM, SHEDN, FLY, PRESS, OPEN, DEVOUR, HOLE, GONE, F, shedT, foxS, devourAt } from './_tlv2-common.js';
import { intro } from './_tlv2-intro.js';
import { vortex } from './_tlv2-vortex.js';
import { ground } from './_tlv2-ground.js';

export const meta = {
  name: 'Tinh Lien v2',
  desc: 'A white fox spirit sits on the target, a flickering flame-lotus behind it sheds burning petals; it tenses and a white vortex in its chest devours it and the ground.',
  tags: ['di-hoa', 'fire', 'fox', 'lotus', 'vortex', 'one-shot'],
  size: [360, 320], origin: [60, 295], duration: END, loop: false, fps: 30, bg: 'ground', actor: 2,
  options: { seed: 5 },
};
const RAISE = { ...READY, crouch: 0, lean: -2, fx: 10, fy: -44, bx: 7, by: -40 };
const PUSH = { ...READY, crouch: 3, lean: 3, fx: 16, fy: -34, bx: 8, by: -32, armsFront: true };
const hitTicks = [];
for (let i = 0; i < SHEDN; i++) hitTicks.push({ t: shedT(i) + FLY, stop: 0.03, shake: 0.12 + 0.02 * i, amp: 1.5 + 0.3 * i, push: 0.3, straw: 3, flash: 0.02 });
for (let t = DEVOUR[0] + 0.2; t < HOLE[1]; t += 0.25) hitTicks.push({ t, shake: 0.12, amp: 1.4, push: -0.15, straw: 3, flash: 0 });
export const act = {
  target: { x: TX },
  poses: [[-0.2, READY], [0.4, RAISE], [PRESS[0], RAISE], [PRESS[0] + 0.06, PUSH, 'snap'], [GONE[1], PUSH], [END, READY]],
  hits: [
    ...hitTicks,
    { t: OPEN, stop: 0.12, shake: 0.7, amp: 5, push: -1, straw: 20, flash: 0.06, skin: 'holy' },
    { t: DEVOUR[0] + 0.15, shake: 0.2, amp: 2, push: -0.6, straw: 12, flash: 0, erase: 0.9 },   // the vortex devours the target too
    { t: GONE[0] + 0.3, stop: 0.08, shake: 0.5, amp: 4, push: 0, straw: 8, flash: 0.05 },
    { t: END - 0.02, push: 0, straw: 0, flash: 0, skin: null, erase: 0 },
  ],
};


// the lotus burns behind the target, the fox's body and fire IN FRONT of it (its fire engulfs the character)
function fox(p, t, layer) {
  const dv = devourAt(t);
  if (dv >= 1) return null;
  return holyFox(p, t, { F, S: foxS(t), reveal: smooth(FORM[0], FORM[1], t), eye: smooth(FORM[1] - 0.15, FORM[1] + 0.1, t), lotus: smooth(0.3, 0.9, t), devour: dv, layer });
}
export function drawBack(p, t) {
  if (t > OPEN - 0.02 && t < OPEN + 0.04) p.rect(-60, -295, 360, 320, CLOUD[0]);   // the squeeze: one inverted beat
  ground(p, t, 'back');
  const r = fox(p, t, 'back');
  intro(p, t, 'back', r);
  vortex(p, t, 'back');
}
export function draw(p, t) {
  const r = fox(p, t, 'front');
  intro(p, t, 'front', r);
  vortex(p, t, 'front');
  ground(p, t, 'front');
}
