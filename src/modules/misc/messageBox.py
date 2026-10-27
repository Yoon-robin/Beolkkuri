import os
import sys
import subprocess

if sys.platform == "win32":
    import ctypes
    MB_OK, MB_OKCANCEL, IDOK = 0x0, 0x1, 1
    #keep the dialog above roblox so it is not missed
    MB_STYLE = 0x40 | 0x10000 | 0x40000 #information icon, set foreground, topmost

def msgBox(title, text):
    if sys.platform == "win32":
        ctypes.windll.user32.MessageBoxW(None, str(text), str(title), MB_OK | MB_STYLE)
        return
    os.system(f'''osascript -e 'Tell application "System Events" to display dialog "{text}" with title "{title}"' ''')

def msgBoxOkCancel(title, text):
    #message box with OK/Cancel buttons and callback functions
    if sys.platform == "win32":
        return ctypes.windll.user32.MessageBoxW(None, str(text), str(title), MB_OKCANCEL | MB_STYLE) == IDOK

    #appleScript
    script = f'''
    tell application "System Events"
        try
            display dialog "{text}" with title "{title}" buttons {{"Cancel", "OK"}} default button "OK"
            return "OK"
        on error
            return "Cancel"
        end try
    end tell
    '''

    try:
        result = subprocess.run(['osascript', '-e', script],
                              capture_output=True, text=True, check=True)
        user_choice = result.stdout.strip()

        return user_choice == "OK"

    except subprocess.CalledProcessError:
        return False
