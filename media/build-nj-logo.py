"""Rebuild the DUSACCOM round flag emblem as an outlined SVG with an NJ medallion."""
import math, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

NAVY = '#14306b'
RED = '#d0261f'
INK = '#111111'
WHITE = '#ffffff'

arch = TTFont('package/files/archivo-black-latin-400-normal.woff')
mer = TTFont('/mnt/user-data/outputs/Merengue-Black.woff2')


def glyph(font, ch):
    gs = font.getGlyphSet()
    name = font.getBestCmap()[ord(ch)]
    pen = SVGPathPen(gs)
    gs[name].draw(pen)
    bp = BoundsPen(gs)
    gs[name].draw(bp)
    return pen.getCommands(), gs[name].width, bp.bounds


def star(x, y, r):
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5
        rr = r if i % 2 == 0 else r * 0.4
        pts.append(f'{x + rr * math.cos(a):.2f},{y + rr * math.sin(a):.2f}')
    return f'<polygon points="{" ".join(pts)}" fill="{WHITE}"/>'


def build(medallion=True):
    cx, cy, R, g = 600.0, 520.0, 330.0, 20.0
    out = []
    # Top-left: stars canton.
    x0, y0, s = cx - R, cy - R, R - g
    out.append(f'<rect x="{x0}" y="{y0}" width="{s}" height="{s}" fill="{NAVY}"/>')
    rows, p0, p1 = 7, s * 0.09, s * 0.25
    for r in range(rows):
        n = 5 if r % 2 == 0 else 4
        yy = y0 + p0 + r * (s - p0 - p1) / (rows - 1)
        for c in range(n):
            step = (s - p0 - p1) / 4
            xx = x0 + p0 + (c + (0 if n == 5 else 0.5)) * step
            out.append(star(xx, yy, s * 0.038))
    # Top-right and bottom-left: solid red quarter circles.
    out.append(f'<path d="M{cx+g},{cy-g} V{cy-R} A{R-g} {R-g} 0 0 1 {cx+R},{cy-g} Z" fill="{RED}"/>')
    out.append(f'<path d="M{cx-g},{cy+g} H{cx-R} A{R-g} {R-g} 0 0 0 {cx-g},{cy+R} Z" fill="{RED}"/>')
    # Bottom-right: stripes clipped to a quarter circle.
    out.append(f'<clipPath id="q"><path d="M{cx+g},{cy+g} H{cx+R} A{R-g} {R-g} 0 0 1 {cx+g},{cy+R} Z"/></clipPath>')
    stripes, h = 15, (R - g) / 15
    band = [f'<rect x="{cx+g}" y="{cy+g}" width="{R}" height="{R}" fill="{RED}"/>']
    for i in range(1, stripes, 2):
        band.append(f'<rect x="{cx+g}" y="{cy+g+i*h:.2f}" width="{R}" height="{h:.2f}" fill="{NAVY}"/>')
    out.append(f'<g clip-path="url(#q)">{"".join(band)}</g>')

    # Arc text, outlined. Tops point to the centre; baseline sits outside the circle.
    text = 'DOMINICAN USA CHAMBER OF COMMERCE'
    upm = arch['head'].unitsPerEm
    cap = arch['OS/2'].sCapHeight or 0.72 * upm
    gap, track = 16.0, 0.035
    span = math.radians(188)
    # Solve font size so the run fills the span at baseline radius rb = R + gap + cap*k.
    adv_units = sum(glyph(arch, ch)[1] for ch in text) + track * upm * (len(text) - 1)
    k = 0.05
    for _ in range(60):
        rb = R + gap + cap * k
        k = span * rb / adv_units
    rb = R + gap + cap * k
    theta0 = math.pi + (span - math.pi) / 2  # start a little above the left horizontal
    s_pos = 0.0
    for ch in text:
        d, adv, _ = glyph(arch, ch)
        if d:
            th = theta0 - (s_pos + adv * k / 2) / rb
            T = (math.sin(th), -math.cos(th))
            U = (-math.cos(th), -math.sin(th))
            P = (cx + rb * math.cos(th), cy + rb * math.sin(th))
            e = P[0] - adv * k / 2 * T[0]
            f = P[1] - adv * k / 2 * T[1]
            out.append(f'<path transform="matrix({T[0]*k:.5f} {T[1]*k:.5f} {U[0]*k:.5f} {U[1]*k:.5f} {e:.2f} {f:.2f})" d="{d}" fill="{INK}"/>')
        s_pos += adv * k + track * upm * k

    if medallion:
        mr = 92.0
        out.append(f'<circle cx="{cx}" cy="{cy}" r="{mr}" fill="{WHITE}"/>')
        out.append(f'<circle cx="{cx}" cy="{cy}" r="{mr-12}" fill="none" stroke="{NAVY}" stroke-width="5"/>')
        mupm = mer['head'].unitsPerEm
        parts = [glyph(mer, 'N'), glyph(mer, 'J')]
        mk = 118 / mupm
        total = parts[0][1] + parts[1][1] - 30
        # Optical centre: use ink bounds of the pair.
        xs = [parts[0][2][0], total - parts[1][1] + parts[1][2][2]]
        ys = [min(p[2][1] for p in parts), max(p[2][3] for p in parts)]
        ox = cx - (xs[0] + xs[1]) / 2 * mk + 4
        oy = cy + (ys[0] + ys[1]) / 2 * mk
        out.append(f'<path transform="matrix({mk} 0 0 {-mk} {ox:.2f} {oy:.2f})" d="{parts[0][0]}" fill="{NAVY}"/>')
        out.append(f'<path transform="matrix({mk} 0 0 {-mk} {ox + (parts[0][1]-30)*mk:.2f} {oy:.2f})" d="{parts[1][0]}" fill="{RED}"/>')

    pad = 8
    vx, vy = cx - rb - pad, cy - R - pad
    vw, vh = 2 * (rb + pad), R + rb + 2 * pad
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vx:.1f} {vy:.1f} {vw:.1f} {vh:.1f}" role="img" aria-label="Dominican USA Chamber of Commerce, New Jersey">{"".join(out)}</svg>', (vw, vh)


svg, size = build(True)
open('dusaccom-nj-logo.svg', 'w').write(svg)
print(size)
