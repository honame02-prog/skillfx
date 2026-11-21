// Top-down glass flame serpent, drawn at TRUE game size (Opus, 21/11, v3). Target actor ~57 px tall.
// Shape refs: design/tienson/ref-vanlac-xc/gen-02-storyboard.png, gen-03-head.png; codex/XA2 exp/XA2/gen-*.png.
// Hearts: exp/XA2/parts/heart_0..1.png (imagegen, kept pixel for pixel). v2 (whole-body distance shader) replaced.
//
// Anatomy at 1:1:
//   head   wedge 14 px long, 8-9 px across the temples, 1 px glass outline (white skull, rose jaw), hollow inside,
//          white eye with a rose pupil, brow line; mouth opens into a dark-rose maw with two white fangs;
//          two flame crests swept back from the skull (6-8 px), waving, rose tips.
//   body   a chain of short SEGMENTS (2 px) re-laid on the spine every frame, so the body really bends.
//          Each segment stamps a 2 px glass rim on both sides of a hollow tube 6-9 px wide (dorsal rim white,
//          belly rim rose), a faint V scale every 3rd segment and a thin rose flame wisp drifting tail-ward inside.
//   fins   hooked flame thorns on the dorsal rim, swept back, flickering; small ones on the belly.
//   heart  the XA2 flame heart in the neck, beating between two frames.
//   tail   tapers to a 1 px thread, then frays into two waving wisps.
// All marks are opaque (2-level atlas alpha), colours only from ramp C + RIM/SHADE/TINT (+ #f4eef4 from the XA2 heart).
// layer 'back' dims the whole serpent (grey rim, dark-rose belly), no fills, so depth reads.
import { clamp, smooth, hex } from '../../core/index.js';

const C = ['#140c12', '#4a1428', '#a8204a', '#ff4f7a', '#ffb3c6', '#efe9ee', '#ffffff'].map(hex);
const RIM = hex('#efe9ee'), SHADE = hex('#b9b3c4'), TINT = hex('#d8d0e0'), PEARL = hex('#f4eef4');
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const dith = (x, y, a) => a > BAYER[((Math.floor(y) & 3) << 2) | (Math.floor(x) & 3)];
const frac = (v) => v - Math.floor(v);

// ---------------------------------------------------------------- dimensions (px at S = 1)
export const HEAD_LEN = 14, NECK_S = 13, HEART_S = 19, SEG = 2;
// half-width: pinched neck (3) behind the head, swelling to W, long tail taper to a thread
export function bodyWidthTD(s, L, W) {
  if (s < HEART_S + 4) return 3 + (W - 3) * smooth(NECK_S, HEART_S + 4, s);
  const u = s / L;
  return u < 0.55 ? W : Math.max(0.5, W * Math.pow(Math.max(0, (1 - u) / 0.45), 1.15));
}

// ---------------------------------------------------------------- spine sampling
// sp: [{x, y, s, time}] from the snout (spine() of _serpent-lib.js). at(q) interpolates position/time at arc length q.
function sampler(sp) {
  const n = sp.length, end = sp[n - 1].s;
  let i = 1;
  return (q) => {
    q = clamp(q, 0, end);
    if (sp[i - 1].s > q) i = 1;
    while (i < n - 1 && sp[i].s < q) i++;
    const a = sp[i - 1], b = sp[i], f = b.s > a.s ? (q - a.s) / (b.s - a.s) : 0;
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, time: a.time + (b.time - a.time) * f };
  };
}

// ---------------------------------------------------------------- XA2 hearts (16 px grid, kept as drawn)
// digits = palette index: 1 #4a1428 2 #a8204a 3 #ff4f7a 4 #ffb3c6 5 #efe9ee 6 #ffffff 7 #b9b3c4 9 #f4eef4
const HEARTS = [
  ['........3.......', '.........3......', '.......313......', '......4.4.......', '.....13232......',
    '.....34445......', '.....2362.......', '......291.......', '.......4........'],
  ['.........3......', '........33.3....', '.......93..3....', '.....732.36.....', '......23724.....',
    '....3233331.....', '....53449413....', '....3246631.....', '.....23442......', '......133.......', '.......21.......'],
];
const HC = { 1: C[1], 2: C[2], 3: C[3], 4: C[4], 5: RIM, 6: C[6], 7: SHADE, 9: PEARL };
function drawHeart(p, x, y, big, back) {
  const H = HEARTS[big ? 1 : 0], cy = big ? 7 : 6;   // anchor: the white-hot core
  for (let j = 0; j < H.length; j++) for (let i = 0; i < 16; i++) {
    const ch = H[j][i]; if (ch === '.') continue;
    let c = HC[ch]; if (back) c = ch === '6' || ch === '9' || ch === '4' ? C[3] : C[2];
    p.dot(x - 7.5 + i + 0.5, y - cy + j + 0.5, c);
  }
}

