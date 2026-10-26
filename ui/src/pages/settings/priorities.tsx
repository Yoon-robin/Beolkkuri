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
import { ArrowDownToLineIcon, ArrowUpToLineIcon, GripVerticalIcon, LockIcon, RotateCcwIcon, SearchIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useI18n, useStrings, type PageStrings } from "@/i18n"
import { callPy } from "@/lib/py"
import { RichText, plainText } from "@/lib/rich-text"
import { cn } from "@/lib/utils"
import { useSettings } from "@/state/settings"

import { isLockedTask, isTaskEnabled, lockStateOf, mergeWithLocks, taskCategory, taskLabel, type TaskCategory } from "./priority-order"
import { ConfirmDialog } from "./shared"

const strings: PageStrings<
  | "title"
  | "desc"
  | "search"
  | "reset"
  | "resetTitle"
  | "resetDesc"
  | "resetDone"
  | "resetFailed"
  | "resetError"
  | "empty"
  | "noMatch"
  | "drag"
  | "toTop"
  | "toBottom"
  | "off"
  | "lockedQuests"
  | "lockedPlanters"
  | "lockedDetail"
  | "searchDragHint"
  | "cat.gather"
  | "cat.collect"
  | "cat.kill"
  | "cat.quest"
  | "cat.special"
> = {
  ko: {
    title: "작업 우선순위",
    desc: "목록을 끌어서 순서를 바꿔요. 위에 있을수록 먼저 해요. 흐리게 보이는 작업은 지금 꺼져 있지만 순서는 미리 바꿔 둘 수 있어요.",
    search: "작업 찾기 (예: 소나무, 디스펜서, 사냥)",
    reset: "기본 순서로",
    resetTitle: "우선순위를 기본 순서로 되돌릴까요?",
    resetDesc: "지금 정해 둔 순서는 사라지고 되돌릴 수 없어요.",
    resetDone: "기본 순서로 되돌렸어요.",
    resetFailed: "기본 순서를 찾지 못해서 되돌리지 못했어요.",
    resetError: "우선순위를 되돌리다가 문제가 생겼어요.",
    empty: "아직 저장된 우선순위가 없어요. '기본 순서로'를 눌러 목록을 만들어 보세요.",
    noMatch: "찾는 작업이 없어요.",
    drag: "끌어서 순서 바꾸기",
    toTop: "맨 위로",
    toBottom: "맨 아래로",
    off: "꺼짐",
    lockedQuests: "퀘스트",
    lockedPlanters: "플랜터",
    lockedDetail: "매크로가 알아서 챙겨요. 순서는 상관없어요.",
    searchDragHint: "검색 중에도 끌어서 옮길 수 있어요. 보이는 작업끼리 자리를 바꿔요.",
    "cat.gather": "채집",
    "cat.collect": "수집",
    "cat.kill": "사냥",
    "cat.quest": "퀘스트",
    "cat.special": "특수",
  },
  en: {
    title: "Task priority order",
    desc: "Drag tasks to reorder them. Tasks near the top run sooner. Greyed-out tasks are currently off, but you can still arrange them.",
    search: "Find a task (e.g. pine, dispenser, kill)",
    reset: "Reset to default",
    resetTitle: "Reset task priorities to the default order?",
    resetDesc: "Your current order will be replaced. This can't be undone.",
    resetDone: "Task priorities reset to default.",
    resetFailed: "Couldn't reset: the default order is missing.",
    resetError: "Something went wrong while resetting task priorities.",
    empty: "No saved priority order yet. Press 'Reset to default' to create one.",
    noMatch: "No tasks match your search.",
    drag: "Drag to reorder",
    toTop: "Move to top",
    toBottom: "Move to bottom",
    off: "Off",
    lockedQuests: "Quests",
    lockedPlanters: "Planters",
    lockedDetail: "Handled automatically, so their order doesn't matter.",
    searchDragHint: "You can still drag while searching; visible tasks swap places.",
    "cat.gather": "Gather",
    "cat.collect": "Collect",
    "cat.kill": "Kill",
    "cat.quest": "Quest",
    "cat.special": "Special",
  },
}

const QUEST_TOKEN = "\u0000quest"
const PLANTER_TOKEN = "\u0000planter"

const CATEGORY_STYLE: Record<TaskCategory, string> = {
  gather: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  collect: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  kill: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  quest: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  special: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
}

