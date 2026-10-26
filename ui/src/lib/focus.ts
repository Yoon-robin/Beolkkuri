import { useEffect, useRef, type RefObject } from "react"

import type { PageId } from "@/lib/route"
import type { SectionDef } from "@/schema"

/** Where a setting lives: its page, the sub-tab inside that page, and the setting itself. */
export type FocusTarget = { page: PageId; tab?: string; settingId?: string }

let pending: FocusTarget | null = null
let pendingAt = 0
// a jump that never finds its row (or has no row) must not affect later visits
const fresh = () => (pending && Date.now() - pendingAt < 3000 ? pending : null)
const tabListeners = new Set<(target: FocusTarget) => void>()
// rows that are already on screen don't remount, so a jump to one of them pings it directly
const rowListeners = new Set<() => void>()

/** Open a page (and sub-tab), then scroll to and highlight one setting once it renders. */
export function goToTarget(target: FocusTarget) {
  pending = target
  pendingAt = Date.now()
  window.location.hash = `/${target.page}`
  // a page that is already open switches its sub-tab right away
  for (const listener of tabListeners) listener(target)
  for (const listener of rowListeners) listener()
}

/** Map a schema section to the page and sub-tab value that render it. */
export function locateSection(section: Pick<SectionDef, "tab" | "panel">): FocusTarget {
  const panel = section.panel.replace(/-tab$/, "")
  switch (section.tab) {
    case "config":
      return { page: "settings", tab: panel }
    case "boost":
      return { page: "boost", tab: panel === "boost-buffs" ? "buffs" : "tad" }
    case "tools":
      return { page: "tools", tab: panel.replace(/^tools-/, "") }
    case "gather":
      return { page: "gather" }
    case "collect":
    case "kill":
    case "quests":
      return { page: section.tab, tab: panel }
    default:
      return { page: "home" }
  }
}

/** Lets a page with sub-tabs follow search jumps: `useTabRequest("boost", setTab)`. */
export function useTabRequest(page: PageId, selectTab: (tab: string) => void) {
  const select = useRef(selectTab)
  select.current = selectTab

  useEffect(() => {
    const target = fresh()
    if (target?.page === page && target.tab) select.current(target.tab)
    const listener = (target: FocusTarget) => {
      if (target.page === page && target.tab) select.current(target.tab)
    }
    tabListeners.add(listener)
    return () => {
      tabListeners.delete(listener)
    }
  }, [page])
}

/**
 * Scrolls an element into view and flashes it when a search jump points at one of
 * `settingIds` (a setting row, or a section card standing in for its hidden rows).
 */
export function useFocusTarget(settingIds: string | readonly string[] | undefined, ref: RefObject<HTMLElement | null>) {
  const key = typeof settingIds === "string" ? settingIds : (settingIds ?? []).join("\n")

  useEffect(() => {
    if (!key) return
    const ids = key.split("\n")
    const wanted = () => {
      const id = fresh()?.settingId
      return id !== undefined && ids.includes(id) ? id : null
    }
    let timer = 0
    let waited = 0
    const show = () => {
      const id = wanted()
      const el = ref.current
      if (!id || !el) return
      // the search dialog locks page scrolling until it has finished closing
      if (document.body.hasAttribute("data-scroll-locked") && waited < 1500) {
        waited += 50
        timer = window.setTimeout(show, 50)
        return
      }
      pending = null
      el.scrollIntoView({ behavior: "smooth", block: "center" })
      el.classList.remove("rm-flash")
      void el.offsetWidth
      el.classList.add("rm-flash")
      const done = (e: AnimationEvent) => {
        if (e.target !== el || e.animationName !== "rm-flash") return
        el.classList.remove("rm-flash")
        el.removeEventListener("animationend", done)
      }
      el.addEventListener("animationend", done)
    }
    const reveal = () => {
      if (!wanted()) return
      window.clearTimeout(timer)
      waited = 0
      // wait for the page's enter animation so the element is at its final position;
      // `pending` is cleared only once it is shown (StrictMode runs effects twice)
      timer = window.setTimeout(show, 260)
    }
    reveal()
    rowListeners.add(reveal)
    return () => {
      rowListeners.delete(reveal)
      window.clearTimeout(timer)
    }
  }, [key, ref])
}
