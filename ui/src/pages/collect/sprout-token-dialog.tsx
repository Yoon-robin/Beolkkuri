import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ArrowDownIcon, ArrowUpIcon, GripVerticalIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useStrings, type PageStrings } from "@/i18n"
import { callPy } from "@/lib/py"
import { cn } from "@/lib/utils"
import { useSettings } from "@/state/settings"

import {
  SPROUT_TOKENS_BY_MODEL,
  buildTokenRows,
  presetTokenRows,
  sproutTokenModelName,
  tokenRowsToSettings,
  type TokenRow,
} from "./sprout-tokens"

const ko = {
  title: "새싹 토큰 우선순위",
  desc: "새싹이 터진 뒤 AI가 주우러 갈 토큰을 켜 주세요. 끌어서 위에 있을수록 먼저 주워요.",
  model: "지금 고른 AI 모델({model})이 알아보는 토큰만 보여요.",
  presetField: "이 필드 드롭 위주",
  presetAll: "새싹 드롭 전부",
  presetClear: "모두 끄기",
  enabledCount: "{count}개 켜짐",
  up: "위로",
  down: "아래로",
  drag: "끌어서 순서 바꾸기",
  cancel: "취소",
  save: "토큰 저장",
  saved: "새싹 토큰 우선순위를 저장했어요",
  saveFailed: "저장하지 못했어요: {error}",
}
const strings: PageStrings<keyof typeof ko> = {
  ko,
  en: {
    title: "Sprout Token Priority",
    desc: "Enable the tokens the AI should chase after the sprout pops. Drag tokens to sort them from highest to lowest priority.",
    model: "Selected model: {model}. Only tokens detected by this model are shown.",
    presetField: "Field Drops",
    presetAll: "All Sprout Drops",
    presetClear: "Clear",
    enabledCount: "{count} enabled",
    up: "Up",
    down: "Down",
    drag: "Drag to reorder",
    cancel: "Cancel",
    save: "Save Tokens",
    saved: "Sprout token priority saved",
    saveFailed: "Could not save: {error}",
  },
}

function TokenRowItem({
  row,
  index,
  count,
  onToggle,
  onMove,
  t,
}: {
  row: TokenRow
  index: number
  count: number
  onToggle: (enabled: boolean) => void
  onMove: (delta: number) => void
  t: (key: keyof typeof ko) => string
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: row.name })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 rounded-md border bg-card px-2 py-1.5",
        isDragging && "z-10 shadow-md ring-1 ring-primary",
        !row.enabled && "opacity-60",
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={t("drag")}
        title={t("drag")}
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
      >
        <GripVerticalIcon className="size-4" />
      </button>
      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm">
        <Checkbox checked={row.enabled} onCheckedChange={(v) => onToggle(v === true)} />
        <span className="w-6 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{index + 1}.</span>
        <span className="truncate">{row.name}</span>
      </label>
      <Button variant="ghost" size="icon-sm" aria-label={t("up")} disabled={index === 0} onClick={() => onMove(-1)}>
        <ArrowUpIcon />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label={t("down")} disabled={index === count - 1} onClick={() => onMove(1)}>
        <ArrowDownIcon />
      </Button>
    </div>
  )
}

/** Port of the old openSproutAITokenPopup(): pick and order the tokens the sprout AI chases. */
export function SproutTokenDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useStrings(strings)
  const { settings, patchLocal } = useSettings()
  const modelName = sproutTokenModelName(settings?.sprouts_ai_model)
  const allTokens = SPROUT_TOKENS_BY_MODEL[modelName]
  const [rows, setRows] = useState<TokenRow[]>([])
  const [saving, setSaving] = useState(false)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // Rebuild the list from the saved values each time the dialog opens.
  const [lastOpen, setLastOpen] = useState(false)
  if (open !== lastOpen) {
    setLastOpen(open)
    if (open) setRows(buildTokenRows(allTokens, settings?.sprouts_preferred_tokens, settings?.sprouts_ignored_tokens))
  }

  const move = (from: number, to: number) => {
    if (to < 0 || to >= rows.length) return
    setRows((r) => arrayMove(r, from, to))
  }
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = rows.findIndex((r) => r.name === active.id)
    const to = rows.findIndex((r) => r.name === over.id)
    if (from >= 0 && to >= 0) move(from, to)
  }
  const applyPreset = (preset: "field" | "all" | "clear") =>
    setRows(presetTokenRows(allTokens, preset, String(settings?.sprouts_field ?? "sunflower").toLowerCase()))

  const save = async () => {
    const { preferred, ignored } = tokenRowsToSettings(allTokens, rows)
    setSaving(true)
    try {
      await callPy("saveProfileSetting", "sprouts_preferred_tokens", preferred)
      await callPy("saveProfileSetting", "sprouts_ignored_tokens", ignored)
      patchLocal({ sprouts_preferred_tokens: preferred, sprouts_ignored_tokens: ignored })
      toast.success(t("saved"))
      onOpenChange(false)
    } catch (err) {
      toast.error(t("saveFailed", { error: String(err) }))
    } finally {
      setSaving(false)
    }
  }

  const enabledCount = rows.filter((r) => r.enabled).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("desc")}</DialogDescription>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">{t("model", { model: modelName })}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => applyPreset("field")}>
            {t("presetField")}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => applyPreset("all")}>
            {t("presetAll")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => applyPreset("clear")}>
            {t("presetClear")}
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">{t("enabledCount", { count: enabledCount })}</span>
        </div>
        <div className="-mr-2 min-h-0 flex-1 overflow-y-auto pr-2">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={rows.map((r) => r.name)} strategy={verticalListSortingStrategy}>
              <div className="grid gap-1.5">
                {rows.map((row, i) => (
                  <TokenRowItem
                    key={row.name}
                    row={row}
                    index={i}
                    count={rows.length}
                    t={t}
                    onToggle={(enabled) => setRows((r) => r.map((x) => (x.name === row.name ? { ...x, enabled } : x)))}
                    onMove={(delta) => move(i, i + delta)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={save} disabled={saving}>
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
