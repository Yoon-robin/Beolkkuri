"""Development backend for the Beolkkuri UI.

Runs the real settings manager over HTTP so the React app can be developed in a
normal browser (``pnpm dev``) on any OS, without starting the macro itself.
Macro-control calls (start, stop, tools, updates...) are answered with stubs.

usage: python ui/dev/dev_server.py   (listens on 127.0.0.1:8765)
"""
import json
import os
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "src", "modules", "misc"))

import settingsManager  # noqa: E402

# Pretend screen recording is still off so the permission UI can be exercised;
# "opening" its settings pane turns it on.
DEV_PERMISSIONS = {"accessibility": True, "screenRecording": False, "fullKeyboardAccess": False}
RUN_STATE = {"value": 3}  # 0 stopping, 2 running, 3 stopped, 6 paused
LOGS = [
    {"time": time.strftime("%H:%M:%S"), "title": "Dev server", "desc": "Settings are live; macro calls are stubbed.", "color": "7289da"},
]


def _start():
    RUN_STATE["value"] = 2
    LOGS.append({"time": time.strftime("%H:%M:%S"), "title": "Macro Started", "desc": "(dev stub)", "color": "2ecc71"})
    return {"ok": True}


def _stop():
    RUN_STATE["value"] = 3
    LOGS.append({"time": time.strftime("%H:%M:%S"), "title": "Macro Stopped", "desc": "(dev stub)", "color": "e74c3c"})
    return None


def _reset_task_priorities():
    # same as gui.resetTaskPrioritiesToDefault
    order = settingsManager.getDefaultProfileSettings().get("task_priority_order") or []
    if not isinstance(order, list) or not order:
        return False
    settingsManager.saveProfileSetting("task_priority_order", order)
    return True


STUBS = {
    "start": _start,
    "stop": _stop,
    "pause": lambda: RUN_STATE.update(value=6),
    "resume": lambda: RUN_STATE.update(value=2),
    "getRunState": lambda: RUN_STATE["value"],
    "getPermissionStatus": lambda: dict(DEV_PERMISSIONS),
    "openPrivacySettings": lambda kind: DEV_PERMISSIONS.update({kind: True}),
    "setRunState": lambda v: RUN_STATE.update(value=v),
    "getRecentLogs": lambda: LOGS,
    "clearRecentLogs": lambda: LOGS.clear(),
    "getMacroVersion": settingsManager.getMacroVersion,
    "checkForUpdates": lambda: {"available": False},
    "getAutoUpdateCheckDisabled": lambda: True,
    "getPatterns": lambda: sorted(
        os.path.splitext(f)[0] for f in os.listdir(os.path.join(ROOT, "settings", "patterns")) if f.endswith(".py")
    ),
    "getDefaultPatterns": lambda: sorted(
        os.path.splitext(f)[0] for f in os.listdir(os.path.join(ROOT, "settings", "defaults", "patterns")) if f.endswith(".py")
    ),
    "getManualPlanterData": lambda: {"planters": ["", "", ""], "fields": ["", "", ""], "harvestTimes": [0, 0, 0], "cycle": 0},
    "getAutoPlanterData": lambda: {"planters": [], "nectar_last_field": {}, "gather": False},
    "getModelStatus": lambda *a: {"models": [], "model_dir": ""},
    "resetFieldToDefault": lambda *a: True,
    "resetTaskPrioritiesToDefault": _reset_task_priorities,
    "importPatterns": lambda *a: [True, "dev stub"],
    "clearBlender": lambda *a: True,
    "usesLegacyDiscordBot": lambda: False,
    "isAnyToolRunning": lambda: False,
    "getAutoClickerStatus": lambda: {"running": False},
    "getAutoGiftedBasicBeeStatus": lambda: {"running": False},
    "getHotbarBuffStatus": lambda: {"running": False},
}


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        name = self.path.rsplit("/", 1)[-1]
        length = int(self.headers.get("Content-Length") or 0)
        args = json.loads(self.rfile.read(length) or b"[]")
        fn = STUBS.get(name) or getattr(settingsManager, name, None)
        status, result = 200, None
        if fn is None:
            print(f"[dev] no handler for {name}{tuple(args)}; returning null")
        else:
            try:
                result = fn(*args)
            except Exception as exc:  # surface backend errors to the UI console
                status, result = 500, {"error": f"{type(exc).__name__}: {exc}"}
        body = json.dumps(result, default=str).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        pass


if __name__ == "__main__":
    print("Beolkkuri dev backend on http://127.0.0.1:8765")
    ThreadingHTTPServer(("127.0.0.1", 8765), Handler).serve_forever()
