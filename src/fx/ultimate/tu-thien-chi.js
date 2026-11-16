import { chain, READY } from "../../core/index.js";
import * as sky from "./heaven-sky.js";
import * as finger from "./heaven-finger.js";
import * as quake from "./sky-quake.js";
import { GOLD, EMERGE, REVEALED, RELEASE, HIT, DURATION, TX, SIZE } from "./_lib.js";

export const meta = {
  name: "Tu Thien Chi", desc: "A celestial fingerprint awakens; a colossal golden finger imprisons heaven and earth, then crushes the target into a world-splitting quake.",
  tags: ["move", "ultimate", "finger", "heaven", "quake", "one-shot"], size: SIZE, origin: [40, 380],
  duration: DURATION, fps: 30, loop: false, bg: "ground", actor: 2, options: { palette: GOLD, seed: 17 },
};

const CHANT = { turn: 1, crouch: 1, fx: -4, fy: -29, bx: 5, by: -29, ffx: -4, fbx: 5, armsFront: true };
const UP = { ...CHANT, crouch: -1, fx: -7, fy: -43, bx: 9, by: -41 };
const DOWN = { ...READY, crouch: 4, lean: 4, fx: 16, fy: -18, bx: -5, by: -26, ffx: 10, fbx: -9, toeB: true };
const GUARD = { x: -7, turn: 0.8, crouch: 6, lean: -4, fx: -3, fy: -35, bx: 6, by: -32, ffx: 4, fbx: -8, armsFront: true };
export const act = {
  target: { x: TX },
  // Opus v2: a long chant while the clouds coil, arms raised through the slow reveal, a tremble while heaven locks,
  // then one hard downward point at the release and a braced flinch at the slam.
  poses: [[-0.3, READY], [0.1, CHANT], [1.0, { ...CHANT, crouch: 3 }], [EMERGE, UP], [REVEALED - 0.3, { ...UP, crouch: -2 }],
    [REVEALED, { ...UP, crouch: 1, lean: -2 }], [RELEASE - 0.1, { ...UP, crouch: 2, lean: -4, x: -2 }],
    [RELEASE, DOWN, "snap"], [HIT - 0.02, DOWN], [HIT, GUARD, "snap"], [HIT + 0.8, { ...GUARD, x: -12, crouch: 5 }],
    [HIT + 1.8, { ...READY, x: -6 }], [HIT + 2.6, READY], [DURATION, READY]],
  hits: [{ t: REVEALED, stop: 0.04, shake: 0.5, amp: 1.5, target: false },
    { t: RELEASE, stop: 0.06, shake: 0.13, amp: 2, target: false },
    { t: HIT, stop: 0.24, shake: 0.85, amp: 6, push: 5, straw: 49, flash: 0.18, skin: "holy" },
    { t: HIT + 0.3, stop: 0.04, shake: 0.45, amp: 4, push: 2, straw: 34 },
    { t: DURATION - 0.6, push: 0, straw: 0, flash: 0, skin: null }],
  dust: [{ t: HIT, x: -8, n: 12, dir: -1 }],
};

// Forward the move's ramp through each cue: chain deliberately isolates child options.
export function create(o) {
  return chain([{ fx: sky, t: 0, x: TX, palette: o.palette }, { fx: finger, t: 0, x: TX, palette: o.palette },
    { fx: quake, t: HIT, x: TX, palette: o.palette }])(o);
}
