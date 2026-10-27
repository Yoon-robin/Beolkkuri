import { Loader2Icon, PlayIcon, SquareIcon } from "lucide-react"
import { useRef } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/i18n"
import { cn } from "@/lib/utils"
import { formatDuration, useElapsed, useRun } from "@/state/run-state"
import { useSetting } from "@/state/settings"

import { keybindDisplay } from "./settings/keybind"

export function RunStatusBadge({ className }: { className?: string }) {
  const { t } = useI18n()
  const { status, unresponsive } = useRun()
  const elapsed = useElapsed()
  const shown = unresponsive ? "unresponsive" : status
  const tone = {
    running: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    paused: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    stopping: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
    stopped: "bg-muted text-muted-foreground",
    unresponsive: "bg-destructive/15 text-destructive border-destructive/30",
  }[shown]
  return (
    <Badge variant="outline" className={cn("gap-1.5", tone, className)} title={unresponsive ? t("run.unresponsiveDesc") : undefined}>
      <span className={cn("size-1.5 rounded-full bg-current", shown === "running" && "animate-pulse")} />
      {t(`run.status.${shown}`)}
      {elapsed !== null && (
        <span className="tabular-nums opacity-75" title={t("run.elapsed")}>
          · {formatDuration(elapsed)}
        </span>
      )}
    </Badge>
  )
}

export function RunButton({ size = "default", className }: { size?: "default" | "lg"; className?: string }) {
  const { t } = useI18n()
  const { status, start, stop } = useRun()
  const startKey = keybindDisplay(useSetting<string>("start_keybind", "F1") || "F1")
  const pauseKey = keybindDisplay(useSetting<string>("pause_keybind", "F2") || "F2")
  const stopKey = keybindDisplay(useSetting<string>("stop_keybind", "F3") || "F3")
  const big = size === "lg"
  // One button that changes colour in place; its contents are keyed by state so the new
  // icon and label come into focus instead of snapping. Not on mount: opening a page
  // shouldn't replay it.
  const mountedAs = useRef(status)
  const changed = useRef(false)
  if (status !== mountedAs.current) changed.current = true
  const swap = changed.current ? "bk-swap" : undefined

  if (status === "running" || status === "stopping") {
    return (
      <Button variant="destructive" size={big ? "lg" : "default"} className={cn(big && "h-12 px-6 text-base", className)} onClick={stop} disabled={status === "stopping"}>
        <span key={status} className={cn("inline-flex items-center gap-[inherit]", swap)}>
          {status === "stopping" ? <Loader2Icon className="animate-spin" /> : <SquareIcon className="fill-current" />}
          {status === "stopping" ? t("run.stopping") : t("run.stop")}
          {status !== "stopping" && <kbd className="ml-1 rounded bg-background/40 px-1.5 font-mono text-[0.7em]">{stopKey}</kbd>}
        </span>
      </Button>
    )
  }
  const paused = status === "paused"
  return (
    <Button size={big ? "lg" : "default"} className={cn(big && "h-12 px-6 text-base", className)} onClick={start}>
      <span key={status} className={cn("inline-flex items-center gap-[inherit]", swap)}>
        <PlayIcon className="fill-current" />
        {paused ? t("run.resume") : t("run.start")}
        <kbd className="ml-1 rounded bg-background/25 px-1.5 font-mono text-[0.7em]">{paused ? pauseKey : startKey}</kbd>
      </span>
    </Button>
  )
}
