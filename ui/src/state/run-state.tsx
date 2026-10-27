import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { toast } from "sonner"

import { useI18n } from "@/i18n"
import { usePythonEvent } from "@/lib/bridge"
import { py, RunState } from "@/lib/py"

type RunStatus = "running" | "paused" | "stopped" | "stopping"

type RunStore = {
  status: RunStatus
  /** Start when stopped, resume when paused. */
  start: () => Promise<void>
  stop: () => Promise<void>
  /** When the current session started (ms) and how long it has been paused, for the run timer. */
  session: { startedAt: number; pausedMs: number; pausedAt: number | null } | null
  /** Python hasn't answered for a few seconds, so `status` may be stale. */
  unresponsive: boolean
}

/** "1:02:03" / "4:05" style duration. */
export function formatDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, "0")
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

const RunContext = createContext<RunStore | null>(null)

const toStatus = (state: number): RunStatus =>
  state === RunState.Running ? "running" : state === RunState.Paused ? "paused" : state === RunState.Stopping ? "stopping" : "stopped"

export function RunStateProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  const [status, setStatus] = useState<RunStatus>("stopped")
  const [session, setSession] = useState<RunStore["session"]>(null)
  const prev = useRef<RunStatus | null>(null)
  const sessionRef = useRef(session)
  sessionRef.current = session

  // Track the session and announce changes, including ones made with the hotkeys.
  useEffect(() => {
    const before = prev.current
    prev.current = status
    if (before === null || before === status) return
    const now = Date.now()
    if (status === "running" && before === "paused") {
      setSession((s) => (s && s.pausedAt ? { ...s, pausedMs: s.pausedMs + now - s.pausedAt, pausedAt: null } : s))
      toast(t("run.toast.resumed"))
    } else if (status === "running" && before === "stopped") {
      setSession({ startedAt: now, pausedMs: 0, pausedAt: null })
      toast.success(t("run.toast.started"))
    } else if (status === "paused") {
      // a start and a pause between two polls still gets a session (and one toast)
      setSession((s) => (s ? { ...s, pausedAt: s.pausedAt ?? now } : { startedAt: now, pausedMs: 0, pausedAt: now }))
      toast(t("run.toast.paused"))
    } else if (status === "stopped") {
      // without a session (the macro was already running when the window opened) the run time is unknown
      const s = sessionRef.current
      const ran = s ? (s.pausedAt ?? now) - s.startedAt - s.pausedMs : null
      toast(t("run.toast.stopped"), ran === null ? undefined : { description: t("run.toast.ranFor", { time: formatDuration(ran) }) })
      setSession(null)
    }
    // stopping -> running means the stop didn't go through: keep the session, no toast
  }, [status, t])

  // Bumped by start/stop so a poll that was already in flight can't undo them
  // (that flicker would announce a stop and a fresh start).
  const actionSeq = useRef(0)
  const firstPoll = useRef(true)
  // When Python stops answering (something blocks its main thread, or it quit), the state
  // above goes stale; say so instead of showing "running" or "stopping" forever.
  const lastAnswer = useRef(0)
  const [unresponsive, setUnresponsive] = useState(false)

  const poll = useCallback(async () => {
    const seq = actionSeq.current
    try {
      const next = toStatus(await py.getRunState())
      lastAnswer.current = Date.now()
      if (seq !== actionSeq.current) return
      // a macro already running when the window opens isn't news, so no toast for it
      if (firstPoll.current) prev.current = next
      firstPoll.current = false
      setStatus(next)
    } catch {
      // backend not ready yet; keep last known state
    }
  }, [])

  useEffect(() => {
    void poll()
    const timer = setInterval(poll, 500)
    return () => clearInterval(timer)
  }, [poll])

  useEffect(() => {
    const timer = setInterval(() => setUnresponsive(lastAnswer.current > 0 && Date.now() - lastAnswer.current > 6000), 1000)
    return () => clearInterval(timer)
  }, [])
  const wasUnresponsive = useRef(false)
  useEffect(() => {
    if (unresponsive) {
      toast.error(t("run.unresponsive"), { id: "unresponsive", description: t("run.unresponsiveDesc"), duration: Infinity })
    } else if (wasUnresponsive.current) {
      toast.success(t("run.recovered"), { id: "unresponsive", description: undefined, duration: 4000 })
    }
    wasUnresponsive.current = unresponsive
  }, [unresponsive, t])

  usePythonEvent("toggleStartStop", () => {
    void poll()
    return true
  })

  const start = useCallback(async () => {
    actionSeq.current++
    try {
      if (status === "paused") {
        await py.resume()
      } else {
        const result = await py.start()
        if (result && result.ok === false) return
      }
      // polls sent while the call was running may still report the old state
      actionSeq.current++
      setStatus("running")
    } catch (err) {
      toast.error(String(err))
    }
  }, [status])

  const stop = useCallback(async () => {
    actionSeq.current++
    setStatus("stopping")
    try {
      await py.stop()
      actionSeq.current++
    } catch (err) {
      toast.error(String(err))
    }
  }, [])

  const value = useMemo(() => ({ status, start, stop, session, unresponsive }), [status, start, stop, session, unresponsive])
  return <RunContext.Provider value={value}>{children}</RunContext.Provider>
}

/** Elapsed run time of the current session, updated as each whole second passes. */
export function useElapsed() {
  const { session } = useRun()
  // only a re-render trigger: the time itself is read fresh on every render, so a
  // resume never shows a stale value for a moment
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!session || session.pausedAt) return
    let timer = 0
    const schedule = () => {
      // wake just after the next whole second so the display never skips or repeats one
      const ms = Date.now() - session.startedAt - session.pausedMs
      timer = window.setTimeout(() => {
        setTick((n) => n + 1)
        schedule()
      }, 1000 - (((ms % 1000) + 1000) % 1000) + 15)
    }
    schedule()
    return () => window.clearTimeout(timer)
  }, [session])
  if (!session) return null
  return (session.pausedAt ?? Math.max(Date.now(), session.startedAt)) - session.startedAt - session.pausedMs
}

export function useRun() {
  const ctx = useContext(RunContext)
  if (!ctx) throw new Error("useRun must be used inside RunStateProvider")
  return ctx
}
