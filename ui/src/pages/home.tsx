import { DownloadIcon, FlowerIcon, LanguagesIcon, ListTodoIcon, MoonIcon, ScrollTextIcon, SearchIcon, ShieldAlertIcon, SunIcon, Trash2Icon, TimerResetIcon } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"

import { CommandPalette } from "@/components/command-palette"
import { EmptyState } from "@/components/page"
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
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { UpdatePanel } from "@/components/update-panel"
import { useI18n, useStrings, type PageStrings } from "@/i18n"
import { usePythonEvent } from "@/lib/bridge"
import { callPy, isDesktopApp, py, type LogEntry, type Settings } from "@/lib/py"
import { RichText } from "@/lib/rich-text"
import { buildTaskList, type TaskItem } from "@/lib/tasks"
import { useTheme } from "@/lib/theme"
import { cn } from "@/lib/utils"
import { usePermissions } from "@/state/permissions"
import { useSettings } from "@/state/settings"

const strings: PageStrings<
  | "control"
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
  | "tasksEmpty"
  | "tasksGo"
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
    control: "매크로 조작",
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
    tasksEmpty: "켜진 작업이 없어요. 채집이나 수집 탭에서 작업을 켜 주세요.",
    tasksGo: "채집 필드 고르기",
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
    permTitle: "macOS permissions are off",
    permDesc: "Without them the macro can't move the mouse and keyboard or see the screen.",
    permFix: "Fix it",
    permKbTitle: "Full Keyboard Access is on",
    permKbDesc: "It can confuse the macro, so please turn it off.",
    permKbFix: "Fix it",
    control: "Macro control",
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
    tasksEmpty: "No tasks are enabled. Turn some on in Gather or Collect.",
    tasksGo: "Choose a field",
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

/** One block of the control panel: a small heading, with room for a count or buttons on the right. */
function PanelSection({ title, aside, className, children }: { title: ReactNode; aside?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={cn("flex flex-col gap-2", className)}>
      <div className="flex min-h-7 items-center justify-between gap-2">
        <h2 className="text-xs font-semibold text-muted-foreground">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

/** `fill`: grow into the panel's leftover height (side panel) instead of a fixed height (Home tab). */
function LogsSection({ fill }: { fill: boolean }) {
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
    // in the side panel the box shrinks when the task list above it loads or grows
    const resize = new ResizeObserver(() => {
      if (stick.current) viewport.scrollTop = viewport.scrollHeight
    })
    viewport.addEventListener("scroll", onScroll, { passive: true })
    resize.observe(viewport)
    return () => {
      viewport.removeEventListener("scroll", onScroll)
      resize.disconnect()
    }
  }, [])
  useEffect(() => {
    const viewport = bottom.current?.closest<HTMLElement>("[data-slot=scroll-area-viewport]")
    if (viewport && stick.current) viewport.scrollTop = viewport.scrollHeight
  }, [shown.length])

  const exportLogs = async () => {
    const recent = (await py.getRecentLogs().catch(() => [])) ?? []
    let text = "Beolkkuri Logs\n===============\n\n"
    for (const l of recent) text += `[${l.time ?? ""}] ${l.title ?? ""}\n${(l.desc ?? "").replace(/<br>/g, "\n")}\n\n`
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `beolkkuri_logs_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.log`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <PanelSection
      title={t("logs")}
      className={fill ? "min-h-64 flex-1" : undefined}
      aside={
        <div className="flex gap-0.5">
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
        </div>
      }
    >
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("logsSearch")} className="pl-8" type="search" />
        {terms.length > 0 && (
          <span className="absolute top-1/2 right-2 -translate-y-1/2 text-xs text-muted-foreground">
            {t("logsMatch", { count: shown.length, total: logs.length })}
          </span>
        )}
      </div>
      <ScrollArea className={cn("rounded-md border bg-muted/20", fill ? "min-h-0 flex-1" : "h-96")}>
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
    </PanelSection>
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
    <li className="flex items-center gap-2.5 rounded-md border bg-card px-2.5 py-1.5">
      <Badge variant="secondary" className="w-16 shrink-0 justify-center text-[0.65rem]">
        {task.kind}
      </Badge>
      <div className="min-w-0 text-sm">
        <RichText text={task.label} />
      </div>
    </li>
  )
}

function TasksSection({ tasks }: { tasks: TaskItem[] }) {
  const t = useStrings(strings)
  return (
    <PanelSection title={t("tasks")} aside={tasks.length > 0 && <span className="text-xs text-muted-foreground tabular-nums">{tasks.length}</span>}>
      {tasks.length === 0 ? (
        <EmptyState
          icon={ListTodoIcon}
          description={t("tasksEmpty")}
          className="py-5"
          action={
            <Button variant="outline" size="sm" onClick={() => (window.location.hash = "/gather")}>
              <FlowerIcon />
              {t("tasksGo")}
            </Button>
          }
        />
      ) : (
        // a long list scrolls on its own so the logs below keep their room
        <ol className="bk-stagger max-h-52 space-y-1 overflow-y-auto [scrollbar-width:thin]">
          {taskKeys(tasks).map(([key, task]) => (
            <TaskRow key={key} task={task} />
          ))}
        </ol>
      )}
    </PanelSection>
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
    <PanelSection
      title={`${t("planters")} · ${mode === 1 ? t("manual") : t("auto")}`}
      aside={
        timers.length > 0 && (
          <Button variant="ghost" size="xs" onClick={resetAll}>
            <TimerResetIcon />
            {t("plantersReset")}
          </Button>
        )
      }
    >
      {timers.length === 0 ? (
        <p className="rounded-md border border-dashed px-3 py-3 text-center text-xs text-muted-foreground">{t("noPlanters")}</p>
      ) : (
        <ul className="bk-stagger space-y-1">
          {timers.map((p) => {
            const remaining = formatRemaining(p.harvestTime - now)
            return (
              <li key={p.index} className="flex items-center gap-2.5 rounded-md border bg-card py-1 pr-1 pl-2">
                <img src={`./assets/icons/${p.planter.replaceAll(" ", "_")}_planter.png`} alt="" className="size-6 shrink-0 object-contain" />
                <span className="min-w-0 flex-1 truncate text-sm capitalize">{p.field}</span>
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
              </li>
            )
          })}
        </ul>
      )}
    </PanelSection>
  )
}

