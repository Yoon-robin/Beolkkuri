import { DownloadIcon, SearchIcon, Trash2Icon, TimerResetIcon } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { Page } from "@/components/page"
import { RunButton, RunStatusBadge } from "@/components/run-controls"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useI18n, useStrings, type PageStrings } from "@/i18n"
import { usePythonEvent } from "@/lib/bridge"
import { callPy, py, type LogEntry, type Settings } from "@/lib/py"
import { RichText } from "@/lib/rich-text"
import { buildTaskList, type TaskItem } from "@/lib/tasks"
import { cn } from "@/lib/utils"
import { useSettings } from "@/state/settings"

const strings: PageStrings<
  | "title"
  | "subtitle"
  | "control"
  | "controlDesc"
  | "mode"
  | "mode.normal"
  | "mode.alt"
  | "mode.field"
  | "mode.quest"
  | "mode.bug"
  | "mode.normal.desc"
  | "mode.alt.desc"
  | "mode.field.desc"
  | "mode.quest.desc"
  | "mode.bug.desc"
  | "tasks"
  | "tasksDesc"
  | "tasksEmpty"
  | "logs"
  | "logsEmpty"
  | "logsSearch"
  | "logsMatch"
  | "logsClearTitle"
  | "logsClearDesc"
  | "planters"
  | "plantersReset"
  | "planterReady"
  | "noPlanters"
  | "manual"
  | "auto"
> = {
  ko: {
    title: "홈",
    subtitle: "매크로를 시작하고 지금 무슨 일을 하는지 확인해요.",
    control: "매크로 조작",
    controlDesc: "로블록스에서 비 스웜 시뮬레이터를 켜 두고 시작을 누르세요.",
    mode: "매크로 모드",
    "mode.normal": "일반 모드",
    "mode.alt": "부계정 모드",
    "mode.field": "필드 전용 모드",
    "mode.quest": "퀘스트 전용 모드",
    "mode.bug": "벌레 사냥 모드",
    "mode.normal.desc": "켜 둔 작업을 우선순위대로 모두 해요.",
    "mode.alt.desc": "메인 계정이 정해 준 필드에서 계속 채집해요.",
    "mode.field.desc": "채집만 해요.",
    "mode.quest.desc": "퀘스트만 해요.",
    "mode.bug.desc": "몹과 보스 사냥만 해요.",
    tasks: "할 일 목록",
    tasksDesc: "매크로가 이 순서대로 작업해요.",
    tasksEmpty: "켜진 작업이 없어요. 채집이나 수집 탭에서 작업을 켜 주세요.",
    logs: "기록",
    logsEmpty: "아직 기록이 없어요.",
    logsSearch: "기록 검색 (예: 벌집)",
    logsMatch: "{total}개 중 {count}개",
    logsClearTitle: "기록을 모두 지울까요?",
    logsClearDesc: "지운 기록은 되돌릴 수 없어요.",
    planters: "플랜터 타이머",
    plantersReset: "모두 초기화",
    planterReady: "수확 가능!",
    noPlanters: "심어 둔 플랜터가 없어요.",
    manual: "수동",
    auto: "자동",
  },
  en: {
    title: "Home",
    subtitle: "Start the macro and watch what it's doing.",
    control: "Macro control",
    controlDesc: "Open Bee Swarm Simulator in Roblox, then press Start.",
    mode: "Macro mode",
    "mode.normal": "Normal",
    "mode.alt": "Alt",
    "mode.field": "Field only",
    "mode.quest": "Quest only",
    "mode.bug": "Bug run",
    "mode.normal.desc": "Runs every enabled task in priority order.",
    "mode.alt.desc": "Gathers the field the host assigns, indefinitely.",
    "mode.field.desc": "Gathers in fields only.",
    "mode.quest.desc": "Does quests only.",
    "mode.bug.desc": "Mob and boss runs only.",
    tasks: "Tasks",
    tasksDesc: "The macro works through these in order.",
    tasksEmpty: "No tasks are enabled. Turn some on in Gather or Collect.",
    logs: "Logs",
    logsEmpty: "Nothing logged yet.",
    logsSearch: "Search logs (e.g. claimed hive)",
    logsMatch: "{count} of {total}",
    logsClearTitle: "Clear all logs?",
    logsClearDesc: "This can't be undone.",
    planters: "Planter timers",
    plantersReset: "Reset all",
    planterReady: "Ready!",
    noPlanters: "No planters placed.",
    manual: "Manual",
    auto: "Auto",
  },
}