// ---------------------------------------------------------------- body: segments laid on the spine
function drawBody(p, at, t, o) {
  const { L, W, offset, keep, layer, back, D, seed, s0 } = o;
  // glass reads white: both outer rims pale, the inner pixel lilac on the back, rose only on the belly near the heart
  const oRimUp = back ? SHADE : RIM, iRimUp = back ? C[1] : SHADE;
  const oRimDn = back ? C[2] : RIM, iRimDn = back ? C[1] : C[2];
  for (let sb = s0, k = Math.floor(s0 / SEG); sb < L; sb += SEG, k++) {
    const q0 = sb - offset, q1 = q0 + SEG;
    if (q0 < 0.5) continue;
    const a = at(q0), b = at(q1);
    if (keep && !keep((a.time + b.time) / 2, layer)) continue;
    let tx = b.x - a.x, ty = b.y - a.y; const tl = Math.hypot(tx, ty); if (tl < 1e-3) continue;
    tx /= tl; ty /= tl;
    const nx = -ty * D, ny = tx * D;                       // dorsal normal
    const w0 = bodyWidthTD(sb, L, W), w1 = bodyWidthTD(sb + SEG, L, W);
    const thread = w0 < 1.6;
    const rib = !back && k % 3 === 0 && !thread && w0 > 2.6;
    const wisp = sb * 0.28 - t * 10 + seed;                 // the rose flame wisp inside, drifting tail-ward
    const wOn = !back && frac(sb / 24 - t * 1.3 + seed * 0.37) < 0.7;
    const pad = Math.max(w0, w1) + 1;
    p.shade(Math.min(a.x, b.x) - pad, Math.min(a.y, b.y) - pad, Math.max(a.x, b.x) + pad, Math.max(a.y, b.y) + pad, (x, y, out) => {
      const dx = x - a.x, dy = y - a.y, al = dx * tx + dy * ty;
      if (al < -0.55 || al > tl + 0.55) return;
      const ac = dx * nx + dy * ny, ad = Math.abs(ac), w = w0 + (w1 - w0) * clamp(al / tl);
      if (thread) { if (ad < 0.55) out.c = w < 0.9 ? oRimDn : oRimUp; return; }
      if (ad > w) return;
      const up = ac > 0, e = w - ad;
      if (e < 1) { out.c = up ? oRimUp : oRimDn; return; }                         // outer rim pixel
      if (e < 2) { if (up || sb < HEART_S + 16 || dith(x, y, 0.5)) out.c = up ? iRimUp : (sb < HEART_S + 16 ? C[3] : iRimDn); return; }   // inner rim pixel
      if (rib && Math.abs(al - 0.6 - 0.45 * ad) < 0.5 && ad < w - 2.2 && dith(x, y, 0.6)) { out.c = TINT; return; }   // V scale, opens to the tail
      if (!thread && !back && dith(x, y, 0.45)) out.c = C[1];                            // dark glass inside the tube
      if (wOn && sb > HEART_S + 6 && Math.abs(ac - (w - 2.3) * 0.7 * Math.sin(wisp + al * 0.28)) < 0.5) { out.c = sb < HEART_S + 22 ? C[3] : C[2]; return; }
    });
  }
}

// ---------------------------------------------------------------- fins: hooked flame thorns on the rim
function drawFins(p, at, t, o) {
  const { L, W, offset, keep, layer, back, D, seed } = o;
  for (const dorsal of [true, false]) {
    const P = dorsal ? 9 : 14, sgn = dorsal ? 1 : -1;
    for (let sb = HEART_S + 3 + (dorsal ? 0 : 3), id = 0; sb < L * 0.86; sb += P, id++) {
      const q = sb - offset; if (q < 1) continue;
      const a = at(q), b = at(q + 3.5);
      if (keep && !keep(a.time, layer)) continue;
      let tx = b.x - a.x, ty = b.y - a.y; const tl = Math.hypot(tx, ty); if (tl < 1e-3) continue;
      tx /= tl; ty /= tl;
      const nx = -ty * D * sgn, ny = tx * D * sgn;
      const u = sb / L, w = bodyWidthTD(sb, L, W);
      const gate = smooth(HEART_S, HEART_S + 8, sb) * (1 - smooth(0.62, 0.86, u));
      const lick = 0.78 + 0.22 * Math.sin(t * 13 + id * 1.9 + seed + (dorsal ? 0 : 2));
      const H = (dorsal ? (id % 2 ? 4.4 : 6.0) : 2.6) * gate * lick * (W / 4);
      if (H < 1.2) continue;
      const curl = 1.2 * Math.sin(t * 9 + id * 2.3 + seed);           // the tip hooks back and sways
      const base = w - 0.6;
      const P0 = [a.x + nx * base, a.y + ny * base];
      const P1 = [a.x + tx * 3.5 + nx * base, a.y + ty * 3.5 + ny * base];
      const tip = [a.x + tx * (2.2 + H * 0.95 + curl * 0.4) + nx * (base + H), a.y + ty * (2.2 + H * 0.95 + curl * 0.4) + ny * (base + H)];
      const mid = [a.x + tx * (0.6 + H * 0.35) + nx * (base + H * 0.62), a.y + ty * (0.6 + H * 0.35) + ny * (base + H * 0.62)];
      p.polyline([P0, mid, tip], back ? SHADE : RIM);                 // white leading (head-ward) edge
      if (!back) p.polyline([P1, [(mid[0] + tip[0]) / 2, (mid[1] + tip[1]) / 2]], dorsal ? C[4] : C[2]);   // rose trailing edge, open between
      p.dot(tip[0], tip[1], back ? C[2] : (id % 3 ? C[3] : C[6]));
    }
  }
}

