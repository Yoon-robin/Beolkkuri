import { useCallback, useEffect, useState } from "react"

import { py, type PermissionStatus } from "@/lib/py"

/**
 * Polls the macOS permission state while mounted, so a user who flips the switch in
 * System Settings sees the result here without reloading.
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
    void refresh()
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh()
    }, intervalMs)
    return () => window.clearInterval(timer)
  }, [refresh, intervalMs])

  const missing = status ? status.accessibility === false || status.screenRecording === false || status.fullKeyboardAccess === true : false
  return { status, missing, refresh }
}
