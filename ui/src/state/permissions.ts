import { useCallback, useEffect, useState } from "react"

import { isMac } from "@/lib/platform"
import { py, type PermissionStatus } from "@/lib/py"

/**
 * Polls the macOS permission state while mounted, so a user who flips the switch in
 * System Settings sees the result here without reloading. Other platforms need no
 * permissions, so the status stays null there and nothing is reported missing.
 */
export function usePermissions(intervalMs = 3000) {
  const [status, setStatus] = useState<PermissionStatus | null>(null)

  const refresh = useCallback(async () => {
    try {
      setStatus(await py.getPermissionStatus())
    } catch {
      // Older installs or the browser preview may not expose the check.
    }
  }, [])

  useEffect(() => {
    if (!isMac) return
    void refresh()
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh()
    }, intervalMs)
    // coming back from System Settings shows the new state right away
    const onFocus = () => void refresh()
    window.addEventListener("focus", onFocus)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener("focus", onFocus)
    }
  }, [refresh, intervalMs])

  const missing = status ? status.accessibility === false || status.screenRecording === false || status.fullKeyboardAccess === true : false
  return { status, missing, refresh }
}
