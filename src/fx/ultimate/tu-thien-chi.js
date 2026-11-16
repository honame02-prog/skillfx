import { chain, READY } from "../../core/index.js";
import * as sky from "./heaven-sky.js";
import * as finger from "./heaven-finger.js";
import * as quake from "./sky-quake.js";
import { GOLD, RELEASE, HIT, DURATION, TX, SIZE } from "./_lib.js";

export const meta = {
  name: "Tu Thien Chi", desc: "A celestial fingerprint awakens; a colossal golden finger imprisons heaven and earth, then crushes the target into a world-splitting quake.",
  tags: ["move", "ultimate", "finger", "heaven", "quake", "one-shot"], size: SIZE, origin: [62, 220],
  duration: DURATION, fps: 30, loop: false, bg: "ground", actor: 2, options: { palette: GOLD, seed: 17 },
};

const CHANT = { turn: 1, crouch: 1, fx: -4, fy: -29, bx: 5, by: -29, ffx: -4, fbx: 5, armsFront: true };
const UP = { ...CHANT, crouch: -1, fx: -7, fy: -43, bx: 9, by: -41 };
const DOWN = { ...READY, crouch: 4, lean: 4, fx: 16, fy: -18, bx: -5, by: -26, ffx: 10, fbx: -9, toeB: true };
const GUARD = { x: -7, turn: 0.8, crouch: 6, lean: -4, fx: -3, fy: -35, bx: 6, by: -32, ffx: 4, fbx: -8, armsFront: true };
export const act = {
  target: { x: TX },
  poses: [[-0.3, READY], [0.1, CHANT], [0.65, { ...CHANT, crouch: 2 }], [1.17, UP], [RELEASE - 0.02, UP],
    [RELEASE, DOWN, "snap"], [HIT - 0.02, DOWN], [HIT, GUARD, "snap"], [2.4, { ...GUARD, x: -10, crouch: 4 }],
    [3.2, { ...READY, x: -5 }], [4, READY], [DURATION, READY]],
  hits: [{ t: RELEASE, stop: 0.055, shake: 0.13, amp: 1.5, target: false },
    { t: HIT, stop: 0.2, shake: 0.62, amp: 5.5, push: 5, straw: 49, flash: 0.16, skin: "holy" },
    { t: HIT + 0.24, stop: 0.035, shake: 0.35, amp: 4, push: 2, straw: 34 },
    { t: 4.2, push: 0, straw: 0, flash: 0, skin: null }],
  dust: [{ t: HIT, x: -8, n: 12, dir: -1 }],
};

// Forward the move's ramp through each cue: chain deliberately isolates child options.
export function create(o) {
  return chain([{ fx: sky, t: 0, x: TX, palette: o.palette }, { fx: finger, t: 0, x: TX, palette: o.palette },
    { fx: quake, t: HIT, x: TX, palette: o.palette }])(o);
}
