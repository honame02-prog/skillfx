import { FLAMES, LOOP, flames, lotus, orbitEmbers } from './_lotus-lib.js';

export const meta = {
  name: 'Hoa Lien',
  desc: 'Three tiers of pointed fire petals breathe around a white stamen; separate alien flames lick their rims beneath a quiet turning dharma wheel.',
  tags: ['ultimate', 'lotus', 'fire', 'multicolor', 'loop'],
  size: [148, 136], origin: [74, 112], duration: LOOP, loop: true, fps: 30, bg: 'ground',
  options: { flames: FLAMES, seed: 17 },
};
export function drawBack(p, t, o) {
  const C = flames(o);
  p.glow(0, -1, 36, C[0][4], 0.16);
}
export function draw(p, t, o) {
  const C = flames(o);
  lotus(p, t, C, { seed: o.seed });
  orbitEmbers(p, t, C, o.seed);
}
