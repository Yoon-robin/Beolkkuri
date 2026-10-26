// Keybind normalization and validation, kept identical to the macro's own
// parsing so a combo recorded here is the combo the macro listens for.

export const KEYBIND_IDS = [
  "start_keybind",
  "pause_keybind",
  "stop_keybind",
  "hotbar_buff_start_keybind",
  "autoclicker_keybind",
  "auto_gifted_basic_bee_start_keybind",
] as const

const MODIFIER_ORDER = ["Ctrl", "Alt", "Shift", "Cmd"]

// Keys the macro presses itself while running; unusable as a hotkey's main key.
const MACRO_RESERVED = new Set([
  "A", "D", "E", "F", "I", "O", "R", "S", "W",
  "Space", "Enter", "Escape", "PageUp", "PageDown", "F7",
  ",", ".", "\\", ...Array.from({ length: 10 }, (_, i) => String(i)),
])
const BROWSER_RESERVED_KEYS = new Set(["F5", "F11", "F12"])
const BROWSER_OR_OS_COMBOS = new Set([
  "Ctrl+L", "Ctrl+N", "Ctrl+O", "Ctrl+P", "Ctrl+R", "Ctrl+S", "Ctrl+T", "Ctrl+W",
  "Ctrl+Shift+C", "Ctrl+Shift+I", "Ctrl+Shift+J", "Ctrl+Shift+N", "Ctrl+Shift+P", "Ctrl+Shift+T",
  "Cmd+H", "Cmd+L", "Cmd+M", "Cmd+N", "Cmd+O", "Cmd+P", "Cmd+Q", "Cmd+R", "Cmd+S", "Cmd+Space", "Cmd+T", "Cmd+W",
  "Alt+F4", "Alt+Tab", "Cmd+Tab",
])

const ALIASES: Record<string, string> = {
  " ": "Space",
  Spacebar: "Space",
  Control: "Ctrl",
  Option: "Alt",
  Meta: "Cmd",
  Command: "Cmd",
  Esc: "Escape",
  Del: "Delete",
}

function normalizeKey(key: string) {
  if (!key) return ""
  if (ALIASES[key]) return ALIASES[key]
  if (/^F\d{1,2}$/i.test(key)) return key.toUpperCase()
  if (key.length === 1) return key.toUpperCase()
  return key
}

function sortKeys(keys: string[]) {
  const unique = Array.from(new Set(keys.filter((k) => k && k !== "Fn")))
  const modifiers = MODIFIER_ORDER.filter((k) => unique.includes(k))
  const rest = unique.filter((k) => !MODIFIER_ORDER.includes(k)).sort()
  return [...modifiers, ...rest]
}

export function normalizeKeybind(keybind: unknown) {
  return sortKeys(
    String(keybind ?? "")
      .split("+")
      .map((k) => normalizeKey(k.trim())),
  ).join("+")
}

export const keybindDisplay = (keybind: unknown) => normalizeKeybind(keybind).replace(/\+/g, " + ")

function keyFromEvent(event: KeyboardEvent) {
  const code = event.code || ""
  if (/^Key[A-Z]$/.test(code)) return code.slice(3)
  if (/^Digit\d$/.test(code)) return code.slice(5)
  if (/^Numpad\d$/.test(code)) return code
  if (/^F\d{1,2}$/.test(code)) return code
  return normalizeKey(event.key)
}

export function keybindFromEvent(event: KeyboardEvent) {
  const keys: string[] = []
  if (event.ctrlKey) keys.push("Ctrl")
  if (event.altKey) keys.push("Alt")
  if (event.shiftKey) keys.push("Shift")
  if (event.metaKey) keys.push("Cmd")
  const main = keyFromEvent(event)
  if (!MODIFIER_ORDER.includes(main)) keys.push(main)
  return sortKeys(keys).join("+")
}

export const isModifierOnly = (keybind: string) =>
  keybind.split("+").filter(Boolean).every((k) => MODIFIER_ORDER.includes(k))

export type KeybindError = { kind: "needKey" } | { kind: "conflict"; with: string } | { kind: "reserved" } | { kind: "browser" }

export function validateKeybind(keybind: string, currentId: string, settings: Record<string, unknown>): KeybindError | null {
  const keys = keybind.split("+").filter(Boolean)
  const main = keys.filter((k) => !MODIFIER_ORDER.includes(k))
  if (!main.length) return { kind: "needKey" }
  const conflict = KEYBIND_IDS.find((id) => id !== currentId && normalizeKeybind(settings[id]) === keybind)
  if (conflict) return { kind: "conflict", with: conflict }
  if (main.some((k) => MACRO_RESERVED.has(k))) return { kind: "reserved" }
  if (main.some((k) => BROWSER_RESERVED_KEYS.has(k)) || BROWSER_OR_OS_COMBOS.has(keybind)) return { kind: "browser" }
  return null
}
