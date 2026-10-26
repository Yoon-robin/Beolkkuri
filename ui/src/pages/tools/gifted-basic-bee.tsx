import { EggIcon, TriangleAlertIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useI18n, useStrings, type PageStrings } from "@/i18n"
import { callPy } from "@/lib/py"
import { cn } from "@/lib/utils"

import {
  HotkeyHint,
  HowTo,
  NumberInput,
  StartStopButtons,
  Stat,
  ToolStateBadge,
  isBusy,
  toolMessage,
  useStickyState,
  type GiftedBasicBeeStatus,
  type ToolProps,
  type ToolResult,
} from "./shared"

const DEFAULT_DELAY = 3

/** Whole number between 1 and 10 seconds, 3 when empty (same as the old tab). */
export function clampCaptureDelay(raw: string) {
  let n = parseInt(raw, 10)
  if (Number.isNaN(n)) n = DEFAULT_DELAY
  return Math.min(10, Math.max(1, n))
}

type PauseKey = "pause_on_gifted_other" | "pause_on_legendary" | "pause_on_mythic"
const PAUSE_DEFAULTS: Record<PauseKey, boolean> = {
  pause_on_gifted_other: true,
  pause_on_legendary: false,
  pause_on_mythic: true,
}

const strings: PageStrings<
  | "title"
  | "beta"
  | "desc"
  | "betaTitle"
  | "betaBody"
  | "delay"
  | "delayDesc"
  | "seconds"
  | "pause"
  | "pauseDesc"
  | "pauseGifted"
  | "pauseGiftedDesc"
  | "pauseOther"
  | "pauseOtherDesc"
  | "pauseLegendary"
  | "pauseLegendaryDesc"
  | "pauseMythic"
  | "pauseMythicDesc"
  | "always"
  | "progress"
  | "slot"
  | "notCaptured"
  | "eggs"
  | "rj"
  | "rolls"
  | "message"
  | "lastRead"
  | "nothing"
  | "found"
  | "what"
  | "whatBody"
  | "when"
  | "whenBody"
  | "how"
  | "howBody"
  | "before"
  | "beforeBody"
