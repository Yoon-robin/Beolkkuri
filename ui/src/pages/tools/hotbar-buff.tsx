import { ZapIcon } from "lucide-react"

import { TextControl } from "@/components/settings/controls"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useI18n, useStrings, type PageStrings } from "@/i18n"
import { callPy } from "@/lib/py"
import { cn } from "@/lib/utils"
import { useSettings } from "@/state/settings"

import {
  HotkeyHint,
  HowTo,
  StartStopButtons,
  Stat,
  ToolStateBadge,
  toolMessage,
  type HotbarBuffStatus,
  type ToolProps,
  type ToolResult,
} from "./shared"

const SLOTS = [1, 2, 3, 4, 5, 6, 7] as const

const strings: PageStrings<
  | "title"
  | "desc"
  | "lastSlot"
  | "slotN"
  | "none"
  | "slots"
  | "slotsDesc"
  | "use"
  | "every"
  | "secs"
  | "mins"
  | "summaryOn"
  | "summaryOff"
  | "enabledCount"
  | "what"
  | "whatBody"
  | "when"
  | "whenBody"
  | "how"
  | "howBody"
  | "note"
  | "noteBody"
> = {
  ko: {
    title: "핫바 버프",
    desc: "직접 플레이하는 동안 핫바 칸을 정해 둔 시간마다 대신 눌러 줘요.",
    lastSlot: "마지막으로 누른 칸",
    slotN: "{n}번 칸",
    none: "없음",
    slots: "핫바 칸 설정",
    slotsDesc: "누를 칸을 켜고, 몇 초(또는 몇 분)마다 누를지 정해요. 바꾼 내용은 바로 저장돼요.",
    use: "사용",
    every: "마다",
    secs: "초",
    mins: "분",
    summaryOn: "{value}{unit}마다 눌러요",
    summaryOff: "꺼짐",
    enabledCount: "켜진 칸 {count}개",
    what: "무엇을 하나요?",
    whatBody: "켜 둔 핫바 칸의 숫자 키(1~7)를 칸마다 정한 시간이 지날 때마다 눌러요.",
    when: "언제 쓰나요?",
    whenBody: "매크로 없이 직접 채집하거나 보스를 잡을 때, 버프 아이템을 깜빡하지 않고 계속 쓰고 싶을 때 좋아요.",
    how: "사용 방법",
    howBody: "아래에서 칸을 켜고 시간을 정한 뒤, 시작을 누르거나 시작 단축키를 누르세요. 로블록스 창이 앞에 있어야 해요.",
    note: "알아 두세요",
    noteBody: "매크로가 돌아가는 중에는 시작할 수 없어요. 칸마다 마지막으로 누른 시간을 기억해서, 껐다 켜도 시간이 안 된 칸은 바로 누르지 않아요.",
  },
  en: {
    title: "Hotbar Buff",
    desc: "Presses your hotbar slots on a timer while you play yourself.",
    lastSlot: "Last slot pressed",
    slotN: "Slot {n}",
    none: "None",
    slots: "Hotbar slots",
    slotsDesc: "Turn on the slots to press and how often. Changes save right away.",
    use: "Use",
    every: "Every",
    secs: "Secs",
    mins: "Mins",
    summaryOn: "every {value} {unit}",
    summaryOff: "Off",
    enabledCount: "{count} slots on",
    what: "What does it do?",
    whatBody: "Presses the number key (1–7) of each enabled slot whenever its timer runs out.",
    when: "When to use it",
    whenBody: "When you're playing by hand and want buff items used on time without thinking about it.",
    how: "How to use",
    howBody: "Enable slots below, set their timers, then press Start or the start hotkey with Roblox in front.",
    note: "Good to know",
    noteBody: "It can't start while the macro is running. Each slot's last use is remembered, so restarting won't press slots that aren't due yet.",
  },
}

const key = (slot: number, suffix: string) => `hotbar_buff_tool_slot${slot}_${suffix}`

function SlotRow({ slot }: { slot: number }) {
  const t = useStrings(strings)
  const { lang } = useI18n()
  const { settings, saveProfile } = useSettings()
  const enabled = !!settings?.[key(slot, "enabled")]
  const value = settings?.[key(slot, "use_every_value")] ?? 30
  const format = String(settings?.[key(slot, "use_every_format")] ?? "secs").toLowerCase() === "mins" ? "mins" : "secs"

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border px-3 py-2.5 transition-colors",
        enabled ? "border-primary/40 bg-primary/5" : "bg-muted/20",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-md border-2 font-mono text-lg font-bold",
            enabled ? "border-primary text-primary" : "border-border text-muted-foreground",
          )}
        >
          {slot}
        </span>
        <div className="min-w-24">
          <div className="text-sm font-medium">{t("slotN", { n: slot })}</div>
          <div className="text-xs text-muted-foreground">
            {enabled ? t("summaryOn", { value: String(value), unit: t(format) }) : t("summaryOff")}
          </div>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Switch checked={enabled} onCheckedChange={(v) => void saveProfile(key(slot, "enabled"), v)} />
        {t("use")}
      </label>
      <div className={cn("ml-auto flex items-center gap-2 text-sm", !enabled && "opacity-60")}>
        {lang !== "ko" && <span className="text-muted-foreground">{t("every")}</span>}
        <TextControl
          id={key(slot, "use_every_value")}
          value={value}
          inputType="float"
          width={6}
          onCommit={(v) => void saveProfile(key(slot, "use_every_value"), v)}
        />
        <Select value={format} onValueChange={(v) => void saveProfile(key(slot, "use_every_format"), v)}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="secs">{t("secs")}</SelectItem>
            <SelectItem value="mins">{t("mins")}</SelectItem>
          </SelectContent>
        </Select>
        {lang === "ko" && <span className="text-muted-foreground">{t("every")}</span>}
      </div>
    </div>
  )
}

export function HotbarBuffTool({ status, refresh }: ToolProps<HotbarBuffStatus>) {
  const t = useStrings(strings)
  const { lang } = useI18n()
  const { settings } = useSettings()
  const enabledCount = SLOTS.filter((s) => !!settings?.[key(s, "enabled")]).length

  const start = async () => {
    const res = await callPy<ToolResult>("startHotbarBuffTool")
    await refresh()
    return res
  }
  const stop = async () => {
    const res = await callPy<ToolResult>("stopHotbarBuffTool")
    await refresh()
    return res
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ZapIcon className="size-5 text-primary" />
            {t("title")}
            <ToolStateBadge status={status} />
          </CardTitle>
          <CardDescription>{t("desc")}</CardDescription>
          <CardAction>
            <StartStopButtons status={status} onStart={start} onStop={stop} />
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm" aria-live="polite">
            {toolMessage(status?.message, lang, toolMessage("Ready", lang))}
          </p>
          <Stat label={t("lastSlot")} value={status?.last_slot ? t("slotN", { n: status.last_slot }) : t("none")} className="sm:max-w-56" />
          <HotkeyHint startSetting="hotbar_buff_start_keybind" startFallback="F4" />
          <Separator />
          <HowTo
            items={[
              { title: t("what"), body: t("whatBody") },
              { title: t("when"), body: t("whenBody") },
              { title: t("how"), body: t("howBody") },
              { title: t("note"), body: t("noteBody") },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("slots")}</CardTitle>
          <CardDescription>{t("slotsDesc")}</CardDescription>
          <CardAction>
            <span className="text-sm text-muted-foreground">{t("enabledCount", { count: enabledCount })}</span>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-2">
          {SLOTS.map((slot) => (
            <SlotRow key={slot} slot={slot} />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
