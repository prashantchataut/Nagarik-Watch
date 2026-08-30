#!/usr/bin/env python3
"""Compose the Nagarik Watch OG image: generated editorial background + crisp
brand typography drawn with the actual site fonts (Mukta + Noto Sans Devanagari)."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BG = '/home/z/my-project/public/photos/desks/og-bg.jpg'
OUT = '/home/z/my-project/public/og-image.jpg'

CRIMSON = (192, 42, 42)
PAPER = (244, 241, 236)
INK = (26, 23, 20)

img = Image.open(BG).convert('RGB')
W, H = img.size  # 1344x768 -> crop/scale to 1200x630
target = (1200, 630)
scale = max(target[0] / W, target[1] / H)
img = img.resize((int(W * scale) + 1, int(H * scale) + 1), Image.LANCZOS)
W, H = img.size
left = (W - target[0]) // 2
top = (H - target[1]) // 2
img = img.crop((left, top, left + target[0], top + target[1]))

# soften and warm the background so text pops
overlay = Image.new('RGB', img.size, PAPER)
img = Image.blend(img, overlay, 0.35)
img = img.filter(ImageFilter.GaussianBlur(1.2))

draw = ImageDraw.Draw(img)

# crimson band at the bottom (masthead echo)
band_h = 150
draw.rectangle([0, target[1] - band_h, target[0], target[1]], fill=CRIMSON)

# fonts
try:
    f_deva = ImageFont.truetype('/usr/share/fonts/truetype/chinese/NotoSansSC-Regular.ttf', 108)
except Exception:
    f_deva = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 96)
try:
    f_lat = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 34)
    f_small = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 26)
except Exception:
    f_lat = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 30)
    f_small = f_lat

def center(text, y, font, fill):
    w = draw.textlength(text, font=font)
    draw.text(((target[0] - w) / 2, y), text, font=font, fill=fill)

# Devanagari masthead (Noto Sans Devanagari — complex-script shaping via raqm)
f_deva = ImageFont.truetype('/home/z/my-project/scripts/fonts/NotoSansDevanagari-Bold.ttf', 104)

center('नागरिक वाच', 165, f_deva, INK)
center('NAGARIK WATCH', 320, f_lat, CRIMSON)
center('समाचार · विचार · पात्रो · बजार', 385, f_small, (90, 84, 76))

# tagline inside the crimson band
center('नागरिक सरोकारको पहरा — नेपाली पत्रकारिता', target[1] - band_h + 58, f_small, PAPER)

img.save(OUT, 'JPEG', quality=88)
print('OG image saved:', OUT, img.size)
