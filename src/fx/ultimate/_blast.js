// Shared ground-blast kit for the ultimates (Tu Thien Chi and Phat No Hoa Lien).
// API contract fixed by Opus; implementation by Codex task A. Callers (sky-quake.js, hoa-lien-burst.js) only use this API.
//
// createGroundBlast(o) -> { update(dt), drawBack(p), draw(p), done() }
//   Local coordinates: (0, 0) is the impact point on the floor, y up is negative. Starts at t = 0 when created/updated.
//   o.seed      number   seeded Rng (never Math.random)
//   o.scale     number   1 = Tu Thien Chi size (debris up to ~260 px high, dust ring to the canvas edges ~240 px each side)
//   o.hot       string[] ramp dark -> bright for the glowing core / embers / lit dust (e.g. GOLD, or one flame ramp)
//   o.dirt      string[] ramp dark -> bright for soil, rocks and dust (e.g. STONE)
//   o.haze      string   tint of the lingering smoke haze (hex)
//   o.halfWidth number   how far the ground damage reaches each side, px at scale 1 (default 230)
//   o.duration  number   seconds until everything is gone and the blast draws nothing (default 3.2)
//
// What it draws (all deterministic, contained to its own box, ends empty):
//   - ground burst: a crater flash, dirt geysers and soil columns thrown up
//   - debris: big rocks and clods (Bits) flying HIGH on parabolas, tumbling, landing with dust puffs
//   - ground shockwave: a dense dust surge racing along the floor in perspective (near half in front, far half behind)
//   - lingering haze: low translucent smoke that rolls and drifts and slowly thins (no checkerboard)

export function createGroundBlast(o = {}) {
  let t = 0;
  const duration = o.duration ?? 3.2;
  return {
    update(dt) { t += dt; },
    drawBack(p) {},
    draw(p) {},
    done() { return t >= duration; },
  };
}
