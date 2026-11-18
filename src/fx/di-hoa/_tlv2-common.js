// Shared timing/geometry for Tinh Lien v2 "Ho Ly May Lien Hoa" (detail, 8.4 s). Approved draft: tinh-lien-v2-draft3.js (nhap 7 v2).
// Parts (_tlv2-*.js) import from here; the move (tinh-lien-v2.js) owns meta/act. Card: design/di-hoa/tinh-lien-v2-ho-ly.md.
import { clamp, smooth } from '../../core/index.js';
import { sm } from './_tinhlien-common.js';
import { chestOf } from './_holyfox-lib.js';

export const TX = 150, END = 8.4, FORM = [0, 1.0], ATTACK = [1.0, 3.6];
export const SHED0 = 1.2, SHEDN = 8, SHEDDT = 0.3, FLY = 0.32;                 // 8 petals, last lands ~3.62
export const INHALE = [3.6, 4.4], BEATS = [3.85, 4.12], SEAL = 4.2;            // the climax
export const DEVOUR = [4.3, 5.1], OPEN = 4.35, HOLE = [4.35, 6.6], SQUASH = [6.6, 7.1], AFTER = [7.2, 8.3];
export const PRESS = [INHALE[0], SEAL], GONE = SQUASH;                          // legacy names used by parts
export const F = [TX, -1], SPRESS = 0.95, H = chestOf(F, SPRESS);              // fox sits ON the target; the hole opens in its chest
export const shedT = (i) => SHED0 + i * SHEDDT;
export const foxS = (t) => {
  const grow = 1 + 0.25 * sm(clamp((t - FORM[1]) / (ATTACK[1] - FORM[1])));
  const rear = 0.06 * sm(clamp((t - INHALE[0]) / 0.5));
  return grow + rear + (SPRESS - grow - rear) * sm(clamp((t - SEAL) / 0.1));
};
export const devourAt = (t) => sm(clamp((t - DEVOUR[0]) / (DEVOUR[1] - DEVOUR[0])));
export const lotusOpen = (t) => smooth(0.4, 1.1, t) * (1 - 0.75 * sm(clamp((t - INHALE[0]) / 0.55)));
export const lotusCrush = (t) => Math.max(devourAt(t), 0.5 * sm(clamp((t - INHALE[0]) / 0.7)));
export const coreR = (t) => 20 * sm(clamp((t - OPEN) / 0.5)) * (1 - sm(clamp((t - SQUASH[0]) / (SQUASH[1] - SQUASH[0]))));
export const diskK = (t) => smooth(OPEN, OPEN + 0.6, t);
export const flat = (t) => smooth(SQUASH[0], SQUASH[1] - 0.05, t);
export const armK = (t) => diskK(t) * (1 - flat(t));
