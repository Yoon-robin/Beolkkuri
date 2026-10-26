"""Converts the PNGs from shoot-app.mjs into the WebP files the landing page uses.

Usage: python to-webp.py <png-dir> <site/assets dir>   (needs Pillow)
"""
import sys
from pathlib import Path

from PIL import Image

src, dst = Path(sys.argv[1]), Path(sys.argv[2])
for png in sorted(src.glob("*.png")):
    out = dst / f"{png.stem}.webp"
    Image.open(png).convert("RGB").save(out, "WEBP", quality=82, method=6)
    print(f"{out.name}: {out.stat().st_size // 1024} KB")
