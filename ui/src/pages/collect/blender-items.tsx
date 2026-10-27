import { RotateCcwIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { SelectControl, SwitchControl, TextControl } from "@/components/settings/controls"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useStrings, type PageStrings } from "@/i18n"
import { callPy } from "@/lib/py"
import { cn } from "@/lib/utils"
import { normalizeOptions, sectionsFor } from "@/schema"
import { useSettings } from "@/state/settings"

const ko = {
  itemsTitle: "블렌더 아이템",
  itemsDesc: "블렌더로 만들 아이템을 최대 5개까지 정해요. 위에서부터 차례대로 만들어요.",
  slot: "아이템 {n}",
  item: "아이템",
  quantity: "수량",
  max: "최대",
  maxHint: "가능한 만큼 만들어요",
  repeat: "반복",
  inf: "무한",
  infHint: "멈추지 않고 계속 만들어요",
  repeatHint: "몇 번 더 만들지 정해요. 한 번 만들 때마다 1씩 줄어요.",
  resetButton: "초기화",
  resetTitle: "블렌더 기록을 초기화할까요?",
  resetDesc: "매크로가 기억하고 있는 블렌더 제작 순서와 대기 시간을 지워요. 아이템 설정은 그대로 남아요.",
  resetCancel: "취소",
  resetConfirm: "초기화",
  resetDone: "블렌더 기록을 초기화했어요",
  resetFailed: "초기화하지 못했어요: {error}",
}
const strings: PageStrings<keyof typeof ko> = {
  ko,
  en: {
    itemsTitle: "Blender items",
    itemsDesc: "Choose up to 5 items to craft. The macro crafts them from top to bottom.",
    slot: "Item {n}",
    item: "Item",
    quantity: "Quantity",
    max: "Max",
    maxHint: "Craft as many as possible",
    repeat: "Repeat",
    inf: "Inf",
    infHint: "Keep crafting forever",
    repeatHint: "How many more times to craft it. Goes down by 1 after each craft.",
    resetButton: "Reset",
    resetTitle: "Reset blender timers?",
    resetDesc: "Clears the blender progress the macro remembers (current item and wait time). Your item settings are kept.",
    resetCancel: "Cancel",
    resetConfirm: "Reset",
    resetDone: "Blender timers reset",
    resetFailed: "Couldn't reset: {error}",
  },
}

// The old UI built the blender dropdown from the same icon list as the Wind Shrine offering.
const ITEM_OPTIONS = normalizeOptions(
  sectionsFor("collect", "collect-activities-tab")
    .flatMap((s) => s.settings)
    .find((d) => d.id === "wind_shrine_item")?.type.data,
)

const SLOTS = [1, 2, 3, 4, 5]

/** Port of clearBlenderData(): asks first, then calls clearBlender(). */
export function BlenderResetButton() {
  const t = useStrings(strings)
  const [open, setOpen] = useState(false)
  const reset = async () => {
    try {
      await callPy("clearBlender")
      toast.success(t("resetDone"))
    } catch (err) {
      toast.error(t("resetFailed", { error: String(err) }))
    }
  }
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <RotateCcwIcon />
        {t("resetButton")}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("resetTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("resetDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("resetCancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void reset()}>{t("resetConfirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function ToggleWithHint({ id, label, hint, checked, onChange }: { id: string; label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 space-y-0.5">
        <Label htmlFor={id} className="text-xs font-medium">
          {label}
        </Label>
        <p className="text-[0.7rem] leading-snug text-muted-foreground">{hint}</p>
      </div>
      <SwitchControl id={id} checked={checked} onChange={onChange} />
    </div>
  )
}

function BlenderSlot({ n }: { n: number }) {
  const t = useStrings(strings)
  const { settings, saveProfile } = useSettings()
  const get = (id: string) => settings?.[id]
  const isMax = !!get(`blender_quantity_max_${n}`)
  const isInf = !!get(`blender_repeat_inf_${n}`)
  const empty = String(get(`blender_item_${n}`) ?? "none").toLowerCase() === "none"

  return (
    <div className="space-y-3 py-4">
      <p className="text-sm font-semibold">{t("slot", { n })}</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor={`blender_item_${n}`} className="text-xs text-muted-foreground">
            {t("item")}
          </Label>
          <SelectControl
            id={`blender_item_${n}`}
            options={ITEM_OPTIONS}
            value={get(`blender_item_${n}`)}
            onChange={(v) => void saveProfile(`blender_item_${n}`, String(v).toLowerCase())}
            width={14}
          />
        </div>
        <div className={cn("space-y-2", empty && "opacity-50")}>
          <Label htmlFor={`blender_quantity_${n}`} className="text-xs text-muted-foreground">
            {t("quantity")}
          </Label>
          <div className={cn(isMax && "pointer-events-none opacity-40")}>
            <TextControl
              id={`blender_quantity_${n}`}
              value={get(`blender_quantity_${n}`)}
              onCommit={(v) => void saveProfile(`blender_quantity_${n}`, v)}
              inputType="int"
              width={7}
            />
          </div>
          <ToggleWithHint
            id={`blender_quantity_max_${n}`}
            label={t("max")}
            hint={t("maxHint")}
            checked={isMax}
            onChange={(v) => void saveProfile(`blender_quantity_max_${n}`, v)}
          />
        </div>
        <div className={cn("space-y-2", empty && "opacity-50")}>
          <Label htmlFor={`blender_repeat_${n}`} className="text-xs text-muted-foreground" title={t("repeatHint")}>
            {t("repeat")}
          </Label>
          <div className={cn(isInf && "pointer-events-none opacity-40")}>
            <TextControl
              id={`blender_repeat_${n}`}
              value={get(`blender_repeat_${n}`)}
              onCommit={(v) => void saveProfile(`blender_repeat_${n}`, v)}
              inputType="int"
              width={7}
            />
          </div>
          <ToggleWithHint
            id={`blender_repeat_inf_${n}`}
            label={t("inf")}
            hint={t("infHint")}
            checked={isInf}
            onChange={(v) => void saveProfile(`blender_repeat_inf_${n}`, v)}
          />
        </div>
      </div>
    </div>
  )
}

export function BlenderItems() {
  const t = useStrings(strings)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("itemsTitle")}</CardTitle>
        <CardDescription>
          {t("itemsDesc")} {t("repeatHint")}
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-border/60 pt-0">
        {SLOTS.map((n) => (
          <BlenderSlot key={n} n={n} />
        ))}
      </CardContent>
    </Card>
  )
}
