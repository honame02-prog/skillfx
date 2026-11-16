import { hex, clamp, smooth, WHITE } from "../../core/index.js";

export const GOLD = ["#171323", "#352536", "#694333", "#a57440", "#d8a750", "#f6ce78", "#ffe8ae", "#fff8dc"];
export const STONE = ["#191622", "#342b3a", "#514353", "#81706d", "#c4ae8c"];
export const RELEASE = 1.42, HIT = 1.86, DURATION = 4.8, TX = 175;
export const SIZE = [420, 260], ORIGIN = [237, 220];
export const BOX = [-233, -216, 179, 36];
export const INK = hex("#090a13");
export const envelope = (t, start, full, fade, end) => smooth(start, full, t) * (1 - smooth(fade, end, t));

// A lit one-pixel stroke; its soft halo is sampled sparsely, never a filled ribbon.
export function stroke(p, pts, c, k = 1, glow = c, radius = 4) {
  if (k <= 0.004 || pts.length < 2) return;
  p.polyline(pts, c, k);
  for (let i = 0; i < pts.length; i += 4) p.glow(...pts[i], radius, glow, k * 0.22);
}

// Continuous hooks, coils and a trailing stem. Reused on skin and standing seals.
export function rune(x, y, s = 1, variant = 0) {
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const u = i / 24, a = u * Math.PI * 2.2 + variant * 0.9, r = s * (0.4 + 2.1 * u);
    pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r * 1.2]);
  }
  const [ex, ey] = pts[pts.length - 1];
  pts.push([ex + s, ey + s * 2], [ex - s, ey + s * 4]);
  return pts;
}

// Fade particles before they leave the composition; real trajectories remain toolkit physics.
export function contain(ps, bits) {
  const [x0, y0, x1, y1] = BOX;
  for (const q of ps.list) {
    const margin = q.size * 2.1 + 11;
    const d = Math.min(q.x - x0, x1 - q.x, q.y - y0, y1 - q.y);
    if (d < margin) q.life = Math.min(q.life, q.max * clamp((d - margin * 0.65) / margin));
  }
  ps.list = ps.list.filter((q) => q.life > 0);
  if (bits) bits.list = bits.list.filter((b) => b.x - b.s * 1.5 > x0 && b.x + b.s * 1.5 < x1 && b.y - b.s * 1.5 > y0 && b.y + b.s * 1.5 < y1);
}

// Freeze-frame color drain works on both buffers, including the actor already drawn beneath.
export function drain(p, invert = false) {
  const f = p.frame;
  for (const buf of [f.color, f.light]) for (let i = 0; i < buf.length; i++) {
    const c = buf[i];
    if (!c) continue;
    let v = (((c & 255) * 3 + ((c >>> 8) & 255) * 6 + ((c >>> 16) & 255)) / 10) | 0;
    if (invert && buf === f.color) v = 255 - v;
    buf[i] = (c & 0xff000000) | (v << 16) | (v << 8) | v;
  }
}

export function glint(p, x, y, C, k) {
  p.dot(x, y, WHITE, k);
  p.glow(x, y, 5, C[5], k * 0.35);
}
