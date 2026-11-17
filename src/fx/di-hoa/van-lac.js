// Di Hoa 3: Van Lac Tam Viem — detail. Script: design/di-hoa/03-van-lac-tam-viem.md; approved draft: van-lac-draft.js.
// Built as a frame + parts: the serpent (Opus, _serpent-lib.js) and three parts in _vanlac-{intro,heart,burst}.js.
import { smooth, clamp, TAU } from '../../core/index.js';
import { spine, drawSerpent } from './_serpent-lib.js';
import { TX, END, OUT, REACH, DIVE, IN, BEATS, BURN, POSES, headAt } from './_vanlac-common.js';
import { intro } from './_vanlac-intro.js';
import { heart } from './_vanlac-heart.js';
import { burst } from './_vanlac-burst.js';

export const meta = {
  name: 'Van Lac Tam Viem',
  desc: 'An invisible flame serpent with a rose-red heart coils round the target, dives into its chest, burns it from inside in three beats, then bursts outward.',
  tags: ['di-hoa', 'fire', 'soul', 'serpent', 'dot', 'move', 'one-shot'],
  size: [360, 260], origin: [60, 235], duration: END, loop: false, fps: 30, bg: 'ground', actor: 2,
  options: { seed: 5 },
};
export const act = {
  target: { x: TX },
  poses: POSES,
  hits: [
    { t: OUT + 0.03, stop: 0.03, shake: 0.08, amp: 1, target: false },
    { t: 1.5, shake: 0.2, amp: 1, push: 0.2, straw: 2 },
    { t: IN - 0.05, stop: 0.06, shake: 0.2, amp: 2, push: 0.6, straw: 4, flash: 0.04 },
    { t: BEATS[0], shake: 0.12, amp: 1, push: 0.3, straw: 3, flash: 0, skin: 'red' },
    { t: BEATS[1], shake: 0.16, amp: 1.5, push: 0.4, straw: 5, flash: 0 },
    { t: BEATS[2], shake: 0.2, amp: 2, push: 0.6, straw: 7, flash: 0 },
    { t: BURN, stop: 0.1, shake: 0.45, amp: 3.5, push: 1.6, straw: 24, flash: 0.08, skin: 'char' },
    { t: END - 0.35, push: 0, straw: 0, skin: null },
  ],
};

const BODY_L = 135, SLIDE = 260;   // body length (px); speed it slides into the chest (px/s)
const coilAngle = (ti) => Math.PI + ((ti - REACH) / (DIVE - REACH)) * TAU * 1.5;
function serpent(p, t, layer) {
  if (t < OUT || t > IN + BODY_L / SLIDE) return;
  const offset = Math.max(0, t - IN) * SLIDE, sp = spine(headAt, Math.min(t, IN), BODY_L - offset + 1, OUT);
  const keep = (ti, ly) => {   // coiling: the half of each turn behind the target goes to the back layer
    const behind = ti > REACH && ti < DIVE && Math.sin(coilAngle(ti)) < 0;
    return behind === (ly === 'back');
  };
  drawSerpent(p, sp, t, { L: BODY_L, W: 4.4, layer, keep, offset, mouth: smooth(DIVE, DIVE + 0.12, t), heart: 0.6 + 0.4 * smooth(DIVE, IN, t), seed: 2 });
}

export function drawBack(p, t) {
  intro(p, t, 'back');
  serpent(p, t, 'back');
  heart(p, t, 'back');
  burst(p, t, 'back');
}
export function draw(p, t) {
  intro(p, t, 'front');
  serpent(p, t, 'front');
  heart(p, t, 'front');
  burst(p, t, 'front');
}
