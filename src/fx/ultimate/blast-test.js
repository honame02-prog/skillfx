import { createGroundBlast } from "./_blast.js";
import { GOLD, STONE } from "./_lib.js";

export const meta = {
  name: "Ground blast study",
  desc: "Eight staggered soil fountains throw tumbling rocks high above a rolling dust shock; low smoke drifts through the settling grit.",
  tags: ["ultimate", "ground", "blast", "dust", "one-shot"],
  size: [480, 420], origin: [240, 380], duration: 3.2, fps: 30, loop: false, bg: "ground",
  options: { palette: GOLD, seed: 31 },
};

export function create(o) {
  return createGroundBlast({ seed: o.seed, scale: 1, hot: o.palette, dirt: STONE, haze: "#4a4552" });
}
