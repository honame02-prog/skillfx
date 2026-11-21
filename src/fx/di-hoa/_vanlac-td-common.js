// Van Lac Tam Viem (top-down): timing/size constants and helpers shared by van-lac-td.js, _vanlac-td-floor.js, _vanlac-td-burst.js.
export const END = 3.0, SEAL = 0.0, EMERGE = 0.40, COIL = 1.10, REAR = 1.25, DIVE = 1.35, BEATS = [1.55, 1.90, 2.25], BURN = 2.40;
export const SQ = 0.5, BODY_L = 110, W = 4, SLIDE = 300, SPOT = 18, CHEST = [0, -30], TOP = [16, -74], BOW = 40;
export const SEAL_RX = 40, TINT = 0xffe0d0d8;
export const IN = DIVE + 0.10;
export const sm = (u) => u * u * (3 - 2 * u), out3 = (u) => 1 - (1 - u) ** 3;
export const pk = (a) => Math.round(Math.abs(Math.cos(a)) * 97) * 211 + Math.round(Math.sin(a) * 97);   // same for a and PI - a
export const fr = (t) => Math.floor(t * 30);
export const layerOfZ = (z) => (z > 1e-3 ? 'front' : 'back');
