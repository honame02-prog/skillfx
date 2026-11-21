"""VL2b: deterministic motion authoring using approved VL1 cropped artwork only."""
import hashlib
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from build import ROOT, SIZE, LAYERS, read_json, render, preview


def components(mask):
    seen = np.zeros(mask.shape, bool)
    for y, x in zip(*np.where(mask)):
        if seen[y, x]:
            continue
        q = [(int(y), int(x))]
        seen[y, x] = True
        group = []
        while q:
            yy, xx = q.pop()
            group.append((yy, xx))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    ny, nx = yy + dy, xx + dx
                    if 0 <= ny < mask.shape[0] and 0 <= nx < mask.shape[1] and mask[ny,nx] and not seen[ny,nx]:
                        seen[ny,nx] = True
                        q.append((ny,nx))
        yield group


def tidy(im):
    a = np.array(im)
    removed = 0
    for group in components(a[:,:,3] > 0):
        if len(group) < 3:
            yy, xx = zip(*group)
            a[yy,xx] = 0
            removed += len(group)
    # Detached white islands inside coloured rims become adjacent rim colour.
    white = (a[:,:,3] > 0) & (a[:,:,:3].min(axis=2) > 220)
    recoloured = 0
    for group in components(white):
        if len(group) >= 3:
            continue
        for y,x in group:
            neighbours = [a[ny,nx] for ny,nx in ((y-1,x),(y+1,x),(y,x-1),(y,x+1))
                          if 0 <= ny < a.shape[0] and 0 <= nx < a.shape[1]
                          and a[ny,nx,3] and a[ny,nx,:3].min() <= 220]
            if neighbours:
                a[y,x] = max(neighbours, key=lambda c:int(c[0]))
                recoloured += 1
    return Image.fromarray(a), removed, recoloured


def part(id_, source, position, scale, rotation=0, ground_y=144, layer=None, projection_y=1):
    return dict(id=id_, source=source, position=list(position), scale=[scale,scale],
                rotation=rotation, ground_y=ground_y,
                layer=layer or ('back' if ground_y<144 else 'front'), projection_y=projection_y)


