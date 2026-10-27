import { KeyboardIcon, LoaderCircleIcon, PlayIcon, SquareIcon } from "lucide-react"
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { toast } from "sonner"

import { keybindDisplay } from "@/components/settings/keybind"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useI18n, useStrings, type Lang, type PageStrings } from "@/i18n"
import { callPy } from "@/lib/py"
import { cn } from "@/lib/utils"
import { useSettings } from "@/state/settings"

/* ------------------------------------------------------------------ types */

export type ToolResult = { ok?: boolean; message?: string } | null

export type ToolStatus = {
  running?: boolean
  state?: string
  message?: string
}

export type AutoClickerStatus = ToolStatus & { interval_ms?: number; start_delay_seconds?: number }

export type HotbarBuffStatus = ToolStatus & { last_slot?: number | null }

export type GiftedBasicBeeStatus = ToolStatus & {
  result?: string
  rolls?: number
  basic_eggs_used?: number
  royal_jellies_used?: number
  last_detected_text?: string
  bee_slot_x?: number | null
  bee_slot_y?: number | null
}

export type ToolStatuses = {
  auto_clicker?: AutoClickerStatus
  auto_gifted_basic_bee?: GiftedBasicBeeStatus
  hotbar_buff?: HotbarBuffStatus
}

/* ---------------------------------------------------------- session sync */

// One id per UI load, like the old GUI. Python stops any manual tool left over
// from a previous UI session when it sees a new id. This runs when the module is
// first imported (app start), so a tool started from its hotkey before the
// Tools page is opened is not killed by the first visit.
const TOOL_SESSION_ID = `${Date.now()}-${Math.random().toString(16).slice(2)}`
let sessionSync: Promise<ToolStatuses | null> | null = null

export function syncToolSession() {
  if (!sessionSync) {
    sessionSync = callPy<{ status?: ToolStatuses } | null>("syncToolSession", TOOL_SESSION_ID)
      .then((res) => res?.status ?? null)
      .catch((err) => {
        console.error("[tools] syncToolSession", err)
        sessionSync = null
        return null
      })
  }
  return sessionSync
}

/* -------------------------------------------------------- status polling */

export type ToolProps<T extends ToolStatus> = { status: T | null; refresh: () => Promise<void> }

/** Poll a `get…Status` Python function every second while mounted (the old tab polled at 1 s too). */
export function useToolStatus<T extends ToolStatus>(fn: string) {
  const [status, setStatus] = useState<T | null>(null)
  const alive = useRef(true)

  const refresh = useCallback(async () => {
    try {
      const next = await callPy<T | null>(fn)
      if (alive.current && next) setStatus(next)
    } catch (err) {
      console.error(`[tools] ${fn}`, err)
    }
  }, [fn])

  useEffect(() => {
    alive.current = true
    void refresh()
    const timer = window.setInterval(() => void refresh(), 1000)
    return () => {
      alive.current = false
      window.clearInterval(timer)
    }
  }, [refresh])

  return [status, refresh] as const
}

/* ------------------------------------------------------------- messages */

