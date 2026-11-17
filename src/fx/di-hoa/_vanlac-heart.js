// Van Lac Tam Viem — part 'heart': the heart burning inside the target (IN..BURN+): three beats, veins, clear flames leaking, ash.
// Interface (fixed): export function heart(p, t, layer) — layer 'back' | 'front'; stateless, deterministic in t.
import { smooth, clamp, TAU, WHITE, hex, mix } from '../../core/index.js';
import { C, RIM, SHADE, ASH, TX, END, OUT, REACH, DIVE, IN, BEATS, BURN, CHEST, sm, out3, hand, headAt } from './_vanlac-common.js';

// the heart burning inside the target: three beats, veins spread further each time; clear flames leak from its outline
export function heart(p, t, layer) {
  if (t < IN || t > BURN + 0.9) return;
  const beat = BEATS.reduce((m, b, i) => Math.max(m, t >= b ? (0.55 + 0.25 * i) * Math.exp(-(t - b) * 6) : 0), 0);
  const level = BEATS.filter((b) => t >= b).length, [cx, cy] = CHEST, fade = 1 - smooth(BURN, BURN + 0.4, t);
  if (layer === 'front') {
    p.glow(cx, cy, 10 + 10 * beat, C[3], (0.25 + 0.5 * beat) * fade);
    p.disc(cx, cy, 2 + beat * 2, C[3 + (beat > 0.5 ? 1 : 0)], fade);
    // veins: branches from the chest, longer per beat
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * TAU + 0.3, L = (6 + 8 * level) * (0.7 + 0.3 * ((i * 0.37) % 1)), x1 = cx + Math.cos(a) * L * 0.6, y1 = cy + Math.sin(a) * L;
      p.line(cx, cy, x1, y1, C[2 + (beat > 0.3 ? 1 : 0)], (0.5 + 0.5 * beat) * fade);
      p.line(x1, y1, x1 + Math.cos(a + 0.6) * 4, y1 + Math.sin(a + 0.6) * 4, C[2], 0.6 * fade);
    }
    // clear flames leaking out of the body's edge
    for (let i = 0; i < 4 + level * 3; i++) {
      const side = i % 2 ? 1 : -1, y = -8 - ((i * 13) % 44), x = TX + side * 8, h = 6 + 5 * Math.sin(t * 12 + i);
      p.line(x, y, x + side * 2, y - h, RIM, 0.45 * fade);
      p.line(x + side, y, x + side * 3, y - h * 0.6, C[4], 0.35 * fade);
    }
  }
}
