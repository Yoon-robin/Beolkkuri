import { HomeIcon, RefreshCwIcon } from "lucide-react"
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useStrings, type PageStrings } from "@/i18n"
import { py, type Settings } from "@/lib/py"
import { cn } from "@/lib/utils"
import { START_SETUP_EVENT, useRun } from "@/state/run-state"
import { useSettings } from "@/state/settings"

// How the macro gets into the game, asked before the first start (see
// src/modules/misc/startSetup.py, which saves the same settings when the in-game
// overlay is answered).

const strings: PageStrings<
  | "title"
  | "desc"
  | "auto.title"
  | "auto.desc"
  | "manual.title"
  | "manual.desc"
  | "slot.auto"
  | "slot.manual"
  | "slot.n"
  | "slot.hint"
  | "manual.note"
  | "start"
  | "cancel"
> = {
  ko: {
    title: "시작하기 전에 정해 주세요",
    desc: "벌집을 어떻게 할지 처음 한 번만 물어봐요. 나중에 시작 가이드에서 바꿀 수 있어요.",
    "auto.title": "매크로가 알아서 차지",
    "auto.desc": "시작하면 로블록스를 다시 켜고 빈 벌집을 찾아 차지해요. 자리를 비워 둘 때 좋아요.",
    "manual.title": "내가 이미 차지했어요",
    "manual.desc": "게임에 들어가 벌집을 차지한 다음 시작해요. 로블록스를 다시 켜지 않고 지금 게임에서 바로 시작해요.",
    "slot.auto": "먼저 찾아볼 벌집",
    "slot.manual": "내가 차지한 벌집",
    "slot.n": "{n}번",
    "slot.hint": "벌집은 입구에서 바라봤을 때 오른쪽부터 1번이에요.",
    "manual.note": "게임 연결이 끊겨서 다시 들어갈 때는 매크로가 빈 벌집을 찾아 차지해요.",
    start: "이대로 시작",
    cancel: "취소",
  },
  en: {
    title: "Before you start",
    desc: "Asked once: how the macro gets your hive. You can change it later in Getting Started.",
    "auto.title": "The macro claims one",
    "auto.desc": "Starting restarts Roblox, joins and takes a free hive. Good when you leave it running.",
    "manual.title": "I already have a hive",
    "manual.desc": "Join and claim a hive yourself, then start. The macro keeps your open game and starts right away.",
    "slot.auto": "Try this hive first",
    "slot.manual": "Your hive",
    "slot.n": "Hive {n}",
    "slot.hint": "Hives are numbered from the right, seen from the entrance.",
    "manual.note": "If the game disconnects, the macro rejoins and claims a free hive itself.",
    start: "Start",
    cancel: "Cancel",
  },
}

export type StartMode = "auto" | "manual"

const clampSlot = (value: unknown) => {
  const n = Math.round(Number(value))
  return Number.isFinite(n) ? Math.min(6, Math.max(1, n)) : 1
}

/** The saved answer; mode is null until it was given. */
export function readStartMode(settings: Settings | null | undefined) {
  const done = settings?.start_setup_done === true
  const mode: StartMode | null = done ? (settings?.always_rejoin === false ? "manual" : "auto") : null
  const slot = clampSlot(mode === "manual" ? settings?.hive_number : settings?.preferred_hive_slot)
  return { done, mode, slot }
}

/** Save an answer the way startSetup.choose does in Python. */
export async function saveStartMode(saveGeneral: (id: string, value: unknown) => Promise<void>, mode: StartMode, slot: number) {
  if (mode === "manual") {
    await saveGeneral("hive_number", slot)
    await saveGeneral("preferred_hive_slot", slot)
    await saveGeneral("always_rejoin", false)
  } else {
    await saveGeneral("preferred_hive_slot", slot)
    await saveGeneral("always_rejoin", true)
  }
  await saveGeneral("start_setup_done", true)
}

