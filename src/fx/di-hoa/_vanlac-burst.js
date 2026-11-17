// Van Lac Tam Viem — part 'burst': the outward explosion at BURN and the decay to END.
// Interface (fixed): export function burst(p, t, layer) — layer 'back' | 'front'; stateless, deterministic in t.
import { smooth, clamp, TAU, WHITE, hex, mix } from '../../core/index.js';
import { C, RIM, SHADE, ASH, TX, END, OUT, REACH, DIVE, IN, BEATS, BURN, CHEST, sm, out3, hand, headAt } from './_vanlac-common.js';

// the burst: the heart flame explodes OUTWARD — rose flash, a clear shock ring, clear flame tongues flung all round,
// rose embers and ash scattering with gravity
const RAYS = Array.from({ length: 16 }, (_, i) => ({ a: -Math.PI / 2 + (i / 16 - 0.5) * TAU * 0.92 + Math.sin(i * 7.3) * 0.12, L: 34 + ((i * 37) % 23), w: 2 + (i % 3) }));
export function burst(p, t, layer) {
  const τ = t - BURN;
  if (τ < 0 || τ > 1.1 || layer !== 'front') return;
  const [cx, cy] = CHEST;
  if (τ < 0.09) p.disc(cx, cy, 8 + 160 * τ, C[4], 1 - τ / 0.09);
  // the shock ring in the air (clear, like a lens) and its echo on the ground
  const R = 10 + 120 * out3(clamp(τ / 0.5)), kr = 1 - smooth(0.2, 0.5, τ);
  if (kr > 0) {
    const ring = (rr) => Array.from({ length: 73 }, (_, i) => [cx + Math.cos(i * TAU / 72) * rr, Math.min(-1, cy + Math.sin(i * TAU / 72) * rr)]);
    p.polyline(ring(R), RIM, 0.55 * kr);
    p.polyline(ring(R - 2), C[4], 0.3 * kr);
    p.polyline(Array.from({ length: 49 }, (_, i) => [cx + Math.cos(i * TAU / 48) * R * 1.1, Math.sin(i * TAU / 48) * R * 0.14]), RIM, 0.5 * kr);
  }
  // clear flame tongues shot outward: rims + a rose tip, stretching then thinning away
  for (const r of RAYS) {
    const u = clamp(τ / 0.6), ext = r.L * out3(clamp(τ / 0.18)) + 40 * u, head = cx + Math.cos(r.a) * ext, hy = Math.min(-1, cy + Math.sin(r.a) * ext + 30 * u * u);
    const tail = Math.max(0, ext - r.L * (1 - u)), tx = cx + Math.cos(r.a) * tail, ty = Math.min(-1, cy + Math.sin(r.a) * tail);
    const k = 1 - smooth(0.35, 0.6, τ), nx = -Math.sin(r.a) * r.w, ny = Math.cos(r.a) * r.w;
    if (k <= 0) continue;
    p.line(tx + nx, ty + ny, head, hy, RIM, 0.6 * k);
    p.line(tx - nx, ty - ny, head, hy, RIM, 0.6 * k);
    p.line(tx, ty, head, hy, SHADE, 0.25 * k);
    p.disc(head, hy, 1.4, C[4], k);
  }
  for (let i = 0; i < 40; i++) {   // rose embers and ash, flung out, falling
    const a = (i / 40) * TAU + Math.sin(i * 3.1), v = 60 + (i * 53) % 110, s = Math.max(0, τ - (i % 4) * 0.02);
    const x = cx + Math.cos(a) * v * s, y = Math.min(0, cy + Math.sin(a) * v * s + 140 * s * s);
    p.dot(x, y, i % 3 ? C[3 + (i % 2)] : ASH[i % 3], 1 - smooth(0.5, 1.0, s));
  }
}

