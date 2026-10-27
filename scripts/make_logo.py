"""Build ui/public/favicon.ico from the rendered 벌꿀이 icon.

The logo itself is scripts/brand/logo.svg. Render the PNGs first, then make the .ico:
  node scripts/site/render-brand.mjs
  python scripts/make_logo.py
"""
import os

from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def main():
    icon = Image.open(os.path.join(ROOT, ".github/logo.png")).convert("RGBA")
    icon.save(os.path.join(ROOT, "ui/public/favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    print("wrote ui/public/favicon.ico")


if __name__ == "__main__":
    main()
