# Changelog

## 1.0.0

- First Beolkkuri release.
- New interface built with React and shadcn/ui, in Korean and English, with light and dark themes.
- Getting Started guide inside the app.
- The installer explains each step in Korean, creates a 벌꿀이 (Beolkkuri) app on the Desktop, and opens the permission settings at the end.
- Language and theme choices are saved in the macro settings.
- One-line install: `curl -fsSL https://raw.githubusercontent.com/Yoon-robin/Beolkkuri/main/install.sh | bash`. Running it again updates Beolkkuri and keeps your settings.
- The installer shows one line per library and saves the full output to `~/Beolkkuri-install.log`.
- The Getting Started page checks the Accessibility and Screen Recording permissions live, and Home warns when one is off.
- Ctrl+K / ⌘K searches every setting, page and quick action, then jumps to the setting and highlights it.
- The status badge shows how long the macro has been running, and toasts confirm start, pause, resume and stop.
- Smoother page, tab, list, dialog and theme-switch animations.
