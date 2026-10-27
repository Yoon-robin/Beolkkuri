"""Progress card over the Roblox window (Windows only).

main.py runs it on a thread next to the app window. While the macro runs, a small card
in a corner of the Roblox window shows what the macro is doing, how long it has run and
its latest log lines, so you can follow it without switching to the app.

- Clicks pass through the card and it never takes focus from Roblox.
- Windows leaves it out of screen captures (WDA_EXCLUDEFROMCAPTURE, Windows 10 2004+), so
  the macro's own screenshots, OCR and the stream never see it. Where Windows can't do
  that, the card stays hidden rather than get in the macro's way.
- It shows only while Roblox is the active window, and only when overlay_enabled is on.
  overlay_position picks the corner (Settings > Other > Game Overlay).
"""
import ctypes
import os
import re
import sys
import threading
import time
from ctypes import wintypes

import numpy as np
from PIL import Image, ImageDraw, ImageFont

import modules.misc.settingsManager as settingsManager
from modules.logging.log import colors as LOG_COLORS

user32 = ctypes.windll.user32
gdi32 = ctypes.windll.gdi32
kernel32 = ctypes.windll.kernel32

WS_POPUP = 0x80000000
WS_EX_LAYERED = 0x00080000
WS_EX_TRANSPARENT = 0x00000020
WS_EX_TOPMOST = 0x00000008
WS_EX_TOOLWINDOW = 0x00000080
WS_EX_NOACTIVATE = 0x08000000
SW_HIDE = 0
SW_SHOWNOACTIVATE = 4
HWND_TOPMOST = wintypes.HWND(-1)
SWP_NOSIZE, SWP_NOMOVE, SWP_NOACTIVATE = 0x0001, 0x0002, 0x0010
ULW_ALPHA = 0x2
WDA_EXCLUDEFROMCAPTURE = 0x11
PM_REMOVE = 0x1

LRESULT = ctypes.c_ssize_t
WNDPROC = ctypes.WINFUNCTYPE(LRESULT, wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM)


class WNDCLASSEXW(ctypes.Structure):
    _fields_ = [("cbSize", wintypes.UINT), ("style", wintypes.UINT), ("lpfnWndProc", WNDPROC),
                ("cbClsExtra", ctypes.c_int), ("cbWndExtra", ctypes.c_int), ("hInstance", wintypes.HINSTANCE),
                ("hIcon", wintypes.HICON), ("hCursor", wintypes.HANDLE), ("hbrBackground", wintypes.HBRUSH),
                ("lpszMenuName", wintypes.LPCWSTR), ("lpszClassName", wintypes.LPCWSTR), ("hIconSm", wintypes.HICON)]


class BITMAPINFOHEADER(ctypes.Structure):
    _fields_ = [("biSize", wintypes.DWORD), ("biWidth", wintypes.LONG), ("biHeight", wintypes.LONG),
                ("biPlanes", wintypes.WORD), ("biBitCount", wintypes.WORD), ("biCompression", wintypes.DWORD),
                ("biSizeImage", wintypes.DWORD), ("biXPelsPerMeter", wintypes.LONG), ("biYPelsPerMeter", wintypes.LONG),
                ("biClrUsed", wintypes.DWORD), ("biClrImportant", wintypes.DWORD)]


class BLENDFUNCTION(ctypes.Structure):
    _fields_ = [("BlendOp", ctypes.c_ubyte), ("BlendFlags", ctypes.c_ubyte),
                ("SourceConstantAlpha", ctypes.c_ubyte), ("AlphaFormat", ctypes.c_ubyte)]


class MSG(ctypes.Structure):
    _fields_ = [("hwnd", wintypes.HWND), ("message", wintypes.UINT), ("wParam", wintypes.WPARAM),
                ("lParam", wintypes.LPARAM), ("time", wintypes.DWORD), ("pt", wintypes.POINT)]


