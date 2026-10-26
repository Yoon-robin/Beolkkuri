import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { toast } from "sonner"

import { usePythonEvent } from "@/lib/bridge"
import { py, RunState } from "@/lib/py"

type RunStatus = "running" | "paused" | "stopped" | "stopping"

type RunStore = {
  status: RunStatus
  /** Start when stopped, resume when paused. */
  start: () => Promise<void>
  stop: () => Promise<void>
}

const RunContext = createContext<RunStore | null>(null)

const toStatus = (state: number): RunStatus =>
  state === RunState.Running ? "running" : state === RunState.Paused ? "paused" : state === RunState.Stopping ? "stopping" : "stopped"

export function RunStateProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<RunStatus>("stopped")

  const poll = useCallback(async () => {
    try {
      setStatus(toStatus(await py.getRunState()))
    } catch {
      // backend not ready yet; keep last known state
    }
  }, [])

  useEffect(() => {
    void poll()
    const timer = setInterval(poll, 500)
    return () => clearInterval(timer)
  }, [poll])

  usePythonEvent("toggleStartStop", () => {
    void poll()
    return true
  })

  const start = useCallback(async () => {
    try {
      if (status === "paused") {
        await py.resume()
        setStatus("running")
        return
      }
      const result = await py.start()
      if (result && result.ok === false) return
      setStatus("running")
    } catch (err) {
      toast.error(String(err))
    }
  }, [status])

  const stop = useCallback(async () => {
    setStatus("stopping")
    try {
      await py.stop()
    } catch (err) {
      toast.error(String(err))
    }
  }, [])

  const value = useMemo(() => ({ status, start, stop }), [status, start, stop])
  return <RunContext.Provider value={value}>{children}</RunContext.Provider>
}

export function useRun() {
  const ctx = useContext(RunContext)
  if (!ctx) throw new Error("useRun must be used inside RunStateProvider")
  return ctx
}
