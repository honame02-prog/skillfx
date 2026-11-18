"""Geometric white-fox sprite (front view, slender pose per reference photo) -> _holyfox-sprite.js + preview.
Hand-shaped shapes in sprite space; tier 3..6 inside, 0..2 only outline / leg gap / inner ear / under bib.
Run: python -X utf8 tools/sprite_from_ref.py"""
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

SRC = r'C:\Users\Admin\AppData\Local\Temp\claude\20df13666ee7f446\42857889-04a2-4ce2-ab23-1820ff2857a5\images\1.png'
OUT_JS = r'D:\SkillFX_TuThienChi_HoaLien\skillfx\src\fx\di-hoa\_holyfox-sprite.js'
OUT_PNG = r'D:\SkillFX_TuThienChi_HoaLien\skillfx\records\holyfox-sprite-preview.png'
SW, SH = 48, 120
SS = 8
X = (np.arange(SW)[None, :] + 0.5 - SW / 2) * np.ones((SH, 1))   # u: offset from centre
Y = (np.arange(SH)[:, None] + 0.5) * np.ones((1, SW))

def poly(pts):
    im = Image.new('L', (SW*SS, SH*SS), 0)
    ImageDraw.Draw(im).polygon([((u + SW/2)*SS, y*SS) for u, y in pts], fill=255)
    return np.asarray(im.resize((SW, SH), Image.BOX)) >= 128
def sym(pts):   # left half pts (u<0) -> full polygon
    return pts + [(-u, y) for u, y in reversed(pts)]
def ell(cu, cy, rx, ry):
    return ((X-cu)/rx)**2 + ((Y-cy)/ry)**2 <= 1

# ---- layers (back to front) ----
haunch = ell(-14, 92, 7, 17) | ell(14, 92, 7, 17) | ell(-15.5, 114, 4.5, 3.5) | ell(15.5, 114, 4.5, 3.5)
haunch &= Y < 118
torso = poly(sym([(-13, 58), (-13, 90), (-10, 100)]))
# front legs: taper 9 -> 7.5, paws bulge to 9.5; gap |u|<1
def leg(sign):
    L = []
    pts = [(1, 68), (10.5, 68), (10.5, 86), (9, 100), (9, 108), (10.8, 112), (11, 117), (9.5, 119.6), (1, 119.6)]
    return poly([(sign*u, y) for u, y in pts])
legL, legR = leg(-1), leg(1)
legs = legL | legR
gap = poly([(-1, 72), (1, 72), (1, 109), (-1, 109)])        # dark gap (mask pixels) down to above the paws
bib = ell(0, 58, 17, 20)
neck = poly(sym([(-10, 34), (-12, 48)]))
head = poly(sym([(-9, 11), (-12, 20), (-14, 29), (-13, 34), (-8, 39), (-3, 42), (0, 43)]))
earL = poly([(-13, 22), (-13.5, 1), (-4, 13)]); earR = poly([(13, 22), (13.5, 1), (4, 13)])
innL = poly([(-12, 18), (-12.5, 6.5), (-7, 15)]); innR = poly([(12, 18), (12.5, 6.5), (7, 15)])
ears = earL | earR; inner = innL | innR

mask = haunch | torso | legs | gap | bib | neck | head | ears
# majority filter on silhouette (keep the gap inside the mask)
for _ in range(2):
    cnt = ndi.convolve(mask.astype(int), np.ones((3, 3), int), mode='constant')
    mask = np.where(mask, cnt >= 4, cnt >= 6)

au = np.abs(X)
tier = np.full((SH, SW), 3)
# haunch: one tier darker than legs
tier[haunch] = 3
tier[torso] = 4
t = np.where(au < 5, 5, 4); tier[legs] = t[legs]
# bib: brightest centre, falling off to sides and bottom
r = np.sqrt((X/17)**2 + ((Y-54)/20)**2)
tb = np.where(r < 0.45, 6, np.where(r < 0.8, 5, 4)); tier[bib] = tb[bib]
tier[neck] = np.where(au[neck] < 5, 5, 4)
th = np.where(au < 4.5, 6, np.where(au < 9, 5, 4)); tier[head] = th[head]
tier[ears] = 4
tier[earL & (au > 7)] = 4
tier[inner] = 2
# rim of inner ear one tier lighter: inner ear shrunk
for ie in (innL, innR):
    er = ndi.binary_erosion(ie, iterations=1)
    tier[ie & ~er] = 3