def author():
    rig = read_json(ROOT/'rig.json')
    # A preserved input makes authoring repeatable, without touching VL2a2 preparation.
    original = ROOT/'rig-vl2a2.json'
    if not original.exists():
        original.write_text(json.dumps(rig,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    rig = read_json(original)
    specs = {
        'burst-A': ([(90,125),(238,125),(238,248),(220,248),(151,222),(90,208)], (236,246), .43, -140),
        'burst-B': ([(292,132),(408,132),(408,218),(299,249),(291,249)], (294,246), .43, -48),
        'burst-C': ([(311,239),(396,192),(498,192),(501,280),(422,296),(312,276)], (313,266), .38, -13),
    }
    # These masks only select three character-free curls from the approved burst.
    # Preserve the source-space root when resizing: never centre the crop bbox.
    master = Image.open(ROOT.parent/'VL1/gen-k4.png').convert('RGBA')
    palette = read_json(ROOT.parent/'VL1/palette.json')['quantization_rgb']
    from prepare import quantize
    for name,(polygon,root,factor,axis) in specs.items():
        a=np.array(master)
        rgb=a[:,:,:3].astype(np.int16)
        green=(rgb[:,:,1]>80)&(rgb[:,:,1]>rgb[:,:,0]+20)&(rgb[:,:,1]>rgb[:,:,2]+20)
        mask=Image.new('1',master.size)
        ImageDraw.Draw(mask).polygon(polygon,fill=1)
        keep=np.array(mask,dtype=bool)&~green
        # Exclude all dark costume/skin at the crop roots; only luminous flame paint.
        keep &= (rgb[:,:,0]>155)&(rgb[:,:,2]>80)
        a[~keep]=0
        a[keep,3]=255
        crop=Image.fromarray(a)
        box=crop.getbbox()
        crop=crop.crop(box)
        crop=crop.resize((round(crop.width*factor),round(crop.height*factor)),Image.Resampling.NEAREST)
        crop=quantize(crop,palette)
        a=np.array(crop)
        a=np.pad(a,((2,2),(2,2),(0,0)))
        base=a.copy()
        for dy,dx in ((-1,0),(1,0),(0,-1),(0,1)):
            neighbour=np.roll(base,(dy,dx),axis=(0,1))
            grow=(a[:,:,3]==0)&(neighbour[:,:,3]>0)
            a[grow]=neighbour[grow]
        crop=Image.fromarray(a)
        canvas=Image.new('RGBA',SIZE)
        offset=(120-round((root[0]-box[0])*factor)-2,116-round((root[1]-box[1])*factor)-2)
        canvas.alpha_composite(crop,offset)
        canvas.save(ROOT/'src'/f'{name}.png')
        rig['assets'][name].update(source='../VL1/gen-k4.png',source_polygon=polygon,
            native_size=crop.size,radial_axis_degrees=axis,source_root=root,source_scale=factor)
    cleaned = {}
    for name, asset in rig['assets'].items():
        if name.startswith(('inhale-', 'pressure-', 'burst-')):
            im, removed, recoloured = tidy(Image.open(ROOT/asset['path']).convert('RGBA'))
            im.save(ROOT/asset['path'])
            cleaned[name] = dict(removed_pixels=removed, white_pixels_joined_to_rim=recoloured)
    # Enlarge existing curling, hollow tongues; their bases now share the chest.
    # No new primary art, no procedural curves, no ellipse or soft-alpha drawing.
    for f, frame in enumerate(rig['frames']):
        old = frame['parts']
        heart = next((p for p in old if p['id']=='heart'), None)
        ground = next((p for p in old if p['id']=='ground'), None)
        parts = []
        if f < 89:
            # Continuous floor envelope; the burst stays secondary to the chest flower.
            knots = [(0,12),(9,66),(25,100),(32,96),(38,84),(66,80),(72,122),(76,138),(88,4)]
            width = int(round(np.interp(f,*zip(*knots))/2))*2
            width = max(4,width)
            ground['scale'] = [width/100,width/100]
            frame['floor_width'] = width
            parts.append(ground)
        if 10 <= f <= 66:
            # Gradual entrance, then a 9-frame morph using matching stable IDs.
            u = min(1,(f-9)/9)
            blend = min(1,max(0,(f-29)/12))
            start = [(99,120,-3),(146,138,1),(93,146,-5)]
            end = [(106,120,-3),(140,123,3),(96,146,-6)]
            for i in range(3):
                x,y,r = [a+(b-a)*blend for a,b in zip(start[i],end[i])]
                # Match the source swap's physical footprint instead of jumping in size.
                family = 'inhale' if f<33 else 'pressure'
                src = family+'-'+'ABC'[i]
                native = rig['assets'][src]['native_size']
                si = rig['assets']['inhale-'+'ABC'[i]]['native_size']
                sp = rig['assets']['pressure-'+'ABC'[i]]['native_size']
                target_h = si[1]+(sp[1]-si[1])*blend
                s = u*target_h/native[1]*(1-.14*frame['pulse'])
                parts.append(part('ABC'[i],src,(x,y),s,r+2*math.sin(f*.35+i*2),133 if i<2 else 153))
        if 67 <= f <= 88:
            # Eight large radial curls rooted at the chest; 3/4 vertical projection.
            # Hold their identities through decay so they do not disappear at frame 77.
            envelope = float(np.interp(f,[67,72,76,80,84,88],[.48,1.18,1.28,.95,.44,.15]))
            for i in range(8):
                angle = i*math.tau/8 + .12
                gy = 144 + 12*math.sin(angle)
                s = envelope*(1+.06*math.sin(i*2.4))
                parts.append(part(f'burst-{i}','burst-'+'ABC'[i%3],(120,112),s,
                                  math.degrees(angle)-rig['assets']['burst-'+'ABC'[i%3]]['radial_axis_degrees']+1.5*math.sin((f-67)*.4+i),gy,projection_y=.85))
        if heart:
            if f>=75:
                # Keep the original hit silhouette while it contracts, avoid a source pop.
                heart['source']='core-hit'
                s=max(.07,(89-f)/14)
                heart['scale']=[s,s]
            parts.append(heart)
        frame['parts']=parts
    # Register the rendered core centroid, not just an authored pivot. Affine nearest
    # rounding is measured; each heart stays within one pixel of (120,112).
    for f, frame in enumerate(rig['frames']):
        h = next((p for p in frame['parts'] if p['id']=='heart'),None)
        if not h:
            continue
        for _ in range(2):
            solo = dict(rig,frames=[dict(parts=[h])])
            mask=np.array(render(0,solo)['front'])[:,:,3]>0
            yy,xx=np.where(mask)
            if len(xx):
                h['position'][0]+=120-float(xx.mean())
                h['position'][1]+=112-float(yy.mean())
    for asset in rig['assets'].values():
        path=ROOT/asset['path']
        asset['sha256']=hashlib.sha256(path.read_bytes()).hexdigest()
        asset['bbox']=Image.open(path).getbbox()
    rig['version']=3
    rig['vl2b']=dict(cleanup=cleaned,burst='8 chest-rooted VL1 k4 curls; projection .85; continuous decay',initial_k2_k3_white_pixels_joined=32)
    (ROOT/'rig.json').write_text(json.dumps(rig,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('AUTHORED VL2b:',json.dumps(cleaned))


def audit_and_preview(rig,out):
    palette={tuple(c) for c in read_json(ROOT.parent/'VL1/palette.json')['quantization_rgb']}
    previous=None
    last_center=None
    records=[]
    composites=[]
    violations=[]
    transition_frames={10,33,67,77,89}
    expected={out/l/f'{f:03d}.png' for l in LAYERS for f in range(90)}
    assert set(out.rglob('*.png'))==expected, 'unexpected/missing PNG files'
    for asset in rig['assets'].values():
        assert hashlib.sha256((ROOT/asset['path']).read_bytes()).hexdigest()==asset['sha256']
    for f in range(90):
        layers={l:Image.open(out/l/f'{f:03d}.png').convert('RGBA') for l in LAYERS}
        for l,im in layers.items():
            a=np.array(im)
            assert im.size==SIZE
            bbox=im.getbbox()
            assert bbox is None or (bbox[0]>0 and bbox[1]>0 and bbox[2]<240 and bbox[3]<220),(f,l,'clipped')
            assert set(np.unique(a[:,:,3]))<={0,255}
            assert all(tuple(c) in palette for c in np.unique(a[a[:,:,3]>0,:3],axis=0))
            assert im.tobytes()==render(f,rig)[l].tobytes(),(f,l,'disk differs from rig')
        assert all(p['source'] in rig['assets'] and rig['assets'][p['source']]['path'].startswith('src/')
                   for p in rig['frames'][f]['parts'])
        stack=np.stack([np.array(layers[l]) for l in LAYERS])
        changed=0 if previous is None else int(np.any(stack!=previous,axis=(0,3)).sum())
        center=None
        heart=next((p for p in rig['frames'][f]['parts'] if p['id']=='heart'),None)
        if heart:
            a=np.array(render(0,dict(rig,frames=[dict(parts=[heart])]))['front'])
            yy,xx=np.where(a[:,:,3]>0)
            if len(xx): center=[float(xx.mean()),float(yy.mean())]
        drift=math.dist(last_center,center) if center and last_center else 0
        if drift>2: violations.append(dict(frame=f,reason='heart drift',value=drift))
        ids=[]
        for p in rig['frames'][f]['parts']:
            if p['id'] in ('heart','ground'): continue
            solo=render(0,dict(rig,frames=[dict(parts=[p])]))
            area=sum(np.count_nonzero(np.array(im)[:,:,3]) for im in solo.values())
            if area: ids.append(p['id'])
        old_ids=set(records[-1]['tongue_ids']) if records else set()
        birth=set(ids)-old_ids
        death=old_ids-set(ids)
        if f not in transition_frames and (birth or death):
            violations.append(dict(frame=f,reason='unplanned tongue birth/death',born=sorted(birth),died=sorted(death)))
        heart_area=0
        if heart:
            heart_area=int(np.count_nonzero(a[:,:,3]))
        fx=Image.new('RGBA',SIZE);fx.alpha_composite(layers['back']);fx.alpha_composite(layers['front'])
        records.append(dict(frame=f,heart_pixels=heart_area,fx_bbox=fx.getbbox(),phase=rig['frames'][f]['phase'],changed_pixels=changed,
                            changed_percent=round(100*changed/(240*220),4),
                            heart_centroid=center,heart_drift_px=round(drift,4),tongues=len(ids),tongue_ids=ids,
                            births=sorted(birth),deaths=sorted(death)))
        previous=stack
        last_center=center
        bg=Image.new('RGBA',SIZE,'#23222a')
        bg.alpha_composite(preview(layers))
        composites.append(bg.convert('RGB'))
    assert all(Image.open(out/l/'089.png').getbbox() is None for l in LAYERS)
    # GIF delay is measured in 10 ms units. 30/30/40 ms gives exactly 30 fps average.
    durations=[30,30,40]*30
    images=[im.resize((720,660),Image.Resampling.NEAREST) for im in composites]
    colours=set()
    for im in composites:
        colours.update(map(tuple,np.unique(np.array(im).reshape(-1,3),axis=0).tolist()))
    # Exact union palette avoids both dithering and colour loss in the reference sprite.
    unique=sorted(set(colours))
    assert len(unique)<=256, len(unique)
    pal=Image.new('P',(1,1))
    flat=[c for rgb in unique for c in rgb]
    pal.putpalette(flat+[0]*(768-len(flat)))
    indexed=[im.quantize(palette=pal,dither=Image.Dither.NONE) for im in images]
    indexed[0].save(ROOT/'preview.gif',save_all=True,append_images=indexed[1:],duration=durations,
                    loop=0,optimize=False,disposal=2)
    grid=Image.new('RGB',(240*8,220*4+24),'#23222a')
    d=ImageDraw.Draw(grid)
    for x,f in enumerate((6,18,30,45,60,72,80,88)):
        d.text((x*240+6,6),f'frame {f}',fill='white')
        for row,l in enumerate(LAYERS):
            im=Image.open(out/l/f'{f:03d}.png').convert('RGBA')
            bg=Image.new('RGBA',SIZE,'#23222a');bg.alpha_composite(im)
            grid.paste(bg.convert('RGB'),(x*240,row*220+24))
        grid.paste(composites[f],(x*240,3*220+24))
    grid.save(ROOT/'preview-layers.png')
    report=dict(method=dict(pixel_delta='any RGBA change on any of three layers / 52800 canvas pixels',
                            heart_drift='Euclidean distance of independently rendered heart alpha centroids',
                            tongues='nonempty independently rendered flame instances; stable IDs, not connected components',
                            permitted_transitions=sorted(transition_frames)),
                summary=dict(png_count=270,max_heart_drift_px=max(r['heart_drift_px'] for r in records),
                             max_changed_percent=max(r['changed_percent'] for r in records),
                             violations=len(violations),empty_89=True,gif_frames=90,gif_duration_ms=3000),
                violations=violations,frames=records)
    (ROOT/'continuity.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    assert not violations,violations
    print(f"PASS continuity: 89 transitions; heart drift max {report['summary']['max_heart_drift_px']:.4f}px; unplanned tongue changes 0")
    with Image.open(ROOT/'preview.gif') as gif:
        assert gif.n_frames==90
        total=0
        for f in range(90):
            gif.seek(f);total+=gif.info['duration']
        assert total==3000 and gif.info['loop']==0
    print(f"PASS preview: 90 frames; 720x660; 3000ms; loop=0; GIF { (ROOT/'preview.gif').stat().st_size } bytes")


if __name__=='__main__':
    author()
