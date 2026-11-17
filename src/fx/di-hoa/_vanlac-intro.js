// Van Lac Tam Viem — part 'intro': the caster (0..OUT+): heart ember in the chest, clear flame shimmer, the push, dust/wisps under the serpent's flight.
// Interface (fixed): export function intro(p, t, layer) — layer 'back' | 'front'; stateless, deterministic in t.
import { smooth, clamp, TAU, WHITE, hex, mix } from '../../core/index.js';
import { C, RIM, SHADE, ASH, TX, END, OUT, REACH, DIVE, IN, BEATS, BURN, CHEST, sm, out3, hand, headAt } from './_vanlac-common.js';

// the ember in the caster's chest, the shimmer round him
export function intro(p, t, layer) {
  if (layer !== 'front') return;
  if (t > OUT + 0.1) return;
  const k = smooth(0.1, 0.5, t), pulse = 0.7 + 0.3 * Math.sin(t * 18);
  p.glow(4, -30, 8, C[3], 0.3 * k * pulse);
  p.disc(4, -30, 1.8 * k, C[3], k);
  for (let i = 0; i < 6; i++) {   // the clear flame shimmering round the body
    const a = i / 6 * TAU + t * 3, x = Math.cos(a) * 12, y = -26 + Math.sin(a) * 18;
    p.line(x, y, x + Math.sin(t * 9 + i) * 2, y - 6, RIM, 0.35 * k);
  }
}