> = {
  ko: {
    title: "기프티드 기본 벌 자동 뽑기",
    beta: "베타",
    desc: "기본 알과 로열 젤리를 번갈아 써서 기프티드 기본 벌이 나올 때까지 굴려 줘요.",
    betaTitle: "아직 시험 중인 기능이에요",
    betaBody:
      "화면 글자를 읽어서(OCR) 결과를 판단하기 때문에 가끔 잘못 읽을 수 있어요. 잘못 읽으면 더 굴리거나 엉뚱한 때에 멈출 수 있으니, 돌아가는 동안 꼭 화면을 지켜봐 주세요. 게임 해상도가 낮거나 화면이 복잡하면 더 자주 틀려요. 문제가 생기면 디스코드에 알려 주세요.",
    delay: "위치 저장 대기 시간",
    delayDesc: "시작을 누른 뒤 이만큼 기다렸다가 마우스가 있는 칸을 굴릴 벌 칸으로 저장해요. (1~10초)",
    seconds: "초",
    pause: "이 결과가 나오면 멈추기",
    pauseDesc: "시작할 때의 선택이 적용돼요. 바꾸려면 멈춘 뒤 다시 시작하세요.",
    pauseGifted: "기프티드 기본 벌",
    pauseGiftedDesc: "이 도구의 목표라서 항상 멈춰요.",
    pauseOther: "다른 기프티드 벌",
    pauseOtherDesc: "기본 벌이 아닌 기프티드 벌이 나오면 멈춰요.",
    pauseLegendary: "전설 벌",
    pauseLegendaryDesc: "전설 등급 벌이 나오면 멈춰요.",
    pauseMythic: "신화 벌",
    pauseMythicDesc: "신화 등급 벌이 나오면 멈춰요.",
    always: "항상",
    progress: "진행 상황",
    slot: "벌 칸 위치",
    notCaptured: "아직 저장 안 됨",
    eggs: "쓴 기본 알",
    rj: "쓴 로열 젤리",
    rolls: "굴린 횟수",
    message: "지금 하는 일",
    lastRead: "마지막으로 읽은 글자",
    nothing: "없음",
    found: "찾았어요!",
    what: "무엇을 하나요?",
    whatBody: "기본 알 → 로열 젤리 → 기본 알 순서로 계속 써서, 기프티드 기본 벌이나 멈추기로 고른 결과가 나오면 멈춰요.",
    when: "언제 쓰나요?",
    whenBody: "벌집 한 칸을 기프티드 기본 벌로 바꾸고 싶은데, 직접 수십 번 굴리기 귀찮을 때 써요.",
    how: "사용 방법",
    howBody:
      "시작을 누르면 로블록스 창이 앞으로 나와요. 대기 시간 안에 바꾸고 싶은 벌 칸 위에 마우스를 올려 두면 그 자리를 저장하고 굴리기 시작해요.",
    before: "시작 전에 확인하세요",
    beforeBody: "매크로는 멈춰 두고, 게임 안의 자동 젤리(Auto-Jelly)는 꺼 두고, 로블록스 창이 화면에 보이게 해 주세요. 기본 알과 로열 젤리도 넉넉히 있어야 해요.",
  },
  en: {
    title: "Auto Gifted Basic Bee",
    beta: "Beta",
    desc: "Alternates Basic Eggs and Royal Jelly until a Gifted Basic Bee shows up.",
    betaTitle: "This tool is in early beta",
    betaBody:
      "It reads each roll with OCR, so it can misread, especially at low resolution or with a cluttered screen. A misread can cause extra rolls or an early stop, so watch it while it runs and report issues on Discord.",
    delay: "Capture delay",
    delayDesc: "After pressing Start, wait this long, then save the slot under your mouse as the bee to roll. (1–10 s)",
    seconds: "s",
    pause: "Pause on result",
    pauseDesc: "Applied when the tool starts. Stop and start again to change them.",
    pauseGifted: "Gifted Basic Bee",
    pauseGiftedDesc: "This is the goal, so it always stops.",
    pauseOther: "Gifted non-Basic",
    pauseOtherDesc: "Stop when a gifted bee other than Basic appears.",
    pauseLegendary: "Legendary",
    pauseLegendaryDesc: "Stop on any Legendary bee.",
    pauseMythic: "Mythic",
    pauseMythicDesc: "Stop on any Mythic bee.",
    always: "Always",
    progress: "Progress",
    slot: "Bee slot",
    notCaptured: "Not captured",
    eggs: "Basic Eggs",
    rj: "Royal Jellies",
    rolls: "Total rolls",
    message: "Message",
    lastRead: "Last OCR read",
    nothing: "None",
    found: "Found it!",
    what: "What does it do?",
    whatBody: "Uses Basic Egg, Royal Jelly, Basic Egg… and stops on a Gifted Basic Bee or any result you chose to pause on.",
    when: "When to use it",
    whenBody: "When you want a Gifted Basic Bee in a hive slot without rolling dozens of times by hand.",
    how: "How to use",
    howBody: "Press Start and Roblox is focused. Hover the bee slot to roll before the countdown ends; the tool saves it and starts rolling.",
    before: "Before you start",
    beforeBody: "Stop the main macro, keep Auto-Jelly disabled in-game, and make sure Roblox is visible. Have enough Basic Eggs and Royal Jelly.",
  },
}

