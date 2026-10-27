"""Text recognition with the OCR engine built into Windows 10/11 (Windows.Media.Ocr).

Uses the WinRT packages that the winocr package installs. English is preferred;
Korean and other Windows installs often only ship their own language, whose
engine still reads Latin letters and digits, so that is the fallback.
"""
import asyncio
import concurrent.futures

from winrt.windows.globalization import Language
from winrt.windows.graphics.imaging import BitmapPixelFormat, SoftwareBitmap
from winrt.windows.media.ocr import OcrEngine
from winrt.windows.storage.streams import DataWriter


def _createEngine():
    for tag in ("en-US", "en"):
        language = Language(tag)
        if OcrEngine.is_language_supported(language):
            return OcrEngine.try_create_from_language(language)
    return OcrEngine.try_create_from_user_profile_languages()


engine = _createEngine()
if engine is None:
    raise RuntimeError("No OCR language is installed in Windows")
language = engine.recognizer_language.language_tag

# Windows OCR misses small game text. Enlarging 4x read best in tests (with the
# Korean engine too); large captures are enlarged less to stay fast.
UPSCALE = 4
MAX_SIDE = 4000


def _wait(operation):
    async def run():
        return await operation

    try:
        asyncio.get_running_loop()
    except RuntimeError:
        return asyncio.run(run())
    # Called from inside an event loop (the Discord bot): wait on a worker thread.
    with concurrent.futures.ThreadPoolExecutor(1) as pool:
        return pool.submit(asyncio.run, run()).result()


def ocr(img):
    """Same result shape as the other OCR backends in ocr.py:
    [ ([x1,y1],[x2,y1],[x2,y2],[x1,y2]), (text, confidence) ] per line, in image pixels.
    Windows OCR gives no confidence, so every line gets 1.0."""
    longest = max(img.width, img.height, 1)
    scale = max(UPSCALE if longest * UPSCALE <= MAX_SIDE else MAX_SIDE // longest, 1)
    if longest * scale > OcrEngine.max_image_dimension:
        scale = OcrEngine.max_image_dimension / longest
    if scale != 1:
        img = img.resize((max(1, int(img.width * scale)), max(1, int(img.height * scale))))
    img = img.convert("RGBA")

    writer = DataWriter()
    writer.write_bytes(img.tobytes())
    bitmap = SoftwareBitmap.create_copy_from_buffer(writer.detach_buffer(), BitmapPixelFormat.RGBA8, img.width, img.height)
    result = _wait(engine.recognize_async(bitmap))

    out = []
    for line in result.lines:
        rects = [word.bounding_rect for word in line.words]
        if not rects:
            continue
        x1 = int(min(r.x for r in rects) / scale)
        y1 = int(min(r.y for r in rects) / scale)
        x2 = int(max(r.x + r.width for r in rects) / scale)
        y2 = int(max(r.y + r.height for r in rects) / scale)
        out.append([([x1, y1], [x2, y1], [x2, y2], [x1, y2]), (line.text, 1.0)])
    return out
