"""Scan-code keyboard input for Windows.

pyautogui sends Windows virtual-key events with a scan code of 0. Roblox reads
character movement from scan codes, so W/A/S/D/space sent that way are ignored
in game. install() swaps pyautogui's Windows key functions for SendInput calls
that carry the scan code, so every pag.keyDown/keyUp/press/hotkey/typewrite in
the macro works in Roblox without changing the callers.
"""
import ctypes
from ctypes import wintypes

import pyautogui
import pyautogui._pyautogui_win as _pagWin

user32 = ctypes.WinDLL("user32", use_last_error=True)

INPUT_KEYBOARD = 1
KEYEVENTF_EXTENDEDKEY = 0x0001
KEYEVENTF_KEYUP = 0x0002
KEYEVENTF_SCANCODE = 0x0008
MAPVK_VK_TO_VSC = 0
VK_SHIFT, VK_CONTROL, VK_MENU = 0x10, 0x11, 0x12

# Keys whose scan code needs the E0 prefix (arrows, navigation block, right-hand modifiers, ...)
EXTENDED_KEYS = {
    0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28,  # page up/down, end, home, arrows
    0x2C, 0x2D, 0x2E,  # print screen, insert, delete
    0x5B, 0x5C, 0x5D,  # windows keys, menu
    0x6F, 0x90,  # numpad divide, num lock
    0xA3, 0xA5,  # right ctrl, right alt
}


class KEYBDINPUT(ctypes.Structure):
    _fields_ = [
        ("wVk", wintypes.WORD),
        ("wScan", wintypes.WORD),
        ("dwFlags", wintypes.DWORD),
        ("time", wintypes.DWORD),
        ("dwExtraInfo", ctypes.c_size_t),
    ]


class MOUSEINPUT(ctypes.Structure):
    _fields_ = [
        ("dx", wintypes.LONG),
        ("dy", wintypes.LONG),
        ("mouseData", wintypes.DWORD),
        ("dwFlags", wintypes.DWORD),
        ("time", wintypes.DWORD),
        ("dwExtraInfo", ctypes.c_size_t),
    ]


class HARDWAREINPUT(ctypes.Structure):
    _fields_ = [("uMsg", wintypes.DWORD), ("wParamL", wintypes.WORD), ("wParamH", wintypes.WORD)]


class _INPUTUNION(ctypes.Union):
    # MOUSEINPUT is the largest member and sets sizeof(INPUT), which SendInput checks.
    _fields_ = [("ki", KEYBDINPUT), ("mi", MOUSEINPUT), ("hi", HARDWAREINPUT)]


class INPUT(ctypes.Structure):
    _fields_ = [("type", wintypes.DWORD), ("u", _INPUTUNION)]


user32.SendInput.argtypes = (wintypes.UINT, ctypes.POINTER(INPUT), ctypes.c_int)
user32.MapVirtualKeyW.argtypes = (wintypes.UINT, wintypes.UINT)


def sendKey(vk, up=False):
    scan = user32.MapVirtualKeyW(vk, MAPVK_VK_TO_VSC)
    if scan:
        flags = KEYEVENTF_SCANCODE
        if vk in EXTENDED_KEYS:
            flags |= KEYEVENTF_EXTENDEDKEY
        key = KEYBDINPUT(wVk=0, wScan=scan, dwFlags=flags | (KEYEVENTF_KEYUP if up else 0))
    else:
        # Media and browser keys have no scan code; send them as virtual keys.
        key = KEYBDINPUT(wVk=vk, wScan=0, dwFlags=KEYEVENTF_KEYUP if up else 0)
    event = INPUT(type=INPUT_KEYBOARD, u=_INPUTUNION(ki=key))
    user32.SendInput(1, ctypes.byref(event), ctypes.sizeof(INPUT))


def _modifiers(key):
    """Mirror pyautogui: (vk code, [modifier vks to hold around it])."""
    mods, vk = divmod(_pagWin.keyboardMapping[key], 0x100)
    held = []
    if mods & 4:
        held.append(VK_MENU)
    if mods & 2:
        held.append(VK_CONTROL)
    if mods & 1 or pyautogui.isShiftCharacter(key):
        held.append(VK_SHIFT)
    return vk, held


def _keyDown(key):
    if _pagWin.keyboardMapping.get(key) is None:
        return
    vk, held = _modifiers(key)
    for mod in held:
        sendKey(mod)
    sendKey(vk)
    for mod in reversed(held):
        sendKey(mod, up=True)


def _keyUp(key):
    if _pagWin.keyboardMapping.get(key) is None:
        return
    vk, held = _modifiers(key)
    for mod in held:
        sendKey(mod)
    sendKey(vk, up=True)
    for mod in reversed(held):
        sendKey(mod, up=True)


def install():
    _pagWin._keyDown = _keyDown
    _pagWin._keyUp = _keyUp
