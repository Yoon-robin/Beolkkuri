import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { toast } from "sonner"

import { usePythonEvent } from "@/lib/bridge"
import { callPy, py, type FieldSettings, type Settings } from "@/lib/py"

type SettingsStore = {
  /** Merged profile + general settings, or null until the first load finishes. */
  settings: Settings | null
  /** Per-field gather settings keyed by field name ("pine tree", ...). */
  fields: Record<string, FieldSettings> | null
  /** Bumped whenever settings are replaced wholesale (profile switch, import). */
  revision: number
  refresh: () => Promise<void>
  get: <T = unknown>(id: string, fallback?: T) => T
  saveProfile: (id: string, value: unknown) => Promise<void>
  saveGeneral: (id: string, value: unknown) => Promise<void>
  /** Patch one field's gather settings and persist the whole field object. */
  saveField: (field: string, patch: FieldSettings) => Promise<void>
  /** Update local state only (for values Python already persisted). */
  patchLocal: (patch: Settings) => void
}

const SettingsContext = createContext<SettingsStore | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [fields, setFields] = useState<Record<string, FieldSettings> | null>(null)
  const [revision, setRevision] = useState(0)
  const settingsRef = useRef(settings)
  settingsRef.current = settings
  const fieldsRef = useRef(fields)
  fieldsRef.current = fields

  const refresh = useCallback(async () => {
    try {
      const [s, f] = await Promise.all([py.loadAllSettings(), py.loadFields()])
      setSettings(s)
      setFields(f)
      setRevision((r) => r + 1)
    } catch (err) {
      console.error("[settings] load failed", err)
      toast.error(String(err))
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const patchLocal = useCallback((patch: Settings) => {
    setSettings((prev) => ({ ...(prev ?? {}), ...patch }))
  }, [])

  const persist = useCallback(
    async (fn: "saveProfileSetting" | "saveGeneralSetting", id: string, value: unknown) => {
      const previous = settingsRef.current?.[id]
      patchLocal({ [id]: value })
      try {
        await callPy(fn, id, value)
      } catch (err) {
        patchLocal({ [id]: previous })
        console.error(`[settings] ${fn}(${id})`, err)
        toast.error(String(err))
      }
    },
    [patchLocal],
  )

  const saveProfile = useCallback((id: string, value: unknown) => persist("saveProfileSetting", id, value), [persist])
  const saveGeneral = useCallback((id: string, value: unknown) => persist("saveGeneralSetting", id, value), [persist])

  const saveField = useCallback(async (field: string, patch: FieldSettings) => {
    const next = { ...(fieldsRef.current?.[field] ?? {}), ...patch }
    setFields((prev) => ({ ...(prev ?? {}), [field]: next }))
    try {
      await py.saveField(field, next)
    } catch (err) {
      console.error(`[settings] saveField(${field})`, err)
      toast.error(String(err))
    }
  }, [])

  const get = useCallback(<T,>(id: string, fallback?: T) => (settingsRef.current?.[id] ?? fallback) as T, [])

  // Python pushes settings into the UI (e.g. after the Discord bot changes them)
  usePythonEvent("loadInputs", (obj: Settings, save?: string) => {
    if (!obj || typeof obj !== "object") return
    patchLocal(obj)
    if (save === "profile") void py.saveDictProfileSettings(obj)
  })
  usePythonEvent("refreshCurrentTabContent", () => {
    void refresh()
    return true
  })

  const value = useMemo<SettingsStore>(
    () => ({ settings, fields, revision, refresh, get, saveProfile, saveGeneral, saveField, patchLocal }),
    [settings, fields, revision, refresh, get, saveProfile, saveGeneral, saveField, patchLocal],
  )
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider")
  return ctx
}

/** Read one setting reactively. */
export function useSetting<T = unknown>(id: string, fallback?: T): T {
  const { settings } = useSettings()
  return (settings?.[id] ?? fallback) as T
}
