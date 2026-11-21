"""Extract imagegen plates and author motion transforms, never draw primary art."""
import hashlib
import json
import math
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

from build import ROOT, SIZE, LAYERS, render, preview


def save_json(name, value):
    (ROOT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def clean_component(im):
    arr = np.array(im.convert('RGBA'))
    mask = arr[:, :, 3] >= 180
    seen = np.zeros(mask.shape, dtype=bool)
    components = []
    for y, x in zip(*np.where(mask)):
        if seen[y, x]:
            continue
        q = deque([(int(y), int(x))])
        seen[y, x] = True
        component = []
        while q:
            yy, xx = q.popleft()
            component.append((yy, xx))
            for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                ny, nx = yy + dy, xx + dx
                if 0 <= ny < mask.shape[0] and 0 <= nx < mask.shape[1] and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    q.append((ny, nx))
        components.append(component)
    keep = np.zeros(mask.shape, dtype=bool)
    largest = max(map(len, components))
    for component in components:
        if len(component) >= max(12, largest * .025):
            yy, xx = zip(*component)
            keep[yy, xx] = True
    arr[:, :, 3] = np.where(keep, 255, 0)
    arr[~keep] = 0
    result = Image.fromarray(arr)
    return result.crop(result.getbbox())


def quantize(im, palette):
    arr = np.array(im.convert('RGBA'))
    rgb = arr[:, :, :3].astype(np.int32)
    pal = np.array(palette, dtype=np.int32)
    delta = rgb[:, :, None, :] - pal[None, None, :, :]
    arr[:, :, :3] = pal[(delta * delta).sum(axis=3).argmin(axis=2)]
    arr[arr[:, :, 3] == 0] = 0
    return Image.fromarray(arr)


def cut_vl1(key, polygon, size, floor=False):
    """Select existing artwork only; polygon is a crop mask, never a drawn flame."""
    im = Image.open(ROOT.parent / f'VL1/gen-k{key}.png').convert('RGBA')
    arr = np.array(im)
    rgb = arr[:, :, :3].astype(np.int16)
    green = (rgb[:, :, 1] > 80) & (rgb[:, :, 1] > rgb[:, :, 0]+20) & (rgb[:, :, 1] > rgb[:, :, 2]+20)
    mask = Image.new('1', im.size)
    ImageDraw.Draw(mask).polygon(polygon, fill=1)
    keep = ~green & np.array(mask, dtype=bool)
    # Floor crops additionally exclude the dark character and its costume.
    if floor:
        keep &= (rgb[:, :, 0] > 175) & (rgb[:, :, 2] > 95)
    arr[:, :, 3] = np.where(keep, 255, 0)
    arr[~keep] = 0
    im = Image.fromarray(arr)
    im = im.crop(im.getbbox()).resize(size, Image.Resampling.NEAREST)
    palette = json.loads((ROOT.parent/'VL1/palette.json').read_text(encoding='utf-8'))['quantization_rgb']
    im = quantize(im, palette)
    # One-pixel morphological growth using an existing adjacent rim colour.
    # No grey/white replacement, no new silhouette design, no alpha blending.
    arr = np.array(im)
    arr = np.pad(arr, ((2,2),(2,2),(0,0)))
    original = arr.copy()
    shifts = () if floor else ((-1,0),(1,0),(0,-1),(0,1))
    for dy,dx in shifts:
        adjacent = np.roll(original, (dy,dx), axis=(0,1))
        grow = (arr[:,:,3] == 0) & (adjacent[:,:,3] > 0)
        arr[grow] = adjacent[grow]
    im = Image.fromarray(arr)
    return im.crop(im.getbbox())


def sources():
    # All primary flame shapes are crops of the APPROVED VL1 generation.
    specs = {
        'inhale-A': (2, [(96,55),(260,55),(260,194),(214,210),(214,300),(96,300)], (37,61)),
        'inhale-B': (2, [(295,126),(442,126),(442,403),(306,403),(306,211),(295,211)], (33,61)),
        'inhale-C': (2, [(37,207),(98,207),(98,294),(210,307),(210,411),(37,411)], (46,48)),
        'pressure-A': (3, [(129,86),(241,86),(241,197),(217,239),(217,279),(129,279)], (31,48)),
        'pressure-B': (3, [(295,127),(378,127),(378,287),(311,287),(311,237),(295,237)], (25,42)),
        'pressure-C': (2, [(40,286),(208,286),(208,410),(40,410)], (37,28)),
        'burst-A': (3, [(129,86),(241,86),(241,197),(217,239),(217,279),(129,279)], (30,48)),
        'burst-B': (3, [(295,127),(378,127),(378,287),(311,287),(311,237),(295,237)], (25,43)),
        'burst-C': (2, [(96,55),(260,55),(260,194),(214,210),(214,300),(96,300)], (29,49)),
        'floor-ring': (3, [(145,339),(213,339),(213,420),(309,420),(309,339),(370,339),(370,448),(145,448)], (100,50)),
        'floor-wave': (3, [(145,339),(213,339),(213,420),(309,420),(309,339),(370,339),(370,448),(145,448)], (100,50)),
        'residue': (2, [(40,286),(208,286),(208,410),(40,410)], (20,16)),
    }
    assets = {}
    for name, (key, polygon, size) in specs.items():
        is_floor = name.startswith('floor-')
        im = cut_vl1(key, polygon, size, is_floor)
        if is_floor:
            im = im.resize(size, Image.Resampling.NEAREST)
        anchor = (120,144) if is_floor else (120,116)
        offset = (120-im.width//2,144-im.height//2) if is_floor else (120-im.width//2,116-im.height)
        canvas = Image.new('RGBA',SIZE)
        canvas.alpha_composite(im,offset)
        canvas.save(ROOT/'src'/f'{name}.png')
        assets[name] = {'path':f'src/{name}.png','anchor':anchor,'bbox':canvas.getbbox(),
                        'source':f'../VL1/gen-k{key}.png','source_polygon':polygon,
                        'native_size':im.size,'rim_growth_pixels':0 if is_floor else 1,
                        'sha256':hashlib.sha256((ROOT/'src'/f'{name}.png').read_bytes()).hexdigest()}
    # Tiny opaque hearts are retained; no character was present in the VL2 atlas.
    previous = json.loads((ROOT/'rig.json').read_text(encoding='utf-8'))['assets']
    for name in ('core-small','core-medium','core-hit','core-dying'):
        assets[name] = previous[name]
    return assets


def part(name, source, x, y, scale=(1, 1), rotation=0, ground_y=144, layer=None, projection_y=1):
    return {'id': name, 'source': source, 'position': [round(x, 3), round(y, 3)],
            'rotation': round(rotation, 3), 'scale': [round(v, 4) for v in scale],
            'ground_y': round(ground_y, 3), 'layer': layer or ('back' if ground_y < 144 else 'front'),
            'projection_y': projection_y}


def make_rig(assets):
    frames = []
    for f in range(90):
        t = f / 30
        phase = 'ember' if f < 10 else 'inhale' if f < 33 else 'pressure' if f < 67 else 'burst' if f < 77 else 'decay'
        pulse = max(max(0, 1-abs(f-p)/4)*strength for p, strength in ((39,.20),(50,.30),(61,.42)))
        parts = []
        if f < 89:
            if f < 10:
                width = 52 + 2*f
            elif f < 33:
                width = 72 + 2*(f-10)
            elif f < 67:
                width = 84 - 2*round(5*pulse)
            elif f < 77:
                width = 126 + 8*(f-67) if f <= 72 else 166 + 8*(f-72)
            else:
                width = 176 - 14*(f-77)
            width = min(200, int(width)//2*2)
            floor = 'floor-wave' if 67 <= f <= 78 else 'floor-ring'
            parts.append(part('ground', floor, 120, 144, (width/100, width/100), layer='floor'))
            if 10 <= f < 67:
                u = min(1, (f-10)/22)
                shrink = 1 - .14*pulse
                if f < 33:
                    positions = [(94+5*u, 120, -3), (150-4*u, 138, 1), (89+4*u, 146, -5)]
                else:
                    positions = [(106,120,-3),(140,123,3),(96,146,-6)]
                for i, (x,y,r) in enumerate(positions):
                    source = f'{phase}-{"ABC"[i]}'
                    s = (.72+.28*u) * shrink
                    parts.append(part('ABC'[i],source,x,y,(s,s), r + 2*math.sin(f*.48+i*2),
                                      ground_y=133 if i < 2 else 153))
            if 67 <= f <= 76:
                growth = .55 + .09*(f-67)
                for i in range(8):
                    angle = i*math.tau/8 + .18
                    radius = 21 + 1.5*(f-67)
                    x = 120 + radius*math.cos(angle)
                    gy = 144 + .5*radius*math.sin(angle)
                    y = gy - 13
                    parts.append(part(f'burst-{i}',f'burst-{"ABC"[i%3]}', x,y,
                                      (.90*growth, growth), 90+math.degrees(angle),
                                      ground_y=gy, projection_y=.5))
            if 77 <= f <= 85:
                for i in range(2):
                    s = (86-f)/11
                    parts.append(part(f'residue-{i}','residue',78+i*84,145+i*9,(s,s),(-45,45)[i],ground_y=142+i*12))
            core = 'core-small' if f < 33 else 'core-medium' if f < 67 else 'core-hit' if f <= 74 else 'core-dying'
            s = (1+pulse) if f < 67 else 1 if f <= 74 else max(.5,(89-f)/14)
            parts.append(part('heart',core,120,112,(s,s),ground_y=144,layer='front'))
        frames.append({'frame':f, 'time':round(t,6), 'phase':phase, 'pulse':round(pulse,4),
                       'events':(['heartbeat'] if f in (39,50,61) else []) + (['hit'] if f==72 else []),
                       'floor_width':width if f<89 else 0, 'parts':parts})
    rig = {'version':2, 'fps':30, 'frame_count':90, 'canvas':SIZE, 'foot_pivot':[120,144],
           'chest_pivot':[120,112], 'heartbeats_seconds':[1.30,1.67,2.03],
           'heartbeat_frames':[39,50,61], 'hit_frame':72, 'empty_frame':89,
           'depth_rule':'back iff ground_y < 144; front otherwise; floor is independent',
           'resampling':'NEAREST; opaque binary alpha; no crossfade', 'assets':assets, 'frames':frames}
    save_json('rig.json',rig)
    return rig


def edge_metric(im):
    mask = np.array(im)[:,:,3] > 0
    p = np.pad(mask,1)
    edge = mask & ~(p[:-2,1:-1] & p[2:,1:-1] & p[1:-1,:-2] & p[1:-1,2:])
    blocks = mask[:-1,:-1] & mask[1:,:-1] & mask[:-1,1:] & mask[1:,1:]
    cluster = np.zeros_like(mask)
    for dy,dx in ((0,0),(0,1),(1,0),(1,1)):
        cluster[dy:dy+blocks.shape[0],dx:dx+blocks.shape[1]] |= blocks
    return {'edge_pixels':int(edge.sum()),'edge_in_2x2':int((edge & cluster).sum()),
            'percent':round(100*(edge & cluster).sum()/max(1,edge.sum()),2)}


def audit(rig):
    palette = {tuple(c) for c in json.loads((ROOT.parent/'VL1/palette.json').read_text(encoding='utf-8'))['quantization_rgb']}
    source_metrics = {}
    for name, asset in rig['assets'].items():
        im = Image.open(ROOT/asset['path']).convert('RGBA')
        arr = np.array(im)
        assert im.size == SIZE
        assert set(np.unique(arr[:,:,3])) <= {0,255}
        assert all(tuple(c) in palette for c in np.unique(arr[arr[:,:,3]>0,:3],axis=0))
        source_metrics[name] = edge_metric(im)
    checks=[]
    for f in range(90):
        layers=render(f,rig)
        for layer,im in layers.items():
            arr = np.array(im)
            assert set(np.unique(arr[:,:,3])) <= {0,255}, (f,layer,'alpha')
            assert all(tuple(c) in palette for c in np.unique(arr[arr[:,:,3]>0,:3],axis=0)), (f,layer,'palette')
            bbox=im.getbbox()
            assert bbox is None or (bbox[0]>0 and bbox[1]>0 and bbox[2]<240 and bbox[3]<220), (f,layer,bbox)
        if f==89:
            assert all(im.getbbox() is None for im in layers.values())
        assert all(p['layer']==('back' if p['ground_y']<144 else 'front') for p in rig['frames'][f]['parts'] if p['layer']!='floor')
        if f < 89:
            box = layers['floor'].getbbox()
            assert (box[3]-box[1])*2 == box[2]-box[0], (f,'floor ratio',box)
        checks.append({'frame':f,'bboxes':{k:v.getbbox() for k,v in layers.items()}})
    (ROOT/'keys-v2').mkdir(exist_ok=True)
    board=Image.new('RGBA',(240*5,220*2+24),'#222028')
    d=ImageDraw.Draw(board)
    key_metrics=[]
    for i,f in enumerate((6,25,50,72,85),1):
        layers=render(f,rig)
        im=preview(layers)
        im.save(ROOT/'keys-v2'/f'k{i}.png')
        old=Image.open(ROOT.parent/'VL1/keys'/f'k{i}.png').convert('RGBA')
        board.alpha_composite(old,((i-1)*240,24))
        board.alpha_composite(im,((i-1)*240,244))
        d.text(((i-1)*240+5,5),f'k{i}: VL1 / VL2 f{f}', fill='white')
        floor_box=layers['floor'].getbbox()
        ratio=(floor_box[3]-floor_box[1])/(floor_box[2]-floor_box[0])
        assert ratio==.5,(f,ratio)
        fx=Image.new('RGBA',SIZE)
        fx.alpha_composite(layers['back']); fx.alpha_composite(layers['front'])
        key_metrics.append({'key':i,'frame':f,'floor_bbox':floor_box,'floor_h_w':round(ratio,4),
                            'fx_edge':edge_metric(fx),'burst_tongues':sum(p['id'].startswith('burst-') for p in rig['frames'][f]['parts'])})
    board.convert('RGB').save(ROOT/'comparison.png')
    board.resize((board.width*2,board.height*2),Image.Resampling.NEAREST).convert('RGB').save(ROOT/'comparison-2x.png')
    # Review individual layers, no character baked into these tiles.
    layers_board=Image.new('RGBA',(240*5,220*3),'#222028')
    for col,f in enumerate((6,25,50,72,85)):
        for row,layer in enumerate(LAYERS):
            layers_board.alpha_composite(render(f,rig)[layer],(240*col,220*row))
    layers_board.convert('RGB').save(ROOT/'layers-review.png')
    save_json('verification.json',{'sources':source_metrics,'keys':key_metrics,'frames':checks,'verified_frames':90,
                                 'source_count':len(source_metrics),'final_empty':True})
    print('PASS audit: 16 sources; 90/90 rig frames rendered; margins OK; depth OK; frame 89 empty; 5 keys rebuilt; floor h/w = 0.5000')
    for k in key_metrics:
        print(f"k{k['key']} f{k['frame']}: edge>=2x2 {k['fx_edge']['percent']}%; floor {k['floor_h_w']}; burst tongues {k['burst_tongues']}")


if __name__=='__main__':
    audit(make_rig(sources()))
