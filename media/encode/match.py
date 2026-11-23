"""Per-channel mean/std match of each clip's frame to the reference clip (ungraded), blended by strength.
Writes media/encode/match_<i>.txt with an ffmpeg lutrgb filter."""
import numpy as np, sys, os
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
rev = os.path.join(here, '..', '_review')
ref = np.asarray(Image.open(os.path.join(rev, 'ref-ungraded.png')).convert('RGB'), dtype=np.float64)
strength = {1: 0.7, 2: 0.7, 3: 0.7, 4: 0.25, 5: 0.5}
for i, k in strength.items():
    src = np.asarray(Image.open(os.path.join(rev, f'src_{i}.png')).convert('RGB'), dtype=np.float64)
    parts = []
    for c, ch in enumerate('rgb'):
        ms, ss = src[..., c].mean(), src[..., c].std()
        mr, sr = ref[..., c].mean(), ref[..., c].std()
        a = 1 + k * (sr / ss - 1)
        b = k * (mr - ms * sr / ss) if False else (1 - a) * ms + k * (mr - ms)
        parts.append(f"{ch}='clip(val*{a:.4f}+{b:.2f},0,255)'")
    open(os.path.join(here, f'match_{i}.txt'), 'w').write('lutrgb=' + ':'.join(parts))
    print(i, open(os.path.join(here, f'match_{i}.txt')).read())