user32.DefWindowProcW.argtypes = [wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM]
user32.DefWindowProcW.restype = LRESULT
user32.RegisterClassExW.argtypes = [ctypes.POINTER(WNDCLASSEXW)]
user32.CreateWindowExW.argtypes = [wintypes.DWORD, wintypes.LPCWSTR, wintypes.LPCWSTR, wintypes.DWORD,
                                   ctypes.c_int, ctypes.c_int, ctypes.c_int, ctypes.c_int,
                                   wintypes.HWND, wintypes.HMENU, wintypes.HINSTANCE, wintypes.LPVOID]
user32.CreateWindowExW.restype = wintypes.HWND
user32.UpdateLayeredWindow.argtypes = [wintypes.HWND, wintypes.HDC, ctypes.POINTER(wintypes.POINT),
                                       ctypes.POINTER(wintypes.SIZE), wintypes.HDC, ctypes.POINTER(wintypes.POINT),
                                       wintypes.COLORREF, ctypes.POINTER(BLENDFUNCTION), wintypes.DWORD]
user32.SetWindowPos.argtypes = [wintypes.HWND, wintypes.HWND, ctypes.c_int, ctypes.c_int, ctypes.c_int, ctypes.c_int, wintypes.UINT]
user32.SetWindowDisplayAffinity.argtypes = [wintypes.HWND, wintypes.DWORD]
user32.PeekMessageW.argtypes = [ctypes.POINTER(MSG), wintypes.HWND, wintypes.UINT, wintypes.UINT, wintypes.UINT]
user32.GetForegroundWindow.restype = wintypes.HWND
user32.GetDC.restype = wintypes.HDC
user32.ReleaseDC.argtypes = [wintypes.HWND, wintypes.HDC]
gdi32.CreateCompatibleDC.argtypes = [wintypes.HDC]
gdi32.CreateCompatibleDC.restype = wintypes.HDC
gdi32.CreateDIBSection.argtypes = [wintypes.HDC, ctypes.c_void_p, wintypes.UINT, ctypes.POINTER(ctypes.c_void_p), wintypes.HANDLE, wintypes.DWORD]
gdi32.CreateDIBSection.restype = wintypes.HBITMAP
gdi32.SelectObject.argtypes = [wintypes.HDC, wintypes.HGDIOBJ]
gdi32.SelectObject.restype = wintypes.HGDIOBJ
gdi32.DeleteObject.argtypes = [wintypes.HGDIOBJ]
gdi32.DeleteDC.argtypes = [wintypes.HDC]
kernel32.GetModuleHandleW.restype = wintypes.HMODULE

# Card look: the app's dark honey theme, readable over a bright game.
WIDTH = 300  # logical pixels; scaled with the Roblox window's DPI
SUPERSAMPLE = 2  # drawn at 2x and scaled down, for smooth corners and text
BACKGROUND = (24, 20, 14, 226)
BORDER = (255, 193, 7, 70)
TEXT = (250, 247, 240, 255)
MUTED = (190, 182, 168, 255)
HONEY = (255, 193, 7, 255)
STATE_COLORS = {"running": (52, 211, 153), "paused": (251, 191, 36), "rejoining": (251, 146, 60), "starting": (147, 197, 253)}

