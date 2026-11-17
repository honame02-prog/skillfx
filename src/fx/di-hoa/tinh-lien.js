// Di Hoa 5: Tinh Lien Yeu Hoa — detail. Script: design/di-hoa/05-tinh-lien-yeu-hoa.md (v3); approved draft: tinh-lien-draft.js.
// Frame + four parts: _tinhlien-{sky,gaze,lotus,blast}.js, shared data in _tinhlien-common.js.
import { TX, END, APPEAR, OPENS, LOCK, BOOM, POSES } from './_tinhlien-common.js';
import { sky } from './_tinhlien-sky.js';
import { gaze } from './_tinhlien-gaze.js';
import { lotus } from './_tinhlien-lotus.js';
import { blast } from './_tinhlien-blast.js';

export const meta = {
  name: 'Tinh Lien Yeu Hoa',
  desc: 'Clouds part for a beast eye whose gaze is a pale sunbeam on a flickering flame-lotus; the gaze focuses, the lotus explodes into a towering cone of dust with a ghost lotus burning inside.',
  tags: ['di-hoa', 'fire', 'eye', 'light', 'explosion', 'one-shot'],
  size: [360, 260], origin: [60, 235], duration: END, loop: false, fps: 30, bg: 'ground', actor: 2,
  options: { seed: 5 },
};
const ticks = [];
for (let i = 0; i < 3; i++) {
  const h = { t: OPENS[i] + 0.05, stop: 0.04, shake: 0.12 + 0.08 * i, amp: 1.5 + i, push: 0.4 + 0.2 * i, straw: 4 + 3 * i, flash: 0.03 };
  if (i === 2) h.skin = 'holy';
  ticks.push(h);
  const t1 = i < 2 ? OPENS[i + 1] : LOCK;
  for (let t = OPENS[i] + 0.15; t < t1 - 0.05; t += 0.12) ticks.push({ t, shake: 0.05 + 0.03 * i, amp: 0.8, push: 0.1, straw: 1 + i, flash: 0 });
}
for (let t = LOCK + 0.05; t < BOOM - 0.03; t += 0.06) ticks.push({ t, shake: 0.12, amp: 1.2, push: 0.05, straw: 1, flash: 0 });   // the searing ray
export const act = {
  target: { x: TX },
  poses: POSES,
  hits: [
    { t: APPEAR, stop: 0.03, shake: 0.06, amp: 1, push: 0.2, straw: 0, flash: 0.02 },
    ...ticks,
    { t: BOOM, stop: 0.2, shake: 1, amp: 7, push: 3.5, straw: 45, flash: 0.08, skin: 'char' },
    { t: 4.1, shake: 0.35, amp: 3, push: 1.2, straw: 10, flash: 0 },
    { t: 4.5, stop: 0.06, shake: 0.5, amp: 4, push: 1.8, straw: 16, flash: 0.04 },
    { t: END - 0.4, push: 0, straw: 0, flash: 0, skin: null },
  ],
};

export function drawBack(p, t) {
  sky(p, t, 'back');
  gaze(p, t, 'back');
  lotus(p, t, 'back');
  blast(p, t, 'back');
}
export function draw(p, t) {
  gaze(p, t, 'front');
  blast(p, t, 'front');
  lotus(p, t, 'front');
}