// ---------------------------------------------------------------- head
// local units: a = forward (snout tip 0, back of skull -14), b = toward the dorsal side
const UPPER = [[0.6, 0.0], [-1, 1.0], [-4, 1.9], [-7, 2.9], [-10, 4.0], [-12.2, 4.3], [-13.8, 3.4], [-14.6, 2.8]];   // sharp snout, temples wide
const LOWER = [[-14.6, -2.8], [-12.4, -3.2], [-9.5, -2.8], [-6, -1.9], [-3, -1.0], [-0.4, -0.3]];
const MOUTH = [[0.2, -0.2], [-3, -0.6], [-6.5, -0.9], [-9.6, -1.0]];
function drawHead(p, at, t, o) {
  const { back, D, mouth, seed } = o;
  const h0 = at(0), hb = at(7);
  let fx = h0.x - hb.x, fy = h0.y - hb.y; const fl = Math.hypot(fx, fy) || 1; fx /= fl; fy /= fl;
  const sx = fy * D, sy = -fx * D;             // dorsal side (same handedness as the body's: n = (-ty, tx) * D, t = -f)
  const K = 1.15, Wp = ([a, b]) => [h0.x + (fx * a + sx * b) * K, h0.y + (fy * a + sy * b) * K];   // 16 px wedge
  const jaw = 0.32 * mouth, hinge = [-11, -1.2];
  const rot = ([a, b]) => { const A = a - hinge[0], B = b - hinge[1], c = Math.cos(jaw), s = Math.sin(jaw); return [hinge[0] + A * c + B * s, hinge[1] - A * s + B * c]; };
  const top = back ? SHADE : RIM, low = back ? C[2] : RIM;
  const edge = ([a, b]) => (b > -0.4 ? top : low);
  const outline = (poly) => { for (let i = 0; i < poly.length - 1; i++) { const A = poly[i], B = poly[i + 1]; p.line(...Wp(A), ...Wp(B), edge([(A[0] + B[0]) / 2, (A[1] + B[1]) / 2])); } };
  // solid skull at 1:1: a hollow 1 px outline reads as stray lines, so the head is filled (lilac glass, dithered)
  const skull = mouth > 0.05 ? [...UPPER, ...MOUTH.slice().reverse()] : [...UPPER, ...LOWER];
  p.poly(skull.map(Wp), C[1], back ? 0.5 : 0.75);                                     // dark plum glass: a solid wedge without a bright brick
  if (!back) p.polyline([[-1.2, 0.8], [-4.5, 1.6], [-8, 2.4]].map(Wp), SHADE);       // the light along the snout ridge
  if (mouth > 0.05) {
    const lowJaw = [...MOUTH.map(([a, b]) => [a, b - 0.4]), ...LOWER.slice().reverse()].map(rot);
    p.poly([...MOUTH.map(Wp), ...MOUTH.map(([a, b]) => rot([a, b - 0.4])).reverse().map(Wp)], back ? C[1] : C[1]);   // the maw
    p.poly(lowJaw.map(Wp), back ? C[1] : C[2], 0.6);
    p.polyline(lowJaw.map(Wp), low);
    outline([...UPPER.slice().reverse(), ...MOUTH]);
    p.polyline([...LOWER, LOWER[0]].slice(0, 2).map(Wp), low);
    if (!back) for (const a of [-1.6, -4.2]) { const [x, y] = Wp(rot([a, -1.3])); p.dot(x, y, C[6]); }   // fangs
  } else {
    outline([...UPPER.slice().reverse(), [0.6, 0], ...LOWER.slice().reverse()].reverse());
    outline([...LOWER, ...UPPER.slice(0, 1)]);
    if (!back) p.polyline(MOUTH.map(Wp), C[3]);
  }
  if (!back) p.polyline(UPPER.slice(2, 7).map(([a, b]) => Wp([a, b - 1])), SHADE);   // second rim pixel under the skull
  // the neck pinch closes the head off from the body (two short bars), so the wedge reads at 1:1
  p.line(...Wp([-14.6, 2.8]), ...Wp([-15.6, 2.4]), top); p.line(...Wp([-14.6, -2.8]), ...Wp([-15.6, -2.4]), low);
  if (!back) {
    const [ex, ey] = Wp([-8.2, 2.1]); p.dot(ex, ey, C[6]);                    // eye: white, rose pupil behind it
    const [qx, qy] = Wp([-9.3, 2.0]); p.dot(qx, qy, C[3]);
    p.polyline([[-6.4, 3.0], [-8.4, 3.2], [-10.4, 3.4]].map(Wp), C[6]);       // brow ridge catching the light
    const [nx, ny] = Wp([-1.4, 0.7]); p.dot(nx, ny, SHADE);                   // nostril
  }
  // two flame crests swept back from the skull, waving, rose tips
  [[-10.6, 4.4, 7.5], [-13.2, 3.8, 6]].forEach(([a0, b0, len], c) => {
    const pts = [];
    for (let i = 0; i <= 5; i++) {
      const u = i / 5, wv = 1.1 * u * u * Math.sin(Math.PI * 1.3 * u - t * 10 + c * 2.1 + seed);
      pts.push(Wp([a0 - len * u, b0 + (1.6 + 0.8 * c) * u + 1.8 * u * u + wv]));
    }
    p.polyline(pts.slice(0, 4), top);
    p.polyline(pts.slice(3), back ? C[2] : C[4]);
    p.dot(pts[5][0], pts[5][1], back ? C[2] : C[3]);
  });
}