# gap
tier[gap & ~bib & ~head] = 1
tier[gap & bib] = tb[gap & bib]
# under-bib shadow: first rows of torso/legs below bib
below = np.zeros_like(bib); below[1:] = bib[:-1]
ub1 = (legs | torso | gap) & ~bib & below
ub0 = np.zeros_like(bib); ub0[1:] = ub1[:-1]
ub2 = (legs | torso | gap) & ~bib & ~ub1 & ub0
tier[ub1 & (legs | torso)] = 2; tier[ub2 & (legs | torso)] = 3
tier[ub1 & gap] = 1
# fill tier for pixels added by the majority filter
valid = mask & (haunch | torso | legs | gap | bib | neck | head | ears)
idx = ndi.distance_transform_edt(~valid, return_distances=False, return_indices=True)
tier = tier[idx[0], idx[1]]
# outline: side/lower edges tier 2, top edge tier 3
up = np.zeros_like(mask); up[1:] = mask[:-1]; dn = np.zeros_like(mask); dn[:-1] = mask[1:]
lf = np.zeros_like(mask); lf[:, 1:] = mask[:, :-1]; rt = np.zeros_like(mask); rt[:, :-1] = mask[:, 1:]
edge_side = mask & (~lf | ~rt | ~dn)
edge_top = mask & ~up
interior_ok = tier.copy()
tier = np.where(edge_top & (tier > 3), 3, tier)
tier = np.where(edge_side & (tier > 2) & ~(inner), 2, tier)
tier[inner & ~edge_side] = np.where(tier[inner & ~edge_side] > 3, 2, tier[inner & ~edge_side])
# keep ear tips readable: ear edge pixels use tier 3 (sides of ears), not 2
earsel = ears & edge_side & ~head
tier[earsel & (Y < 20)] = 3

rows_c = [[('.' if not mask[y, x] else str(int(tier[y, x]))) for x in range(SW)] for y in range(SH)]
def put(x, y, c):
    rows_c[y][x] = c
for (x, y) in [(14, 24), (15, 25), (16, 25), (17, 25), (18, 25), (16, 26), (17, 26)]:
    put(x, y, 'e'); put(SW-1-x, y, 'e')
for (x, y) in [(23, 37), (24, 37), (23, 38), (24, 38)]:
    put(x, y, 'n')
rows = [''.join(r) for r in rows_c]

FEET = [SW // 2, SH - 1]
BODY = [int(np.where(mask[54])[0].min()), int(np.where(mask[54])[0].max())]
CHEST = [SW // 2, 52]
cnt = {k: sum(r.count(k) for r in rows) for k in '0123456en'}
print('SW,SH', SW, SH, 'FEET', FEET, 'BODY', BODY, 'CHEST', CHEST, cnt)
with open(OUT_JS, 'w', encoding='utf8') as f:
    f.write("// Generated by tools/sprite_from_ref.py (geometric slender white fox, front view, pose per user's reference). Do not edit by hand.\n")
    f.write(f"export const SW = {SW}, SH = {SH};\n")
    f.write(f"export const FEET = [{FEET[0]}, {FEET[1]}];   // sprite px\n")
    f.write(f"export const BODY = [{BODY[0]}, {BODY[1]}];   // sprite x-range of the fox body column at the chest\n")
    f.write(f"export const CHEST = [{CHEST[0]}, {CHEST[1]}];   // sprite px, centre of chest fluff\n")
    f.write("export const ROWS = [\n" + ",\n".join(f"  '{r}'" for r in rows) + "\n];\n")

pal = {str(i): c for i, c in enumerate(['#4a3f36','#6b5d50','#8f7f6e','#b3a490','#efe6cf','#fbf8f0','#ffffff'])}
pal['e'] = '#f4b630'; pal['n'] = '#241c18'
S = 4; bg = '#15121c'
left = Image.new('RGB', (SW*S, SH*S), bg); d = ImageDraw.Draw(left)
for y, r in enumerate(rows):
    for x, ch in enumerate(r):
        if ch != '.': d.rectangle([x*S, y*S, x*S+S-1, y*S+S-1], fill=pal[ch])
ref = Image.open(SRC).convert('RGB').crop((200, 140, 380, 556)).resize((SW*S*2, SH*S), Image.LANCZOS)
out = Image.new('RGB', (SW*S + 8 + ref.width, SH*S), bg)
out.paste(left, (0, 0)); out.paste(ref, (SW*S + 8, 0))
out.save(OUT_PNG); print('saved', OUT_PNG)
