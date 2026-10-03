#!/usr/bin/env python3
"""
Builds the web fonts in src/styles/fonts/ from the source fonts in fonts/.

Each font is subset to the characters this English site can show and saved as
WOFF2. Kept: Latin-1 and Latin Extended-A (so any Latin filter or rule name
renders in the font), general punctuation, currency, letterlike symbols,
arrows and common symbols. Only the kerning and ligature OpenType features are
kept; the CSS uses no others (small caps, fractions, alternates...), and they
account for about half of Old Fenris's size.

Usage (needs fontTools and brotli):
    python3 -m venv .venv && .venv/bin/pip install fonttools brotli
    .venv/bin/python scripts/subset-fonts.py
"""
import os
from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = os.path.join(os.path.dirname(__file__), '..')
UNICODES = (
    'U+0000-00FF,U+0100-017F,'  # Basic Latin, Latin-1 Supplement, Latin Extended-A
    'U+2000-206F,U+20A0-20CF,U+2100-214F,'  # punctuation, currency, letterlike
    'U+2190-21FF,U+2200-22FF,U+25A0-25FF,U+2600-26FF'  # arrows, math, shapes, misc symbols
)
FONTS = {'Exocet-Medium.ttf': 'Exocet-Medium.woff2', 'OldFenris-Regular.otf': 'OldFenris-Regular.woff2'}

for src_name, out_name in FONTS.items():
    src = os.path.join(ROOT, 'fonts', src_name)
    out = os.path.join(ROOT, 'src', 'styles', 'fonts', out_name)
    options = subset.Options()
    options.flavor = 'woff2'
    options.layout_features = ['kern', 'liga']
    options.name_IDs = ['*']
    options.notdef_outline = True
    font = TTFont(src)
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=subset.parse_unicodes(UNICODES))
    subsetter.subset(font)
    font.flavor = 'woff2'
    font.save(out)
    print(f'{out_name}: {os.path.getsize(src) / 1024:.1f} KB -> {os.path.getsize(out) / 1024:.1f} KB')
