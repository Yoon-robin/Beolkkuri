"""Render the RobinMacro logo PNGs (app icon, report icon, README banner).

usage: python scripts/make_logo.py
"""
import math
import os

from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
AMBER = (251, 191, 36)
ORANGE = (234, 88, 12)
ROBIN = (220, 38, 38)
INK = (28, 25, 23)
CREAM = (255, 247, 230)


def hexagon(cx, cy, r, rotation=30):
    return [
        (cx + r * math.cos(math.radians(rotation + 60 * i)), cy + r * math.sin(math.radians(rotation + 60 * i)))
        for i in range(6)
    ]


def render(size, background=True):
    scale = 4  # supersample for smooth edges
    s = size * scale
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if background:
        # vertical amber -> orange gradient in a rounded square
        grad = Image.new("RGBA", (s, s))
        gd = ImageDraw.Draw(grad)
        for y in range(s):
            t = y / (s - 1)
            gd.line([(0, y), (s, y)], fill=tuple(int(AMBER[i] + (ORANGE[i] - AMBER[i]) * t) for i in range(3)) + (255,))
        mask = Image.new("L", (s, s), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * 0.22), fill=255)
        img.paste(grad, (0, 0), mask)

    cx, cy = s / 2, s / 2
    # honeycomb cell
    draw.polygon(hexagon(cx, cy, s * 0.36), fill=INK)
    draw.polygon(hexagon(cx, cy, s * 0.30), fill=CREAM)

    # robin: round body, red breast, head, beak, eye
    body_r = s * 0.17
    bx, by = cx - s * 0.01, cy + s * 0.03
    draw.ellipse([bx - body_r, by - body_r, bx + body_r, by + body_r], fill=INK)
    breast_r = body_r * 0.72
    draw.ellipse([bx - breast_r * 0.55, by - breast_r * 0.5, bx + breast_r * 1.15, by + breast_r * 1.05], fill=ROBIN)
    head_r = s * 0.085
    hx, hy = bx + s * 0.075, by - s * 0.13
    draw.ellipse([hx - head_r, hy - head_r, hx + head_r, hy + head_r], fill=INK)
    draw.polygon([(hx + head_r * 0.8, hy - head_r * 0.15), (hx + head_r * 1.9, hy + head_r * 0.2), (hx + head_r * 0.8, hy + head_r * 0.45)], fill=AMBER)
    er = s * 0.018
    ex, ey = hx + head_r * 0.25, hy - head_r * 0.2
    draw.ellipse([ex - er, ey - er, ex + er, ey + er], fill=CREAM)
    # tail
    draw.polygon([(bx - body_r * 0.7, by + body_r * 0.2), (bx - body_r * 1.75, by + body_r * 1.05), (bx - body_r * 0.95, by + body_r * 1.15)], fill=INK)

    return img.resize((size, size), Image.LANCZOS)


def main():
    icon = render(512)
    out = {
        "src/hourly_report/assets/macro_icon.png": 250,
        ".github/logo.png": 512,
        "ui/public/icon.png": 256,
    }
    for rel, size in out.items():
        path = os.path.join(ROOT, rel)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        icon.resize((size, size), Image.LANCZOS).save(path)
        print("wrote", rel)
    icon.save(os.path.join(ROOT, "ui/public/favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    print("wrote ui/public/favicon.ico")


if __name__ == "__main__":
    main()
