import sys

# Finding, focusing and closing the Roblox window is done with platform APIs:
# AppKit/Accessibility on macOS and user32/kernel32 on Windows.
if sys.platform == "win32":
    from modules.misc.appManagerWindows import *
else:
    from modules.misc.appManagerMac import *
