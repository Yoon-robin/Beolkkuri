"""The one image hash the macro uses: an average hash, as in the ImageHash package.

The macro only needs average_hash and comparing hashes (== and -), and the ImageHash
package pulls in SciPy and PyWavelets (about 150 MB) for its other hashes, so this
module stands in for it with the same results.
"""
import numpy as np
from PIL import Image


class ImageHash:
    def __init__(self, bits):
        self.hash = bits

    def __sub__(self, other):
        """Number of differing bits."""
        if other is None:
            raise TypeError("Other hash must not be None.")
        if self.hash.size != other.hash.size:
            raise TypeError("Hashes must be the same size.", self.hash.shape, other.hash.shape)
        return int(np.count_nonzero(self.hash.flatten() != other.hash.flatten()))

    def __eq__(self, other):
        if not isinstance(other, ImageHash):
            return False
        return np.array_equal(self.hash.flatten(), other.hash.flatten())

    def __ne__(self, other):
        return not self == other

    def __hash__(self):
        return hash(self.hash.tobytes())

    def __len__(self):
        return self.hash.size

    def __str__(self):
        bits = "".join("1" if b else "0" for b in self.hash.flatten())
        return format(int(bits, 2), "0{}x".format((len(bits) + 3) // 4))

    def __repr__(self):
        return repr(self.hash)


def average_hash(image, hash_size=8):
    """Shrink to hash_size x hash_size greyscale; each bit says whether a pixel is brighter than the mean."""
    if hash_size < 2:
        raise ValueError("Hash size must be at least 2")
    lanczos = getattr(Image, "Resampling", Image).LANCZOS  # Image.Resampling is Pillow 9.1+
    pixels = np.asarray(image.convert("L").resize((hash_size, hash_size), lanczos))
    return ImageHash(pixels > pixels.mean())
