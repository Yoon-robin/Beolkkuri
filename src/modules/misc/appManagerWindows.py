"""Windows versions of the appManager functions (see appManagerMac.py for macOS).

Everything goes through user32/kernel32 with ctypes, so no extra packages are needed.
Coordinates are physical pixels: pyautogui and mss both make the process DPI aware.
"""
import ctypes
import os
import time
from ctypes import wintypes

import pyautogui as pag

user32 = ctypes.WinDLL("user32", use_last_error=True)
kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)

mw, mh = pag.size()

# The Roblox player from roblox.com (also what Bloxstrap launches).
ROBLOX_PROCESSES = ("robloxplayerbeta.exe",)
# Roblox toggles fullscreen with F11 on Windows.
FULLSCREEN_HOTKEY = ("f11",)

TH32CS_SNAPPROCESS = 0x00000002
INVALID_HANDLE_VALUE = ctypes.c_void_p(-1).value
PROCESS_TERMINATE = 0x0001
SW_RESTORE = 9
SW_MAXIMIZE = 3
WM_CLOSE = 0x0010
MONITOR_DEFAULTTONEAREST = 2


class PROCESSENTRY32W(ctypes.Structure):
    _fields_ = [
        ("dwSize", wintypes.DWORD),
        ("cntUsage", wintypes.DWORD),
        ("th32ProcessID", wintypes.DWORD),
        ("th32DefaultHeapID", ctypes.c_size_t),
        ("th32ModuleID", wintypes.DWORD),
        ("cntThreads", wintypes.DWORD),
        ("th32ParentProcessID", wintypes.DWORD),
        ("pcPriClassBase", ctypes.c_long),
        ("dwFlags", wintypes.DWORD),
        ("szExeFile", wintypes.WCHAR * 260),
    ]


class MONITORINFO(ctypes.Structure):
    _fields_ = [
        ("cbSize", wintypes.DWORD),
        ("rcMonitor", wintypes.RECT),
        ("rcWork", wintypes.RECT),
        ("dwFlags", wintypes.DWORD),
    ]


WNDENUMPROC = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)

kernel32.CreateToolhelp32Snapshot.restype = wintypes.HANDLE
kernel32.CreateToolhelp32Snapshot.argtypes = (wintypes.DWORD, wintypes.DWORD)
kernel32.Process32FirstW.argtypes = (wintypes.HANDLE, ctypes.POINTER(PROCESSENTRY32W))
kernel32.Process32NextW.argtypes = (wintypes.HANDLE, ctypes.POINTER(PROCESSENTRY32W))
kernel32.CloseHandle.argtypes = (wintypes.HANDLE,)
kernel32.OpenProcess.restype = wintypes.HANDLE
kernel32.OpenProcess.argtypes = (wintypes.DWORD, wintypes.BOOL, wintypes.DWORD)
kernel32.TerminateProcess.argtypes = (wintypes.HANDLE, wintypes.UINT)
user32.EnumWindows.argtypes = (WNDENUMPROC, wintypes.LPARAM)
user32.GetWindowThreadProcessId.argtypes = (wintypes.HWND, ctypes.POINTER(wintypes.DWORD))
user32.GetWindowTextLengthW.argtypes = (wintypes.HWND,)
user32.GetWindowTextW.argtypes = (wintypes.HWND, wintypes.LPWSTR, ctypes.c_int)
user32.IsWindowVisible.argtypes = (wintypes.HWND,)
user32.IsIconic.argtypes = (wintypes.HWND,)
user32.GetClientRect.argtypes = (wintypes.HWND, ctypes.POINTER(wintypes.RECT))
user32.ClientToScreen.argtypes = (wintypes.HWND, ctypes.POINTER(wintypes.POINT))
user32.GetForegroundWindow.restype = wintypes.HWND
user32.SetForegroundWindow.argtypes = (wintypes.HWND,)
user32.BringWindowToTop.argtypes = (wintypes.HWND,)
user32.ShowWindow.argtypes = (wintypes.HWND, ctypes.c_int)
user32.PostMessageW.argtypes = (wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM)
user32.AttachThreadInput.argtypes = (wintypes.DWORD, wintypes.DWORD, wintypes.BOOL)
user32.MonitorFromWindow.restype = wintypes.HMONITOR
user32.MonitorFromWindow.argtypes = (wintypes.HWND, wintypes.DWORD)
user32.GetMonitorInfoW.argtypes = (wintypes.HMONITOR, ctypes.POINTER(MONITORINFO))


def _processes():
    """(pid, exe name) for every running process."""
    snapshot = kernel32.CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0)
    if not snapshot or snapshot == INVALID_HANDLE_VALUE:
        return []
    out = []
    try:
        entry = PROCESSENTRY32W()
        entry.dwSize = ctypes.sizeof(PROCESSENTRY32W)
        ok = kernel32.Process32FirstW(snapshot, ctypes.byref(entry))
        while ok:
            out.append((entry.th32ProcessID, entry.szExeFile))
            ok = kernel32.Process32NextW(snapshot, ctypes.byref(entry))
    finally:
        kernel32.CloseHandle(snapshot)
    return out


def _matchesApp(exeName, app):
    exeName = exeName.lower()
    app = (app or "").lower()
    if app == "roblox":
        return exeName in ROBLOX_PROCESSES
    return app in exeName