const exactKo: Record<string, string> = {
  Ready: "준비됐어요.",
  "Ready. Stop it with the macro's configured stop hotkey.": "준비됐어요.",
  "Ready. Start with F4 by default and stop with the macro stop hotkey.": "준비됐어요.",
  "Auto clicker started.": "오토 클릭을 시작했어요.",
  "Auto clicker running. Stop it with the macro's configured stop hotkey.": "클릭하는 중이에요.",
  "Auto clicker is already stopped.": "이미 멈춰 있어요.",
  "Stopping auto clicker.": "멈추는 중이에요.",
  "Auto clicker stop requested.": "정지를 요청했어요.",
  "The tool is already running.": "이미 실행 중이에요.",
  "Stop the macro before starting this tool.": "매크로를 먼저 멈춰야 이 도구를 시작할 수 있어요.",
  "The tool is still stopping. Try again in a moment.": "아직 멈추는 중이에요. 잠시 후 다시 눌러 주세요.",
  "Hotbar buff tool started.": "핫바 버프를 시작했어요.",
  "Hotbar buff tool running. Stop it with the macro's configured stop hotkey.": "핫바 버프가 돌아가고 있어요.",
  "Hotbar buff tool is already stopped.": "이미 멈춰 있어요.",
  "Stopping hotbar buff tool.": "멈추는 중이에요.",
  "Hotbar buff tool stop requested.": "정지를 요청했어요.",
  "Hotbar buff tool running. Enable at least one slot in the tool settings.":
    "돌아가고 있지만 켜진 칸이 없어요. 아래에서 칸을 하나 이상 켜 주세요.",
  "Hotbar buff tool running. Waiting for the next configured slot timer.": "다음 칸을 누를 시간을 기다리는 중이에요.",
  "Preparing Roblox window.": "로블록스 창을 준비하는 중이에요.",
  "Tool started. Roblox will be focused automatically.": "도구를 시작했어요. 로블록스 창이 자동으로 앞으로 나와요.",
  "Stopping after the current step.": "지금 하던 단계까지만 하고 멈춰요.",
  "Stop requested.": "정지를 요청했어요.",
  "Stopped after a paused result was kept.": "원하던 결과가 나와서 그대로 두고 멈췄어요.",
  "Hover over the target bee slot in Roblox.": "로블록스에서 굴릴 벌 칸 위에 마우스를 올려 두세요.",
  "Bee slot captured. Starting rolls.": "벌 칸 위치를 저장했어요. 굴리기를 시작해요.",
  "Looking for Basic Eggs.": "기본 알을 찾는 중이에요.",
  "Looking for Royal Jellies.": "로열 젤리를 찾는 중이에요.",
  "Using Basic Eggs.": "기본 알을 쓰는 중이에요.",
  "Using Royal Jellies.": "로열 젤리를 쓰는 중이에요.",
  "Basic Egg applied. Using Royal Jelly next.": "기본 알을 썼어요. 다음은 로열 젤리예요.",
  "Gifted Basic Bee detected.": "기프티드 기본 벌이 나왔어요! 🎉",
  "Mythic bee detected.": "신화 벌이 나왔어요!",
  "Gifted non-Basic bee detected.": "기본 벌이 아닌 기프티드 벌이 나왔어요!",
  "Legendary bee detected.": "전설 벌이 나왔어요!",
  "Basic Bee detected. Returning to Basic Eggs.": "그냥 기본 벌이에요. 다시 기본 알로 돌아가요.",
  "No Basic Bee detected. Returning to Basic Eggs.": "기본 벌이 아니에요. 다시 기본 알로 돌아가요.",
  "Gifted Basic skipped. Returning to Basic Eggs.": "기프티드 기본 벌은 건너뛰고 다시 기본 알로 돌아가요.",
  "Mythic skipped. Returning to Basic Eggs.": "신화 벌은 건너뛰고 다시 기본 알로 돌아가요.",
  "Legendary skipped. Returning to Basic Eggs.": "전설 벌은 건너뛰고 다시 기본 알로 돌아가요.",
  "Gifted non-Basic skipped. Returning to Basic Eggs.": "기프티드 벌은 건너뛰고 다시 기본 알로 돌아가요.",
  "Tool finished.": "끝났어요.",
}

const patternKo: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^Auto clicker will start in (\d+)s\.$/, (m) => `${m[1]}초 뒤에 오토 클릭을 시작해요.`],
  [/^Auto clicker starting in (\d+)s\./, (m) => `${m[1]}초 뒤에 클릭을 시작해요. 로블록스 창을 클릭할 곳에 마우스를 올려 두세요.`],
  [/^Pressed hotbar slot (\d+)\./, (m) => `핫바 ${m[1]}번 칸을 눌렀어요.`],
  [/^Hover over the target bee slot\. Capturing in (\d+)s\.$/, (m) => `굴릴 벌 칸 위에 마우스를 올려 두세요. ${m[1]}초 뒤에 위치를 저장해요.`],
]

