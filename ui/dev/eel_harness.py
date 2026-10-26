"""Serve the built UI (src/webapp) through real eel, the way the macro does.

The dev server's stubs and the real settingsManager stand in for gui.py, so the
eel bridge (bridge.js, Python -> JS calls, JS -> Python calls) can be checked on
any OS without starting the macro. Build first with `pnpm --dir ui build`.

usage: pip install eel && python ui/dev/eel_harness.py   (then open
http://127.0.0.1:8791/index.html; a test line appears in the Home log after ~8s)
"""
import inspect
import os
import sys
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
    eel.sleep(8)
    for i in range(40):
        try:
            eel.log(time.strftime("%H:%M:%S"), f"eel bridge test message {i}", "green")
            eel.getElementProperty("start_keybind", "dataset.recording")(lambda v: print("recording?", repr(v), flush=True))
            break
        except Exception as e:
            print("ping failed", e, flush=True)
            eel.sleep(2)


eel.spawn(ping_ui)
eel.start("index.html", mode=None, port=8791, block=True)