FIELDS_KO = {
    "sunflower": "해바라기", "dandelion": "민들레", "mushroom": "버섯", "blue flower": "파란 꽃", "clover": "클로버",
    "strawberry": "딸기", "spider": "거미", "bamboo": "대나무", "pineapple": "파인애플", "stump": "그루터기",
    "cactus": "선인장", "pumpkin": "호박", "pine tree": "소나무", "rose": "장미", "mountain top": "산 정상",
    "coconut": "코코넛", "pepper": "고추", "hive": "벌집",
}
COLLECT_KO = {
    "wealth clock": "부의 시계", "honey dispenser": "꿀 디스펜서", "blueberry dispenser": "블루베리 디스펜서",
    "strawberry dispenser": "딸기 디스펜서", "coconut dispenser": "코코넛 디스펜서",
    "royal jelly dispenser": "로열 젤리 디스펜서", "treat dispenser": "간식 디스펜서",
    "ant pass dispenser": "개미 패스 디스펜서", "buy ant pass": "개미 패스 구매", "robo pass dispenser": "로보 패스 디스펜서",
    "glue dispenser": "글루 디스펜서", "stockings": "양말", "wreath": "꿀 화환", "feast": "축제 음식",
    "gingerbread": "진저브레드 하우스", "samovar": "사모바르", "snow machine": "눈 기계", "lid art": "뚜껑 그림",
    "candles": "양초", "gummy beacon": "구미 비콘", "memory match": "기억력 게임", "mega memory match": "메가 기억력 게임",
    "extreme memory match": "익스트림 기억력 게임", "winter memory match": "겨울 기억력 게임", "honeystorm": "허니스톰",
    "wind shrine": "바람 신전", "blue booster": "파란 부스터", "red booster": "빨간 부스터", "mountain booster": "산 정상 부스터",
}
TASKS = {  # status key -> (Korean, English)
    "idle_main_menu": ("다음 할 일을 고르는 중", "Choosing the next task"),
    "converting": ("꿀로 바꾸는 중", "Converting honey"),
    "travelling_hive": ("벌집으로 가는 중", "Heading to the hive"),
    "rejoining": ("게임에 다시 들어가는 중", "Rejoining the game"),
    "collect_sprouts": ("새싹 드롭을 줍는 중", "Collecting sprout drops"),
    "mondo_buff": ("몬도 버프를 받는 중", "Getting the Mondo buff"),
    "sticker_printer": ("스티커 프린터 쓰는 중", "Using the Sticker Printer"),
    "blender": ("블렌더 쓰는 중", "Using the Blender"),
    "bugrun": ("몹 사냥 중", "Killing mobs"),
    "stinger_hunt": ("바이셔스 비 찾는 중", "Hunting Vicious Bee"),
    "attacking": ("스텀프 달팽이 공격 중", "Attacking Stump Snail"),
    "coconut_crab": ("코코넛 게와 싸우는 중", "Fighting Coconut Crab"),
    "amulet_wait": ("부적 선택을 기다리는 중", "Waiting on the amulet choice"),
    "amulet_keep": ("부적을 그대로 두는 중", "Keeping the amulet"),
    "amulet_replace": ("부적을 바꾸는 중", "Replacing the amulet"),
    "alt_waiting_for_host": ("본계정을 기다리는 중", "Waiting for the host"),
    "standby": ("대기 모드", "Standby"),
    "paused": ("일시정지", "Paused"),
}


def _name(key, korean, names):
    key = key.replace("_", " ").strip()
    if korean:
        return names.get(key, key.title())
    return key.title()


def task_text(status, korean):
    """What the macro is doing, from the status key it sets (macro.set_task_status)."""
    key = (status or "").strip().lower()
    if not key or key == "none":
        key = "idle_main_menu"
    if key in TASKS:
        return TASKS[key][0 if korean else 1]
    if key.startswith("gather_"):
        field = _name(key[7:], korean, FIELDS_KO)
        return f"{field} 필드에서 채집 중" if korean else f"Gathering in {field}"
    if key.startswith("travelling_"):
        field = _name(key[11:], korean, FIELDS_KO)
        return f"{field} 필드로 가는 중" if korean else f"Heading to {field}"
    if key.startswith("planter_"):
        field = _name(key[8:], korean, FIELDS_KO)
        return f"{field} 플랜터 관리 중" if korean else f"Managing the {field} planter"
    if key.replace("_", " ") in COLLECT_KO:
        thing = _name(key, korean, COLLECT_KO)
        if "memory_match" in key:
            return f"{thing} 하는 중" if korean else f"Playing {thing}"
        if key.endswith("_booster"):
            return f"{thing} 받는 중" if korean else f"Getting the {thing}"
        return f"{thing} 수집 중" if korean else f"Collecting {thing}"
    words = key.replace("_", " ")
    return words if korean else words.capitalize()


def _font(size, bold=False):
    for name in (("malgunbd.ttf", "segoeuib.ttf") if bold else ("malgun.ttf", "segoeui.ttf")):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def _fit(draw, text, font, width):
    """Text cut to fit the width, with an ellipsis."""
    if draw.textlength(text, font=font) <= width:
        return text
    while text and draw.textlength(text + "…", font=font) > width:
        text = text[:-1]
    return text.rstrip() + "…"


