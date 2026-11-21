"""Crop generated artwork, nearest resize, exact palette map, review sheet and audit.

Never draws primary artwork. All paths written are under this script's directory.
"""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
CONFIG = ROOT / 'layout.json'
PALETTE_SOURCE = Path('D:/SkillFX_TuThienChi_HoaLien/tiensonv2/art/palette/tienson-fx.gpl')
RAMP = ['#140c12', '#4a1428', '#64616f', '#a8204a', '#ff4f7a', '#ffb3c6', '#b9b3c4', '#efe9ee']
TIMES = [0.20, 0.85, 1.65, 2.40, 2.85]
W, H = 240, 220


def write_json(name, obj):
    (ROOT / name).write_text(json.dumps(obj, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def palette():
    base = []
    for line in PALETTE_SOURCE.read_text(encoding='utf-8').splitlines():
        words = line.split()
        if len(words) >= 3 and all(x.isdecimal() for x in words[:3]):
            base.append(tuple(map(int, words[:3])))
    added = [tuple(bytes.fromhex(c[1:])) for c in RAMP]
    colours = list(dict.fromkeys(base + added))
    return colours, base


def quantize(im, colours):
    arr = np.asarray(im.convert('RGBA')).copy()
    rgb = arr[:, :, :3]
    unique, inverse = np.unique(rgb.reshape(-1, 3), axis=0, return_inverse=True)
    # Integer Euclidean RGB nearest match, every source RGB considered, no LUT approximation.
    delta = unique[:, None, :].astype(np.int32) - np.array(colours, dtype=np.int32)[None, :, :]
    chosen = np.sum(delta * delta, axis=2).argmin(axis=1)
    result = np.zeros_like(arr)
    result[:, :, :3] = np.array(colours, dtype=np.uint8)[chosen][inverse].reshape(H, W, 3)
    result[:, :, 3] = np.where(arr[:, :, 3] >= 128, 255, 0)
    result[result[:, :, 3] == 0] = 0
    return Image.fromarray(result)


def chroma_cutout(im):
    arr = np.asarray(im.convert('RGBA')).copy()
    rgb = arr[:, :, :3].astype(np.int16)
    green = (rgb[:, :, 1] > 80) & (rgb[:, :, 1] > rgb[:, :, 0] + 20) & (rgb[:, :, 1] > rgb[:, :, 2] + 20)
    arr[:, :, 3] = np.where(green, 0, 255)
    arr[green] = 0
    return Image.fromarray(arr)


def board_background(size):
    # Review-only flat backdrop. This is not part of keys/ or any FX sprite.
    return Image.new('RGBA', size, (30, 30, 36, 255))


def assemble():
    conf = json.loads(CONFIG.read_text(encoding='utf-8'))
    master = Image.open(ROOT / conf['source']).convert('RGBA')
    colours, base = palette()
    # Use one coherent neutral/rose subset; other game ramps remain allowed but
    # are not candidates, preventing green-screen fringes from mapping to gold.
    candidates = list(dict.fromkeys([tuple(bytes.fromhex(c[1:])) for c in RAMP] + [(255, 255, 255), (20, 22, 28)]))
    assert all(c in colours for c in candidates)
    write_json('palette.json', {'source': str(PALETTE_SOURCE), 'source_sha256': hashlib.sha256(PALETTE_SOURCE.read_bytes()).hexdigest(), 'extension_name': 'vanlac', 'extension': RAMP, 'allowed_rgb': colours, 'quantization_rgb': candidates, 'base_entries': len(base), 'unique_colours': len(colours), 'method': 'nearest Euclidean RGB within neutral/rose subset; no dithering; alpha >=128 ->255 else0'})
    row_h = H * 3 + 44
    sheet = board_background((W * 6 + 36, row_h * 5 + 16))
    draw = ImageDraw.Draw(sheet)
    font_path = Path('C:/Windows/Fonts/consola.ttf')
    font = ImageFont.truetype(str(font_path), 21) if font_path.exists() else ImageFont.load_default()
    native = board_background((W * 5, H + 28))
    ndraw = ImageDraw.Draw(native)
    records = []
    (ROOT / 'original-small').mkdir(exist_ok=True)
    for i, entry in enumerate(conf['keys'], 1):
        original_crop = master.crop(tuple(entry['crop']))
        original_crop.save(ROOT / f'gen-k{i}.png')
        crop = chroma_cutout(original_crop) if conf.get('chroma') else original_crop
        top, bottom = entry['target_top'], entry['target_bottom']
        scale = 57 / (bottom - top + 1)
        resized = crop.resize((round(crop.width * scale), round(crop.height * scale)), Image.Resampling.NEAREST)
        foot = entry['foot']
        offset = (120 - round(foot[0] * scale), 144 - round(foot[1] * scale))
        # Prove the non-transparent artwork fits the game frame before pasting.
        # A source alpha cutoff removes generated soft glow; no geometry is invented.
        solid = resized.getchannel('A').point(lambda a: 255 if a >= 128 else 0)
        bbox = solid.getbbox()
        assert bbox is not None
        placed = (bbox[0] + offset[0], bbox[1] + offset[1], bbox[2] + offset[0], bbox[3] + offset[1])
        assert 0 <= placed[0] < placed[2] <= W and 0 <= placed[1] < placed[3] <= H, ('art would clip', i, placed)
        small = Image.new('RGBA', (W, H))
        small.paste(resized, offset)
        small.save(ROOT / 'original-small' / f'k{i}.png')
        key = quantize(small, candidates)
        key.save(ROOT / 'keys' / f'k{i}.png')
        row_y = 16 + (i - 1) * row_h
        draw.text((12, row_y), f'k{i} | {TIMES[i-1]:.2f}s | SOURCE NEAREST 3x', font=font, fill='#ddd8e0')
        draw.text((W * 3 + 24, row_y), 'PALETTE + BINARY ALPHA 3x', font=font, fill='#ddd8e0')
        sheet.alpha_composite(small.resize((W * 3, H * 3), Image.Resampling.NEAREST), (12, row_y + 32))
        sheet.alpha_composite(key.resize((W * 3, H * 3), Image.Resampling.NEAREST), (W * 3 + 24, row_y + 32))
        native.alpha_composite(key, ((i - 1) * W, 28))
        ndraw.text(((i - 1) * W + 8, 4), f'k{i} {TIMES[i-1]:.2f}s', fill='white')
        records.append({'key': i, 'time_seconds': TIMES[i-1], 'crop': entry['crop'], 'target_source_top_bottom': [top, bottom], 'target_scaled_height': round((bottom-top+1)*scale), 'source_foot': foot, 'scale': scale, 'offset': offset, 'artwork_bbox_at_alpha128': placed, 'pixel_bbox': key.getbbox()})
    sheet.convert('RGB').save(ROOT / 'sheet.png')
    native.convert('RGB').save(ROOT / 'native.png')
    detail = master.crop(tuple(conf['detail_crop']))
    detail.save(ROOT / 'gen-detail.png')
    if conf.get('chroma'):
        chroma_cutout(detail).save(ROOT / 'detail-cutout.png')
    write_json('transforms.json', {'source': conf['source'], 'game_size': [W, H], 'foot_pivot': [120, 144], 'resample': 'NEAREST', 'keys': records, 'detail_crop': conf['detail_crop']})


def verify():
    colours = set(tuple(x) for x in json.loads((ROOT / 'palette.json').read_text(encoding='utf-8'))['allowed_rgb'])
    report = {'png': [], 'keys': [], 'outside_palette': 0, 'nonbinary_alpha': 0}
    for p in sorted(ROOT.rglob('*.png')):
        with Image.open(p) as im:
            im.load()
            report['png'].append({'file': str(p.relative_to(ROOT)), 'size': list(im.size), 'sha256': hashlib.sha256(p.read_bytes()).hexdigest(), 'bytes': p.stat().st_size})
    for i in range(1, 6):
        p = ROOT / 'keys' / f'k{i}.png'
        im = Image.open(p).convert('RGBA')
        assert im.size == (W, H), (p, im.size)
        rgba = np.asarray(im)
        alpha = set(int(x) for x in np.unique(rgba[:, :, 3]))
        wrong_a = int(np.sum((rgba[:, :, 3] != 0) & (rgba[:, :, 3] != 255)))
        opaque = rgba[:, :, 3] == 255
        visible = set(tuple(int(v) for v in c) for c in np.unique(rgba[:, :, :3][opaque], axis=0))
        wrong_c = visible - colours
        wrong_pixels = sum(1 for c in rgba[:, :, :3][opaque] if tuple(int(v) for v in c) in wrong_c)
        report['outside_palette'] += wrong_pixels
        report['nonbinary_alpha'] += wrong_a
        assert alpha == {0, 255}, (i, alpha)
        assert not wrong_c, (i, wrong_c)
        bbox = im.getbbox()
        assert bbox and bbox[0] > 0 and bbox[1] > 0 and bbox[2] < W and bbox[3] < H, ('touches frame edge', i, bbox)
        report['keys'].append({'file': f'keys/k{i}.png', 'visible_colours': len(visible), 'opaque_pixels': int(opaque.sum()), 'alpha_values': sorted(alpha), 'bbox': bbox})
    conf = json.loads(CONFIG.read_text(encoding='utf-8'))
    assert len(conf['keys']) == 5
    transform = json.loads((ROOT / 'transforms.json').read_text(encoding='utf-8'))
    assert all(x['target_scaled_height'] == 57 for x in transform['keys'])
    for f in ['DESIGN.md', 'NOTES.md', 'prompt-01.txt', 'prompt-02.txt', 'prompt-03.txt', 'prompt-04.txt', 'gen-detail.png', 'sheet.png', 'native.png']:
        assert (ROOT / f).stat().st_size > 0, f
    sheet = Image.open(ROOT / 'sheet.png')
    assert sheet.size == (W * 6 + 36, (H * 3 + 44) * 5 + 16)
    assert len(RAMP) <= 8
    if conf.get('chroma'):
        for i in range(1, 6):
            rgba = np.asarray(Image.open(ROOT / 'original-small' / f'k{i}.png').convert('RGBA'))
            rgb = rgba[:, :, :3].astype(np.int16)
            leak = (rgba[:, :, 3] > 0) & (rgb[:, :, 1] > 80) & (rgb[:, :, 1] > rgb[:, :, 0] + 20) & (rgb[:, :, 1] > rgb[:, :, 2] + 20)
            assert not leak.any(), ('green background leak', i)
    write_json('verification.json', report)
    msg = f"PASS VL1: keys=5/5 size=240x220 target=57px alpha=0/255 outside_palette={report['outside_palette']} nonbinary_alpha={report['nonbinary_alpha']} png_decoded={len(report['png'])} sheet=3x; visual review documented in NOTES.md"
    (ROOT / 'verify.log').write_text(msg + '\n', encoding='utf-8')
    print(msg)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--verify-only', action='store_true')
    args = parser.parse_args()
    if not args.verify_only:
        assemble()
    verify()