function PermissionAlert() {
  const t = useStrings(strings)
  const { status: perms, missing } = usePermissions(5000)
  if (!missing) return null
  // only Full Keyboard Access is wrong: that one has to be turned off, not on
  const keyboardOnly = !!perms && perms.accessibility !== false && perms.screenRecording !== false
  return (
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
  )
}

function RunCard() {
  const t = useStrings(strings)
  const { settings, saveGeneral } = useSettings()
  const mode = String(settings?.macro_mode ?? "normal") as (typeof MODES)[number]

  return (
    <section className="space-y-3 rounded-xl border bg-gradient-to-br from-primary/15 via-card to-card p-3.5 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{t("control")}</h2>
        <RunStatusBadge />
      </div>
      <RunButton size="lg" className="w-full" />
      <div className="space-y-1.5 border-t border-foreground/10 pt-3">
        <div className="flex items-center justify-between gap-2">
          <span id="home-macro-mode" className="text-sm font-medium">
            {t("mode")}
          </span>
          <Select value={mode} onValueChange={(v) => void saveGeneral("macro_mode", v)}>
            <SelectTrigger className="w-40" aria-labelledby="home-macro-mode">
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
        <p key={mode} className="bk-tab-in text-xs text-muted-foreground">
          {t(`mode.${mode}.desc` as "mode.normal.desc")}
        </p>
      </div>
    </section>
  )
}

function HomeSections({ fill }: { fill: boolean }) {
  const { lang } = useI18n()
  const { settings, refresh } = useSettings()
  const tasks = useMemo(() => (settings ? buildTaskList(settings, lang) : []), [settings, lang])

  // the macro asks the UI to reload its task list after it changes settings itself
  usePythonEvent("loadTasks", () => void refresh())
  usePythonEvent("updateMacroMode", () => void refresh())

  return (
    <>
      <PermissionAlert />
      <RunCard />
      {settings && <TasksSection tasks={tasks} />}
      {settings && <PlanterTimers settings={settings} />}
      <LogsSection fill={fill} />
    </>
  )
}

/** Language and theme switches, then the version and update button. */
function PanelFooter() {
  const { t, lang, setLang } = useI18n()
  const { resolvedTheme, setTheme } = useTheme()
  const nextLang = lang === "ko" ? "English" : "한국어"
  const themeLabel = resolvedTheme === "dark" ? t("theme.light") : t("theme.dark")

  return (
    <footer className="space-y-1 border-t px-3 py-2">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 justify-start"
          aria-label={`${t("lang.label")}: ${lang === "ko" ? "한국어" : "English"} → ${nextLang}`}
          onClick={() => setLang(lang === "ko" ? "en" : "ko")}
        >
          <LanguagesIcon />
          {lang === "ko" ? "한국어" : "English"}
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={themeLabel} onClick={(e) => setTheme(resolvedTheme === "dark" ? "light" : "dark", { x: e.clientX, y: e.clientY })}>
              <span key={resolvedTheme} className="bk-pop inline-flex">
                {resolvedTheme === "dark" ? <SunIcon /> : <MoonIcon />}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">{themeLabel}</TooltipContent>
        </Tooltip>
      </div>
      <UpdatePanel />
      {!isDesktopApp() && <p className="px-2 pb-1 text-[0.7rem] text-muted-foreground">{t("devBanner")}</p>}
    </footer>
  )
}

/**
 * Home's contents: start and stop, the macro mode, the task order and the logs. Wide windows
 * keep them beside every page as the control panel; narrow ones show them as the Home tab.
 */
export function ControlPanel({ layout }: { layout: "side" | "page" }) {
  const { t } = useI18n()

  if (layout === "page") {
    return (
      <div className="bk-page mx-auto flex w-full max-w-xl flex-col gap-5 p-4">
        <HomeSections fill={false} />
        <PanelFooter />
      </div>
    )
  }

  return (
    <aside className="sticky top-0 flex h-svh w-72 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground lg:w-80 xl:w-[22rem]">
      {/* as tall as the page tabs, so the two borders meet in one line */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
        <img src="./icon.png" alt="" className="size-8 shrink-0 rounded-lg" draggable={false} />
        <div className="grid min-w-0 leading-tight">
          <span className="truncate font-semibold">{t("app.name")}</span>
          <span className="truncate text-xs text-muted-foreground">{t("app.tagline")}</span>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-3">
        <CommandPalette className="w-full md:w-full" />
        <HomeSections fill />
      </div>
      <PanelFooter />
    </aside>
  )
}

export default function HomePage() {
  return <ControlPanel layout="page" />
}
