"""NumPy version of the compiled bitmap_matcher extension.

The bundled .so files are macOS builds, so Windows (and any Mac without a
matching build) uses these functions instead. They take the same arguments and
return the same results as the compiled ones:

- A needle pixel matches when each RGB channel is within `variance` of the screen.
  Fully transparent needle pixels are skipped.
- x, y, w, h limit the search area; the whole needle has to fit inside it.
- Matches are (x, y) of the needle's top-left corner in main_image, scanning
  rows from the top and each row from the left.
"""
import base64
import io

import numpy as np
from PIL import Image


def _pixels(image):
    if isinstance(image, Image.Image):
        image = image.convert("RGBA")
    array = np.asarray(image)
    if array.ndim == 2:
        array = np.stack([array] * 3, axis=2)
    return array


def _matches(main_image, bitmap_image, x, y, w, h, variance, max_matches):
    haystack = _pixels(main_image)[:, :, :3].astype(np.int16)
    needle = _pixels(bitmap_image)
    opaque = needle[:, :, 3] > 0 if needle.shape[2] == 4 else np.ones(needle.shape[:2], dtype=bool)
    needle = needle[:, :, :3].astype(np.int16)

    height, width = haystack.shape[:2]
    needleHeight, needleWidth = needle.shape[:2]
    left = max(0, int(x or 0))
    top = max(0, int(y or 0))
    right = width if w is None else min(width, int(x or 0) + int(w))
    bottom = height if h is None else min(height, int(y or 0) + int(h))
    columns = right - left - needleWidth + 1
    rows = bottom - top - needleHeight + 1
    if columns <= 0 or rows <= 0:
        return []

    points = np.argwhere(opaque)
    if len(points) == 0:
        ys, xs = np.divmod(np.arange(rows * columns), columns)
    else:
        # Check the first opaque pixel at every position, then narrow the
        # surviving positions down one needle pixel at a time.
        dy, dx = points[0]
        window = haystack[top + dy:top + dy + rows, left + dx:left + dx + columns]
        ys, xs = np.nonzero(np.all(np.abs(window - needle[dy, dx]) <= variance, axis=2))
        for dy, dx in points[1:]:
            if ys.size == 0:
                break
            keep = np.all(np.abs(haystack[top + ys + dy, left + xs + dx] - needle[dy, dx]) <= variance, axis=1)
            ys, xs = ys[keep], xs[keep]

    if max_matches is not None and max_matches >= 0:
        ys, xs = ys[:max_matches], xs[:max_matches]
    return [(int(left + px), int(top + py)) for py, px in zip(ys, xs)]


def find_bitmap_cython(main_image, bitmap_image, use_simd=False, x=0, y=0, w=None, h=None, variance=0):
    found = _matches(main_image, bitmap_image, x, y, w, h, variance, 1)
    return found[0] if found else None


def find_all_bitmap_cython(main_image, bitmap_image, x=0, y=0, w=None, h=None, variance=0, max_matches=-1):
    return _matches(main_image, bitmap_image, x, y, w, h, variance, max_matches)


def create_bitmap_from_base64(base64_string):
    try:
        image = Image.open(io.BytesIO(base64.b64decode(base64_string)))
        return image.convert("RGBA")
    except Exception as e:
        print(f"Error processing base64 string: {e}")
        return None
