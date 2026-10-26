import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ChevronDownIcon, ChevronUpIcon, GripVerticalIcon, Loader2Icon } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useI18n, useStrings } from "@/i18n"
import { callPy } from "@/lib/py"
import { cn } from "@/lib/utils"

import { tokenState } from "./data"
import { strings } from "./strings"

type Token = { name: string; enabled: boolean }
type Ranking = { preferred_tokens?: string; ignored_tokens?: string }

function TokenRow({
  token,
  index,
  count,
  onToggle,
  onMove,
}: {
  token: Token
  index: number
  count: number
  onToggle: (on: boolean) => void
  onMove: (delta: number) => void
}) {
  const ts = useStrings(strings)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: token.name })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 border-b border-border/60 bg-popover py-1.5 pr-1",
        isDragging && "relative z-10 rounded-md opacity-80 shadow-md",
        !token.enabled && "text-muted-foreground",
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted active:cursor-grabbing"
        aria-label={ts("tokensDrag")}
        title={ts("tokensDrag")}
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon className="size-4" />
      </button>
      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
        <Checkbox checked={token.enabled} onCheckedChange={(v) => onToggle(v === true)} />
        <span className="w-7 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{index + 1}.</span>
        <span className="truncate">{token.name}</span>
      </label>
      <Button variant="ghost" size="icon-sm" aria-label={ts("tokensUp")} title={ts("tokensUp")} disabled={index === 0} onClick={() => onMove(-1)}>
        <ChevronUpIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={ts("tokensDown")}
        title={ts("tokensDown")}
        disabled={index === count - 1}
        onClick={() => onMove(1)}
      >
        <ChevronDownIcon />
      </Button>
    </div>
  )
}

/** "Preferred Tokens" popup: per field + detection model ranking for AI Gathering. */
export function TokenDialog({
  open,
  onOpenChange,
  field,
  model,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  field: string
  /** "Standard" | "Light" | "Mini" */
  model: string
}) {
  const { t } = useI18n()
  const ts = useStrings(strings)
  const [tokens, setTokens] = useState<Token[] | null>(null)
  const [saving, setSaving] = useState(false)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => {
    if (!open || !field) return
    let cancelled = false
    setTokens(null)
    callPy<Ranking>("loadRobinAITokenRanking", field, model)
      .then((r) => !cancelled && setTokens(tokenState(model, r?.preferred_tokens ?? "", r?.ignored_tokens ?? "")))
      .catch((err) => {
        console.error(err)
        if (!cancelled) setTokens(tokenState(model, "", ""))
        toast.error(ts("tokensFailed"))
      })
    return () => {
      cancelled = true
    }
  }, [open, field, model, ts])

  const move = (from: number, to: number) => setTokens((list) => (list && to >= 0 && to < list.length ? arrayMove(list, from, to) : list))
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!tokens || !over || active.id === over.id) return
    move(
      tokens.findIndex((x) => x.name === active.id),
      tokens.findIndex((x) => x.name === over.id),
    )
  }
  const setAll = (enabled: boolean) => setTokens((list) => list?.map((x) => ({ ...x, enabled })) ?? list)

  const save = async () => {
    if (!tokens || !field) return
    setSaving(true)
    try {
      await callPy("saveRobinAITokenRanking", field, {
        preferred_tokens: tokens.filter((x) => x.enabled).map((x) => x.name).join(","),
        ignored_tokens: tokens.filter((x) => !x.enabled).map((x) => x.name).join(","),
      }, model)
      toast.success(ts("tokensSaved"))
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      toast.error(ts("tokensFailed"))
    } finally {
      setSaving(false)
    }
  }

  const modelLabel = ts(`model.${model}` as "model.Standard")
  const enabled = tokens?.filter((x) => x.enabled).length ?? 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] flex-col sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{ts("tokensTitle")}</DialogTitle>
          <DialogDescription className="space-y-1">
            <span className="block font-medium text-foreground">{ts("tokensModel", { model: modelLabel })}</span>
            <span className="block">{ts("tokensHelp")}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{tokens ? ts("tokensCount", { count: enabled, total: tokens.length }) : ""}</span>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" onClick={() => setAll(true)} disabled={!tokens}>
              {ts("tokensAllOn")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAll(false)} disabled={!tokens}>
              {ts("tokensAllOff")}
            </Button>
          </div>
        </div>
        <div className="-mx-1 min-h-40 flex-1 overflow-y-auto px-1">
          {!tokens ? (
            <div className="flex h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" />
              {t("common.loading")}
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={tokens.map((x) => x.name)} strategy={verticalListSortingStrategy}>
                {tokens.map((token, i) => (
                  <TokenRow
                    key={token.name}
                    token={token}
                    index={i}
                    count={tokens.length}
                    onToggle={(on) => setTokens((list) => list?.map((x) => (x.name === token.name ? { ...x, enabled: on } : x)) ?? list)}
                    onMove={(delta) => move(i, i + delta)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={save} disabled={!tokens || saving}>
            {saving && <Loader2Icon className="animate-spin" />}
            {ts("tokensSave")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
