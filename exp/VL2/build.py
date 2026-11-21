"""Render generated source plates through an explicit, binary-alpha sprite rig.

Only crops, nearest affine transforms, hard depth masks and compositing; no FX drawing.
"""
import argparse
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent
SIZE = (240, 220)
LAYERS = ('floor', 'back', 'front')


def read_json(path):
    return json.loads(path.read_text(encoding='utf-8'))


def render(frame, rig=None):
    rig = rig or read_json(ROOT / 'rig.json')
    layers = {name: Image.new('RGBA', SIZE) for name in LAYERS}
    for item in rig['frames'][frame]['parts']:
        asset = rig['assets'][item['source']]
        src = Image.open(ROOT / asset['path']).convert('RGBA')
        if item['layer'] == 'floor':
            # Tight source crop -> exact integer footprint; no endpoint lost to affine rounding.
            width = round(asset['native_size'][0] * item['scale'][0])
            height = round(asset['native_size'][1] * item['scale'][1])
            tight = src.crop(src.getbbox())
            floor = tight.resize((width, height), Image.Resampling.NEAREST)
            # Forward nearest assignment preserves sparse broken-ring extrema
            # that inverse sampling can skip; all colours remain source colours.
            original = np.array(tight)
            pixels = np.array(floor)
            yy, xx = np.where(original[:, :, 3] > 0)
            tx = np.rint(xx * (width-1) / max(1,tight.width-1)).astype(int)
            ty = np.rint(yy * (height-1) / max(1,tight.height-1)).astype(int)
            pixels[ty,tx] = original[yy,xx]
            floor = Image.fromarray(pixels)
            px, py = item['position']
            layers['floor'].alpha_composite(floor, (round(px)-width//2, round(py)-height//2))
            continue
        angle = math.radians(item['rotation'])
        sx, sy = item['scale']
        depth = item.get('projection_y', 1)
        a, b = math.cos(angle) * sx, -math.sin(angle) * sy
        c, d = math.sin(angle) * sx * depth, math.cos(angle) * sy * depth
        det = a * d - b * c
        if abs(det) < 1e-8:
            continue
        ia, ib, ic, id_ = d / det, -b / det, -c / det, a / det
        px, py = item['position']
        ax, ay = asset['anchor']
        coeff = (ia, ib, ax - ia * px - ib * py,
                 ic, id_, ay - ic * px - id_ * py)
        placed = src.transform(SIZE, Image.Transform.AFFINE, coeff,
                               resample=Image.Resampling.NEAREST)
        # Depth belongs to a ground plane, never to a sprite's upper tip.
        layers[item['layer']].alpha_composite(placed)
    return layers


def reference():
    base = Path('D:/SkillFX_TuThienChi_HoaLien/tienson/art/daosi')
    meta = read_json(base / 'daosi.json')
    entry = next(f for f in meta['frames'] if 'walk_down_right_00' in f['filename'])
    rect = entry['frame']
    atlas = Image.open(base / 'daosi.png').convert('RGBA')
    im = atlas.crop((rect['x'], rect['y'], rect['x'] + rect['w'], rect['y'] + rect['h']))
    im = im.crop(im.getbbox())
    im = im.resize((round(im.width * 57 / im.height), 57), Image.Resampling.NEAREST)
    out = Image.new('RGBA', SIZE)
    out.alpha_composite(im, (120 - im.width // 2, 144 - im.height))
    return out


def preview(layers):
    out = Image.new('RGBA', SIZE)
    for im in (layers['floor'], layers['back'], reference(), layers['front']):
        out.alpha_composite(im)
    return out


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--all', action='store_true', help='build all frames, previews and continuity audit')
    parser.add_argument('--frames', default='6,25,50,72,85')
    parser.add_argument('--out', type=Path, default=ROOT / 'test')
    args = parser.parse_args()
    out = args.out.resolve()
    if not out.is_relative_to(ROOT):
        parser.error('output must stay inside exp/VL2')
    frames = list(range(90)) if args.all else [int(f) for f in args.frames.split(',')]
    if any(f < 0 or f > 89 for f in frames):
        parser.error('frame range is 0..89')
    out.mkdir(parents=True, exist_ok=True)
    rig = read_json(ROOT / 'rig.json')
    palette = {tuple(c) for c in read_json(ROOT.parent / 'VL1/palette.json')['quantization_rgb']}
    for frame in frames:
        for layer, im in render(frame, rig).items():
            arr = np.array(im)
            assert set(np.unique(arr[:, :, 3])) <= {0, 255}
            assert all(tuple(c) in palette for c in np.unique(arr[arr[:, :, 3] > 0, :3], axis=0))
            if args.all:
                (out / layer).mkdir(exist_ok=True)
                im.save(out / layer / f'{frame:03d}.png')
            else:
                im.save(out / f'{frame:03d}-{layer}.png')
    if args.all:
        from motion import audit_and_preview
        audit_and_preview(rig, out)
    print(f'PASS build: {len(frames)} frames x 3 layers = {len(frames)*3} PNG; 240x220; binary alpha; palette OK; character excluded')


if __name__ == '__main__':
    main()
