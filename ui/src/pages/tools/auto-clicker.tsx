import { MousePointerClickIcon } from "lucide-react"
import { useRef } from "react"

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useI18n, useStrings, type PageStrings } from "@/i18n"
import { useFocusTarget } from "@/lib/focus"
import { callPy } from "@/lib/py"

import {
  HotkeyHint,
  HowTo,
  NumberInput,
  StartStopButtons,
  ToolStateBadge,
  isBusy,
  toolMessage,
  useStickyState,
  type AutoClickerStatus,
  type ToolProps,
  type ToolResult,
} from "./shared"

const MIN_INTERVAL = 10
const DEFAULT_INTERVAL = 100
const DEFAULT_START_DELAY = 3

/** Same rules as the old tab: whole number, at least 10 ms, 100 when empty. */
export function clampInterval(raw: string) {
  let n = parseInt(raw, 10)
  if (Number.isNaN(n)) n = DEFAULT_INTERVAL
  if (n < MIN_INTERVAL) n = MIN_INTERVAL
  return n
}

/** Whole number between 0 and 10 seconds, 3 when empty. */
export function clampStartDelay(raw: string) {
  let n = parseInt(raw, 10)
  if (Number.isNaN(n)) n = DEFAULT_START_DELAY
  return Math.min(10, Math.max(0, n))
}

const strings: PageStrings<
  | "title"
  | "desc"
  | "interval"
  | "intervalDesc"
  | "perSecond"
  | "delay"
  | "delayDesc"
  | "seconds"
  | "ms"
  | "what"
  | "whatBody"
  | "when"
  | "whenBody"
  | "how"
  | "howBody"
  | "stopHow"
  | "stopHowBody"
> = {
  ko: {
    title: "오토 클릭",
    desc: "정해 둔 간격마다 마우스 왼쪽 버튼을 계속 눌러 줘요.",
    interval: "클릭 간격",
    intervalDesc: "클릭과 클릭 사이의 시간이에요. 숫자가 작을수록 빨리 눌러요. (최소 10ms)",
    perSecond: "1초에 약 {count}번",
    delay: "시작 전 대기 시간",
    delayDesc: "시작을 누른 뒤 이만큼 기다렸다가 클릭을 시작해요. 그 사이에 로블록스 창으로 넘어가면 돼요. (0~10초)",
    seconds: "초",
    ms: "ms",
    what: "무엇을 하나요?",
    whatBody: "마우스가 있는 자리를 계속 클릭해요. 마우스를 움직이면 움직인 자리를 클릭해요.",
    when: "언제 쓰나요?",
    whenBody: "상자 열기, 뽑기 기계, 미니게임처럼 같은 곳을 여러 번 눌러야 할 때 편해요.",
    how: "사용 방법",
    howBody: "시작을 누르고 대기 시간 안에 로블록스 창에서 클릭할 곳에 마우스를 올려 두세요.",
    stopHow: "멈추는 방법",
    stopHowBody: "멈추기 버튼이나 매크로 정지 단축키를 누르면 바로 멈춰요.",
  },
  en: {
    title: "Auto Clicker",
    desc: "Repeatedly left-clicks at the interval you choose.",
    interval: "Click interval",
    intervalDesc: "Time between clicks. Lower is faster. (minimum 10 ms)",
    perSecond: "about {count} per second",
    delay: "Start delay",
    delayDesc: "Wait this long after pressing Start before clicking, so you can switch to Roblox. (0–10 s)",
    seconds: "s",
    ms: "ms",
    what: "What does it do?",
    whatBody: "Clicks wherever your mouse is. Move the mouse and it clicks the new spot.",
    when: "When to use it",
    whenBody: "Anything that needs the same spot clicked many times, like opening boxes or machines.",
    how: "How to use",
    howBody: "Press Start, then hover the spot you want clicked in Roblox before the delay ends.",
    stopHow: "How to stop",
    stopHowBody: "Press Stop or the macro stop hotkey and it stops right away.",
  },
}

export function AutoClickerTool({ status, refresh }: ToolProps<AutoClickerStatus>) {
  const t = useStrings(strings)
  const { lang } = useI18n()
  const [intervalText, setIntervalText] = useStickyState("autoclicker_interval_ms", String(DEFAULT_INTERVAL))
  const [delay, setDelay] = useStickyState("autoclicker_start_delay_seconds", String(DEFAULT_START_DELAY))
  const busy = isBusy(status)
  // search jumps land on these settings, which aren't regular setting rows
  const actionsRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<HTMLDivElement>(null)
  const delayRef = useRef<HTMLDivElement>(null)
  useFocusTarget(["autoclicker_start", "autoclicker_stop"], actionsRef)
  useFocusTarget("autoclicker_interval_ms", intervalRef)
  useFocusTarget("autoclicker_start_delay_seconds", delayRef)

  const intervalMs = clampInterval(intervalText)
  const perSecond = Math.round((1000 / intervalMs) * 10) / 10

  const start = async () => {
    const ms = clampInterval(intervalText)
    const secs = clampStartDelay(delay)
    setIntervalText(String(ms))
    setDelay(String(secs))
    const res = await callPy<ToolResult>("startAutoClickerTool", ms, secs)
    await refresh()
    return res
  }
  const stop = async () => {
    const res = await callPy<ToolResult>("stopAutoClickerTool")
    await refresh()
    return res
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MousePointerClickIcon className="size-5 text-primary" />
          {t("title")}
          <ToolStateBadge status={status} />
        </CardTitle>
        <CardDescription>{t("desc")}</CardDescription>
        <CardAction ref={actionsRef}>
          <StartStopButtons status={status} onStart={start} onStop={stop} />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm" aria-live="polite">
          {toolMessage(status?.message, lang, toolMessage("Ready", lang))}
        </p>
        <HotkeyHint startSetting="autoclicker_keybind" />
        <Separator />
        <div className="grid gap-5 sm:grid-cols-2">
          <div ref={intervalRef} className="space-y-1.5">
            <Label htmlFor="autoclicker_interval_ms">{t("interval")}</Label>
            <div className="flex items-center gap-2">
              <NumberInput
                id="autoclicker_interval_ms"
                value={intervalText}
                maxLength={4}
                disabled={busy}
                onChange={setIntervalText}
                onBlur={() => setIntervalText(String(clampInterval(intervalText)))}
              />
              <span className="text-sm text-muted-foreground">{t("ms")}</span>
              <span className="text-xs text-muted-foreground">· {t("perSecond", { count: perSecond })}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t("intervalDesc")}</p>
          </div>
          <div ref={delayRef} className="space-y-1.5">
            <Label htmlFor="autoclicker_start_delay_seconds">{t("delay")}</Label>
            <div className="flex items-center gap-2">
              <NumberInput
                id="autoclicker_start_delay_seconds"
                value={delay}
                maxLength={2}
                disabled={busy}
                onChange={setDelay}
                onBlur={() => setDelay(String(clampStartDelay(delay)))}
              />
              <span className="text-sm text-muted-foreground">{t("seconds")}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t("delayDesc")}</p>
          </div>
        </div>
        <Separator />
        <HowTo
          items={[
            { title: t("what"), body: t("whatBody") },
            { title: t("when"), body: t("whenBody") },
            { title: t("how"), body: t("howBody") },
            { title: t("stopHow"), body: t("stopHowBody") },
          ]}
        />
      </CardContent>
    </Card>
  )
}
