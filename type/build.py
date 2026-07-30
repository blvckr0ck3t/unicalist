# -*- coding: utf-8 -*-
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from glyphs import G

M = 100            # модуль в юнитах
UPM = 1000
GAP = 1            # межбуквенный просвет в модулях

def runs(row):
    """склеиваем соседние ячейки строки в один прямоугольник"""
    out=[]; i=0
    while i < len(row):
        if row[i] == '#':
            j=i
            while j+1 < len(row) and row[j+1] == '#': j+=1
            out.append((i, j+1)); i=j+1
        else: i+=1
    return out

def draw(rows, top):
    pen = TTGlyphPen(None)
    for r, row in enumerate(rows):
        y1 = (top - r) * M
        y0 = y1 - M
        for c0, c1 in runs(row):
            x0, x1 = c0 * M, c1 * M
            pen.moveTo((x0, y0)); pen.lineTo((x1, y0))
            pen.lineTo((x1, y1)); pen.lineTo((x0, y1)); pen.closePath()
    return pen.glyph()

def uni_name(ch):
    return 'uni%04X' % ord(ch)

order = ['.notdef'] + [uni_name(c) for c in G]
glyphs = {}
metrics = {}
cmap = {}

pen = TTGlyphPen(None)
glyphs['.notdef'] = pen.glyph()
metrics['.notdef'] = (500, 0)

for ch, (rows, top) in G.items():
    n = uni_name(ch)
    w = max(len(r) for r in rows)
    rows = [r.ljust(w, '.') for r in rows]
    glyphs[n] = draw(rows, top)
    adv = (3 if ch == ' ' else w + GAP) * M
    metrics[n] = (adv, 0)
    cmap[ord(ch)] = n

fb = FontBuilder(UPM, isTTF=True)
fb.setupGlyphOrder(order)
fb.setupCharacterMap(cmap)
fb.setupGlyf(glyphs)
fb.setupHorizontalMetrics(metrics)
fb.setupHorizontalHeader(ascent=900, descent=-200)
fb.setupNameTable({
    "familyName": "Unicalist Display",
    "styleName": "Regular",
    "psName": "UnicalistDisplay-Regular",
    "version": "Version 0.1",
    "copyright": "Уникалисты. Прописные по сетке вордмарка, модуль 8px.",
})
fb.setupOS2(sTypoAscender=900, sTypoDescender=-200, usWinAscent=900, usWinDescent=200,
            sCapHeight=700, achVendID="UNCL", fsType=0)
fb.setupPost(isFixedPitch=0)
fb.save("UnicalistDisplay.ttf")
print("TTF собран")

from fontTools.ttLib import TTFont
f = TTFont("UnicalistDisplay.ttf")
f.flavor = "woff2"
f.save("UnicalistDisplay.woff2")
import os
print("woff2:", os.path.getsize("UnicalistDisplay.woff2"), "байт",
      "| ttf:", os.path.getsize("UnicalistDisplay.ttf"), "байт")
print("глифов в шрифте:", len(f.getGlyphOrder()))