def _appPids(app):
    return {pid for pid, name in _processes() if _matchesApp(name, app)}


def _windowTitle(hwnd):
    length = user32.GetWindowTextLengthW(hwnd)
    buffer = ctypes.create_unicode_buffer(length + 1)
    user32.GetWindowTextW(hwnd, buffer, length + 1)
    return buffer.value


def _windowPid(hwnd):
    pid = wintypes.DWORD()
    user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
    return pid.value


def _clientRect(hwnd):
    """Window content area in screen coordinates (no title bar or borders)."""
    rect = wintypes.RECT()
    if not user32.GetClientRect(hwnd, ctypes.byref(rect)):
        return None
    origin = wintypes.POINT(0, 0)
    user32.ClientToScreen(hwnd, ctypes.byref(origin))
    return origin.x, origin.y, rect.right - rect.left, rect.bottom - rect.top


def _findWindow(app="Roblox"):
    """The largest visible top-level window of the app, or None."""
    pids = _appPids(app)
    name = (app or "").lower()
    candidates = []

    @WNDENUMPROC
    def callback(hwnd, _):
        if not user32.IsWindowVisible(hwnd):
            return True
        title = _windowTitle(hwnd)
        if not title:
            return True
        # The Microsoft Store build runs inside ApplicationFrameHost, so also accept the title.
        if _windowPid(hwnd) in pids or title.strip().lower() == name:
            rect = _clientRect(hwnd)
            if rect and rect[2] > 0 and rect[3] > 0:
                candidates.append((rect[2] * rect[3], hwnd))
        return True

    user32.EnumWindows(callback, 0)
    if not candidates:
        return None
    return max(candidates)[1]


def _bringToFront(hwnd):
    if user32.IsIconic(hwnd):
        user32.ShowWindow(hwnd, SW_RESTORE)
    if user32.SetForegroundWindow(hwnd) and user32.GetForegroundWindow() == hwnd:
        return
    # Windows only lets the foreground process change focus; borrow its input queue.
    foreground = user32.GetForegroundWindow()
    foregroundThread = user32.GetWindowThreadProcessId(foreground, None) if foreground else 0
    currentThread = kernel32.GetCurrentThreadId()
    attached = bool(foregroundThread) and foregroundThread != currentThread and user32.AttachThreadInput(currentThread, foregroundThread, True)
    try:
        user32.BringWindowToTop(hwnd)
        user32.SetForegroundWindow(hwnd)
    finally:
        if attached:
            user32.AttachThreadInput(currentThread, foregroundThread, False)


def isAppOpen(app="roblox"):
    return bool(_appPids(app))


def openApp(app="Roblox"):
    """Focus the app's window. Returns False if the app is not running."""
    if not isAppOpen(app):
        return False
    hwnd = _findWindow(app)
    if hwnd:
        _bringToFront(hwnd)
    return True


def isAppFocused(app="Roblox"):
    try:
        foreground = user32.GetForegroundWindow()
        if not foreground:
            return False
        if _windowPid(foreground) in _appPids(app):
            return True
        return _windowTitle(foreground).strip().lower() == (app or "").lower()
    except Exception:
        return False


def openDeeplink(link):
    os.startfile(link)


def closeApp(app):
    """Ask the app's windows to close, then end whatever is still running."""
    pids = _appPids(app)
    if not pids:
        return

    @WNDENUMPROC
    def callback(hwnd, _):
        if _windowPid(hwnd) in pids:
            user32.PostMessageW(hwnd, WM_CLOSE, 0, 0)
        return True

    user32.EnumWindows(callback, 0)
    deadline = time.time() + 3
    while time.time() < deadline and _appPids(app):
        time.sleep(0.2)
    forceQuitApp(app)


def forceQuitApp(app):
    for pid in _appPids(app):
        handle = kernel32.OpenProcess(PROCESS_TERMINATE, False, pid)
        if handle:
            kernel32.TerminateProcess(handle, 1)
            kernel32.CloseHandle(handle)


def getWindowSize(windowName):
    """x, y, width, height of the window's content area. Falls back to the whole screen."""
    name = windowName.lower()
    hwnd = _findWindow("Roblox" if "roblox" in name else windowName)
    if hwnd and not user32.IsIconic(hwnd):
        rect = _clientRect(hwnd)
        if rect:
            return rect
    return 0, 0, mw, mh


def isAppFullScreen(app="Roblox"):
    hwnd = _findWindow(app)
    if not hwnd:
        return True
    rect = _clientRect(hwnd)
    info = MONITORINFO()
    info.cbSize = ctypes.sizeof(MONITORINFO)
    if not rect or not user32.GetMonitorInfoW(user32.MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST), ctypes.byref(info)):
        return True
    monitor = info.rcMonitor
    return rect == (monitor.left, monitor.top, monitor.right - monitor.left, monitor.bottom - monitor.top)


def setAppFullscreen(app="Roblox", fullscreen=True):
    if isAppFullScreen(app) == fullscreen or not openApp(app):
        return
    time.sleep(0.2)
    pag.hotkey(*FULLSCREEN_HOTKEY)


def maximiseAppWindow(app="Roblox"):
    hwnd = _findWindow(app)
    if hwnd:
        user32.ShowWindow(hwnd, SW_MAXIMIZE)