// ---------------------------------------------------------------- tail: two frayed wisps
function drawTail(p, at, t, o) {
  const { L, offset, keep, layer, back, end } = o;
  const qe = L - offset; if (qe > end + 0.5 || qe < 4) return;   // the tail tip is not on the spine yet
  const a = at(qe - 3), b = at(qe);
  if (keep && !keep(b.time, layer)) return;
  let tx = b.x - a.x, ty = b.y - a.y; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
  for (const sg of [-1, 1]) {
    const pts = [];
    for (let i = 0; i <= 4; i++) {
      const u = i / 4, spread = sg * (0.6 + 2.2 * u) + 1.3 * u * Math.sin(t * 12 + sg * 1.7 + i);
      pts.push([b.x + tx * 6 * u - ty * spread, b.y + ty * 6 * u + tx * spread]);
    }
    p.polyline(pts, back ? (sg > 0 ? SHADE : C[2]) : (sg > 0 ? RIM : C[4]));
    p.dot(pts[4][0], pts[4][1], back ? C[2] : C[3]);
  }
}

// ---------------------------------------------------------------- draw
// o: L body length, W half-width (3..4.5 -> tube 6..9 px), layer, keep(time, layer), mouth 0..1, heart 0..1 (beat
// strength), seed, offset (px already slid into the chest), dorsal (+1/-1: which side of the spine carries the fins;
// default: the side facing screen-up at the neck), xmin is accepted for v2 compatibility and ignored.
export function drawSerpentTD(p, sp, t, { L = 110, W = 4, layer = 'front', keep = null, mouth = 0, heart = 0.7, seed = 0, offset = 0, dorsal = 0 } = {}) {
  if (sp.length < 2) return;
  const at = sampler(sp), end = sp[sp.length - 1].s, back = layer === 'back';
  let D = dorsal;
  if (!D) { const a = at(NECK_S), b = at(NECK_S + 4); D = b.x - a.x < 0 ? 1 : -1; }   // dorsal normal (-ty, tx)*D points screen-up
  const o = { L, W, offset, keep, layer, back, D, seed, mouth, end, s0: Math.max(NECK_S, offset + 0.5) };
  drawBody(p, at, t, o);
  drawFins(p, at, t, o);
  drawTail(p, at, t, o);
  if (heart > 0 && HEART_S - offset > 1) {                        // the neck heart, beating
    const h = at(HEART_S - offset);
    if (!keep || keep(h.time, layer)) drawHeart(p, h.x, h.y, back ? false : heart > 0.5 || frac(t * 2.2 + seed * 0.3) < 0.5, back);
  }
  if (offset < 2 && (!keep || keep(at(0).time, layer))) drawHead(p, at, t, o);
}
