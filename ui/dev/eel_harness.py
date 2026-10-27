"""Serve the built UI (src/webapp) through real eel, the way the macro does.

The dev server's stubs and the real settingsManager stand in for gui.py, so the
eel bridge (bridge.js, Python -> JS calls, JS -> Python calls) can be checked on
any OS without starting the macro. Build first with `pnpm --dir ui build`.

usage: pip install eel && python ui/dev/eel_harness.py   (then open
http://127.0.0.1:8791/index.html; a test line appears in the Home log, and the
terminal prints the start keybind's recording state whenever it changes)
"""
import inspect
import os
import sys
import threading
import time

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "ui", "dev"))
import dev_server  # noqa: E402  (also puts settingsManager on sys.path)
import eel  # noqa: E402

os.chdir(os.path.join(ROOT, "src"))
eel.init("webapp")
for name, fn in dev_server.STUBS.items():
    eel._expose(name, fn)
for name, fn in inspect.getmembers(dev_server.settingsManager, inspect.isfunction):
    if not name.startswith("_") and name not in dev_server.STUBS:
        eel._expose(name, fn)


def ping_ui():
    # calls made before the page connects go nowhere
    while not eel._websockets:
        eel.sleep(0.5)
    eel.sleep(2)
    eel.log(time.strftime("%H:%M:%S"), "eel bridge test message", "green")


def watch_recording():
    # main.py asks synchronously from pynput's listener thread; do the same
    last = None
    while True:
        time.sleep(0.5)
        if not eel._websockets:
            continue
        started = time.perf_counter()
        value = eel.getElementProperty("start_keybind", "dataset.recording")()
        if value != last:
            print(f"start_keybind recording: {value!r} ({(time.perf_counter() - started) * 1000:.0f} ms)", flush=True)
            last = value


eel.spawn(ping_ui)
threading.Thread(target=watch_recording, daemon=True).start()
eel.start("index.html", mode=None, port=8791, block=True)