export function GiftedBasicBeeTool({ status, refresh }: ToolProps<GiftedBasicBeeStatus>) {
  const t = useStrings(strings)
  const { lang } = useI18n()
  const [delay, setDelay] = useStickyState("auto_gifted_basic_bee_delay", String(DEFAULT_DELAY))
  const [pause, setPause] = useStickyState<Record<PauseKey, boolean>>("auto_gifted_basic_bee_pause", PAUSE_DEFAULTS)
  const busy = isBusy(status)

  const start = async () => {
    const secs = clampCaptureDelay(delay)
    setDelay(String(secs))
    const res = await callPy<ToolResult>("startAutoGiftedBasicBeeTool", secs, {
      pause_on_gifted_basic: true,
      pause_on_gifted_other: pause.pause_on_gifted_other,
      pause_on_legendary: pause.pause_on_legendary,
      pause_on_mythic: pause.pause_on_mythic,
      pause_on_basic: false,
      pause_on_other: false,
    })
    await refresh()
    return res
  }
  const stop = async () => {
    const res = await callPy<ToolResult>("stopAutoGiftedBasicBeeTool")
    await refresh()
    return res
  }

  const slot =
    status?.bee_slot_x != null && status?.bee_slot_y != null ? `${status.bee_slot_x}, ${status.bee_slot_y}` : t("notCaptured")
  const success = status?.state === "finished" && status?.result === "success"

  const pauseOptions: { id: PauseKey; title: string; desc: string }[] = [
    { id: "pause_on_gifted_other", title: t("pauseOther"), desc: t("pauseOtherDesc") },
    { id: "pause_on_legendary", title: t("pauseLegendary"), desc: t("pauseLegendaryDesc") },
    { id: "pause_on_mythic", title: t("pauseMythic"), desc: t("pauseMythicDesc") },
  ]

  return (
    <div className="space-y-4">
      <Alert variant="warning">
        <TriangleAlertIcon />
        <AlertTitle>{t("betaTitle")}</AlertTitle>
        <AlertDescription>{t("betaBody")}</AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <EggIcon className="size-5 text-primary" />
            {t("title")}
            <Badge variant="secondary">{t("beta")}</Badge>
            <ToolStateBadge status={status} />
          </CardTitle>
          <CardDescription>{t("desc")}</CardDescription>
          <CardAction>
            <StartStopButtons status={status} onStart={start} onStop={stop} />
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-5">
          <HotkeyHint startSetting="auto_gifted_basic_bee_start_keybind" />

          <div className="space-y-1.5">
            <Label htmlFor="auto-gifted-basic-bee-delay">{t("delay")}</Label>
            <div className="flex items-center gap-2">
              <NumberInput
                id="auto-gifted-basic-bee-delay"
                value={delay}
                maxLength={2}
                disabled={busy}
                onChange={setDelay}
                onBlur={() => setDelay(String(clampCaptureDelay(delay)))}
              />
              <span className="text-sm text-muted-foreground">{t("seconds")}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t("delayDesc")}</p>
          </div>

          <div className="space-y-2">
            <div>
              <div className="text-sm font-medium">{t("pause")}</div>
              <p className="text-xs text-muted-foreground">{t("pauseDesc")}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-lg border bg-muted/30 px-3 py-2.5 opacity-80">
                <Checkbox checked disabled className="mt-0.5" />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {t("pauseGifted")}
                    <Badge variant="outline">{t("always")}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("pauseGiftedDesc")}</p>
                </div>
              </div>
              {pauseOptions.map((o) => (
                <label
                  key={o.id}
                  htmlFor={o.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted/40",
                    pause[o.id] && "border-primary/40 bg-primary/5",
                    busy && "cursor-not-allowed opacity-60",
                  )}
                >
                  <Checkbox
                    id={o.id}
                    checked={pause[o.id]}
                    disabled={busy}
                    onCheckedChange={(v) => setPause((p) => ({ ...p, [o.id]: v === true }))}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">{o.title}</div>
                    <p className="text-xs text-muted-foreground">{o.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="text-sm font-medium">{t("progress")}</div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label={t("slot")} value={slot} />
              <Stat label={t("eggs")} value={status?.basic_eggs_used ?? 0} />
              <Stat label={t("rj")} value={status?.royal_jellies_used ?? 0} />
              <Stat label={t("rolls")} value={status?.rolls ?? 0} />
            </div>
            <div
              className={cn(
                "rounded-lg border px-3 py-2",
                success ? "border-emerald-500/50 bg-emerald-500/10" : "bg-muted/30",
              )}
            >
              <div className="text-xs text-muted-foreground">{success ? t("found") : t("message")}</div>
              <div className="mt-0.5 text-sm" aria-live="polite">
                {toolMessage(status?.message, lang, toolMessage("Ready", lang))}
              </div>
            </div>
            <div className="rounded-lg border bg-muted/30 px-3 py-2">
              <div className="text-xs text-muted-foreground">{t("lastRead")}</div>
              <div className="mt-0.5 font-mono text-xs break-words text-muted-foreground">
                {status?.last_detected_text || t("nothing")}
              </div>
            </div>
          </div>

          <Separator />
          <HowTo
            items={[
              { title: t("what"), body: t("whatBody") },
              { title: t("when"), body: t("whenBody") },
              { title: t("how"), body: t("howBody") },
              { title: t("before"), body: t("beforeBody") },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}