/** Python sends English status text; show the Korean version when we know it. */
export function toolMessage(message: string | undefined, lang: Lang, fallback = "") {
  const text = (message ?? "").trim()
  if (!text) return fallback
  if (lang !== "ko") return text
  if (exactKo[text]) return exactKo[text]
  for (const [re, fn] of patternKo) {
    const m = text.match(re)
    if (m) return fn(m)
  }
  return text
}

/* ---------------------------------------------------------------- strings */

const strings: PageStrings<
  | "state.idle"
  | "state.starting"
  | "state.running"
  | "state.stopping"
  | "state.finished"
  | "state.positioning"
  | "state.rolling"
  | "start"
  | "starting"
  | "stop"
  | "hotkeys"
  | "startKey"
  | "stopKey"
  | "notSet"
  | "changeInSettings"
  | "startFailed"
  | "stopFailed"
> = {
  ko: {
    "state.idle": "꺼짐",
    "state.starting": "곧 시작",
    "state.running": "실행 중",
    "state.stopping": "멈추는 중",
    "state.finished": "끝남",
    "state.positioning": "위치 잡는 중",
    "state.rolling": "굴리는 중",
    start: "시작",
    starting: "시작하는 중…",
    stop: "멈추기",
    hotkeys: "단축키",
    startKey: "시작",
    stopKey: "멈추기",
    notSet: "설정 안 됨",
    changeInSettings: "단축키는 설정 탭에서 바꿀 수 있어요.",
    startFailed: "시작하지 못했어요",
    stopFailed: "멈추지 못했어요",
  },
  en: {
    "state.idle": "Off",
    "state.starting": "Starting",
    "state.running": "Running",
    "state.stopping": "Stopping",
    "state.finished": "Finished",
    "state.positioning": "Positioning",
    "state.rolling": "Rolling",
    start: "Start",
    starting: "Starting…",
    stop: "Stop",
    hotkeys: "Hotkeys",
    startKey: "Start",
    stopKey: "Stop",
    notSet: "Not set",
    changeInSettings: "You can change hotkeys in the Settings tab.",
    startFailed: "Couldn't start",
    stopFailed: "Couldn't stop",
  },
}

export function useToolStrings() {
  return useStrings(strings)
}

/** True while the tool is doing something (also during the start countdown / stopping). */
export const isBusy = (status: ToolStatus | null | undefined) =>
  !!status && (!!status.running || status.state === "starting" || status.state === "stopping")

/* ------------------------------------------------------------ components */

export function ToolStateBadge({ status, className }: { status: ToolStatus | null | undefined; className?: string }) {
  const t = useToolStrings()
  const state = status?.state || (status?.running ? "running" : "idle")
  const running = !!status?.running
  const key = `state.${state}` as Parameters<typeof t>[0]
  const known = Object.prototype.hasOwnProperty.call(strings.en, key)
  return (
    <Badge
      variant={running ? "default" : state === "stopping" || state === "starting" ? "secondary" : "outline"}
      className={cn(running && "bg-emerald-600 text-white dark:bg-emerald-500", className)}
    >
      <span className={cn("size-1.5 rounded-full", running ? "animate-pulse bg-white" : "bg-muted-foreground/60")} />
      {known ? t(key) : state}
    </Badge>
  )
}

/** Start / Stop buttons. Shows only the one that applies, like the old tab. */
export function StartStopButtons({
  status,
  onStart,
  onStop,
}: {
  status: ToolStatus | null | undefined
  onStart: () => Promise<ToolResult>
  onStop: () => Promise<ToolResult>
}) {
  const t = useToolStrings()
  const { lang } = useI18n()
  const [pending, setPending] = useState<"start" | "stop" | null>(null)
  const running = isBusy(status)

  const run = async (kind: "start" | "stop") => {
    setPending(kind)
    try {
      const res = kind === "start" ? await onStart() : await onStop()
      if (res && res.ok === false) toast.error(t(kind === "start" ? "startFailed" : "stopFailed"), { description: toolMessage(res.message, lang) })
    } catch (err) {
      toast.error(t(kind === "start" ? "startFailed" : "stopFailed"), { description: String(err) })
    } finally {
      setPending(null)
    }
  }

  if (running)
    return (
      <Button size="lg" variant="destructive" onClick={() => void run("stop")} disabled={pending !== null} className="min-w-28">
        {pending === "stop" ? <LoaderCircleIcon className="animate-spin" /> : <SquareIcon />}
        {t("stop")}
      </Button>
    )
  return (
    <Button size="lg" onClick={() => void run("start")} disabled={pending !== null} className="min-w-28">
      {pending === "start" ? <LoaderCircleIcon className="animate-spin" /> : <PlayIcon />}
      {pending === "start" ? t("starting") : t("start")}
    </Button>
  )
}