const MODES = ["normal", "alt", "field", "quest", "bug"] as const

type LogLine = LogEntry & { key: number }

function useLogs() {
  const [logs, setLogs] = useState<LogLine[]>([])
  const counter = useRef(0)
  const push = useCallback((entries: LogEntry[]) => {
    setLogs((prev) => [...prev, ...entries.map((e) => ({ ...e, key: counter.current++ }))].slice(-1000))
  }, [])

  useEffect(() => {
    let cancelled = false
    py.getRecentLogs()
      .then((recent) => {
        if (cancelled || !recent?.length) return
        // backlog first, then anything that streamed in while it loaded
        setLogs((live) => [...recent.map((e) => ({ ...e, key: counter.current++ })), ...live].slice(-1000))
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  // Python sends (time, html message, hex color)
  usePythonEvent("log", (time: string, msg: string, color: string) => {
    const [title, ...rest] = String(msg ?? "").split("<br>")
    push([{ time, title, desc: rest.join("<br>"), color }])
  })

  return { logs, clear: () => setLogs([]) }
}

function LogsCard() {
  const t = useStrings(strings)
  const { logs, clear } = useLogs()
  const [query, setQuery] = useState("")
  const bottom = useRef<HTMLDivElement>(null)
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean)
  const shown = terms.length
    ? logs.filter((l) => {
        const text = `${l.time} ${l.title} ${l.desc}`.toLocaleLowerCase()
        return terms.every((term) => text.includes(term))
      })
    : logs

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" })
  }, [shown.length])

  const exportLogs = async () => {
    const recent = (await py.getRecentLogs().catch(() => [])) ?? []
    let text = "RobinMacro Logs\n================\n\n"
    for (const l of recent) text += `[${l.time ?? ""}] ${l.title ?? ""}\n${(l.desc ?? "").replace(/<br>/g, "\n")}\n\n`
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `robinmacro_logs_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.log`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="flex min-h-[22rem] flex-col">
      <CardHeader>
        <CardTitle>{t("logs")}</CardTitle>
        <CardAction className="flex gap-1">
          <Button variant="ghost" size="icon-sm" onClick={exportLogs} aria-label="Export">
            <DownloadIcon />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Clear">
                <Trash2Icon />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("logsClearTitle")}</AlertDialogTitle>
                <AlertDialogDescription>{t("logsClearDesc")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>✕</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    await callPy("clearRecentLogs").catch(() => undefined)
                    clear()
                  }}
                >
                  <Trash2Icon />
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardAction>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("logsSearch")} className="pl-8" type="search" />
          {terms.length > 0 && (
            <span className="absolute top-1/2 right-2 -translate-y-1/2 text-xs text-muted-foreground">
              {t("logsMatch", { count: shown.length, total: logs.length })}
            </span>
          )}
        </div>
        <ScrollArea className="h-80 flex-1 rounded-md border bg-muted/20">
          <div className="space-y-1 p-2 font-mono text-xs">
            {shown.length === 0 && <p className="p-2 text-muted-foreground">{t("logsEmpty")}</p>}
            {shown.map((l) => (
              <div key={l.key} className="flex gap-2 rounded px-1.5 py-1 hover:bg-muted/50">
                <span className="mt-1 h-3 w-1 shrink-0 rounded-full" style={{ backgroundColor: l.color ? `#${l.color}` : "var(--muted-foreground)" }} />
                <div className="min-w-0">
                  <span className="text-muted-foreground">{l.time ? `[${l.time}] ` : ""}</span>
                  <RichText text={l.title ?? ""} className="font-medium" />
                  {l.desc && (
                    <div className="text-muted-foreground">
                      <RichText text={l.desc.replace(/<br>/g, " · ")} />
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottom} />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

function TaskRow({ task }: { task: TaskItem }) {
  return (
    <li className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2">
      <Badge variant="secondary" className="w-20 shrink-0 justify-center text-[0.65rem]">
        {task.kind}
      </Badge>
      <div className="min-w-0 text-sm">
        <RichText text={task.label} />
      </div>
    </li>
  )
}

type PlanterTimer = { planter: string; field: string; harvestTime: number; index: number }

function formatRemaining(seconds: number) {
  if (seconds < 0) return null
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

function PlanterTimers({ settings }: { settings: Settings }) {
  const t = useStrings(strings)
  const mode = Number(settings.planters_mode ?? 0)
  const [timers, setTimers] = useState<PlanterTimer[]>([])
  const [now, setNow] = useState(() => Date.now() / 1000)

  const load = useCallback(async () => {
    try {
      if (mode === 1) {
        const data = await callPy<{ planters: string[]; fields: string[]; harvestTimes: number[] }>("getManualPlanterData")
        setTimers(
          (data?.planters ?? [])
            .map((p, i) => ({ planter: p, field: data.fields[i], harvestTime: data.harvestTimes[i], index: i }))
            .filter((x) => x.planter),
        )
      } else if (mode === 2) {
        const data = await callPy<{ planters: { planter: string; field: string; harvest_time: number }[] }>("getAutoPlanterData")
        setTimers(
          (data?.planters ?? [])
            .map((p, i) => ({ planter: p.planter, field: p.field, harvestTime: p.harvest_time, index: i }))
            .filter((x) => x.planter),
        )
      } else setTimers([])
    } catch {
      setTimers([])
    }
  }, [mode])

  useEffect(() => {
    void load()
    const tick = setInterval(() => setNow(Date.now() / 1000), 30_000)
    return () => clearInterval(tick)
  }, [load])
  usePythonEvent("loadTasks", () => void load())

  if (!mode) return null

  const reset = async (index: number) => {
    await callPy(mode === 1 ? "resetManualPlanterTimer" : "resetAutoPlanterTimer", index).catch(() => undefined)
    setTimers((prev) => prev.filter((x) => x.index !== index))
  }
  const resetAll = async () => {
    await callPy(mode === 1 ? "clearManualPlanters" : "clearAutoPlanters").catch(() => undefined)
    setTimers([])
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("planters")}</CardTitle>
        <CardDescription>{mode === 1 ? t("manual") : t("auto")}</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" onClick={resetAll}>
            <TimerResetIcon />
            {t("plantersReset")}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {timers.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noPlanters")}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {timers.map((p) => {
              const remaining = formatRemaining(p.harvestTime - now)
              return (
                <div key={p.index} className="flex flex-col items-center gap-1 rounded-lg border p-3 text-center">
                  <img src={`./assets/icons/${p.planter.replaceAll(" ", "_")}_planter.png`} alt="" className="size-10 object-contain" />
                  <span className="text-xs capitalize">{p.field}</span>
                  <span className={cn("text-sm font-semibold tabular-nums", !remaining && "text-emerald-500")}>{remaining ?? t("planterReady")}</span>
                  <Button variant="ghost" size="xs" onClick={() => reset(p.index)}>
                    <TimerResetIcon />
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function HomePage() {
  const t = useStrings(strings)
  const { lang } = useI18n()
  const { settings, saveGeneral, refresh } = useSettings()
  const mode = String(settings?.macro_mode ?? "normal") as (typeof MODES)[number]
  const tasks = useMemo(() => (settings ? buildTaskList(settings, lang) : []), [settings, lang])

  // the macro asks the UI to reload its task list after it changes settings itself
  usePythonEvent("loadTasks", () => void refresh())
  usePythonEvent("updateMacroMode", () => void refresh())

  return (
    <Page title={t("title")} description={t("subtitle")}>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-primary/15 via-card to-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {t("control")}
              <RunStatusBadge />
            </CardTitle>
            <CardDescription>{t("controlDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <RunButton size="lg" className="w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("mode")}</CardTitle>
            <CardDescription>{t(`mode.${mode}.desc` as "mode.normal.desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={mode} onValueChange={(v) => void saveGeneral("macro_mode", v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {t(`mode.${m}` as "mode.normal")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("tasks")}</CardTitle>
              <CardDescription>{t("tasksDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("tasksEmpty")}</p>
              ) : (
                <ol className="space-y-1.5">
                  {tasks.map((task, i) => (
                    <TaskRow key={`${task.id}-${i}`} task={task} />
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
          {settings && <PlanterTimers settings={settings} />}
        </div>
        <LogsCard />
      </div>
    </Page>
  )
}
