// Sphere shell: shared state keeps the skin and ricocheting stars in step.
import { smooth, clamp, TAU } from '../../core/index.js';
import { C, TX, END, ORB, FADE, CLIMAX, R, SC, SKY, hsh, orbState } from './_tamthien-common.js';

// Geometry only; no mutable frame cache or time-dependent state.
const RIM = Array.from({ length: 129 }, (_, i) => {
  const a = i / 128 * TAU;
  return [Math.sin(a), -Math.cos(a), a];
});
const ASH = Array.from({ length: 28 }, (_, i) => [hsh(i, 10), hsh(i, 11), hsh(i, 12)]);
const point = (a, r) => [SC[0] + Math.sin(a) * r, SC[1] - Math.cos(a) * r];

export function orb(p, t, layer) {
  if (t < ORB || t > END - 0.05) return;
  const { form, inten, Rr, peel, flare } = orbState(t);
  const back = layer === 'back', gone = smooth(END - 0.35, END - 0.05, t);
  const peeling = t > FADE + 0.1;
  const cut = peeling ? peel : SC[1] - Rr - 8;
  const visible = (x, y) => y >= cut && y <= -0.5;
  const swept = a => Math.min(a, TAU - a) <= form * Math.PI;

  if (back) {
    // A flat pool of reflected light, never a second luminous sphere.
    p.shade(TX - 77, -5, TX + 77, 9, (x, y, o) => {
      const d = ((x - TX) / 77) ** 2 + ((y - 2) / 7) ** 2;
      if (d >= 1) return;
      o.l = C[flare > 0.3 ? 5 : 3];
      o.k = (1 - d) ** 2 * (0.1 + 0.22 * inten + 0.25 * flare) * form * (1 - gone);
    });
    // Radial lens, with no per-pixel trigonometry or square roots.
    const invR2 = 1 / (Rr * Rr), lensK = (0.65 + inten) * form, lensC = C[inten > 0.5 ? 3 : 2];
    p.shade(SC[0] - Rr, Math.max(cut, SC[1] - Rr), SC[0] + Rr, Math.min(-0.5, SC[1] + Rr), (x, y, o) => {
      const dx = x - SC[0], dy = y - SC[1], q = (dx * dx + dy * dy) * invR2;
      if (q >= 1 || y < cut || y > -0.5) return;
      o.l = lensC;
      o.k = (0.035 + 0.23 * q * q) * lensK;
    });
    // Sparse curling dark wisps stay near the wall, leaving the target legible.
    for (let i = 0; i < 5; i++) {
      const pts = [];
      for (let j = 0; j <= 14; j++) {
        const u = j / 14, a = i * TAU / 5 + t * 0.65 + u * 0.7;
        const v = point(a, Rr * (0.7 + 0.17 * u + 0.025 * Math.sin(u * TAU)));
        if (visible(...v) && swept((a % TAU + TAU) % TAU)) pts.push(v);
        else if (pts.length) break;
      }
      p.polyline(pts, C[1]);
    }
  }

  // Rear semicircle is behind the target; the lower semicircle passes in front.
  let rim = [];
  const flush = () => { if (rim.length > 1) p.polyline(rim, C[4]); rim = []; };
  for (const [nx, ny, a] of RIM) {
    const x = SC[0] + nx * Rr, y = SC[1] + ny * Rr;
    if ((ny <= 0) === back && visible(x, y) && swept(a)) rim.push([x, y]);
    else flush();
  }
  flush();

  // Small swept hooks: bright outer lip around an opaque black-purple core.
  for (let i = 0; i < 32; i++) {
    const a = ((i / 32 * TAU + t * 0.42) % TAU + TAU) % TAU;
    const nx = Math.sin(a), ny = -Math.cos(a), tx = -ny, ty = nx;
    if ((ny <= 0) !== back || !swept(a)) continue;
    const h = 2 + (1 + 3 * inten) * (0.5 + 0.5 * Math.sin(i * 2.4 - t * 8));
    const x = SC[0] + nx * (Rr - 1), y = SC[1] + ny * (Rr - 1);
    const pts = [[x - tx * 2, y - ty * 2], [x + nx * h - tx, y + ny * h - ty],
      [x + nx * (h + 1) + tx * 2, y + ny * (h + 1) + ty * 2],
      [x + nx * h * 0.4 + tx * 2, y + ny * h * 0.4 + ty * 2], [x + tx * 3, y + ty * 3]];
    if (!pts.every(v => visible(...v))) continue;
    p.poly(pts, C[i % 3 ? 1 : 0]);
    p.polyline(pts.slice(0, 3), C[4]);
    if (inten > 0.5 && Math.sin(i * 3 - t * 36) > 0.8) p.line(x, y, x + nx * 3, y + ny * 3, C[6]);
  }

  if (!back && t < ORB + 0.5) {
    const drain = 1 - smooth(ORB + 0.3, ORB + 0.5, t);
    for (let i = 0; i < 6; i++) {
      const pts = [], width = (1 + 2 * smooth(ORB, ORB + 0.25, t)) * drain;
      for (let j = 0; j <= 16; j++) {
        const u = j / 16;
        pts.push([TX + (i - 2.5) * (34 * (1 - u) + 6 * u) + Math.sin(u * 9 - t * 12 + i) * 7 * Math.sin(u * Math.PI),
          SKY + 50 + (SC[1] - Rr - SKY - 50) * u]);
      }
      if (width > 0.2) {
        // Stroke the narrow ribbon instead of rasterizing its large bounding polygon.
        for (let q = -Math.ceil(width); q <= Math.ceil(width); q++) p.polyline(pts.map(v => [v[0] + q, v[1]]), C[1]);
        p.polyline(pts.map(v => [v[0] + width, v[1]]), C[4], drain);
      }
    }
    // Twin leading embers follow the two sweeps down from the crown.
    for (const side of [-1, 1]) {
      for (let j = 7; j >= 0; j--) {
        const a = side * Math.max(0, form * Math.PI - j * 0.025), v = point(a, Rr);
        if (visible(...v)) p.dot(v[0], v[1], C[j < 2 ? 6 : 4]);
      }
      const v = point(side * form * Math.PI, Rr);
      if (visible(...v)) p.glow(v[0], v[1], 5, C[5], 0.3 * drain);
    }
  }
  if (!back && flare > 0.05) p.glow(SC[0], SC[1], R * 0.6, C[5], 0.35 * flare);
  if (t >= CLIMAX && t < CLIMAX + 0.2) {
    const u = (t - CLIMAX) / 0.2, wave = [];
    for (const [nx, ny] of RIM) {
      const y = SC[1] + ny * (R + 25 * u);
      // Clip at the floor, and keep the wave's depth consistent with the skin.
      if ((ny <= 0) === back && y <= -0.5) wave.push([SC[0] + nx * (R + 25 * u), y]);
      else if (wave.length) { p.polyline(wave, C[5], 1 - u); wave.length = 0; }
    }
    p.polyline(wave, C[5], 1 - u);
  }
  if (!back && peeling && peel < SC[1] + Rr) {
    // A burning horizontal tear walks down the sphere; hooks curl up off it.
    const half = Math.sqrt(Math.max(0, Rr * Rr - (peel - SC[1]) ** 2));
    const edge = [];
    for (let j = 0; j <= 48; j++) {
      const x = SC[0] - half + 2 * half * j / 48;
      edge.push([x, Math.min(-0.5, peel + 0.7 * Math.sin(j * 0.7 - t * 16))]);
    }
    p.polyline(edge, C[5]);
    for (let i = 0; i < 11; i++) {
      const x = SC[0] + (i / 10 * 2 - 1) * half * 0.94, h = 3 + 4 * hsh(i, 7);
      const y = peel, bend = Math.sin(t * 9 + i) * 3;
      const hook = [[x - 2, y], [x - 2 + bend * 0.4, y - h * 0.45], [x + bend, y - h * 0.85],
        [x + bend + 2, y - h], [x + bend + 3, y - h * 0.8], [x + bend + 1, y - h * 0.65], [x + 2, y]];
      p.poly(hook, C[1]); p.polyline(hook, C[5]);
    }
    const fade = 1 - smooth(END - 0.4, END - 0.05, t);
    for (let i = 0; i < ASH.length; i++) {
      const [seed, drift, size] = ASH[i], s = ((t - FADE) * 1.2 + seed) % 1;
      const x = SC[0] + (drift * 2 - 1) * half + Math.sin(s * 5 + i) * 4;
      const y = peel - 3 - s * (18 + size * 17);
      const pts = [[x - 2 * (1 - s), y + 3], [x + Math.sin(i + t * 6) * 2, y], [x + 1, y - 2]];
      p.polyline(pts, C[s < 0.3 ? 5 : 3], fade * (1 - s));
    }
  }
}