export function Kbd({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-6 min-w-6 items-center justify-center rounded-md border bg-muted px-1.5 font-mono text-xs font-semibold shadow-[inset_0_-1px_0] shadow-border",
        muted && "font-sans font-normal text-muted-foreground",
      )}
    >
      {children}
    </kbd>
  )
}

/** Start/stop hotkeys for a tool, read live from settings. */
export function HotkeyHint({ startSetting, startFallback = "" }: { startSetting: string; startFallback?: string }) {
  const t = useToolStrings()
  const { settings } = useSettings()
  const startKey = keybindDisplay(settings?.[startSetting] || startFallback)
  const stopKey = keybindDisplay(settings?.stop_keybind || "F3")
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
      <span className="flex items-center gap-1.5 font-medium">
        <KeyboardIcon className="size-4 text-muted-foreground" />
        {t("hotkeys")}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="text-muted-foreground">{t("startKey")}</span>
        {startKey ? <Kbd>{startKey}</Kbd> : <Kbd muted>{t("notSet")}</Kbd>}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="text-muted-foreground">{t("stopKey")}</span>
        <Kbd>{stopKey}</Kbd>
      </span>
      <a href="#/settings" className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
        {t("changeInSettings")}
      </a>
    </div>
  )
}

/** A whole-number box that is clamped (and written back) when it loses focus. */
export function NumberInput({
  id,
  value,
  onChange,
  onBlur,
  maxLength,
  decimal,
  className,
  disabled,
}: {
  id?: string
  value: string
  /** Receives the raw text; clamp it in `onBlur`. */
  onChange: (next: string) => void
  onBlur?: () => void
  maxLength?: number
  /** Allow one decimal point. */
  decimal?: boolean
  className?: string
  disabled?: boolean
}) {
  return (
    <Input
      id={id}
      value={value}
      inputMode={decimal ? "decimal" : "numeric"}
      disabled={disabled}
      className={cn("w-28 text-right tabular-nums", className)}
      onChange={(e) => {
        const next = e.target.value
        if (!(decimal ? /^\d*\.?\d*$/ : /^\d*$/).test(next)) return
        if (maxLength && next.length > maxLength) return
        onChange(next)
      }}
      onBlur={onBlur}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur()
      }}
      autoComplete="off"
      spellCheck={false}
    />
  )
}

/** A labelled stat tile used in status panels and calculator summaries. */
export function Stat({ label, value, className }: { label: ReactNode; value: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-muted/30 px-3 py-2", className)}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate font-semibold tabular-nums">{value}</div>
    </div>
  )
}

/** "What it does / when to use it" explainer block. */
export function HowTo({ items }: { items: { title: string; body: ReactNode }[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.title} className="rounded-lg border border-dashed px-3 py-2.5">
          <div className="text-sm font-medium">{item.title}</div>
          <div className="mt-1 text-sm text-muted-foreground">{item.body}</div>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------- sticky values */

// The old GUI kept every tab in the DOM, so typed values survived tab switches
// (but were not saved to settings). Keep the same lifetime: module memory.
const sticky = new Map<string, unknown>()

export function useStickyState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => (sticky.has(key) ? (sticky.get(key) as T) : initial))
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next
        sticky.set(key, resolved)
        return resolved
      })
    },
    [key],
  )
  return [value, set] as const
}