export function PrioritySection() {
  const t = useStrings(strings)
  const { lang, t: tc } = useI18n()
  const { settings, saveProfile, refresh } = useSettings()
  const [query, setQuery] = useState("")
  const [confirmReset, setConfirmReset] = useState(false)

  const rawOrder = settings?.task_priority_order
  const lock = useMemo(() => lockStateOf(Array.isArray(rawOrder) ? rawOrder.map(String) : []), [rawOrder])
  const unlocked = useMemo(() => lock.order.filter((id) => !isLockedTask(id)), [lock])
  const rows = useMemo(() => mergeWithLocks(unlocked, lock, [QUEST_TOKEN], [PLANTER_TOKEN]), [unlocked, lock])

  const term = query.toLowerCase().trim()
  const matches = (text: string) => !term || text.toLowerCase().includes(term)
  const searchText = (id: string) =>
    [plainText(taskLabel(id, "ko")), plainText(taskLabel(id, "en")), t(`cat.${taskCategory(id)}`), id.replaceAll("_", " ")].join(" ")
  const visibleIds = unlocked.filter((id) => matches(searchText(id)))
  const visibleSet = new Set(visibleIds)
  const lockedHeaderText = (token: string) => `${token === QUEST_TOKEN ? t("lockedQuests") : t("lockedPlanters")} ${t("lockedDetail")}`

  const save = (nextUnlocked: string[]) => {
    void saveProfile("task_priority_order", mergeWithLocks(nextUnlocked, lock, lock.questIds, ["planters"]))
  }

  const move = (id: string, where: "top" | "bottom") => {
    const rest = unlocked.filter((x) => x !== id)
    save(where === "top" ? [id, ...rest] : [...rest, id])
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = unlocked.indexOf(String(active.id))
    const to = unlocked.indexOf(String(over.id))
    if (from < 0 || to < 0) return
    save(arrayMove(unlocked, from, to))
  }

  const reset = async () => {
    try {
      const ok = await callPy<boolean>("resetTaskPrioritiesToDefault")
      if (!ok) {
        toast.error(t("resetFailed"))
        return
      }
      setQuery("")
      await refresh()
      toast.success(t("resetDone"))
    } catch (err) {
      console.error("[settings] resetTaskPrioritiesToDefault", err)
      toast.error(t("resetError"))
    }
  }

  const s = settings ?? {}
  let position = 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
        <CardDescription>{t("desc")}</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" onClick={() => setConfirmReset(true)}>
            <RotateCcwIcon />
            {t("reset")}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative max-w-md">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search")}
            className="pl-8"
            aria-label={tc("common.search")}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        {term && visibleIds.length > 0 && <p className="text-xs text-muted-foreground">{t("searchDragHint")}</p>}

        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={visibleIds} strategy={verticalListSortingStrategy}>
              <ol className="space-y-1.5">
                {rows.map((id) => {
                  if (id === QUEST_TOKEN || id === PLANTER_TOKEN) {
                    if (!matches(lockedHeaderText(id))) return null
                    return <LockedGroup key={id} title={id === QUEST_TOKEN ? t("lockedQuests") : t("lockedPlanters")} detail={t("lockedDetail")} />
                  }
                  position += 1
                  if (!visibleSet.has(id)) return null
                  const category = taskCategory(id)
                  return (
                    <SortableTask
                      key={id}
                      id={id}
                      position={position}
                      label={taskLabel(id, lang)}
                      category={t(`cat.${category}`)}
                      categoryClass={CATEGORY_STYLE[category]}
                      enabled={isTaskEnabled(id, s)}
                      offLabel={t("off")}
                      dragLabel={t("drag")}
                      topLabel={t("toTop")}
                      bottomLabel={t("toBottom")}
                      onTop={() => move(id, "top")}
                      onBottom={() => move(id, "bottom")}
                    />
                  )
                })}
              </ol>
            </SortableContext>
          </DndContext>
        )}
        {rows.length > 0 && term && visibleIds.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">{t("noMatch")}</p>}
      </CardContent>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title={t("resetTitle")}
        description={t("resetDesc")}
        confirmLabel={t("reset")}
        destructive
        onConfirm={() => void reset()}
      />
    </Card>
  )
}

function LockedGroup({ title, detail }: { title: string; detail: string }) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-dashed bg-muted/40 px-3 py-2 text-sm">
      <LockIcon className="size-4 shrink-0 text-muted-foreground" />
      <span className="font-medium">{title}</span>
      <span className="text-xs text-muted-foreground">{detail}</span>
    </li>
  )
}

function SortableTask({
  id,
  position,
  label,
  category,
  categoryClass,
  enabled,
  offLabel,
  dragLabel,
  topLabel,
  bottomLabel,
  onTop,
  onBottom,
}: {
  id: string
  position: number
  label: string
  category: string
  categoryClass: string
  enabled: boolean
  offLabel: string
  dragLabel: string
  topLabel: string
  bottomLabel: string
  onTop: () => void
  onBottom: () => void
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group flex items-center gap-2 rounded-lg border bg-card px-2 py-1.5 text-sm",
        isDragging && "relative z-10 shadow-lg ring-1 ring-primary",
        !enabled && !isDragging && "opacity-55",
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="flex size-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted active:cursor-grabbing"
        aria-label={`${dragLabel}: ${label.replace(/<[^>]*>/g, "")}`}
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon className="size-4" />
      </button>
      <span className="w-6 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{position}</span>
      <Badge variant="secondary" className={cn("w-14 shrink-0 justify-center", categoryClass)}>
        {category}
      </Badge>
      <RichText text={label} className="min-w-0 flex-1 truncate" />
      {!enabled && <span className="shrink-0 text-xs text-muted-foreground">{offLabel}</span>}
      <div className="flex shrink-0 items-center gap-0.5 opacity-60 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={topLabel} onClick={onTop}>
              <ArrowUpToLineIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{topLabel}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={bottomLabel} onClick={onBottom}>
              <ArrowDownToLineIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{bottomLabel}</TooltipContent>
        </Tooltip>
      </div>
    </li>
  )
}
