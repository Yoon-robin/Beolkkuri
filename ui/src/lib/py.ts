// UI -> Python calls.
//
// Inside the app, eel injects `window.eel` and every @eel.expose'd Python
// function is callable as `eel.name(...args)()`. During `pnpm dev` there is no
// eel, so calls go to ui/dev/dev_server.py over HTTP instead.

type EelFn = (...args: unknown[]) => (callback?: (value: unknown) => void) => Promise<unknown>

declare global {
  interface Window {
    eel?: Record<string, EelFn> & { expose?: unknown }
    __beolkkuriBridge?: {
      handlers: Record<string, (...args: never[]) => unknown>
      recording: Record<string, boolean>
    }
  }
}

export const isDesktopApp = () => typeof window.eel?.loadAllSettings === "function"

export async function callPy<T = unknown>(name: string, ...args: unknown[]): Promise<T> {
  const eel = window.eel
  if (eel) {
    const fn = eel[name]
    if (typeof fn !== "function") throw new Error(`Python function "${name}" is not exposed`)
    return (await fn(...args)()) as T
  }
  const res = await fetch(`/__py/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error ?? `Python call ${name} failed`)
  return data as T
}

/** Fire-and-forget variant that never throws (for UI actions where failure is non-fatal). */
export function callPyQuiet(name: string, ...args: unknown[]) {
  return callPy(name, ...args).catch((err) => {
    console.error(`[py] ${name}`, err)
    return null
  })
}

export type Settings = Record<string, unknown>
export type FieldSettings = Record<string, unknown>

export const py = {
  loadAllSettings: () => callPy<Settings>("loadAllSettings"),
  loadFields: () => callPy<Record<string, FieldSettings>>("loadFields"),
  saveField: (field: string, settings: FieldSettings) => callPy("saveField", field, settings),
  saveProfileSetting: (id: string, value: unknown) => callPy("saveProfileSetting", id, value),
  saveGeneralSetting: (id: string, value: unknown) => callPy("saveGeneralSetting", id, value),
  saveDictProfileSettings: (obj: Settings) => callPy("saveDictProfileSettings", obj),
  getRunState: () => callPy<number>("getRunState"),
  /** `setup: true` when the first start has to ask how to get into the game first. */
  start: () => callPy<{ ok?: boolean; setup?: boolean } | null>("start"),
  getStartSetup: () => callPy<boolean>("getStartSetup"),
  cancelStartSetup: () => callPy("cancelStartSetup"),
  stop: () => callPy("stop"),
  pause: () => callPy("pause"),
  resume: () => callPy("resume"),
  getRecentLogs: () => callPy<LogEntry[]>("getRecentLogs"),
  clearRecentLogs: () => callPy("clearRecentLogs"),
  getMacroVersion: () => callPy<string>("getMacroVersion"),
  openLink: (url: string) => callPy("openLink", url),
  listProfiles: () => callPy<string[]>("listProfiles"),
  getCurrentProfile: () => callPy<string>("getCurrentProfile"),
  getPermissionStatus: () => callPy<PermissionStatus>("getPermissionStatus"),
  openPrivacySettings: (kind: PermissionKind) => callPy("openPrivacySettings", kind),
  getOcrStatus: () => callPy<OcrStatus | null>("getOcrStatus"),
  installEnglishOcr: () => callPy("installEnglishOcr"),
}

/**
 * Windows only (null elsewhere). installed is null when it can't be checked. While installing:
 * step "approve" waits for the administrator prompt, "download" is DISM working (percent and its
 * last lines once it prints them), "check" asks Windows whether it worked; elapsed is in seconds.
 * Older apps send only installed and installing.
 */
export type OcrStatus = {
  installed: boolean | null
  installing: boolean
  step?: "approve" | "download" | "check" | null
  percent?: number | null
  log?: string[]
  elapsed?: number
  error?: "cancelled" | "failed" | null
}

/** null means the check is not available on this macOS version. */
export type PermissionStatus = { accessibility: boolean | null; screenRecording: boolean | null; fullKeyboardAccess: boolean | null }
export type PermissionKind = "accessibility" | "screenRecording" | "keyboard"

export type LogEntry = { time?: string; title?: string; desc?: string; color?: string }

/** Macro run states reported by getRunState(). */
export const RunState = {
  Stopping: 0,
  Running: 2,
  Stopped: 3,
  Paused: 6,
} as const
