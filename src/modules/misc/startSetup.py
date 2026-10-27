"""How the macro gets into the game, asked once before the first start.

Until the general setting start_setup_done is set, the start key and the app's Start
button don't start the macro. They ask instead:
- "auto": the macro restarts Roblox, joins and claims a hive itself (always_rejoin on,
  preferred_hive_slot is tried first);
- "manual": the player is already in the game with a hive claimed, so the macro keeps
  the open game (always_rejoin off) and uses that hive (hive_number).

The in-game overlay (Windows) shows the question as a card you can click, and the app
shows it as a dialog. Asking and answering happen in the main process (the hotkey
listener, the overlay thread and eel), so a plain Event is enough. The app's guide and
dialog save the same settings themselves (ui/src/components/start-setup.tsx).
"""
import threading

import modules.misc.settingsManager as settingsManager

pending = threading.Event()


def needed(settings):
    return (settings or {}).get("start_setup_done") is not True


def ask():
    pending.set()


def cancel():
    pending.clear()


def choose(mode, slot=None, run=None):
    """Save the answer. With run (main.py's shared run state), also start the macro when
    it is stopped; returns whether it did."""
    if mode == "manual":
        slot = max(1, min(6, int(slot or 1)))
        settingsManager.saveGeneralSetting("hive_number", slot)
        settingsManager.saveGeneralSetting("preferred_hive_slot", slot)
        settingsManager.saveGeneralSetting("always_rejoin", False)
    else:
        if slot:
            settingsManager.saveGeneralSetting("preferred_hive_slot", max(1, min(6, int(slot))))
        settingsManager.saveGeneralSetting("always_rejoin", True)
    settingsManager.saveGeneralSetting("start_setup_done", True)
    pending.clear()
    if run is not None and run.value == 3:
        run.value = 1
        return True
    return False
