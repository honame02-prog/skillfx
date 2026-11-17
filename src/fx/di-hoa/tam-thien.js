// Di Hoa 4: Tam Thien Diem Viem Hoa — detail. Script: design/di-hoa/04-tam-thien-diem-viem-hoa.md (v3); approved draft: tam-thien-draft.js.
// Frame + four parts: _tamthien-{sky,rain,orb,stars}.js, shared data in _tamthien-common.js.
import { TX, END, RAIN, ORB, STARS, FADE, CLIMAX, POSES } from './_tamthien-common.js';
import { sky } from './_tamthien-sky.js';
import { rain } from './_tamthien-rain.js';
import { orb } from './_tamthien-orb.js';
import { stars } from './_tamthien-stars.js';

export const meta = {
  name: 'Tam Thien Diem Viem Hoa',
  desc: 'The sky becomes a rolling sea of black fire, rains down onto the target, gathers into a sphere where a hundred stars ricochet faster and faster to a climax, then fades away.',
  tags: ['di-hoa', 'fire', 'star', 'aoe', 'multi-hit', 'one-shot'],
  size: [360, 260], origin: [60, 235], duration: END, loop: false, fps: 30, bg: 'ground', actor: 2,
  options: { seed: 5 },
};
const ticks = [];   // rain hits speeding up, then dense star hits
for (let t = 1.25, g = 0.16; t < ORB; t += g, g = Math.max(0.07, g * 0.9)) ticks.push({ t, shake: 0.08, amp: 1, push: 0.15, straw: 2, flash: 0 });
for (let t = STARS + 0.1, g = 0.11; t < FADE - 0.2; t += g, g = Math.max(0.045, g * 0.92)) ticks.push({ t, shake: 0.06, amp: 1, push: 0.08, straw: 1, flash: 0 });
export const act = {
  target: { x: TX },
  poses: POSES,
  hits: [
    { t: RAIN + 0.03, stop: 0.03, shake: 0.08, amp: 1, target: false },
    ...ticks,
    { t: ORB + 0.1, stop: 0.08, shake: 0.3, amp: 2.5, push: 0.6, straw: 8, flash: 0.05, skin: 'shadow' },
    { t: CLIMAX, stop: 0.1, shake: 0.5, amp: 4, push: 1.5, straw: 20, flash: 0.06 },
    { t: END - 0.35, push: 0, straw: 0, skin: null },
  ],
};
export function drawBack(p, t) {
  sky(p, t, 'back');
  rain(p, t, 'back');
  orb(p, t, 'back');
  stars(p, t, 'back');
}
export function draw(p, t) {
  sky(p, t, 'front');
  rain(p, t, 'front');
  orb(p, t, 'front');
  stars(p, t, 'front');
}
