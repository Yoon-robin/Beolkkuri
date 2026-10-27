import { useCallback, useEffect, useState } from "react"

import { isWindows } from "@/lib/platform"
import { py, type OcrStatus } from "@/lib/py"

/**
 * Whether Windows has its English OCR engine, which reads game text best. While it is
 * being added (a Windows download that can take a few minutes) the status is polled.
 * Other platforms use their own OCR, so the status stays null there.
 */
export function useOcrStatus(intervalMs = 2000) {
  const [status, setStatus] = useState<OcrStatus | null | undefined>(isWindows ? undefined : null)

  const refresh = useCallback(async () => {
    try {
      setStatus(await py.getOcrStatus())
    } catch {
      // Older installs or the browser preview may not expose the check.
      setStatus(null)
    }
  }, [])

  useEffect(() => {
    if (isWindows) void refresh()
  }, [refresh])

  const installing = !!status?.installing
  useEffect(() => {
    if (!installing) return
    const timer = window.setInterval(() => void refresh(), intervalMs)
    return () => window.clearInterval(timer)
  }, [installing, refresh, intervalMs])

  const [tried, setTried] = useState(false)
  const install = useCallback(async () => {
    setTried(true)
    setStatus((s) => (s ? { ...s, installing: true } : s))
    try {
      await py.installEnglishOcr()
    } finally {
      void refresh()
    }
  }, [refresh])

  // Declining the administrator prompt or a failed download leaves it uninstalled.
  const failed = tried && !!status && !status.installing && status.installed === false
  return { status, install, failed }
}