function Option({ selected, icon, title, desc, onSelect }: { selected: boolean; icon: ReactNode; title: string; desc: string; onSelect: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex flex-col gap-1.5 rounded-xl border p-3.5 text-left transition-colors duration-150 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        selected ? "border-primary bg-primary/10" : "hover:bg-muted/50",
      )}
    >
      <span className="flex items-center gap-2 font-medium text-foreground [&_svg]:size-4 [&_svg]:text-primary">
        {icon}
        {title}
      </span>
      <span className="text-sm leading-relaxed text-muted-foreground">{desc}</span>
    </button>
  )
}

/** The two answers and the hive that goes with them. */
export function StartModeChooser({ mode, slot, onChange }: { mode: StartMode | null; slot: number; onChange: (mode: StartMode | null, slot: number) => void }) {
  const s = useStrings(strings)
  return (
    <div className="space-y-3">
      <div role="radiogroup" className="grid gap-2.5 sm:grid-cols-2">
        <Option selected={mode === "auto"} icon={<RefreshCwIcon />} title={s("auto.title")} desc={s("auto.desc")} onSelect={() => onChange("auto", slot)} />
        <Option selected={mode === "manual"} icon={<HomeIcon />} title={s("manual.title")} desc={s("manual.desc")} onSelect={() => onChange("manual", slot)} />
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="text-sm text-foreground">{s(mode === "manual" ? "slot.manual" : "slot.auto")}</span>
        <Select value={String(slot)} onValueChange={(v) => onChange(mode, Number(v))}>
          <SelectTrigger className="w-28" aria-label={s(mode === "manual" ? "slot.manual" : "slot.auto")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {s("slot.n", { n })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{s("slot.hint")}</span>
      </div>
      {mode === "manual" && <p className="text-xs text-muted-foreground">{s("manual.note")}</p>}
    </div>
  )
}

/**
 * Asks before the first start. Opens when the Start button finds no answer, or when the
 * start key did and the in-game overlay can't ask (a Mac, the overlay off).
 */
export function StartSetupDialog() {
  const s = useStrings(strings)
  const { settings, saveGeneral, refresh } = useSettings()
  const { start } = useRun()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<StartMode | null>(null)
  const [slot, setSlot] = useState(1)
  const [busy, setBusy] = useState(false)
  const openRef = useRef(open)
  openRef.current = open
  // after an answer or a cancel here, Python may still report the question for a moment
  const quietUntil = useRef(0)

  const show = useCallback(() => {
    if (openRef.current) return
    const saved = readStartMode(settings)
    setMode(saved.mode)
    setSlot(saved.slot)
    setOpen(true)
  }, [settings])

  useEffect(() => {
    window.addEventListener(START_SETUP_EVENT, show)
    return () => window.removeEventListener(START_SETUP_EVENT, show)
  }, [show])

  useEffect(() => {
    const timer = setInterval(async () => {
      const pending = await py.getStartSetup().catch(() => null)
      if (pending === null || Date.now() < quietUntil.current) return
      if (pending) show()
      else if (openRef.current) {
        // answered over the game, or cancelled with the stop key
        setOpen(false)
        void refresh()
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [show, refresh])

  const close = () => {
    quietUntil.current = Date.now() + 2000
    setOpen(false)
    void py.cancelStartSetup()
  }

  const confirm = async () => {
    if (!mode) return
    setBusy(true)
    quietUntil.current = Date.now() + 2000
    try {
      await saveStartMode(saveGeneral, mode, slot)
      setOpen(false)
      await start()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{s("title")}</DialogTitle>
          <DialogDescription>{s("desc")}</DialogDescription>
        </DialogHeader>
        <StartModeChooser
          mode={mode}
          slot={slot}
          onChange={(m, n) => {
            setMode(m)
            setSlot(n)
          }}
        />
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            {s("cancel")}
          </Button>
          <Button onClick={() => void confirm()} disabled={!mode || busy}>
            {s("start")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
