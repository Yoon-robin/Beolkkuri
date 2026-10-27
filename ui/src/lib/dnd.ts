import type { Announcements, Modifier, ScreenReaderInstructions } from "@dnd-kit/core"
import { useCallback, useLayoutEffect, useMemo, useRef } from "react"

import { useI18n } from "@/i18n"

/** Sortable lists here are single columns: keep the dragged row on its track. */
export const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 })

/** Shared look for the row being dragged in a sortable list. */
export const DRAGGING_ROW = "relative z-10 shadow-lg ring-1 ring-primary"

/** Attribute that marks a row for {@link useReorderAnimation}. */
export const REORDER_ATTR = "data-reorder-id"

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

/**
 * Put keyboard focus back on the button that moved a row. React re-inserts some rows
 * when the order changes, and a focused element that leaves the document loses focus;
 * a button that is now disabled (moved to the first or last place) hands it to the
 * nearest enabled button in the same row.
 */
function restoreFocus(el: HTMLElement | null) {
  if (!el?.isConnected) return
  if (!el.matches(":disabled")) {
    if (document.activeElement !== el) el.focus({ preventScroll: true })
    return
  }
  // a button disabled this render still counts as focused until the browser's next paint
  const buttons = [...(el.closest(`[${REORDER_ATTR}]`)?.querySelectorAll<HTMLElement>("button") ?? [])]
  const at = buttons.indexOf(el)
  const after = buttons.slice(at + 1).find((b) => !b.matches(":disabled"))
  const before = buttons.slice(0, at).reverse().find((b) => !b.matches(":disabled"))
  ;(after ?? before)?.focus({ preventScroll: true })
}

/**
 * Slide rows to their new place when a list is reordered by a button (up/down, to top),
 * instead of letting them jump, and keep keyboard focus on that button. Drag and drop
 * already animates itself, so only moves announced with `capture()` right before the
 * state change are animated.
 *
 * Put `ref` on the list and `{ [REORDER_ATTR]: id }` on every row; pass the current order.
 */
export function useReorderAnimation<T extends HTMLElement = HTMLElement>(order: readonly string[]) {
  const ref = useRef<T>(null)
  const before = useRef<{ at: number; tops: Map<string, number> | null; focused: HTMLElement | null } | null>(null)
  const key = order.join("\u0001")

  const capture = useCallback(() => {
    const root = ref.current
    if (!root) return
    const active = document.activeElement
    const focused = active instanceof HTMLElement && root.contains(active) ? active : null
    let tops: Map<string, number> | null = null
    if (!reducedMotion()) {
      tops = new Map()
      root.querySelectorAll<HTMLElement>(`[${REORDER_ATTR}]`).forEach((el) => {
        tops!.set(el.getAttribute(REORDER_ATTR) ?? "", el.getBoundingClientRect().top)
      })
    }
    before.current = { at: performance.now(), tops, focused }
  }, [])

  useLayoutEffect(() => {
    const captured = before.current
    const root = ref.current
    before.current = null
    // a capture whose move turned out to be a no-op must not animate a later drag
    if (!captured || !root || performance.now() - captured.at > 1000) return
    restoreFocus(captured.focused)
    const { tops } = captured
    if (!tops) return
    root.querySelectorAll<HTMLElement>(`[${REORDER_ATTR}]`).forEach((el) => {
      const prev = tops.get(el.getAttribute(REORDER_ATTR) ?? "")
      if (prev === undefined) return
      const dy = prev - el.getBoundingClientRect().top
      if (Math.abs(dy) < 1) return
      // long jumps (to top / to bottom) get a little more time so the eye can follow
      const duration = Math.min(420, 200 + Math.abs(dy) * 0.25)
      el.animate([{ transform: `translateY(${dy}px)` }, { transform: "translateY(0)" }], {
        duration,
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      })
    })
  }, [key])

  return { ref, capture }
}

const A11Y = {
  ko: {
    instructions:
      "스페이스바를 누르면 항목을 집어요. 집은 동안 방향키로 옮기고, 스페이스바를 다시 누르면 내려놓아요. Esc를 누르면 취소돼요.",
    start: (id: string) => `${id} 항목을 집었어요.`,
    over: (id: string, over: string) => `${id} 항목이 ${over} 자리로 옮겨졌어요.`,
    outside: (id: string) => `${id} 항목이 목록 밖에 있어요.`,
    end: (id: string, over: string) => `${id} 항목을 ${over} 자리에 내려놓았어요.`,
    dropOutside: (id: string) => `${id} 항목을 내려놓았어요.`,
    cancel: (id: string) => `옮기기를 취소했어요. ${id} 항목은 그대로예요.`,
  },
  en: {
    instructions:
      "To pick up an item, press the space bar. While dragging, use the arrow keys to move it. Press space again to drop it, or Escape to cancel.",
    start: (id: string) => `Picked up ${id}.`,
    over: (id: string, over: string) => `${id} was moved over ${over}.`,
    outside: (id: string) => `${id} is no longer over the list.`,
    end: (id: string, over: string) => `${id} was dropped over ${over}.`,
    dropOutside: (id: string) => `${id} was dropped.`,
    cancel: (id: string) => `Moving was cancelled. ${id} stayed where it was.`,
  },
}

/** Screen-reader text for a DndContext in the current UI language (dnd-kit only ships English). */
export function useDndAccessibility(): { screenReaderInstructions: ScreenReaderInstructions; announcements: Announcements } {
  const { lang } = useI18n()
  return useMemo(() => {
    const a = A11Y[lang]
    return {
      screenReaderInstructions: { draggable: a.instructions },
      announcements: {
        onDragStart: ({ active }) => a.start(String(active.id)),
        onDragOver: ({ active, over }) => (over ? a.over(String(active.id), String(over.id)) : a.outside(String(active.id))),
        onDragEnd: ({ active, over }) => (over ? a.end(String(active.id), String(over.id)) : a.dropOutside(String(active.id))),
        onDragCancel: ({ active }) => a.cancel(String(active.id)),
      },
    }
  }, [lang])
}