def _log_color(name):
    value = LOG_COLORS.get(str(name or "").lower(), str(name or ""))
    if re.fullmatch(r"[0-9a-fA-F]{6}", value):
        return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4)) + (255,)
    return MUTED


def _plain(text):
    text = re.sub(r"<br\s*/?>", " · ", str(text or ""), flags=re.I)
    text = re.sub(r"<[^>]+>|\*\*|`", "", text)
    return " ".join(text.split())


def _duration(seconds):
    seconds = max(0, int(seconds))
    h, m, s = seconds // 3600, seconds % 3600 // 60, seconds % 60
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def render(card, scale):
    """Draw the card as an RGBA image. card: state, task, elapsed, logs, keys, korean."""
    k = scale * SUPERSAMPLE
    px = lambda v: max(1, int(round(v * k)))
    korean = card["korean"]
    small, body, title = _font(px(11.5)), _font(px(12)), _font(px(15), bold=True)
    brand = _font(px(12), bold=True)
    width, pad = px(WIDTH), px(14)
    inner = width - 2 * pad

    probe = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    line = lambda font: int(sum(font.getmetrics()) * 1.12)
    logs = card["logs"][-3:]
    height = pad + line(brand) + px(6) + line(title) + px(10)
    if logs:
        height += px(9) + len(logs) * line(small) + px(2)
    height += px(8) + line(small) + pad

    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((0, 0, width - 1, height - 1), radius=px(12), fill=BACKGROUND, outline=BORDER, width=px(1))

    y = pad
    # header: brand, state, run time
    draw.text((pad, y), "벌꿀이" if korean else "Beolkkuri", font=brand, fill=HONEY)
    x = pad + draw.textlength("벌꿀이" if korean else "Beolkkuri", font=brand) + px(10)
    state = card["state"]
    labels = {"running": ("실행 중", "Running"), "paused": ("일시정지", "Paused"),
              "rejoining": ("다시 접속 중", "Reconnecting"), "starting": ("시작하는 중", "Starting")}
    color = STATE_COLORS[state] + (255,)
    dot = px(7)
    mid = y + line(brand) // 2
    draw.ellipse((x, mid - dot // 2, x + dot, mid + dot - dot // 2), fill=color)
    draw.text((x + dot + px(5), y + px(0.5)), labels[state][0 if korean else 1], font=body, fill=color)
    if card["elapsed"] is not None:
        clock = _duration(card["elapsed"])
        draw.text((width - pad - draw.textlength(clock, font=body), y + px(0.5)), clock, font=body, fill=MUTED)
    y += line(brand) + px(6)

    draw.text((pad, y), _fit(probe, card["task"], title, inner), font=title, fill=TEXT)
    y += line(title) + px(10)

    if logs:
        draw.line((pad, y, width - pad, y), fill=(255, 255, 255, 28), width=px(1))
        y += px(9)
        for entry in logs:
            stamp = str(entry.get("time") or "")[-8:-3] or str(entry.get("time") or "")
            ldot = px(5)
            lmid = y + line(small) // 2
            draw.ellipse((pad, lmid - ldot // 2, pad + ldot, lmid + ldot - ldot // 2), fill=_log_color(entry.get("color")))
            tx = pad + ldot + px(6)
            if stamp:
                draw.text((tx, y), stamp, font=small, fill=MUTED)
                tx += draw.textlength(stamp, font=small) + px(6)
            text = " · ".join(t for t in (_plain(entry.get("title")), _plain(entry.get("desc"))) if t)
            draw.text((tx, y), _fit(probe, text, small, width - pad - tx), font=small, fill=TEXT)
            y += line(small)
        y += px(2)

    y += px(8)
    pause_key, stop_key = card["keys"]
    if korean:
        hint = f"{pause_key} {'다시 시작' if state == 'paused' else '일시정지'} · {stop_key} 정지"
    else:
        hint = f"{pause_key} {'resume' if state == 'paused' else 'pause'} · {stop_key} stop"
    draw.text((pad, y), _fit(probe, hint, small, inner), font=small, fill=MUTED)

    out = (round(width / SUPERSAMPLE), round(height / SUPERSAMPLE))
    return image.resize(out, Image.LANCZOS)


class _Window:
    """The layered, click-through, topmost window the card is drawn into."""

    def __init__(self):
        self._wndproc = WNDPROC(lambda hwnd, msg, wparam, lparam: user32.DefWindowProcW(hwnd, msg, wparam, lparam))
        instance = kernel32.GetModuleHandleW(None)
        cls = WNDCLASSEXW(cbSize=ctypes.sizeof(WNDCLASSEXW), lpfnWndProc=self._wndproc,
                          hInstance=instance, lpszClassName="BeolkkuriOverlay")
        user32.RegisterClassExW(ctypes.byref(cls))
        style = WS_EX_LAYERED | WS_EX_TRANSPARENT | WS_EX_TOPMOST | WS_EX_TOOLWINDOW | WS_EX_NOACTIVATE
        self.hwnd = user32.CreateWindowExW(style, "BeolkkuriOverlay", "Beolkkuri overlay", WS_POPUP,
                                           0, 0, 1, 1, None, None, instance, None)
        # Without this the macro's screenshots would include the card, so don't show it at all.
        self.hidden_from_capture = bool(self.hwnd) and bool(user32.SetWindowDisplayAffinity(self.hwnd, WDA_EXCLUDEFROMCAPTURE))
        self.shown = False

    def pump(self):
        msg = MSG()
        while user32.PeekMessageW(ctypes.byref(msg), None, 0, 0, PM_REMOVE):
            user32.TranslateMessage(ctypes.byref(msg))
            user32.DispatchMessageW(ctypes.byref(msg))

    def draw(self, image, x, y):
        rgba = np.asarray(image, dtype=np.uint16)
        alpha = rgba[..., 3:4]
        # UpdateLayeredWindow wants premultiplied BGRA
        bgra = np.empty(rgba.shape, dtype=np.uint8)
        bgra[..., :3] = (rgba[..., 2::-1] * alpha // 255).astype(np.uint8)
        bgra[..., 3] = rgba[..., 3]
        height, width = bgra.shape[:2]

        screen = user32.GetDC(None)
        memory = gdi32.CreateCompatibleDC(screen)
        header = BITMAPINFOHEADER(biSize=ctypes.sizeof(BITMAPINFOHEADER), biWidth=width, biHeight=-height,
                                  biPlanes=1, biBitCount=32, biCompression=0)
        bits = ctypes.c_void_p()
        bitmap = gdi32.CreateDIBSection(memory, ctypes.byref(header), 0, ctypes.byref(bits), None, 0)
        try:
            if not bitmap:
                return
            ctypes.memmove(bits, bgra.tobytes(), bgra.nbytes)
            old = gdi32.SelectObject(memory, bitmap)
            blend = BLENDFUNCTION(0, 0, 255, 1)  # AC_SRC_OVER, per-pixel alpha
            user32.UpdateLayeredWindow(self.hwnd, screen, ctypes.byref(wintypes.POINT(x, y)), ctypes.byref(wintypes.SIZE(width, height)),
                                       memory, ctypes.byref(wintypes.POINT(0, 0)), 0, ctypes.byref(blend), ULW_ALPHA)
            gdi32.SelectObject(memory, old)
        finally:
            if bitmap:
                gdi32.DeleteObject(bitmap)
            gdi32.DeleteDC(memory)
            user32.ReleaseDC(None, screen)
        if not self.shown:
            user32.ShowWindow(self.hwnd, SW_SHOWNOACTIVATE)
            self.shown = True
        # stay above Roblox, which may raise itself when it takes focus again
        user32.SetWindowPos(self.hwnd, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE)

    def hide(self):
        if self.shown:
            user32.ShowWindow(self.hwnd, SW_HIDE)
            self.shown = False


class _Roblox:
    """Finds the Roblox window, without listing every process on each frame."""

    def __init__(self):
        import modules.misc.appManagerWindows as windows
        self._windows = windows
        self.hwnd = None
        self._checked = 0.0

    def window(self):
        now = time.monotonic()
        if self.hwnd and not user32.IsWindow(self.hwnd):
            self.hwnd = None
        if not self.hwnd and now - self._checked > 2:
            self._checked = now
            self.hwnd = self._windows._findWindow("Roblox")
        return self.hwnd

    def active(self, hwnd):
        if user32.IsIconic(hwnd):
            return False
        foreground = user32.GetForegroundWindow()
        return bool(foreground) and (foreground == hwnd or self._windows._windowPid(foreground) == self._windows._windowPid(hwnd))

    def rect(self, hwnd):
        return self._windows._clientRect(hwnd)

    @staticmethod
    def scale(hwnd):
        try:
            return max(1.0, user32.GetDpiForWindow(hwnd) / 96)
        except Exception:
            return 1.0


def _state(run_value):
    return {1: "starting", 2: "running", 4: "rejoining", 6: "paused"}.get(run_value)


def _read_settings():
    # Only the general settings file: loadAllSettings does much more than this needs.
    path = os.path.join(settingsManager.getProfilePath(), "generalsettings.txt")
    return settingsManager.readSettingsFile(path)


def _loop(run_state, status, recent_logs):
    """The overlay's loop; start() runs it on a daemon thread."""
    try:
        window = _Window()
    except Exception as exc:
        print(f"[overlay] Could not create the overlay window: {exc}")
        return
    if not window.hwnd or not window.hidden_from_capture:
        # e.g. Windows 10 before 2004: the card would show up in the macro's screenshots
        print("[overlay] This Windows version can't hide the overlay from screenshots, so it stays off.")
        return
    roblox = _Roblox()
    settings, settings_read = {}, 0.0
    session_started, paused_total, paused_at = None, 0.0, None
    last_card, last_place = None, None

    while True:
        time.sleep(0.25)
        try:
            window.pump()
            now = time.monotonic()
            if now - settings_read > 2:
                settings_read = now
                try:
                    settings = _read_settings()
                except Exception:
                    pass

            state = _state(run_state.value)
            # session clock without pauses, like the app's run timer
            if state is None:
                session_started, paused_total, paused_at = None, 0.0, None
            else:
                if session_started is None:
                    session_started = now
                if state == "paused" and paused_at is None:
                    paused_at = now
                elif state != "paused" and paused_at is not None:
                    paused_total += now - paused_at
                    paused_at = None

            hwnd = roblox.window() if state else None
            if not state or not settings.get("overlay_enabled", True) or not hwnd or not roblox.active(hwnd):
                window.hide()
                last_card = None
                continue

            korean = settings.get("ui_language", "ko") != "en"
            try:
                logs = [dict(entry) for entry in recent_logs[-3:]]
            except Exception:
                logs = []
            elapsed = (paused_at or now) - session_started - paused_total
            card = {
                "state": state,
                "task": task_text(status.value, korean) if state != "paused" else ("일시정지했어요" if korean else "Paused"),
                "elapsed": int(elapsed),
                "logs": logs,
                "keys": tuple(str(settings.get(key, default) or default).replace("+", " + ")
                              for key, default in (("pause_keybind", "F2"), ("stop_keybind", "F3"))),
                "korean": korean,
            }
            rect = roblox.rect(hwnd)
            if not rect or rect[2] < 200 or rect[3] < 200:
                window.hide()
                continue
            scale = roblox.scale(hwnd)
            place = (rect, scale, settings.get("overlay_position", "bottom_left"))
            if card == last_card and place == last_place and window.shown:
                continue
            image = render(card, scale)
            left, top, width, height = rect
            margin = int(16 * scale)
            corner = str(place[2]).lower()
            x = left + width - image.width - margin if corner.endswith("right") else left + margin
            # top corners sit below Roblox's own top bar buttons
            y = top + int(64 * scale) if corner.startswith("top") else top + height - image.height - margin
            window.draw(image, x, y)
            last_card, last_place = card, place
        except Exception as exc:
            print(f"[overlay] {exc}")
            window.hide()
            last_card = None
            time.sleep(2)


def start(run_state, status, recent_logs):
    """Start the overlay next to the app (Windows only). The arguments are main.py's shared
    run state, task status and recent log list."""
    if sys.platform != "win32":
        return None
    thread = threading.Thread(target=_loop, args=(run_state, status, recent_logs), name="beolkkuri-overlay", daemon=True)
    thread.start()
    return thread
