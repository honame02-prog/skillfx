// Shared timing/geometry for Tinh Lien v2 "Ho Ly May Lien Hoa" (detail). Approved draft: tinh-lien-v2-draft.js (nhap 6, 18/11).
// Parts (_tlv2-*.js) import from here; the move (tinh-lien-v2.js) owns meta/act. Card: design/di-hoa/tinh-lien-v2-ho-ly.md.
import { clamp } from '../../core/index.js';
import { sm } from './_tinhlien-common.js';
import { chestOf } from './_holyfox-lib.js';

export const TX = 150, END = 5.8, FORM = [0.0, 0.8], SHED0 = 0.9, SHEDN = 6, SHEDDT = 0.34, FLY = 0.32;
export const PRESS = [3.0, 3.1], OPEN = 3.05, DEVOUR = [3.1, 3.9], HOLE = [3.05, 4.9], GONE = [4.9, 5.3];
export const F = [TX, -1], SPRESS = 0.95, H = chestOf(F, SPRESS);   // fox sits ON the target; the vortex opens in its chest
export const shedT = (i) => SHED0 + i * SHEDDT;
export const foxS = (t) => {
  const grow = 1 + 0.25 * sm(clamp((t - FORM[1]) / (PRESS[0] - FORM[1])));
  return grow + (SPRESS - grow) * sm(clamp((t - PRESS[0]) / (PRESS[1] - PRESS[0])));
};
export const devourAt = (t) => sm(clamp((t - DEVOUR[0]) / (DEVOUR[1] - DEVOUR[0])));
export const coreR = (t) => 20 * sm(clamp((t - OPEN) / 0.45)) * (1 - sm(clamp((t - GONE[0]) / (GONE[1] - GONE[0]))));
export const armK = (t) => sm(clamp((t - OPEN) / 0.35)) * (1 - sm(clamp((t - 4.4) / 0.5)));
