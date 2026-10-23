"""Original pixel art; Pillow is needed only to regenerate, never to play/build.
No external images, traced artwork, fonts, or copyrighted character designs.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import random
ROOT = Path(__file__).resolve().parents[1] / 'public/assets'
OUTLINE = '#283444'

def character(kind, direction, step):
    im = Image.new('RGBA', (32, 48))
    d = ImageDraw.Draw(im)
    side = direction in ('left', 'right')
    back = direction == 'up'
    bob = -1 if step != 1 else 0
    def rect(box, color):
        x,y,x2,y2=box;d.rectangle((x,y+bob,x2,y2+bob),fill=color)
    def ellipse(box,color):
        x,y,x2,y2=box;d.ellipse((x,y+bob,x2,y2+bob),fill=color)
    d.ellipse((5,40,27,45), fill=(24,42,47,65))
    stride = (-2,0,2)[step]
    if kind in ('rtaro','vanilla'):
        cloak = kind == 'vanilla'
        # Shoes, soles, stepped gait. A travel coat, not any existing character costume.
        rect((8,35+stride,14,42+stride),OUTLINE);rect((18,35-stride,24,42-stride),OUTLINE)
        rect((9,36+stride,13,39+stride),'#526479');rect((19,36-stride,23,39-stride),'#526479')
        coat = '#62558c' if cloak else '#cf6653'
        dark = '#443e68' if cloak else '#9a4446'
        light = '#9680b2' if cloak else '#f5946c'
        rect((7,23,25,36),OUTLINE);rect((8,24,24,34),coat);rect((8,25,10,33),light);rect((22,26,24,35),dark)
        if cloak:rect((5,24,8,37),dark);rect((24,25,27,37),dark);rect((12,24,14,34),'#d7b776')
        else:rect((10,26,22,28),'#ffe4a5');rect((10,29,22,30),'#e7b476')
        arm = stride if not back else -stride
        rect((4,25+arm,7,32+arm),OUTLINE);rect((5,26+arm,7,31+arm),coat)
        rect((25,25-arm,28,32-arm),OUTLINE);rect((25,26-arm,27,31-arm),dark)
        rect((5,31+arm,7,33+arm),'#e4aa85');rect((25,31-arm,27,33-arm),'#e4aa85')
        ellipse((6,6,26,25),OUTLINE);rect((8,10,24,22),'#efba91');rect((10,10,21,20),'#ffd7a6')
        rect((9,22,22,23),'#bf806a');rect((6,13,8,18),'#e1a182');rect((25,13,27,18),'#e1a182')
        hair = '#463954' if cloak else '#423c45'
        ellipse((6,4,26,15),hair);rect((7,10,10,16),hair);rect((23,10,25,17),hair)
        rect((10,5,22,7),'#74607b' if cloak else '#6f5251')
        if back:
            ellipse((7,6,25,23),hair);rect((11,8,14,18),'#65506b' if cloak else '#5b4848')
        else:
            rect((11,11,15,13),hair);rect((20,10,23,12),hair)
            eyes=[(12,16),(21,16)] if not side else [(10,16)]
            for x,y in eyes:rect((x,y,x+1,y+2),OUTLINE);rect((x,y,x,y),'#fff0ca')
            rect((15,21,18,21),'#9f635b')
        if cloak:
            rect((9,23,24,25),'#c0a578');rect((11,23,13,24),'#f2dfad')
        else:
            # Original little teal backpack visible on back/side.
            if back or side:
                rect((10 if back else 23,25,22 if back else 28,34),OUTLINE)
                rect((11 if back else 24,26,21 if back else 27,32),'#527b7a')
                rect((13 if back else 25,27,19 if back else 26,28),'#88afa0')
    elif kind == 'marmot':
        ellipse((6,36+stride,14,42+stride),OUTLINE);ellipse((18,36-stride,26,42-stride),OUTLINE)
        ellipse((4,19,28,40),OUTLINE);ellipse((6,20,26,38),'#96734f');ellipse((8,20,22,35),'#b68d5d')
        ellipse((8,25,24,37),'#dec49a');rect((10,29,11,32),'#efdbb4')
        ellipse((3,7,12,17),OUTLINE);ellipse((21,7,30,17),OUTLINE)
        ellipse((5,9,10,14),'#b88968');ellipse((23,9,28,14),'#b88968')
        ellipse((4,10,28,28),OUTLINE);ellipse((5,11,27,26),'#b68d5d');ellipse((7,11,24,21),'#d0a875')
        if not back:
            ellipse((10,19,23,26),'#ead5ab');rect((15,20,18,21),OUTLINE)
            for x in ([10] if side else [10,22]):rect((x,16,x+1,18),OUTLINE);rect((x,16,x,16),'#fff0ce')
            rect((16,23,17,24),'#8c614e')
        rect((5,28+stride,8,34+stride),'#79573f');rect((25,28-stride,28,34-stride),'#79573f')
        # Leaf scarf.
        rect((7,27,26,29),'#63916c');rect((22,29,25,33),'#8cb77a')
        if back:ellipse((10,16,23,26),'#ae8155')
    else:
        # Floating pufferfish in a small travelling water bubble.
        d.arc((2,9,30,40),200,335,fill='#85cdd5',width=1)
        ellipse((5,14,27,37),OUTLINE);ellipse((6,14,26,35),'#5698ad');ellipse((7,15,25,32),'#89cad1')
        ellipse((7,24,25,36),'#f1ddb1');ellipse((8,26,23,34),'#ffedc5')
        for x,y in [(9,18),(21,18),(7,23),(24,23),(14,15)]:rect((x,y,x+1,y+1),'#44798f')
        d.polygon([(3,25+bob),(0,21+bob+stride),(0,31+bob+stride),(5,29+bob)],fill='#659daf')
        d.polygon([(27,25+bob),(31,21+bob-stride),(31,31+bob-stride),(26,29+bob)],fill='#659daf')
        if not back:
            for x in ([10] if side else [11,21]):rect((x,22,x+1,24),OUTLINE);rect((x,22,x,22),'#ffffff')
            rect((15,28,18,29),'#ba816d')
        else:rect((12,21,20,24),'#659daf')
        d.rectangle((16,40,17,41),fill='#a4dfe3')
    if direction == 'right':im=im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    return im

for kind in ('rtaro','marmot','fugu','vanilla'):
    sheet=Image.new('RGBA',(96,192))
    for row,direction in enumerate(('down','left','right','up')):
        for step in range(3):sheet.paste(character(kind,direction,step),(step*32,row*48))
    path=ROOT/'characters'/f'{kind}.png';path.parent.mkdir(parents=True,exist_ok=True);sheet.save(path)

# Tiles: fixed frame indices described in src/graphics/spec.ts.
sheet=Image.new('RGBA',(256,192))
def tile(idx):
    im=Image.new('RGBA',(32,32));return im,ImageDraw.Draw(im)
def paste(idx,im):sheet.paste(im,((idx%8)*32,(idx//8)*32))
for idx in range(48):
    im,d=tile(idx);rng=random.Random(840+idx)
    if idx<=2:
        d.rectangle((0,0,31,31),fill='#7fa577')
        for _ in range(26):
            x,y=rng.randrange(31),rng.randrange(31);d.line((x,y,x+1,y),fill=rng.choice(['#71986c','#8bb07f','#789f70']))
        if idx==1:
            for x,y in [(5,7),(22,19),(10,26)]:d.line((x-2,y,x,y+1,x+2,y-1),fill='#56855e');d.point((x,y-2),fill='#a1bd87')
        if idx==2:
            for x,y in [(7,10),(23,24)]:
                d.line((x,y,x,y+4),fill='#4f7c58');d.ellipse((x-2,y-2,x+2,y+2),fill='#f3d49a');d.point((x,y),fill='#c88f6f')
    elif idx in (3,4,5,6):
        d.rectangle((0,0,31,31),fill='#cfbb94' if idx!=3 else '#b6b8a3')
        for y in range(0,32,8):
            d.line((0,y,31,y),fill='#b5a988' if idx!=3 else '#999f91')
            for x in range(-8 if (y//8)%2 else 0,32,16):
                d.line((x,y,x,y+7),fill='#b5a988' if idx!=3 else '#999f91');d.line((x+2,y+1,x+14,y+1),fill='#e1d0ac' if idx!=3 else '#cbd0b9')
        if idx in (5,6):
            y=0 if idx==5 else 27;d.rectangle((0,y,31,y+4),fill='#ddd2b2');d.line((0,y+4,31,y+4),fill='#8a927f')
    elif idx in (7,27):
        d.rectangle((0,0,31,31),fill='#599eae')
        for x,y in [(3,6),(18,17),(6,28)]:d.line((x,y,x+9,y),fill='#8bc7cc');d.line((x+2,y+1,x+6,y+1),fill='#70b5be')
        if idx==27:d.rectangle((0,0,31,5),fill='#c8c6a3');d.line((0,5,31,5),fill='#7eaa9d')
    elif idx in (8,9,10,14):
        d.rectangle((0,0,31,31),fill='#d6b58e');d.line((0,30,31,30),fill='#ac927c')
        for y in range(3,32,8):d.line((0,y,31,y),fill='#c5a385')
        if idx==14:
            for y in range(0,32,8):
                for x in range(0 if y%16 else 8,32,16):d.line((x,y,x,y+7),fill='#ac927c')
        if idx==9:
            d.rectangle((4,3,27,27),fill='#765e56');d.rectangle((6,5,25,24),fill='#538798');d.polygon([(7,6),(24,6),(7,21)],fill='#a1c6be');d.line((15,5,15,24),fill='#dfcba0',width=2);d.line((6,15,25,15),fill='#dfcba0');d.rectangle((3,27,28,29),fill='#e1c9a0')
        if idx==10:
            d.rectangle((7,0,25,31),fill='#675859');d.rectangle((9,2,23,31),fill='#927b68');d.rectangle((11,5,21,17),fill='#70949b');d.line((12,6,20,6),fill='#abc3b6');d.rectangle((19,23,21,24),fill='#f3d18b')
    elif idx in (11,12):
        d.rectangle((0,0,31,31),fill='#5a6579')
        for y in range(0,32,8):
            d.line((0,y,31,y),fill='#85909b');d.line((0,y+6,31,y+6),fill='#414f65')
            for x in range(0 if y%16 else 8,32,16):d.line((x,y,x,y+7),fill='#46566c')
        if idx==12:d.rectangle((0,25,31,29),fill='#b89b80');d.rectangle((0,30,31,31),fill='#725f5b')
    elif idx==13:
        d.rectangle((0,0,31,22),fill='#f1d7a6')
        for x in range(0,32,8):d.rectangle((x,0,x+3,22),fill='#bc6d60');d.rectangle((x,23,x+5,25),fill='#8c5656')
    elif idx==15:
        d.rectangle((3,1,29,25),fill='#5f5b51');d.rectangle((5,3,27,22),fill='#f5dcab');d.line((6,4,26,4),fill='#fff1cc');d.rectangle((14,26,17,31),fill='#836f55')
    elif 16<=idx<=21:
        # Slice a 64x96 tree; all parts preserve transparency.
        tree=Image.new('RGBA',(64,96));t=ImageDraw.Draw(tree)
        t.ellipse((12,79,55,93),fill=(28,58,52,65));t.rectangle((27,48,38,86),fill='#5f5e48');t.rectangle((29,58,33,85),fill='#8e7a54');t.line((35,65,35,83),fill='#514e40',width=2)
        for box,c in [((4,23,59,71),'#365e53'),((8,9,55,61),'#43745b'),((15,1,48,46),'#558661'),((2,34,34,63),'#52855f'),((25,28,61,64),'#4b7b59'),((10,16,39,46),'#6c9b6b'),((20,6,44,29),'#7ca774')]:t.ellipse(box,fill=c)
        for _ in range(80):
            x,y=rng.randrange(9,55),rng.randrange(14,62)
            if tree.getpixel((x,y))[3]:t.line((x,y,x+2,y),fill=rng.choice(['#85ac75','#416f56','#639262']))
        n=idx-16;im=tree.crop(((n%2)*32,(n//2)*32,(n%2+1)*32,(n//2+1)*32))
    elif idx==22:
        d.rectangle((0,8,31,27),fill='#436e54');d.rectangle((0,5,31,21),fill='#65915f');d.line((0,6,31,6),fill='#91ac73')
    elif idx==23:
        d.rectangle((5,21,27,31),fill='#a27058');d.rectangle((3,18,29,22),fill='#cd9d71')
        for x,y in [(8,14),(18,10),(25,15)]:d.line((x,y,x,22),fill='#4c7b57');d.ellipse((x-3,y-3,x+3,y+3),fill='#deb48c');d.point((x,y),fill='#f6dc9c')
    elif idx==24:
        for y in [6,11,21]:d.rectangle((1,y,30,y+3),fill='#a78b65');d.line((2,y,29,y),fill='#ddbd88')
        d.rectangle((4,15,6,31),fill='#4c5a56');d.rectangle((25,15,27,31),fill='#4c5a56')
    elif idx==25:
        d.rectangle((14,10,17,31),fill='#4c6261');d.rectangle((10,3,21,12),fill='#4a5d59');d.rectangle((12,5,19,10),fill='#f7e0a5');d.rectangle((9,2,22,4),fill='#607268')
    elif idx==26:
        d.rectangle((0,0,31,31),fill='#999d92')
        for y in range(0,32,8):d.line((0,y,31,y),fill='#ddd6b9');d.line((0,y+6,31,y+6),fill='#77867f')
    elif idx==28:d.rectangle((0,0,31,31),fill=(23,46,44,45))
    paste(idx,im)
(ROOT/'tilesets').mkdir(exist_ok=True,parents=True);sheet.save(ROOT/'tilesets/kosugi.png')
print('Generated 4 original 96x192 RGBA sprite sheets and 256x192 RGBA tileset.')
