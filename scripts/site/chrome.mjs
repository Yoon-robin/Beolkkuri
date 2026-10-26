import { existsSync } from "node:fs"

// Any Chromium works. Set CHROME to override; otherwise try common install locations.
const candidates = [
  process.env.CHROME,
  process.env.LOCALAPPDATA && `${process.env.LOCALAPPDATA}/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-win64/chrome-headless-shell.exe`,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
]

export const CHROME = candidates.find((p) => p && existsSync(p))
if (!CHROME) throw new Error("No Chrome found. Set CHROME=/path/to/chrome")
