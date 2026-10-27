import { CompassIcon, DownloadIcon, FlowerIcon, ListTodoIcon, ScrollTextIcon, SearchIcon, ShieldAlertIcon, SproutIcon, Trash2Icon, TimerResetIcon } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { EmptyState, Page } from "@/components/page"
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
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useI18n, useStrings, type PageStrings } from "@/i18n"
import { usePythonEvent } from "@/lib/bridge"
import { callPy, py, type LogEntry, type Settings } from "@/lib/py"
import { RichText } from "@/lib/rich-text"
import { buildTaskList, type TaskItem } from "@/lib/tasks"
import { cn } from "@/lib/utils"
import { usePermissions } from "@/state/permissions"
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
  | "tasksGo"
  | "firstTime"
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
  | "permTitle"
  | "permDesc"
  | "permFix"
  | "permKbTitle"
  | "permKbDesc"
  | "permKbFix"
  | "logsExport"
  | "logsClear"
  | "planterReset"
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
    tasksGo: "채집 필드 고르기",
    firstTime: "처음이세요?",
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
    permTitle: "맥 권한이 꺼져 있어요",
    permDesc: "이대로 시작하면 매크로가 키보드·마우스를 움직이거나 화면을 볼 수 없어요.",
    permFix: "켜러 가기",
    permKbTitle: "전체 키보드 접근이 켜져 있어요",
    permKbDesc: "매크로가 오작동할 수 있으니 꺼 주세요.",
    permKbFix: "끄러 가기",
    logsExport: "기록 저장",
    logsClear: "기록 지우기",
    planterReset: "이 타이머 초기화",
  },
  en: {
    title: "Home",
    permTitle: "macOS permissions are off",
    permDesc: "Without them the macro can't move the mouse and keyboard or see the screen.",
    permFix: "Fix it",
    permKbTitle: "Full Keyboard Access is on",
    permKbDesc: "It can confuse the macro, so please turn it off.",
    permKbFix: "Fix it",
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
    tasksGo: "Choose a field",
    firstTime: "New here?",
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
    logsExport: "Save logs",
    logsClear: "Clear logs",
    planterReset: "Reset this timer",
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
  const { t: tc } = useI18n()
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

  // Only lines that just arrived slide in; lines coming back after a search is cleared don't.
  const seenUpTo = useRef(-1)
  useEffect(() => {
    if (logs.length) seenUpTo.current = Math.max(seenUpTo.current, logs[logs.length - 1].key)
  }, [logs])

  // Follow new lines, but only inside the log box (scrollIntoView would also scroll the page)
  // and only while the reader is already at the bottom.
  const stick = useRef(true)
  useEffect(() => {
    const viewport = bottom.current?.closest<HTMLElement>("[data-slot=scroll-area-viewport]")
    if (!viewport) return
    const onScroll = () => {
      stick.current = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 32
    }
    viewport.addEventListener("scroll", onScroll, { passive: true })
    return () => viewport.removeEventListener("scroll", onScroll)
  }, [])
  useEffect(() => {
    const viewport = bottom.current?.closest<HTMLElement>("[data-slot=scroll-area-viewport]")
    if (viewport && stick.current) viewport.scrollTop = viewport.scrollHeight
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={exportLogs} aria-label={t("logsExport")}>
                <DownloadIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("logsExport")}</TooltipContent>
          </Tooltip>
          <AlertDialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label={t("logsClear")}>
                    <Trash2Icon />
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>{t("logsClear")}</TooltipContent>
            </Tooltip>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("logsClearTitle")}</AlertDialogTitle>
                <AlertDialogDescription>{t("logsClearDesc")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{tc("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={async () => {
                    await callPy("clearRecentLogs").catch(() => undefined)
                    clear()
                  }}
                >
                  <Trash2Icon />
                  {tc("common.clear")}
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
            {shown.length === 0 && (
              <p className="flex flex-col items-center gap-2 px-2 py-10 text-center font-sans text-sm text-muted-foreground">
                <ScrollTextIcon className="size-5 opacity-60" />
                {terms.length ? tc("common.noResults") : t("logsEmpty")}
              </p>
            )}
            {shown.map((l) => (
              <LogRow key={l.key} line={l} fresh={l.key > seenUpTo.current} />
            ))}
            <div ref={bottom} />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

/**
 * Keys that survive a task being switched on or off elsewhere in the list, so only the
 * changed row animates in (an index in the key would remount every row below it).
 */
function taskKeys(tasks: TaskItem[]) {
  const seen = new Map<string, number>()
  return tasks.map((task) => {
    const n = seen.get(task.id) ?? 0
    seen.set(task.id, n + 1)
    return [n ? `${task.id}#${n}` : task.id, task] as const
  })
}

function LogRow({ line: l, fresh }: { line: LogLine; fresh: boolean }) {
  // decided once at mount so a re-render can't cut the animation short
  const [animate] = useState(fresh)
  return (
    <div className={cn("flex gap-2 rounded px-1.5 py-1 transition-colors hover:bg-muted/50", animate && "animate-in fade-in-0 slide-in-from-bottom-1 duration-300")}>
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
          <EmptyState icon={SproutIcon} description={t("noPlanters")} className="py-6" />
        ) : (
          <div className="rm-stagger grid grid-cols-2 gap-3 sm:grid-cols-3">
            {timers.map((p) => {
              const remaining = formatRemaining(p.harvestTime - now)
              return (
                <div key={p.index} className="flex flex-col items-center gap-1 rounded-lg border p-3 text-center">
                  <img src={`./assets/icons/${p.planter.replaceAll(" ", "_")}_planter.png`} alt="" className="size-10 object-contain" />
                  <span className="text-xs capitalize">{p.field}</span>
                  <span className={cn("text-sm font-semibold tabular-nums", !remaining && "text-emerald-600 dark:text-emerald-400")}>
                    {remaining ?? t("planterReady")}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon-xs" onClick={() => reset(p.index)} aria-label={t("planterReset")}>
                        <TimerResetIcon />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("planterReset")}</TooltipContent>
                  </Tooltip>
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
  const { lang, t: tc } = useI18n()
  const { settings, saveGeneral, refresh } = useSettings()
  const mode = String(settings?.macro_mode ?? "normal") as (typeof MODES)[number]
  const tasks = useMemo(() => (settings ? buildTaskList(settings, lang) : []), [settings, lang])

  // the macro asks the UI to reload its task list after it changes settings itself
  usePythonEvent("loadTasks", () => void refresh())
  usePythonEvent("updateMacroMode", () => void refresh())
  const { status: perms, missing: permissionsMissing } = usePermissions(5000)
  // only Full Keyboard Access is wrong: that one has to be turned off, not on
  const keyboardOnly = !!perms && perms.accessibility !== false && perms.screenRecording !== false

  return (
    <Page title={t("title")} description={t("subtitle")}>
      {permissionsMissing && (
        <Alert variant="warning" className="animate-in fade-in slide-in-from-top-2 duration-300">
          <ShieldAlertIcon />
          <AlertTitle>{keyboardOnly ? t("permKbTitle") : t("permTitle")}</AlertTitle>
          <AlertDescription>{keyboardOnly ? t("permKbDesc") : t("permDesc")}</AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline" onClick={() => (window.location.hash = "/guide")}>
              {keyboardOnly ? t("permKbFix") : t("permFix")}
            </Button>
          </AlertAction>
        </Alert>
      )}
      {/* left: what runs and in which order; right: what it is doing, as tall as the left side */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-primary/15 via-card to-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {t("control")}
                <RunStatusBadge />
              </CardTitle>
              <CardDescription>{t("controlDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <RunButton size="lg" className="w-full" />
                <p className="flex flex-wrap items-center justify-center gap-x-1 text-xs text-muted-foreground">
                  {t("firstTime")}
                  <a
                    href="#/guide"
                    className="inline-flex items-center gap-1 rounded-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    <CompassIcon className="size-3.5" />
                    {tc("nav.guide")}
                  </a>
                </p>
              </div>
              <div className="space-y-1.5 border-t border-foreground/10 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span id="home-macro-mode" className="text-sm font-medium">
                    {t("mode")}
                  </span>
                  <Select value={mode} onValueChange={(v) => void saveGeneral("macro_mode", v)}>
                    <SelectTrigger className="w-full sm:w-52" aria-labelledby="home-macro-mode">
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
                </div>
                {/* keyed so a new mode's description fades in rather than swapping silently */}
                <p key={mode} className="rm-tab-in text-xs text-muted-foreground">
                  {t(`mode.${mode}.desc` as "mode.normal.desc")}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("tasks")}</CardTitle>
              <CardDescription>{t("tasksDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <EmptyState
                  icon={ListTodoIcon}
                  description={t("tasksEmpty")}
                  action={
                    <Button variant="outline" size="sm" onClick={() => (window.location.hash = "/gather")}>
                      <FlowerIcon />
                      {t("tasksGo")}
                    </Button>
                  }
                />
              ) : (
                <ol className="rm-stagger space-y-1.5">
                  {taskKeys(tasks).map(([key, task]) => (
                    <TaskRow key={key} task={task} />
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
